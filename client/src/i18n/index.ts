import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';

const saved = localStorage.getItem('darkvolt_lang');
const browser = navigator.language.slice(0, 2);
const fallback = ['fr', 'en'].includes(browser) ? browser : 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: saved ?? fallback,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });

export default i18n;
