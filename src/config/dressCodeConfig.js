/**
 * ============================================================================
 * EVENT-SPECIFIC DRESS CODE CONFIGURATION
 * ============================================================================
 * Keeps dress code options cleanly isolated per event type (wedding, engagement,
 * birthday, graduation, corporate, etc.) so Wedding-specific rules (such as the
 * permitted solid brown shade for ladies) never apply to other event types.
 *
 * Easily extensible: add additional event-specific fields or option catalogs
 * per eventType key without modifying unrelated components.
 * ============================================================================
 */

import { DEFAULT_EVENT_TYPE_ID } from './eventTypesConfig.js';

export const DEFAULT_MEN_COLORS = [
  { hex: '#1C1C1E', nameAr: 'أسود', nameEn: 'Black' },
  { hex: '#1B2A4A', nameAr: 'كحلي', nameEn: 'Navy Blue' },
  { hex: '#3A3D40', nameAr: 'رمادي داكن', nameEn: 'Charcoal' },
  { hex: '#A88B68', nameAr: 'لاتيه', nameEn: 'Latte / Taupe' },
  { hex: '#D6C5B3', nameAr: 'بيج دافئ', nameEn: 'Warm Beige' },
];

export const DEFAULT_WOMEN_PASTEL_COLORS = [
  { hex: '#F2C4CE', nameAr: 'وردي باستيل', nameEn: 'Blush Pink' },
  { hex: '#D4A5A5', nameAr: 'روز هادئ', nameEn: 'Dusty Rose' },
  { hex: '#C8D5C0', nameAr: 'ميرمية', nameEn: 'Soft Sage' },
  { hex: '#DCD0E6', nameAr: 'لافندر', nameEn: 'Lavender' },
  { hex: '#B8C9E0', nameAr: 'بيبي بلو', nameEn: 'Baby Blue' },
  { hex: '#F5E2CE', nameAr: 'شامبين', nameEn: 'Champagne' },
];

/**
 * Permitted solid brown shades for ladies at Wedding events.
 * Admin selects one via dropdown in Owner Admin; persisted in Firestore under
 * `config/wedding -> dressCode.byEventType.wedding.ladiesBrownShade`.
 */
export const WEDDING_LADIES_BROWN_SHADES = [
  {
    id: 'espresso',
    hex: '#3B2417',
    nameEn: 'Espresso Brown',
    nameAr: 'بني إسبريسو داكن',
    descriptionEn: 'Deep, rich solid espresso brown',
    descriptionAr: 'بني إسبريسو داكن وغني سادة',
  },
  {
    id: 'chocolate',
    hex: '#4E2F1E',
    nameEn: 'Dark Chocolate',
    nameAr: 'بني شوكولاتة داكن',
    descriptionEn: 'Classic rich solid chocolate brown',
    descriptionAr: 'بني شوكولاتة كلاسيكي سادة',
  },
  {
    id: 'chestnut',
    hex: '#6B4423',
    nameEn: 'Warm Chestnut',
    nameAr: 'بني كستنائي دافئ',
    descriptionEn: 'Warm medium-dark solid chestnut brown',
    descriptionAr: 'بني كستنائي دافئ سادة',
  },
  {
    id: 'mocha',
    hex: '#7B5B44',
    nameEn: 'Mocha Brown',
    nameAr: 'بني موكا',
    descriptionEn: 'Smooth warm solid mocha brown',
    descriptionAr: 'بني موكا ناعم ودافئ سادة',
  },
  {
    id: 'cocoa',
    hex: '#8D6E63',
    nameEn: 'Soft Cocoa',
    nameAr: 'بني كاكاو هادئ',
    descriptionEn: 'Muted elegant solid cocoa brown',
    descriptionAr: 'بني كاكاو هادئ وأنيق سادة',
  },
  {
    id: 'caramel',
    hex: '#9C6B43',
    nameEn: 'Warm Caramel',
    nameAr: 'بني كراميل دافئ',
    descriptionEn: 'Golden solid caramel brown',
    descriptionAr: 'بني كراميل ذهبي سادة',
  },
];

export const DEFAULT_WEDDING_BROWN_SHADE_ID = 'mocha';

export const isValidWeddingBrownShadeId = (shadeId) => {
  if (!shadeId || typeof shadeId !== 'string') return false;
  return WEDDING_LADIES_BROWN_SHADES.some((s) => s.id === shadeId);
};

export const getWeddingBrownShadeById = (shadeId) => {
  return (
    WEDDING_LADIES_BROWN_SHADES.find((s) => s.id === shadeId) ||
    WEDDING_LADIES_BROWN_SHADES.find((s) => s.id === DEFAULT_WEDDING_BROWN_SHADE_ID) ||
    WEDDING_LADIES_BROWN_SHADES[0]
  );
};

