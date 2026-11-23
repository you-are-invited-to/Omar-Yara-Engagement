import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Palette,
  Settings,
  Plus,
  Trash2,
  Download,
  LogOut,
  ExternalLink,
  CheckCircle,
  XCircle,
  Lock,
  Mail,
  Sparkles,
  HeartHandshake,
  Music,
  Calendar,
  Clock,
  Save,
  ShieldAlert,
  ShieldCheck,
  Gift,
  Copy,
  Check,
  X,
} from 'lucide-react';

import {
  loginCustomer,
  logoutCustomer,
  subscribeCustomerAuthState,
  getWeddingConfigFromDB,
  saveWeddingConfigToDB,
} from '../../services';
import {
  getActiveConfig,
  saveActiveConfig,
  resetActiveConfig,
  downloadConfigFile,
  getStaticConfigHash,
  mergeConfig,
  clone,
} from '../../utils/configManager';
import { DEFAULT_THEME_ID, WEDDING_THEMES, getThemeById } from '../../config/themesConfig';
import { EVENT_TYPES, DEFAULT_EVENT_TYPE_ID, getEventTypeById } from '../../config/eventTypesConfig';
import {
  WEDDING_LADIES_BROWN_SHADES,
  LADIES_PALETTE_PRESETS,
  getWeddingBrownShadeById,
  getLadiesPalettePresetById,
  getDefaultDressCodeForEventType,
  normalizeDressCodeByEventType,
} from '../../config/dressCodeConfig';
import {
  getEventStartTime24h,
  buildUpdatedWeddingTime,
  syncAgendaWithStartTime,
  parseTimeToMinutes,
  formatMinutesToTimeEn,
  formatMinutesToTimeAr,
  formatMinutesTo24h,
  createNextAgendaItem,
} from '../../utils/agendaUtils';
import ThemeManager from '../Admin/ThemeManager';
import DynamicSectionsEditor from '../Admin/DynamicSectionsEditor';
import '../Admin/AdminPortal.css';

const FIREBASE_ENABLED = import.meta.env.VITE_FIREBASE_ENABLED === 'true';
const IS_DEV = import.meta.env.DEV === true;
const OWNER_ADMIN_ENABLED = IS_DEV || import.meta.env.VITE_ENABLE_OWNER_ADMIN === 'true';
const CUSTOMERS_REGISTRY_KEY = 'owner_admin_customers_registry_v1';

const DEFAULT_CUSTOMERS = [
  {
    id: 'cust-hamdy-rodina',
    customerName: 'Hamdy & Rodina (Default Reference)',
    clientEmail: 'hamdy@example.com',
    githubOwner: 'hamdyKouta1',
    customerSlug: 'invitation',
    eventType: 'wedding',
    themeId: 'default',
    githubRepoUrl: 'https://github.com/hamdyKouta1/invitation',
    deploymentUrl: 'https://hamdykouta1.github.io/invitation/',
    firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wedding-invitation-prod',
    firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    provisioningStatus: 'deployed',
    createdAt: '2026-11-15T12:00:00.000Z',
  },
];

const EMPTY_CUSTOMER_FORM = {
  customerName: '',
  clientEmail: '',
  githubOwner: 'hamdyKouta1',
  customerSlug: '',
  eventType: 'wedding',
  themeId: 'default',
  githubRepoUrl: '',
  deploymentUrl: '',
  firebaseProjectId: '',
  firebaseApiKey: '',
  firebaseAuthDomain: '',
  firebaseStorageBucket: '',
  firebaseMessagingSenderId: '',
  firebaseAppId: '',
  provisioningStatus: 'draft',
};

