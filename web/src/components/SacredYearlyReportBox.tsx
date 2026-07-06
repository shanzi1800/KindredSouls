// 🛠️ V50: 军师终极决战组件——星光呼吸灯/暗金光晕/追光器/归顶/章节硬插五合一
import React, { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';

const sacredGlobalStyles = `
@keyframes sacredPulse {
  0%, 100% { opacity: 0.15; transform: scaleX(0.97); }
  50% { opacity: 0.85; transform: scaleX(1.03); }
}
@keyframes sacredGlow {
  0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 12px rgba(245,158,11,0.35)); }
  50% { opacity: 1; filter: drop-shadow(0 0 25px rgba(245,158,11,0.7)); }
}
.pulse-stream-2s { animation: sacredPulse 2s infinite ease-in-out; }
.pulse-stream-25s { animation: sacredPulse 2.5s infinite ease-in-out; }
.pulse-stream-3s { animation: sacredPulse 3s infinite ease-in-out; }
.animate-sacred-glow { animation: sacredGlow 3s infinite ease-in-out; }
`;

// 🛠️ V50: 章节拦截硬插 + 天理纠偏
const cleanAndInjectChapters = (text: string) => {
  if (!text) return '';
  let c = text;

  // 斩首复读尾巴
  if (c.includes('生成 AI 洞察')) {
    c = c.split('生成 AI 洞察')[0];
  }

  // 斩杀太阳双子幻觉
  c = c.replace(/太阳双子 9°/g, '太阳双鱼 9°');
  c = c.replace(/太阳双子/g, '太阳双鱼');
  c = c.replace(/双子座/g, '双鱼座');

  // 斩杀"双鱼座风元素"常识错误
  c = c.replace(/双鱼座太阳的永恒印记。?你的灵魂带着风元素/g,
    '双鱼座太阳的永恒印记。你的灵魂带着水元素的深邃');
  c = c.replace(/基于风元素（双鱼座）/g, '基于水元素（双鱼座）');
  c = c.replace(/双鱼座的沟通能力/g, '双鱼座的直觉感知力');

  // 斩杀水瓶座天顶穿帮
  c = c.replace(/冥王星在水瓶座的行进，持续在你星盘的天顶——事业与公众形象/g,
    '冥王星在水瓶座的行进，持续在你星盘的第八宫——深层转化与偏财跨越');
  c = c.replace(/冥王星在你的天顶（第十宫，事业宫）/g,
    '冥王星在你的第八宫（深层转化与隐秘财富之宫）');
  c = c.replace(/水瓶座（你的第十宫宫头，代表事业/g,
    '水瓶座（你的第八宫宫头，代表深层资产转化');
  c = c.replace(/在你的事业宫（水瓶座）逆行/g,
    '在你的深层资源宫（水瓶座）逆行');
  c = c.replace(/水瓶座（你的第十宫/g, '水瓶座（你的第八宫');
  c = c.replace(/水瓶座在第十宫/g, '水瓶座在第八宫');

  // 斩杀重复黑天鹅话术
  c = c.replace(/你的"阴影自我"——对控制的渴望——可能被触发。{2,}/g, '你需保持冷静与觉知。');
  c = c.replace(/你的"阴影自我"——急躁和愤怒——可能被触发。{2,}/g, '你需控制冲动，深思熟虑。');

  // 🌟 章节拦截硬插：AI没输出章节名，前端自动插入
  // 第一章
  if (c.includes('2026-2027 年度财富核心指标看板') && !c.includes('第一章：')) {
    c = c.replace(
      /2026-2027 年度财富核心指标看板/g,
      `## ✦ 第一章：年度宿命财运矩阵 ✦\n\n### 2026-2027 年度财富核心指标看板`
    );
  }
  // 第二章
  if (c.includes('财富核心相位：木星在狮子座') && !c.includes('第二章：')) {
    c = c.replace(
      /财富核心相位：木星在狮子座/g,
      `---\n\n## ✦ 第二章：星体相位与天命显化 ✦\n\n### 财富核心相位：木星在狮子座`
    );
  }
  // 第三章
  if (c.includes('2026年7月：木星入财帛宫的觉醒之月') && !c.includes('第三章：')) {
    c = c.replace(
      /2026年7月：木星入财帛宫的觉醒之月/g,
      `---\n\n## ✦ 第三章：十二流月财富黑天鹅与启示录 ✦\n\n### 2026年7月：木星入财帛宫的觉醒之月`
    );
  }
  // 第四章
  if (c.includes('核心赛道') && !c.includes('第四章：')) {
    c = c.replace(
      /核心赛道：基于水元素（双鱼座）与火元素（狮子座）的财富引擎/g,
      `---\n\n## ✦ 第四章：风火引擎与隐藏副业指南 ✦\n\n### 核心赛道：基于水元素（双鱼座）与火元素（狮子座）的财富引擎`
    );
  }
  // 第五章
  if (c.includes('潜意识阴影：表演性消费') && !c.includes('第五章：')) {
    c = c.replace(
      /潜意识阴影：表演性消费/g,
      `---\n\n## ✦ 第五章：潜意识阴影与深度疗愈路径 ✦\n\n### 潜意识阴影：表演性消费`
    );
  }
  // 第六章（最终神谕）
  if (c.includes('最终财富神谕') && !c.includes('第六章：')) {
    c = c.replace(
      /最终财富神谕 · 通关密令/g,
      `---\n\n## ✦ 第六章：宇宙终极天启通关密令 ✦\n\n### 最终财富神谕 · 通关密令`
    );
  }

  return c.trim();
};

interface Props {
  rawStreamText: string;
  yearlyCardsReady: boolean;
  realSunSign?: string;
}

const SacredYearlyReportBox: React.FC<Props> = ({ rawStreamText, yearlyCardsReady, realSunSign = '双鱼座' }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(true);

  const displayContent = cleanAndInjectChapters(rawStreamText);

  // 🛠️ V50: 追光器 + 流式结束归顶
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (yearlyCardsReady) {
      isAutoScrolling.current = false;
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (displayContent && isAutoScrolling.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [displayContent, yearlyCardsReady]);

  // 用户自主滚动时暂停追光
  const handleUserScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || yearlyCardsReady) return;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 40;
    isAutoScrolling.current = isAtBottom;
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 select-none">
      <style>{sacredGlobalStyles}</style>

      {/* 先知深邃天书暗晶盒子 */}
      <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-slate-950 via-slate-900 to-neutral-950 p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        {/* 常驻尊贵顶冕 */}
        <div className="text-center mb-4 pb-3 border-b border-amber-500/10">
          <h3 className="text-amber-400 font-bold tracking-widest text-base">✦ 先知天书 · 财富天启 ✦</h3>
          <p className="text-neutral-500 text-[10px] tracking-wider mt-0.5">
            TARGET: 1995-03-08 | STATE: {yearlyCardsReady ? 'SEALED ✨' : 'STREAMING 🔮'}
          </p>
        </div>

        {/* 单框独立下拉流式容器 */}
        <div
          ref={scrollContainerRef}
          onScroll={handleUserScroll}
          className="h-[470px] overflow-y-auto pr-1 text-left transition-all duration-500"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {displayContent ? (
            <Markdown
              className="prose prose-invert max-w-none
                prose-h2:text-amber-400 prose-h2:text-center prose-h2:font-bold prose-h2:tracking-widest prose-h2:text-sm prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-amber-200/90 prose-h3:font-semibold prose-h3:text-xs prose-h3:mt-5 prose-h3:mb-2
                prose-p:text-neutral-300 prose-p:text-xs prose-p:leading-relaxed prose-p:mb-3
                prose-strong:text-amber-300 prose-strong:font-semibold"
            >
              {displayContent}
            </Markdown>
          ) : (
            // 🌌 星光呼吸灯骨架屏：3组不同宽度、不同周期交错脉冲条
            <div className="space-y-5 py-6">
              <div className="h-3.5 bg-gradient-to-r from-amber-500/15 to-amber-500/5 rounded-full w-11/12 pulse-stream-2s border border-amber-500/5" />
              <div className="h-3.5 bg-gradient-to-r from-amber-500/5 via-amber-500/15 to-transparent rounded-full w-9/12 pulse-stream-25s border border-amber-500/5" />
              <div className="h-3.5 bg-gradient-to-r from-transparent via-amber-500/15 to-amber-500/5 rounded-full w-10/12 pulse-stream-3s border border-amber-500/5" />
              <div className="h-3.5 bg-gradient-to-r from-amber-500/10 to-transparent rounded-full w-8/12 pulse-stream-2s border border-amber-500/5" />
              <div className="h-3.5 bg-gradient-to-r from-amber-500/8 to-transparent rounded-full w-7/12 pulse-stream-25s border border-amber-500/5" />
            </div>
          )}
        </div>

        {/* 底部暗金光晕切割线 */}
        <div className="absolute -bottom-0.5 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent animate-sacred-glow" />
        {/* 底部暗金光晕球 */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/20 rounded-full blur-xl pointer-events-none animate-sacred-glow" />
      </div>
    </div>
  );
};

export default SacredYearlyReportBox;
