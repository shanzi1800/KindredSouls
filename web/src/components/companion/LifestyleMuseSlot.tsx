/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E124-LIFESTYLE-MUSE 刀四（主公军令 2026-11-05）：生活方式卡插槽消费端
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令三件（本文件＝微缩插槽＋全屏预览弹层——E121 AmuletScribeSlot 同构）：
 *   · LifestyleMuseSlotCard：360px 暗金胶囊微缩卡（style ⇒ 三色盘小徽章/
 *     roadtrip ⇒ 吉方罗盘徽章＋卡片标题＋CTA 金按钮）；
 *   · LifestylePreviewModal：点击呼出 1080×1748 黄金比例高清 Canvas 预览
 *     （renderLifestyleToCanvas 引擎⇒PNG dataURL 居中展示），桌面 [保存高清
 *     卡片] a[download]（军令文件名 KindredSouls-Style/Roadtrip-YYYYMMDD.png）
 *     ＋手机原生长按保存；
 * 🔴 军规红线：零 i18n 新键（LIFESTYLE_SLOT_UI 自容六语字典——军令 7 键
 *   对照表逐字录入；全站 123 基准不动）；fail-closed——非 style/roadtrip
 *   白名单 type 一律不渲染；零 CSS 文件改动（inline style）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useState } from 'react';
import { getLifestyleTemplate, LIFESTYLE_FILENAME } from '../../lib/lifestyleMuseData.mjs';
import { createLifestyleCanvas, renderLifestyleToCanvas, isLifestyleGoldenRatio } from '../../lib/lifestyleCanvasRenderer.mjs';

type Lang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';
export type LifestyleCardType = 'style' | 'roadtrip';

/** 插槽自容六语字典（军令钦定 7 键对照表——逐字录入） */
const LIFESTYLE_SLOT_UI: Record<Lang, { styleTitle: string; roadtripTitle: string; viewStyle: string; viewRoadtrip: string; auraColor: string; heading: string; save: string; close: string; renderFail: string }> = {
  zh: {
    styleTitle: '✦ 气场穿搭灵感笺 ✦',
    roadtripTitle: '✦ 漫游自驾避坑路书 ✦',
    viewStyle: '查看气场穿搭卡',
    viewRoadtrip: '查看漫游路书',
    auraColor: '能量主色',
    heading: '纳气吉方',
    save: '保存高清卡片',
    close: '关闭',
    renderFail: '卡片渲染失败，请稍后再试',
  },
  en: {
    styleTitle: '✦ Aura Style Capsule ✦',
    roadtripTitle: '✦ Soul Roadtrip Guide ✦',
    viewStyle: 'View Style Capsule',
    viewRoadtrip: 'View Roadtrip Guide',
    auraColor: 'Aura Palette',
    heading: 'Auspicious Heading',
    save: 'Save High-Res Card',
    close: 'Close',
    renderFail: 'Card rendering failed, please retry',
  },
  fr: {
    styleTitle: "✦ Capsule d'Aura & Style ✦",
    roadtripTitle: "✦ Guide d'Échappée & Sérénité ✦",
    viewStyle: 'Voir la Carte de Style',
    viewRoadtrip: 'Voir le Guide',
    auraColor: "Palette d'Aura",
    heading: 'Cap Énergétique',
    save: 'Enregistrer la Carte',
    close: 'Fermer',
    renderFail: 'Échec du rendu, veuillez réessayer',
  },
  es: {
    styleTitle: '✦ Cápsula de Estilo y Aura ✦',
    roadtripTitle: '✦ Hoja de Ruta de Escape del Alma ✦',
    viewStyle: 'Ver Cápsula de Estilo',
    viewRoadtrip: 'Ver Hoja de Ruta',
    auraColor: 'Paleta de Aura',
    heading: 'Rumbo Propicio',
    save: 'Guardar Tarjeta',
    close: 'Cerrar',
    renderFail: 'Fallo al renderizar, reintenta',
  },
  th: {
    styleTitle: '✦ สารนำทางสไตล์และพลังออร่า ✦',
    roadtripTitle: '✦ บันทึกการเดินทางเพื่อการเยียวยา ✦',
    viewStyle: 'ดูการ์ดสไตล์ออร่า',
    viewRoadtrip: 'ดูบันทึกการเดินทาง',
    auraColor: 'โทนสีพลังงาน',
    heading: 'ทิศทางมงคล',
    save: 'บันทึกการ์ดความละเอียดสูง',
    close: 'ปิด',
    renderFail: 'เรนเดอร์ไม่สำเร็จ โปรดลองอีกครั้ง',
  },
  vi: {
    styleTitle: '✦ Thẻ Cảm Hứng Trang Phục Khí Chất ✦',
    roadtripTitle: '✦ Cẩm Nang Du Ngoạn Chữa Lành ✦',
    viewStyle: 'Xem Thẻ Trang Phục',
    viewRoadtrip: 'Xem Cẩm Nang Du Ngoạn',
    auraColor: 'Bảng Màu Khí Chất',
    heading: 'Hướng Cát Khí',
    save: 'Lưu Thẻ Độ Phân Giải Cao',
    close: 'Đóng',
    renderFail: 'Kết xuất thất bại, vui lòng thử lại',
  },
};

/** fail-closed 白名单判别 */
function isLifestyleCardType(v: string): v is LifestyleCardType {
  return v === 'style' || v === 'roadtrip';
}

