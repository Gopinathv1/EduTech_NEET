export type MarketplaceCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
export type MarketplaceListingStatus = 'PUBLISHED' | 'PENDING_REVIEW' | 'SOLD_OUT';
export type MarketplaceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type MarketplaceCategory = {
  slug: string;
  labelKey: string;
  parentSlug?: string;
};

export type MarketplaceListing = {
  slug: string;
  title: string;
  categorySlug: string;
  subcategorySlug?: string;
  level?: MarketplaceLevel;
  author?: string;
  publisher?: string;
  condition: MarketplaceCondition;
  listingType: 'NEW' | 'USED';
  description: string;
  priceInr: number;
  originalPriceInr?: number;
  sellerName: string;
  location: string;
  deliveryAvailable: boolean;
  stock: number;
  status: MarketplaceListingStatus;
  createdAt: string;
  imagePath?: string;
};

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { slug: 'books', labelKey: 'books' },
  { slug: 'used-books', labelKey: 'usedBooks', parentSlug: 'books' },
  { slug: 'new-books', labelKey: 'newBooks', parentSlug: 'books' },
  { slug: 'exam-preparation-books', labelKey: 'examPreparationBooks', parentSlug: 'books' },
  { slug: 'neet-books', labelKey: 'neetBooks', parentSlug: 'exam-preparation-books' },
  { slug: 'jee-books', labelKey: 'jeeBooks', parentSlug: 'exam-preparation-books' },
  { slug: 'question-banks', labelKey: 'questionBanks' },
  { slug: 'previous-year-paper-collections', labelKey: 'previousYearPaperCollections' },
  { slug: 'study-materials', labelKey: 'studyMaterials' },
  { slug: 'reference-books', labelKey: 'referenceBooks' },
  { slug: 'college-books', labelKey: 'collegeBooks' },
  { slug: 'medical-books', labelKey: 'medicalBooks' },
  { slug: 'engineering-books', labelKey: 'engineeringBooks' },
  { slug: 'astrology-traditional-learning', labelKey: 'astrologyTraditionalLearning' },
  { slug: 'astrology-books', labelKey: 'astrologyBooks', parentSlug: 'astrology-traditional-learning' },
  { slug: 'vedic-astrology-books', labelKey: 'vedicAstrologyBooks', parentSlug: 'astrology-traditional-learning' },
  { slug: 'nakshatra-books', labelKey: 'nakshatraBooks', parentSlug: 'astrology-traditional-learning' },
  { slug: 'birth-chart-reference-books', labelKey: 'birthChartReferenceBooks', parentSlug: 'astrology-traditional-learning' },
  { slug: 'numerology-books', labelKey: 'numerologyBooks', parentSlug: 'astrology-traditional-learning' },
  { slug: 'panchanga-calendar-references', labelKey: 'panchangaCalendarReferences', parentSlug: 'astrology-traditional-learning' },
  { slug: 'astrology-reference-materials', labelKey: 'astrologyReferenceMaterials', parentSlug: 'astrology-traditional-learning' },
  { slug: 'yoga-wellness-learning', labelKey: 'yogaWellnessLearning' },
  { slug: 'yoga-books', labelKey: 'yogaBooks', parentSlug: 'yoga-wellness-learning' },
  { slug: 'yoga-philosophy-books', labelKey: 'yogaPhilosophyBooks', parentSlug: 'yoga-wellness-learning' },
  { slug: 'yoga-for-beginners-books', labelKey: 'yogaForBeginnersBooks', parentSlug: 'yoga-wellness-learning' },
  { slug: 'asana-reference-books', labelKey: 'asanaReferenceBooks', parentSlug: 'yoga-wellness-learning' },
  { slug: 'pranayama-learning-materials', labelKey: 'pranayamaLearningMaterials', parentSlug: 'yoga-wellness-learning' },
  { slug: 'meditation-books', labelKey: 'meditationBooks', parentSlug: 'yoga-wellness-learning' },
  { slug: 'yoga-anatomy-books', labelKey: 'yogaAnatomyBooks', parentSlug: 'yoga-wellness-learning' },
  { slug: 'yoga-teaching-reference-materials', labelKey: 'yogaTeachingReferenceMaterials', parentSlug: 'yoga-wellness-learning' },
  { slug: 'yoga-history-philosophy', labelKey: 'yogaHistoryPhilosophy', parentSlug: 'yoga-wellness-learning' },
  { slug: 'patanjali-yoga-sutras-commentaries', labelKey: 'patanjaliYogaSutrasCommentaries', parentSlug: 'yoga-wellness-learning' },
  { slug: 'ayurveda-yoga-reference-materials', labelKey: 'ayurvedaYogaReferenceMaterials', parentSlug: 'yoga-wellness-learning' },
  { slug: 'mindfulness-learning-materials', labelKey: 'mindfulnessLearningMaterials', parentSlug: 'yoga-wellness-learning' },
  { slug: 'wellness-education-books', labelKey: 'wellnessEducationBooks', parentSlug: 'yoga-wellness-learning' },
  { slug: 'astronomy-reference-books', labelKey: 'astronomyReferenceBooks', parentSlug: 'reference-books' },
  { slug: 'traditional-knowledge-books', labelKey: 'traditionalKnowledgeBooks', parentSlug: 'books' },
  { slug: 'educational-accessories', labelKey: 'educationalAccessories' },
];

