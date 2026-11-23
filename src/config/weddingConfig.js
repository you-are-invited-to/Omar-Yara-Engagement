/**
 * ============================================================
 * WEDDING CONFIGURATION — Edit this file to customize your
 * invitation. All wedding-specific data lives here.
 * ============================================================
 */

// ─── 1. COUPLE & FAMILIES (Single Source of Truth) ──────────
const groom = {
    "name": "عمر",
    "nameEn": "Omar",
    "familyTitleAr": "عائلة مكرم",
    "familyTitleEn": "The Makram Family",
    "father": " عبد المنعم",
    "fatherEn": "Abdelmnam Makram",
    "mother": "",
    "motherEn": "",
    "showMother": false
};

const bride = {
    "name": "يارا",
    "nameEn": "Yara",
    "familyTitleAr": "عائلة طلعت",
    "familyTitleEn": "The Talaat Family",
    "father": "احمد طلعت",
    "fatherEn": "Ahmed Talaat",
    "mother": "",
    "motherEn": "",
    "showMother": false
};

export const DEFAULT_SECTION_ORDER = [
    "hero",
    "details",
    "countdown",
    "families",
    "venue",
    "gallery",
    "dressCode",
    "wishlist",
    "rsvp",
    "wishes",
    "share"
];

// ─── 2. MAIN CONFIGURATION OBJECT ────────────────────────────
const weddingConfig = {
    /**
     * ─── LANGUAGE ─────────────────────────────────────────────
     * Default language for the invitation: 'ar' (Arabic) or 'en' (English)
     */
    defaultLanguage: "en",

    /**
     * ─── THEME & EVENT TYPE ───────────────────────────────────
     */
    eventType: "engagement",
    theme: "golden-theme",

    /**
     * ─── COUPLE ──────────────────────────────────────────────
     */
    groom,
    bride,

    // Family Invitation Phrase (Auto-generated from family titles)
    invitationPhraseAr: "تتشرف عائلة مكرم وعائلة طلعت بدعوتكم لحضور حفل زفاف نجليهما",
    invitationPhraseEn: "The Kouta Family & The Talaat Family cordially request the honor of your presence at the wedding of their children",

    /**
     * ─── WEDDING DATE & TIME ─────────────────────────────────
     */
    wedding: {
        "date": "2026-11-24",
        "dateDisplay": "٢٤ نوفمبر ٢٠٢٦",
        "dateDisplayEn": "24 November 2026",
        "dayAr": "الثلاثاء",
        "dayEn": "Tuesday",
        "time": "٨:٠٠ مساءً",
        "timeEn": "8:00 PM",
        "dateTime": "2026-11-24T20:00:00+02:00",
        "timezone": "Africa/Cairo",
        "celebrationQuoteAr": "بدأ الاحتفال!",
        "celebrationQuoteEn": "The celebration has begun!"
    },

    /**
     * ─── EVENT AGENDA ────────────────────────────────────────
     */
    agenda: [
        {
            "id": "ag-1",
            "offsetMinutes": 0,
            "timeAr": "٨:٠٠ مساءً",
            "timeEn": "8:00 PM",
            "titleAr": "استقبال الضيوف والترحيب",
            "titleEn": "Guest Arrival",
            "descriptionAr": "بداية التجمع واستقبال الأحبة في القاعة",
            "descriptionEn": "Welcome reception and music as guests arrive"
        },
        {
            "id": "ag-2",
            "offsetMinutes": 30,
            "timeAr": "٨:٣٠ مساءً",
            "timeEn": "8:30 PM",
            "titleAr": "دخول العروسين وبدء المراسم",
            "titleEn": "Grand Entrance & Ceremony",
            "descriptionAr": "لحظة الدخول وبداية مراسم الاحتفال الرسمية",
            "descriptionEn": "The grand entrance and official celebration ceremony"
        },
        {
            "id": "ag-3",
            "offsetMinutes": 60,
            "timeAr": "٩:٠٠ مساءً",
            "timeEn": "9:00 PM",
            "titleAr": "عقد القران",
            "titleEn": "Marriage Contract",
            "descriptionAr": "بدايه عقد القران",
            "descriptionEn": "Start of Marriage Contract"
        },
        {
            "id": "ag-4",
            "offsetMinutes": 120,
            "timeAr": "١٠:٠٠ مساءً",
            "timeEn": "10:00 PM",
            "titleAr": "سهرة الاحتفال والرقص",
            "titleEn": "Evening Celebration & Dancing",
            "descriptionAr": "أجمل الأوقات الموسيقية والاحتفال حتى الختام",
            "descriptionEn": "Music, joy, and dancing under the lights"
        }
    ],

    /**
     * ─── VENUE ───────────────────────────────────────────────
     */
    venue: {
        "nameAr": "قاعة باتروس جاردن",
        "nameEn": "Patros Garden Hall",
        "addressAr": "شارع 23 يوليو، بورسعيد",
        "addressEn": "23 jul St, Port Said",
        "cityAr": "بورسعيد، مصر",
        "cityEn": "Port Said, Egypt",
        "descriptionAr": "بجوار مجمع النوادي ",
        "descriptionEn": "Next to the Clubs Complex",
        "mapsUrl": "https://maps.app.goo.gl/b3DrdBeZVCakCNTr5?g_st=ic",
        "mapsEmbedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3410.037249054555!2d32.26310730965595!3d31.27506485911614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f99dbd55e09f0f%3A0xef0bac4e358f865c!2z2YLYp9i52Kkg2KjYp9iq2LHZiNizINis2KfYsdiv2YYgfCBCYXRyb3MgR2FyZGVu!5e0!3m2!1sen!2seg!4v1795422477426!5m2!1sen!2seg"
    },

    /**
     * ─── MUSIC ───────────────────────────────────────────────
     */
    music: {
        "enabled": true,
        "url": "/A5eern-hala2i.mp3",
        "titleAr": "موسيقى الحفل",
        "titleEn": "Engagement Music"
    },

    /**
     * ─── GALLERY ─────────────────────────────────────────────
     */
    gallery: {
        "enabled": true,
        "mockImages": [
            {
                "id": "1",
                "url": "",
                "alt": "Couple photo 1",
                "aspectRatio": "portrait"
            }
        ]
    },

    /**
     * ─── DRESS CODE ───────────────────────────────────────────
     */
    dressCode: {
        "enabled": true,
        "titleAr": "",
        "titleEn": "",
        "subtitleAr": "",
        "subtitleEn": "",
        "gentlemenTitleAr": "",
        "gentlemenTitleEn": "",
        "gentlemenDescAr": "",
        "gentlemenDescEn": "",
        "ladiesTitleAr": "",
        "ladiesTitleEn": "",
        "ladiesDescAr": "",
        "ladiesDescEn": "",
        "noteTitleAr": "",
        "noteTitleEn": "",
        "noteDescAr": "",
        "noteDescEn": "",
        "byEventType": {
            "wedding": {
                "ladiesBrownShade": "chocolate"
            }
        }
    },

    /**
     * ─── WISHLIST ─────────────────────────────────────────────
     */
    wishlist: {
        "enabled": false,
        "titleAr": "قائمة الهدايا",
        "titleEn": "Wedding Gifts",
        "subtitleAr": "حضوركم ومشاركتكم فرحتنا هي أثمن وأجمل هدية لنا",
        "subtitleEn": "Your presence and sharing our joy is the greatest gift of all",
        "instapay": "",
        "bankAccount": "",
        "registryUrl": "",
        "items": []
    },

    /**
     * ─── RSVP ─────────────────────────────────────────────────
     */
    rsvp: {
        "enabled": true,
        "maxGuests": 10,
        "invitationId": "Omar-Yara-Engagement-rsvp"
    },

    /**
     * ─── DYNAMIC SECTION STRUCTURE & CUSTOM SECTIONS ──────────
     */
    sectionOrder: [
        "hero",
        "details",
        "countdown",
        "families",
        "venue",
        "gallery",
        "dressCode",
        "wishlist",
        "rsvp",
        "wishes",
        "share"
    ],
    sections: {
        "hero": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "details": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "countdown": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "families": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "venue": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "gallery": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "dressCode": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "wishlist": {
            "enabled": false,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "rsvp": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "wishes": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        },
        "share": {
            "enabled": true,
            "titleAr": "",
            "titleEn": "",
            "subtitleAr": "",
            "subtitleEn": ""
        }
    },
    customSections: [],

    /**
     * ─── SHARING ──────────────────────────────────────────────
     */
    sharing: {
        url: "https://you-are-invited-to.github.io/Omar-Yara-Engagement/",
        messageAr: `🎉 دعوة عقد قران  ${groom.name} و${bride.name} — شاركونا فرحتنا! {url}`,
        messageEn: `🎉 ${groom.nameEn} & ${bride.nameEn}'s Engagement Invitation — Join us on our special day! {url}`,
    },

    /**
     * ─── SEO & META ───────────────────────────────────────────
     */
    meta: {
        titleAr: `دعوة عقد قران ${groom.name} و${bride.name}`,
        titleEn: `${groom.nameEn} & ${bride.nameEn}'s Wedding Invitation`,
        descriptionAr: "يسعدنا دعوتكم لمشاركتنا فرحة زفافنا في بورسعيد",
        descriptionEn: "We joyfully invite you to celebrate our Engagement in Port Said",
        ogImageUrl: "https://github.com/you-are-invited-to/Omar-Yara-Engagement.git/og-image.jpg",
        faviconUrl: "/favicon.svg",
    },

    /**
     * ─── ANALYTICS ────────────────────────────────────────────
     */
    analytics: {
        "enabled": false,
        "measurementId": ""
    },
};

export default weddingConfig;
