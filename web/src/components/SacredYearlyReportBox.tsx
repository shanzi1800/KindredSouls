// 🛠️ V55: 军师决战组件——React严格版，五合一全部生效
// 星光呼吸灯/暗金光晕/追光器/归顶/章节硬插
import React, { useEffect, useRef, useState } from 'react';

// CSS动画
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

// 章节硬插 + 清洗
const processText = (text: string): string => {
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

  // 🌟 章节硬插
  c = c.replace(/年度财富核心指标看板/, '【✦ 第一章：年度宿命财运矩阵 ✦】\n\n年度财富核心指标看板');
  c = c.replace(/第二章[：:]\s*12个月财富流月精准沙盘/, '━━━━━━━━━━━━━━━━━━\n\n【✦ 第二章：十二流月财富黑天鹅与启示录 ✦】\n\n12个月财富流月精准沙盘');
  c = c.replace(/年度宏观战略定调/, '━━━━━━━━━━━━━━━━━━\n\n【✦ 第三章：年度宏观战略定调 ✦】\n\n年度宏观战略定调');
  c = c.replace(/最终财富神谕[·\s]*通关密令/, '━━━━━━━━━━━━━━━━━━\n\n【✦ 第六章：宇宙终极天启通关密令 ✦】\n\n最终财富神谕 · 通关密令');

  return c;
};

// 解析行类型
const parseLine = (line: string): { type: string; content: string } => {
  const trimmed = line.trim();

  if (!trimmed) return { type: 'empty', content: '' };
  if (trimmed.match(/^【\s*✦.+✦\s*】$/)) {
    return { type: 'chapter', content: trimmed.replace(/【\s*✦\s*|\s*✦\s*】/g, '') };
  }
  if (trimmed.match(/^#{2,3}\s+/)) {
    return { type: 'heading', content: trimmed.replace(/^#{2,3}\s+/, '') };
  }
  if (trimmed === '━━━━━━━━━━━━━━━━━━' || trimmed === '---') {
    return { type: 'divider', content: '' };
  }
  if (trimmed.match(/^\|[-\s|]+\|$/)) {
    return { type: 'skip', content: '' };
  }
  if (trimmed.match(/^\|.+\|/)) {
    const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
    return { type: 'table', content: cells.join(' · ') };
  }
  if (trimmed.match(/^🟢|^🔴|^⚠️|^🚀/)) {
    return { type: 'alert', content: trimmed };
  }
  return { type: 'text', content: trimmed };
};

// 渲染带粗体的文本
const renderBold = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} style={{ fontWeight: 700, color: '#D4AF37' }}>{part.slice(2, -2)}</span>;
    }
    return <span key={i}>{part}</span>;
  });
};

interface Props {
  rawStreamText: string;
  yearlyCardsReady: boolean;
  realSunSign?: string;
}

