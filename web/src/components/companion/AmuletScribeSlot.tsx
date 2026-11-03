/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E121-SCRIBE-SLOT（主公军令 2026-11-03 · 任务 #701 销项）：破冰密函插槽消费端
 * ═══════════════════════════════════════════════════════════════════════════
 * 病灶：detectScribeIntent/scribeSuggestionLine（E120-刀四触发器）＋24 套模板＋
 *   Canvas 引擎在底层全备，但 ChatSheet 消费端零接线——对话流永不吐密函插槽。
 * 军令三刀落位（本文件＝刀一微缩插槽＋刀二全屏预览弹层）：
 *   · AmuletScribeSlotCard：360px 暗金胶囊微缩卡（塔罗线稿徽章＋密函标题＋
 *     吉时窗＋[查阅并保存] 金按钮），紧随命中的 assistant 气泡下方；
 *   · AmuletPreviewModal：点击呼出 1080×1748 黄金比例高清 Canvas 预览
 *     （renderAmuletToCanvas 同源引擎渲染⇒PNG dataURL 居中展示），
 *     桌面 [保存图片] a[download]＋手机原生长按保存；
 * 🔴 刀三军规红线：零 i18n 新键（SLOT_UI 自容六语字典＋AMULET_TEMPLATES_24
 *   模板真源取文案，familiar 59 键＋全站 123 基准不动）；fail-closed——
 *   非四型白名单 type 一律不渲染；零 CSS 文件改动（inline style）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useState } from 'react';
import { getAmuletTemplate } from '../../lib/amuletTemplates.mjs';
import type { AmuletTemplateContentRow } from '../../lib/amuletTemplates.mjs';
import { createAmuletCanvas, renderAmuletToCanvas, isGoldenRatioCanvas } from '../../lib/amuletCanvasRenderer.mjs';

type Lang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';
export type ScribeAmuletType = 'apology' | 'longing' | 'support' | 'weather';

/** 插槽自容六语字典（军令刀三——零 i18n 新键，照 POUCH_UI 先例） */
const SLOT_UI: Record<Lang, { scribeTag: string; open: string; save: string; close: string; renderFail: string }> = {
  zh: {
    scribeTag: '灵宠代写 · 已按此刻天象拟好',
    open: '✦ 查阅并保存 1:1.618 高清密函 ✦',
    save: '保存图片',
    close: '关闭',
    renderFail: '密函渲染失败，请稍后再试',
  },
  en: {
    scribeTag: 'Companion-scribed · sealed for this sky',
    open: '✦ View & Save the 1:1.618 Amulet ✦',
    save: 'Save Image',
    close: 'Close',
    renderFail: 'Amulet rendering failed, please retry',
  },
  fr: {
    scribeTag: 'Écrit par la compagne · scellé sous ce ciel',
    open: '✦ Consulter et sauver l’amulette 1:1.618 ✦',
    save: 'Enregistrer l’image',
    close: 'Fermer',
    renderFail: 'Échec du rendu, veuillez réessayer',
  },
  es: {
    scribeTag: 'Escrito por la compañera · sellado bajo este cielo',
    open: '✦ Ver y guardar el amuleto 1:1.618 ✦',
    save: 'Guardar imagen',
    close: 'Cerrar',
    renderFail: 'Fallo al renderizar, reintenta',
  },
  th: {
    scribeTag: 'เขียนโดยเพื่อนร่วมวิญญาณ · ผนึกไว้ตามฟ้าวันนี้',
    open: '✦ เปิดดูและบันทึกเครื่องราง 1:1.618 ✦',
    save: 'บันทึกรูปภาพ',
    close: 'ปิด',
    renderFail: 'เรนเดอร์ไม่สำเร็จ โปรดลองอีกครั้ง',
  },
  vi: {
    scribeTag: 'Linh thú viết thay · niêm phong theo trời hôm nay',
    open: '✦ Xem và lưu mật thư 1:1.618 ✦',
    save: 'Lưu ảnh',
    close: 'Đóng',
    renderFail: 'Kết xuất thất bại, vui lòng thử lại',
  },
};

