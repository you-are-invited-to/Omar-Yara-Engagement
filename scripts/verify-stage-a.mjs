/**
 * ============================================================================
 * STAGE A (PHASES 1–5 + GATE 10A) AUTOMATED VERIFICATION & ISOLATION TEST SUITE
 * ============================================================================
 * Executes:
 *   1. Phase 1 Security Tests (sanitizeUrl, SVG upload blocking, OTP removal, bundle scan)
 *   2. Phase 2 & 4 Customer Isolation Tests (ISO-TEST-01: Customer A vs Customer B, PII protection, firestore.rules)
 *   3. Phase 3 Multiple Event Types & 5-Theme Engine Tests (All 10 event types + backward compatibility)
 *   4. Phase 5 Role Separation Tests (Customer Dashboard vs Owner Admin boundary)
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const bundleOnly = process.argv.includes('--bundle-only');

// ─── Browser Globals Mock for Node Testing ────────────────────
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};

const domAttributes = new Map();
globalThis.document = {
  documentElement: {
    setAttribute: (k, v) => domAttributes.set(k, v),
    getAttribute: (k) => domAttributes.get(k),
    classList: { add: () => { }, remove: () => { } },
  },
  body: { setAttribute: () => { } },
  head: { appendChild: () => { } },
  getElementById: () => null,
  createElement: () => ({}),
  querySelector: () => null,
};

globalThis.window = {
  dispatchEvent: () => { },
  addEventListener: () => { },
  removeEventListener: () => { },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};

console.log('======================================================================');
console.log('🚀 VERIFYING STAGE A (PRE-SAAS SELLABLE MVP: PHASES 1–5 + GATE 10A)');
console.log('======================================================================\n');

// ─── 1. Production Bundle Secret Scan (SEC-001, SEC-002, SEC-004) ───
const distAssetsDir = path.join(projectRoot, 'dist', 'assets');
if (fs.existsSync(distAssetsDir)) {
  const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
  assert.ok(jsFiles.length > 0, 'dist/assets should contain built JS chunks');

  const forbiddenLiterals = [
    'wedding2026',
    'wedding_admin_2fa_auth',
    'wedding_admin_otp_session',
    'x-api-secret',
    'BEGIN PRIVATE KEY',
    'FIREBASE_SERVICE_ACCOUNT',
    'private_key_id',
    'ghp_',
    'github_pat_',
  ];

  for (const file of jsFiles) {
    const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
    for (const forbidden of forbiddenLiterals) {
      assert.ok(
        !content.includes(forbidden),
        `SECURITY FAILURE: Forbidden secret/bypass literal "${forbidden}" found in bundle ${file}`
      );
    }
  }
  console.log(`✅ [Phase 1 / Gate 10A] Production bundle scan passed across ${jsFiles.length} JS chunks (0 leaked secrets).`);
}

if (bundleOnly) {
  process.exit(0);
}

// Import application modules
const {
  sanitizeUrl,
  validateImageFile,
  isSafeImageUrl,
  setCustomerNamespaceOverride,
  getCustomerNamespace,
  getScopedStorageKey,
} = await import('file:///' + path.join(projectRoot, 'src/utils/security.js').replace(/\\/g, '/'));

const { generateOTP, verifyOTP } = await import(
  'file:///' + path.join(projectRoot, 'src/services/mail/otpService.js').replace(/\\/g, '/')
);

const { EVENT_TYPES, isValidEventTypeId, getEventTypeById } = await import(
  'file:///' + path.join(projectRoot, 'src/config/eventTypesConfig.js').replace(/\\/g, '/')
);

const { WEDDING_THEMES, isValidThemeId } = await import(
  'file:///' + path.join(projectRoot, 'src/config/themesConfig.js').replace(/\\/g, '/')
);

const { default: baseWeddingConfig } = await import(
  'file:///' + path.join(projectRoot, 'src/config/weddingConfig.js').replace(/\\/g, '/')
);

const {
  buildUpdatedWeddingTime,
  syncAgendaWithStartTime,
  getEventStartTime24h,
  createNextAgendaItem,
} = await import('file:///' + path.join(projectRoot, 'src/utils/agendaUtils.js').replace(/\\/g, '/'));

const {
  WEDDING_LADIES_BROWN_SHADES,
  resolveDressCodeForDisplay,
} = await import('file:///' + path.join(projectRoot, 'src/config/dressCodeConfig.js').replace(/\\/g, '/'));

const {
  mergeConfig,
  getActiveConfig,
  saveActiveConfig,
  resetActiveConfig,
  getStaticConfigHash,
  syncConfigWithFirestore,
} = await import('file:///' + path.join(projectRoot, 'src/utils/configManager.js').replace(/\\/g, '/'));

const { toFirestoreFields } = await import(
  'file:///' + path.join(projectRoot, 'scripts/sync-wedding-config-to-firestore.mjs').replace(/\\/g, '/')
);

const mockService = await import(
  'file:///' + path.join(projectRoot, 'src/services/mock/mockService.js').replace(/\\/g, '/')
);

// ─── 2. Phase 1 Security Unit Tests (SEC-002, SEC-006, SEC-007) ──────
assert.equal(sanitizeUrl('https://maps.google.com/test'), 'https://maps.google.com/test');
assert.equal(sanitizeUrl('http://example.com/gift'), 'http://example.com/gift');
assert.equal(sanitizeUrl('/couple-illustration.png'), '/couple-illustration.png');
assert.equal(sanitizeUrl('#rsvp'), '#rsvp');
assert.equal(sanitizeUrl('javascript:alert(1)', ''), '', 'Must block javascript: XSS');
assert.equal(sanitizeUrl('JAVASCRIPT:alert(document.cookie)', ''), '', 'Must block uppercase JAVASCRIPT:');
assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>', ''), '', 'Must block data:text/html');
assert.equal(sanitizeUrl('//evil.example.com/payload', ''), '', 'Must block protocol-relative URLs');

assert.equal(
  validateImageFile({ name: 'photo.jpg', type: 'image/jpeg', size: 500 * 1024 }).valid,
  true
);
assert.equal(
  validateImageFile({ name: 'attack.svg', type: 'image/svg+xml', size: 1024 }).valid,
  false,
  'Must block SVG files (SEC-007)'
);
assert.equal(
  validateImageFile({ name: 'huge.png', type: 'image/png', size: 5 * 1024 * 1024 }).valid,
  false,
  'Must block oversized >2MB files (SEC-007)'
);
assert.equal(isSafeImageUrl('data:image/svg+xml;base64,PHN2Zz4='), false, 'Must block SVG data URIs');
assert.equal(isSafeImageUrl('data:image/png;base64,iVBORw0KGgo='), true, 'Must allow raster PNG data URIs');

assert.throws(() => generateOTP(), /deprecated/i, 'Client-side OTP must be disabled (SEC-002)');
assert.equal(verifyOTP('123456').valid, false);
console.log('✅ [Phase 1] Security unit tests passed (sanitizeUrl XSS guard, SVG upload blocker, client OTP disabled).');

// ─── 3. Phase 2 & Phase 4 Customer Isolation Tests (ISO-TEST-01) ─────
globalThis.localStorage.clear();

// Provision Customer A
setCustomerNamespaceOverride('invite-customer-a');
assert.equal(getCustomerNamespace(), 'invite-customer-a');
assert.equal(getScopedStorageKey('wedding_rsvps'), 'wedding_rsvps__invite-customer-a');

saveActiveConfig({
  eventType: 'wedding',
  theme: 'elegant-luxury',
  groom: { name: 'أحمد (العميل أ)', nameEn: 'Ahmed (Customer A)' },
  bride: { name: 'سارة (العميل أ)', nameEn: 'Sara (Customer A)' },
});
await mockService.submitRSVP({
  name: 'ضيف العميل أ',
  phone: '01011111111',
  attendance: 'will_attend',
  guestsCount: 2,
  message: 'مبروك لأحمد وسارة من ضيف أ!',
});

// Provision Customer B
setCustomerNamespaceOverride('invite-customer-b');
assert.equal(getCustomerNamespace(), 'invite-customer-b');
assert.equal(getScopedStorageKey('wedding_rsvps'), 'wedding_rsvps__invite-customer-b');

saveActiveConfig({
  eventType: 'conference',
  theme: 'minimalist-modern',
  groom: { name: 'قمة التقنية (العميل ب)', nameEn: 'Tech Summit (Customer B)' },
});
await mockService.submitRSVP({
  name: 'ضيف العميل ب',
  phone: '01222222222',
  attendance: 'will_attend',
  guestsCount: 0,
  message: 'بالتوفيق في مؤتمر التقنية من ضيف ب!',
});

// Verify Customer A sees ONLY Customer A's config, RSVPs, and wishes
setCustomerNamespaceOverride('invite-customer-a');
const cfgA = getActiveConfig();
const guestsA = await mockService.getGuests();
const wishesA = await mockService.getWishes();
assert.equal(cfgA.theme, 'elegant-luxury');
assert.equal(cfgA.groom.name, 'أحمد (العميل أ)');
assert.equal(guestsA.length, 1, 'Customer A must have exactly 1 RSVP');
assert.equal(guestsA[0].name, 'ضيف العميل أ');
assert.equal(guestsA[0].phone, '01011111111');
assert.equal(wishesA.length, 1, 'Customer A must have exactly 1 public wish');
assert.equal(wishesA[0].message, 'مبروك لأحمد وسارة من ضيف أ!');
assert.equal('phone' in wishesA[0], false, 'SEC-005: Public wishes must NEVER expose guest phone numbers');

// Verify Customer B sees ONLY Customer B's config, RSVPs, and wishes
setCustomerNamespaceOverride('invite-customer-b');
const cfgB = getActiveConfig();
const guestsB = await mockService.getGuests();
const wishesB = await mockService.getWishes();
assert.equal(cfgB.eventType, 'conference');
assert.equal(cfgB.theme, 'minimalist-modern');
assert.equal(guestsB.length, 1, 'Customer B must have exactly 1 RSVP');
assert.equal(guestsB[0].name, 'ضيف العميل ب');
assert.equal(wishesB.length, 1);
assert.equal(wishesB[0].message, 'بالتوفيق في مؤتمر التقنية من ضيف ب!');
assert.equal('phone' in wishesB[0], false, 'SEC-005: Public wishes must NEVER expose guest phone numbers');

// Verify deleting a guest in Customer A does not affect Customer B
setCustomerNamespaceOverride('invite-customer-a');
await mockService.deleteGuest(guestsA[0].id);
assert.equal((await mockService.getGuests()).length, 0, 'Customer A RSVP deleted');
setCustomerNamespaceOverride('invite-customer-b');
assert.equal((await mockService.getGuests()).length, 1, 'Customer B RSVP remains untouched');

// Reset namespace override
setCustomerNamespaceOverride(null);

// Verify firestore.rules & .gitattributes exist and enforce boundaries
const rulesContent = fs.readFileSync(path.join(projectRoot, 'firestore.rules'), 'utf8');
assert.ok(rulesContent.includes('match /rsvps/{document}'), 'firestore.rules must define /rsvps rules');
assert.ok(rulesContent.includes('allow read, update, delete: if isAuthenticatedCustomer()'), 'rsvps read/delete must require auth');
assert.ok(rulesContent.includes('match /wishes/{document}'), 'firestore.rules must define /wishes rules');
assert.ok(rulesContent.includes("!('phone' in data)"), 'wishes rule must forbid phone field');

const gitattributesContent = fs.readFileSync(path.join(projectRoot, '.gitattributes'), 'utf8');
assert.ok(gitattributesContent.includes('src/config/weddingConfig.js merge=ours'), '.gitattributes must protect weddingConfig.js');
console.log('✅ [Phase 2 & Phase 4] Customer Isolation Suite (ISO-TEST-01) passed (Customer A vs Customer B 100% isolated, PII protected).');

// ─── 4. Phase 3 Multiple Event Types & 5-Theme Engine Tests ──────────
const expectedEventTypes = [
  'wedding',
  'engagement',
  'birthday',
  'private_party',
  'graduation',
  'baby_shower',
  'anniversary',
  'corporate',
  'conference',
  'custom',
];
assert.equal(EVENT_TYPES.length, 10, 'Must support all 10 commercial event types');
for (const etId of expectedEventTypes) {
  assert.ok(isValidEventTypeId(etId), `Event type ${etId} must be valid`);
  const mergedEt = mergeConfig({ eventType: etId, groom: { name: 'اختبار', nameEn: 'Test' } });
  assert.equal(mergedEt.eventType, etId);
  assert.equal(mergedEt.eventMeta.id, etId);
}
assert.equal(WEDDING_THEMES.length, 6, 'Must include all 6 visual themes (including golden-theme)');
assert.ok(isValidThemeId('golden-theme'), 'golden-theme must be registered in WEDDING_THEMES');
for (const th of WEDDING_THEMES) {
  assert.ok(isValidThemeId(th.id));
}

// Verify reset restores active weddingConfig.js defaults cleanly
globalThis.localStorage.clear();
resetActiveConfig();
const defaultRepoConfig = getActiveConfig();
assert.equal(defaultRepoConfig.eventType, baseWeddingConfig.eventType);
assert.equal(defaultRepoConfig.theme, baseWeddingConfig.theme);
assert.equal(defaultRepoConfig.groom.nameEn, baseWeddingConfig.groom.nameEn);
assert.equal(defaultRepoConfig.bride.nameEn, baseWeddingConfig.bride.nameEn);
console.log('✅ [Phase 3] All 10 Event Types, 6 Visual Themes, and base config defaults verified.');

// ─── 5. Dynamic Event Agenda Start Time Tests ─────────────────────────
{
  // 5a. Golden agenda defaults automatically start at configured event start time (8:00 PM)
  const goldenAgenda8pm = syncAgendaWithStartTime([], { timeEn: '8:00 PM', time: '٨:٠٠ مساءً' }, { useGoldenDefaults: true });
  assert.equal(goldenAgenda8pm.length, 4);
  assert.equal(goldenAgenda8pm[0].timeEn, '8:00 PM', 'First agenda item must match 8:00 PM start time');
  assert.equal(goldenAgenda8pm[0].timeAr, '٨:٠٠ مساءً');
  assert.equal(goldenAgenda8pm[1].timeEn, '9:30 PM');
  assert.equal(goldenAgenda8pm[2].timeEn, '11:30 PM');
  assert.equal(goldenAgenda8pm[3].timeEn, '1:00 AM');

  // 5b. Updating start time preserves valid subsequent items
  const customAgenda = [
    { id: '1', timeEn: '8:00 PM', timeAr: '٨:٠٠ مساءً', titleEn: 'Arrival' },
    { id: '2', timeEn: '9:30 PM', timeAr: '٩:٣٠ مساءً', titleEn: 'Ceremony' },
    { id: '3', timeEn: '11:00 PM', timeAr: '١١:٠٠ مساءً', titleEn: 'Dinner' },
  ];
  const earlierWedding = buildUpdatedWeddingTime({ date: '2026-11-24', dateTime: '2026-11-24T20:00:00+02:00' }, '19:30');
  assert.equal(earlierWedding.timeEn, '7:30 PM');
  assert.equal(earlierWedding.time, '٧:٣٠ مساءً');
  assert.equal(earlierWedding.dateTime, '2026-11-24T19:30:00+02:00');
  assert.equal(getEventStartTime24h(earlierWedding), '19:30');
  const syncedEarlier = syncAgendaWithStartTime(customAgenda, earlierWedding);
  assert.equal(syncedEarlier[0].timeEn, '7:30 PM');
  assert.equal(syncedEarlier[1].timeEn, '9:30 PM', 'Valid subsequent item should be preserved');
  assert.equal(syncedEarlier[2].timeEn, '11:00 PM', 'Valid subsequent item should be preserved');

  // 5c. Moving start time past subsequent items adjusts sequence to stay valid
  const laterWedding = buildUpdatedWeddingTime(earlierWedding, '22:00');
  const syncedLater = syncAgendaWithStartTime(customAgenda, laterWedding);
  assert.equal(syncedLater[0].timeEn, '10:00 PM');
  assert.equal(syncedLater[1].timeEn, '11:30 PM', 'Conflicting subsequent item must shift forward');
  assert.equal(syncedLater[2].timeEn, '1:00 AM', 'Third item must maintain valid sequencing past midnight');

  // 5d. Adding, editing, and deleting agenda items keeps item #1 synced to event start time
  const nextItem = createNextAgendaItem(syncedLater, laterWedding);
  assert.equal(nextItem.timeEn, '2:00 AM', 'Added agenda item schedules 60m after last slot');
  const editedAgenda = [
    { ...syncedLater[0], titleEn: 'Doors Open', descriptionEn: 'Custom welcome note' },
    ...syncedLater.slice(1),
    nextItem,
  ];
  const afterDeleteFirst = syncAgendaWithStartTime(editedAgenda.slice(1), laterWedding);
  assert.equal(afterDeleteFirst[0].timeEn, '10:00 PM', 'Deleting item #1 syncs new item #1 to event start time');

  // 5e. Persistence check across saveActiveConfig / getActiveConfig
  saveActiveConfig({ wedding: laterWedding, agenda: editedAgenda });
  const reloaded = getActiveConfig();
  assert.equal(reloaded.wedding.timeEn, '10:00 PM');
  assert.equal(reloaded.agenda[0].timeEn, '10:00 PM');
  assert.equal(reloaded.agenda[0].titleEn, 'Doors Open');
  assert.equal(reloaded.agenda[0].descriptionEn, 'Custom welcome note');
  assert.equal(reloaded.agenda.length, 4);
  console.log('✅ [Agenda] Dynamic start time synchronization, item CRUD, sequencing, and persistence verified.');
}

// ─── 6. Event-Specific Dress Code Configuration Tests ─────────────────
{
  assert.ok(WEDDING_LADIES_BROWN_SHADES.length >= 5, 'Should provide descriptive solid brown shade options');
  for (const shade of WEDDING_LADIES_BROWN_SHADES) {
    assert.ok(shade.id && shade.hex && shade.nameEn && shade.nameAr, 'Each brown shade must have id, hex, nameEn, nameAr');
  }

  // Save Wedding dress code with 'espresso' brown shade & Engagement custom note
  saveActiveConfig({
    eventType: 'wedding',
    dressCode: {
      enabled: true,
      byEventType: {
        wedding: { ladiesBrownShade: 'espresso' },
        engagement: { ladiesDescEn: 'Engagement pastel dresses only' },
      },
    },
  });

  const weddingCfg = getActiveConfig();
  const weddingDisplay = resolveDressCodeForDisplay(weddingCfg, (k) => k, false);
  assert.equal(weddingDisplay.isWedding, true);
  assert.equal(weddingDisplay.ladiesSolidShade?.id, 'espresso');
  assert.equal(weddingDisplay.ladiesSolidShade?.hex, '#3B2417');
  assert.equal(weddingDisplay.womenColors.length, 1);
  assert.equal(weddingDisplay.womenColors[0].nameEn, 'Espresso Brown');
  assert.ok(weddingDisplay.ladiesDesc.includes('Espresso Brown'));

  // Switch to Engagement and verify Wedding brown shade does NOT leak
  const engagementCfg = mergeConfig({ ...weddingCfg, eventType: 'engagement' });
  const engagementDisplay = resolveDressCodeForDisplay(engagementCfg, (k) => k, false);
  assert.equal(engagementDisplay.isWedding, false);
  assert.equal(engagementDisplay.ladiesSolidShade, null, 'Wedding brown shade must NOT apply to Engagement');
  assert.equal(engagementDisplay.ladiesDesc, 'Engagement pastel dresses only');
  assert.ok(engagementDisplay.womenColors.length > 1, 'Engagement keeps its own palette');

  // Switch to Corporate and verify Wedding brown shade does NOT leak
  const corpCfg = mergeConfig({ ...weddingCfg, eventType: 'corporate' });
  const corpDisplay = resolveDressCodeForDisplay(corpCfg, (k) => k, false);
  assert.equal(corpDisplay.ladiesSolidShade, null, 'Wedding brown shade must NOT apply to Corporate');
  assert.ok(!corpDisplay.ladiesDesc.includes('Espresso Brown'));

  // Change Wedding shade to 'caramel' and confirm persistence & isolation
  saveActiveConfig({
    ...weddingCfg,
    dressCode: {
      ...weddingCfg.dressCode,
      byEventType: {
        ...weddingCfg.dressCode.byEventType,
        wedding: { ladiesBrownShade: 'caramel' },
      },
    },
  });
  const reloadedWedding = getActiveConfig();
  assert.equal(reloadedWedding.dressCode.byEventType.wedding.ladiesBrownShade, 'caramel');
  assert.equal(reloadedWedding.dressCode.byEventType.engagement.ladiesDescEn, 'Engagement pastel dresses only');
  assert.equal('ladiesBrownShade' in reloadedWedding.dressCode.byEventType.engagement, false);
  resetActiveConfig();
  console.log('✅ [DressCode] Event-specific dress code isolation and Wedding brown shade dropdown verified.');
}

// ─── 7. GitHub Pages Deployment & Automatic Firestore Config Sync ─────
{
  // 7a. When deployed weddingConfig.js changes (hash mismatch), reload sync updates Firestore
  let savedToFirestore = null;
  const staleCloudConfig = {
    eventType: 'wedding',
    wedding: { timeEn: '5:00 PM', time: '٥:٠٠ مساءً' },
    _staticConfigHash: 'old_hash_from_previous_push',
  };
  await syncConfigWithFirestore(
    async () => staleCloudConfig,
    async (cfg) => {
      savedToFirestore = cfg;
    },
    { forceFirebaseEnabled: true }
  );
  assert.ok(savedToFirestore, 'Updated weddingConfig.js must be pushed to Firestore on reload');
  assert.equal(savedToFirestore._staticConfigHash, getStaticConfigHash());
  assert.equal(savedToFirestore.wedding.timeEn, baseWeddingConfig.wedding.timeEn);

  // 7b. When deployed weddingConfig.js has NOT changed (hash matches), Firestore Admin edits win
  let overwrittenOnMatch = false;
  const liveAdminCloudConfig = {
    eventType: 'wedding',
    wedding: { timeEn: '9:30 PM', time: '٩:٣٠ مساءً' },
    dressCode: { byEventType: { wedding: { ladiesBrownShade: 'chocolate' } } },
    _staticConfigHash: getStaticConfigHash(),
  };
  const syncedLive = await syncConfigWithFirestore(
    async () => liveAdminCloudConfig,
    async () => {
      overwrittenOnMatch = true;
    },
    { forceFirebaseEnabled: true }
  );
  assert.equal(overwrittenOnMatch, false, 'Unchanged weddingConfig.js must NOT overwrite live Firestore Admin edits');
  assert.equal(syncedLive.wedding.timeEn, '9:30 PM');
  assert.equal(syncedLive.dressCode.byEventType.wedding.ladiesBrownShade, 'chocolate');
  resetActiveConfig();

  // 7c. Firestore REST encoding helper converts nested objects/arrays cleanly
  const encoded = toFirestoreFields({
    eventType: 'wedding',
    dressCode: { enabled: true, byEventType: { wedding: { ladiesBrownShade: 'mocha' } } },
    sectionOrder: ['hero', 'details'],
  });
  assert.equal(encoded.eventType.stringValue, 'wedding');
  assert.equal(
    encoded.dressCode.mapValue.fields.byEventType.mapValue.fields.wedding.mapValue.fields.ladiesBrownShade.stringValue,
    'mocha'
  );
  assert.equal(encoded.sectionOrder.arrayValue.values.length, 2);

  // 7d. firebase.json & single GitHub Pages workflow verification
  const firebaseJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'firebase.json'), 'utf8'));
  assert.equal(firebaseJson.firestore?.rules, 'firestore.rules', 'firebase.json must reference firestore.rules');

  const workflowDir = path.join(projectRoot, '.github', 'workflows');
  const workflows = fs.readdirSync(workflowDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
  assert.equal(workflows.length, 1, 'Must have exactly one deployment workflow (no duplicates)');

  const workflowYml = fs.readFileSync(path.join(workflowDir, workflows[0]), 'utf8');
  assert.ok(workflowYml.includes('branches: [main]'), 'Workflow must trigger on push to main');
  assert.ok(workflowYml.includes('peaceiris/actions-gh-pages'), 'Workflow must deploy to GitHub Pages (github.io)');
  assert.ok(workflowYml.includes('sync-wedding-config-to-firestore.mjs'), 'Workflow must sync updated weddingConfig.js to Firestore');
  assert.ok(workflowYml.includes('secrets.FIREBASE_SERVICE_ACCOUNT'), 'Privileged Firebase creds must stay in GitHub Secrets');
  console.log('✅ [Deploy & Sync] GitHub Pages workflow and automatic Firestore weddingConfig sync verified.');
}

// ─── 5. Phase 5 Role Separation Tests (DASH-TEST-02 & OWNER-TEST-03) ─
const customerDashSource = fs.readFileSync(
  path.join(projectRoot, 'src/components/CustomerDashboard/CustomerDashboard.jsx'),
  'utf8'
);
const ownerAdminSource = fs.readFileSync(
  path.join(projectRoot, 'src/components/OwnerAdmin/OwnerAdmin.jsx'),
  'utf8'
);
assert.ok(
  !customerDashSource.includes('CUSTOMERS_REGISTRY_KEY') && !customerDashSource.includes('handleCreateCustomerRecord'),
  'CustomerDashboard must NOT contain Owner Admin customer provisioning controls'
);
assert.ok(
  ownerAdminSource.includes('403 — غير مصرح بالدخول (Owner Admin Disabled)'),
  'OwnerAdmin must enforce 403 gate when OWNER_ADMIN_ENABLED is false'
);
console.log('✅ [Phase 5] Customer Dashboard & Owner Admin separation verified (DASH-TEST-02 & OWNER-TEST-03).');

console.log('\n🎉 ALL STAGE A (PHASES 1–5 + GATE 10A) ACCEPTANCE TESTS PASSED!');
