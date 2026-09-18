import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Container, PrimaryLink, SecondaryLink } from '@/components/public/ui';
import AnimatedJourney from '@/components/public/AnimatedJourney';

export async function generateMetadata() {
  const t = await getTranslations('seo.home');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/', absoluteTitle: true });
}

export default function HomePage() {
  const t = useTranslations('home');
  const stories = [
    { key: 'admissions', href: '/admissions', image: '/admissions/student-departure-02.jpg', dark: false },
    { key: 'counselling', href: '/counselling', image: '/admissions/student-success-02.jpg', dark: false },
    { key: 'examPreparation', href: '/exam-preparation', image: '/admissions/andijan-students-01.jpg', dark: true },
    { key: 'courses', href: '/courses', image: '/admissions/georgia.jpg', dark: false },
    { key: 'marketplace', href: '/marketplace', image: '/admissions/russia.jpg', dark: true },
  ] as const;
  const copy: Record<string, { title: string; body: string }> = {
    admissions: { title: 'Study beyond borders.', body: t('serviceCards.admissions.body') },
    counselling: { title: 'Find the right direction.', body: t('serviceCards.counselling.body') },
    examPreparation: { title: 'Prepare with purpose.', body: t('serviceCards.examPreparation.body') },
    courses: { title: 'Learn what comes next.', body: t('serviceCards.courses.body') },
    marketplace: { title: 'Move forward with the right tools.', body: 'Books, study materials and learning resources for the road ahead.' },
  };
  return (
    <>
      <section className="relative overflow-hidden bg-[#f2eee7] text-[#11110f]">
        <Container className="grid gap-14 py-20 sm:py-28 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-20 lg:py-32">
          <div className="sivora-reveal max-w-2xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#8c3029]"><span className="h-1.5 w-1.5 rounded-full bg-[#d84a3e]" />{t('heroEyebrow')}</p>
            <h1 className="sivora-editorial-heading mt-8 text-[clamp(3.5rem,9vw,8rem)] font-semibold uppercase leading-[0.82]">{t('heroTitlePrefix')}<br /><span className="text-[#c94137]">{t('heroTitleAccent')}</span></h1>
            <p className="mt-8 max-w-lg text-base leading-8 text-[#5f5a52] sm:text-lg">{t('heroSubtitle')}</p>
            <div className="mt-9 flex flex-wrap items-center gap-5"><PrimaryLink className="bg-[#c94137] px-4 py-2.5 text-xs shadow-none" href="/counselling">{t('ctaPrimary')}</PrimaryLink><SecondaryLink className="border-[#b8b1a6] bg-transparent px-1 py-2.5 text-xs text-[#11110f] shadow-none hover:bg-transparent hover:text-[#c94137]" href="#explore-sivora">{t('heroExplore')}</SecondaryLink></div>
          </div>
          <AnimatedJourney />
        </Container>
      </section>

      <section className="bg-[#11110f] py-28 text-[#f5f1e9] sm:py-40"><Container><p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a45b]">{t('whatWeDo.eyebrow')}</p><h2 className="sivora-editorial-heading mt-7 max-w-5xl text-[clamp(3.5rem,8vw,8.5rem)] font-semibold uppercase leading-[0.82]">One platform.<br /><span className="text-[#d84a3e]">More possibilities.</span></h2><p className="mt-8 max-w-2xl text-lg leading-8 text-[#b8b2a8]">{t('intro.statement')}</p></Container></section>

      <section id="explore-sivora" className="bg-[#f2eee7] text-[#11110f]"><Container><div className="border-b border-[#cfc7ba] py-24 sm:py-32"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8c3029]">WHAT WE DO</p><h2 className="sivora-editorial-heading mt-6 text-[clamp(3.5rem,7vw,7rem)] font-semibold uppercase leading-[0.86]">EXPLORE<br />SIVORA</h2></div>{stories.map((story, index) => <article key={story.key} className={`grid gap-12 border-b border-[#cfc7ba] py-20 sm:py-28 md:grid-cols-2 md:items-center md:gap-20 ${index % 2 ? 'md:[&>div:first-child]:order-2' : ''}`}><div><p className="text-sm text-[#8b847a]">0{index + 1}</p><h3 className="sivora-editorial-heading mt-5 max-w-xl text-[clamp(2.8rem,5vw,5.8rem)] font-semibold uppercase leading-[0.88]">{copy[story.key].title}</h3><p className="mt-6 max-w-md text-base leading-8 text-[#5f5a52]">{copy[story.key].body}</p><a href={story.href} className="mt-8 inline-flex text-xs font-bold uppercase tracking-[0.18em] text-[#c94137]">Explore <span className="ml-2">→</span></a></div><div className="sivora-editorial-media aspect-[1.2/1] bg-[#ded7cd]"><Image src={story.image} alt="" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" /></div></article>)}</Container></section>

      <section className="bg-[#11110f] py-28 text-[#f5f1e9] sm:py-40"><Container className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a45b]">SIVORA UP↑RISING</p><h2 className="sivora-editorial-heading mt-7 max-w-4xl text-[clamp(3.5rem,8vw,8rem)] font-semibold uppercase leading-[0.82]">Your next step<br /><span className="text-[#d84a3e]">starts here.</span></h2></div><div><p className="mb-8 max-w-md text-lg leading-8 text-[#b8b2a8]">{t('heroSubtitle')}</p><PrimaryLink href="/counselling">{t('ctaPrimary')}</PrimaryLink></div></Container></section>
    </>
  );
}
