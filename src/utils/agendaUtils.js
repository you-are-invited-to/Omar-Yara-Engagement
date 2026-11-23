/**
 * ============================================================================
 * DYNAMIC EVENT AGENDA & START TIME UTILITIES
 * ============================================================================
 * Ensures the event's configured start time (`wedding.timeEn`, `wedding.time`,
 * `wedding.dateTime`) is the single source of truth for the first agenda item,
 * and preserves subsequent agenda items while maintaining valid chronological
 * sequencing.
 * ============================================================================
 */

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const toArabicDigits = (value) =>
  String(value).replace(/\d/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);

export const toWesternDigits = (value) =>
  String(value).replace(/[٠-٩]/g, (ch) => String(ARABIC_INDIC_DIGITS.indexOf(ch)));

/**
 * Default Golden Theme agenda structure defined using minute offsets from the
 * configured event start time (no hardcoded clock times).
 */
export const DEFAULT_GOLDEN_AGENDA_TEMPLATE = [
  {
    id: 'ag-1',
    offsetMinutes: 0,
    titleAr: 'استقبال الضيوف والترحيب',
    titleEn: 'Guest Arrival & Welcome Drinks',
    descriptionAr: 'بداية التجمع واستقبال الأحبة في القاعة',
    descriptionEn: 'Welcome reception and music as guests arrive',
  },
  {
    id: 'ag-2',
    offsetMinutes: 90,
    titleAr: 'دخول العروسين وبدء المراسم',
    titleEn: 'Grand Entrance & Ceremony',
    descriptionAr: 'لحظة الدخول وبداية مراسم الاحتفال الرسمية',
    descriptionEn: 'The grand entrance and official celebration ceremony',
  },
  {
    id: 'ag-3',
    offsetMinutes: 210,
    titleAr: 'مأدبة العشاء وتقطيع الكيك',
    titleEn: 'Dinner Reception & Cake Cutting',
    descriptionAr: 'مشاركة العشاء الاحتفالي واللحظات السعيدة',
    descriptionEn: 'Celebratory dinner, toasts, and cake cutting',
  },
  {
    id: 'ag-4',
    offsetMinutes: 300,
    titleAr: 'سهرة الاحتفال والرقص',
    titleEn: 'Evening Celebration & Dancing',
    descriptionAr: 'أجمل الأوقات الموسيقية والاحتفال حتى الختام',
    descriptionEn: 'Music, joy, and dancing under the lights',
  },
];

const DEFAULT_FALLBACK_START_MINUTES = 17 * 60; // 5:00 PM fallback if no config time exists
const DEFAULT_STEP_MINUTES = 60;

/**
 * Parses 12-hour EN ("8:00 PM"), 12-hour AR ("٨:٠٠ مساءً"), 24-hour ("20:00"),
 * or ISO datetime ("2026-11-24T20:00:00+02:00") into minutes since midnight (0..1439).
 */
