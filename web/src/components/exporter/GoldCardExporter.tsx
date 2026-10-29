/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E105（主公军令 2026-10-30 刀二）：命盘金卡导出器（双端下载分流）
 * ═══════════════════════════════════════════════════════════════════════════
 * 移动端 WebKit 安全下载分流：
 *   · 桌面端（viewport > 768px）：canvas.toBlob → <a download> 本地落盘；
 *   · 移动端（≤768px）：唤起全屏黑金 Modal 展示 <img src="blob:..." />，
 *     提示「长按图片保存至相册」；弹层关闭强制 revokeObjectURL 释放显存。
 * 🔴 离线铁律：绘制与导出全程零 fetch/XHR（闸门 ④-2 断言锁定）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { drawGoldCard, goldCardToBlob } from '../../lib/drawGoldCard';
import type { GoldCardPayload } from '../../lib/drawGoldCard';

/** 六语文案（组件内联字典——App.tsx TXT 惯例，零 i18n 键数扰动） */
const L_EXPORT = {
  cta: {
    zh: '🏅 保存命盘金卡', en: '🏅 Save Gold Card', fr: '🏅 Enregistrer la Carte d\u2019Or',
    es: '🏅 Guardar Tarjeta Dorada', th: '🏅 บันทึกบัตรทองคำ', vi: '🏅 Lưu Thẻ Vàng',
  },
  forging: {
    zh: '正在铸造金卡…', en: 'Forging your gold card…', fr: 'Frappe de la carte en cours…',
    es: 'Forjando la tarjeta…', th: 'กำลังสร้างบัตร…', vi: 'Đang tạo thẻ vàng…',
  },
  longPress: {
    zh: '长按图片保存至相册', en: 'Long-press the image to save it', fr: 'Appui long sur l\u2019image pour enregistrer',
    es: 'Mantén pulsada la imagen para guardarla', th: 'กดค้างที่ภาพเพื่อบันทึกลงอัลบั้ม', vi: 'Nhấn giữ ảnh để lưu vào thư viện',
  },
  close: {
    zh: '关闭', en: 'Close', fr: 'Fermer', es: 'Cerrar', th: 'ปิด', vi: 'Đóng',
  },
};

export interface GoldCardExporterProps {
  locale: 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';
  payload: GoldCardPayload;
}

export default function GoldCardExporter({ locale, payload }: GoldCardExporterProps) {
  const [busy, setBusy] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    // 视口分流判定（军令：桌面 > 768px 直落盘；移动 ≤ 768px 弹层长按保存）
    const mq = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 768px)') : null;
    const apply = () => setIsMobile(!!(mq && mq.matches));
    apply();
    if (mq && typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
    return undefined;
  }, []);

  /** 弹层关闭 ⇒ 强制 revokeObjectURL 释放显存（军令逐字） */
  const closeModal = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    setBlobUrl(null);
  }, []);

  useEffect(() => () => {
    // 卸载兜底：组件离场也释放 blob URL
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
  }, []);

  const handleExport = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      await drawGoldCard(canvas, payload);
      const blob = await goldCardToBlob(canvas);
      if (isMobile) {
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        const url = URL.createObjectURL(blob);
        blobRef.current = url;
        setBlobUrl(url); // 全屏黑金 Modal：<img src="blob:..." />
      } else {
        // 桌面端：a download 本地落盘
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kindredsouls-goldcard-${payload.d1 || 'chart'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, isMobile, payload]);

  const t = (k: keyof typeof L_EXPORT) => (L_EXPORT[k][locale] || L_EXPORT[k].en);

  return (
    <div className="ks-goldcard-export" style={{ marginTop: '16px', textAlign: 'center' }}>
      <button
        type="button"
        data-testid="goldcard-export-cta"
        onClick={handleExport}
        disabled={busy}
        style={{
          padding: '12px 26px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.5)',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.16) 0%, rgba(184,134,11,0.12) 100%)',
          color: '#F5D08A', fontSize: '14px', fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
          minWidth: '200px', minHeight: '44px',
        }}
      >
        {busy ? t('forging') : t('cta')}
      </button>

      {blobUrl && isMobile && (
        /* 移动端全屏黑金 Modal（长按保存；关闭即 revokeObjectURL） */
        <div
          className="ks-goldcard-modal"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(8, 9, 12, 0.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <img
            src={blobUrl}
            alt="Cosmic Gold Card"
            style={{ maxWidth: '86vw', maxHeight: '70vh', borderRadius: '14px', border: '1px solid rgba(212,175,55,0.45)' }}
          />
          <p style={{ color: '#F3E5AB', fontSize: '14px', marginTop: '18px', textAlign: 'center' }}>
            {t('longPress')}
          </p>
          <button
            type="button"
            onClick={closeModal}
            style={{
              marginTop: '14px', padding: '10px 28px', borderRadius: '10px',
              border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)',
              color: '#D4AF37', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('close')}
          </button>
        </div>
      )}
    </div>
  );
}