/**
 * Independent dress code defaults per event type.
 * Only `wedding` defines `ladiesBrownShade` and enforces the wedding solid brown
 * shade selector; all other event types stay strictly separate.
 */
export const EVENT_DRESS_CODE_DEFAULTS = {
  wedding: {
    ladiesBrownShade: DEFAULT_WEDDING_BROWN_SHADE_ID,
    menColors: DEFAULT_MEN_COLORS,
    gentlemenDescEn:
      'Any comfortable suit in classic dark or warm earthy tones (Black, Navy, Charcoal, Latte, Beige)',
    gentlemenDescAr:
      'بدلة أنيقة ومريحة بالألوان الكلاسيكية أو الترابية (أسود، كحلي، رمادي داكن، لاتيه، بيج)',
    noteTitleEn: 'Kindly Note',
    noteTitleAr: 'ملاحظة لطيفة',
    noteDescEn:
      'We kindly request guests to avoid pure white or ivory dresses to let the bride shine.',
    noteDescAr:
      'نرجو لطفاً تجنب ارتداء اللون الأبيض الناصع أو الأوف وايت لإبراز إطلالة العروس.',
  },
  engagement: {
    menColors: DEFAULT_MEN_COLORS,
    womenColors: DEFAULT_WOMEN_PASTEL_COLORS,
    gentlemenDescEn:
      'Any comfortable suit in classic dark or warm earthy tones (Black, Navy, Charcoal, Latte, Beige)',
    gentlemenDescAr:
      'بدلة أنيقة ومريحة بالألوان الكلاسيكية أو الترابية (أسود، كحلي، رمادي داكن، لاتيه، بيج)',
    ladiesDescEn:
      'Elegant dresses in delicate, soft pastel shades (Blush Pink, Dusty Rose, Soft Sage, Lavender, Baby Blue, Champagne)',
    ladiesDescAr:
      'فساتين أنيقة بألوان الباستيل الهادئة والرقيقة (وردي، روز هادئ، ميرمية، لافندر، بيبي بلو، شامبين)',
    noteTitleEn: 'Kindly Note',
    noteTitleAr: 'ملاحظة لطيفة',
    noteDescEn:
      'We kindly request guests to avoid pure white or ivory dresses to let the bride shine.',
    noteDescAr:
      'نرجو لطفاً تجنب ارتداء اللون الأبيض الناصع أو الأوف وايت لإبراز إطلالة العروس.',
  },
  birthday: {
    menColors: DEFAULT_MEN_COLORS,
    womenColors: DEFAULT_WOMEN_PASTEL_COLORS,
    gentlemenDescEn: 'Smart casual or festive evening attire in comfortable classic tones',
    gentlemenDescAr: 'إطلالة سمارت كاجوال أو احتفالية أنيقة بألوان مريحة وكلاسيكية',
    ladiesDescEn: 'Chic festive dresses or smart evening outfits in vibrant or pastel shades',
    ladiesDescAr: 'فساتين احتفالية أنيقة أو إطلالات مسائية راقية بألوان مبهجة أو باستيل',
    noteTitleEn: 'Style Tip',
    noteTitleAr: 'ملاحظة للأناقة',
    noteDescEn: 'Come dressed comfortably and ready to celebrate!',
    noteDescAr: 'ارتدوا ما يشعركم بالراحة والأناقة للاستمتاع بالاحتفال!',
  },
  graduation: {
    menColors: DEFAULT_MEN_COLORS,
    womenColors: DEFAULT_WOMEN_PASTEL_COLORS,
    gentlemenDescEn: 'Semi-formal suits or smart blazers in classic dark or neutral tones',
    gentlemenDescAr: 'بدلة شبه رسمية أو بليزر أنيق بألوان كلاسيكية داكنة أو محايدة',
    ladiesDescEn: 'Elegant semi-formal dresses or tailored outfits in refined soft tones',
    ladiesDescAr: 'فساتين شبه رسمية أنيقة أو إطلالات راقية بدرجات ناعمة ومميزة',
    noteTitleEn: 'Celebration Note',
    noteTitleAr: 'ملاحظة الحفل',
    noteDescEn: 'Semi-formal attire is recommended for graduation photos and evening festivities.',
    noteDescAr: 'يُفضل ارتداء ملابس شبه رسمية لالتقاط الصور التذكارية والاحتفال.',
  },
  corporate: {
    menColors: DEFAULT_MEN_COLORS.slice(0, 3),
    womenColors: [
      { hex: '#1B2A4A', nameAr: 'كحلي رسمي', nameEn: 'Executive Navy' },
      { hex: '#3A3D40', nameAr: 'رمادي فحمي', nameEn: 'Charcoal' },
      { hex: '#D6C5B3', nameAr: 'بيج كلاسيكي', nameEn: 'Classic Beige' },
      { hex: '#2F4F4F', nameAr: 'أخضر زمردي داكن', nameEn: 'Deep Slate' },
    ],
    gentlemenDescEn: 'Business formal or executive attire in classic dark tones (Black, Navy, Charcoal)',
    gentlemenDescAr: 'ملابس رسمية للأعمال (Business Formal) بألوان كلاسيكية داكنة (أسود، كحلي، رمادي داكن)',
    ladiesDescEn: 'Business formal or tailored evening attire in refined executive tones',
    ladiesDescAr: 'إطلالة رسمية أنيقة للأعمال أو المساء بألوان راقية ومحايدة',
    noteTitleEn: 'Dress Code Policy',
    noteTitleAr: 'إرشادات الحضور',
    noteDescEn: 'Business formal or smart executive attire is appreciated for all attendees.',
    noteDescAr: 'نرجو الالتزام بالزي الرسمي للأعمال (Business Formal) لجميع الضيوف.',
  },
  conference: {
    menColors: DEFAULT_MEN_COLORS.slice(0, 4),
    womenColors: [
      { hex: '#1B2A4A', nameAr: 'كحلي', nameEn: 'Navy' },
      { hex: '#3A3D40', nameAr: 'رمادي', nameEn: 'Charcoal' },
      { hex: '#D6C5B3', nameAr: 'بيج', nameEn: 'Warm Beige' },
      { hex: '#B8C9E0', nameAr: 'أزرق سماوي', nameEn: 'Light Blue' },
    ],
    gentlemenDescEn: 'Business casual or smart business attire suitable for conference sessions',
    gentlemenDescAr: 'ملابس أعمال مريحة (Business Casual) مناسبة لجلسات المؤتمر',
    ladiesDescEn: 'Smart business or business casual attire in clean professional tones',
    ladiesDescAr: 'إطلالة أعمال أنيقة ومريحة بألوان احترافية هادئة',
    noteTitleEn: 'Attendee Note',
    noteTitleAr: 'ملاحظة للمشاركين',
    noteDescEn: 'Comfortable professional attire is recommended throughout the summit.',
    noteDescAr: 'يُفضل اختيار ملابس احترافية مريحة طوال فعاليات المؤتمر.',
  },
};

