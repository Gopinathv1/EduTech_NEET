import { ADMISSION_COUNTRIES } from '@/data/admissions';

export type Provenance = {
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
  sourceYear?: string;
};

export type VerifiedValue<T> = {
  value: T;
  source: Provenance;
};

export type AdmissionCountryProfile = {
  slug: string;
  name: string;
  flag: string;
  capital: VerifiedValue<string>;
  currency: VerifiedValue<string>;
  currencyCode: string;
  timezone: {
    iana: string;
    labelCity: string;
    note?: string;
    source: Provenance;
  };
  languages: VerifiedValue<string[]>;
  climate: VerifiedValue<string>;
  majorStudentCities: string[];
  studentCityDetails: {
    name: string;
    universityCount: number;
    timezone?: string;
    nearestAirport?: string;
  }[];
  landmark: {
    subject: string;
    imagePath?: string;
    placeholderPath: string;
    altKey: string;
  };
  travel: {
    baseline: string;
    distanceFromIndia: string;
    typicalDuration: string;
    flightType: string;
    connectionPattern: string;
    mainAirport: {
      name: string;
      code: string;
      city: string;
      country: string;
      distanceToCityCenter: string;
      role: string;
      transfer: string;
      source: Provenance;
    };
    alternateAirports?: {
      name: string;
      code: string;
      city: string;
      role: string;
      source: Provenance;
    }[];
    source: Provenance;
  };
  program: {
    duration?: VerifiedValue<string>;
    intake?: VerifiedValue<string>;
    medium?: VerifiedValue<string>;
  };
  budget: {
    tuitionRange?: VerifiedValue<string>;
    livingCost?: VerifiedValue<string>;
    overall?: VerifiedValue<string>;
  };
  universities: readonly string[];
  whyStudentsConsider: string[];
  lastVerified: string;
};

const verifiedAt = '2026-09-07';

const cia = (slug: string): Provenance => ({
  sourceName: 'CIA World Factbook archive',
  sourceUrl: `https://archive.govglance.org/factbook/${slug}`,
  verifiedAt,
});

const worldFactbook = (slug: string): Provenance => ({
  sourceName: 'World Factbook mirror',
  sourceUrl: `https://www.worldfactbook.co/country.php?slug=${slug}`,
  verifiedAt,
});

const iana: Provenance = {
  sourceName: 'IANA Time Zone Database',
  sourceUrl: 'https://www.iana.org/time-zones',
  verifiedAt,
};

const travelSource: Provenance = {
  sourceName: 'Route schedule and distance reference',
  sourceUrl: 'https://www.flightconnections.com/',
  verifiedAt,
};

const airportSource = (sourceName: string, sourceUrl: string, sourceYear?: string): Provenance => ({
  sourceName,
  sourceUrl,
  sourceYear,
  verifiedAt,
});

const countryBySlug = new Map(ADMISSION_COUNTRIES.map((country) => [country.slug, country]));

