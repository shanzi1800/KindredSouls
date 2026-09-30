// ═══════════════════════════════════════════════════════════════════════
// ── 先知天书:年报「解析层」纯函数模块(V474 抽离) ──
// ═══════════════════════════════════════════════════════════════════════
// 抽离自 src/pages/WealthReportPage.tsx,V474 起独立成模块。
// 动机:此前 parseYearlyReport 与渲染块同处一个 3000 行页面文件,
//       一旦 tsc 报错,前人图省事直接把整段 JSX 注释掉——而「代码被注释掉
//       仍能编译通过」正是 V473 幽灵 Bug 的成因。
//       纯函数独立后,可在 Node 原生单测中直跑真行为断言(见 web/test/)。
// 约束:本模块必须保持「零 React / 零 DOM 依赖」,只做字符串与结构变换。
// ═══════════════════════════════════════════════════════════════════════

export interface YearlyChapter {
  title: string;
  content: string;
}

export interface MonthBlock {
  month: string;       // "M1"
  dateRange: string;   // "2026年7月"
  zodiac: string;     // "巨蟹座新月"
  state: 'peak' | 'risk' | 'flow';
  stateLabel: string;
  cosmicPhase: string;
  paragraphs: string[];
  wealthAction: string[];
  shadowWork: string[];
}

// 🛠️ 军师硬核:年报终极日期清洗矩阵(七重斩杀·终极版)
// ⚠️ 注意:此函数必须在流式结束后对完整文本调用,不能在 onStreamChunk 中调用!
export const cleanYearlyTimeline = (text: string): string => {
  if (!text) return text;
  let cleaned = text;

  // 🎯 斩杀 1:三连击年份去重 (如:2026年7月2026年7月2026年7月 → 2026年7月)
  // 贪婪匹配任意次数的重复
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)(?:\1)+/g, '$1');

  // 🎯 斩杀 2:AAB 模式处理 (如:2026年7月2026年7月2027年1月 → 2026年7月至2027年1月)
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)(?:\1)+(\d{4}年\d{1,2}月)/g, '$1至$2');

  // 🎯 斩杀 3:带横杠的重复 (如:2027年1月-2027年1月2027年1月 → 2027年1月)
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)-(?:\1)+/g, '$1');
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)-(?:\1)+至(\d{4}年\d{1,2}月)/g, '$1至$2');

  // 🎯 斩杀 4:生日+流年混杂 (如:1995年3月1995年3月2026年7月8日 → 1995年3月2026年7月8日)
  // 旧年份重复,后面跟着新日期
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)(?:\1)+(\d{4}年\d{1,2}月\d{1,2}日)/g, '$1$2');

  // 🎯 斩杀 5:月份卡片内部的复读 (如:7月7日7月7日7月22日 → 7月7日至7月22日)
  cleaned = cleaned.replace(/(\d{1,2}月\d{1,2}日)(?:\1)+(\d{1,2}月)?(\d{1,2}日)/g, '$1至$2$3');
  cleaned = cleaned.replace(/(\d{1,2}月\d{1,2}日)(?:\1)+/g, '$1');

  // 🎯 斩杀 6:跨年度区间重复 (如:至2027年1月2027年1月 → 至2027年1月)
  cleaned = cleaned.replace(/至\s*(\d{4}年\d{1,2}月)(?:\1)+/g, '至 $1');

  // 🎯 斩杀 7:兜底清理--任何剩余的年份重复模式
  // 循环执行直到没有变化
  let prev = cleaned;
  for (let i = 0; i < 5; i++) {
    cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)(?:\1)+/g, '$1');
    if (cleaned === prev) break;
    prev = cleaned;
  }

  // V103-fix21: 通用括号平衡--行内中文左括号(无闭合)→ 行尾补)
  // 🛠️ V474-fix 拆弹:原实现 new RegExp('(([^)\n]*?)(\s*)(?=\n|$)') 少一个右括号。
  //   致命点:tsc / 打包器都【看不见】字符串拼接出来的正则(它不是正则字面量),
  //   于是编译期全绿,运行时一调用必抛 SyntaxError: Unterminated group。
  //   后果:年报渲染链 cleanYearlyTimeline(非空文本) 直接崩 → 页面「没有流式文字内容输出」。
  //   修复:改为与 cleanRawReportText 同源的「计数式括号平衡」,严格按上面的注释语义
  //        按行补右括号;不再在运行时构造正则,彻底消除该类地雷。
  cleaned = cleaned
    .split('\n')
    .map((line) => {
      const openBrackets = (line.match(/\(/g) || []).length;
      const closeBrackets = (line.match(/\)/g) || []).length;
      return openBrackets > closeBrackets
        ? line + ')'.repeat(openBrackets - closeBrackets)
        : line;
    })
    .join('\n');

  return cleaned;
};

