import React, { useState, useRef, useEffect } from 'react';
import { useCitySearch } from '../hooks/useCitySearch';
import type { CityRecord } from '../hooks/useCitySearch';

interface CitySearchInputProps {
  value: string;           // 当前选中的城市 key（英文名）
  tz: string;
  lat: number;
  lon: number;
  onSelect: (city: CityRecord) => void;
  lang?: string;
  placeholder?: string;
}

// 6 语种完整占位符
const PLACEHOLDER: Record<string, string> = {
  zh: '搜索城市…',
  en: 'Search city…',
  vi: 'Tìm thành phố…',
  es: 'Buscar ciudad…',
  fr: 'Rechercher une ville…',
  th: 'ค้นหาเมือง…',
};

// 6 语种标签
const LANG_LABEL: Record<string, string> = {
  zh: '城市',
  en: 'City',
  vi: 'Thành phố',
  es: 'Ciudad',
  fr: 'Ville',
  th: 'เมือง',
};

// 取城市在当前语种的显示名（带回退）
function getDisplayName(city: CityRecord, lang: string): string {
  if (city.names && city.names[lang]) return city.names[lang];
  if (city.names && city.names.en) return city.names.en;
  return city.key;
}

export const CitySearchInput: React.FC<CitySearchInputProps> = ({
  value, tz, lat, lon, onSelect, lang = 'zh', placeholder,
}) => {
  const { loading, search } = useCitySearch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ph = placeholder || PLACEHOLDER[lang] || PLACEHOLDER.en;

  // 加载时显示当前值（用语种名）
  useEffect(() => {
    if (value) setQuery(value);
  }, [value]);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setHighlighted(0);
    if (q.trim().length >= 1) {
      const r = search(q, 8);
      setResults(r);
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  };

  const handleSelect = (city: CityRecord) => {
    setQuery(getDisplayName(city, lang));
    setOpen(false);
    setResults([]);
    onSelect(city);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); handleSelect(results[highlighted]); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* 🛠️ V117c: 单个带边框容器，搜索输入 + 选中后坐标/时区 都在内部 */}
      <div style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.08)',
        border: open ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(212,175,55,0.3)',
        borderRadius: '10px',
        padding: '5px 14px',  // 上下缩小 3px（约 0.5mm），更紧凑
        transition: 'border-color 0.15s',
      }}>
        {/* 🔍 搜索图标 */}
        <span style={{
          position: 'absolute',
          left: '10px',
          top: '10px',
          color: '#D4AF37',
          fontSize: '12px',
          pointerEvents: 'none',
        }}>🔍</span>

        {/* 搜索输入框 - 透明无边框，镶在容器内 */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.trim().length >= 1 && results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={ph}
          autoComplete="off"
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: '#D4AF37',
            fontSize: '15px',
            textAlign: 'center',
            outline: 'none',
            padding: 0,
            margin: 0,
            boxSizing: 'border-box',
            lineHeight: '22px',
          }}
        />

        {/* 选中后显示的坐标+时区 - 放在输入框下方的同一容器内（恢复 IANA 时区） */}
        {value && (
          <div style={{
            fontSize: '11px',
            fontFamily: '"Roboto Mono", "Fira Code", "SF Mono", Menlo, Consolas, monospace',
            color: 'rgba(255,255,255,0.45)',
            marginTop: '3px',
            lineHeight: '14px',
            letterSpacing: '0.3px',
            textAlign: 'center',
            animation: 'hudFadeIn 0.35s ease-out',
          }}>
            📍 {Math.abs(lat).toFixed(1)}° {lat >= 0 ? 'N' : 'S'}, {Math.abs(lon).toFixed(1)}° {lon >= 0 ? 'E' : 'W'}
            {'  |  '}
            🌐 {tz}
          </div>
        )}
      </div>

      {/* 搜索结果下拉 */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#0D0D1A',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: '8px',
          marginTop: '2px',
          maxHeight: '260px',
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          {results.map((city, i) => {
            const displayName = getDisplayName(city, lang);
            // 显示其它 2 种语种作为副标题
            const otherLangs = ['en', 'zh', 'vi', 'es', 'fr', 'th']
              .filter(l => l !== lang)
              .slice(0, 2);
            const subs = otherLangs
              .map(l => city.names?.[l])
              .filter(Boolean)
              .filter((v, idx, arr) => arr.indexOf(v) === idx);
            return (
              <div
                key={city.key}
                onClick={() => handleSelect(city)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: i === highlighted ? 'rgba(212,175,55,0.15)' : 'transparent',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 500 }}>
                    {displayName}
                  </div>
                  {subs.length > 0 && (
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                      {subs.join(' · ')}
                    </div>
                  )}
                </div>
                {/* 右侧不显示技术信息（时区/坐标对用户选城市无用，去掉） */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
