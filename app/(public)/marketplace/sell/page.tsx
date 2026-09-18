import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Section } from '@/components/public/ui';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/catalog';
import styles from '@/components/public/MarketplaceExperience.module.css';

export async function generateMetadata() {
  const t = await getTranslations('seo.marketplaceSell');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/marketplace/sell' });
}

export default async function MarketplaceSellPage() {
  const t = await getTranslations('marketplace');
  const steps = t.raw('sellerFlow.steps') as string[];

  return (
    <div className={styles.page}><Section className="!border-0 !bg-transparent"><div className={styles.sellHero}>
          <div>
            <p className={styles.eyebrow}>{t('sellerFlow.eyebrow')}</p><h1>{t('sellerFlow.title')}</h1><p className={styles.sellCopy}>{t('sellerFlow.subtitle')}</p>
          </div>
          <div className={styles.steps}>
            {steps.map((step, index) => (
              <div key={step} className={styles.step}><span>0{index + 1}</span><p>{step}</p>
              </div>
            ))}
          </div>
        </div></Section>

      <Section className="!bg-[#edf1f5]"><div className={styles.formLayout}>
          <div>
            <p className={styles.eyebrow}>{t('postForm.eyebrow')}</p><h2 className={styles.sellHeading}>{t('postForm.title')}</h2><p className={styles.sellCopy}>{t('postForm.note')}</p>
          </div>
          <form className={styles.form} aria-label={t('postForm.title')}>
            <Field label={t('postForm.productTitle')} />
            <label className={styles.field}><span>{t('postForm.category')}</span><select>
                {MARKETPLACE_CATEGORIES.map((category) => (
                  <option key={category.slug}>{t(`categories.${category.labelKey}`)}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('author')} />
              <Field label={t('publisher')} />
              <Field label={t('postForm.edition')} />
              <Field label={t('condition')} />
              <Field label={t('postForm.price')} type="number" />
              <Field label={t('postForm.quantity')} type="number" />
              <Field label={t('location')} />
              <Field label={t('delivery')} />
            </div>
            <label className={styles.field}><span>{t('postForm.description')}</span><textarea />
            </label>
            <p className={styles.disabledNotice}>
              {t('postForm.disabledNotice')}
            </p>
          </form>
        </div></Section></div>
  );
}

function Field({ label, type = 'text' }: { label: string; type?: string }) {
  return (
    <label className={styles.field}><span>{label}</span><input type={type} />
    </label>
  );
}