export const parseTimeToMinutes = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const normalized = toWesternDigits(raw).trim();
  if (!normalized) return null;

  // 1. ISO datetime string (e.g. 2026-11-24T20:00:00+02:00)
  const isoMatch = normalized.match(/T(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (isoMatch) {
    const h = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return h * 60 + m;
    }
  }

  // 2. 12-hour format with AM/PM or Arabic صباحاً / مساءً
  const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(am|pm|ص|صباحا|صباحاً|م|مساء|مساءً)$/i);
  if (ampmMatch) {
    let h = Number(ampmMatch[1]);
    const m = Number(ampmMatch[2]);
    const period = ampmMatch[3].toLowerCase();
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    const isPm = period === 'pm' || period.startsWith('م');
    if (isPm && h !== 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return h * 60 + m;
  }

  // 3. 24-hour format (e.g. "20:00" or "08:30")
  const h24Match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (h24Match) {
    const h = Number(h24Match[1]);
    const m = Number(h24Match[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return h * 60 + m;
    }
  }

  return null;
};

const normalizeMinutesOfDay = (totalMinutes) => ((totalMinutes % 1440) + 1440) % 1440;

/**
 * Formats minutes since midnight into English 12-hour clock (e.g. "8:00 PM").
 */
export const formatMinutesToTimeEn = (totalMinutes) => {
  const mins = normalizeMinutesOfDay(totalMinutes);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

/**
 * Formats minutes since midnight into Arabic 12-hour clock (e.g. "٨:٠٠ مساءً").
 */
export const formatMinutesToTimeAr = (totalMinutes) => {
  const mins = normalizeMinutesOfDay(totalMinutes);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'مساءً' : 'صباحاً';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${toArabicDigits(h12)}:${toArabicDigits(String(m).padStart(2, '0'))} ${period}`;
};

/**
 * Formats minutes since midnight into 24-hour HH:MM string for <input type="time">.
 */
export const formatMinutesTo24h = (totalMinutes) => {
  const mins = normalizeMinutesOfDay(totalMinutes);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Extracts the configured event start time in minutes from `config.wedding`.
 * Priority: wedding.timeEn -> wedding.time -> wedding.dateTime -> fallback.
 */
export const getEventStartMinutes = (wedding = {}) => {
  const candidates = [wedding?.timeEn, wedding?.time, wedding?.dateTime];
  for (const candidate of candidates) {
    const parsed = parseTimeToMinutes(candidate);
    if (parsed !== null) return parsed;
  }
  return DEFAULT_FALLBACK_START_MINUTES;
};

/**
 * Returns the 24-hour HH:MM string for the event start time (for time picker inputs).
 */
export const getEventStartTime24h = (wedding = {}) => {
  return formatMinutesTo24h(getEventStartMinutes(wedding));
};

/**
 * Produces an updated `wedding` config object when the admin changes the event start time
 * (via <input type="time"> "HH:MM" or a 12-hour string like "8:00 PM").
 * Keeps `time`, `timeEn`, and the time component of `dateTime` synchronized.
 */
export const buildUpdatedWeddingTime = (wedding = {}, rawTimeValue) => {
  const parsedMinutes = parseTimeToMinutes(rawTimeValue);
  if (parsedMinutes === null) {
    return { ...wedding };
  }

  const timeEn = formatMinutesToTimeEn(parsedMinutes);
  const timeAr = formatMinutesToTimeAr(parsedMinutes);
  const time24 = formatMinutesTo24h(parsedMinutes);

  let nextDateTime = wedding?.dateTime || '';
  const datePart =
    wedding?.date && /^\d{4}-\d{2}-\d{2}$/.test(wedding.date)
      ? wedding.date
      : nextDateTime.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || '';
  const tzPart = nextDateTime.match(/([+-]\d{2}:\d{2}|Z)$/)?.[1] || '+02:00';

  if (datePart) {
    nextDateTime = `${datePart}T${time24}:00${tzPart}`;
  }

  return {
    ...wedding,
    time: timeAr,
    timeEn,
    ...(nextDateTime ? { dateTime: nextDateTime } : {}),
  };
};

/**
 * Maps a parsed clock time onto the continuous timeline starting at `startMinutes`,
 * allowing late-night events (e.g. 8:00 PM -> 1:00 AM) to roll smoothly past midnight.
 */
const toTimelineMinutes = (itemMinutes, anchorMinutes) => {
  if (itemMinutes === null) return null;
  // If event starts in afternoon/evening (>= 12:00) and item is early morning (< 06:00),
  // treat item as next-day early morning.
  if (anchorMinutes >= 12 * 60 && itemMinutes < 6 * 60) {
    return itemMinutes + 1440;
  }
  return itemMinutes;
};

/**
 * Synchronizes an agenda array with the configured event start time:
 * - If no custom agenda is configured and `useGoldenDefaults` is true, builds the
 *   4-item Golden Theme agenda dynamically from `wedding` start time using offsets.
 * - If a custom agenda exists, updates item 0 to match the configured start time
 *   and preserves subsequent items unless adjustments are required to maintain
 *   valid chronological sequencing.
 */
export const syncAgendaWithStartTime = (
  agenda,
  wedding = {},
  { useGoldenDefaults = false } = {}
) => {
  const startMinutes = getEventStartMinutes(wedding);
  const startTimeEn =
    (typeof wedding?.timeEn === 'string' && wedding.timeEn.trim()) ||
    formatMinutesToTimeEn(startMinutes);
  const startTimeAr =
    (typeof wedding?.time === 'string' && wedding.time.trim()) ||
    formatMinutesToTimeAr(startMinutes);

  const hasCustomAgenda = Array.isArray(agenda) && agenda.length > 0;

  if (!hasCustomAgenda) {
    if (!useGoldenDefaults) return [];
    return DEFAULT_GOLDEN_AGENDA_TEMPLATE.map((item, idx) => {
      const slotMinutes = startMinutes + item.offsetMinutes;
      return {
        id: item.id,
        offsetMinutes: item.offsetMinutes,
        timeAr: idx === 0 ? startTimeAr : formatMinutesToTimeAr(slotMinutes),
        timeEn: idx === 0 ? startTimeEn : formatMinutesToTimeEn(slotMinutes),
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        descriptionAr: item.descriptionAr,
        descriptionEn: item.descriptionEn,
      };
    });
  }

  // Capture original parsed times so we can preserve original gaps if sequencing adjustment is needed
  const originalRawMinutes = agenda.map((slot) =>
    parseTimeToMinutes(slot?.timeEn || slot?.time || slot?.timeAr)
  );
  const originalAnchor = originalRawMinutes[0] !== null ? originalRawMinutes[0] : startMinutes;
  const originalTimeline = originalRawMinutes.map((m) => toTimelineMinutes(m, originalAnchor));

  let prevTimeline = startMinutes;

  return agenda.map((slot, idx) => {
    if (idx === 0) {
      prevTimeline = startMinutes;
      return {
        ...slot,
        timeEn: startTimeEn,
        timeAr: startTimeAr,
      };
    }

    const rawItemMinutes = originalRawMinutes[idx];
    if (rawItemMinutes === null) {
      return { ...slot };
    }

    const candidateTimeline = toTimelineMinutes(rawItemMinutes, startMinutes);
    if (candidateTimeline > prevTimeline) {
      prevTimeline = candidateTimeline;
      return { ...slot };
    }

    // Adjustment needed to maintain valid chronological time sequencing
    const prevOriginal = originalTimeline[idx - 1];
    const currOriginal = originalTimeline[idx];
    const originalGap =
      prevOriginal !== null && currOriginal !== null && currOriginal > prevOriginal
        ? currOriginal - prevOriginal
        : typeof slot.offsetMinutes === 'number' && slot.offsetMinutes > 0
          ? slot.offsetMinutes
          : DEFAULT_STEP_MINUTES;

    const adjustedTimeline = prevTimeline + originalGap;
    prevTimeline = adjustedTimeline;

    return {
      ...slot,
      timeEn: formatMinutesToTimeEn(adjustedTimeline),
      timeAr: formatMinutesToTimeAr(adjustedTimeline),
    };
  });
};

/**
 * Creates a new agenda item scheduled 60 minutes after the last existing item
 * (or 60 minutes after the configured event start time if the list is empty).
 */
export const createNextAgendaItem = (currentAgenda = [], wedding = {}) => {
  const startMinutes = getEventStartMinutes(wedding);
  const synced = syncAgendaWithStartTime(currentAgenda, wedding, { useGoldenDefaults: false });

  let nextMinutes = startMinutes;
  if (synced.length > 0) {
    const last = synced[synced.length - 1];
    const parsedLast = parseTimeToMinutes(last?.timeEn || last?.time || last?.timeAr);
    const lastTimeline = parsedLast !== null ? toTimelineMinutes(parsedLast, startMinutes) : startMinutes;
    nextMinutes = lastTimeline + DEFAULT_STEP_MINUTES;
  }

  return {
    id: `ag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timeEn: formatMinutesToTimeEn(nextMinutes),
    timeAr: formatMinutesToTimeAr(nextMinutes),
    titleAr: 'فقرة جديدة',
    titleEn: 'New Agenda Item',
    descriptionAr: '',
    descriptionEn: '',
  };
};

