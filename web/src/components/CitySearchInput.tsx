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

  const currentCity = value ? { key: value, tz, lat, lon } : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* 城市搜索框（不再加多余的金色“城市”徽标，外层“出生城市（可选）”已够用） */}
      <div style={{ marginBottom: '4px', position: 'relative' }}>
        <span style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#D4AF37',
          fontSize: '12px',
          pointerEvents: 'none',
        }}>🔍</span>
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
            padding: '7px 10px 7px 28px',
            background: 'rgba(255,255,255,0.08)',
            border: open ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(212,175,55,0.25)',
            borderRadius: '6px',
            color: '#D4AF37',
            fontSize: '12px',
            textAlign: 'left',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
        />
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
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                  <div>{city.tz.split('/').pop()?.replace(/_/g, ' ')}</div>
                  <div>{city.lat.toFixed(2)}°, {city.lon.toFixed(2)}°</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 当前选中信息（紧凑展示） */}
      {currentCity && !open && (
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', paddingLeft: '2px' }}>
          {currentCity.tz.split('/').pop()?.replace(/_/g, ' ')} · {currentCity.lat.toFixed(2)}° {currentCity.lon > 0 ? 'E' : 'W'}{Math.abs(currentCity.lon).toFixed(2)}°
          {query !== currentCity.key && <span style={{ color: 'rgba(212,175,55,0.6)' }}> ← {currentCity.key}</span>}
        </div>
      )}
    </div>
  );
};
