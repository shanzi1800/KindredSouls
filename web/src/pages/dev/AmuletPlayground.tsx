/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-PLAYGROUND 刀一（主公军令 2026-11-03）：AmuletPlayground 本地沙盒走查工坊
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：挂载 /dev/amulet-preview 开发路由（import.meta.env.DEV 环境守卫，
 * 生产构建死码剔除零污染）——4 款密函 × 6 语种走查矩阵＋单张/批量导出。
 *   · 离屏画布严格锁死 1080 × 1748 px（1:1.618 黄金矩形）；
 *   · 原生 document.createElement('canvas') 离屏渲染＋toBlob 下载流水线
 *     （🔴 零 @napi-rs/canvas / node-canvas 等 C++ 原生依赖——军师钦定浏览器方案）；
 *   · 批量导出强制 80ms 节流微等待（防浏览器并发下载限流拦截）；
 *   · 走查四查：全矩阵无死角加载 / 泰文调号完整（行高 1.8）/ 越文声调无重叠
 *     挤框 / 批导出 24 张 1080×1748 PNG＋kindredsouls.online 防伪水印居中。
 * 战报锚：控制台打印 [AmuletPlayground] 24/24 templates rendered successfully。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useRef, useState } from 'react';
import { AMULET_TEMPLATES_24, AMULET_TYPES, AMULET_LOCALES } from '../../lib/amuletTemplates.mjs';
import type { AmuletTemplateContentRow } from '../../lib/amuletTemplates.mjs';
import { renderAmuletToCanvas } from '../../lib/amuletCanvasRenderer.mjs';

/** 六语模板索引视图（军令 4×6 走查矩阵取值——类型收窄单点） */
const TEMPLATES = AMULET_TEMPLATES_24 as unknown as Record<string, Record<string, AmuletTemplateContentRow>>;

const LOCALE_LABELS: Record<string, string> = {
  zh: '中文 (ZH)', en: 'English (EN)', fr: 'Français (FR)',
  es: 'Español (ES)', th: 'ภาษาไทย (TH)', vi: 'Tiếng Việt (VI)',
};

const TYPE_NAMES: Record<string, string> = {
  apology: '道歉·解冻 (Apology)', longing: '想念·引力 (Longing)',
  support: '鼓励·加持 (Support)', weather: '关系天气 (Weather)',
};

const GOLD = '#D4AF37';
const CHAMPAGNE = '#F3E5C8';

