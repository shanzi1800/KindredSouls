// Generate all language outputs for review
// Usage: node generate-review.js

import { calcBaZi } from '../web/src/lib/algos/bazi.ts';
import { calcZodiac } from '../web/src/lib/algos/zodiac.ts';
import { calcIChing } from '../web/src/lib/algos/iching.ts';
import type { AlgLang } from '../web/src/lib/algos/i18n.ts';

const LANGS: AlgLang[] = ['th', 'vi', 'fr', 'es'];

// Test couple: 1999-03-15 vs 1998-07-22
const p1 = { year: 1999, month: 3, day: 15 };
const p2 = { year: 1998, month: 7, day: 22 };

let output = '';

for (const lang of LANGS) {
  output += `\n${'='.repeat(80)}\n`;
  output += `语言: ${lang.toUpperCase()}\n`;
  output += `${'='.repeat(80)}\n\n`;

  const bazi = calcBaZi(p1, p2, lang);
  output += `── 八字命理 (BaZi) ──\n`;
  output += `标题: ${typeof bazi.title === 'string' ? bazi.title : bazi.title[lang]}\n`;
  output += `评分: ${bazi.score}/100\n`;
  output += `摘要: ${bazi.summary}\n`;
  output += `详情:\n${bazi.detail}\n\n`;

  const zodiac = calcZodiac(p1, p2, lang);
  output += `── 西方星座 (Zodiac) ──\n`;
  output += `标题: ${typeof zodiac.title === 'string' ? zodiac.title : zodiac.title[lang]}\n`;
  output += `评分: ${zodiac.score}/100\n`;
  output += `摘要: ${zodiac.summary}\n`;
  output += `详情:\n${zodiac.detail}\n\n`;

  const iching = calcIChing(p1, p2, lang);
  output += `── 易经智慧 (I Ching) ──\n`;
  output += `标题: ${typeof iching.title === 'string' ? iching.title : iching.title[lang]}\n`;
  output += `评分: ${iching.score}/100\n`;
  output += `摘要: ${iching.summary}\n`;
  output += `详情:\n${iching.detail}\n\n`;
}

console.log(output);