/**
 * Returns the baseline dress code defaults for any supported event type.
 */
export const getDefaultDressCodeForEventType = (eventTypeId) => {
  const key = eventTypeId || DEFAULT_EVENT_TYPE_ID;
  return EVENT_DRESS_CODE_DEFAULTS[key] || EVENT_DRESS_CODE_DEFAULTS.engagement;
};

/**
 * Merges and normalizes `dressCode.byEventType` without leaking settings between event types.
 */
export const normalizeDressCodeByEventType = (rawByEventType = {}) => {
  const result = {};

  if (rawByEventType && typeof rawByEventType === 'object') {
    for (const [etKey, etVal] of Object.entries(rawByEventType)) {
      if (!etVal || typeof etVal !== 'object') continue;
      const cleaned = { ...etVal };
      if (etKey === 'wedding') {
        cleaned.ladiesBrownShade = isValidWeddingBrownShadeId(etVal.ladiesBrownShade)
          ? etVal.ladiesBrownShade
          : DEFAULT_WEDDING_BROWN_SHADE_ID;
      } else {
        // Never carry wedding's ladiesBrownShade into other event types
        delete cleaned.ladiesBrownShade;
      }
      result[etKey] = cleaned;
    }
  }

  // Ensure wedding always has its own valid default brown shade entry
  if (!result.wedding) {
    result.wedding = {
      ladiesBrownShade: DEFAULT_WEDDING_BROWN_SHADE_ID,
    };
  } else if (!isValidWeddingBrownShadeId(result.wedding.ladiesBrownShade)) {
    result.wedding.ladiesBrownShade = DEFAULT_WEDDING_BROWN_SHADE_ID;
  }

  return result;
};

/**
 * Gets the stored dress code config for a specific event type (for Owner Admin editing).
 */
export const getEventDressCodeEntry = (config, eventTypeId) => {
  const key = eventTypeId || config?.eventType || DEFAULT_EVENT_TYPE_ID;
  const byEventType = normalizeDressCodeByEventType(config?.dressCode?.byEventType);
  return byEventType[key] || {};
};

/**
 * Resolves all display values for the public invitation's DressCode component,
 * strictly scoped to `config.eventType`.
 */