const AmuletPlayground: React.FC = () => {
  const [renderedCards, setRenderedCards] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<{ dataUrl: string; title: string } | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  /** 初始化离屏画布（锁死 1080 × 1748）＋页面加载后自动生成 24 张缩略图 */
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1748;
    offscreenCanvasRef.current = canvas;
    void generateThumbnails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateThumbnails = async () => {
    const canvas = offscreenCanvasRef.current;
    if (!canvas) return;
    const cardsMap: Record<string, string> = {};
    let ok = 0;
    for (const type of AMULET_TYPES) {
      for (const locale of AMULET_LOCALES) {
        const key = `${type}_${locale}`;
        const template = TEMPLATES[type][locale];
        await renderAmuletToCanvas(canvas, template, locale, {
          hostName: 'Jiangshan',
          partnerName: 'North',
          type,
          hashId: 'DEV',
        });
        cardsMap[key] = canvas.toDataURL('image/png', 0.8);
        ok += 1;
      }
    }
    setRenderedCards(cardsMap);
    if (ok === AMULET_TYPES.length * AMULET_LOCALES.length) {
      // 战报锚：军令钦定确认行
      console.log('[AmuletPlayground] 24/24 templates rendered successfully');
    } else {
      console.warn(`[AmuletPlayground] render incomplete: ${ok}/24`);
    }
  };

  /** 单张下载（1080×1748 高清 PNG） */
  const handleDownloadSingle = async (type: string, locale: string) => {
    const canvas = offscreenCanvasRef.current;
    if (!canvas) return;
    const template = TEMPLATES[type][locale];
    await renderAmuletToCanvas(canvas, template, locale, {
      hostName: 'Jiangshan',
      partnerName: 'North',
      type,
      hashId: 'EXPORT',
    });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amulet_${type}_${locale}_1080x1748.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /** 全量批量顺序导出（24 张——80ms 节流防浏览器拦截） */
  const handleBatchExport = async () => {
    const canvas = offscreenCanvasRef.current;
    if (!canvas || isExporting) return;
    setIsExporting(true);
    let count = 0;
    const total = AMULET_TYPES.length * AMULET_LOCALES.length;
    setExportProgress({ current: 0, total });
    for (const type of AMULET_TYPES) {
      for (const locale of AMULET_LOCALES) {
        count += 1;
        setExportProgress({ current: count, total });
        const template = TEMPLATES[type][locale];
        await renderAmuletToCanvas(canvas, template, locale, {
          hostName: 'Jiangshan',
          partnerName: 'North',
          type,
          hashId: locale,
        });
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `kindredsouls_amulet_${type}_${locale}.png`;
          link.click();
          URL.revokeObjectURL(url);
          // 80ms 节流：防浏览器高频下载安全策略拦截（军令钦定）
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
      }
    }
    setIsExporting(false);
    setExportProgress(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#08080A', color: '#E0D8C3', padding: 32, fontFamily: 'Georgia, "Noto Serif SC", serif' }}>
      {/* 顶部标题与控制栏 */}
      <header style={{ maxWidth: 1600, margin: '0 auto 40', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2A2633', paddingBottom: 24, gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, letterSpacing: 4, color: GOLD, textTransform: 'uppercase', border: `1px solid ${GOLD}66`, padding: '2px 8px', borderRadius: 4 }}>
              Local Dev Sandbox
            </span>
            <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'Menlo, monospace' }}>E120-AMULET-PLAYGROUND</span>
          </div>
          <h1 style={{ fontSize: 24, letterSpacing: 2, color: '#f4f4f5', margin: '8px 0 4px', fontWeight: 600 }}>
            破冰密函 4×6 全语言走查与离屏批导出工坊
          </h1>
          <p style={{ fontSize: 12, color: '#a1a1aa', margin: 0 }}>
            绝对黄金比例 1080×1748 px · 原生 Canvas 离屏加速 · 零额外 Node Native 依赖
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleBatchExport()}
          disabled={isExporting}
          style={{
            padding: '12px 24px', borderRadius: 6, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            background: isExporting ? '#27272a' : GOLD,
            color: isExporting ? '#71717a' : '#0a0a0a',
            border: `1px solid ${isExporting ? '#3f3f46' : '#F5E6BE'}`,
            fontWeight: 600, fontFamily: 'inherit',
          }}
        >
          {isExporting
            ? `正在导出 (${exportProgress?.current ?? 0}/${exportProgress?.total ?? 24})…`
            : '✦ 批量导出全六语 24 张高清图 ✦'}
        </button>
      </header>

      {/* 4×6 走查矩阵 */}
      <main style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
        {AMULET_TYPES.map((type) => (
          <section key={type} style={{ border: '1px solid #1F1C26', background: '#0E0D12', borderRadius: 10, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid #1F1C26' }}>
              <h2 style={{ fontSize: 18, color: CHAMPAGNE, margin: 0, fontWeight: 600 }}>
                <span style={{ color: GOLD }}>✦</span> {TYPE_NAMES[type]}
              </h2>
              <span style={{ fontSize: 11, fontFamily: 'Menlo, monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: 2 }}>
                Type: {type}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
              {AMULET_LOCALES.map((locale) => {
                const key = `${type}_${locale}`;
                const dataUrl = renderedCards[key];
                return (
                  <div key={locale} style={{ display: 'flex', flexDirection: 'column', background: '#141219', border: '1px solid #272333', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontFamily: 'Menlo, monospace', color: '#a1a1aa', fontWeight: 600 }}>{LOCALE_LABELS[locale]}</span>
                      <button type="button" onClick={() => void handleDownloadSingle(type, locale)} style={{ fontSize: 10, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                        单张下载
                      </button>
                    </div>
                    {/* 1:1.618 比例缩略视口（点击放大检视） */}
                    <div
                      onClick={() => dataUrl && setSelectedPreview({ dataUrl, title: `${TYPE_NAMES[type]} - ${LOCALE_LABELS[locale]}` })}
                      style={{
                        position: 'relative', width: '100%', aspectRatio: '1080 / 1748', background: '#08080A',
                        borderRadius: 6, border: '1px solid #1E1B26', overflow: 'hidden', cursor: 'zoom-in',
                      }}
                    >
                      {dataUrl ? (
                        <img src={dataUrl} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#52525b', fontFamily: 'Menlo, monospace' }}>
                          渲染中...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* 放大检视弹窗 */}
      {selectedPreview && (
        <div
          onClick={() => setSelectedPreview(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxHeight: '92vh', aspectRatio: '1080 / 1748', border: `1px solid ${GOLD}80`, borderRadius: 10, overflow: 'hidden', background: '#0B0B0E', boxShadow: '0 0 50px rgba(212,175,55,0.15)' }}
          >
            <img src={selectedPreview.dataUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
              <span style={{ fontSize: 12, fontFamily: 'Menlo, monospace', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: 4, color: GOLD, border: `1px solid ${GOLD}40` }}>
                {selectedPreview.title}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                style={{ pointerEvents: 'auto', fontSize: 12, background: '#27272a', color: '#fff', padding: '4px 12px', borderRadius: 4, border: '1px solid #52525b', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmuletPlayground;
