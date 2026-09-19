export type MarketplaceCategory = {
  slug: string;
  title: string;
  group: 'EXAM' | 'LANGUAGE' | 'GENERAL' | 'FUTURE';
  state: 'COMING_SOON' | 'COMING_LATER';
};

/** Public catalogue previews only. No inventory, sellers, prices, or purchase data exists here. */
export const MARKETPLACE_CATEGORIES: readonly MarketplaceCategory[] = [
  { slug: 'neet-physics-materials', title: 'NEET Physics Materials', group: 'EXAM', state: 'COMING_SOON' },
  { slug: 'neet-chemistry-materials', title: 'NEET Chemistry Materials', group: 'EXAM', state: 'COMING_SOON' },
  { slug: 'neet-biology-materials', title: 'NEET Biology Materials', group: 'EXAM', state: 'COMING_SOON' },
  { slug: 'jee-physics-materials', title: 'JEE Physics Materials', group: 'EXAM', state: 'COMING_SOON' },
  { slug: 'jee-chemistry-materials', title: 'JEE Chemistry Materials', group: 'EXAM', state: 'COMING_SOON' },
  { slug: 'jee-mathematics-materials', title: 'JEE Mathematics Materials', group: 'EXAM', state: 'COMING_SOON' },
  { slug: 'spoken-english-materials', title: 'Spoken English Materials', group: 'LANGUAGE', state: 'COMING_SOON' },
  { slug: 'spoken-hindi-materials', title: 'Spoken Hindi Materials', group: 'LANGUAGE', state: 'COMING_SOON' },
  { slug: 'exam-practice-revision-materials', title: 'Exam Practice & Revision Materials', group: 'GENERAL', state: 'COMING_SOON' },
  { slug: 'educational-books-learning-resources', title: 'Educational Books & Learning Resources', group: 'GENERAL', state: 'COMING_SOON' },
  { slug: 'ai-future-technology-materials', title: 'AI & Future Technology Materials', group: 'FUTURE', state: 'COMING_LATER' },
  { slug: 'yoga-wellness-materials', title: 'Yoga & Wellness Materials', group: 'FUTURE', state: 'COMING_LATER' },
  { slug: 'astrology-learning-materials', title: 'Astrology Learning Materials', group: 'FUTURE', state: 'COMING_LATER' },
] as const;

export function getMarketplaceCategory(slug: string) {
  return MARKETPLACE_CATEGORIES.find((category) => category.slug === slug);
}
