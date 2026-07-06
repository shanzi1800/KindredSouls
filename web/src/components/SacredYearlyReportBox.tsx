// 🛠️ V54: 军师决战组件——dangerouslySetInnerHTML简单粗暴版
// 星光呼吸灯/暗金光晕/追光器/归顶/章节硬插 五合一
import React, { useEffect, useRef } from 'react';

const sacredGlobalStyles = `
@keyframes sacredPulse {
  0%, 100% { opacity: 0.12; }
  50% { opacity: 0.85; }
}
@keyframes sacredGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.9; }
}
.pulse-stream-2s { animation: sacredPulse 2s infinite ease-in-out; }
.pulse-stream-25s { animation: sacredPulse 2.5s infinite ease-in-out; }
.pulse-stream-3s { animation: sacredPulse 3s infinite ease-in-out; }
.animate-sacred-glow { animation: sacredGlow 3s infinite ease-in-out; }
`;

// 🛠️ V54: 章节拦截硬插 + 天理纠偏 + Markdown转HTML
const processContent = (text: string) => {
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

  // 🌟 章节拦截硬插
  c = c.replace(/年度财富核心指标看板/, '【✦ 第一章：年度宿命财运矩阵 ✦】\n\n年度财富核心指标看板');
  c = c.replace(/第二章[：:]\s*12个月财富流月精准沙盘/, '━━━━━━━━━━━━━━━━━━\n\n【✦ 第二章：十二流月财富黑天鹅与启示录 ✦】\n\n12个月财富流月精准沙盘');
  c = c.replace(/年度宏观战略定调/, '━━━━━━━━━━━━━━━━━━\n\n【✦ 第三章：年度宏观战略定调 ✦】\n\n年度宏观战略定调');
  c = c.replace(/最终财富神谕[·\s]*通关密令/, '━━━━━━━━━━━━━━━━━━\n\n【✦ 第六章：宇宙终极天启通关密令 ✦】\n\n最终财富神谕 · 通关密令');

  // Markdown转HTML
  // ### 标题 → h3
  c = c.replace(/^###\s+(.+)$/gm, '<h3 style="color:#D4AF37;font-size:13px;font-weight:700;text-align:center;margin:14px 0 10px;letter-spacing:1px;">$1</h3>');
  // ## 标题 → h2
  c = c.replace(/^##\s+(.+)$/gm, '<h2 style="color:#D4AF37;font-size:14px;font-weight:700;text-align:center;margin:16px 0 12px;letter-spacing:2px;">$1</h2>');
  // **粗体** → strong
  c = c.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#D4AF37;font-weight:700;">$1</strong>');
  // 表格线隐藏
  c = c.replace(/\|[-\s|]+\|/g, '');
  // 换行转br
  c = c.replace(/\n/g, '<br/>');

  return c;
};

interface Props {
  rawStreamText: string;
  yearlyCardsReady: boolean;
  realSunSign?: string;
}

const SacredYearlyReportBox: React.FC<Props> = ({ rawStreamText, yearlyCardsReady }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(true);

  const displayContent = processContent(rawStreamText || '');
  const hasContent = !!rawStreamText && rawStreamText.trim().length > 0;

  // 🛠️ V54: 追光器 + 流式结束归顶
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (yearlyCardsReady) {
      isAutoScrolling.current = false;
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hasContent && isAutoScrolling.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [rawStreamText, yearlyCardsReady, hasContent]);

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
          {hasContent ? (
            <div
              style={{
                color: 'rgba(255,255,255,0.88)',
                fontSize: '12.5px',
                lineHeight: 1.85,
              }}
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          ) : (
            // 🌌 星光呼吸灯骨架屏
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