// 🛠️ 军师霸权清洗版:前端物理净化器
export const parseYearlyReport = (rawText: string, _birthDate: string): {
  title: string;
  chapters: YearlyChapter[];
  months: MonthBlock[];
  rawContent: string;
} => {
  if (!rawText) return { title: '', chapters: [], months: [], rawContent: '' };

  // 🎯 军师前置"霸权清洗矩阵":进来先扒皮,管你 AI 怎么吐,到我这里全部变成标准版!
  let filteredText = rawText
    // 1. 【物理绝杀缝合怪】:管你 > 后面有多少空格、多少井号,只要在行首,全部无脑拍扁成标准二级标题 "## "
    .replace(/^>\s*#+/gm, '## ')

    // 2. 【定点清除"先知天书"幻觉】:截图里疯狂出现的"> ## ✦ 先知天书",直接物理替换为我们前端需要的绝对硬核锚点
    .replace(/##\s*(?:✦\s*)?先知天书.*/gi, '## 先知神谕:年度财富天启')
    .replace(/^#{2,6}\s*📊\s*2026-2027.*/gim, '## 先知神谕:年度财富天启') // 顺手干掉那个核心指标看板标题,防止它干扰第一章
    // 🛡️ V480: 旧写法 `/##\s*📊\s*2026-2027.*/gi`(无 ^、无 m)会从 `### 📊 …` 的**第 2 个 #** 开始匹配,
    //   替换后残留 1 个 `#` → 产出半吊子锚点「### 先知神谕:年度财富天启」, 而章节卡严格要「## 」→ 沦为正文残渣。
    //   改为行首锚定 + #{2,6}。

    // 3. 【无脑蒸发干扰符号】:把 AI 喜欢乱加的、会导致 markdown 渲染翻车的各种特殊符号全部擦除
    .replace(/📅|📊|📕|✦|📌|🔮|◆|◇/g, '')

    // 4. 【终极强制降级】:把所有类似 ### 第一章 这种滑坡标题,在行首强行拉回成标准 ##
    .replace(/^###\s+(第[一二三四五][章节]|最终财富|通关密令)/gm, '## $1');

  // ------------------------------------------------------------
  // 下面进入铁血硬切循环
  const lines = filteredText.split('\n');
  const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || '年度财富报告';
  const months: MonthBlock[] = [];
  const chapters: YearlyChapter[] = [];

  let currentMonth: Partial<MonthBlock> | null = null;
  let currentSection: 'paragraphs' | 'wealthAction' | 'shadowWork' = 'paragraphs';
  let currentChapterTitle = "先知神谕:年度财富天启"; // 兜底开局卡片
  let currentChapterContent: string[] = [];

  // 必须同时满足:以 "## " 开头,且包含核心死字
  const CHAPTER_KEYWORDS = ["先知", "第一章", "第二章", "第三章", "第四章", "第五章", "最终", "密令"];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---') continue;

    // 检测月份
    // 🛡️ V480: 分隔符必须吃全角！真值故障(2026-09-30 生产端 zh 年报):
    //   LLM 某次输出「### 2026年9月：太阳在处女座第十一宫」(全角冒号), 而旧字符类 [·::-|] 只认半角
    //   → 实测 months=0, 12 个月卡整体消失、流年矩阵容器空白。层级同时放宽到 #{1,6} 兜底。
    const monthMatch = trimmed.match(/^#{1,6}\s*(\d{4}年\d{1,2}月)\s*[·:：\-|｜–—]\s*(.+)$/);
    if (monthMatch) {
      if (currentMonth && currentMonth.month) months.push(currentMonth as MonthBlock);
      const state = trimmed.includes('高峰') || trimmed.includes('🟢') || trimmed.includes('Peak') || trimmed.includes('显化')
        ? 'peak' : trimmed.includes('高风险') || trimmed.includes('🔴') || trimmed.includes('Risk')
        ? 'risk' : 'flow';
      const stateLabel = state === 'peak' ? '🟢 财富充能月' : state === 'risk' ? '🔴 高危熔断月' : '🔵 顺流蓄力月';
      currentMonth = {
        month: monthMatch[1],
        dateRange: '',
        zodiac: monthMatch[2].trim(),
        state,
        stateLabel,
        cosmicPhase: '',
        paragraphs: [],
        wealthAction: [],
        shadowWork: [],
      };
      currentSection = 'paragraphs';
      continue;
    }

    // 检测财富行动
    if (trimmed.includes('■ 财富行动') || trimmed.includes('财富行动:')) {
      currentSection = 'wealthAction';
      const text = trimmed.replace(/^[■◆●]\s*/, '').replace('财富行动:', '').replace('财富行动', '');
      if (text) (currentMonth || { paragraphs: [] }).paragraphs!.push(text);
      continue;
    }

    // 检测阴影觉察
    if (trimmed.includes('⚠️ 心理学阴影觉察') || trimmed.includes('✨ 荣格核心心法') ||
        trimmed.includes('阴影觉察') || trimmed.includes('Shadow Work')) {
      currentSection = 'shadowWork';
      const text = trimmed.replace(/^[⚠️✨]\s*/, '').replace(/心理学阴影觉察[::]/, '').replace(/荣格核心心法高亮[::]/, '').replace('阴影觉察', '');
      if (text) (currentMonth || { paragraphs: [] }).paragraphs!.push(text);
      continue;
    }

    // 🎯 军师绝杀雷达:铁血硬切 - 必须同时满足:1.以 ## 开头;2.包含核心章节关键字
    const isStrictNewChapter =
      trimmed.startsWith('## ') &&
      CHAPTER_KEYWORDS.some(keyword => trimmed.includes(keyword));

    if (isStrictNewChapter) {
      // 🛡️ V480: 去掉 `|| chapters.length === 0` —— 它会在遇到**第一个**章节锚点时
      //   强行 push 一张开局兜底空卡(实测真实年报产出「先知神谕:年度财富天启」0 字空卡)。
      //   内容为空就不该成卡; 文档只有单章时由下方收尾 push 兜住。
      if (currentChapterContent.length > 0) {
        chapters.push({
          title: currentChapterTitle,
          content: currentChapterContent.join('\n')
        });
      }
      currentChapterTitle = trimmed.replace(/^##\s*/, ''); // 扒掉井号
      currentChapterContent = [];
      if (currentMonth && currentMonth.month) months.push(currentMonth as MonthBlock);
      currentMonth = null;
      continue;
    }

    // 普通内容,无脑累积
    currentChapterContent.push(line);
  }

  if (currentChapterContent.length > 0) {
    chapters.push({
      title: currentChapterTitle,
      content: currentChapterContent.join('\n')
    });
  }

  if (currentMonth && currentMonth.month) months.push(currentMonth as MonthBlock);

  // 🎯 【落闸大总洗】:在把干净数据塞给 UI 前,全量执行日期去重清洗!
  const finalChapters = chapters.map(ch => ({
    title: ch.title,
    content: cleanYearlyTimeline(ch.content) // 此时 2026年7月2026年7月 将在这里被碾成粉末!
  }));

  return { title, chapters: finalChapters, months, rawContent: rawText };
};