/** fail-closed 白名单判别：非四型一律不渲染 */
function isScribeAmuletType(v: string): v is ScribeAmuletType {
  return v === 'apology' || v === 'longing' || v === 'support' || v === 'weather';
}

/** 六语模板取值（getAmuletTemplate 自带 en 兜底＋fail-closed null） */
function slotTemplate(type: ScribeAmuletType, lang: Lang): AmuletTemplateContentRow | null {
  return getAmuletTemplate(type, lang);
}

/* ═══════════ 刀一：微缩密函插槽卡（360px 暗金胶囊）═══════════ */

export interface AmuletScribeSlotCardProps {
  type: string;
  lang: string;
  /** 点击呼出全屏 Canvas 预览（刀二） */
  onOpen: (type: ScribeAmuletType) => void;
}

export const AmuletScribeSlotCard: React.FC<AmuletScribeSlotCardProps> = ({ type, lang, onOpen }) => {
  if (!isScribeAmuletType(type)) return null; // fail-closed：白名单外不渲染
  const l = (SLOT_UI as Record<string, (typeof SLOT_UI)['zh']>)[lang] || SLOT_UI.en;
  const tpl = slotTemplate(type, (lang as Lang));
  if (!tpl) return null; // 模板缺失 fail-closed
  const title = String(tpl.title || '');
  const timing = String(tpl.defaultTiming || '');
  const tarot = String(tpl.tarotCard || '');
  const number = String(tpl.tarotNumber || '');
  const windowPrefix = String(tpl.bestWindowPrefix || 'Best Celestial Window');

  return (
    <div
      data-testid="amulet-scribe-slot"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(type)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(type); }}
      style={{
        width: '360px', maxWidth: '100%',
        marginTop: 8, padding: '12px 14px',
        background: 'rgba(14,13,18,0.9)',
        border: '1px solid rgba(212,175,55,0.4)',
        borderRadius: 12, cursor: 'pointer',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 0 18px rgba(212,175,55,0.08)',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'border-color .2s ease, box-shadow .2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.85)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
    >
      {/* 左：金箔质感塔罗线稿缩略徽章（模板真源 tarotCard/tarotNumber） */}
      <div
        data-testid="amulet-slot-tarot"
        aria-hidden="true"
        style={{
          flexShrink: 0, width: 52, height: 84,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #191521, #0B0B0E)',
          border: '1px solid rgba(212,175,55,0.55)', borderRadius: 6,
          color: '#F3E5AB', textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 15, letterSpacing: 1, lineHeight: 1.3, padding: '0 4px' }}>{tarot}</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: 'rgba(212,188,122,0.7)', marginTop: 4 }}>{number}</span>
      </div>
      {/* 中：密函标题＋天象吉时标签 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, letterSpacing: 1.5, color: '#F3E5AB', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(212,188,122,0.8)', marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          ✧ {windowPrefix}: {timing}
        </div>
        <div style={{ fontSize: 9.5, color: 'rgba(159,199,232,0.65)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {l.scribeTag}
        </div>
      </div>
      {/* 右：金色交互按钮（军令钦定句式） */}
      <button
        type="button"
        data-testid="amulet-slot-open"
        onClick={(e) => { e.stopPropagation(); onOpen(type); }}
        style={{
          flexShrink: 0, padding: '8px 12px', borderRadius: 999,
          background: 'linear-gradient(135deg, rgba(212,175,55,0.92), rgba(160,120,40,0.92))',
          border: '1px solid #D4AF37', color: '#141310',
          fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {l.open}
      </button>
    </div>
  );
};

/* ═══════════ 刀二：全屏 Canvas 预览弹层（1080×1748 黄金比例）═══════════ */

