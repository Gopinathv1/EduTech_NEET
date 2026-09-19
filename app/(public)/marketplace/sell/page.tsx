import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Section } from '@/components/public/ui';
import styles from '@/components/public/MarketplaceExperience.module.css';

export async function generateMetadata() {
  const t = await getTranslations('seo.marketplaceSell');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/marketplace/sell' });
}

export default function MarketplaceSellPage() {
  return <div className={styles.page}><Section className="!border-0 !bg-transparent"><div className={styles.sellHero}><div><p className={styles.eyebrow}>SELL WITH SIVORA</p><h1>Partner marketplace onboarding is coming soon.</h1><p className={styles.sellCopy}>SIVORA is preparing a future, approval-based marketplace for educators, institutions and education-focused partners. No listings or applications are being accepted today.</p></div><div className={styles.steps}>{['SIVORA approval', 'Content or product review', 'Marketplace policies', 'Future commercial terms'].map((item, index) => <div key={item} className={styles.step}><span>0{index + 1}</span><p>{item}</p></div>)}</div></div></Section><Section className="!bg-[#edf1f5]"><div className={styles.formLayout}><div><p className={styles.eyebrow}>PLANNED PARTNER CAPABILITIES</p><h2 className={styles.sellHeading}>A connected education ecosystem.</h2><p className={styles.sellCopy}>Approved partners may eventually offer education materials, exam resources, learning resources and approved courses through SIVORA.</p></div><div className={styles.disabledNotice}><strong>Partner portal — Coming Soon</strong><p className="mt-2">Future partner capabilities may include Admissions referrals, Counselling & Career Guidance referrals, course submissions and Marketplace listings. These workflows are not available yet.</p></div></div></Section></div>;
}
