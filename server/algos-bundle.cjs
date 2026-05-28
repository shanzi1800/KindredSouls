var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/algos/index.ts
var index_exports = {};
__export(index_exports, {
  calculateCompatibility: () => calculateCompatibility,
  parseBirthday: () => parseBirthday
});
module.exports = __toCommonJS(index_exports);

// src/lib/algos/bazi.ts
var TIANGAN = ["\u7532", "\u4E59", "\u4E19", "\u4E01", "\u620A", "\u5DF1", "\u5E9A", "\u8F9B", "\u58EC", "\u7678"];
var DIZHI = ["\u5B50", "\u4E11", "\u5BC5", "\u536F", "\u8FB0", "\u5DF3", "\u5348", "\u672A", "\u7533", "\u9149", "\u620C", "\u4EA5"];
var TG_WUXING = {
  "\u7532": "\u6728",
  "\u4E59": "\u6728",
  "\u4E19": "\u706B",
  "\u4E01": "\u706B",
  "\u620A": "\u571F",
  "\u5DF1": "\u571F",
  "\u5E9A": "\u91D1",
  "\u8F9B": "\u91D1",
  "\u58EC": "\u6C34",
  "\u7678": "\u6C34"
};
var DZ_WUXING = {
  "\u5B50": "\u6C34",
  "\u4E11": "\u571F",
  "\u5BC5": "\u6728",
  "\u536F": "\u6728",
  "\u8FB0": "\u571F",
  "\u5DF3": "\u706B",
  "\u5348": "\u706B",
  "\u672A": "\u571F",
  "\u7533": "\u91D1",
  "\u9149": "\u91D1",
  "\u620C": "\u571F",
  "\u4EA5": "\u6C34"
};
var TIANGAN_LIUHE = {
  "\u7532": "\u5DF1",
  "\u5DF1": "\u7532",
  "\u4E59": "\u5E9A",
  "\u5E9A": "\u4E59",
  "\u4E19": "\u8F9B",
  "\u8F9B": "\u4E19",
  "\u4E01": "\u58EC",
  "\u58EC": "\u4E01",
  "\u620A": "\u7678",
  "\u7678": "\u620A"
};
var DZHI_SANHE = {
  "\u7533": { partners: "\u5B50\u8FB0", element: "\u6C34" },
  "\u5B50": { partners: "\u7533\u8FB0", element: "\u6C34" },
  "\u8FB0": { partners: "\u7533\u5B50", element: "\u6C34" },
  "\u5BC5": { partners: "\u5348\u620C", element: "\u706B" },
  "\u5348": { partners: "\u5BC5\u620C", element: "\u706B" },
  "\u620C": { partners: "\u5BC5\u5348", element: "\u706B" },
  "\u4EA5": { partners: "\u536F\u672A", element: "\u6728" },
  "\u536F": { partners: "\u4EA5\u672A", element: "\u6728" },
  "\u672A": { partners: "\u4EA5\u536F", element: "\u6728" },
  "\u5DF3": { partners: "\u9149\u4E11", element: "\u91D1" },
  "\u9149": { partners: "\u5DF3\u4E11", element: "\u91D1" },
  "\u4E11": { partners: "\u5DF3\u9149", element: "\u91D1" }
};
var DZHI_LIUCHONG = {
  "\u5B50": "\u5348",
  "\u5348": "\u5B50",
  "\u4E11": "\u672A",
  "\u672A": "\u4E11",
  "\u5BC5": "\u7533",
  "\u7533": "\u5BC5",
  "\u536F": "\u9149",
  "\u9149": "\u536F",
  "\u8FB0": "\u620C",
  "\u620C": "\u8FB0",
  "\u5DF3": "\u4EA5",
  "\u4EA5": "\u5DF3"
};
var RISHI_RELATION = {
  // 同类=和合(85-95)，生我者=被生(75-85)，我生者=消耗(65-75)
  // 克我者=压力(55-65)，我克者=掌控(60-70)
  "\u7532": { "\u7532": 90, "\u4E59": 92, "\u4E19": 78, "\u4E01": 76, "\u620A": 68, "\u5DF1": 70, "\u5E9A": 58, "\u8F9B": 60, "\u58EC": 88, "\u7678": 86 },
  "\u4E59": { "\u7532": 92, "\u4E59": 90, "\u4E19": 80, "\u4E01": 78, "\u620A": 66, "\u5DF1": 68, "\u5E9A": 56, "\u8F9B": 58, "\u58EC": 86, "\u7678": 88 },
  "\u4E19": { "\u7532": 72, "\u4E59": 74, "\u4E19": 88, "\u4E01": 90, "\u620A": 82, "\u5DF1": 84, "\u5E9A": 64, "\u8F9B": 62, "\u58EC": 78, "\u4E01": 76 },
  "\u4E01": { "\u7532": 70, "\u4E59": 72, "\u4E19": 90, "\u4E01": 88, "\u620A": 84, "\u5DF1": 82, "\u8F9B": 64, "\u5E9A": 62, "\u4E01": 76, "\u58EC": 78 },
  "\u620A": { "\u7532": 68, "\u4E59": 66, "\u4E19": 82, "\u4E01": 84, "\u620A": 90, "\u5DF1": 92, "\u5E9A": 74, "\u8F9B": 76, "\u58EC": 58, "\u7678": 56 },
  "\u5DF1": { "\u7532": 70, "\u4E59": 68, "\u4E19": 84, "\u4E01": 82, "\u5DF1": 92, "\u620A": 90, "\u8F9B": 74, "\u5E9A": 76, "\u7678": 58, "\u58EC": 56 },
  "\u5E9A": { "\u7532": 62, "\u4E59": 60, "\u4E19": 66, "\u4E01": 64, "\u620A": 76, "\u5DF1": 74, "\u5E9A": 90, "\u8F9B": 92, "\u58EC": 72, "\u7678": 70 },
  "\u8F9B": { "\u7532": 60, "\u4E59": 58, "\u4E19": 64, "\u4E01": 66, "\u620A": 74, "\u5DF1": 76, "\u8F9B": 92, "\u5E9A": 90, "\u7678": 70, "\u58EC": 72 },
  "\u58EC": { "\u7532": 82, "\u4E59": 84, "\u4E19": 76, "\u4E01": 78, "\u620A": 58, "\u5DF1": 56, "\u5E9A": 72, "\u8F9B": 70, "\u58EC": 90, "\u7678": 92 },
  "\u7678": { "\u7532": 84, "\u4E59": 82, "\u4E19": 78, "\u4E01": 76, "\u620A": 56, "\u5DF1": 58, "\u5E9A": 70, "\u8F9B": 72, "\u7678": 92, "\u58EC": 90 }
};
function yearTianGan(year) {
  const idx = (year - 4) % 10;
  return TIANGAN[(idx + 10) % 10];
}
function yearDiZhi(year) {
  const idx = (year - 4) % 12;
  return DIZHI[(idx + 12) % 12];
}
function monthDiZhi(month) {
  const idx = (month + 1) % 12;
  return DIZHI[idx];
}
function monthTianGan(yearTG, monthDZ) {
  const startMap = {
    "\u7532": 0,
    "\u5DF1": 0,
    // 甲己之年丙作首
    "\u4E59": 2,
    "\u5E9A": 2,
    // 乙庚之岁戊为头
    "\u4E19": 4,
    "\u8F9B": 4,
    // 丙辛必定寻庚起
    "\u4E01": 6,
    "\u58EC": 6,
    // 丁壬壬位顺行流
    "\u620A": 8,
    "\u7678": 8
    // 戊癸之年何方觅，甲寅之上好追求
  };
  const monthIdx = DIZHI.indexOf(monthDZ);
  const startIdx = startMap[yearTG] ?? 0;
  return TIANGAN[(startIdx + monthIdx) % 10];
}
function dayStemBranch(year, month, day) {
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1e3 * 60 * 60 * 24));
  const stemIdx = (diffDays % 10 + 10) % 10;
  const branchIdx = (diffDays % 12 + 12) % 12;
  return [TIANGAN[stemIdx], DIZHI[branchIdx]];
}
function paipan(info) {
  const yTG = yearTianGan(info.year);
  const yDZ = yearDiZhi(info.year);
  const mDZ = monthDiZhi(info.month);
  const mTG = monthTianGan(yTG, mDZ);
  const [dTG, dDZ] = dayStemBranch(info.year, info.month, info.day);
  return {
    year: [yTG, yDZ],
    month: [mTG, mDZ],
    day: [dTG, dDZ],
    dayMaster: dTG,
    dayPillar: `${dTG}${dDZ}\u65E5`
  };
}
function calcBaZi(p1, p2) {
  const sz1 = paipan(p1);
  const sz2 = paipan(p2);
  const rishiBase = RISHI_RELATION[sz1.dayMaster]?.[sz2.dayMaster] ?? 70;
  let rishiScore = rishiBase;
  const p1Wuxing = [
    TG_WUXING[sz1.year[0]],
    DZ_WUXING[sz1.year[1]],
    TG_WUXING[sz1.month[0]],
    DZ_WUXING[sz1.month[1]],
    TG_WUXING[sz1.day[0]],
    DZ_WUXING[sz1.day[1]]
  ];
  const p2Wuxing = [
    TG_WUXING[sz2.year[0]],
    DZ_WUXING[sz2.year[1]],
    TG_WUXING[sz2.month[0]],
    DZ_WUXING[sz2.month[1]],
    TG_WUXING[sz2.day[0]],
    DZ_WUXING[sz2.day[1]]
  ];
  const countWuxing = (list) => {
    const counts = { "\u6728": 0, "\u706B": 0, "\u571F": 0, "\u91D1": 0, "\u6C34": 0 };
    for (const w of list) counts[w] = (counts[w] || 0) + 1;
    return counts;
  };
  const wx1 = countWuxing(p1Wuxing);
  const wx2 = countWuxing(p2Wuxing);
  let wuxingBonus = 0;
  const wuxingDetails = [];
  for (const w of ["\u6728", "\u706B", "\u571F", "\u91D1", "\u6C34"]) {
    const diff = (wx1[w] || 0) - (wx2[w] || 0);
    if (Math.abs(diff) >= 2 && (wx1[w] || 0) + (wx2[w] || 0) >= 3) {
      if (diff > 0) {
        wuxingBonus += 3;
        wuxingDetails.push(`\u4F60${w}\u65FA\uFF0C\u5BF9\u65B9\u53EF\u53D7\u76CA\u4E8E\u4F60\u7684${w}\u6C14`);
      } else {
        wuxingBonus += 3;
        wuxingDetails.push(`\u5BF9\u65B9${w}\u65FA\uFF0C\u4F60\u53EF\u53D7\u76CA\u4E8E\u5BF9\u65B9\u7684${w}\u6C14`);
      }
    }
  }
  const wuxingScore = Math.min(100, 60 + wuxingBonus + (wuxingDetails.length > 0 ? 5 : 0));
  let hehunBonus = 0;
  const hehunDetails = [];
  if (TIANGAN_LIUHE[sz1.dayMaster] === sz2.dayMaster) {
    hehunBonus += 12;
    hehunDetails.push(`\u65E5\u5E72${sz1.dayMaster}\u4E0E${sz2.dayMaster}\u5F62\u6210\u3010\u5929\u5E72\u516D\u5408\u3011\uFF0C\u60C5\u611F\u7EBD\u5E26\u6781\u5F3A`);
  }
  for (const label of ["\u5E74", "\u6708", "\u65E5"]) {
    const dz1 = label === "\u5E74" ? sz1.year[1] : label === "\u6708" ? sz1.month[1] : sz1.day[1];
    const dz2 = label === "\u5E74" ? sz2.year[1] : label === "\u6708" ? sz2.month[1] : sz2.day[1];
    const sanhe = DZHI_SANHE[dz1];
    if (sanhe && sanhe.partners.includes(dz2)) {
      hehunBonus += 10;
      hehunDetails.push(`${label}\u652F${dz1}\u4E0E${dz2}\u53C2\u4E0E\u3010\u4E09\u5408${sanhe.element}\u5C40\u3011\uFF0C\u6839\u57FA\u7A33\u56FA`);
    }
    if (DZHI_LIUCHONG[dz1] === dz2) {
      hehunBonus -= 8;
      hehunDetails.push(`${label}\u652F${dz1}\u4E0E${dz2}\u5F62\u6210\u3010\u516D\u51B2\u3011\uFF0C\u9700\u6CE8\u610F\u6C9F\u901A\u65B9\u5F0F`);
    }
  }
  const rawScore = Math.round(
    rishiScore * 0.5 + wuxingScore * 0.3 + Math.max(40, Math.min(100, 70 + hehunBonus)) * 0.2
  );
  const score = Math.max(35, Math.min(99, rawScore));
  const allDetails = [...wuxingDetails, ...hehunDetails];
  let summary;
  if (score >= 85) {
    summary = `\u65E5\u4E3B${sz1.dayMaster}\u9047${sz2.dayMaster}\uFF0C\u5929\u5E72\u6709\u60C5\uFF0C\u5730\u652F\u6709\u5408\uFF0C\u5C5E\u4E0A\u7B49\u59FB\u7F18\u3002`;
  } else if (score >= 72) {
    summary = `\u65E5\u67F1${sz1.dayPillar}\u4E0E${sz2.dayPillar}\u4E94\u884C\u4E92\u6839\uFF0C\u5F7C\u6B64\u80FD\u4E92\u76F8\u6210\u5C31\u3002`;
  } else if (score >= 60) {
    summary = `\u547D\u76D8\u663E\u793A\u6027\u683C\u4E92\u8865\u7A7A\u95F4\u5927\uFF0C\u7528\u5FC3\u7ECF\u8425\u53EF\u6E10\u5165\u4F73\u5883\u3002`;
  } else {
    summary = `\u4E94\u884C\u914D\u7F6E\u5DEE\u5F02\u8F83\u5927\uFF0C\u4F46\u5DEE\u5F02\u6B63\u662F\u6210\u957F\u5951\u673A\uFF0C\u5173\u952E\u5728\u5305\u5BB9\u3002`;
  }
  const detail = [
    `\u3010\u56DB\u67F1\u6392\u76D8\u3011`,
    `\u4F60\uFF1A\u5E74\u67F1${sz1.year[0]}${sz1.year[1]} \u6708\u67F1${sz1.month[0]}${sz1.month[1]} \u65E5\u67F1${sz1.dayPillar}`,
    `TA\uFF1A\u5E74\u67F1${sz2.year[0]}${sz2.year[1]} \u6708\u67F1${sz2.month[0]}${sz2.month[1]} \u65E5\u67F1${sz2.dayPillar}`,
    ``,
    `\u3010\u65E5\u4E3B\u5206\u6790\u3011`,
    `\u4F60\u65E5\u4E3B${sz1.dayMaster}\uFF08${TG_WUXING[sz1.dayMaster]}\uFF09\uFF0CTA\u65E5\u4E3B${sz2.dayMaster}\uFF08${TG_WUXING[sz2.dayMaster]}\uFF09\u3002${rishiBase >= 80 ? "\u4E24\u8005\u6027\u8D28\u76F8\u8FD1\uFF0C\u9ED8\u5951\u5929\u7136\u3002" : rishiBase >= 70 ? "\u6027\u8D28\u4E0D\u540C\u4F46\u80FD\u4E92\u8865\uFF0C\u4E92\u76F8\u6FC0\u53D1\u6F5C\u80FD\u3002" : "\u6027\u8D28\u5DEE\u5F02\u8F83\u5927\uFF0C\u9700\u8981\u66F4\u591A\u7406\u89E3\u548C\u78E8\u5408\u3002"}`,
    ...allDetails.length > 0 ? [`
\u3010\u5408\u5A5A\u5173\u7CFB\u3011`, ...allDetails] : [],
    `
\u7EFC\u5408\u8BC4\u5206\uFF1A${score}/100 \u2014 ${score >= 80 ? "\u7F18\u5206\u6DF1\u539A\uFF0C\u73CD\u60DC\u5F7C\u6B64" : score >= 65 ? "\u57FA\u7840\u826F\u597D\uFF0C\u7528\u5FC3\u7ECF\u8425" : "\u9700\u8981\u78E8\u5408\uFF0C\u4F46\u503C\u5F97\u52AA\u529B"}`
  ].join("\n");
  return {
    score,
    title: "\u516B\u5B57\u547D\u7406",
    summary,
    detail
  };
}

