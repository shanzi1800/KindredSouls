import type { } from './legalTerms.mjs';

/** 法律条款类型 */
export type LegalDocType = 'privacy' | 'terms';
/** 法律条款语言（六语白名单） */
export type LegalLang = 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
/** 条款小节 */
export interface LegalSection {
  h: string;
  p: string;
}
/** 条款文档 */
export interface LegalTermsDoc {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const LEGAL_TERMS_LANGS: readonly string[];
export function getLegalTermsDoc(type: string, lang: string): LegalTermsDoc | null;
