import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLegalTermsDoc } from '../i18n/legalTerms.mjs';

/**
 * ⚖️ E127-LEGAL-ROUTING-MODAL（主公军令 2026-11-08）· 刀三
 * 独立路由页（LegalDocumentViewer 职责）——/privacy-policy 与 /terms-of-service
 * 直达渲染（新标签页/书签/海外审查机构场景）。
 *
 * 军令铁律：
 *   - 直接访问 URL 时呈现完整条款正文＋「← 返回首页」导航——绝不回退空首页；
 *   - CSS `.policy-page` 已升 fixed inset-0 全屏覆盖（E127）——与首页文档流互斥，
 *     修复「条款堆叠在首页 hero 下方不可见」的视觉回退病灶；
 *   - 内容真源：web/src/i18n/legalTerms.ts（六语；原内嵌字典已抽离归仓）。
 */
interface PolicyPageProps {
  type: 'terms' | 'privacy';
  onBack: () => void;
}

const BACK_LABELS: Record<string, string> = {
  zh: '返回首页',
  en: 'Back to Home',
  es: 'Volver al inicio',
  fr: "Retour à l'accueil",
  th: 'กลับไปหน้าแรก',
  vi: 'Về trang chủ',
};

const PolicyPage: React.FC<PolicyPageProps> = ({ type, onBack }) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0] as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  const base = (lang || 'en').split('-')[0];
  const back = BACK_LABELS[base] || BACK_LABELS.en;
  const doc = getLegalTermsDoc(type, lang);

  if (!doc) return null; // 字典缺失 fail-closed

  return (
    <div className="page policy-page">
      <div className="policy-container">
        <button className="policy-back-btn" onClick={onBack}>
          ← {back}
        </button>
        <h1 className="policy-title">{doc.title}</h1>
        <p className="policy-date">{doc.lastUpdated}</p>
        <div className="policy-content">
          {doc.sections.map((sec, i) => (
            <React.Fragment key={i}>
              <h2>{sec.h}</h2>
              <p>{sec.p}</p>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