// src/lib/algos/zodiac.ts
var ZODIAC_SIGNS = [
  "\u767D\u7F8A\u5EA7",
  "\u91D1\u725B\u5EA7",
  "\u53CC\u5B50\u5EA7",
  "\u5DE8\u87F9\u5EA7",
  "\u72EE\u5B50\u5EA7",
  "\u5904\u5973\u5EA7",
  "\u5929\u79E4\u5EA7",
  "\u5929\u874E\u5EA7",
  "\u5C04\u624B\u5EA7",
  "\u6469\u7FAF\u5EA7",
  "\u6C34\u74F6\u5EA7",
  "\u53CC\u9C7C\u5EA7"
];
var SIGN_ELEMENT = {
  "\u767D\u7F8A\u5EA7": "\u706B",
  "\u72EE\u5B50\u5EA7": "\u706B",
  "\u5C04\u624B\u5EA7": "\u706B",
  "\u91D1\u725B\u5EA7": "\u571F",
  "\u5904\u5973\u5EA7": "\u571F",
  "\u6469\u7FAF\u5EA7": "\u571F",
  "\u53CC\u5B50\u5EA7": "\u98CE",
  "\u5929\u79E4\u5EA7": "\u98CE",
  "\u6C34\u74F6\u5EA7": "\u98CE",
  "\u5DE8\u87F9\u5EA7": "\u6C34",
  "\u5929\u874E\u5EA7": "\u6C34",
  "\u53CC\u9C7C\u5EA7": "\u6C34"
};
var SIGN_MODE = {
  "\u767D\u7F8A\u5EA7": "\u57FA\u672C",
  "\u5DE8\u87F9\u5EA7": "\u57FA\u672C",
  "\u5929\u79E4\u5EA7": "\u57FA\u672C",
  "\u6469\u7FAF\u5EA7": "\u57FA\u672C",
  "\u91D1\u725B\u5EA7": "\u56FA\u5B9A",
  "\u72EE\u5B50\u5EA7": "\u56FA\u5B9A",
  "\u5929\u874E\u5EA7": "\u56FA\u5B9A",
  "\u6C34\u74F6\u5EA7": "\u56FA\u5B9A",
  "\u53CC\u5B50\u5EA7": "\u53D8\u52A8",
  "\u5C04\u624B\u5EA7": "\u53D8\u52A8",
  "\u53CC\u9C7C\u5EA7": "\u53D8\u52A8",
  "\u5904\u5973\u5EA7": "\u53D8\u52A8"
};
var SIGN_RULER = {
  "\u767D\u7F8A\u5EA7": "\u706B\u661F",
  "\u91D1\u725B\u5EA7": "\u91D1\u661F",
  "\u53CC\u5B50\u5EA7": "\u6C34\u661F",
  "\u5DE8\u87F9\u5EA7": "\u6708\u4EAE",
  "\u72EE\u5B50\u5EA7": "\u592A\u9633",
  "\u5904\u5973\u5EA7": "\u6C34\u661F",
  "\u5929\u79E4\u5EA7": "\u91D1\u661F",
  "\u5929\u874E\u5EA7": "\u51A5\u738B\u661F",
  "\u5C04\u624B\u5EA7": "\u6728\u661F",
  "\u6469\u7FAF\u5EA7": "\u571F\u661F",
  "\u6C34\u74F6\u5EA7": "\u5929\u738B\u661F",
  "\u53CC\u9C7C\u5EA7": "\u6D77\u738B\u661F"
};
var ZODIAC_DATES = [
  { month: 1, day: 19, sign: "\u6469\u7FAF\u5EA7" },
  { month: 1, day: 31, sign: "\u6C34\u74F6\u5EA7" },
  { month: 2, day: 18, sign: "\u6C34\u74F6\u5EA7" },
  { month: 2, day: 29, sign: "\u53CC\u9C7C\u5EA7" },
  { month: 3, day: 20, sign: "\u53CC\u9C7C\u5EA7" },
  { month: 3, day: 31, sign: "\u767D\u7F8A\u5EA7" },
  { month: 4, day: 19, sign: "\u767D\u7F8A\u5EA7" },
  { month: 4, day: 30, sign: "\u91D1\u725B\u5EA7" },
  { month: 5, day: 20, sign: "\u91D1\u725B\u5EA7" },
  { month: 5, day: 31, sign: "\u53CC\u5B50\u5EA7" },
  { month: 6, day: 21, sign: "\u53CC\u5B50\u5EA7" },
  { month: 6, day: 30, sign: "\u5DE8\u87F9\u5EA7" },
  { month: 7, day: 22, sign: "\u5DE8\u87F9\u5EA7" },
  { month: 7, day: 31, sign: "\u72EE\u5B50\u5EA7" },
  { month: 8, day: 22, sign: "\u72EE\u5B50\u5EA7" },
  { month: 8, day: 31, sign: "\u5904\u5973\u5EA7" },
  { month: 9, day: 22, sign: "\u5904\u5973\u5EA7" },
  { month: 9, day: 30, sign: "\u5929\u79E4\u5EA7" },
  { month: 10, day: 23, sign: "\u5929\u79E4\u5EA7" },
  { month: 10, day: 31, sign: "\u5929\u874E\u5EA7" },
  { month: 11, day: 21, sign: "\u5929\u874E\u5EA7" },
  { month: 11, day: 30, sign: "\u5C04\u624B\u5EA7" },
  { month: 12, day: 21, sign: "\u5C04\u624B\u5EA7" },
  { month: 12, day: 31, sign: "\u6469\u7FAF\u5EA7" }
];
var BEST_MATCHES = {
  "\u767D\u7F8A\u5EA7": ["\u72EE\u5B50\u5EA7", "\u5C04\u624B\u5EA7", "\u53CC\u5B50\u5EA7"],
  "\u91D1\u725B\u5EA7": ["\u5904\u5973\u5EA7", "\u6469\u7FAF\u5EA7", "\u5DE8\u87F9\u5EA7"],
  "\u53CC\u5B50\u5EA7": ["\u5929\u79E4\u5EA7", "\u6C34\u74F6\u5EA7", "\u767D\u7F8A\u5EA7"],
  "\u5DE8\u87F9\u5EA7": ["\u5929\u874E\u5EA7", "\u53CC\u9C7C\u5EA7", "\u91D1\u725B\u5EA7"],
  "\u72EE\u5B50\u5EA7": ["\u767D\u7F8A\u5EA7", "\u5C04\u624B\u5EA7", "\u53CC\u5B50\u5EA7"],
  "\u5904\u5973\u5EA7": ["\u91D1\u725B\u5EA7", "\u6469\u7FAF\u5EA7", "\u5929\u874E\u5EA7"],
  "\u5929\u79E4\u5EA7": ["\u53CC\u5B50\u5EA7", "\u6C34\u74F6\u5EA7", "\u5C04\u624B\u5EA7"],
  "\u5929\u874E\u5EA7": ["\u5DE8\u87F9\u5EA7", "\u53CC\u9C7C\u5EA7", "\u5904\u5973\u5EA7"],
  "\u5C04\u624B\u5EA7": ["\u767D\u7F8A\u5EA7", "\u72EE\u5B50\u5EA7", "\u5929\u79E4\u5EA7"],
  "\u6469\u7FAF\u5EA7": ["\u91D1\u725B\u5EA7", "\u5904\u5973\u5EA7", "\u5DE8\u87F9\u5EA7"],
  "\u6C34\u74F6\u5EA7": ["\u53CC\u5B50\u5EA7", "\u5929\u79E4\u5EA7", "\u5C04\u624B\u5EA7"],
  "\u53CC\u9C7C\u5EA7": ["\u5DE8\u87F9\u5EA7", "\u5929\u874E\u5EA7", "\u6469\u7FAF\u5EA7"]
};
var OPPOSITES = {
  "\u767D\u7F8A\u5EA7": "\u5929\u79E4\u5EA7",
  "\u5929\u79E4\u5EA7": "\u767D\u7F8A\u5EA7",
  "\u91D1\u725B\u5EA7": "\u5929\u874E\u5EA7",
  "\u5929\u874E\u5EA7": "\u91D1\u725B\u5EA7",
  "\u53CC\u5B50\u5EA7": "\u5C04\u624B\u5EA7",
  "\u5C04\u624B\u5EA7": "\u53CC\u5B50\u5EA7",
  "\u5DE8\u87F9\u5EA7": "\u6469\u7FAF\u5EA7",
  "\u6469\u7FAF\u5EA7": "\u5DE8\u87F9\u5EA7",
  "\u72EE\u5B50\u5EA7": "\u6C34\u74F6\u5EA7",
  "\u6C34\u74F6\u5EA7": "\u72EE\u5B50\u5EA7",
  "\u5904\u5973\u5EA7": "\u53CC\u9C7C\u5EA7",
  "\u53CC\u9C7C\u5EA7": "\u5904\u5973\u5EA7"
};
var SQUARES = {
  "\u767D\u7F8A\u5EA7": "\u5DE8\u87F9\u5EA7",
  "\u5DE8\u87F9\u5EA7": "\u6469\u7FAF\u5EA7",
  "\u91D1\u725B\u5EA7": "\u72EE\u5B50\u5EA7",
  "\u72EE\u5B50\u5EA7": "\u5929\u874E\u5EA7",
  "\u53CC\u5B50\u5EA7": "\u5904\u5973\u5EA7",
  "\u5904\u5973\u5EA7": "\u5C04\u624B\u5EA7",
  "\u5929\u79E4\u5EA7": "\u6469\u7FAF\u5EA7",
  "\u6469\u7FAF\u5EA7": "\u767D\u7F8A\u5EA7",
  "\u5929\u874E\u5EA7": "\u6C34\u74F6\u5EA7",
  "\u6C34\u74F6\u5EA7": "\u91D1\u725B\u5EA7",
  "\u5C04\u624B\u5EA7": "\u53CC\u9C7C\u5EA7",
  "\u53CC\u9C7C\u5EA7": "\u53CC\u5B50\u5EA7"
};
function getZodiac(month, day) {
  for (const range of ZODIAC_DATES) {
    if (month === range.month && day <= range.day) return range.sign;
  }
  return "\u6469\u7FAF\u5EA7";
}
function getPhaseDistance(z1, z2) {
  const idx1 = ZODIAC_SIGNS.indexOf(z1);
  const idx2 = ZODIAC_SIGNS.indexOf(z2);
  let dist = Math.abs(idx1 - idx2);
  if (dist > 6) dist = 12 - dist;
  return dist;
}
function calcZodiac(p1, p2) {
  const z1 = getZodiac(p1.month, p1.day);
  const z2 = getZodiac(p2.month, p2.day);
  const isBestMatch = BEST_MATCHES[z1]?.includes(z2) ?? false;
  const baseScore = isBestMatch ? 85 : 65;
  const phaseDist = getPhaseDistance(z1, z2);
  let phaseScore = 70;
  let phaseDesc = "";
  if (phaseDist === 0) {
    phaseScore = 88;
    phaseDesc = "\u540C\u661F\u5EA7\uFF080\xB0\u5408\u76F8\uFF09\uFF0C\u5F7C\u6B64\u6DF1\u5EA6\u7406\u89E3\uFF0C\u4F46\u4E5F\u5BB9\u6613\u653E\u5927\u76F8\u540C\u5F31\u70B9";
  } else if (phaseDist === 6) {
    phaseScore = 58;
    phaseDesc = `\u5BF9\u5BAB\u76F8\u4F4D\uFF08${z1} \u2194 ${z2}\uFF09\uFF0C\u5438\u5F15\u529B\u6781\u5F3A\u4F46\u9700\u5E73\u8861\u5DEE\u5F02`;
  } else if (phaseDist === 3 || phaseDist === 9 % 12 < 3 ? false : phaseDist === 3) {
    const isSquare = SQUARES[z1] === z2 || Object.values(SQUARES).includes(z1);
    if (isSquare || phaseDist === 3) {
      phaseScore = 62;
      phaseDesc = `\u56DB\u5206\u76F8\u4F4D\uFF08${z1} \u25A1 ${z2}\uFF09\uFF0C\u5B58\u5728\u6210\u957F\u5F20\u529B\uFF0C\u78E8\u5408\u540E\u66F4\u7A33\u56FA`;
    } else {
      phaseScore = 82;
      phaseDesc = `\u4E09\u5206\u76F8\u4F4D\uFF08${z1} \u25B3 ${z2}\uFF09\uFF0C\u80FD\u91CF\u548C\u8C10\u6D41\u52A8\uFF0C\u8F7B\u677E\u6109\u5FEB`;
    }
  } else if (phaseDist === 4 || phaseDist === 8) {
    phaseScore = 82;
    phaseDesc = `\u4E09\u5206\u76F8\u4F4D\uFF08${z1} \u25B3 ${z2}\uFF09\uFF0C\u80FD\u91CF\u548C\u8C10\u6D41\u52A8\uFF0C\u8F7B\u677E\u6109\u5FEB`;
  } else if (phaseDist === 2 || phaseDist === 10) {
    phaseScore = 76;
    phaseDesc = `\u516D\u5206\u76F8\u4F4D\uFF08${z1} \u26B9 ${z2}\uFF09\uFF0C\u673A\u7F18\u5DE7\u5408\u591A\uFF0C\u5408\u4F5C\u987A\u5229`;
  } else {
    phaseScore = 68;
    phaseDesc = `\u7279\u6B8A\u76F8\u4F4D\uFF08\u89D2\u5EA6\u5DEE${phaseDist * 30}\xB0\uFF09\uFF0C\u6709\u72EC\u7279\u5438\u5F15\u529B`;
  }
  const elem1 = SIGN_ELEMENT[z1];
  const elem2 = SIGN_ELEMENT[z2];
  let elementBonus = 0;
  let elementDesc = "";
  if (elem1 === elem2) {
    elementBonus = 5;
    elementDesc = `\u540C\u5C5E${elem1}\u8C61\uFF0C\u4EF7\u503C\u89C2\u5E95\u5C42\u4E00\u81F4\uFF0C\u4F46\u53EF\u80FD\u7F3A\u4E4F\u65B0\u9C9C\u523A\u6FC0`;
  } else {
    const SHENG_MAP = { "\u706B": "\u571F", "\u571F": "\u91D1", "\u91D1": "\u6C34", "\u6C34": "\u6728", "\u6728": "\u706B" };
    if (SHENG_MAP[elem1] === elem2 || SHENG_MAP[elem2] === elem1) {
      elementBonus = 8;
      elementDesc = `${elem1}\u4E0E${elem2}\u76F8\u751F\uFF0C\u5929\u7136\u4E92\u8865\uFF0C\u4E92\u76F8\u6ECB\u517B`;
    } else {
      elementBonus = 3;
      elementDesc = `${elem1}\u4E0E${elem2}\u4E0D\u540C\u8C61\uFF0C\u5DEE\u5F02\u5E26\u6765\u6210\u957F\u7A7A\u95F4`;
    }
  }
  const mode1 = SIGN_MODE[z1];
  const mode2 = SIGN_MODE[z2];
  let modeBonus = 0;
  if (mode1 === mode2) modeBonus = 4;
  else modeBonus = 2;
  const ruler1 = SIGN_RULER[z1];
  const ruler2 = SIGN_RULER[z2];
  const rulerDesc = `${z1}\u5B88\u62A4\u661F${ruler1}\u9047\u4E0A${z2}\u5B88\u62A4\u661F${ruler2}`;
  const rawScore = Math.round(
    baseScore * 0.45 + phaseScore * 0.3 + (70 + elementBonus) * 0.15 + (70 + modeBonus) * 0.1
  );
  const score = Math.max(40, Math.min(99, rawScore));
  let summary;
  if (score >= 82) {
    summary = `${z1}\u4E0E${z2}\u7684\u914D\u7F6E\u582A\u79F0\u9EC4\u91D1\u914D\u5BF9\uFF0C\u661F\u661F\u90FD\u5728\u4E3A\u4F60\u4EEC\u8BA9\u8DEF\u3002`;
  } else if (score >= 70) {
    summary = `${z1}\uFF08\u4F60\uFF09\u9047\u4E0A${z2}\uFF08TA\uFF09\uFF0C\u661F\u5EA7\u80FD\u91CF\u5F62\u6210\u6709\u8DA3\u7684\u5316\u5B66\u53CD\u5E94\u3002`;
  } else if (score >= 58) {
    summary = `${z1}\u4E0E${z2}\u7684\u7EC4\u5408\u9700\u8981\u66F4\u591A\u7406\u89E3\uFF0C\u4F46\u5DEE\u5F02\u6B63\u662F\u5438\u5F15\u529B\u7684\u6765\u6E90\u3002`;
  } else {
    summary = `\u5BF9\u5BAB\u76F8\u9047\uFF0C\u5F3A\u70C8\u7684\u5BF9\u7ACB\u611F\u80CC\u540E\u662F\u7B49\u91CF\u7684\u5438\u5F15\u529B\u3002`;
  }
  const detail = [
    `\u3010\u592A\u9633\u661F\u5EA7\u3011`,
    `\u4F60\uFF1A${z1}\uFF08${p1.month}\u6708${p1.day}\u65E5\uFF09\u2014 ${elem1}\u8C61 \xB7 ${mode1} \xB7 \u5B88\u62A4\u661F${ruler1}`,
    `TA\uFF1A${z2}\uFF08${p2.month}\u6708${p2.day}\u65E5\uFF09\u2014 ${elem2}\u8C61 \xB7 ${mode2} \xB7 \u5B88\u62A4\u661F${ruler2}`,
    ``,
    `\u3010\u76F8\u4F4D\u5206\u6790\u3011`,
    phaseDesc,
    ``,
    `\u3010\u5143\u7D20\u4E92\u52A8\u3011`,
    elementDesc,
    ``,
    `\u3010\u5B88\u62A4\u661F\u4E92\u52A8\u3011`,
    rulerDesc,
    ``,
    isBestMatch ? `\u2728 ${z1}\u4E0E${z2}\u5728\u7ECF\u5178\u914D\u5BF9\u8868\u4E2D\u5C5E\u4E8E\u6700\u4F73\u7EC4\u5408\u4E4B\u4E00` : OPPOSITES[z1] === z2 ? `\u26A1 ${z1}\u4E0E${z2}\u4E92\u4E3A\u5BF9\u5BAB\uFF0C\u5438\u5F15\u529B\u4E0E\u6311\u6218\u5E76\u5B58` : `\u25C6 ${z1}\u4E0E${z2}\u6784\u6210\u72EC\u7279\u914D\u7F6E\uFF0C\u4E0D\u8D70\u5BFB\u5E38\u8DEF`,
    `
\u7EFC\u5408\u8BC4\u5206\uFF1A${score}/100 \u2014 ${score >= 80 ? "\u661F\u8FB0\u4E3A\u8BC1\uFF0C\u7F18\u5206\u6DF1\u539A" : score >= 65 ? "\u661F\u5149\u6307\u5F15\uFF0C\u503C\u5F97\u671F\u5F85" : "\u661F\u9014\u867D\u6709\u6311\u6218\uFF0C\u643A\u624B\u53EF\u8D8A"}`
  ].join("\n");
  return {
    score,
    title: "\u897F\u65B9\u661F\u5EA7",
    summary,
    detail
  };
}

