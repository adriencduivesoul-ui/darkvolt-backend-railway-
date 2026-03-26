/* ============================================================
   DARKVOLT — CONDITIONS GÉNÉRALES D'UTILISATION
   Droit français — Code de la consommation, LCEN, RGPD
   ============================================================ */

import { useTranslation } from 'react-i18next';
import LegalLayout, { LegalCard, LP, LH, LL } from '@/components/LegalLayout';

export default function CGU() {
  const { t } = useTranslation();
  return (
    <LegalLayout
      tag={t('cgu.tag')}
      title={t('cgu.title')}
      subtitle={t('cgu.subtitle')}
      lastUpdate={t('cgu.lastUpdate')}
    >

      <LegalCard title={t('cgu.preamble.title')} accent="green">
        <LP>{t('cgu.preamble.p1a')}<strong style={{ color: '#e8e8e8' }}>DarkVolt</strong>{t('cgu.preamble.p1b')}</LP>
        <LP>{t('cgu.preamble.p2')}</LP>
      </LegalCard>

      <LegalCard title={t('cgu.art1.title')} accent="green">
        <LP>{t('cgu.art1.intro')}</LP>
        <LL items={t('cgu.art1.items', { returnObjects: true }) as string[]} />
        <LP>{t('cgu.art1.note')}</LP>
      </LegalCard>

      <LegalCard title={t('cgu.art2.title')} accent="green">
        <LH n={2.1}>{t('cgu.art2.h21')}</LH>
        <LP>{t('cgu.art2.p21')}</LP>
        <LH n={2.2}>{t('cgu.art2.h22')}</LH>
        <LP>{t('cgu.art2.p22')}</LP>
        <LH n={2.3}>{t('cgu.art2.h23')}</LH>
        <LP>{t('cgu.art2.p23')}</LP>
        <LP>{t('cgu.art2.p24a')}<strong style={{ color: '#e8e8e8' }}>15</strong>{t('cgu.art2.p24b')}</LP>
      </LegalCard>

      <LegalCard title={t('cgu.art3.title')} accent="none">
        <LP>{t('cgu.art3.intro')}</LP>
        <LL items={t('cgu.art3.items', { returnObjects: true }) as string[]} />
      </LegalCard>

      <LegalCard title={t('cgu.art4.title')} accent="green">
        <LH n={4.1}>{t('cgu.art4.h41')}</LH>
        <LP>{t('cgu.art4.p41')}</LP>
        <LH n={4.2}>{t('cgu.art4.h42')}</LH>
        <LP>{t('cgu.art4.p42')}</LP>
        <LH n={4.3}>{t('cgu.art4.h43')}</LH>
        <LP>{t('cgu.art4.p43')}</LP>
      </LegalCard>

      <LegalCard title={t('cgu.art5.title')} accent="green">
        <LP>{t('cgu.art5.p1')}</LP>
        <LP>{t('cgu.art5.p2')}</LP>
      </LegalCard>

      <LegalCard title={t('cgu.art6.title')} accent="red">
        <LP>{t('cgu.art6.intro')}</LP>
        <LL items={t('cgu.art6.items', { returnObjects: true }) as string[]} />
        <LP>{t('cgu.art6.notea')}<strong style={{ color: '#e8e8e8' }}>contact@darkvolt.fr</strong></LP>
      </LegalCard>

      <LegalCard title={t('cgu.art7.title')} accent="none">
        <LP>{t('cgu.art7.intro')}</LP>
        <LL items={t('cgu.art7.items', { returnObjects: true }) as string[]} />
      </LegalCard>

      <LegalCard title={t('cgu.art8.title')} accent="green">
        <LP>
          {t('cgu.art8.p1a')}
          <a href="/confidentialite" style={{ color: '#39FF14', textDecoration: 'underline' }}>{t('cgu.art8.p1link')}</a>
          {t('cgu.art8.p1b')}
        </LP>
      </LegalCard>

      <LegalCard title={t('cgu.art9.title')} accent="red">
        <LP>{t('cgu.art9.p1')}</LP>
        <LP>
          {t('cgu.art9.p2a')}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#39FF14' }}>ec.europa.eu/consumers/odr</a>
        </LP>
      </LegalCard>

    </LegalLayout>
  );
}