export const resolveDressCodeForDisplay = (config = {}, t = (k) => k, isAr = false) => {
  const eventType = config?.eventType || DEFAULT_EVENT_TYPE_ID;
  const isWedding = eventType === 'wedding';
  const dc = config?.dressCode || {};
  const secCfg = config?.sections?.dressCode || {};
  const eventDefaults = getDefaultDressCodeForEventType(eventType);
  const eventDc = getEventDressCodeEntry(config, eventType);

  const sectionTitle = isAr
    ? secCfg.titleAr || eventDc.titleAr || dc.titleAr || t('dressCode.title')
    : secCfg.titleEn || eventDc.titleEn || dc.titleEn || t('dressCode.title');

  const sectionSubtitle = isAr
    ? secCfg.subtitleAr || eventDc.subtitleAr || dc.subtitleAr || t('dressCode.subtitle')
    : secCfg.subtitleEn || eventDc.subtitleEn || dc.subtitleEn || t('dressCode.subtitle');

  const gentlemenTitle = isAr
    ? eventDc.gentlemenTitleAr || dc.gentlemenTitleAr || t('dressCode.gentlemenTitle')
    : eventDc.gentlemenTitleEn || dc.gentlemenTitleEn || t('dressCode.gentlemenTitle');

  const gentlemenDesc = isAr
    ? eventDc.gentlemenDescAr || dc.gentlemenDescAr || eventDefaults.gentlemenDescAr || t('dressCode.gentlemenDesc')
    : eventDc.gentlemenDescEn || dc.gentlemenDescEn || eventDefaults.gentlemenDescEn || t('dressCode.gentlemenDesc');

  const ladiesTitle = isAr
    ? eventDc.ladiesTitleAr || dc.ladiesTitleAr || t('dressCode.ladiesTitle')
    : eventDc.ladiesTitleEn || dc.ladiesTitleEn || t('dressCode.ladiesTitle');

  // Wedding-specific permitted solid brown shade for ladies (strictly isolated to eventType === 'wedding')
  const ladiesSolidShade = isWedding
    ? getWeddingBrownShadeById(eventDc.ladiesBrownShade)
    : null;

  const defaultLadiesDescAr = isWedding && ladiesSolidShade
    ? `فساتين سادة أنيقة بدرجة ${ladiesSolidShade.nameAr} (${ladiesSolidShade.descriptionAr})`
    : eventDefaults.ladiesDescAr || t('dressCode.ladiesDesc');

  const defaultLadiesDescEn = isWedding && ladiesSolidShade
    ? `Elegant solid dresses in ${ladiesSolidShade.nameEn} (${ladiesSolidShade.descriptionEn})`
    : eventDefaults.ladiesDescEn || t('dressCode.ladiesDesc');

  const ladiesDesc = isAr
    ? eventDc.ladiesDescAr || dc.ladiesDescAr || defaultLadiesDescAr
    : eventDc.ladiesDescEn || dc.ladiesDescEn || defaultLadiesDescEn;

  const noteTitle = isAr
    ? eventDc.noteTitleAr || dc.noteTitleAr || eventDefaults.noteTitleAr || t('dressCode.noteTitle')
    : eventDc.noteTitleEn || dc.noteTitleEn || eventDefaults.noteTitleEn || t('dressCode.noteTitle');

  const noteDesc = isAr
    ? eventDc.noteDescAr || dc.noteDescAr || eventDefaults.noteDescAr || t('dressCode.noteDesc')
    : eventDc.noteDescEn || dc.noteDescEn || eventDefaults.noteDescEn || t('dressCode.noteDesc');

  const menColors =
    Array.isArray(eventDc.menColors) && eventDc.menColors.length > 0
      ? eventDc.menColors
      : Array.isArray(dc.menColors) && dc.menColors.length > 0
        ? dc.menColors
        : eventDefaults.menColors || DEFAULT_MEN_COLORS;

  const womenColors = isWedding && ladiesSolidShade
    ? [
        {
          hex: ladiesSolidShade.hex,
          nameAr: ladiesSolidShade.nameAr,
          nameEn: ladiesSolidShade.nameEn,
          descriptionAr: ladiesSolidShade.descriptionAr,
          descriptionEn: ladiesSolidShade.descriptionEn,
          id: ladiesSolidShade.id,
        },
      ]
    : Array.isArray(eventDc.womenColors) && eventDc.womenColors.length > 0
      ? eventDc.womenColors
      : Array.isArray(dc.womenColors) && dc.womenColors.length > 0
        ? dc.womenColors
        : eventDefaults.womenColors || DEFAULT_WOMEN_PASTEL_COLORS;

  const paletteLabelLadies =
    isWedding && ladiesSolidShade
      ? isAr
        ? 'درجة البني السادة المسموح بها:'
        : 'Permitted Solid Brown Shade:'
      : isAr
        ? 'درجات الألوان الموصى بها:'
        : 'Suggested Tone Palette:';

  return {
    eventType,
    isWedding,
    sectionTitle,
    sectionSubtitle,
    gentlemenTitle,
    gentlemenDesc,
    ladiesTitle,
    ladiesDesc,
    noteTitle,
    noteDesc,
    menColors,
    womenColors,
    ladiesSolidShade,
    paletteLabelLadies,
  };
};
