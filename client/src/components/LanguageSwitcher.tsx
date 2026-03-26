import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language.slice(0, 2);

  const change = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('darkvolt_lang', code);
  };

  return (
    <div className="flex items-center gap-1">
      {LANGS.map((lang, idx) => (
        <button
          key={lang.code}
          onClick={() => change(lang.code)}
          className="font-orbitron text-[10px] tracking-[0.15em] uppercase transition-all duration-200 px-1.5 py-0.5"
          style={{
            color: current === lang.code ? '#39FF14' : '#e8e8e833',
            textShadow: current === lang.code ? '0 0 8px #39FF14' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRight: idx < LANGS.length - 1 ? '1px solid rgba(57,255,20,0.15)' : 'none',
          }}
          onMouseEnter={e => {
            if (current !== lang.code)
              (e.currentTarget as HTMLButtonElement).style.color = '#e8e8e888';
          }}
          onMouseLeave={e => {
            if (current !== lang.code)
              (e.currentTarget as HTMLButtonElement).style.color = '#e8e8e833';
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
