import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  es: { translation: es },
  fr: { translation: fr },
};

i18n
  .use(LanguageDetector)      // 自动检测系统/浏览器语言
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh', 'es', 'fr'],
    detection: {
      // 优先级：URL参数 > localStorage > navigator.language > 系统语言
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],   // 用户选了语言就记住
      lookupQuerystring: 'lang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