export const MARKETPLACE_LISTINGS: MarketplaceListing[] = [
  {
    slug: 'neet-biology-practice-bundle',
    title: 'NEET Biology Practice Bundle',
    categorySlug: 'neet-books',
    author: 'Compiled practice set',
    publisher: 'SIVORA verified seller',
    condition: 'GOOD',
    listingType: 'USED',
    description: 'A focused used-book bundle for NEET Biology revision. Buyer should review photos and edition details before purchase.',
    priceInr: 420,
    originalPriceInr: 780,
    sellerName: 'Listed by approved seller',
    location: 'Chennai, Tamil Nadu',
    deliveryAvailable: true,
    stock: 1,
    status: 'PUBLISHED',
    createdAt: '2026-09-07',
  },
  {
    slug: 'jee-previous-year-paper-set',
    title: 'JEE Previous-Year Paper Set',
    categorySlug: 'previous-year-paper-collections',
    author: 'Exam practice collection',
    condition: 'LIKE_NEW',
    listingType: 'USED',
    description: 'Previous-year paper collection for engineering entrance preparation. Edition and answer-key availability must be confirmed by seller.',
    priceInr: 350,
    originalPriceInr: 650,
    sellerName: 'Listed by approved seller',
    location: 'Bengaluru, Karnataka',
    deliveryAvailable: true,
    stock: 1,
    status: 'PUBLISHED',
    createdAt: '2026-09-07',
  },
  {
    slug: 'medical-reference-notes',
    title: 'Medical Reference Notes',
    categorySlug: 'medical-books',
    publisher: 'Partner listing',
    condition: 'NEW',
    listingType: 'NEW',
    description: 'New reference material listing scaffold for medical students. Fulfilment and payment are pending marketplace order integration.',
    priceInr: 899,
    sellerName: 'Education partner',
    location: 'Coimbatore, Tamil Nadu',
    deliveryAvailable: false,
    stock: 12,
    status: 'PUBLISHED',
    createdAt: '2026-09-07',
  },
  {
    slug: 'astrology-foundations-reader',
    title: 'Astrology Foundations Reader',
    categorySlug: 'astrology-books',
    subcategorySlug: 'vedic-astrology-books',
    level: 'BEGINNER',
    author: 'Traditional knowledge study reference',
    condition: 'LIKE_NEW',
    listingType: 'USED',
    description: 'Educational reading material for astrology terminology, zodiac concepts and traditional chart study. Edition and condition should be confirmed with the seller.',
    priceInr: 260,
    originalPriceInr: 520,
    sellerName: 'Listed by approved seller',
    location: 'Chennai, Tamil Nadu',
    deliveryAvailable: true,
    stock: 1,
    status: 'PUBLISHED',
    createdAt: '2026-09-07',
  },
  {
    slug: 'panchanga-calendar-reference',
    title: 'Panchanga Calendar Reference',
    categorySlug: 'panchanga-calendar-references',
    level: 'INTERMEDIATE',
    publisher: 'Traditional learning reference',
    condition: 'NEW',
    listingType: 'NEW',
    description: 'Reference material for calendar and Panchanga fundamentals as a traditional-knowledge learning area. Not a scientific or counselling claim.',
    priceInr: 390,
    sellerName: 'Education partner',
    location: 'Madurai, Tamil Nadu',
    deliveryAvailable: true,
    stock: 5,
    status: 'PUBLISHED',
    createdAt: '2026-09-07',
  },
];

export function getMarketplaceListing(slug: string) {
  return MARKETPLACE_LISTINGS.find((listing) => listing.slug === slug);
}

export function getMarketplaceCategory(slug: string) {
  return MARKETPLACE_CATEGORIES.find((category) => category.slug === slug);
}
