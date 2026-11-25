import { useState } from 'react';
// @ts-ignore —— 纯 JS Canvas 核（E155 闸门守备）
import { happinessCardToBlob } from '../../lib/happinessCard.mjs';
// @ts-ignore —— 六语字典单源
import { resT } from '../../lib/resonanceI18n.mjs';

type Props = { payload: Record<string, unknown>; lang: string; fileStem?: string };

/** 坐标卡操作条：一键存图（移动端长按保存弹层 / 桌面下载）＋系统分享（支持文件则带图） */
export default function HappinessCardActions({ payload, lang, fileStem }: Props) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const render = async () => {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) await document.fonts.ready;
    const blob = await happinessCardToBlob(payload);
    return URL.createObjectURL(blob);
  };

  const onSave = async () => {
    setBusy(true); setErr(false);
    try {
      const url = await render();
      const a = document.createElement('a');
      a.href = url; a.download = `${fileStem || 'kindredsouls-card'}.png`; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      if (window.matchMedia('(max-width: 768px)').matches) {
        setDataUrl(url); // 移动端：展示大图供长按保存（下载属性在部分 WebView 失效）
      }
    } catch { setErr(true); } finally { setBusy(false); }
  };

  const onShare = async () => {
    setBusy(true); setErr(false);
    try {
      const url = await render();
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `${fileStem || 'kindredsouls-card'}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: String(payload.cardTitle || 'KindredSouls') });
        return;
      }
      if (nav.share) { await nav.share({ title: String(payload.cardTitle || 'KindredSouls'), url: String(payload.qrUrl || '') }); return; }
      setDataUrl(url);
    } catch { /* 用户取消分享＝非错误 */ } finally { setBusy(false); }
  };

  return (
    <div className="rs-card-actions" data-testid="rs-card-actions">
      <button className="rs-cta rs-cta--ghost" onClick={onSave} disabled={busy} data-testid="rs-card-save">{resT(lang, 'card_save')}</button>
      <button className="rs-cta rs-cta--ghost" onClick={onShare} disabled={busy} data-testid="rs-card-share">{resT(lang, 'card_share')}</button>
      {err && <p className="rs-error" role="alert">{resT(lang, 'err_generic')}</p>}
      {dataUrl && (
        <div className="rs-card-preview" role="dialog" aria-label="card preview" onClick={() => { URL.revokeObjectURL(dataUrl); setDataUrl(''); }}>
          <img src={dataUrl} alt="" data-testid="rs-card-preview-img" />
        </div>
      )}
    </div>
  );
}
