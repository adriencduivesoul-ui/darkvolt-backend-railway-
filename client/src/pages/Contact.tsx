/* ============================================================
   DARKVOLT — PAGE CONTACT
   Formulaire de contact + informations
   ============================================================ */

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import LegalLayout, { LegalCard, LP, LH, LL } from '@/components/LegalLayout';

const CLIP = (s = 16) =>
  `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}


export default function Contact() {
  const { t } = useTranslation();
  const SUBJECTS = t('contact.subjects', { returnObjects: true }) as string[];

  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error(t('contact.errorRequired'));
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email)) {
      toast.error(t('contact.errorEmail'));
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    toast.success(t('contact.successMsg'), { description: t('contact.successDesc') });
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    background: '#060606',
    border: `1px solid ${focusedField === field ? '#39FF14' : 'rgba(255,255,255,0.08)'}`,
    color: '#e8e8e8',
    padding: '12px 16px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '14px',
    outline: 'none',
    clipPath: CLIP(8),
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
    boxShadow: focusedField === field ? '0 0 12px rgba(57,255,20,0.12)' : 'none',
  });

  return (
    <LegalLayout
      tag={t('contact.tag')}
      title={t('contact.title')}
      subtitle={t('contact.subtitle')}
      tagColor="green"
    >

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Formulaire (3/5) ────────────────────────────────── */}
        <div className="lg:col-span-3">
          <LegalCard title={t('contact.formTitle')} accent="green">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e855' }}>
                    {t('contact.name')}
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t('contact.namePlaceholder')}
                    style={inputStyle('name')}
                    autoComplete="name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e855' }}>
                    {t('contact.email')}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t('contact.emailPlaceholder')}
                    style={inputStyle('email')}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-2">
                <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e855' }}>
                  {t('contact.subject')}
                </label>
                <select
                  value={form.subject}
                  onChange={set('subject')}
                  onFocus={() => setFocusedField('subject')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputStyle('subject'), appearance: 'none', WebkitAppearance: 'none' }}
                >
                  <option value="" style={{ background: '#0a0a0a' }}>{t('contact.subjectPlaceholder')}</option>
                  {SUBJECTS.map(s => (
                    <option key={s} value={s} style={{ background: '#0a0a0a' }}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#e8e8e855' }}>
                  {t('contact.message')}
                </label>
                <textarea
                  value={form.message}
                  onChange={set('message')}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('contact.messagePlaceholder')}
                  rows={7}
                  style={{ ...inputStyle('message'), resize: 'vertical', minHeight: '160px' }}
                />
              </div>

              {/* RGPD notice */}
              <p className="font-space text-xs leading-relaxed" style={{ color: '#e8e8e833' }}>
                {t('contact.rgpd')}{' '}
                <a href="/confidentialite" style={{ color: '#39FF1466', textDecoration: 'underline' }}>{t('contact.rgpdLink')}</a>.
              </p>

              {/* Submit */}
              <button
                type="submit"
                disabled={sending}
                className="font-orbitron font-bold text-xs tracking-[0.25em] uppercase px-8 py-4 transition-all duration-300 self-start"
                style={{
                  background: sending ? 'rgba(57,255,20,0.1)' : 'transparent',
                  border: '1px solid #39FF14',
                  color: sending ? '#39FF1488' : '#39FF14',
                  clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                  boxShadow: sending ? 'none' : '0 0 10px rgba(57,255,20,0.2)',
                  cursor: sending ? 'wait' : 'none',
                  minWidth: '200px',
                }}
                onMouseEnter={e => {
                  if (!sending) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#39FF14';
                    (e.currentTarget as HTMLButtonElement).style.color = '#050505';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px #39FF14';
                  }
                }}
                onMouseLeave={e => {
                  if (!sending) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = '#39FF14';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 10px rgba(57,255,20,0.2)';
                  }
                }}
              >
                {sending ? t('contact.sending') : t('contact.send')}
              </button>

            </form>
          </LegalCard>
        </div>

        {/* ── Informations (2/5) ──────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Infos de contact */}
          <LegalCard title={t('contact.infoTitle')} accent="green">
            <div className="flex flex-col gap-5">
              {[
                {
                  icon: '📡',
                  label: t('contact.emailGeneral'),
                  value: 'contact@darkvolt.fr',
                  href: 'mailto:contact@darkvolt.fr',
                },
              ].map(({ icon, label, value, href }) => (
                <div key={label} className="flex gap-3 items-start">
                  <span style={{ fontSize: '18px', marginTop: '1px', flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div className="font-orbitron text-xs tracking-[0.15em] uppercase mb-1" style={{ color: '#e8e8e844' }}>{label}</div>
                    <a href={href} className="font-space text-sm transition-colors duration-200" style={{ color: '#39FF1499' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#39FF14')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#39FF1499')}
                    >{value}</a>
                  </div>
                </div>
              ))}
            </div>
          </LegalCard>

          {/* Délai de réponse */}
          <LegalCard title={t('contact.delayTitle')} accent="none">
            <div className="flex flex-col gap-3">
              {[
                { label: t('contact.supportDelay'), delay: t('contact.supportDelayValue') },
                { label: t('contact.rgpdDelay'),    delay: t('contact.rgpdDelayValue')    },
              ].map(({ label, delay }) => (
                <div key={label} className="flex justify-between items-center py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="font-space text-sm" style={{ color: '#e8e8e877' }}>{label}</span>
                  <span className="font-orbitron text-xs tracking-wider" style={{ color: '#39FF14', opacity: 0.7 }}>{delay}</span>
                </div>
              ))}
            </div>
          </LegalCard>

          {/* Réseaux sociaux */}
          <LegalCard title={t('contact.communityTitle')} accent="green">
            <LP>{t('contact.communityDesc')}</LP>
            <div className="flex flex-col gap-2">
              {[
                { href: 'https://discord.com/invite/yr25MqEN',                          color: '#5865F2', label: 'Discord',   sub: t('contact.discordChat') },
                { href: 'https://www.instagram.com/darkvoltwebradio/',                  color: '#E1306C', label: 'Instagram', sub: '@darkvoltwebradio' },
                { href: 'https://www.facebook.com/profile.php?id=61576726258105',       color: '#1877F2', label: 'Facebook',  sub: 'DarkVolt Web Radio' },
              ].map(({ href, color, label, sub }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-2 px-3 transition-all duration-200"
                  style={{ border: '1px solid rgba(255,255,255,0.05)', clipPath: CLIP(6) }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = `${color}44`;
                    (e.currentTarget as HTMLAnchorElement).style.background = `${color}0a`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.05)';
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                  <div>
                    <div className="font-orbitron text-xs tracking-wider uppercase" style={{ color: '#e8e8e8aa' }}>{label}</div>
                    <div className="font-space text-xs" style={{ color: '#e8e8e844' }}>{sub}</div>
                  </div>
                </a>
              ))}
            </div>
          </LegalCard>

        </div>
      </div>

      {/* FAQ rapide */}
      <div className="mt-2">
        <LegalCard title={t('contact.faqTitle')} accent="none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(t('contact.faq', { returnObjects: true }) as { q: string; a: string }[]).map(({ q, a }) => (
              <div key={q} className="flex flex-col gap-2">
                <h4 className="font-orbitron text-[10px] tracking-[0.12em] uppercase" style={{ color: '#39FF14', opacity: 0.8 }}>
                  ▸ {q}
                </h4>
                <p className="font-space text-sm leading-relaxed" style={{ color: '#e8e8e877' }}>{a}</p>
              </div>
            ))}
          </div>
        </LegalCard>
      </div>

    </LegalLayout>
  );
}
