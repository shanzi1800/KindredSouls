import { useEffect, useState } from 'react';
// @ts-ignore —— 纯 JS Canvas 核
import { happinessCardToBlob } from '../lib/happinessCard.mjs';
// @ts-ignore —— 六语字典单源
import { resT } from '../lib/resonanceI18n.mjs';
import '../styles/happiness-card.css';

type Props = {
  payload: Record<string, unknown>;
  lang: string;
  fileStem?: string;
  /** 嵌入位标识（真页验收用）：result | wealth */
  mount?: 'result' | 'wealth';
};

const MOBILE_QUERY = '(max-width: 768px)';
/** 六语自容：移动端长按浮层提示（与 GoldCardExporter 同文） */
const L_LONG_PRESS: Record<string, string> = {
  zh: '长按图片保存至相册', en: 'Long-press the image to save it', fr: 'Appui long sur l\u2019image pour enregistrer',
  es: 'Mantén pulsada la imagen para guardarla', th: 'กดค้างที่ภาพเพื่อบันทึกลงอัลบั้ม', vi: 'Nhấn giữ ảnh để lưu vào thư viện',
};

/**
 * 幸福坐标卡嵌入块（E156）：预览缩略 ＋ 单一「保存 / 分享」按钮（财富页）。
 *   ✦ E158-刀三（主公军令 2026-11-26）：/result 挂载位预览框正下方的重复按钮退役（与下方
 *   合规声明后的「保存 / 分享幸福坐标卡」二选一重复）⇒ mount === 'result' 只留预览；
 *   财富页（mount === 'wealth'）保留唯一主按钮，文案同字典 btn_save_share_card。
 *   · 移动端且系统分享支持文件 ⇒ 直接唤起系统分享（带高清 PNG）。
 *   · 其余 ⇒ 下载高清 PNG；移动端另开大图浮层供长按保存（部分 WebView 下载属性失效）。
 *   🔴 零 window.open、零独立对话窗。
 */
export default function HappinessCard({ payload, lang, fileStem, mount = 'result' }: Props) {
  const [preview, setPreview] = useState<string>('');
  const [layer, setLayer] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const L = String(lang || 'zh').split('-')[0];
  // ✦ E158-刀三：result 挂载位不渲染保存按钮（唯一按钮＝合规声明下方「保存 / 分享幸福坐标卡」）
  const showSave = mount !== 'result';

  useEffect(() => {
    let alive = true;
    let url = '';
    (async () => {
      try {
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) await document.fonts.ready;
        const blob = await happinessCardToBlob(payload);
        url = URL.createObjectURL(blob);
        if (alive) setPreview(url);
      } catch { /* 预览失败不阻断按钮（点击时再渲染） */ }
    })();
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [payload]);

  const render = async () => {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) await document.fonts.ready;
    const blob = await happinessCardToBlob(payload);
    if (!blob || blob.size < 1024) throw new Error('empty_png');
    return URL.createObjectURL(blob);
  };

  const onSave = async () => {
    setBusy(true); setErr(false);
    let url = '';
    try {
      url = await render();
      const isMobile = typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;
      const nav = (typeof navigator !== 'undefined' ? navigator : {}) as Navigator & { canShare?: (d?: ShareData) => boolean };
      if (isMobile && nav.share && nav.canShare) {
        const res = await fetch(url);
        const file = new File([await res.blob()], `${fileStem || 'kindredsouls-card'}.png`, { type: 'image/png' });
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: String(payload.cardTitle || 'KindredSouls') });
          URL.revokeObjectURL(url);
          return;
        }
      }
      const a = document.createElement('a');
      a.href = url; a.download = `${fileStem || 'kindredsouls-card'}.png`; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      if (isMobile) { setLayer(url); return; } // 浮层接管回收
    } catch (e) { setErr(true); if (url) URL.revokeObjectURL(url); } finally { setBusy(false); }
  };

  const closeLayer = () => { if (layer) URL.revokeObjectURL(layer); setLayer(''); };

  return (
    <div className="ks-hcard" lang={L} data-testid={`ks-hcard-${mount}`} data-scene={String(payload.theme || '')}>
      <div className="ks-hcard-head">✦ {resT(L, 'card_preview_title')}</div>
      <div className={`ks-hcard-preview${preview ? '' : ' ks-hcard-preview--pending'}`} data-testid="ks-hcard-preview" style={{ backgroundColor: '#05050A' }}>
        {preview ? <img src={preview} alt={resT(L, 'card_preview_title')} data-testid="ks-hcard-preview-img" /> : '…'}
      </div>
      {showSave && <button className="ks-hcard-btn" onClick={onSave} disabled={busy} data-testid="ks-hcard-save">{busy ? '…' : resT(L, 'btn_save_share_card')}</button>}
      {err && <p className="ks-hcard-err" role="alert">{resT(L, 'err_generic')}</p>}
      {layer && (
        <div className="ks-hcard-layer" role="dialog" aria-label="card preview" onClick={closeLayer}>
          <img src={layer} alt="" data-testid="ks-hcard-layer-img" />
          <p className="ks-hcard-layer-hint">{L_LONG_PRESS[L] || L_LONG_PRESS.en}</p>
        </div>
      )}
    </div>
  );
}