export const ADMISSION_COUNTRY_PROFILES: AdmissionCountryProfile[] = [
  {
    slug: 'russia',
    name: 'Russia',
    flag: '🇷🇺',
    capital: { value: 'Moscow', source: cia('russia') },
    currency: { value: 'Russian ruble', source: worldFactbook('russia') },
    currencyCode: 'RUB',
    timezone: {
      iana: 'Europe/Moscow',
      labelCity: 'Moscow',
      note: 'Russia has multiple time zones; this page shows Moscow time for the capital context.',
      source: iana,
    },
    languages: { value: ['Russian'], source: worldFactbook('russia') },
    climate: {
      value: 'Varies widely, from humid continental in much of European Russia to subarctic and tundra climates farther north and east.',
      source: worldFactbook('russia'),
    },
    majorStudentCities: ['Moscow', 'Omsk', 'Orenburg', 'Perm', 'Tver', 'Yoshkar-Ola'],
    studentCityDetails: [
      { name: 'Moscow', universityCount: 0, timezone: 'Europe/Moscow', nearestAirport: 'Sheremetyevo International Airport (SVO)' },
      { name: 'Omsk', universityCount: 1, timezone: 'Asia/Omsk', nearestAirport: 'Omsk Central Airport (OMS)' },
      { name: 'Orenburg', universityCount: 1, timezone: 'Asia/Yekaterinburg', nearestAirport: 'Orenburg Tsentralny Airport (REN)' },
      { name: 'Perm', universityCount: 1, timezone: 'Asia/Yekaterinburg', nearestAirport: 'Perm International Airport (PEE)' },
      { name: 'Tver', universityCount: 1, timezone: 'Europe/Moscow', nearestAirport: 'Moscow airports for most international arrivals' },
      { name: 'Yoshkar-Ola', universityCount: 1, timezone: 'Europe/Moscow', nearestAirport: 'Kazan / Cheboksary regional access varies by route' },
    ],
    landmark: {
      subject: "Moscow skyline / St. Basil's Cathedral",
      imagePath: '/admissions/russia.jpg',
      placeholderPath: '/admissions/countries/russia/landmark-placeholder.svg',
      altKey: 'russia',
    },
    travel: {
      baseline: 'From Delhi (DEL)',
      distanceFromIndia: 'Delhi -> Moscow SVO: approx. 4,386 km',
      typicalDuration: 'Approx. 6h 45m to Moscow on direct SVO service; university-city onward travel varies',
      flightType: 'Direct flights available to Moscow; regional university cities commonly need onward domestic travel',
      connectionPattern: 'Moscow is the main gateway; Omsk, Orenburg, Perm and other university-city routing varies by airline and season.',
      mainAirport: {
        name: 'Sheremetyevo International Airport',
        code: 'SVO',
        city: 'Moscow',
        country: 'Russia',
        distanceToCityCenter: 'Approx. 34-42 km to central Moscow, depending on terminal',
        role: 'Main international gateway for Moscow arrivals; Russia pages should still route students by university city.',
        transfer: 'Aeroexpress, taxi and road transfers are commonly used; confirm current operation before booking.',
        source: airportSource('FlightConnections Delhi-Moscow SVO route reference', 'https://www.flightsfrom.com/DEL-SVO'),
      },
      alternateAirports: [
        { name: 'Omsk Central Airport', code: 'OMS', city: 'Omsk', role: 'Nearest airport for Omsk State Medical University city planning', source: airportSource('Omsk Airport official airport codes page', 'https://aeroomsk.ru/en/') },
        { name: 'Orenburg Tsentralny Airport', code: 'REN', city: 'Orenburg', role: 'Nearest airport for Orenburg State Medical University city planning', source: airportSource('Orenburg Airport official site', 'https://ar-ren.ru/en/') },
      ],
      source: airportSource('FlightsFrom Delhi-Moscow schedule reference', 'https://www.flightsfrom.com/DEL-SVO'),
    },
    program: {},
    budget: {},
    universities: countryBySlug.get('russia')?.universities ?? [],
    whyStudentsConsider: ['Multiple city options', 'Established public university names in the current dataset', 'Direct Moscow gateway plus regional onward routing', 'Cold-climate planning is important for families'],
    lastVerified: verifiedAt,
  },
  {
    slug: 'georgia',
    name: 'Georgia',
    flag: '🇬🇪',
    capital: { value: 'Tbilisi', source: cia('georgia') },
    currency: { value: 'Georgian lari', source: worldFactbook('georgia') },
    currencyCode: 'GEL',
    timezone: { iana: 'Asia/Tbilisi', labelCity: 'Tbilisi', source: iana },
    languages: { value: ['Georgian'], source: cia('georgia') },
    climate: { value: 'Warm and pleasant in many lowland areas, with mountain climates in higher regions.', source: cia('georgia') },
    majorStudentCities: ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi'],
    studentCityDetails: [
      { name: 'Tbilisi', universityCount: 4, timezone: 'Asia/Tbilisi', nearestAirport: 'Tbilisi International Airport (TBS)' },
      { name: 'Batumi', universityCount: 1, timezone: 'Asia/Tbilisi', nearestAirport: 'Batumi International Airport (BUS)' },
      { name: 'Kutaisi', universityCount: 0, timezone: 'Asia/Tbilisi', nearestAirport: 'Kutaisi International Airport (KUT)' },
      { name: 'Rustavi', universityCount: 0, timezone: 'Asia/Tbilisi', nearestAirport: 'Tbilisi International Airport (TBS)' },
    ],
    landmark: {
      subject: 'Tbilisi skyline / Old Tbilisi',
      imagePath: '/admissions/georgia.jpg',
      placeholderPath: '/admissions/countries/georgia/landmark-placeholder.svg',
      altKey: 'georgia',
    },
    travel: {
      baseline: 'From Delhi (DEL)',
      distanceFromIndia: 'Delhi -> Tbilisi TBS: approx. 3,257 km',
      typicalDuration: 'Approx. 6h 5m on current non-stop TBS service; connecting options vary',
      flightType: 'Direct flights available on the Delhi-Tbilisi route, subject to schedule changes',
      connectionPattern: 'If not using direct service, common connections depend on airline and date.',
      mainAirport: {
        name: 'Tbilisi International Airport',
        code: 'TBS',
        city: 'Tbilisi',
        country: 'Georgia',
        distanceToCityCenter: '17 km south-east of Tbilisi',
        role: 'Primary international arrival airport for Tbilisi-based universities.',
        transfer: 'Road/taxi and airport transport options connect the airport with Tbilisi.',
        source: airportSource('United Airports of Georgia - Tbilisi International Airport', 'https://airports.ge/about-us/airports/tbilisi'),
      },
      alternateAirports: [
        { name: 'Batumi International Airport', code: 'BUS', city: 'Batumi', role: 'Relevant for Batumi university-city arrivals', source: airportSource('United Airports of Georgia airport network', 'https://airports.ge/about-us/airports/tbilisi') },
      ],
      source: airportSource('DirectFlights Delhi-Tbilisi route reference', 'https://www.directflights.com/DEL-TBS'),
    },
    program: {},
    budget: {},
    universities: countryBySlug.get('georgia')?.universities ?? [],
    whyStudentsConsider: ['Compact country geography', 'Tbilisi-heavy university options in the current dataset', 'Direct Delhi-Tbilisi routing is visible in current schedule references', 'Moderate arrival planning compared with multi-time-zone destinations'],
    lastVerified: verifiedAt,
  },
  {
    slug: 'vietnam',
    name: 'Vietnam',
    flag: '🇻🇳',
    capital: { value: 'Hanoi', source: cia('vietnam') },
    currency: { value: 'Vietnamese dong', source: worldFactbook('vietnam') },
    currencyCode: 'VND',
    timezone: { iana: 'Asia/Ho_Chi_Minh', labelCity: 'Hanoi / Ho Chi Minh City', source: iana },
    languages: { value: ['Vietnamese'], source: worldFactbook('vietnam') },
    climate: { value: 'Tropical in the south; monsoonal in the north with hot, rainy seasons and cooler dry periods.', source: worldFactbook('vietnam') },
    majorStudentCities: ['Hanoi', 'Ho Chi Minh City', 'Can Tho', 'Da Nang'],
    studentCityDetails: [
      { name: 'Hanoi', universityCount: 0, timezone: 'Asia/Ho_Chi_Minh', nearestAirport: 'Noi Bai International Airport (HAN)' },
      { name: 'Ho Chi Minh City', universityCount: 1, timezone: 'Asia/Ho_Chi_Minh', nearestAirport: 'Tan Son Nhat International Airport (SGN)' },
      { name: 'Can Tho', universityCount: 2, timezone: 'Asia/Ho_Chi_Minh', nearestAirport: 'Can Tho International Airport (VCA)' },
      { name: 'Da Nang', universityCount: 1, timezone: 'Asia/Ho_Chi_Minh', nearestAirport: 'Da Nang / Chu Lai routing depends on university city' },
    ],
    landmark: {
      subject: 'Hanoi / Ho Chi Minh City landmark imagery',
      placeholderPath: '/admissions/countries/vietnam/landmark-placeholder.svg',
      altKey: 'vietnam',
    },
    travel: {
      baseline: 'From Delhi (DEL)',
      distanceFromIndia: 'Delhi -> Hanoi HAN: approx. 3,015 km; Delhi -> Ho Chi Minh City SGN: approx. 3,655 km',
      typicalDuration: 'Approx. 4h-4h 35m to Hanoi on direct service; Ho Chi Minh City routing varies',
      flightType: 'Direct flights available to Hanoi; southern Vietnam arrivals may require direct or connecting routing by date',
      connectionPattern: 'Hanoi and Ho Chi Minh City are the main international gateways; onward travel depends on university city.',
      mainAirport: {
        name: 'Noi Bai International Airport',
        code: 'HAN',
        city: 'Hanoi',
        country: 'Vietnam',
        distanceToCityCenter: 'Approx. 27 km from central Hanoi',
        role: 'Main northern Vietnam international gateway and useful comparison baseline.',
        transfer: 'Car/taxi and airport bus options are available; road time varies with traffic.',
        source: airportSource('Noi Bai International Airport official overview', 'https://noibaiairport.vn/en/noibai-interntional-airport-overview-pid3.html'),
      },
      alternateAirports: [
        { name: 'Tan Son Nhat International Airport', code: 'SGN', city: 'Ho Chi Minh City', role: 'Main southern Vietnam international gateway', source: airportSource('Airports Corporation of Vietnam - Tan Son Nhat profile', 'https://thunghiem.vietnamairport.vn/en/tan-son-nhat-international-airport') },
      ],
      source: airportSource('FlightsFrom Delhi-Hanoi route reference', 'https://www.flightsfrom.com/DEL-HAN'),
    },
    program: {},
    budget: {},
    universities: countryBySlug.get('vietnam')?.universities ?? [],
    whyStudentsConsider: ['Southeast Asia gateway options', 'Direct Delhi-Hanoi flight references are available', 'University cities may require careful onward travel planning', 'Warm tropical and monsoon climate context'],
    lastVerified: verifiedAt,
  },
  {
    slug: 'armenia',
    name: 'Armenia',
    flag: '🇦🇲',
    capital: { value: 'Yerevan', source: cia('armenia') },
    currency: { value: 'Armenian dram', source: worldFactbook('armenia') },
    currencyCode: 'AMD',
    timezone: { iana: 'Asia/Yerevan', labelCity: 'Yerevan', source: iana },
    languages: { value: ['Armenian'], source: worldFactbook('armenia') },
    climate: { value: 'Highland continental climate with hot summers and cold winters.', source: worldFactbook('armenia') },
    majorStudentCities: ['Yerevan'],
    studentCityDetails: [{ name: 'Yerevan', universityCount: 5, timezone: 'Asia/Yerevan', nearestAirport: 'Zvartnots International Airport (EVN)' }],
    landmark: {
      subject: 'Yerevan / Mount Ararat contextual imagery',
      placeholderPath: '/admissions/countries/armenia/landmark-placeholder.svg',
      altKey: 'armenia',
    },
    travel: {
      baseline: 'From Delhi (DEL)',
      distanceFromIndia: 'Delhi -> Yerevan EVN: approx. 3,247 km great-circle reference',
      typicalDuration: 'Approx. 5h 55m-13h 20m flying time via one-stop routings; layover time extra',
      flightType: 'Commonly requires connection from Delhi',
      connectionPattern: 'Current references show one-stop options via Tehran, Tashkent, Tbilisi, Gulf hubs, Almaty, Moscow and Istanbul.',
      mainAirport: {
        name: 'Zvartnots International Airport',
        code: 'EVN',
        city: 'Yerevan',
        country: 'Armenia',
        distanceToCityCenter: 'Approx. 12 km to central Yerevan',
        role: 'Main international arrival airport for Yerevan-based universities.',
        transfer: 'Taxi/car is short; Airport Express/public transport may be available by current local schedule.',
        source: airportSource('Zvartnots Airport official site', 'https://www.zvartnots.aero/en/Index'),
      },
      source: airportSource('FlightConnections Delhi-Yerevan route reference', 'https://www.flightconnections.com/flights-from-del-to-evn'),
    },
    program: {},
    budget: {},
    universities: countryBySlug.get('armenia')?.universities ?? [],
    whyStudentsConsider: ['Yerevan-focused university dataset', 'Single main arrival gateway simplifies planning', 'Connection choices should be compared by date', 'Highland continental climate planning is relevant'],
    lastVerified: verifiedAt,
  },
  {
    slug: 'uzbekistan',
    name: 'Uzbekistan',
    flag: '🇺🇿',
    capital: { value: 'Tashkent', source: worldFactbook('uzbekistan') },
    currency: { value: 'Uzbekistani som', source: worldFactbook('uzbekistan') },
    currencyCode: 'UZS',
    timezone: { iana: 'Asia/Tashkent', labelCity: 'Tashkent', source: iana },
    languages: { value: ['Uzbek', 'Russian', 'Tajik'], source: worldFactbook('uzbekistan') },
    climate: { value: 'Mostly mid-latitude desert with long hot summers and mild winters; semiarid grassland in the east.', source: worldFactbook('uzbekistan') },
    majorStudentCities: ['Tashkent', 'Bukhara', 'Samarkand', 'Fergana', 'Andijan'],
    studentCityDetails: [
      { name: 'Tashkent', universityCount: 1, timezone: 'Asia/Tashkent', nearestAirport: 'Islam Karimov Tashkent International Airport (TAS)' },
      { name: 'Bukhara', universityCount: 1, timezone: 'Asia/Samarkand', nearestAirport: 'Bukhara International Airport (BHK)' },
      { name: 'Samarkand', universityCount: 1, timezone: 'Asia/Samarkand', nearestAirport: 'Samarkand International Airport (SKD)' },
      { name: 'Fergana', universityCount: 1, timezone: 'Asia/Tashkent', nearestAirport: 'Fergana International Airport (FEG)' },
      { name: 'Andijan', universityCount: 1, timezone: 'Asia/Tashkent', nearestAirport: 'Andijan Airport (AZN)' },
    ],
    landmark: {
      subject: 'Registan / Samarkand',
      imagePath: '/admissions/andijan-students-01.jpg',
      placeholderPath: '/admissions/countries/uzbekistan/landmark-placeholder.svg',
      altKey: 'uzbekistan',
    },
    travel: {
      baseline: 'From Delhi (DEL)',
      distanceFromIndia: 'Delhi -> Tashkent TAS: approx. 1,577-1,586 km',
      typicalDuration: 'Approx. 2h 50m-3h on current direct TAS service',
      flightType: 'Direct flights available to Tashkent, subject to airline schedule changes',
      connectionPattern: 'Regional university cities may need onward domestic rail/road/air planning.',
      mainAirport: {
        name: 'Islam Karimov Tashkent International Airport',
        code: 'TAS',
        city: 'Tashkent',
        country: 'Uzbekistan',
        distanceToCityCenter: 'Approx. 7 km south-east of the city center',
        role: 'Main international gateway for Uzbekistan arrivals.',
        transfer: 'Taxi and city transport options are available; confirm current terminal arrangements.',
        source: airportSource('flydubai Tashkent airport information', 'https://www.flydubai.com/en-us/destinations/airports/tashkent-airport/'),
      },
      alternateAirports: [
        { name: 'Samarkand International Airport', code: 'SKD', city: 'Samarkand', role: 'Useful for Samarkand university-city planning', source: airportSource('FCG OPS Samarkand airport profile', 'https://fcgops.aero/airports/uzss/') },
      ],
      source: airportSource('DirectFlights Delhi-Tashkent route reference', 'https://www.directflights.com/DEL-TAS'),
    },
    program: {},
    budget: {},
    universities: countryBySlug.get('uzbekistan')?.universities ?? [],
    whyStudentsConsider: ['Shorter Delhi-Tashkent flight baseline than many destinations', 'Several student cities in the current dataset', 'Central Asian rail/road onward planning may be useful', 'Desert/semiarid climate context'],
    lastVerified: verifiedAt,
  },
  {
    slug: 'kyrgyzstan',
    name: 'Kyrgyzstan',
    flag: '🇰🇬',
    capital: { value: 'Bishkek', source: worldFactbook('kyrgyzstan') },
    currency: { value: 'Kyrgyzstani som', source: worldFactbook('kyrgyzstan') },
    currencyCode: 'KGS',
    timezone: { iana: 'Asia/Bishkek', labelCity: 'Bishkek', source: iana },
    languages: { value: ['Kyrgyz', 'Russian', 'Uzbek'], source: worldFactbook('kyrgyzstan') },
    climate: { value: 'Dry continental to polar in the high Tien Shan Mountains, with temperate northern foothills.', source: worldFactbook('kyrgyzstan') },
    majorStudentCities: ['Bishkek', 'Osh', 'Jalal-Abad'],
    studentCityDetails: [
      { name: 'Bishkek', universityCount: 2, timezone: 'Asia/Bishkek', nearestAirport: 'Manas International Airport (FRU)' },
      { name: 'Osh', universityCount: 2, timezone: 'Asia/Bishkek', nearestAirport: 'Osh Airport (OSS)' },
      { name: 'Jalal-Abad', universityCount: 1, timezone: 'Asia/Bishkek', nearestAirport: 'Jalal-Abad Airport' },
    ],
    landmark: {
      subject: 'Bishkek / Ala-Too / mountain landscape',
      placeholderPath: '/admissions/countries/kyrgyzstan/landmark-placeholder.svg',
      altKey: 'kyrgyzstan',
    },
    travel: {
      baseline: 'From Delhi (DEL)',
      distanceFromIndia: 'Delhi -> Bishkek FRU: direct route reference approx. 3h 20m flying-time baseline; current distance not published in selected source',
      typicalDuration: 'Commonly connecting from Delhi in current route references; former direct route time was approx. 3h 20m',
      flightType: 'Commonly requires connection from Delhi in current references',
      connectionPattern: 'Check Tashkent, Almaty, Dubai/Sharjah and Istanbul-style routings by date before booking.',
      mainAirport: {
        name: 'Manas International Airport',
        code: 'FRU',
        city: 'Bishkek',
        country: 'Kyrgyzstan',
        distanceToCityCenter: '23 km north-west of Bishkek city center',
        role: 'Main international gateway for Bishkek-based arrivals.',
        transfer: 'Official airport taxi/road transfer is available; timings vary by traffic and arrival time.',
        source: airportSource('Airports of Kyrgyzstan - Manas International Airport', 'https://airport.kg/en/information'),
      },
      alternateAirports: [
        { name: 'Osh Airport', code: 'OSS', city: 'Osh', role: 'Relevant for Osh university-city arrivals', source: airportSource('Airports of Kyrgyzstan official airport network', 'https://airport.kg/en/information') },
      ],
      source: airportSource('FlightsFrom Delhi-Bishkek route reference', 'https://www.flightsfrom.com/DEL-FRU'),
    },
    program: {},
    budget: {},
    universities: countryBySlug.get('kyrgyzstan')?.universities ?? [],
    whyStudentsConsider: ['Bishkek and Osh options in the current dataset', 'Mountain/continental climate planning is important', 'Arrival airport differs by university city', 'Current Delhi routing should be checked carefully because direct-route status changes'],
    lastVerified: verifiedAt,
  },
  {
    slug: 'tajikistan',
    name: 'Tajikistan',
    flag: '🇹🇯',
    capital: { value: 'Dushanbe', source: worldFactbook('tajikistan') },
    currency: { value: 'Tajikistani somoni', source: worldFactbook('tajikistan') },
    currencyCode: 'TJS',
    timezone: { iana: 'Asia/Dushanbe', labelCity: 'Dushanbe', source: iana },
    languages: { value: ['Tajik', 'Uzbek', 'Russian'], source: worldFactbook('tajikistan') },
    climate: { value: 'Mid-latitude continental climate with hot summers and mild winters; semiarid to polar in the Pamir Mountains.', source: worldFactbook('tajikistan') },
    majorStudentCities: ['Dushanbe', 'Khujand'],
    studentCityDetails: [
      { name: 'Dushanbe', universityCount: 3, timezone: 'Asia/Dushanbe', nearestAirport: 'Dushanbe International Airport (DYU)' },
      { name: 'Khujand', universityCount: 0, timezone: 'Asia/Dushanbe', nearestAirport: 'Khujand Airport (LBD)' },
    ],
    landmark: {
      subject: 'Dushanbe / Ismoil Somoni monument / mountain landscape',
      placeholderPath: '/admissions/countries/tajikistan/landmark-placeholder.svg',
      altKey: 'tajikistan',
    },
    travel: {
      baseline: 'From Delhi (DEL)',
      distanceFromIndia: 'Delhi -> Dushanbe DYU: approx. 1,353 km',
      typicalDuration: 'Approx. 2h 30m on current direct DYU references; frequency is limited and date-dependent',
      flightType: 'Direct flights available in current references, but limited frequency',
      connectionPattern: 'When direct flights are not suitable, Central Asia and Gulf/West Asia connections may be needed by date.',
      mainAirport: {
        name: 'Dushanbe International Airport',
        code: 'DYU',
        city: 'Dushanbe',
        country: 'Tajikistan',
        distanceToCityCenter: 'Approx. 5 km from central Dushanbe',
        role: 'Main international gateway for Dushanbe-based universities.',
        transfer: 'Short road transfer to the city; car/taxi times vary with traffic.',
        source: airportSource('RIPE NCC CAPIF travel information - Dushanbe airport', 'https://www.ripe.net/meetings/regional-meetings/capif/capif-5/travel-and-useful-information/'),
      },
      source: airportSource('DirectFlights Delhi-Dushanbe route reference', 'https://www.directflights.com/DEL-DYU'),
    },
    program: {},
    budget: {},
    universities: countryBySlug.get('tajikistan')?.universities ?? [],
    whyStudentsConsider: ['Dushanbe-focused featured university dataset', 'Short airport-to-city transfer context', 'Limited direct-route frequency means date planning matters', 'Mountain and continental climate context'],
    lastVerified: verifiedAt,
  },
  {
    slug: 'kazakhstan',
    name: 'Kazakhstan',
    flag: '🇰🇿',
    capital: { value: 'Astana', source: worldFactbook('kazakhstan') },
    currency: { value: 'Kazakhstani tenge', source: worldFactbook('kazakhstan') },
    currencyCode: 'KZT',
    timezone: {
      iana: 'Asia/Almaty',
      labelCity: 'Astana',
      note: 'Kazakhstan moved to one time zone in March 2024; this page uses the current country/capital context.',
      source: iana,
    },
    languages: { value: ['Kazakh', 'Russian', 'English'], source: worldFactbook('kazakhstan') },
    climate: { value: 'Continental, with cold winters and hot summers; arid and semiarid areas.', source: worldFactbook('kazakhstan') },
    majorStudentCities: ['Astana', 'Almaty'],
    studentCityDetails: [
      { name: 'Astana', universityCount: 0, timezone: 'Asia/Almaty', nearestAirport: 'Nursultan Nazarbayev International Airport (NQZ)' },
      { name: 'Almaty', universityCount: 2, timezone: 'Asia/Almaty', nearestAirport: 'Almaty International Airport (ALA)' },
    ],
    landmark: {
      subject: 'Astana skyline / Baiterek Tower',
      placeholderPath: '/admissions/countries/kazakhstan/landmark-placeholder.svg',
      altKey: 'kazakhstan',
    },
    travel: {
      baseline: 'From Delhi (DEL)',
      distanceFromIndia: 'Delhi -> Almaty ALA: approx. 1,652 km; Astana NQZ is a separate arrival option',
      typicalDuration: 'Approx. 3h 15m-3h 35m on current direct Almaty service; Astana may require a connection',
      flightType: 'Direct flights available to Almaty; Astana routing varies',
      connectionPattern: 'Almaty is useful for current university dataset; Astana can be compared when relevant.',
      mainAirport: {
        name: 'Almaty International Airport',
        code: 'ALA',
        city: 'Almaty',
        country: 'Kazakhstan',
        distanceToCityCenter: 'Approx. 8.1 NM from Almaty center',
        role: 'Main practical gateway for the Almaty universities currently displayed.',
        transfer: 'Road, taxi and city transport options vary by arrival time and terminal.',
        source: airportSource('Kazakhstan AIP - Almaty UAAA', 'https://www.ans.kz/AIP/eAIP/2026-10-01-AIRAC/html/eAIP/UA-AD-2.UAAA-en-GB.html', '2026'),
      },
      alternateAirports: [
        { name: 'Nursultan Nazarbayev International Airport', code: 'NQZ', city: 'Astana', role: 'Capital gateway and comparison airport for Astana arrivals', source: airportSource('Kazakhstan AIP - Astana UACC', 'https://www.ans.kz/AIP/eAIP/2026-01-22-AIRAC/html/eAIP/UA-AD-2.UACC-en-GB.html', '2026') },
      ],
      source: airportSource('DirectFlights Delhi-Almaty route reference', 'https://www.directflights.com/DEL-ALA'),
    },
    program: {},
    budget: {},
    universities: countryBySlug.get('kazakhstan')?.universities ?? [],
    whyStudentsConsider: ['Almaty-based universities in the current dataset', 'Direct Delhi-Almaty service appears in current route references', 'Astana and Almaty are separate planning contexts', 'Continental climate and winter planning matter'],
    lastVerified: verifiedAt,
  },
];

export function getAdmissionCountryProfile(slug: string) {
  return ADMISSION_COUNTRY_PROFILES.find((country) => country.slug === slug);
}

export function getAdmissionCountryProfiles(slugs: string[]) {
  const selected = slugs
    .map((slug) => getAdmissionCountryProfile(slug))
    .filter((country): country is AdmissionCountryProfile => Boolean(country));
  return Array.from(new Map(selected.map((country) => [country.slug, country])).values());
}
