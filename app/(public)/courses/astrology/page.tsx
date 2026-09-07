import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import ExploreSivora from '@/components/public/ExploreSivora';
import AstrologyLearningSection from '@/components/public/AstrologyLearningSection';

export async function generateMetadata() {
  const t = await getTranslations('seo.coursesAstrology');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/courses/astrology' });
}

export default async function AstrologyCoursesPage() {
  const t = await getTranslations('courses');

  return (
    <>
      <PageHero eyebrow={t('astrology.eyebrow')} title={t('astrology.title')} subtitle={t('astrology.subtitle')} />
      <AstrologyLearningSection standalone />
      <ExploreSivora exclude={['courses']} />
    </>
  );
}