export interface AmuletPreviewModalProps {
  /** null＝关闭；四型之一＝开 */
  type: string | null;
  lang: string;
  /** 宿主名（防伪章宿主行——缺省由渲染器默认处理） */
  hostName?: string;
  onClose: () => void;
}

export const AmuletPreviewModal: React.FC<AmuletPreviewModalProps> = ({ type, lang, hostName, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [renderErr, setRenderErr] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setDataUrl(null); setRenderErr(false);
      if (!type || !isScribeAmuletType(type)) return; // fail-closed
      try {
        const tpl = slotTemplate(type, (lang as Lang));
        if (!tpl) throw new Error('template missing');
        const canvas = createAmuletCanvas();
        await renderAmuletToCanvas(canvas, tpl, lang, {
          type,
          ...(hostName ? { hostName } : {}),
        });
        if (!isGoldenRatioCanvas(canvas)) throw new Error('golden ratio lock failed');
        if (!alive) return;
        const url = canvas.toDataURL('image/png');
        if (!alive) return;
        setDataUrl(url.startsWith('data:image/png') ? url : null);
      } catch {
        if (alive) setRenderErr(true);
      }
    })();
    return () => { alive = false; };
  }, [type, lang, hostName]);

  if (!type || !isScribeAmuletType(type)) return null;
  const l = (SLOT_UI as Record<string, (typeof SLOT_UI)['zh']>)[lang] || SLOT_UI.en;
  const tpl = slotTemplate(type, (lang as Lang));
  const stampName = tpl ? String(tpl.title || 'amulet') : 'amulet';
  const fileName = `kindredsouls-amulet-${type}-${Date.now()}.png`;

  return (
    <div
      role="dialog"
      aria-label={stampName}
      data-testid="amulet-preview-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        /* z-9700＋遮罩 0.9：E122-刀一合规（≥军令 bg-black/70 基线）；宿主
           FamiliarChatSheet 本就 portal 至 document.body ⇒ 无层叠笼穿透之患 */
        position: 'fixed', inset: 0, zIndex: 9700,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      {/* 高清密函大图（1080×1748 PNG dataURL 居中；手机端原生长按保存） */}
      {dataUrl && (
        <img
          src={dataUrl}
          alt={stampName}
          draggable={false}
          style={{
            maxHeight: '78vh', maxWidth: '92vw',
            objectFit: 'contain', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'default',
            border: '1px solid rgba(212,175,55,0.45)', borderRadius: 10,
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 32px rgba(212,175,55,0.15)',
          }}
        />
      )}
      {/* 渲染中/失败态（fail-soft 提示，弹层保留可关闭） */}
      {!dataUrl && !renderErr && (
        <div style={{ color: '#D4BC7A', fontSize: 13, letterSpacing: 2 }}>✦ …✦</div>
      )}
      {!dataUrl && renderErr && (
        <div style={{ color: 'rgba(232,217,168,0.75)', fontSize: 12.5, letterSpacing: 1 }}>{l.renderFail}</div>
      )}
      {/* 底部操作条：保存＋关闭（桌面 a[download]；手机长按图片原生保存） */}
      <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
        {dataUrl && (
          <a
            href={dataUrl}
            download={fileName}
            data-testid="amulet-preview-save"
            style={{
              padding: '10px 20px', borderRadius: 999, textDecoration: 'none',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.92), rgba(160,120,40,0.92))',
              border: '1px solid #D4AF37', color: '#141310',
              fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
            }}
          >
            {l.save}
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={l.close}
          style={{
            padding: '10px 16px', borderRadius: 999, cursor: 'pointer',
            background: 'rgba(19,16,10,0.85)', border: '1px solid rgba(212,175,55,0.5)',
            color: '#E8D9A8', fontSize: 12, letterSpacing: 1,
          }}
        >
          ✕ {l.close}
        </button>
      </div>
    </div>
  );
};

export default AmuletScribeSlotCard;
