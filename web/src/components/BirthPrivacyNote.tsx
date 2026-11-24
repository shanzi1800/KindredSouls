import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 🆕 E151-刀三（军令 2026-11-24）：生辰数据最小化信任护栏——
 *   ① 生辰输入表单下方的六语极简隐私承诺小字（input.privacyNote）；
 *   ② 「一键清除我的生辰坐标与本地档案」入口（input.clearDataBtn）＋
 *      二次轻量确认（input.clearDataConfirm——两击形制，避免浏览器原生
 *      confirm 阻断弹窗的廉价感）。
 *   清除范围＝本地存储 ks_ 前缀与 soul_ 前缀全族（生辰坐标、灵宠档、会话记忆、
 *   当日情绪档、星轨日志）；**不触碰 sb- 认证会话**（登录态不连带抹除，
 *   未登录新客流程零破坏）。清除后整页 reload 回纯净新客态。
 *   挂载位：姻缘双星卡表单（App.tsx）＋财富生辰表单（WealthPage）。
 */
export default function BirthPrivacyNote() {
  const { t } = useTranslation();
  const [armed, setArmed] = useState(false);

  const wipeLocalArchives = () => {
    try {
      const wipe = (store: Storage | null) => {
        if (!store || typeof store.removeItem !== 'function') return;
        const kill: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && (k.startsWith('ks_') || k.startsWith('soul_'))) kill.push(k);
        }
        kill.forEach((k) => store.removeItem(k));
      };
      wipe(window.localStorage);
      wipe(window.sessionStorage);
    } catch { /* 隐私模式/受限 storage ⇒ fail-soft 静默 */ }
    window.location.reload();
  };

  return (
    <div
      data-testid="birth-privacy-note"
      style={{
        marginTop: '10px',
        fontSize: '11px',
        color: 'rgba(232, 220, 192, 0.62)',
        textAlign: 'center',
        lineHeight: 1.6,
        maxWidth: '420px',
        margin: '10px auto 0',
      }}
    >
      <p style={{ margin: 0 }}>🔒 {t('input.privacyNote')}</p>
      <div style={{ marginTop: '6px', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          data-testid="birth-clear-data"
          onClick={() => (armed ? wipeLocalArchives() : setArmed(true))}
          style={{
            background: armed ? 'rgba(212,175,55,0.14)' : 'transparent',
            border: `1px solid ${armed ? 'rgba(224,92,92,0.55)' : 'rgba(212,175,55,0.3)'}`,
            borderRadius: 999,
            padding: '4px 14px',
            fontSize: '11px',
            color: armed ? '#E8CFC0' : 'rgba(240,208,96,0.82)',
            cursor: 'pointer',
            transition: 'all .18s ease',
          }}
        >
          {armed ? `⚠ ${t('input.clearDataConfirm')}` : `🧹 ${t('input.clearDataBtn')}`}
        </button>
        {armed && (
          <button
            type="button"
            data-testid="birth-clear-cancel"
            onClick={() => setArmed(false)}
            aria-label={t('input.back')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: '11px',
              color: 'rgba(232,220,192,0.66)',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
