/**
 * ============================================================================
 * SYNC STATIC weddingConfig.js TO FIRESTORE (config/wedding)
 * ============================================================================
 * Runs during GitHub Actions deployment on push to `main`.
 * - Authenticates via FIREBASE_SERVICE_ACCOUNT (GitHub Secret, never in frontend).
 * - Compares the deterministic `_staticConfigHash` of `src/config/weddingConfig.js`
 *   against the existing Firestore `config/wedding` document.
 * - If `weddingConfig.js` changed (or `config/wedding` does not exist yet), updates
 *   Firestore `config/wedding` with the new configuration and `_staticConfigHash`.
 * - If `weddingConfig.js` has NOT changed, preserves live Firestore edits made via Admin.
 * - Uses Node 22 built-in `crypto` and `fetch` (zero extra dependencies).
 * ============================================================================
 */

import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Converts a JS value to a Firestore REST API Value object.
 */
export const toFirestoreValue = (value) => {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
  }
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
};

/**
 * Converts a plain JS object into Firestore REST API document `fields`.
 */
export const toFirestoreFields = (obj) => {
  const fields = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined) continue;
    fields[k] = toFirestoreValue(v);
  }
  return fields;
};

const base64UrlEncode = (input) => {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const getGoogleAccessToken = async (serviceAccount) => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = base64UrlEncode(signer.sign(serviceAccount.private_key));
  const assertion = `${signingInput}.${signature}`;

  const tokenUri = serviceAccount.token_uri || 'https://oauth2.googleapis.com/token';
  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OAuth token exchange failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.access_token;
};

const runSync = async () => {
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
  const projectIdEnv = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';

  if (!saRaw.trim()) {
    console.log(
      'ℹ️ [FirestoreSync] FIREBASE_SERVICE_ACCOUNT secret not configured; skipping CI sync (client reload sync will update Firestore when site reloads).'
    );
    return;
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(saRaw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
  }

  const projectId = (projectIdEnv || serviceAccount.project_id || '').trim();
  if (!projectId) {
    throw new Error('Missing Firebase project ID (set FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID)');
  }

  // Provide minimal browser stubs so configManager can import cleanly in Node
  globalThis.localStorage = globalThis.localStorage || {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  globalThis.document = globalThis.document || {
    documentElement: { setAttribute: () => {}, getAttribute: () => null, classList: { add: () => {}, remove: () => {} } },
    body: { setAttribute: () => {} },
    head: { appendChild: () => {} },
    getElementById: () => null,
  };

  const { mergeConfig, getStaticConfigHash } = await import(
    'file:///' + path.join(projectRoot, 'src/utils/configManager.js').replace(/\\/g, '/')
  );

  const staticHash = getStaticConfigHash();
  const normalizedConfig = JSON.parse(
    JSON.stringify({
      ...mergeConfig(null),
      _staticConfigHash: staticHash,
    })
  );

  const accessToken = await getGoogleAccessToken(serviceAccount);
  const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/config/wedding`;

  // Check existing Firestore document hash
  const getRes = await fetch(docUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (getRes.ok) {
    const existingDoc = await getRes.json();
    const existingHash = existingDoc?.fields?._staticConfigHash?.stringValue;
    if (existingHash === staticHash) {
      console.log(
        `✅ [FirestoreSync] weddingConfig.js unchanged (hash ${staticHash}) — preserving existing Firestore config/wedding.`
      );
      return;
    }
    console.log(
      `🔄 [FirestoreSync] weddingConfig.js changed (${existingHash || 'none'} -> ${staticHash}) — updating Firestore config/wedding...`
    );
  } else if (getRes.status === 404) {
    console.log(
      `🆕 [FirestoreSync] Firestore config/wedding not found — creating from weddingConfig.js (hash ${staticHash})...`
    );
  } else {
    const errText = await getRes.text();
    throw new Error(`Failed to read Firestore config/wedding (${getRes.status}): ${errText}`);
  }

  const fields = toFirestoreFields(normalizedConfig);
  fields.updatedAt = { timestampValue: new Date().toISOString() };

  const patchRes = await fetch(docUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!patchRes.ok) {
    const errText = await patchRes.text();
    throw new Error(`Failed to update Firestore config/wedding (${patchRes.status}): ${errText}`);
  }

  console.log(`✅ [FirestoreSync] Successfully synced weddingConfig.js to Firestore (${projectId}/config/wedding).`);
};

// Run CLI only when executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runSync().catch((err) => {
    console.error('❌ [FirestoreSync] Error:', err.message || err);
    process.exit(1);
  });
}
