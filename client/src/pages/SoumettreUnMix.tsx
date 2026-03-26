/* ============================================================
   DARKVOLT — SOUMETTRE UN MIX
   Design: Award-winning 2026 — tech-panel process flow
   ============================================================ */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import LegalLayout, { LegalCard, LP } from '@/components/LegalLayout';

/* ── Design tokens ────────────────────────────────────────── */
const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 10) =>
  `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

/* ── Process step card ────────────────────────────────────── */
function StepCard({
  n,
  title,
  desc,
  accent = G,
  details,
}: {
  n: number;
  title: string;
  desc: string;
  accent?: string;
  details?: string[];
}) {
  return (
    <div
      className="relative"
      style={{
        clipPath: CLIP(14),
        background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 50%, ${accent}18 100%)`,
        padding: '1px',
      }}
    >
      <div
        className="relative overflow-hidden flex gap-5 p-6"
        style={{ background: '#090909', clipPath: CLIP(14) }}
      >
        {/* Step number */}
        <div className="flex-shrink-0">
          <div
            className="font-orbitron font-black flex items-center justify-center"
            style={{
              width: '52px',
              height: '52px',
              background: `${accent}12`,
              border: `1px solid ${accent}44`,
              clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
              color: accent,
              fontSize: '22px',
              textShadow: `0 0 20px ${accent}`,
            }}
          >
            {String(n).padStart(2, '0')}
          </div>
        </div>
        {/* Content */}
        <div className="flex flex-col gap-2 flex-1">
          <h3 className="font-orbitron font-bold text-sm tracking-[0.2em] uppercase" style={{ color: accent }}>
            {title}
          </h3>
          <p className="font-space text-sm leading-relaxed" style={{ color: '#e8e8e888' }}>{desc}</p>
          {details && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {details.map((d, i) => (
                <li key={i} className="flex gap-2 font-space text-sm" style={{ color: '#e8e8e866' }}>
                  <span style={{ color: accent, flexShrink: 0 }}>▸</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Diagonal accent */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 14px 14px 0', borderColor: `transparent ${accent}33 transparent transparent`, pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

/* ── Requirement badge ────────────────────────────────────── */
function ReqBadge({ label, ok }: { label: string; ok?: boolean }) {
  const c = ok === false ? R : G;
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5"
      style={{
        background: `${c}0a`,
        border: `1px solid ${c}28`,
        clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
      }}
    >
      <span style={{ color: c, fontSize: '12px' }}>{ok === false ? '✕' : '✓'}</span>
      <span className="font-space text-sm" style={{ color: '#e8e8e8aa' }}>{label}</span>
    </div>
  );
}

/* ── Genre check ─────────────────────────────────────────── */
const GENRES_ACCEPTED = ['Techno', 'Industrial', 'Dark Electro', 'Tribecore', 'Hardtek', 'EBM', 'Noise', 'Expérimental'];
const GENRES_REFUSED  = ['Commercial', 'EDM Festival', 'Pop Mainstream', 'Reggaeton'];

/* ── Form ────────────────────────────────────────────────── */
interface MixForm {
  artistName: string;
  email: string;
  mixTitle: string;
  genre: string;
  duration: string;
  mixUrl: string;
  tracklist: string;
  bio: string;
  social: string;
}

const EMPTY: MixForm = { artistName: '', email: '', mixTitle: '', genre: '', duration: '', mixUrl: '', tracklist: '', bio: '', social: '' };

export default function SoumettreUnMix() {
  const { t } = useTranslation();
  const [form, setForm] = useState<MixForm>(EMPTY);
  const [focused, setFocused] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [, navigate] = useLocation();

  const set = (k: keyof MixForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof MixForm)[] = ['artistName', 'email', 'mixTitle', 'genre', 'mixUrl', 'tracklist'];
    for (const k of required) {
      if (!form[k]) { toast.error(t('submit.errorMissing'), { description: t('submit.errorMissingDesc') }); return; }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error(t('submit.errorEmail')); return; }
    if (!agreed) { toast.error(t('submit.errorAgreement')); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 1400));
    setSending(false);
    toast.success(t('submit.successMsg'), { description: t('submit.successDesc') });
    setForm(EMPTY);
    setAgreed(false);
  };

  const input = (field: string): React.CSSProperties => ({
    width: '100%',
    background: '#060606',
    border: `1px solid ${focused === field ? G : 'rgba(255,255,255,0.07)'}`,
    color: '#e8e8e8',
    padding: '12px 16px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '14px',
    outline: 'none',
    clipPath: CLIP(8),
    transition: 'all 0.25s ease',
    boxShadow: focused === field ? `0 0 14px rgba(57,255,20,0.1)` : 'none',
  });

  return (
    <LegalLayout
      tag={t('submit.tag')}
      title={t('submit.title')}
      subtitle={t('submit.subtitle')}
      tagColor="green"
    >

      {/* ── Process ──────────────────────────────────────── */}
      <div className="mb-12">
        <div className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase mb-6" style={{ color: `${G}66` }}>
          {t('submit.processLabel')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(t('submit.steps', { returnObjects: true }) as { title: string; desc: string }[]).map((s, i) => (
            <StepCard key={i} n={i + 1} title={s.title} accent={i === 2 ? R : G} desc={s.desc} />
          ))}
        </div>
      </div>

      {/* ── Requirements ─────────────────────────────────── */}
      <LegalCard title={t('submit.criteriaTitle')} accent="green">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="font-orbitron text-xs tracking-[0.2em] uppercase mb-4" style={{ color: `${G}66` }}>{t('submit.acceptedLabel')}</p>
            <div className="flex flex-col gap-2">
              {GENRES_ACCEPTED.map(g => <ReqBadge key={g} label={g} ok={true} />)}
            </div>
          </div>
          <div>
            <p className="font-orbitron text-xs tracking-[0.2em] uppercase mb-4" style={{ color: `${R}66` }}>{t('submit.refusedLabel')}</p>
            <div className="flex flex-col gap-2 mb-6">
              {GENRES_REFUSED.map(g => <ReqBadge key={g} label={g} ok={false} />)}
            </div>
            <p className="font-orbitron text-xs tracking-[0.2em] uppercase mb-4 mt-6" style={{ color: `${G}66` }}>{t('submit.techLabel')}</p>
            <div className="flex flex-col gap-2">
              {(t('submit.techItems', { returnObjects: true }) as string[]).map(r => <ReqBadge key={r} label={r} />)}
            </div>
          </div>
        </div>
      </LegalCard>

      {/* ── Form ─────────────────────────────────────────── */}
      <LegalCard title={t('submit.formTitle')} accent="green">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e844' }}>{t('submit.artistName')}</label>
              <input type="text" value={form.artistName} onChange={set('artistName')} onFocus={() => setFocused('artistName')} onBlur={() => setFocused(null)} placeholder={t('submit.artistNamePh')} style={input('artistName')} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e844' }}>{t('submit.emailLabel')}</label>
              <input type="email" value={form.email} onChange={set('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} placeholder="contact@tonalias.com" style={input('email')} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e844' }}>{t('submit.mixTitle')}</label>
              <input type="text" value={form.mixTitle} onChange={set('mixTitle')} onFocus={() => setFocused('mixTitle')} onBlur={() => setFocused(null)} placeholder={t('submit.mixTitlePh')} style={input('mixTitle')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e844' }}>{t('submit.genre')}</label>
                <select value={form.genre} onChange={set('genre')} onFocus={() => setFocused('genre')} onBlur={() => setFocused(null)} style={{ ...input('genre'), appearance: 'none', WebkitAppearance: 'none' }}>
                  <option value="" style={{ background: '#0a0a0a' }}>{t('submit.genrePh')}</option>
                  {GENRES_ACCEPTED.map(g => <option key={g} value={g} style={{ background: '#0a0a0a' }}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e844' }}>{t('submit.duration')}</label>
                <input type="text" value={form.duration} onChange={set('duration')} onFocus={() => setFocused('duration')} onBlur={() => setFocused(null)} placeholder={t('submit.durationPh')} style={input('duration')} />
              </div>
            </div>
          </div>

          {/* Mix URL */}
          <div className="flex flex-col gap-2">
            <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e844' }}>{t('submit.mixUrl')}</label>
            <input type="url" value={form.mixUrl} onChange={set('mixUrl')} onFocus={() => setFocused('mixUrl')} onBlur={() => setFocused(null)} placeholder={t('submit.mixUrlPh')} style={input('mixUrl')} />
            <span className="font-space text-xs" style={{ color: '#e8e8e833' }}>{t('submit.mixUrlHint')}</span>
          </div>

          {/* Tracklist */}
          <div className="flex flex-col gap-2">
            <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e844' }}>{t('submit.tracklist')}</label>
            <textarea value={form.tracklist} onChange={set('tracklist')} onFocus={() => setFocused('tracklist')} onBlur={() => setFocused(null)} rows={6} placeholder={'01. Artiste - Titre [Label]\n02. Artiste - Titre [Label]\n...'} style={{ ...input('tracklist'), resize: 'vertical', minHeight: '140px', fontFamily: 'monospace', fontSize: '13px' }} />
          </div>

          {/* Bio + Social */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e844' }}>{t('submit.bio')}</label>
              <textarea value={form.bio} onChange={set('bio')} onFocus={() => setFocused('bio')} onBlur={() => setFocused(null)} rows={4} placeholder={t('submit.bioPh')} style={{ ...input('bio'), resize: 'vertical' }} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e844' }}>{t('submit.socialLinks')}</label>
              <textarea value={form.social} onChange={set('social')} onFocus={() => setFocused('social')} onBlur={() => setFocused(null)} rows={4} placeholder={'SoundCloud : https://...\nInstagram : https://...\nMixcloud : https://...'} style={{ ...input('social'), resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }} />
            </div>
          </div>

          {/* Accord */}
          <div
            className="flex items-start gap-4 p-4"
            style={{ background: '#060606', border: `1px solid ${agreed ? G + '33' : 'rgba(255,255,255,0.06)'}`, clipPath: CLIP(8), transition: 'border-color 0.3s' }}
          >
            <button
              type="button"
              onClick={() => setAgreed(!agreed)}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-all duration-300 mt-0.5"
              style={{
                background: agreed ? G : 'transparent',
                border: `1.5px solid ${agreed ? G : 'rgba(255,255,255,0.2)'}`,
                clipPath: 'polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%)',
                boxShadow: agreed ? `0 0 12px ${G}44` : 'none',
                color: '#050505',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              {agreed && '✓'}
            </button>
            <p className="font-space text-sm leading-relaxed" style={{ color: '#e8e8e866' }}>
              {t('submit.agreement')} <a href="/cgu" style={{ color: `${G}88`, textDecoration: 'underline' }}>{t('submit.agreementCgu')}</a> {t('submit.agreementAnd')} <a href="/confidentialite" style={{ color: `${G}88`, textDecoration: 'underline' }}>{t('submit.agreementPrivacy')}</a>.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={sending}
              className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-8 py-4 transition-all duration-300"
              style={{
                background: sending ? `${G}18` : 'transparent',
                border: `1px solid ${G}`,
                color: sending ? `${G}88` : G,
                clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                boxShadow: sending ? 'none' : `0 0 14px ${G}33`,
                cursor: sending ? 'wait' : 'none',
                minWidth: '220px',
              }}
              onMouseEnter={e => { if (!sending) { (e.currentTarget as HTMLButtonElement).style.background = G; (e.currentTarget as HTMLButtonElement).style.color = '#050505'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 30px ${G}`; } }}
              onMouseLeave={e => { if (!sending) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = G; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 14px ${G}33`; } }}
            >
              {sending ? t('submit.sending') : t('submit.sendBtn')}
            </button>
            <span className="font-space text-xs" style={{ color: '#e8e8e833' }}>
              {t('submit.responseDelay')}
            </span>
          </div>
        </form>
      </LegalCard>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <LegalCard title={t('submit.faqTitle')} accent="none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(t('submit.faq', { returnObjects: true }) as { q: string; a: string }[]).map(({ q, a }) => (
            <div key={q} className="flex flex-col gap-2">
              <h4 className="font-orbitron text-xs tracking-[0.15em] uppercase" style={{ color: `${G}88` }}>▸ {q}</h4>
              <p className="font-space text-sm leading-relaxed" style={{ color: '#e8e8e866' }}>{a}</p>
            </div>
          ))}
        </div>
      </LegalCard>

    </LegalLayout>
  );
}