const OwnerAdmin = ({ onClose }) => {
  const [ownerUser, setOwnerUser] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Tabs: 'customers' | 'themes' | 'config'
  const [activeTab, setActiveTab] = useState('customers');
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedSecretId, setCopiedSecretId] = useState(null);

  // Operator Customer Registry
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_REGISTRY_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOMERS;
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomerForm, setNewCustomerForm] = useState(EMPTY_CUSTOMER_FORM);
  const [rawFirebaseSnippet, setRawFirebaseSnippet] = useState('');

  // Active Event Config being prepared
  const [configData, setConfigData] = useState(() => getActiveConfig());
  const [activeThemeId, setActiveThemeId] = useState(() => getActiveConfig().theme || DEFAULT_THEME_ID);
  const [dressCodeEventType, setDressCodeEventType] = useState(
    () => getActiveConfig().eventType || DEFAULT_EVENT_TYPE_ID
  );
  const [savingConfig, setSavingConfig] = useState(false);

  // Load latest live configuration from Firestore when Owner Admin authenticates
  // (or push newly deployed weddingConfig.js to Firestore if its hash changed)
  useEffect(() => {
    if (!OWNER_ADMIN_ENABLED || !ownerUser || !FIREBASE_ENABLED) return;
    let cancelled = false;
    const currentHash = getStaticConfigHash();
    getWeddingConfigFromDB()
      .then(async (cloudConfig) => {
        if (cancelled) return;
        const hasCloud =
          cloudConfig && typeof cloudConfig === 'object' && Object.keys(cloudConfig).length > 0;
        if (hasCloud && cloudConfig._staticConfigHash === currentHash) {
          const merged = { ...mergeConfig(cloudConfig), _staticConfigHash: currentHash };
          saveActiveConfig(merged);
          setConfigData(merged);
          setActiveThemeId(merged.theme || DEFAULT_THEME_ID);
          setDressCodeEventType(merged.eventType || DEFAULT_EVENT_TYPE_ID);
        } else {
          const fresh = { ...mergeConfig(null), _staticConfigHash: currentHash };
          saveActiveConfig(fresh);
          setConfigData(fresh);
          setActiveThemeId(fresh.theme || DEFAULT_THEME_ID);
          setDressCodeEventType(fresh.eventType || DEFAULT_EVENT_TYPE_ID);
          await saveWeddingConfigToDB(fresh);
        }
      })
      .catch((err) => {
        console.warn('[OwnerAdmin] Could not sync initial Firestore config:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerUser]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!OWNER_ADMIN_ENABLED) return;
    const unsub = subscribeCustomerAuthState((u) => {
      if (u) setOwnerUser(u);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const saveCustomersRegistry = (nextList) => {
    setCustomers(nextList);
    try {
      localStorage.setItem(CUSTOMERS_REGISTRY_KEY, JSON.stringify(nextList));
    } catch (err) {
      console.error('[OwnerAdmin] Failed to save customer registry:', err);
    }
  };

  // ─── Hard Security Gate: Never expose Owner Admin on Customer Deployments (ADM-003) ───
  if (!OWNER_ADMIN_ENABLED) {
    return (
      <div className="admin-portal-overlay">
        <div className="admin-portal-login-card" style={{ textAlign: 'center' }}>
          {onClose && (
            <button onClick={onClose} className="admin-portal-close-top" title="إغلاق">
              <X size={20} />
            </button>
          )}
          <div className="admin-portal-login-header">
            <div className="admin-portal-icon-badge" style={{ color: '#e05666' }}>
              <ShieldAlert size={34} />
            </div>
            <h2 className="admin-portal-title font-serif">403 — غير مصرح بالدخول (Owner Admin Disabled)</h2>
            <p className="admin-portal-subtitle">
              واجهة المالك (Owner Admin) مخصصة لمشغل المنصة فقط وغير متاحة على مواقع العملاء.
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="admin-btn admin-btn--outline admin-btn--block">
              العودة إلى موقع الدعوة
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Operator Authentication Gate ───
  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (FIREBASE_ENABLED) {
      setAuthLoading(true);
      try {
        const user = await loginCustomer(emailInput, passwordInput);
        setOwnerUser(user);
        setPasswordInput('');
        showToast('مرحباً بك في لوحة المالك وإدارة العملاء (Owner Admin)');
      } catch {
        setAuthError('بيانات دخول المشغل غير صحيحة في Firebase Authentication.');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (IS_DEV) {
      if (!emailInput.trim() || passwordInput.length < 4) {
        setAuthError('يرجى إدخال بريد المشغل وكلمة مرور صالحة في وضع التطوير المحلي.');
        return;
      }
      setOwnerUser({ uid: 'local-owner-operator', email: emailInput.trim() });
      setPasswordInput('');
      showToast('تم فتح لوحة المالك في بيئة المشغل المحلية (Local Operator Workbench)');
    }
  };

  const handleOwnerLogout = async () => {
    await logoutCustomer();
    setOwnerUser(null);
  };

  // ─── Smart Firebase Snippet Parser (Extracts all 6 Firebase Web Config keys) ───
  const handleParseFirebaseSnippet = (rawText) => {
    setRawFirebaseSnippet(rawText);
    if (!rawText || !rawText.trim()) return;

    const extractField = (key) => {
      const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
      const match = rawText.match(regex);
      return match ? match[1].trim() : '';
    };

    const apiKey = extractField('apiKey');
    const authDomain = extractField('authDomain');
    const projectId = extractField('projectId');
    const storageBucket = extractField('storageBucket');
    const messagingSenderId = extractField('messagingSenderId');
    const appId = extractField('appId');

    if (projectId || apiKey) {
      setNewCustomerForm((prev) => ({
        ...prev,
        firebaseApiKey: apiKey || prev.firebaseApiKey,
        firebaseAuthDomain: authDomain || (projectId ? `${projectId}.firebaseapp.com` : prev.firebaseAuthDomain),
        firebaseProjectId: projectId || prev.firebaseProjectId,
        firebaseStorageBucket: storageBucket || (projectId ? `${projectId}.appspot.com` : prev.firebaseStorageBucket),
        firebaseMessagingSenderId: messagingSenderId || prev.firebaseMessagingSenderId,
        firebaseAppId: appId || prev.firebaseAppId,
      }));
      showToast('تم استخراج بيانات Firebase Web Config تلقائياً بنجاح!');
    }
  };

  // ─── Customer Registry CRUD (ADM-004) ───
  const handleCreateCustomerRecord = (e) => {
    e.preventDefault();
    const name = newCustomerForm.customerName.trim();
    const ghOwner = (newCustomerForm.githubOwner || 'hamdyKouta1').trim().replace(/[^a-zA-Z0-9-_]/g, '');
    const slug = newCustomerForm.customerSlug.trim().replace(/[^a-zA-Z0-9-_]/g, '-');
    const fbProject = newCustomerForm.firebaseProjectId.trim();

    if (!name || !ghOwner || !slug || !fbProject) {
      showToast('يرجى إدخال اسم العميل، حساب GitHub، اسم المستودع (Slug)، ومعرف مشروع Firebase المستقل', 'error');
      return;
    }

    // Reject duplicate Firebase project ID across different customers (ISO-001, ISO-002)
    if (customers.some((c) => c.firebaseProjectId.toLowerCase() === fbProject.toLowerCase())) {
      showToast('خطأ عزل البيانات: معرف مشروع Firebase مستخدم بالفعل لعميل آخر! يجب تخصيص مشروع مستقل لكل عميل.', 'error');
      return;
    }

    const newRecord = {
      ...newCustomerForm,
      id: `cust-${Date.now()}`,
      customerName: name,
      githubOwner: ghOwner,
      customerSlug: slug,
      firebaseProjectId: fbProject,
      firebaseApiKey: newCustomerForm.firebaseApiKey.trim(),
      firebaseAuthDomain: newCustomerForm.firebaseAuthDomain.trim() || `${fbProject}.firebaseapp.com`,
      firebaseStorageBucket: newCustomerForm.firebaseStorageBucket.trim() || `${fbProject}.appspot.com`,
      firebaseMessagingSenderId: newCustomerForm.firebaseMessagingSenderId.trim(),
      firebaseAppId: newCustomerForm.firebaseAppId.trim(),
      githubRepoUrl: newCustomerForm.githubRepoUrl.trim() || `https://github.com/${ghOwner}/${slug}`,
      deploymentUrl: newCustomerForm.deploymentUrl.trim() || `https://${ghOwner.toLowerCase()}.github.io/${slug}/`,
      createdAt: new Date().toISOString(),
    };

    const next = [newRecord, ...customers];
    saveCustomersRegistry(next);
    setSelectedCustomer(newRecord);
    setNewCustomerForm(EMPTY_CUSTOMER_FORM);
    setRawFirebaseSnippet('');
    showToast(`تم تسجيل العميل "${name}" على حساب (${ghOwner}/${slug}) وتجهيز أوامر gh CLI!`);
  };

  const handleUpdateCustomerStatus = (id, status) => {
    const next = customers.map((c) => (c.id === id ? { ...c, provisioningStatus: status } : c));
    saveCustomersRegistry(next);
    if (selectedCustomer?.id === id) {
      setSelectedCustomer({ ...selectedCustomer, provisioningStatus: status });
    }
    showToast('تم تحديث حالة تجهيز موقع العميل');
  };

  const handleDeleteCustomerRecord = (id, name) => {
    if (!window.confirm(`هل تريد حذف سجل العميل "${name}" من قائمة المالك؟`)) return;
    const next = customers.filter((c) => c.id !== id);
    saveCustomersRegistry(next);
    if (selectedCustomer?.id === id) setSelectedCustomer(null);
    showToast('تم حذف سجل العميل');
  };

  const handleLoadCustomerIntoConfigurator = (cust) => {
    setSelectedCustomer(cust);
    setConfigData((prev) => ({
      ...clone(prev),
      eventType: cust.eventType || DEFAULT_EVENT_TYPE_ID,
      theme: cust.themeId || DEFAULT_THEME_ID,
      rsvp: {
        ...(prev.rsvp || {}),
        invitationId: `${cust.customerSlug}-rsvp`,
      },
      sharing: {
        ...(prev.sharing || {}),
        url: cust.deploymentUrl || prev.sharing?.url,
      },
    }));
    setActiveTab('config');
    showToast(`تم تحميل إعدادات العميل "${cust.customerName}" للتجهيز`);
  };

  // ─── Configurator Actions ───
  const handleConfigChange = (section, field, value) => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      if (section) {
        if (!next[section]) next[section] = {};
        next[section][field] = value;

        // Keep wedding date synced with ISO dateTime
        if (section === 'wedding' && field === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const time24 = getEventStartTime24h(next.wedding);
          const tzPart = next.wedding.dateTime?.match(/([+-]\d{2}:\d{2}|Z)$/)?.[1] || '+02:00';
          next.wedding.dateTime = `${value}T${time24}:00${tzPart}`;
        }

        // Keep agenda synchronized when ISO dateTime or display time fields change directly
        if (section === 'wedding' && (field === 'dateTime' || field === 'timeEn' || field === 'time')) {
          if (field === 'dateTime') {
            const updatedWedding = buildUpdatedWeddingTime(next.wedding, value);
            next.wedding = { ...updatedWedding, dateTime: value };
          } else if (field === 'timeEn') {
            const updatedWedding = buildUpdatedWeddingTime(next.wedding, value);
            next.wedding = { ...updatedWedding, timeEn: value };
          }
          if (Array.isArray(next.agenda) && next.agenda.length > 0) {
            next.agenda = syncAgendaWithStartTime(next.agenda, next.wedding);
          }
        }

        // Keep dressCode.enabled synced with sections.dressCode.enabled
        if (section === 'dressCode' && field === 'enabled') {
          if (!next.sections) next.sections = {};
          next.sections.dressCode = { ...(next.sections.dressCode || {}), enabled: Boolean(value) };
        }
      } else {
        next[field] = value;
      }
      return next;
    });
    if (!section && field === 'eventType' && value) {
      setDressCodeEventType(value);
    }
  };

  const handleEventStartTimeChange = (rawTimeValue) => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      next.wedding = buildUpdatedWeddingTime(next.wedding || {}, rawTimeValue);
      if (Array.isArray(next.agenda) && next.agenda.length > 0) {
        next.agenda = syncAgendaWithStartTime(next.agenda, next.wedding);
      }
      return next;
    });
  };

  const handleEventDressCodeChange = (eventTypeId, field, value) => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      if (!next.dressCode) next.dressCode = { enabled: true };
      const byEvent = normalizeDressCodeByEventType(next.dressCode.byEventType);
      byEvent[eventTypeId] = {
        ...(byEvent[eventTypeId] || {}),
        [field]: value,
      };
      next.dressCode.byEventType = byEvent;
      return next;
    });
  };

  // ─── Agenda Items CRUD (Item #1 always synced with Event Start Time) ───
  const handleAddAgendaItem = () => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      const baseList = syncAgendaWithStartTime(next.agenda, next.wedding, {
        useGoldenDefaults: true,
      });
      const newItem = createNextAgendaItem(baseList, next.wedding);
      next.agenda = syncAgendaWithStartTime([...baseList, newItem], next.wedding);
      return next;
    });
    showToast('تمت إضافة فقرة جديدة للأجندة! تذكر الضغط على "حفظ وتطبيق الإعدادات".');
  };

  const handleUpdateAgendaItem = (index, field, value) => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      const baseList = syncAgendaWithStartTime(next.agenda, next.wedding, {
        useGoldenDefaults: true,
      });
      if (!baseList[index]) return prev;

      const updatedItem = { ...baseList[index] };
      if (field === 'time24') {
        const mins = parseTimeToMinutes(value);
        if (mins !== null) {
          updatedItem.timeEn = formatMinutesToTimeEn(mins);
          updatedItem.timeAr = formatMinutesToTimeAr(mins);
        }
      } else {
        updatedItem[field] = value;
      }

      const nextList = baseList.map((item, idx) => (idx === index ? updatedItem : item));
      next.agenda =
        field === 'time24' ? syncAgendaWithStartTime(nextList, next.wedding) : nextList;
      return next;
    });
  };

  const handleDeleteAgendaItem = (index) => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      const baseList = syncAgendaWithStartTime(next.agenda, next.wedding, {
        useGoldenDefaults: true,
      });
      if (baseList.length <= 1) return prev;
      const remaining = baseList.filter((_, idx) => idx !== index);
      next.agenda = syncAgendaWithStartTime(remaining, next.wedding);
      return next;
    });
    showToast('تم حذف الفقرة من الأجندة');
  };

  const handleResetAgendaItems = () => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      next.agenda = [];
      return next;
    });
    showToast('تمت استعادة فقرات الأجندة الافتراضية المربوطة بوقت بدء الحفل');
  };

  const handleAddWishlistItem = () => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      if (!next.wishlist) next.wishlist = {};
      const currentItems = Array.isArray(next.wishlist.items) ? [...next.wishlist.items] : [];
      next.wishlist.items = [
        ...currentItems,
        {
          id: 'gift-' + Date.now(),
          titleAr: '',
          titleEn: '',
          descriptionAr: '',
          descriptionEn: '',
          price: '',
          currency: 'EGP',
          link: '',
          imageUrl: '',
          status: 'available',
          reservedBy: '',
        },
      ];
      return next;
    });
  };

  const handleUpdateWishlistItem = (itemId, field, value) => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      if (!next.wishlist) next.wishlist = {};
      const currentItems = Array.isArray(next.wishlist.items) ? [...next.wishlist.items] : [];
      next.wishlist.items = currentItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      );
      return next;
    });
  };

  const handleDeleteWishlistItem = (itemId) => {
    setConfigData((prev) => {
      const next = clone(prev) || {};
      if (!next.wishlist) next.wishlist = {};
      const currentItems = Array.isArray(next.wishlist.items) ? [...next.wishlist.items] : [];
      next.wishlist.items = currentItems.filter((item) => item.id !== itemId);
      return next;
    });
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const normalized = {
        ...mergeConfig(configData),
        _staticConfigHash: getStaticConfigHash(),
      };
      setConfigData(normalized);
      saveActiveConfig(normalized);
      setActiveThemeId(normalized.theme || DEFAULT_THEME_ID);
      if (FIREBASE_ENABLED) {
        await saveWeddingConfigToDB(normalized);
      }
      showToast(
        FIREBASE_ENABLED
          ? 'تم حفظ الإعدادات ومزامنتها مباشرة مع Firebase بنجاح!'
          : 'تم حفظ الإعدادات وتطبيقها بنجاح!'
      );
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء حفظ الإعدادات في Firebase. تأكد من صلاحيات الدخول.', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleApplyAndSaveTheme = async (themeId) => {
    setSavingConfig(true);
    try {
      const nextConfig = {
        ...mergeConfig({ ...clone(configData), theme: themeId }),
        _staticConfigHash: getStaticConfigHash(),
      };
      setConfigData(nextConfig);
      saveActiveConfig(nextConfig);
      setActiveThemeId(themeId);
      if (FIREBASE_ENABLED) {
        await saveWeddingConfigToDB(nextConfig);
      }
      const themeObj = getThemeById(themeId);
      showToast(`تم تفعيل التصميم "${themeObj.nameAr}" بنجاح!`);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تطبيق التصميم', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleResetConfig = () => {
    if (!window.confirm('هل تريد استعادة الإعدادات الافتراضية؟')) return;
    resetActiveConfig();
    const fresh = getActiveConfig();
    setConfigData(fresh);
    setActiveThemeId(fresh.theme || DEFAULT_THEME_ID);
    showToast('تمت استعادة الإعدادات الافتراضية');
  };

  const generateProvisioningCommands = (cust) => {
    const ghOwner = cust.githubOwner || 'hamdyKouta1';
    const slug = cust.customerSlug || 'invite-customer';
    const fullRepo = `${ghOwner}/${slug}`;
    const siteUrl = cust.deploymentUrl || `https://${ghOwner.toLowerCase()}.github.io/${slug}/`;
    const fbProj = cust.firebaseProjectId || 'customer-firebase-project';
    const fbApiKey = cust.firebaseApiKey || 'YOUR_FIREBASE_API_KEY';
    const fbAuthDomain = cust.firebaseAuthDomain || `${fbProj}.firebaseapp.com`;
    const fbBucket = cust.firebaseStorageBucket || `${fbProj}.appspot.com`;
    const fbSenderId = cust.firebaseMessagingSenderId || 'YOUR_MESSAGING_SENDER_ID';
    const fbAppId = cust.firebaseAppId || 'YOUR_FIREBASE_APP_ID';
    const etObj = getEventTypeById(cust.eventType);
    const ogTitle = `${etObj.badgeAr} — ${cust.customerName} | ${etObj.badgeEn}`;

    return `# 1. Clone Master Repository & Create Dedicated Customer Repo under "${fullRepo}"
# (Works automatically even if hamdyKouta1/invitation is not marked as a GitHub Template)
git clone https://github.com/hamdyKouta1/invitation.git ${slug}
cd ${slug}
git remote remove origin
gh repo create ${fullRepo} --public --source=. --remote=origin

# 2. Place downloaded weddingConfig.js into src/config/weddingConfig.js

# 3. Deploy Hardened Firestore Security Rules to Customer's Independent Firebase Project (${fbProj})
npx firebase-tools deploy --only firestore:rules --project ${fbProj}

# 4. Configure All Per-Customer GitHub Actions Secrets on ${fullRepo} (No .env file needed)
gh secret set VITE_BASE_PATH --repo ${fullRepo} --body "/${slug}/"
gh secret set VITE_CUSTOMER_SLUG --repo ${fullRepo} --body "${slug}"
gh secret set VITE_SITE_URL --repo ${fullRepo} --body "${siteUrl}"
gh secret set VITE_OG_TITLE --repo ${fullRepo} --body "${ogTitle}"
gh secret set VITE_OG_IMAGE --repo ${fullRepo} --body "${siteUrl}og-image.jpg"
gh secret set VITE_FIREBASE_ENABLED --repo ${fullRepo} --body "true"
gh secret set VITE_FIREBASE_API_KEY --repo ${fullRepo} --body "${fbApiKey}"
gh secret set VITE_FIREBASE_AUTH_DOMAIN --repo ${fullRepo} --body "${fbAuthDomain}"
gh secret set VITE_FIREBASE_PROJECT_ID --repo ${fullRepo} --body "${fbProj}"
gh secret set VITE_FIREBASE_STORAGE_BUCKET --repo ${fullRepo} --body "${fbBucket}"
gh secret set VITE_FIREBASE_MESSAGING_SENDER_ID --repo ${fullRepo} --body "${fbSenderId}"
gh secret set VITE_FIREBASE_APP_ID --repo ${fullRepo} --body "${fbAppId}"

# 5. Enable GitHub Pages (GitHub Actions workflow deployment) & Push to main to Auto-Deploy
gh api -X POST repos/${fullRepo}/pages -f "build_type=workflow"
git add -A
git commit -m "Configure ${cust.customerName} (${cust.eventType})"
git push -u origin main

# Live Customer Site URL:      ${siteUrl}
# Customer Dashboard URL:      ${siteUrl}#dashboard
# Authorized Domain to add in Firebase Auth (${fbProj}): ${ghOwner.toLowerCase()}.github.io`;
  };

  const downloadCustomerEnvFile = (cust) => {
    const ghOwner = cust.githubOwner || 'hamdyKouta1';
    const slug = cust.customerSlug || 'invite-customer';
    const siteUrl = cust.deploymentUrl || `https://${ghOwner.toLowerCase()}.github.io/${slug}/`;
    const fbProj = cust.firebaseProjectId || '';
    const etObj = getEventTypeById(cust.eventType);
    const ogTitle = `${etObj.badgeAr} — ${cust.customerName} | ${etObj.badgeEn}`;

    const envContent = `# Isolated Customer Environment Configuration (${ghOwner}/${slug})
VITE_BASE_PATH=/${slug}/
VITE_CUSTOMER_SLUG=${slug}
VITE_SITE_URL=${siteUrl}
VITE_OG_TITLE=${ogTitle}
VITE_OG_IMAGE=${siteUrl}og-image.jpg
VITE_FIREBASE_ENABLED=true
VITE_FIREBASE_API_KEY=${cust.firebaseApiKey || ''}
VITE_FIREBASE_AUTH_DOMAIN=${cust.firebaseAuthDomain || `${fbProj}.firebaseapp.com`}
VITE_FIREBASE_PROJECT_ID=${fbProj}
VITE_FIREBASE_STORAGE_BUCKET=${cust.firebaseStorageBucket || `${fbProj}.appspot.com`}
VITE_FIREBASE_MESSAGING_SENDER_ID=${cust.firebaseMessagingSenderId || ''}
VITE_FIREBASE_APP_ID=${cust.firebaseAppId || ''}
`;
    const blob = new Blob([envContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    link.click();
    URL.revokeObjectURL(url);
    showToast(`تم تحميل ملف البيئة .env للعميل (${slug}) بنجاح`);
  };

  if (!ownerUser) {
    return (
      <div className="admin-portal-overlay">
        <div className="admin-portal-login-card">
          {onClose && (
            <button onClick={onClose} className="admin-portal-close-top" title="إغلاق">
              <X size={20} />
            </button>
          )}
          <div className="admin-portal-login-header">
            <div className="admin-portal-icon-badge">
              <ShieldCheck size={32} />
            </div>
            <h2 className="admin-portal-title font-serif">لوحة المالك وإدارة العملاء (Owner Admin)</h2>
            <p className="admin-portal-subtitle">Private Operator Provisioning & Configuration Workbench</p>
          </div>

          {authError && <div className="admin-alert admin-alert--error">{authError}</div>}

          <form onSubmit={handleOwnerLogin} className="admin-portal-form">
            <div className="admin-form-group">
              <label className="admin-label">
                <Mail size={16} /> بريد المشغل (Operator Email)
              </label>
              <input
                type="email"
                required
                className="admin-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="owner@invitation-platform.com"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">
                <Lock size={16} /> كلمة مرور المشغل (Operator Password)
              </label>
              <input
                type="password"
                required
                className="admin-input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="admin-btn admin-btn--primary admin-btn--block"
            >
              <Lock size={18} />
              {authLoading ? 'جارٍ التحقق...' : 'دخول إلى لوحة المالك (Owner Admin)'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-portal-fullpage">
      {toastMessage && (
        <div className={`admin-toast admin-toast--${toastMessage.type}`}>
          {toastMessage.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <header className="admin-navbar">
        <div className="admin-navbar__brand">
          <Sparkles className="admin-brand-icon" size={24} />
          <div>
            <h1 className="admin-brand-title font-serif">لوحة المالك وتجهيز مواقع العملاء (Owner Admin)</h1>
            <div className="admin-brand-badges">
              <span className="admin-badge admin-badge--gold">خاص بالمشغل فقط (Operator Only)</span>
              <span className="admin-badge admin-badge--success">
                العملاء المسجلون: {customers.length}
              </span>
            </div>
          </div>
        </div>

        <div className="admin-navbar__actions">
          {onClose && (
            <button onClick={onClose} className="admin-btn admin-btn--outline">
              <ExternalLink size={16} />
              <span>معاينة الموقع</span>
            </button>
          )}
          <button onClick={handleOwnerLogout} className="admin-btn admin-btn--danger-outline">
            <LogOut size={16} />
            <span>خروج</span>
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'customers' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <Briefcase size={18} />
          <span>سجل العملاء والعزل ({customers.length})</span>
        </button>

        <button
          className={`admin-tab ${activeTab === 'themes' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          <Palette size={18} />
          <span>استوديو الثيمات (5 تصاميم)</span>
        </button>

        <button
          className={`admin-tab ${activeTab === 'config' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={18} />
          <span>إعداد نوع المناسبة والمحتوى (10 مناسبات)</span>
        </button>
      </nav>

      <main className="admin-main">
        {/* TAB 1: CUSTOMER REGISTRY & REPO/FIREBASE ISOLATION TRACKER */}
        {activeTab === 'customers' && (
          <div className="admin-section">
            <div className="admin-card admin-card--highlight">
              <h3 className="admin-card-title">
                <Plus size={20} />
                تسجيل عميل جديد وتخصيص مستودع GitHub ومشروع Firebase مستقل (Phase 2 & 4)
              </h3>
              <form onSubmit={handleCreateCustomerRecord} className="admin-gallery-form">
                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-label">اسم العميل / صاحب المناسبة *</label>
                    <input
                      type="text"
                      required
                      className="admin-input"
                      placeholder="مثال: A & B — حفل خطوبة"
                      value={newCustomerForm.customerName}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, customerName: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">بريد العميل (لحساب Customer Dashboard)</label>
                    <input
                      type="email"
                      className="admin-input"
                      placeholder="client@example.com"
                      value={newCustomerForm.clientEmail}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, clientEmail: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">حساب GitHub المستهدف (GitHub Username / Org) *</label>
                    <input
                      type="text"
                      required
                      className="admin-input"
                      placeholder="مثال: hamdyKouta1 أو hamdyhkouta2"
                      value={newCustomerForm.githubOwner}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, githubOwner: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">اسم المستودع المخصص (Repository Slug) *</label>
                    <input
                      type="text"
                      required
                      className="admin-input"
                      placeholder="مثال: invvite-a-B"
                      value={newCustomerForm.customerSlug}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, customerSlug: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">نوع المناسبة (Event Type — 10 أنواع)</label>
                    <select
                      className="admin-input admin-select"
                      value={newCustomerForm.eventType}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, eventType: e.target.value })}
                    >
                      {EVENT_TYPES.map((et) => (
                        <option key={et.id} value={et.id}>
                          {et.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">التصميم البصري (Theme — 5 تصاميم)</label>
                    <select
                      className="admin-input admin-select"
                      value={newCustomerForm.themeId}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, themeId: e.target.value })}
                    >
                      {WEDDING_THEMES.map((th) => (
                        <option key={th.id} value={th.id}>
                          {th.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Smart Firebase Config Snippet Parser */}
                  <div className="admin-form-group" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <label className="admin-label" style={{ color: '#d4af37', fontWeight: 700 }}>
                      ⚡ لصق سريع لكود Firebase Web Config (اختياري — يستخرج جميع الحقول الـ 6 تلقائياً)
                    </label>
                    <textarea
                      rows={3}
                      className="admin-input admin-textarea"
                      style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.82rem' }}
                      placeholder={'الصق كود firebaseConfig من Firebase Console هنا مثل:\nconst firebaseConfig = { apiKey: "AIzaSy...", authDomain: "...", projectId: "...", storageBucket: "...", messagingSenderId: "...", appId: "..." };'}
                      value={rawFirebaseSnippet}
                      onChange={(e) => handleParseFirebaseSnippet(e.target.value)}
                    />
                  </div>

                  {/* All 6 Individual Firebase Web Config Fields */}
                  <div className="admin-form-group">
                    <label className="admin-label">1. معرف مشروع Firebase (projectId / VITE_FIREBASE_PROJECT_ID) *</label>
                    <input
                      type="text"
                      required
                      className="admin-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      placeholder="invite-a-and-b-prod"
                      value={newCustomerForm.firebaseProjectId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setNewCustomerForm((prev) => ({
                          ...prev,
                          firebaseProjectId: pid,
                          firebaseAuthDomain: prev.firebaseAuthDomain || (pid ? `${pid}.firebaseapp.com` : ''),
                          firebaseStorageBucket: prev.firebaseStorageBucket || (pid ? `${pid}.appspot.com` : ''),
                        }));
                      }}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">2. مفتاح الويب العام (apiKey / VITE_FIREBASE_API_KEY)</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      placeholder="AIzaSy..."
                      value={newCustomerForm.firebaseApiKey}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, firebaseApiKey: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">3. نطاق المصادقة (authDomain / VITE_FIREBASE_AUTH_DOMAIN)</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      placeholder="invite-a-and-b-prod.firebaseapp.com"
                      value={newCustomerForm.firebaseAuthDomain}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, firebaseAuthDomain: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">4. حاوية التخزين (storageBucket / VITE_FIREBASE_STORAGE_BUCKET)</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      placeholder="invite-a-and-b-prod.appspot.com"
                      value={newCustomerForm.firebaseStorageBucket}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, firebaseStorageBucket: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">5. معرف المرسل (messagingSenderId / VITE_FIREBASE_MESSAGING_SENDER_ID)</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      placeholder="123456789012"
                      value={newCustomerForm.firebaseMessagingSenderId}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, firebaseMessagingSenderId: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">6. معرف التطبيق (appId / VITE_FIREBASE_APP_ID)</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      placeholder="1:123456789012:web:abcdef123456"
                      value={newCustomerForm.firebaseAppId}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, firebaseAppId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="admin-btn admin-btn--primary">
                    <Plus size={18} />
                    إنشاء سجل العميل وتوليد أوامر gh CLI الكاملة
                  </button>
                </div>
              </form>
            </div>

            {selectedCustomer && (
              <div className="admin-card" style={{ marginTop: '1.5rem', border: '1px solid #d4af37' }}>
                <div className="admin-section-header">
                  <h3 className="admin-card-title">
                    📦 أوامر gh CLI الكاملة للعميل: {selectedCustomer.customerName} ({selectedCustomer.githubOwner || 'hamdyKouta1'}/{selectedCustomer.customerSlug})
                  </h3>
                  <div className="admin-btn-group">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generateProvisioningCommands(selectedCustomer));
                        setCopiedSecretId(selectedCustomer.id);
                        setTimeout(() => setCopiedSecretId(null), 2500);
                      }}
                      className="admin-btn admin-btn--outline"
                    >
                      {copiedSecretId === selectedCustomer.id ? <Check size={16} /> : <Copy size={16} />}
                      <span>نسخ أوامر gh CLI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCustomerEnvFile(selectedCustomer)}
                      className="admin-btn admin-btn--outline"
                    >
                      <Download size={16} />
                      <span>تحميل ملف .env للعميل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadConfigFile(configData)}
                      className="admin-btn admin-btn--primary"
                    >
                      <Download size={16} />
                      <span>تحميل weddingConfig.js للعميل</span>
                    </button>
                  </div>
                </div>
                <pre
                  style={{
                    background: '#12100e',
                    color: '#e5d3b3',
                    padding: '1rem',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    fontSize: '0.82rem',
                    direction: 'ltr',
                    textAlign: 'left',
                  }}
                >
                  {generateProvisioningCommands(selectedCustomer)}
                </pre>
              </div>
            )}

            <div className="admin-table-container" style={{ marginTop: '1.5rem' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>العميل</th>
                    <th>نوع المناسبة</th>
                    <th>الثيم</th>
                    <th>المستودع (GitHub Repo)</th>
                    <th>مشروع Firebase المستقل</th>
                    <th>حالة التجهيز</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const etObj = getEventTypeById(c.eventType);
                    const thObj = getThemeById(c.themeId);
                    return (
                      <tr key={c.id}>
                        <td className="admin-td-strong">
                          <div>{c.customerName}</div>
                          <div className="admin-td-muted" style={{ fontSize: '0.78rem' }}>{c.clientEmail}</div>
                        </td>
                        <td>{etObj.nameAr.split(' (')[0]}</td>
                        <td>{thObj.nameAr.split(' (')[0]}</td>
                        <td className="admin-td-mono">
                          <a href={c.githubRepoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#d4af37' }}>
                            {(c.githubOwner || 'hamdyKouta1')}/{c.customerSlug} ↗
                          </a>
                        </td>
                        <td className="admin-td-mono">{c.firebaseProjectId}</td>
                        <td>
                          <select
                            className="admin-input admin-select"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            value={c.provisioningStatus}
                            onChange={(e) => handleUpdateCustomerStatus(c.id, e.target.value)}
                          >
                            <option value="draft">مسودة (Draft)</option>
                            <option value="repo_created">تم إنشاء المستودع (Repo Created)</option>
                            <option value="firebase_linked">تم ربط Firebase (Firebase Linked)</option>
                            <option value="deployed">تم النشر (Deployed)</option>
                            <option value="delivered">تم التسليم للعميل (Delivered)</option>
                          </select>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              onClick={() => handleLoadCustomerIntoConfigurator(c)}
                              className="admin-btn admin-btn--outline"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                            >
                              تجهيز المحتوى
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomerRecord(c.id, c.customerName)}
                              className="admin-icon-btn admin-icon-btn--delete"
                              title="حذف السجل"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: THEMES STUDIO */}
        {activeTab === 'themes' && (
          <div className="admin-section">
            <ThemeManager
              activeThemeId={activeThemeId}
              selectedThemeId={configData.theme || DEFAULT_THEME_ID}
              configData={configData}
              saving={savingConfig}
              onSelectTheme={(id) => handleConfigChange(null, 'theme', id)}
              onApplyAndSaveTheme={handleApplyAndSaveTheme}
              onCloseAdmin={onClose}
            />
          </div>
        )}

        {/* TAB 3: EVENT TYPE, CONTENT & DYNAMIC SECTIONS CONFIGURATOR */}
        {activeTab === 'config' && (
          <div className="admin-section">
            <div className="admin-config-header">
              <div>
                <h2 className="admin-section-title font-serif">تجهيز إعدادات المناسبة والمحتوى للعميل</h2>
                <p className="admin-section-desc">
                  اختر نوع المناسبة (10 أنواع مدعومة)، وعدّل البيانات، الأقسام الديناميكية، وقائمة الهدايا، ثم قم بتحميل ملف <code>weddingConfig.js</code> أو حفظه في مشروع Firebase الخاص بالعميل.
                </p>
              </div>
              <div className="admin-btn-group">
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="admin-btn admin-btn--primary"
                >
                  <Save size={18} />
                  <span>{savingConfig ? 'جارٍ الحفظ...' : 'حفظ وتطبيق الإعدادات'}</span>
                </button>
                <button
                  onClick={() => downloadConfigFile(configData)}
                  className="admin-btn admin-btn--outline"
                >
                  <Download size={18} />
                  <span>تصدير weddingConfig.js</span>
                </button>
                <button onClick={handleResetConfig} className="admin-btn admin-btn--ghost">
                  استعادة الافتراضي
                </button>
              </div>
            </div>

            <div className="admin-config-grid">
              {/* Event Type Selector Card (Phase 3 — 10 Event Types) */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Sparkles size={20} />
                  نوع المناسبة (Event Type Engine — 10 أنواع مدعومة)
                </h3>
                <div className="admin-form-grid-2">
                  <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="admin-label">اختر نوع المناسبة</label>
                    <select
                      className="admin-input admin-select"
                      value={configData.eventType || DEFAULT_EVENT_TYPE_ID}
                      onChange={(e) => handleConfigChange(null, 'eventType', e.target.value)}
                    >
                      {EVENT_TYPES.map((et) => (
                        <option key={et.id} value={et.id}>
                          {et.nameAr} — ({et.mode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Couple / Honoree Details */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <HeartHandshake size={20} />
                  بيانات أصحاب المناسبة والعائلات (Couple / Honorees & Hosts)
                </h3>
                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-label">الاسم الأول / صاحب المناسبة (بالعربي)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.groom?.name || ''}
                      onChange={(e) => handleConfigChange('groom', 'name', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">الاسم الأول / صاحب المناسبة (English)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.groom?.nameEn || ''}
                      onChange={(e) => handleConfigChange('groom', 'nameEn', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">الاسم الثاني / الشريك (بالعربي)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.bride?.name || ''}
                      onChange={(e) => handleConfigChange('bride', 'name', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">الاسم الثاني / الشريك (English)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.bride?.nameEn || ''}
                      onChange={(e) => handleConfigChange('bride', 'nameEn', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">لقب العائلة الأولى (بالعربي)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.groom?.familyTitleAr || ''}
                      onChange={(e) => handleConfigChange('groom', 'familyTitleAr', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">لقب العائلة الثانية (بالعربي)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.bride?.familyTitleAr || ''}
                      onChange={(e) => handleConfigChange('bride', 'familyTitleAr', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Date & Venue */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Calendar size={20} />
                  الموعد والمكان (Date & Venue)
                </h3>
                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-label">التاريخ (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      className="admin-input"
                      value={configData.wedding?.date || ''}
                      onChange={(e) => handleConfigChange('wedding', 'date', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">
                      <Clock size={14} style={{ marginInlineEnd: '0.35rem', verticalAlign: 'middle' }} />
                      وقت بدء الحفل (Event Start Time)
                    </label>
                    <input
                      id="wedding-start-time-input"
                      type="time"
                      className="admin-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      value={getEventStartTime24h(configData.wedding)}
                      onChange={(e) => handleEventStartTimeChange(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">عرض الوقت (English — يضبط أول فقرة بالأجندة)</label>
                    <input
                      id="wedding-time-en-input"
                      type="text"
                      className="admin-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      placeholder="8:00 PM"
                      value={configData.wedding?.timeEn || ''}
                      onChange={(e) => handleConfigChange('wedding', 'timeEn', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">عرض الوقت (بالعربي)</label>
                    <input
                      id="wedding-time-ar-input"
                      type="text"
                      className="admin-input"
                      placeholder="٨:٠٠ مساءً"
                      value={configData.wedding?.time || ''}
                      onChange={(e) => handleConfigChange('wedding', 'time', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                    {(() => {
                      const previewAgenda = syncAgendaWithStartTime(
                        configData.agenda,
                        configData.wedding,
                        { useGoldenDefaults: true }
                      );
                      const firstItem = previewAgenda[0];
                      return (
                        <div
                          style={{
                            background: 'rgba(212, 175, 55, 0.08)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '10px',
                            padding: '0.75rem 1rem',
                            fontSize: '0.84rem',
                            color: '#e5dec9',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                          }}
                        >
                          <span>
                            🕒 أول فقرة في الأجندة تتطابق تلقائياً مع وقت بدء الحفل:{' '}
                            <strong style={{ color: '#d4af37' }}>
                              {firstItem?.timeEn} ({firstItem?.timeAr})
                            </strong>
                          </span>
                          <span style={{ color: '#a89f91' }}>
                            {firstItem?.titleEn}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">تاريخ ISO للعد التنازلي</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      value={configData.wedding?.dateTime || ''}
                      onChange={(e) => handleConfigChange('wedding', 'dateTime', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">عرض التاريخ (بالعربي)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.wedding?.dateDisplay || ''}
                      onChange={(e) => handleConfigChange('wedding', 'dateDisplay', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">عرض التاريخ (English)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.wedding?.dateDisplayEn || ''}
                      onChange={(e) => handleConfigChange('wedding', 'dateDisplayEn', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">اسم المكان / القاعة (بالعربي)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.venue?.nameAr || ''}
                      onChange={(e) => handleConfigChange('venue', 'nameAr', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">اسم المكان / القاعة (English)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.venue?.nameEn || ''}
                      onChange={(e) => handleConfigChange('venue', 'nameEn', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="admin-label">رابط خرائط جوجل (Google Maps URL)</label>
                    <input
                      type="url"
                      className="admin-input"
                      value={configData.venue?.mapsUrl || ''}
                      onChange={(e) => handleConfigChange('venue', 'mapsUrl', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Event Agenda Items Editor */}
              <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
                {(() => {
                  const editableAgenda = syncAgendaWithStartTime(
                    configData.agenda,
                    configData.wedding,
                    { useGoldenDefaults: true }
                  );
                  return (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <div>
                          <h3 className="admin-card-title" style={{ marginBottom: '0.25rem' }}>
                            <Clock size={20} />
                            برنامج وفقرات الاحتفال (Event Agenda — The Order of Events)
                          </h3>
                          <p style={{ fontSize: '0.84rem', color: '#a89f91', margin: 0 }}>
                            عدّل عناوين ووصف كل فقرة أو أضف/احذف فقرات. وقت الفقرة الأولى (#1) يتطابق تلقائياً مع وقت بدء الحفل أعلاه.
                          </p>
                        </div>

                        <div className="admin-btn-group">
                          <button
                            id="btn-add-agenda-item"
                            type="button"
                            onClick={handleAddAgendaItem}
                            className="admin-btn admin-btn--primary admin-btn--sm"
                          >
                            <Plus size={16} />
                            <span>إضافة فقرة جديدة</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleResetAgendaItems}
                            className="admin-btn admin-btn--outline admin-btn--sm"
                          >
                            <span>استعادة الافتراضي</span>
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {editableAgenda.map((slot, idx) => {
                          const isFirst = idx === 0;
                          const slotMins = parseTimeToMinutes(slot.timeEn || slot.timeAr);
                          const slotTime24 =
                            slotMins !== null
                              ? formatMinutesTo24h(slotMins)
                              : getEventStartTime24h(configData.wedding);

                          return (
                            <div
                              key={slot.id || idx}
                              style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: isFirst
                                  ? '1px solid rgba(212, 175, 55, 0.45)'
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                padding: '0.95rem 1rem',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '0.5rem',
                                  marginBottom: '0.75rem',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                  <span className="admin-badge admin-badge--gold">#{idx + 1}</span>
                                  <strong style={{ color: '#d4af37', fontSize: '0.9rem' }}>
                                    {slot.timeEn} ({slot.timeAr})
                                  </strong>
                                  {isFirst && (
                                    <span className="admin-badge admin-badge--success">
                                      مربوط تلقائياً بوقت بدء الحفل (Event Start Time)
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  disabled={editableAgenda.length <= 1}
                                  onClick={() => handleDeleteAgendaItem(idx)}
                                  className="admin-btn admin-btn--danger-sm"
                                  style={{ opacity: editableAgenda.length <= 1 ? 0.4 : 1 }}
                                  title="حذف هذه الفقرة"
                                >
                                  <Trash2 size={14} />
                                  <span>حذف</span>
                                </button>
                              </div>

                              <div className="admin-form-grid-2">
                                {!isFirst && (
                                  <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="admin-label">
                                      وقت الفقرة #{idx + 1} (Time — يتبع الترتيب الزمني تلقائياً)
                                    </label>
                                    <input
                                      type="time"
                                      className="admin-input"
                                      style={{ maxWidth: '220px', direction: 'ltr', textAlign: 'left' }}
                                      value={slotTime24}
                                      onChange={(e) =>
                                        handleUpdateAgendaItem(idx, 'time24', e.target.value)
                                      }
                                    />
                                  </div>
                                )}

                                <div className="admin-form-group">
                                  <label className="admin-label">عنوان الفقرة (بالعربي)</label>
                                  <input
                                    type="text"
                                    className="admin-input"
                                    value={slot.titleAr || ''}
                                    onChange={(e) =>
                                      handleUpdateAgendaItem(idx, 'titleAr', e.target.value)
                                    }
                                    placeholder="مثال: استقبال الضيوف والترحيب"
                                  />
                                </div>

                                <div className="admin-form-group">
                                  <label className="admin-label">Agenda Title (English)</label>
                                  <input
                                    type="text"
                                    className="admin-input"
                                    style={{ direction: 'ltr', textAlign: 'left' }}
                                    value={slot.titleEn || ''}
                                    onChange={(e) =>
                                      handleUpdateAgendaItem(idx, 'titleEn', e.target.value)
                                    }
                                    placeholder="e.g. Guest Arrival & Welcome Drinks"
                                  />
                                </div>

                                <div className="admin-form-group">
                                  <label className="admin-label">وصف الفقرة (بالعربي)</label>
                                  <input
                                    type="text"
                                    className="admin-input"
                                    value={slot.descriptionAr || ''}
                                    onChange={(e) =>
                                      handleUpdateAgendaItem(idx, 'descriptionAr', e.target.value)
                                    }
                                    placeholder="وصف مختصر للفقرة..."
                                  />
                                </div>

                                <div className="admin-form-group">
                                  <label className="admin-label">Description (English)</label>
                                  <input
                                    type="text"
                                    className="admin-input"
                                    style={{ direction: 'ltr', textAlign: 'left' }}
                                    value={slot.descriptionEn || ''}
                                    onChange={(e) =>
                                      handleUpdateAgendaItem(idx, 'descriptionEn', e.target.value)
                                    }
                                    placeholder="Short description for guests..."
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Event-Specific Dress Code Configuration */}
              <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
                {(() => {
                  const normalizedByEvent = normalizeDressCodeByEventType(
                    configData.dressCode?.byEventType
                  );
                  const currentEventDc = normalizedByEvent[dressCodeEventType] || {};
                  const currentEventDefaults = getDefaultDressCodeForEventType(dressCodeEventType);
                  const isEditingWedding = dressCodeEventType === 'wedding';
                  const isActiveEventType =
                    dressCodeEventType === (configData.eventType || DEFAULT_EVENT_TYPE_ID);
                  const selectedBrownShade = isEditingWedding
                    ? getWeddingBrownShadeById(currentEventDc.ladiesBrownShade)
                    : null;
                  const selectedEtMeta = getEventTypeById(dressCodeEventType);

                  return (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <h3 className="admin-card-title" style={{ margin: 0 }}>
                          <Palette size={20} />
                          إعدادات دليل الأناقة حسب نوع المناسبة (Event-Specific Dress Code)
                        </h3>

                        <label className="admin-toggle-label" style={{ margin: 0, fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={configData.dressCode?.enabled !== false}
                            onChange={(e) =>
                              handleConfigChange('dressCode', 'enabled', e.target.checked)
                            }
                          />
                          <span>تفعيل قسم الدريس كود</span>
                        </label>
                      </div>

                      <div className="admin-form-grid-2" style={{ marginBottom: '1rem' }}>
                        <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="admin-label">
                            تخصيص دليل الأناقة لنوع المناسبة (مستقل لكل نوع مناسبة):
                          </label>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                              id="dresscode-event-type-select"
                              className="admin-input admin-select"
                              style={{ flex: '1 1 260px' }}
                              value={dressCodeEventType}
                              onChange={(e) => setDressCodeEventType(e.target.value)}
                            >
                              {EVENT_TYPES.map((et) => (
                                <option key={et.id} value={et.id}>
                                  {et.nameAr}
                                  {et.id === (configData.eventType || DEFAULT_EVENT_TYPE_ID)
                                    ? ' — (النوع النشط حالياً / Active)'
                                    : ''}
                                </option>
                              ))}
                            </select>
                            <span
                              className={`admin-badge ${isActiveEventType ? 'admin-badge--success' : 'admin-badge--warning'
                                }`}
                            >
                              {isActiveEventType
                                ? 'يُعرض حالياً على الدعوة العامة'
                                : `إعداد مستقل لـ ${selectedEtMeta.nameEn}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Wedding-Only Ladies Solid Brown Shade Selector */}
                      {isEditingWedding ? (
                        <div
                          style={{
                            background: 'rgba(212, 175, 55, 0.08)',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            borderRadius: '12px',
                            padding: '1.15rem',
                            marginBottom: '1.15rem',
                          }}
                        >
                          <div className="admin-form-grid-2" style={{ alignItems: 'center' }}>
                            <div className="admin-form-group">
                              <label
                                htmlFor="wedding-ladies-brown-shade-select"
                                className="admin-label"
                                style={{ color: '#d4af37', fontWeight: 700 }}
                              >
                                درجة اللون البني السادة المسموح بها للسيدات — خاص بحفل الزفاف (Wedding Only)
                              </label>
                              <select
                                id="wedding-ladies-brown-shade-select"
                                className="admin-input admin-select"
                                value={selectedBrownShade.id}
                                onChange={(e) =>
                                  handleEventDressCodeChange(
                                    'wedding',
                                    'ladiesBrownShade',
                                    e.target.value
                                  )
                                }
                              >
                                {WEDDING_LADIES_BROWN_SHADES.map((shade) => (
                                  <option key={shade.id} value={shade.id}>
                                    {shade.nameEn} — {shade.nameAr} ({shade.hex})
                                  </option>
                                ))}
                              </select>
                              <small style={{ color: '#a89f91', marginTop: '0.35rem', display: 'block' }}>
                                هذا الاختيار مخصص لنوع مناسبة الزفاف (Wedding) فقط ولا يؤثر على الخطوبة أو أي مناسبة أخرى.
                              </small>
                            </div>

                            {/* Visual Color Preview */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                background: 'rgba(18, 16, 14, 0.65)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                borderRadius: '10px',
                                padding: '0.85rem 1rem',
                              }}
                            >
                              <span
                                aria-label={selectedBrownShade.nameEn}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  backgroundColor: selectedBrownShade.hex,
                                  border: '2px solid #FAF8F3',
                                  boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.6)',
                                  flexShrink: 0,
                                }}
                              />
                              <div>
                                <div style={{ color: '#f8f4ef', fontWeight: 700, fontSize: '0.96rem' }}>
                                  {selectedBrownShade.nameEn} · {selectedBrownShade.nameAr}
                                </div>
                                <div style={{ color: '#c4b5a0', fontSize: '0.82rem', marginTop: '2px' }}>
                                  {selectedBrownShade.descriptionEn} ({selectedBrownShade.hex})
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Visual Quick-Select Brown Shade Swatches */}
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.55rem',
                              marginTop: '0.9rem',
                              paddingTop: '0.75rem',
                              borderTop: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {WEDDING_LADIES_BROWN_SHADES.map((shade) => {
                              const active = shade.id === selectedBrownShade.id;
                              return (
                                <button
                                  key={shade.id}
                                  type="button"
                                  onClick={() =>
                                    handleEventDressCodeChange(
                                      'wedding',
                                      'ladiesBrownShade',
                                      shade.id
                                    )
                                  }
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.35rem 0.7rem',
                                    borderRadius: '999px',
                                    background: active
                                      ? 'rgba(212, 175, 55, 0.22)'
                                      : 'rgba(255, 255, 255, 0.04)',
                                    border: active
                                      ? '1px solid #d4af37'
                                      : '1px solid rgba(255, 255, 255, 0.12)',
                                    color: active ? '#f8f4ef' : '#c4b5a0',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '14px',
                                      height: '14px',
                                      borderRadius: '50%',
                                      backgroundColor: shade.hex,
                                      border: '1px solid rgba(255,255,255,0.5)',
                                    }}
                                  />
                                  <span>{shade.nameEn}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const activePresetId =
                            currentEventDc.ladiesPalettePreset ||
                            currentEventDefaults.ladiesPalettePreset ||
                            'soft-pastels';
                          const activePreset =
                            getLadiesPalettePresetById(activePresetId) ||
                            LADIES_PALETTE_PRESETS[0];
                          const previewColors =
                            activePreset?.colors || currentEventDefaults.womenColors || [];

                          return (
                            <div
                              style={{
                                background: 'rgba(212, 175, 55, 0.06)',
                                border: '1px solid rgba(212, 175, 55, 0.25)',
                                borderRadius: '12px',
                                padding: '1.1rem',
                                marginBottom: '1.1rem',
                              }}
                            >
                              <div className="admin-form-grid-2" style={{ alignItems: 'center' }}>
                                <div className="admin-form-group">
                                  <label
                                    htmlFor="event-ladies-palette-select"
                                    className="admin-label"
                                    style={{ color: '#d4af37', fontWeight: 700 }}
                                  >
                                    باليت ألوان السيدات لـ {selectedEtMeta.nameEn} (Ladies Color Palette)
                                  </label>
                                  <select
                                    id="event-ladies-palette-select"
                                    className="admin-input admin-select"
                                    value={activePresetId}
                                    onChange={(e) =>
                                      handleEventDressCodeChange(
                                        dressCodeEventType,
                                        'ladiesPalettePreset',
                                        e.target.value
                                      )
                                    }
                                  >
                                    {LADIES_PALETTE_PRESETS.map((preset) => (
                                      <option key={preset.id} value={preset.id}>
                                        {preset.nameEn} — {preset.nameAr}
                                      </option>
                                    ))}
                                  </select>
                                  <small style={{ color: '#a89f91', marginTop: '0.35rem', display: 'block' }}>
                                    مستقل تماماً عن إعدادات حفل الزفاف (Wedding) والمناسبات الأخرى.
                                  </small>
                                </div>

                                <div
                                  style={{
                                    background: 'rgba(18, 16, 14, 0.65)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    padding: '0.85rem 1rem',
                                  }}
                                >
                                  <div style={{ color: '#f8f4ef', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                                    {activePreset.nameEn} · {activePreset.nameAr}
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                    {previewColors.map((c, idx) => (
                                      <div
                                        key={idx}
                                        title={`${c.nameEn} (${c.nameAr})`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: '#c4b5a0' }}
                                      >
                                        <span
                                          style={{
                                            width: '22px',
                                            height: '22px',
                                            borderRadius: '50%',
                                            backgroundColor: c.hex,
                                            border: '1.5px solid rgba(255,255,255,0.55)',
                                            display: 'inline-block',
                                          }}
                                        />
                                        <span>{c.nameEn}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <button
                                  type="button"
                                  onClick={() => setDressCodeEventType('wedding')}
                                  className="admin-btn admin-btn--outline admin-btn--sm"
                                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                                >
                                  <Palette size={14} />
                                  <span>عرض قائمة درجة البني السادة الخاصة بحفل الزفاف (Wedding Dropdown)</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {/* Event-Type-Specific Extensible Text Overrides */}
                      <div className="admin-form-grid-2">
                        <div className="admin-form-group">
                          <label className="admin-label">
                            وصف إطلالة الرجال لـ {selectedEtMeta.nameEn} (بالعربي — اختياري)
                          </label>
                          <input
                            type="text"
                            className="admin-input"
                            placeholder={currentEventDefaults.gentlemenDescAr || ''}
                            value={currentEventDc.gentlemenDescAr || ''}
                            onChange={(e) =>
                              handleEventDressCodeChange(
                                dressCodeEventType,
                                'gentlemenDescAr',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">
                            Gentlemen Attire for {selectedEtMeta.nameEn} (English — optional)
                          </label>
                          <input
                            type="text"
                            className="admin-input"
                            placeholder={currentEventDefaults.gentlemenDescEn || ''}
                            value={currentEventDc.gentlemenDescEn || ''}
                            onChange={(e) =>
                              handleEventDressCodeChange(
                                dressCodeEventType,
                                'gentlemenDescEn',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">
                            وصف إطلالة السيدات لـ {selectedEtMeta.nameEn} (بالعربي — اختياري)
                          </label>
                          <input
                            type="text"
                            className="admin-input"
                            placeholder={
                              isEditingWedding
                                ? `اتركه فارغاً للعرض التلقائي: ${selectedBrownShade.nameAr}`
                                : currentEventDefaults.ladiesDescAr || ''
                            }
                            value={currentEventDc.ladiesDescAr || ''}
                            onChange={(e) =>
                              handleEventDressCodeChange(
                                dressCodeEventType,
                                'ladiesDescAr',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">
                            Ladies Attire for {selectedEtMeta.nameEn} (English — optional)
                          </label>
                          <input
                            type="text"
                            className="admin-input"
                            placeholder={
                              isEditingWedding
                                ? `Leave blank to auto-display ${selectedBrownShade.nameEn}`
                                : currentEventDefaults.ladiesDescEn || ''
                            }
                            value={currentEventDc.ladiesDescEn || ''}
                            onChange={(e) =>
                              handleEventDressCodeChange(
                                dressCodeEventType,
                                'ladiesDescEn',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">
                            ملاحظة الدريس كود لـ {selectedEtMeta.nameEn} (بالعربي — اختياري)
                          </label>
                          <input
                            type="text"
                            className="admin-input"
                            placeholder={currentEventDefaults.noteDescAr || ''}
                            value={currentEventDc.noteDescAr || ''}
                            onChange={(e) =>
                              handleEventDressCodeChange(
                                dressCodeEventType,
                                'noteDescAr',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">
                            Dress Code Note for {selectedEtMeta.nameEn} (English — optional)
                          </label>
                          <input
                            type="text"
                            className="admin-input"
                            placeholder={currentEventDefaults.noteDescEn || ''}
                            value={currentEventDc.noteDescEn || ''}
                            onChange={(e) =>
                              handleEventDressCodeChange(
                                dressCodeEventType,
                                'noteDescEn',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Gifts / Wishlist */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Gift size={20} />
                  قسم الهدايا والتحويل الرقمي (Wishlist & Gifting)
                </h3>
                <label className="admin-toggle-label" style={{ marginBottom: '1rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={configData.wishlist?.enabled === true}
                    onChange={(e) => handleConfigChange('wishlist', 'enabled', e.target.checked)}
                  />
                  <span>تفعيل ظهور قسم الهدايا في الدعوة</span>
                </label>
                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-label">حساب انستاباي (Instapay)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.wishlist?.instapay || ''}
                      onChange={(e) => handleConfigChange('wishlist', 'instapay', e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">الحساب البنكي / IBAN</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={configData.wishlist?.bankAccount || ''}
                      onChange={(e) => handleConfigChange('wishlist', 'bankAccount', e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-wishlist-header-row" style={{ marginTop: '1rem' }}>
                  <h4 className="admin-subset-title" style={{ margin: 0 }}>قائمة الهدايا المقترحة</h4>
                  <button
                    type="button"
                    onClick={handleAddWishlistItem}
                    className="admin-btn admin-btn--primary admin-btn--sm"
                  >
                    <Plus size={16} />
                    <span>إضافة هدية</span>
                  </button>
                </div>

                {Array.isArray(configData.wishlist?.items) && configData.wishlist.items.length > 0 && (
                  <div className="admin-wishlist-items-list" style={{ marginTop: '0.75rem' }}>
                    {configData.wishlist.items.map((item, idx) => (
                      <div key={item.id || idx} className="admin-wishlist-item-card">
                        <div className="admin-wishlist-item-top">
                          <strong>#{idx + 1}</strong>
                          <button
                            type="button"
                            onClick={() => handleDeleteWishlistItem(item.id)}
                            className="admin-btn admin-btn--danger-sm"
                          >
                            <Trash2 size={14} /> حذف
                          </button>
                        </div>
                        <div className="admin-form-grid-2">
                          <div className="admin-form-group">
                            <label className="admin-label">اسم الهدية (عربي)</label>
                            <input
                              type="text"
                              className="admin-input"
                              value={item.titleAr || ''}
                              onChange={(e) => handleUpdateWishlistItem(item.id, 'titleAr', e.target.value)}
                            />
                          </div>
                          <div className="admin-form-group">
                            <label className="admin-label">اسم الهدية (English)</label>
                            <input
                              type="text"
                              className="admin-input"
                              value={item.titleEn || ''}
                              onChange={(e) => handleUpdateWishlistItem(item.id, 'titleEn', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Music & Section Toggles */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  <Music size={20} />
                  الموسيقى واللغة وتفعيل الأقسام
                </h3>
                <div className="admin-toggles-grid">
                  <label className="admin-toggle-label">
                    <input
                      type="checkbox"
                      checked={configData.music?.enabled === true}
                      onChange={(e) => handleConfigChange('music', 'enabled', e.target.checked)}
                    />
                    <span>تشغيل الموسيقى (Music)</span>
                  </label>
                  <label className="admin-toggle-label">
                    <input
                      type="checkbox"
                      checked={configData.gallery?.enabled === true}
                      onChange={(e) => handleConfigChange('gallery', 'enabled', e.target.checked)}
                    />
                    <span>معرض الصور (Gallery)</span>
                  </label>
                  <label className="admin-toggle-label">
                    <input
                      type="checkbox"
                      checked={configData.dressCode?.enabled === true}
                      onChange={(e) => handleConfigChange('dressCode', 'enabled', e.target.checked)}
                    />
                    <span>الدريس كود (Dress Code)</span>
                  </label>
                  <label className="admin-toggle-label">
                    <input
                      type="checkbox"
                      checked={configData.rsvp?.enabled === true}
                      onChange={(e) => handleConfigChange('rsvp', 'enabled', e.target.checked)}
                    />
                    <span>تأكيد الحضور (RSVP)</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Sections & Custom Sections Manager */}
              <DynamicSectionsEditor
                configData={configData}
                setConfigData={setConfigData}
                showToast={showToast}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OwnerAdmin;