/** 军令文件名（KindredSouls-Style/Roadtrip-YYYYMMDD.png） */
function lifestyleFileName(type: LifestyleCardType): string {
  const prefix = LIFESTYLE_FILENAME[type] || LIFESTYLE_FILENAME.style;
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${prefix}${ymd}.png`;
}

/* ═══════════ 微缩生活卡插槽（360px 暗金胶囊）═══════════ */

export interface LifestyleMuseSlotCardProps {
  type: string;
  lang: string;
  onOpen: (type: LifestyleCardType) => void;
}

export const LifestyleMuseSlotCard: React.FC<LifestyleMuseSlotCardProps> = ({ type, lang, onOpen }) => {
  if (!isLifestyleCardType(type)) return null; // fail-closed：白名单外不渲染
  const l = (LIFESTYLE_SLOT_UI as Record<string, (typeof LIFESTYLE_SLOT_UI)['zh']>)[lang] || LIFESTYLE_SLOT_UI.en;
  const tpl = getLifestyleTemplate(type, (lang as Lang));
  if (!tpl) return null; // 模板缺失 fail-closed
  const isStyle = type === 'style';
  const title = isStyle ? l.styleTitle : l.roadtripTitle;
  const palette = isStyle ? (Array.isArray(tpl.palette) ? tpl.palette.slice(0, 3) : []) : [];
  const headingName = !isStyle && tpl.heading ? String(tpl.heading.name) : '';

  return (
    <div
      data-testid="lifestyle-muse-slot"
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
      {/* 左徽章：style ⇒ 三色盘小色块；roadtrip ⇒ 罗盘方位徽记 */}
      <div
        data-testid="lifestyle-slot-emblem"
        aria-hidden="true"
        style={{
          flexShrink: 0, width: 56, height: 84,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: 'linear-gradient(160deg, #191521, #0B0B0E)',
          border: '1px solid rgba(212,175,55,0.55)', borderRadius: 6,
          color: '#F3E5AB', textAlign: 'center',
        }}
      >
        {isStyle ? (
          palette.map((p, i) => (
            <span
              key={i}
              style={{ display: 'block', width: 30, height: 13, borderRadius: 3, background: p.hex, border: '1px solid rgba(255,255,255,0.25)' }}
            />
          ))
        ) : (
          <>
            <span style={{ fontSize: 16, letterSpacing: 1 }}>✧</span>
            <span style={{ fontSize: 9.5, color: 'rgba(212,188,122,0.8)', lineHeight: 1.4, padding: '0 3px' }}>{headingName.slice(0, 12)}</span>
          </>
        )}
      </div>
      {/* 中：卡片标题＋生活区标签 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, letterSpacing: 1.5, color: '#F3E5AB', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(212,188,122,0.8)', marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          ✧ {isStyle ? l.auraColor : l.heading}
        </div>
        <div style={{ fontSize: 9.5, color: 'rgba(159,199,232,0.65)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          ✧ {String(tpl.bestWindowPrefix || '')}: {String(tpl.defaultTiming || '')}
        </div>
      </div>
      {/* 右：金色 CTA 按钮（军令钦定句式） */}
      <button
        type="button"
        data-testid="lifestyle-slot-open"
        onClick={(e) => { e.stopPropagation(); onOpen(type); }}
        style={{
          flexShrink: 0, padding: '8px 12px', borderRadius: 999,
          background: 'linear-gradient(135deg, rgba(212,175,55,0.92), rgba(160,120,40,0.92))',
          border: '1px solid #D4AF37', color: '#141310',
          fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {isStyle ? l.viewStyle : l.viewRoadtrip}
      </button>
    </div>
  );
};

/* ═══════════ 全屏 Canvas 预览弹层（1080×1748 黄金比例）═══════════ */

export interface LifestylePreviewModalProps {
  type: string | null;
  lang: string;
  hostName?: string;
  onClose: () => void;
}

export const LifestylePreviewModal: React.FC<LifestylePreviewModalProps> = ({ type, lang, hostName, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [renderErr, setRenderErr] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setDataUrl(null); setRenderErr(false);
      if (!type || !isLifestyleCardType(type)) return; // fail-closed
      try {
        const tpl = getLifestyleTemplate(type, (lang as Lang));
        if (!tpl) throw new Error('template missing');
        const canvas = createLifestyleCanvas();
        await renderLifestyleToCanvas(canvas, tpl, lang, {
          type,
          ...(hostName ? { hostName } : {}),
        });
        if (!isLifestyleGoldenRatio(canvas)) throw new Error('golden ratio lock failed');
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

  if (!type || !isLifestyleCardType(type)) return null;
  const l = (LIFESTYLE_SLOT_UI as Record<string, (typeof LIFESTYLE_SLOT_UI)['zh']>)[lang] || LIFESTYLE_SLOT_UI.en;
  const tpl = getLifestyleTemplate(type, (lang as Lang));
  const stampName = tpl ? String(tpl.title || 'lifestyle') : 'lifestyle';
  const fileName = lifestyleFileName(type);

  return (
    <div
      role="dialog"
      aria-label={stampName}
      data-testid="lifestyle-preview-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9700,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
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
      {!dataUrl && !renderErr && (
        <div style={{ color: '#D4BC7A', fontSize: 13, letterSpacing: 2 }}>✦ …✦</div>
      )}
      {!dataUrl && renderErr && (
        <div style={{ color: 'rgba(232,217,168,0.75)', fontSize: 12.5, letterSpacing: 1 }}>{l.renderFail}</div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
        {dataUrl && (
          <a
            href={dataUrl}
            download={fileName}
            data-testid="lifestyle-preview-save"
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

export default LifestyleMuseSlotCard;