// src/lib/algos/iching.ts
var HEXAGRAMS = {
  1: { name: "\u4E7E\u4E3A\u5929", symbol: "\u2630\u2630", nature: "\u521A\u5065", judgment: "\u5143\u4EA8\u5229\u8D1E", relationshipMeaning: "\u5929\u884C\u5065\uFF0C\u53CC\u65B9\u90FD\u6709\u5F3A\u70C8\u7684\u76EE\u6807\u611F\uFF0C\u4E92\u76F8\u6FC0\u52B1\u6210\u957F", category: "\u5927\u5409", scoreRange: [85, 96] },
  2: { name: "\u5764\u4E3A\u5730", symbol: "\u2637\u2637", nature: "\u67D4\u987A", judgment: "\u5143\u4EA8\uFF0C\u5229\u725D\u9A6C\u4E4B\u8D1E", relationshipMeaning: "\u5730\u52BF\u5764\uFF0C\u5305\u5BB9\u6ECB\u517B\uFF0C\u9002\u5408\u957F\u4E45\u7A33\u5B9A\u7684\u966A\u4F34\u5173\u7CFB", category: "\u5927\u5409", scoreRange: [82, 94] },
  3: { name: "\u6C34\u96F7\u5C6F", symbol: "\u2635\u2633", nature: "\u521D\u751F", judgment: "\u5143\u4EA8\u5229\u8D1E\uFF0C\u52FF\u7528\u6709\u6538\u5F80", relationshipMeaning: "\u5173\u7CFB\u840C\u82BD\u671F\uFF0C\u867D\u6709\u6311\u6218\u4F46\u6839\u57FA\u53EF\u7ACB\uFF0C\u9700\u8010\u5FC3\u57F9\u80B2", category: "\u4E2D", scoreRange: [58, 72] },
  4: { name: "\u5C71\u6C34\u8499", symbol: "\u2636\u2633", nature: "\u542F\u8499", judgment: "\u4EA8\u3002\u532A\u6211\u6C42\u7AE5\u8499\uFF0C\u7AE5\u8499\u6C42\u6211", relationshipMeaning: "\u5F7C\u6B64\u5728\u5B66\u4E60\u5982\u4F55\u53BB\u7231\uFF0C\u5766\u8BDA\u6C9F\u901A\u662F\u5173\u952E", category: "\u4E2D", scoreRange: [60, 74] },
  5: { name: "\u6C34\u5929\u9700", symbol: "\u2635\u2630", nature: "\u7B49\u5F85", judgment: "\u6709\u5B5A\uFF0C\u5149\u4EA8\u8D1E\u5409", relationshipMeaning: "\u7F18\u5206\u9700\u8981\u65F6\u95F4\u53D1\u9175\uFF0C\u6025\u4E0D\u5F97\uFF0C\u987A\u5176\u81EA\u7136\u6700\u597D", category: "\u5409", scoreRange: [70, 82] },
  6: { name: "\u5929\u6C34\u8BBC", symbol: "\u2630\u2635", nature: "\u4E89\u8FA9", judgment: "\u6709\u5B5A\u7A92\u60D5\uFF0C\u4E2D\u5409", relationshipMeaning: "\u53EF\u80FD\u6709\u8BEF\u89E3\u6216\u5206\u6B67\uFF0C\u4F46\u53EA\u8981\u5766\u8BDA\u76F8\u5F85\u7EC8\u80FD\u5316\u89E3", category: "\u5C0F\u51F6", scoreRange: [48, 62] },
  7: { name: "\u5730\u6C34\u5E08", symbol: "\u2637\u2635", nature: "\u7EDF\u9886", judgment: "\u8D1E\u4E08\u4EBA\u5409\u65E0\u548E", relationshipMeaning: "\u4E00\u65B9\u53EF\u80FD\u4E3B\u5BFC\u5173\u7CFB\u8282\u594F\uFF0C\u9700\u8981\u5E73\u8861\u6743\u529B\u52A8\u6001", category: "\u4E2D", scoreRange: [56, 70] },
  8: { name: "\u6C34\u5730\u6BD4", symbol: "\u2635\u2637", nature: "\u4EB2\u8F85", judgment: "\u5409\u3002\u539F\u7B6E\u5143\u6C38\u8D1E\u65E0\u548E", relationshipMeaning: "\u4EB2\u5BC6\u4E92\u52A9\u7684\u5173\u7CFB\uFF0C\u5F7C\u6B64\u652F\u6301\uFF0C\u5929\u7136\u4EB2\u8FD1", category: "\u5409", scoreRange: [76, 88] },
  9: { name: "\u98CE\u5929\u5C0F\u755C", symbol: "\u2634\u2630", nature: "\u84C4\u517B", judgment: "\u4EA8\u3002\u5BC6\u4E91\u4E0D\u96E8", relationshipMeaning: "\u611F\u60C5\u5728\u79EF\u7D2F\u4E2D\uFF0C\u5C1A\u672A\u5230\u7206\u53D1\u70B9\uFF0C\u7EC6\u6C34\u957F\u6D41", category: "\u4E2D", scoreRange: [62, 75] },
  10: { name: "\u5929\u6CFD\u5C65", symbol: "\u2630\u2631", nature: "\u8DF5\u884C", judgment: "\u5C65\u864E\u5C3E\uFF0C\u4E0D\u54A5\u4EBA\u4EA8", relationshipMeaning: "\u5C0F\u5FC3\u7FFC\u7FFC\u5730\u7ECF\u8425\u611F\u60C5\uFF0C\u8C28\u614E\u53CD\u800C\u5E26\u6765\u5B89\u7A33", category: "\u5409", scoreRange: [68, 80] },
  11: { name: "\u5730\u5929\u6CF0", symbol: "\u2637\u2630", nature: "\u901A\u6CF0", judgment: "\u5C0F\u5F80\u5927\u6765\u5409\u4EA8", relationshipMeaning: "\u9634\u9633\u4EA4\u611F\uFF0C\u5929\u5730\u76F8\u901A\uFF0C\u6B64\u4E43\u4E0A\u7B49\u59FB\u7F18\u4E4B\u8C61", category: "\u5927\u5409", scoreRange: [88, 97] },
  12: { name: "\u5929\u5730\u5426", symbol: "\u2630\u2637", nature: "\u95ED\u585E", judgment: "\u5426\u4E4B\u532A\u4EBA\uFF0C\u4E0D\u5229\u541B\u5B50\u8D1E", relationshipMeaning: "\u6682\u65F6\u6709\u9694\u9602\uFF0C\u4F46\u4E0D\u4EE3\u8868\u7EC8\u7ED3\uFF0C\u9700\u8981\u4E3B\u52A8\u6253\u7834\u50F5\u5C40", category: "\u5C0F\u51F6", scoreRange: [45, 58] },
  13: { name: "\u5929\u706B\u540C\u4EBA", symbol: "\u2630\u2632", nature: "\u805A\u5408", judgment: "\u540C\u4EBA\u4E8E\u91CE\u4EA8", relationshipMeaning: "\u5FD7\u540C\u9053\u5408\uFF0C\u4EF7\u503C\u89C2\u4E00\u81F4\uFF0C\u5BB9\u6613\u5EFA\u7ACB\u6DF1\u5C42\u8FDE\u63A5", category: "\u5409", scoreRange: [78, 90] },
  14: { name: "\u706B\u5929\u5927\u6709", symbol: "\u2632\u2630", nature: "\u4E30\u76DB", judgment: "\u5143\u4EA8", relationshipMeaning: "\u5982\u65E5\u4E2D\u5929\u7684\u5173\u7CFB\uFF0C\u5145\u6EE1\u6D3B\u529B\u4E0E\u5E0C\u671B", category: "\u5927\u5409", scoreRange: [84, 95] },
  15: { name: "\u5730\u5C71\u8C26", symbol: "\u2637\u2636", nature: "\u8C26\u900A", judgment: "\u4EA8\u541B\u5B50\u6709\u7EC8", relationshipMeaning: "\u5F7C\u6B64\u8C26\u8BA9\u5305\u5BB9\uFF0C\u5173\u7CFB\u957F\u4E45\u7A33\u5B9A", category: "\u5409", scoreRange: [77, 89] },
  16: { name: "\u96F7\u5730\u8C6B", symbol: "\u2633\u2637", nature: "\u5B89\u4E50", judgment: "\u5229\u5EFA\u4FAF\u884C\u5E08", relationshipMeaning: "\u76F8\u5904\u6109\u5FEB\u8F7B\u677E\uFF0C\u4F46\u9700\u8B66\u60D5\u8FC7\u4E8E\u5B89\u9038\u5BFC\u81F4\u505C\u6EDE", category: "\u5409", scoreRange: [73, 85] },
  17: { name: "\u6CFD\u96F7\u968F", symbol: "\u2631\u2633", nature: "\u8FFD\u968F", judgment: "\u5143\u4EA8\u5229\u8D1E\u65E0\u548E", relationshipMeaning: "\u81EA\u7136\u968F\u987A\u7684\u5173\u7CFB\uFF0C\u4E0D\u52C9\u5F3A\uFF0C\u4E00\u5207\u6070\u5230\u597D\u5904", category: "\u5927\u5409", scoreRange: [83, 94] },
  18: { name: "\u5C71\u98CE\u86CA", symbol: "\u2636\u2634", nature: "\u8D25\u574F", judgment: "\u5143\u4EA8\uFF0C\u5229\u6D89\u5927\u5DDD", relationshipMeaning: "\u9700\u8981\u4FEE\u590D\u6216\u91CD\u5EFA\u67D0\u4E9B\u4E1C\u897F\uFF0C\u4F46\u4FEE\u590D\u540E\u66F4\u575A\u56FA", category: "\u4E2D", scoreRange: [54, 68] },
  19: { name: "\u5730\u6CFD\u4E34", symbol: "\u2637\u2631", nature: "\u4E34\u4E0B", judgment: "\u5143\u4EA8\u5229\u8D1E", relationshipMeaning: "\u5173\u7CFB\u6B63\u5728\u6210\u957F\u671F\uFF0C\u524D\u666F\u5149\u660E\uFF0C\u5B9C\u79EF\u6781\u6295\u5165", category: "\u5409", scoreRange: [74, 86] },
  20: { name: "\u98CE\u5730\u89C2", symbol: "\u2634\u2637", nature: "\u89C2\u5BDF", judgment: "\u76E5\u800C\u4E0D\u8350\u6709\u5B5A\u9852\u82E5", relationshipMeaning: "\u4EE5\u65C1\u89C2\u8005\u6E05\u7684\u89C6\u89D2\u5BA1\u89C6\u5173\u7CFB\uFF0C\u4F1A\u6709\u65B0\u7684\u9886\u609F", category: "\u4E2D", scoreRange: [61, 75] },
  21: { name: "\u706B\u96F7\u566C\u55D1", symbol: "\u2632\u2633", nature: "\u54AC\u5408", judgment: "\u4EA8\u5229\u7528\u72F1", relationshipMeaning: "\u9700\u8981\u89E3\u51B3\u4E00\u4E9B\u969C\u788D\u624D\u80FD\u524D\u8FDB\uFF0C\u4F46\u969C\u788D\u4E5F\u662F\u5951\u673A", category: "\u4E2D", scoreRange: [59, 73] },
  22: { name: "\u5C71\u706B\u8D32", symbol: "\u2636\u2632", nature: "\u6587\u9970", judgment: "\u4EA8\u3002\u5C0F\u5229\u6709\u6538\u5F80", relationshipMeaning: "\u8868\u9762\u548C\u8C10\u7F8E\u597D\uFF0C\u9700\u8981\u5173\u6CE8\u5185\u5728\u5B9E\u8D28", category: "\u4E2D", scoreRange: [64, 78] },
  23: { name: "\u5C71\u5730\u5265", symbol: "\u2636\u2637", nature: "\u5265\u843D", judgment: "\u4E0D\u5229\u6709\u6538\u5F80", relationshipMeaning: "\u6709\u4E9B\u4E1C\u897F\u6B63\u5728\u6D88\u901D\uFF0C\u53EF\u80FD\u662F\u65E7\u6A21\u5F0F\uFF0C\u4E3A\u65B0\u751F\u817E\u51FA\u7A7A\u95F4", category: "\u5F85\u53D8", scoreRange: [42, 56] },
  24: { name: "\u5730\u96F7\u590D", symbol: "\u2637\u2633", nature: "\u590D\u5F52", judgment: "\u4EA8\u3002\u51FA\u5165\u65E0\u75BE", relationshipMeaning: "\u8F6C\u673A\u5DF2\u73B0\uFF0C\u5173\u7CFB\u6709\u671B\u91CD\u65B0\u5F00\u59CB\u6216\u8FDB\u5165\u65B0\u9636\u6BB5", category: "\u5409", scoreRange: [72, 84] },
  25: { name: "\u5929\u96F7\u65E0\u5984", symbol: "\u2630\u2633", nature: "\u65E0\u5984", judgment: "\u5143\u4EA8\u5229\u8D1E", relationshipMeaning: "\u771F\u8BDA\u76F8\u5F85\u662F\u6700\u597D\u7684\u7B56\u7565\uFF0C\u4E0D\u73A9\u5FC3\u673A\u81EA\u7136\u987A\u7545", category: "\u5409", scoreRange: [75, 87] },
  26: { name: "\u5C71\u5929\u5927\u755C", symbol: "\u2636\u2630", nature: "\u79EF\u84C4", judgment: "\u5229\u8D1E\u3002\u4E0D\u5BB6\u98DF\u5409", relationshipMeaning: "\u5173\u7CFB\u5728\u79EF\u7D2F\u6DF1\u539A\u7684\u80FD\u91CF\uFF0C\u672A\u6765\u53EF\u671F", category: "\u5409", scoreRange: [76, 88] },
  27: { name: "\u5C71\u96F7\u9890", symbol: "\u2636\u2633", nature: "\u9890\u517B", judgment: "\u8D1E\u5409\u3002\u89C2\u9890\u81EA\u6C42\u53E3\u5B9E", relationshipMeaning: "\u5F7C\u6B64\u6ECB\u517B\uFF0C\u5173\u6CE8\u53CC\u65B9\u7684\u5185\u5728\u9700\u6C42\u548C\u6210\u957F", category: "\u4E2D", scoreRange: [63, 77] },
  28: { name: "\u6CFD\u98CE\u5927\u8FC7", symbol: "\u2631\u2634", nature: "\u8FC7\u751A", judgment: "\u680B\u6861\u5229\u6709\u6538\u5F80\u4EA8", relationshipMeaning: "\u611F\u60C5\u5F3A\u70C8\u4F46\u9700\u5E73\u8861\uFF0C\u8FC7\u72B9\u4E0D\u53CA", category: "\u5F85\u53D8", scoreRange: [50, 66] },
  29: { name: "\u574E\u4E3A\u6C34", symbol: "\u2635\u2635", nature: "\u9677\u9669", judgment: "\u4E60\u574E\u6709\u5B5A\u7EF4\u5FC3\u4EA8", relationshipMeaning: "\u7ECF\u5386\u8003\u9A8C\u7684\u5173\u7CFB\uFF0C\u4F46\u5171\u540C\u9762\u5BF9\u56F0\u96BE\u4F1A\u8BA9\u7EBD\u5E26\u66F4\u5F3A", category: "\u4E2D", scoreRange: [55, 69] },
  30: { name: "\u79BB\u4E3A\u706B", symbol: "\u2632\u2632", nature: "\u9644\u4E3D", judgment: "\u5229\u8D1E\u4EA8", relationshipMeaning: "\u660E\u4EAE\u6E29\u6696\u7684\u5173\u7CFB\uFF0C\u5F7C\u6B64\u7167\u4EAE\uFF0C\u6FC0\u60C5\u4E0E\u7406\u89E3\u5E76\u5B58", category: "\u5409", scoreRange: [77, 89] },
  31: { name: "\u6CFD\u5C71\u54B8", symbol: "\u2631\u2636", nature: "\u611F\u5E94", judgment: "\u4EA8\u5229\u8D1E\u53D6\u5973\u5409", relationshipMeaning: "\u5FC3\u7075\u611F\u5E94\u822C\u7684\u5FC3\u52A8\uFF0C\u4E24\u60C5\u76F8\u60A6\u7684\u81EA\u7136\u5438\u5F15", category: "\u5927\u5409", scoreRange: [86, 97] },
  32: { name: "\u96F7\u98CE\u6052", symbol: "\u2633\u2634", nature: "\u6052\u4E45", judgment: "\u4EA8\u65E0\u548E\u5229\u8D1E", relationshipMeaning: "\u6301\u4E45\u7A33\u5B9A\u7684\u5173\u7CFB\uFF0C\u7ECF\u5F97\u8D77\u65F6\u95F4\u8003\u9A8C", category: "\u5927\u5409", scoreRange: [84, 95] },
  33: { name: "\u5929\u5C71\u9041", symbol: "\u2630\u2636", nature: "\u9000\u907F", judgment: "\u4EA8\u5C0F\u5229\u8D1E", relationshipMeaning: "\u6709\u65F6\u9700\u8981\u7ED9\u5F7C\u6B64\u7A7A\u95F4\uFF0C\u8DDD\u79BB\u4EA7\u751F\u7F8E", category: "\u4E2D", scoreRange: [58, 72] },
  34: { name: "\u96F7\u5929\u5927\u58EE", symbol: "\u2633\u2630", nature: "\u58EE\u76DB", judgment: "\u5229\u8D1E", relationshipMeaning: "\u5173\u7CFB\u80FD\u91CF\u5145\u6C9B\uFF0C\u884C\u52A8\u529B\u5F3A\uFF0C\u9002\u5408\u4E00\u8D77\u505A\u5927\u4E8B", category: "\u5409", scoreRange: [74, 86] },
  35: { name: "\u706B\u5730\u664B", symbol: "\u2632\u2637", nature: "\u664B\u5347", judgment: "\u5EB7\u4FAF\u7528\u9521\u9A6C\u8543\u5EB6", relationshipMeaning: "\u5173\u7CFB\u5728\u5411\u4E0A\u53D1\u5C55\uFF0C\u8D8A\u6765\u8D8A\u597D", category: "\u5409", scoreRange: [73, 85] },
  36: { name: "\u5730\u706B\u660E\u5937", symbol: "\u2637\u2632", nature: "\u635F\u4F24", judgment: "\u5229\u8270\u8D1E", relationshipMeaning: "\u6682\u65F6\u4F4E\u6F6E\u671F\uFF0C\u9700\u8981\u8010\u5FC3\u7B49\u5F85\u5149\u660E\u91CD\u73B0", category: "\u5C0F\u51F6", scoreRange: [47, 61] },
  37: { name: "\u706B\u98CE\u9F0E", symbol: "\u2632\u2634", nature: "\u9F0E\u65B0", judgment: "\u5143\u5409\u4EA8", relationshipMeaning: "\u5173\u7CFB\u6B63\u5728\u8715\u53D8\u5347\u7EA7\uFF0C\u65B0\u65E7\u4EA4\u66FF\u4E2D\u5B55\u80B2\u66F4\u597D", category: "\u5409", scoreRange: [75, 87] },
  38: { name: "\u706B\u6CFD\u777D", symbol: "\u2632\u2631", nature: "\u80CC\u79BB", judgment: "\u5C0F\u4E8B\u5409", relationshipMeaning: "\u8868\u9762\u6709\u5206\u6B67\uFF0C\u4F46\u5C0F\u4E8B\u80FD\u8FBE\u6210\u5171\u8BC6\uFF0C\u6C42\u540C\u5B58\u5F02", category: "\u4E2D", scoreRange: [56, 70] },
  39: { name: "\u6C34\u5C71\u8E47", symbol: "\u2635\u2636", nature: "\u8DDB\u96BE", judgment: "\u5229\u897F\u5357\u4E0D\u5229\u4E1C\u5317", relationshipMeaning: "\u9047\u5230\u963B\u788D\u65F6\u5B9C\u9000\u4E0D\u5B9C\u8FDB\uFF0C\u4EE5\u67D4\u514B\u521A", category: "\u5C0F\u51F6", scoreRange: [49, 63] },
  40: { name: "\u96F7\u6C34\u89E3", symbol: "\u2633\u2635", nature: "\u5316\u89E3", judgment: "\u5229\u897F\u5357", relationshipMeaning: "\u56F0\u96BE\u6B63\u5728\u5316\u89E3\uFF0C\u6625\u5929\u5373\u5C06\u5230\u6765", category: "\u5409", scoreRange: [71, 83] },
  41: { name: "\u5C71\u6CFD\u635F", symbol: "\u2636\u2631", nature: "\u51CF\u635F", judgment: "\u6709\u5B5A\u5143\u5409\u65E0\u548E", relationshipMeaning: "\u9002\u5F53\u7684\u4ED8\u51FA\u548C\u727A\u7272\u4F1A\u8BA9\u5173\u7CFB\u66F4\u7262\u56FA", category: "\u4E2D", scoreRange: [62, 76] },
  42: { name: "\u98CE\u96F7\u76CA", symbol: "\u2634\u2633", nature: "\u589E\u76CA", judgment: "\u5229\u6709\u6538\u5F80\u5229\u6D89\u5927\u5DDD", relationshipMeaning: "\u5F7C\u6B64\u6210\u5C31\uFF0C1+1>2\u7684\u5173\u7CFB", category: "\u5409", scoreRange: [79, 91] },
  43: { name: "\u6CFD\u5929\u592C", symbol: "\u2631\u2630", nature: "\u51B3\u65AD", judgment: "\u626C\u4E8E\u738B\u5EAD\u53F7\u5389", relationshipMeaning: "\u9700\u8981\u505A\u51FA\u51B3\u5B9A\u6216\u76F4\u9762\u95EE\u9898\uFF0C\u62D6\u5EF6\u65E0\u76CA", category: "\u5F85\u53D8", scoreRange: [51, 65] },
  44: { name: "\u5929\u98CE\u59E4", symbol: "\u2630\u2634", nature: "\u9082\u9005", judgment: "\u5973\u58EE\u52FF\u7528\u53D6\u5973", relationshipMeaning: "\u610F\u5916\u7684\u76F8\u9047\u6216\u8F6C\u673A\uFF0C\u7F18\u5206\u6765\u5F97\u7A81\u7136", category: "\u4E2D", scoreRange: [65, 79] },
  45: { name: "\u6CFD\u5730\u8403", symbol: "\u2631\u2637", nature: "\u805A\u96C6", judgment: "\u738B\u5047\u6709\u5E99\u4EA8", relationshipMeaning: "\u56E0\u7F18\u805A\u5408\uFF0C\u5F7C\u6B64\u73CD\u60DC\u76F8\u805A\u7684\u65F6\u5149", category: "\u5409", scoreRange: [74, 86] },
  46: { name: "\u5730\u98CE\u5347", symbol: "\u2637\u2634", nature: "\u4E0A\u5347", judgment: "\u5143\u4EA8\u7528\u89C1\u5927\u4EBA", relationshipMeaning: "\u5173\u7CFB\u7A33\u6B65\u4E0A\u5347\uFF0C\u76F8\u4E92\u4FC3\u8FDB\u6210\u957F", category: "\u5409", scoreRange: [76, 88] },
  47: { name: "\u6CFD\u6C34\u56F0", symbol: "\u2631\u2635", nature: "\u56F0\u987F", judgment: "\u4EA8\u8D1E\u5927\u4EBA\u5409\u65E0\u548E", relationshipMeaning: "\u6682\u65F6\u56F0\u987F\u4E0D\u4EE3\u8868\u5931\u8D25\uFF0C\u575A\u6301\u5C31\u80FD\u7A81\u7834", category: "\u5C0F\u51F6", scoreRange: [46, 60] },
  48: { name: "\u6C34\u98CE\u4E95", symbol: "\u2635\u2634", nature: "\u4E95\u517B", judgment: "\u6539\u9091\u4E0D\u6539\u4E95", relationshipMeaning: "\u5982\u4E95\u6C34\u822C\u6E90\u6E90\u4E0D\u65AD\u7684\u5173\u7CFB\uFF0C\u7A33\u5B9A\u53EF\u9760", category: "\u5409", scoreRange: [73, 85] },
  49: { name: "\u6CFD\u706B\u9769", symbol: "\u2631\u2632", nature: "\u53D8\u9769", judgment: "\u5DF3\u65E5\u4E43\u5B5A\u5143\u4EA8\u5229\u8D1E", relationshipMeaning: "\u5173\u7CFB\u9700\u8981\u53D8\u9769\u66F4\u65B0\uFF0C\u6539\u53D8\u540E\u66F4\u597D", category: "\u4E2D", scoreRange: [61, 75] },
  50: { name: "\u706B\u98CE\u9F0E", symbol: "\u2632\u2634", nature: "\u9F0E\u65B0", judgment: "\u5143\u5409\u4EA8", relationshipMeaning: "\u5173\u7CFB\u6B63\u5728\u8715\u53D8\u5347\u7EA7\uFF0C\u65B0\u65E7\u4EA4\u66FF\u4E2D\u5B55\u80B2\u66F4\u597D", category: "\u5409", scoreRange: [75, 87] },
  51: { name: "\u9707\u4E3A\u96F7", symbol: "\u2633\u2633", nature: "\u9707\u52A8", judgment: "\u4EA8\u6050\u81F4\u798F", relationshipMeaning: "\u9707\u52A8\u5E26\u6765\u89C9\u9192\uFF0C\u6709\u65F6\u5C0F\u7684\u51B2\u7A81\u53CD\u800C\u662F\u597D\u4E8B", category: "\u4E2D", scoreRange: [60, 74] },
  52: { name: "\u826E\u4E3A\u5C71", symbol: "\u2636\u2636", nature: "\u505C\u6B62", judgment: "\u826E\u5176\u80CC\u4E0D\u83B7\u5176\u8EAB", relationshipMeaning: "\u9002\u65F6\u7684\u505C\u987F\u548C\u53CD\u601D\u5BF9\u5173\u7CFB\u6709\u76CA", category: "\u4E2D", scoreRange: [63, 77] },
  53: { name: "\u98CE\u5C71\u6E10", symbol: "\u2634\u2636", nature: "\u6E10\u8FDB", judgment: "\u5973\u5F52\u5409\u5229\u8D1E", relationshipMeaning: "\u5FAA\u5E8F\u6E10\u8FDB\u7684\u611F\u60C5\u6700\u7A33\u56FA\uFF0C\u4E0D\u6025\u4E8E\u6C42\u6210", category: "\u5409", scoreRange: [72, 84] },
  54: { name: "\u96F7\u6CFD\u5F52\u59B9", symbol: "\u2633\u2631", nature: "\u5F52\u968F", judgment: "\u5F81\u51F6\u65E0\u6538\u5229", relationshipMeaning: "\u9700\u8981\u5BA1\u89C6\u5173\u7CFB\u7684\u6839\u57FA\u662F\u5426\u7262\u56FA\uFF0C\u4E0D\u5B9C\u5192\u8FDB", category: "\u5F85\u53D8", scoreRange: [52, 66] },
  55: { name: "\u96F7\u4E30", symbol: "\u2633\u2632", nature: "\u4E30\u76DB", judgment: "\u4EA8\u738B\u52FF\u5FE7\u5B9C\u65E5\u4E2D", relationshipMeaning: "\u5173\u7CFB\u5982\u65E5\u4E2D\u5929\uFF0C\u4F46\u8981\u4FDD\u6301\u6E05\u9192\u4E0D\u8981\u5F97\u610F\u5FD8\u5F62", category: "\u5409", scoreRange: [78, 90] },
  56: { name: "\u706B\u5C71\u65C5", symbol: "\u2636\u2632", nature: "\u65C5\u884C", judgment: "\u5C0F\u4EA8\u65C5\u8D1E\u5409", relationshipMeaning: "\u50CF\u4E00\u6BB5\u5171\u540C\u7684\u65C5\u7A0B\uFF0C\u4F53\u9A8C\u4E30\u5BCC\u4F46\u9700\u8981\u65B9\u5411\u611F", category: "\u4E2D", scoreRange: [64, 78] },
  57: { name: "\u5DFD\u4E3A\u98CE", symbol: "\u2634\u2634", nature: "\u987A\u5165", judgment: "\u5C0F\u4EA8\u5229\u6709\u6538\u5F80", relationshipMeaning: "\u7075\u6D3B\u9002\u5E94\u7684\u5173\u7CFB\uFF0C\u968F\u98CE\u800C\u52A8\u987A\u52BF\u800C\u4E3A", category: "\u4E2D", scoreRange: [66, 80] },
  58: { name: "\u5151\u4E3A\u6CFD", symbol: "\u2631\u2631", nature: "\u559C\u60A6", judgment: "\u4EA8\u5229\u8D1E", relationshipMeaning: "\u6109\u60A6\u5FEB\u4E50\u7684\u5173\u7CFB\uFF0C\u6C9F\u901A\u987A\u7545\u7B11\u58F0\u591A", category: "\u5409", scoreRange: [80, 92] },
  59: { name: "\u98CE\u6C34\u6DA3", symbol: "\u2634\u2635", nature: "\u6DA3\u6563", judgment: "\u738B\u5047\u6709\u5E99\u5229\u6D89\u5927\u5DDD", relationshipMeaning: "\u6709\u4E9B\u758F\u79BB\u611F\uFF0C\u9700\u8981\u91CD\u65B0\u51DD\u805A\u60C5\u611F", category: "\u4E2D", scoreRange: [57, 71] },
  60: { name: "\u6C34\u6CFD\u8282", symbol: "\u2635\u2631", nature: "\u8282\u5236", judgment: "\u4EA8\u82E6\u8282\u4E0D\u53EF\u8D1E", relationshipMeaning: "\u9002\u5EA6\u7684\u514B\u5236\u548C\u8FB9\u754C\u611F\u5BF9\u5173\u7CFB\u6709\u76CA", category: "\u4E2D", scoreRange: [65, 79] },
  61: { name: "\u98CE\u6CFD\u4E2D\u5B5A", symbol: "\u2634\u2631", nature: "\u8BDA\u4FE1", judgment: "\u8C5A\u9C7C\u5409\u5229\u6D89\u5927\u5DDD", relationshipMeaning: "\u4FE1\u4EFB\u662F\u8FD9\u6BB5\u5173\u7CFB\u7684\u57FA\u77F3\uFF0C\u771F\u8BDA\u76F8\u5F85\u65E0\u5F80\u4E0D\u5229", category: "\u5409", scoreRange: [81, 93] },
  62: { name: "\u96F7\u5C71\u5C0F\u8FC7", symbol: "\u2633\u2636", nature: "\u5C0F\u8FC7", judgment: "\u4EA8\u5229\u8D1E\u53EF\u5C0F\u4E8B\u4E0D\u53EF\u5927\u4E8B", relationshipMeaning: "\u5C0F\u4E8B\u4E0A\u9ED8\u5951\u5341\u8DB3\uFF0C\u5927\u4E8B\u4E0A\u8FD8\u9700\u66F4\u591A\u78E8\u5408", category: "\u4E2D", scoreRange: [62, 76] },
  63: { name: "\u6C34\u706B\u65E2\u6D4E", symbol: "\u2635\u2632", nature: "\u65E2\u6D4E", judgment: "\u4EA8\u5C0F\u5229\u8D1E", relationshipMeaning: "\u6C34\u706B\u65E2\u6D4E\uFF0C\u9634\u9633\u8C03\u548C\uFF0C\u4E07\u4E8B\u4FF1\u5907\u7684\u5706\u6EE1\u72B6\u6001", category: "\u5927\u5409", scoreRange: [87, 98] },
  64: { name: "\u706B\u6C34\u672A\u6D4E", symbol: "\u2632\u2635", nature: "\u672A\u6D4E", judgment: "\u4EA8\u5C0F\u72D0\u6C54\u6D4E\u6FE1\u5176\u5C3E", relationshipMeaning: "\u65C5\u7A0B\u5C1A\u672A\u7ED3\u675F\uFF0C\u672A\u5B8C\u6210\u610F\u5473\u7740\u8FD8\u6709\u65E0\u9650\u53EF\u80FD", category: "\u4E2D", scoreRange: [67, 81] }
};
function deriveHexagram(p1, p2) {
  const sumYear = p1.year + p2.year;
  const sumMonth = p1.month + p2.month;
  const sumDay = p1.day + p2.day;
  const upperGuaNum = ((sumYear + sumMonth - 2) % 8 + 8) % 8;
  const lowerGuaNum = ((sumDay - 1) % 8 + 8) % 8;
  const hexIndex = (upperGuaNum * 8 + lowerGuaNum) % 64 + 1;
  const totalSum = sumYear + sumMonth + sumDay;
  const changingLine = totalSum % 6 + 1;
  const hex = HEXAGRAMS[hexIndex] || HEXAGRAMS[23];
  let transformedHex = null;
  if (changingLine !== null) {
    const transformedIdx = (hexIndex + changingLine) % 64 + 1;
    if (transformedIdx !== hexIndex) {
      transformedHex = HEXAGRAMS[transformedIdx];
    }
  }
  return { hexNum: hexIndex, hex, changingLine, transformedHex };
}
function calcIChing(p1, p2) {
  const { hexNum, hex, changingLine, transformedHex } = deriveHexagram(p1, p2);
  const [minScore, maxScore] = hex.scoreRange;
  const seed = p1.year * 1e4 + p1.month * 100 + p1.day + (p2.year * 1e4 + p2.month * 100 + p2.day);
  const fineTune = seed % (maxScore - minScore + 1);
  let score = minScore + fineTune;
  let transformDesc = "";
  if (transformedHex && transformedHex !== hex) {
    const tCategory = transformedHex.category;
    if (tCategory === "\u5927\u5409" || tCategory === "\u5409") {
      score += 3;
      transformDesc = `
\u3010\u53D8\u5366\u3011\u7B2C${changingLine}\u723B\u52A8 \u2192 ${transformedHex.name}\uFF08${transformedHex.symbol}\uFF09
${transformedHex.relationshipMeaning}
\u53D8\u5366\u8D8B\u52BF\u5411\u597D\uFF0C\u672A\u6765\u53D1\u5C55\u6709\u8F6C\u673A\u3002`;
    } else if (tCategory === "\u5C0F\u51F6" || tCategory === "\u5F85\u53D8") {
      score -= 2;
      transformDesc = `
\u3010\u53D8\u5366\u3011\u7B2C${changingLine}\u723B\u52A8 \u2192 ${transformedHex.name}\uFF08${transformedHex.symbol}\uFF09
${transformedHex.relationshipMeaning}
\u9700\u6CE8\u610F\u53D8\u5316\u8D8B\u52BF\uFF0C\u63D0\u524D\u51C6\u5907\u3002`;
    } else {
      transformDesc = `
\u3010\u53D8\u5366\u3011\u7B2C${changingLine}\u723B\u52A8 \u2192 ${transformedHex.name}\uFF08${transformedHex.symbol}\uFF09
${transformedHex.relationshipMeaning}`;
    }
  }
  score = Math.max(35, Math.min(99, score));
  const categoryEmoji = {
    "\u5927\u5409": "\u2726",
    "\u5409": "\u25C6",
    "\u4E2D": "\u25C7",
    "\u5C0F\u51F6": "\u25D7",
    "\u5F85\u53D8": "\u25C8"
  };
  let summary;
  if (score >= 82) {
    summary = `\u5360\u5F97\u300C${hex.name}\u300D\uFF0C${categoryEmoji[hex.category]}${hex.judgment}\uFF0C\u6B64\u4E43\u4E0A\u4E0A\u4E4B\u5366\u3002`;
  } else if (score >= 68) {
    summary = `\u5360\u5F97\u300C${hex.name}\u300D\uFF0C${hex.nature}\u4E4B\u5366\uFF0C\u7F18\u5206\u7A33\u4E2D\u6709\u5347\u3002`;
  } else if (score >= 55) {
    summary = `\u5360\u5F97\u300C${hex.name}\u300D\uFF0C\u5366\u8C61\u663E\u793A\u9700\u7528\u5FC3\u7ECF\u8425\uFF0C\u65B9\u80FD\u957F\u4E45\u3002`;
  } else {
    summary = `\u5360\u5F97\u300C${hex.name}\u300D\uFF0C\u867D\u9047\u6311\u6218\uFF0C\u4F46\u5426\u6781\u6CF0\u6765\uFF0C\u8F6C\u673A\u5728\u540E\u3002`;
  }
  const detail = [
    `\u3010\u672C\u5366\u3011\u7B2C${hexNum}\u5366 \u2014 ${hex.name} ${hex.symbol}`,
    `\u5366\u5FB7\uFF1A${hex.nature} | \u5366\u8F9E\uFF1A${hex.judgment}`,
    `\u7B49\u7EA7\uFF1A${categoryEmoji[hex.category] || ""}${hex.category}`,
    ``,
    `\u3010\u59FB\u7F18\u89E3\u8BFB\u3011`,
    hex.relationshipMeaning,
    ``,
    `\u3010\u723B\u4F4D\u5206\u6790\u3011`,
    changingLine ? `\u7B2C${changingLine}\u723B\u4E3A\u52A8\u723B\uFF0C\u663E\u793A\u5173\u7CFB\u4E2D\u5B58\u5728\u53D8\u5316\u7684\u5951\u673A` : "\u516D\u723B\u5B89\u9759\uFF0C\u5173\u7CFB\u5F53\u524D\u5904\u4E8E\u7A33\u5B9A\u72B6\u6001",
    transformDesc,
    `
\u6613\u7ECF\u8BC4\u5206\uFF1A${score}/100 \u2014 ${score >= 80 ? "\u5366\u8C61\u5927\u5409\uFF0C\u987A\u5E94\u5929\u9053" : score >= 65 ? "\u4E2D\u4E0A\u4E4B\u5366\uFF0C\u4E8B\u5728\u4EBA\u4E3A" : "\u5366\u8C61\u5F85\u53D8\uFF0C\u4FEE\u5FC3\u5373\u6539\u547D"}`
  ].join("\n");
  return {
    score,
    title: "\u6613\u7ECF\u667A\u6167",
    summary,
    detail
  };
}

