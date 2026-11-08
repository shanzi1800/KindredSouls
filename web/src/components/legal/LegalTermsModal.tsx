import React, { useEffect } from 'react';
import { getLegalTermsDoc } from '../../i18n/legalTerms.mjs';

/**
 * ⚖️ E127-LEGAL-ROUTING-MODAL（主公军令 2026-11-08）· 刀二
 * 表单原位法律条款弹窗——生日/财富录入页点击「服务条款/隐私政策」零跳出查阅。
 *
 * 军令铁律：
 *   - 遮罩 z-[150]（浮于输入表单与 Slogan 之上）＋毛玻璃暗色底；
 *   - 暗金边框卡容器；原生滚动容器；右上角常驻 ✕；底部常驻「我已阅读并知悉」暗金按钮；
 *   - Esc 关闭（沿 E123 ✕/Esc 双关先例）；
 *   - 关闭后页面不刷新不跳转——已填数据 100% 留存（组件树零卸载，仅遮罩摘除）。
 * 内容真源：web/src/i18n/legalTerms.ts（六语）。
 */
interface LegalTermsModalProps {
  type: 'terms' | 'privacy';
  lang: string;
  onClose: () => void;
}

const ACK_LABELS: Record<string, string> = {
  zh: '我已阅读并知悉',
  en: 'I have read and acknowledged',
  es: 'He leído y acepto',
  fr: "J'ai lu et pris connaissance",
  th: 'ฉันได้อ่านและรับทราบแล้ว',
  vi: 'Tôi đã đọc và ghi nhận',
};

const LegalTermsModal: React.FC<LegalTermsModalProps> = ({ type, lang, onClose }) => {
  const doc = getLegalTermsDoc(type, lang);
  const base = (lang || 'en').split('-')[0];
  const ack = ACK_LABELS[base] || ACK_LABELS.en;

  // Esc 关闭（E123 ✕/Esc 双关先例）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!doc) return null; // 字典缺失 fail-closed——绝不渲染空壳

  return (
    <div
      className="ks-legal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      <div className="ks-legal-modal" onClick={e => e.stopPropagation()}>
        <button
          className="ks-legal-close"
          onClick={onClose}
          aria-label="Close legal terms"
          type="button"
        >
          ✕
        </button>
        <h2 className="ks-legal-title">{doc.title}</h2>
        <p className="ks-legal-date">{doc.lastUpdated}</p>
        <div className="ks-legal-scroll">
          {doc.sections.map((sec, i) => (
            <div key={i} className="ks-legal-section">
              <h3 className="ks-legal-h">{sec.h}</h3>
              <p className="ks-legal-p">{sec.p}</p>
            </div>
          ))}
        </div>
        <button
          className="ks-legal-ack"
          onClick={onClose}
          type="button"
        >
          {ack}
        </button>
      </div>
    </div>
  );
};

export default LegalTermsModal;
