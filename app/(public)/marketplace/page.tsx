import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink } from '@/components/public/ui';
import MarketplaceProductVisual from '@/components/public/MarketplaceProductVisual';
import { MARKETPLACE_CATEGORIES, type MarketplaceCategory } from '@/lib/marketplace/catalog';
import styles from '@/components/public/MarketplaceExperience.module.css';

export async function generateMetadata() {
  const t = await getTranslations('seo.marketplace');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/marketplace' });
}

const groups = [
  ['EXAM', 'EXAM PREPARATION', 'Preparation material categories for NEET and JEE. Currently unavailable while the marketplace is being prepared.'],
  ['LANGUAGE', 'LANGUAGE LEARNING', 'Planned material categories for spoken English and Hindi learning.'],
  ['GENERAL', 'GENERAL LEARNING', 'Planned categories for revision and wider learning resources.'],
  ['FUTURE', 'FUTURE CATEGORIES', 'Secondary categories that will be considered later as the marketplace evolves.'],
] as const;

export default function MarketplacePage() {
  return <div className={styles.page}>
    <section className={styles.hero}><div className={styles.heroInner}>
      <div><p className={styles.eyebrow}>SIVORA MARKETPLACE</p><h1>Learning resources, in one place.</h1><p className={styles.heroCopy}>SIVORA Marketplace is being prepared as a curated education-focused space connecting learners, useful resources and future educator partners.</p><div className={styles.actions}><PrimaryLink href="#categories">Explore planned categories</PrimaryLink><Link href="/marketplace/sell" className="inline-flex items-center justify-center rounded-md border border-[#d9dee5] px-5 py-3 text-sm font-semibold text-[#10151c] transition hover:border-[#2774e6] hover:text-[#2774e6]">Sell with SIVORA</Link></div></div>
      <MarketplaceProductVisual />
    </div></section>
    <section id="categories" className={styles.section}><div className={styles.sectionInner}>
      <div className={styles.sectionHead}><div><p className={styles.sectionEyebrow}>MARKETPLACE LAUNCHING SOON</p><h2>Categories, clearly staged.</h2></div><p>These are category previews only. There is no current inventory, pricing, seller listing, or checkout.</p></div>
      {groups.map(([group, heading, description], index) => <CategoryGroup key={group} heading={heading} description={description} categories={MARKETPLACE_CATEGORIES.filter((category) => category.group === group)} future={group === 'FUTURE'} tinted={index % 2 === 1} />)}
    </div></section>
    <section className={`${styles.section} ${styles.dark}`}><div className={styles.sectionInner}><div className={styles.sectionHead}><div><p className={styles.sectionEyebrow}>A FUTURE RESOURCE JOURNEY</p><h2>Discover. Understand. Keep learning.</h2></div><p>The marketplace is being shaped around useful discovery—not fake inventory or unsupported recommendations.</p></div><div className={styles.discovery}>{[['01','EXPLORE A LEARNING AREA','Start with exams, languages, revision or a future-skill direction.'],['02','UNDERSTAND THE RESOURCE','See what a future resource is intended to support.'],['03','CONNECT IT TO PRACTICE','Use the wider SIVORA journey when preparation or guidance is the next step.'],['04','CONTINUE THROUGH SIVORA','Move between learning resources, courses, counselling and admissions as needed.']].map(([number,title,body])=><div key={number} className={styles.discoveryRow}><span>{number}</span><h3>{title}</h3><p>{body}</p><b aria-hidden>—</b></div>)}</div></div></section>
    <section className={`${styles.section} ${styles.sectionTint}`}><div className={styles.sectionInner}>
      <div className={styles.sectionHead}><div><p className={styles.sectionEyebrow}>SELL WITH SIVORA</p><h2>Approved partners, in a future phase.</h2></div><p>Partner onboarding is Coming Soon. Selling and course offers are not operational today.</p></div>
      <div className={styles.supportGrid}>
        <article className={styles.supportCard}><p className={styles.sectionEyebrow}>PLANNED CONTRIBUTIONS</p><h3>Resources for learners.</h3><p>Future approved education partners may list educational materials, exam-preparation resources, learning resources, relevant education products, and eventually approved courses.</p></article>
        <article className={styles.supportCard}><p className={styles.sectionEyebrow}>PLANNED PARTNER CAPABILITIES</p><h3>Part of the SIVORA ecosystem.</h3><p>Approved partners may eventually refer candidates for Admissions, refer students and parents for Counselling & Career Guidance, offer structured Courses, and offer Marketplace materials.</p></article>
        <article className={styles.supportCard}><p className={styles.sectionEyebrow}>PARTNER ONBOARDING</p><h3>Coming Soon.</h3><p>Participation will be subject to SIVORA approval, content or product review, marketplace policies, and future commercial terms. Partner portal — Coming Soon.</p><div className={styles.actions}><Link href="/marketplace/sell" className="inline-flex items-center justify-center rounded-md border border-[#d9dee5] px-5 py-3 text-sm font-semibold text-[#10151c] transition hover:border-[#2774e6] hover:text-[#2774e6]">Learn about partnership</Link></div></article>
      </div>
    </div></section>
  </div>;
}

function CategoryGroup({ heading, description, categories, future, tinted }: { heading: string; description: string; categories: readonly MarketplaceCategory[]; future: boolean; tinted: boolean }) {
  return <section className={`py-12 ${tinted ? 'border-y border-[#d9dee5] bg-[#edf1f5] px-5 sm:px-8' : ''}`}><div className="grid gap-6 lg:grid-cols-[.5fr_1.5fr]"><div><p className={styles.sectionEyebrow}>{future ? 'COMING LATER' : 'CURRENT PREVIEW'}</p><h3 className="mt-3 text-3xl font-semibold tracking-[-.055em] text-[#10151c]">{heading}</h3><p className="mt-4 max-w-sm text-sm leading-6 text-[#5f6975]">{description}</p></div><div className={styles.discovery}>{categories.map((category, index) => <div key={category.slug} className={styles.discoveryRow}><span>{String(index + 1).padStart(2, '0')}</span><h3>{category.title}</h3><p>{category.state === 'COMING_LATER' ? 'Coming later' : 'Currently unavailable · Coming soon'}</p><b>—</b></div>)}</div></div></section>;
}
