import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface LangModalProps {
  open: boolean;
  onClose: () => void;
}

const LANG_LIST = [
  { code: 'en', label: 'English',       flag: '🇺🇸' },
  { code: 'zh', label: '简体中文',     flag: '🇨🇳' },
  { code: 'es', label: 'Español',      flag: '🇪🇸' },
  { code: 'fr', label: 'Français',     flag: '🇫🇷' },
  { code: 'th', label: 'ไทย',          flag: '🇹🇭' },
  { code: 'vi', label: 'Tiếng Việt',   flag: '🇻🇳' },
];

export default function LangModal({ open, onClose }: LangModalProps) {
  const { i18n } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    onClose();
  };

  if (!open) return null;

  const current = (i18n.language || 'en').split('-')[0];

  return (
    <div className="lang-modal-backdrop" onClick={handleBackdrop}>
      <div className="lang-modal" ref={modalRef}>
        <button className="lang-modal-close" onClick={onClose}>✕</button>
        <div className="lang-modal-title">{i18n.language === 'zh' ? '选择语言' : i18n.language === 'es' ? 'Seleccionar idioma' : i18n.language === 'fr' ? 'Choisir la langue' : i18n.language === 'th' ? 'เลือกภาษา' : i18n.language === 'vi' ? 'Chọn ngôn ngữ' : 'Select Language'}</div>
        {LANG_LIST.map(({ code, label, flag }) => (
          <button
            key={code}
            className={`lang-modal-option${current === code ? ' lang-modal-option-active' : ''}`}
            onClick={() => handleSelect(code)}
          >
            <span className="lang-modal-flag">{flag}</span>
            <span className="lang-modal-label">{label}</span>
            {current === code && <span className="lang-modal-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
