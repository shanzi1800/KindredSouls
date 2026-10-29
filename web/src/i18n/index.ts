import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import th from './locales/th.json';
import vi from './locales/vi.json';

// 🔴 E104-刀二（主公军令 2026-10-30）：六语玄学真值全局字典统一导出——
//    产品线/相位/干支合冲刑害/四大卦象/三张塔罗/UI 锚点七类术语六语逐键锁定，
//    getMetaphysicsTerm(category, key, locale) 为唯一寻址入口（fail-closed）。
export {
  METAPHYSICS_TRUTH_TABLE,
  SOUL_OS_SIGNATURE,
  getMetaphysicsTerm,
} from './metaphysicsTruthTable';
export type {
  SupportedLocale,
  TermRecord,
  IChingCanonicalEntry,
  TarotEntry,
  MetaphysicsTruthTableSchema,
} from './metaphysicsTruthTable';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  es: { translation: es },
  fr: { translation: fr },
  th: { translation: th },
  vi: { translation: vi },
};

i18n
  .use(LanguageDetector)      // 自动检测系统/浏览器语言
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh', 'es', 'fr', 'th', 'vi'],
    detection: {
      // 优先级：URL参数 > localStorage > navigator.language > 系统语言
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],   // 用户选了语言就记住
      lookupQuerystring: 'lang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