const SacredYearlyReportBox: React.FC<Props> = ({ rawStreamText, yearlyCardsReady }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(true);
  const [tick, setTick] = useState(0);

  const processedText = processText(rawStreamText || '');
  const hasContent = processedText.trim().length > 0;
  const lines = processedText.split('\n');

  // 追光器：流式期间自动滚底
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (yearlyCardsReady) {
      isAutoScrolling.current = false;
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hasContent && isAutoScrolling.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [rawStreamText, yearlyCardsReady, hasContent, tick]);

  // 强制刷新tick确保追光器工作
  useEffect(() => {
    if (!yearlyCardsReady && hasContent) {
      const interval = setInterval(() => setTick(t => t + 1), 500);
      return () => clearInterval(interval);
    }
  }, [yearlyCardsReady, hasContent]);

  // 用户滚动时暂停追光
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || yearlyCardsReady) return;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    isAutoScrolling.current = isAtBottom;
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', padding: '8px 16px', userSelect: 'none' }}>
      <style>{sacredGlobalStyles}</style>

      {/* 暗晶盒子 */}
      <div style={{
        position: 'relative',
        borderRadius: '16px',
        border: '1px solid rgba(212,175,55,0.2)',
        background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(10,10,15,0.98) 100%)',
        padding: '24px',
        boxShadow: '0 0 60px rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* 顶部标题 */}
        <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <h3 style={{ color: '#D4AF37', fontWeight: 700, letterSpacing: '2px', fontSize: '15px', margin: 0 }}>
            ✦ 先知天书 · 财富天启 ✦
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '1px', margin: '4px 0 0' }}>
            TARGET: 1995-03-08 | STATE: {yearlyCardsReady ? 'SEALED ✨' : 'STREAMING 🔮'}
          </p>
        </div>

        {/* 内容区 */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{
            height: '470px',
            overflowY: 'auto',
            paddingRight: '4px',
            textAlign: 'left',
          }}
        >
          {!hasContent ? (
            // 🌌 星光呼吸灯骨架屏
            <div style={{ padding: '24px 0' }}>
              <div className="pulse-stream-2s" style={{
                height: '14px',
                background: 'linear-gradient(90deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                borderRadius: '8px',
                width: '92%',
                marginBottom: '20px',
                border: '1px solid rgba(212,175,55,0.05)',
              }} />
              <div className="pulse-stream-25s" style={{
                height: '14px',
                background: 'linear-gradient(90deg, rgba(212,175,55,0.05), rgba(212,175,55,0.15), transparent)',
                borderRadius: '8px',
                width: '75%',
                marginBottom: '20px',
                border: '1px solid rgba(212,175,55,0.05)',
              }} />
              <div className="pulse-stream-3s" style={{
                height: '14px',
                background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                borderRadius: '8px',
                width: '83%',
                marginBottom: '20px',
                border: '1px solid rgba(212,175,55,0.05)',
              }} />
              <div className="pulse-stream-2s" style={{
                height: '14px',
                background: 'linear-gradient(90deg, rgba(212,175,55,0.1), transparent)',
                borderRadius: '8px',
                width: '67%',
                marginBottom: '20px',
                border: '1px solid rgba(212,175,55,0.05)',
              }} />
              <div className="pulse-stream-25s" style={{
                height: '14px',
                background: 'linear-gradient(90deg, rgba(212,175,55,0.08), transparent)',
                borderRadius: '8px',
                width: '58%',
                border: '1px solid rgba(212,175,55,0.05)',
              }} />
            </div>
          ) : (
            // 实际内容
            <div>
              {lines.map((line, idx) => {
                const { type, content } = parseLine(line);

                if (type === 'empty') return <div key={idx} style={{ height: '8px' }} />;
                if (type === 'skip') return null;
                if (type === 'divider') return (
                  <div key={idx} style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
                    margin: '12px 0',
                  }} />
                );
                if (type === 'chapter') return (
                  <div key={idx} style={{
                    color: '#D4AF37',
                    fontSize: '14px',
                    fontWeight: 700,
                    textAlign: 'center',
                    letterSpacing: '2px',
                    margin: '16px 0 12px',
                  }}>
                    【✦ {content} ✦】
                  </div>
                );
                if (type === 'heading') return (
                  <div key={idx} style={{
                    color: '#D4AF37',
                    fontSize: '13px',
                    fontWeight: 700,
                    textAlign: 'center',
                    margin: '14px 0 10px',
                    letterSpacing: '1px',
                  }}>
                    {content}
                  </div>
                );
                if (type === 'table') return (
                  <div key={idx} style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    marginBottom: '4px',
                    borderBottom: '1px solid rgba(212,175,55,0.1)',
                    paddingBottom: '4px',
                  }}>
                    {content}
                  </div>
                );
                if (type === 'alert') {
                  const isGreen = content.includes('🟢');
                  const isRed = content.includes('🔴');
                  return (
                    <div key={idx} style={{
                      color: isGreen ? 'rgba(16,185,129,0.95)' : isRed ? 'rgba(239,68,68,0.95)' : 'rgba(212,175,55,0.9)',
                      fontSize: '12px',
                      fontWeight: 600,
                      margin: '8px 0 4px',
                    }}>
                      {renderBold(content)}
                    </div>
                  );
                }
                return (
                  <div key={idx} style={{
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: '12.5px',
                    lineHeight: 1.85,
                    marginBottom: '6px',
                  }}>
                    {renderBold(content)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部暗金光晕 */}
        <div className="animate-sacred-glow" style={{
          position: 'absolute',
          bottom: '-2px',
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
        }} />
        <div className="animate-sacred-glow" style={{
          position: 'absolute',
          bottom: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80px',
          height: '80px',
          background: 'rgba(212,175,55,0.2)',
          borderRadius: '50%',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
};

export default SacredYearlyReportBox;
