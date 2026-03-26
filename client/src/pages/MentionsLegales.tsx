/* ============================================================
   DARKVOLT — MENTIONS LÉGALES
   Conformité LCEN (art. 6-III) — Loi n° 2004-575 du 21 juin 2004
   ============================================================ */

import { useTranslation } from 'react-i18next';
import LegalLayout, { LegalCard, LP, LH, LL } from '@/components/LegalLayout';

export default function MentionsLegales() {
  const { t } = useTranslation();
  return (
    <LegalLayout
      tag={t('mentions.tag')}
      title={t('mentions.title')}
      subtitle={t('mentions.subtitle')}
      lastUpdate={t('mentions.lastUpdate')}
    >

      <LegalCard title={t('mentions.s1.title')} accent="green">
        <LP>{t('mentions.s1.p1a')}<strong style={{ color: '#e8e8e8' }}>darkvolt.fr</strong>{t('mentions.s1.p1b')}</LP>
        <LL items={t('mentions.s1.items', { returnObjects: true }) as string[]} />
        <LP>{t('mentions.s1.p2a')}<strong style={{ color: '#e8e8e8' }}>[À COMPLÉTER — Prénom Nom]</strong>.</LP>
      </LegalCard>

      <LegalCard title={t('mentions.s2.title')} accent="green">
        <LP>{t('mentions.s2.p1')}</LP>
        <LL items={t('mentions.s2.items', { returnObjects: true }) as string[]} />
      </LegalCard>

      <LegalCard title={t('mentions.s3.title')} accent="green">
        <LP>{t('mentions.s3.p1')}</LP>
        <LP>{t('mentions.s3.p2')}</LP>
        <LH>{t('mentions.s3.hMusic')}</LH>
        <LP>{t('mentions.s3.pMusic')}</LP>
      </LegalCard>

      <LegalCard title={t('mentions.s4.title')} accent="none">
        <LP>{t('mentions.s4.p1')}</LP>
        <LP>{t('mentions.s4.p2')}</LP>
        <LH>{t('mentions.s4.hLinks')}</LH>
        <LP>{t('mentions.s4.pLinks')}</LP>
      </LegalCard>

      <LegalCard title={t('mentions.s5.title')} accent="green">
        <LP>
          {t('mentions.s5.p1a')}
          <a href="/confidentialite" style={{ color: '#39FF14', textDecoration: 'underline' }}>{t('mentions.s5.p1link')}</a>
          {t('mentions.s5.p1b')}<strong style={{ color: '#e8e8e8' }}>darkvolt.fr/confidentialite</strong>.
        </LP>
        <LP>{t('mentions.s5.p2')}</LP>
        <LP>{t('mentions.s5.p3')}<strong style={{ color: '#e8e8e8' }}>contact@darkvolt.fr</strong></LP>
      </LegalCard>

      <LegalCard title={t('mentions.s6.title')} accent="red">
        <LP>{t('mentions.s6.p1')}</LP>
        <LP>
          {t('mentions.s6.p2a')}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#39FF14' }}>https://ec.europa.eu/consumers/odr</a>
        </LP>
      </LegalCard>

      <LegalCard title={t('mentions.s7.title')} accent="none">
        <LP>{t('mentions.s7.p1')}</LP>
        <LL items={t('mentions.s7.items', { returnObjects: true }) as string[]} />
      </LegalCard>

      <LegalCard title={t('mentions.s8.title')} accent="green">
        <LP>{t('mentions.s8.p1a')}<strong style={{ color: '#e8e8e8' }}>darkvolt.fr</strong>{t('mentions.s8.p1b')}</LP>
        <LL items={t('mentions.s8.items', { returnObjects: true }) as string[]} />
        <LP>
          {t('mentions.s8.p2a')}
          <a href="https://www.néo-création.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#39FF14', textDecoration: 'underline', fontWeight: 600 }}>
            Néo Création
          </a>
          {t('mentions.s8.p2b')}
        </LP>
      </LegalCard>

    </LegalLayout>
  );
}
