/* ============================================================
   DARKVOLT — POLITIQUE DE CONFIDENTIALITÉ
   Conformité RGPD (Règlement UE 2016/679) + Loi Informatique et Libertés
   ============================================================ */

import { useTranslation } from 'react-i18next';
import LegalLayout, { LegalCard, LP, LH, LL } from '@/components/LegalLayout';

export default function Confidentialite() {
  const { t } = useTranslation();
  const s3rows = t('confidentialite.s3.rows', { returnObjects: true }) as string[][];
  const s3headers = t('confidentialite.s3.headers', { returnObjects: true }) as string[];
  return (
    <LegalLayout
      tag={t('confidentialite.tag')}
      title={t('confidentialite.title')}
      subtitle={t('confidentialite.subtitle')}
      lastUpdate={t('confidentialite.lastUpdate')}
      tagColor="green"
    >

      <LegalCard title={t('confidentialite.s1.title')} accent="green">
        <LP>{t('confidentialite.s1.intro')}</LP>
        <LL items={t('confidentialite.s1.items', { returnObjects: true }) as string[]} />
        <LP>{t('confidentialite.s1.p1')}</LP>
      </LegalCard>

      <LegalCard title={t('confidentialite.s2.title')} accent="green">
        <LH n={2.1}>{t('confidentialite.s2.h21')}</LH>
        <LL items={t('confidentialite.s2.items21', { returnObjects: true }) as string[]} />
        <LH n={2.2}>{t('confidentialite.s2.h22')}</LH>
        <LL items={t('confidentialite.s2.items22', { returnObjects: true }) as string[]} />
        <LH n={2.3}>{t('confidentialite.s2.h23')}</LH>
        <LL items={t('confidentialite.s2.items23', { returnObjects: true }) as string[]} />
        <LH n={2.4}>{t('confidentialite.s2.h24')}</LH>
        <LP>{t('confidentialite.s2.p24')}</LP>
      </LegalCard>

      <LegalCard title={t('confidentialite.s3.title')} accent="green">
        <LP>{t('confidentialite.s3.intro')}</LP>
        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(57,255,20,0.2)' }}>
                {s3headers.map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#39FF14', fontFamily: 'Orbitron, sans-serif', fontSize: '11px', letterSpacing: '0.15em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s3rows.map(([purpose, basis], i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', color: '#e8e8e8aa' }}>{purpose}</td>
                  <td style={{ padding: '10px 12px', color: '#e8e8e866' }}>{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalCard>

      <LegalCard title={t('confidentialite.s4.title')} accent="none">
        <LL items={t('confidentialite.s4.items', { returnObjects: true }) as string[]} />
        <LP>{t('confidentialite.s4.p1')}</LP>
      </LegalCard>

      <LegalCard title={t('confidentialite.s5.title')} accent="none">
        <LH n={5.1}>{t('confidentialite.s5.h51')}</LH>
        <LP>{t('confidentialite.s5.p51')}</LP>
        <LL items={t('confidentialite.s5.items51', { returnObjects: true }) as string[]} />
        <LH n={5.2}>{t('confidentialite.s5.h52')}</LH>
        <LP>{t('confidentialite.s5.p52')}</LP>
        <LH n={5.3}>{t('confidentialite.s5.h53')}</LH>
        <LP>{t('confidentialite.s5.p53')}</LP>
      </LegalCard>

      <LegalCard title={t('confidentialite.s6.title')} accent="green">
        <LP>{t('confidentialite.s6.p1')}</LP>
        <LH>{t('confidentialite.s6.hNecessary')}</LH>
        <LL items={t('confidentialite.s6.itemsNecessary', { returnObjects: true }) as string[]} />
        <LH>{t('confidentialite.s6.hConsent')}</LH>
        <LL items={t('confidentialite.s6.itemsConsent', { returnObjects: true }) as string[]} />
        <LP>{t('confidentialite.s6.p2')}</LP>
      </LegalCard>

      <LegalCard title={t('confidentialite.s7.title')} accent="green">
        <LP>{t('confidentialite.s7.p1')}</LP>
        <LL items={t('confidentialite.s7.items', { returnObjects: true }) as string[]} />
        <LH>{t('confidentialite.s7.hExercise')}</LH>
        <LP>
          {t('confidentialite.s7.pExercicea')}<strong style={{ color: '#e8e8e8' }}>contact@darkvolt.fr</strong>
          {t('confidentialite.s7.pExerciseb')}<strong style={{ color: '#39FF14' }}>{t('confidentialite.s7.oneMonth')}</strong>
          {t('confidentialite.s7.pExercisec')}
        </LP>
      </LegalCard>

      <LegalCard title={t('confidentialite.s8.title')} accent="red">
        <LP>{t('confidentialite.s8.p1')}</LP>
        <LL items={t('confidentialite.s8.items', { returnObjects: true }) as string[]} />
        <LP>{t('confidentialite.s8.p2')}</LP>
      </LegalCard>

      <LegalCard title={t('confidentialite.s9.title')} accent="none">
        <LP>{t('confidentialite.s9.p1')}</LP>
        <LL items={t('confidentialite.s9.items', { returnObjects: true }) as string[]} />
      </LegalCard>

    </LegalLayout>
  );
}