// src/lib/algos/index.ts
function parseBirthday(input) {
  let m = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };
  m = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return { year: +m[3], month: +m[2], day: +m[1] };
  m = input.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };
  return null;
}
function deriveDimensions(bazi, zodiac, iching) {
  const base = (bazi.score + zodiac.score + iching.score) / 3;
  const love = Math.round(zodiac.score * 0.4 + bazi.score * 0.25 + iching.score * 0.15 + base * 0.2);
  const communication = Math.round(bazi.score * 0.45 + zodiac.score * 0.3 + iching.score * 0.1 + base * 0.15);
  const chemistry = Math.round(zodiac.score * 0.45 + bazi.score * 0.3 + iching.score * 0.1 + base * 0.15);
  const stability = Math.round(bazi.score * 0.5 + iching.score * 0.3 + zodiac.score * 0.15 + base * 0.05);
  return {
    love: Math.max(30, Math.min(99, love)),
    communication: Math.max(30, Math.min(99, communication)),
    chemistry: Math.max(30, Math.min(99, chemistry)),
    stability: Math.max(30, Math.min(99, stability))
  };
}
function generateAIInsight(overall, dims, bazi, zodiac, iching) {
  const parts = [];
  if (overall >= 82) {
    parts.push("\u4ECE\u547D\u7406\u5B66\u7684\u89D2\u5EA6\u770B\uFF0C\u4F60\u4EEC\u4E4B\u95F4\u7684\u80FD\u91CF\u8FDE\u63A5\u975E\u5E38\u5F3A\u3002\u8FD9\u4E0D\u662F\u5076\u7136\u7684\u76F8\u9047\uFF0C\u800C\u662F\u67D0\u79CD\u66F4\u6DF1\u5C42\u7684\u5F15\u529B\u5C06\u4F60\u4EEC\u5E26\u5230\u4E86\u4E00\u8D77\u3002");
  } else if (overall >= 70) {
    parts.push("\u4F60\u4EEC\u7684\u547D\u76D8\u7EC4\u5408\u663E\u793A\u51FA\u826F\u597D\u7684\u5951\u5408\u5EA6\u3002\u6BCF\u6BB5\u5173\u7CFB\u90FD\u662F\u72EC\u4E00\u65E0\u4E8C\u7684\uFF0C\u800C\u4F60\u4EEC\u7684\u914D\u7F6E\u6709\u7740\u72EC\u7279\u7684\u4F18\u52BF\u3002");
  } else if (overall >= 58) {
    parts.push("\u6BCF\u4E00\u6BB5\u503C\u5F97\u7684\u5173\u7CFB\u90FD\u9700\u8981\u7ECF\u8425\uFF0C\u800C\u4F60\u4EEC\u7684\u914D\u7F6E\u4E2D\u85CF\u7740\u4E0D\u5C11\u5F85\u53D1\u6398\u7684\u5B9D\u85CF\u3002\u5DEE\u5F02\u4E0D\u662F\u969C\u788D\uFF0C\u662F\u6210\u957F\u7684\u571F\u58E4\u3002");
  } else {
    parts.push("\u7F18\u5206\u6709\u65F6\u4EE5\u6311\u6218\u7684\u5F62\u5F0F\u51FA\u73B0\u3002\u4F60\u4EEC\u7684\u914D\u7F6E\u663E\u793A\u8FD9\u662F\u4E00\u6BB5\u80FD\u5E26\u6765\u91CD\u8981\u4EBA\u751F\u8BFE\u9898\u7684\u5173\u7CFB\u3002");
  }
  const dimEntries = Object.entries(dims);
  dimEntries.sort((a, b) => b[1] - a[1]);
  const [strongest] = dimEntries;
  const [weakest] = dimEntries.slice(-1);
  const dimNames = {
    love: "\u60C5\u611F\u5438\u5F15\u529B",
    communication: "\u6C9F\u901A\u7406\u89E3",
    chemistry: "\u8EAB\u5FC3\u9ED8\u5951",
    stability: "\u957F\u671F\u7A33\u5B9A"
  };
  if (strongest[1] >= 78) {
    parts.push(`\u4F60\u4EEC\u5728\u3010${dimNames[strongest[0]]}\u3011\u65B9\u9762\u5929\u7136\u6709\u4F18\u52BF\u2014\u2014\u8FD9\u662F\u4F60\u4EEC\u5173\u7CFB\u7684\u4EAE\u70B9\uFF0C\u597D\u597D\u73CD\u60DC\u3002`);
  }
  if (weakest[1] <= 65 && weakest[0] !== strongest[0]) {
    parts.push(`\u3010${dimNames[weakest[0]]}\u3011\u662F\u8FD9\u6BB5\u5173\u7CFB\u53EF\u4EE5\u91CD\u70B9\u6295\u5165\u7684\u65B9\u5411\u3002\u591A\u4E00\u4EFD\u8010\u5FC3\u548C\u89C9\u5BDF\uFF0C\u8FD9\u91CC\u4F1A\u6210\u4E3A\u65B0\u7684\u589E\u957F\u70B9\u3002`);
  }
  if (bazi.score >= 80) {
    parts.push("\u516B\u5B57\u5C42\u9762\u663E\u793A\u4F60\u4EEC\u7684\u65E5\u4E3B\u5173\u7CFB\u878D\u6D3D\uFF0C\u5185\u5728\u6027\u683C\u5E95\u8272\u4E92\u76F8\u5438\u5F15\u3002");
  }
  if (zodiac.score >= 80) {
    parts.push("\u661F\u5EA7\u5C42\u9762\u663E\u793A\u661F\u8FB0\u7684\u80FD\u91CF\u5728\u4E3A\u4F60\u4EEC\u52A0\u6301\uFF0C\u8FD9\u662F\u96BE\u5F97\u7684\u5B87\u5B99\u795D\u798F\u3002");
  }
  if (iching.score >= 80) {
    parts.push("\u6613\u7ECF\u5366\u8C61\u9884\u793A\u7740\u6B63\u5411\u7684\u53D1\u5C55\u8D8B\u52BF\uFF0C\u987A\u52BF\u800C\u4E3A\u4F1A\u6709\u60CA\u559C\u3002");
  }
  if (overall >= 75) {
    parts.push("\u8BB0\u4F4F\uFF0C\u547D\u7406\u53EA\u662F\u53C2\u8003\uFF0C\u771F\u6B63\u51B3\u5B9A\u5173\u7CFB\u8D28\u91CF\u7684\u662F\u4F60\u4EEC\u6BCF\u4E00\u5929\u7684\u9009\u62E9\u3002\u4F60\u4EEC\u62E5\u6709\u521B\u9020\u5E78\u798F\u7684\u6240\u6709\u6761\u4EF6\u3002");
  } else {
    parts.push('\u547D\u7406\u63ED\u793A\u7684\u662F\u6F5C\u80FD\u800C\u975E\u5B9A\u6570\u3002\u6BCF\u4E00\u6BB5\u7F8E\u597D\u7684\u5173\u7CFB\u90FD\u662F\u4ECE"\u613F\u610F\u5C1D\u8BD5"\u5F00\u59CB\u7684\u3002\u4F60\u4EEC\u62E5\u6709\u7684\u6BD4\u60F3\u8C61\u4E2D\u66F4\u591A\u3002');
  }
  return parts.join("\n\n");
}
function generateAspects(overall, dims, bazi, zodiac, iching) {
  const lucky = [];
  const challenging = [];
  if (overall >= 80) lucky.push("\u7F18\u5206\u6DF1\u539A\uFF0C\u76F8\u9047\u6982\u7387\u6781\u4F4E");
  if (bazi.score >= 78) lucky.push("\u4E94\u884C\u4E92\u8865\u6F5C\u529B\u5927");
  if (zodiac.score >= 78) lucky.push("\u661F\u5EA7\u76F8\u4F4D\u548C\u8C10");
  if (iching.score >= 78) lucky.push("\u5366\u8C61\u8D8B\u52BF\u5411\u597D");
  if (dims.love >= 80) lucky.push("\u5929\u7136\u5438\u5F15\u529B\u5F3A");
  if (dims.communication >= 80) lucky.push("\u6C9F\u901A\u6210\u672C\u4F4E");
  if (dims.stability >= 80) lucky.push("\u957F\u671F\u53D1\u5C55\u524D\u666F\u597D");
  if (dims.communication <= 62) challenging.push("\u9700\u8981\u66F4\u591A\u8010\u5FC3\u503E\u542C\u5F7C\u6B64");
  if (dims.stability <= 62) challenging.push("\u9700\u8981\u5EFA\u7ACB\u5171\u540C\u76EE\u6807");
  if (dims.chemistry <= 62) challenging.push("\u80A2\u4F53\u8BED\u8A00\u548C\u4EB2\u5BC6\u611F\u6709\u5F85\u57F9\u517B");
  if (bazi.score <= 58) challenging.push("\u6027\u683C\u5E95\u5C42\u5DEE\u5F02\u9700\u78E8\u5408");
  if (zodiac.score <= 58) challenging.push("\u8868\u8FBE\u65B9\u5F0F\u53EF\u80FD\u4E0D\u540C\u9891");
  if (lucky.length === 0) lucky.push("\u53CC\u65B9\u90FD\u6709\u6210\u957F\u610F\u613F");
  if (challenging.length === 0) challenging.push("\u4FDD\u6301\u65B0\u9C9C\u611F\u9700\u8981\u6301\u7EED\u6295\u5165");
  return { lucky: lucky.slice(0, 4), challenging: challenging.slice(0, 3) };
}
function calculateCompatibility(date1, date2) {
  const p1 = parseBirthday(date1);
  const p2 = parseBirthday(date2);
  if (!p1 || !p2) {
    return { error: "DATE_FORMAT_ERROR" };
  }
  const baziResult = calcBaZi(p1, p2);
  const zodiacResult = calcZodiac(p1, p2);
  const ichingResult = calcIChing(p1, p2);
  const overall = Math.round(
    baziResult.score * 0.4 + zodiacResult.score * 0.4 + ichingResult.score * 0.2
  );
  const dims = deriveDimensions(baziResult, zodiacResult, ichingResult);
  const aiInsight = generateAIInsight(overall, dims, baziResult, zodiacResult, ichingResult);
  const { lucky, challenging } = generateAspects(overall, dims, baziResult, zodiacResult, ichingResult);
  return {
    overall,
    engines: {
      bazi: baziResult,
      zodiac: zodiacResult,
      iching: ichingResult
    },
    aiInsight,
    luckyAspects: lucky,
    challengingAspects: challenging,
    dimensions: dims
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  calculateCompatibility,
  parseBirthday
});
