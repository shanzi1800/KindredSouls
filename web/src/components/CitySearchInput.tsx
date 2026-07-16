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

const LANG_LABEL: Record<string, string> = {
  'zh': '城市', 'vi': 'Thành phố', 'es': 'Ciudad', 'fr': 'Ville', 'th': 'เมือง', 'en': 'City'
};

export const CitySearchInput: React.FC<CitySearchInputProps> = ({
  value, tz, lat, lon, onSelect, lang = 'zh', placeholder
}) => {
  const { loading, search } = useCitySearch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const ph = placeholder || (lang === 'zh' ? '搜索城市...' : lang === 'vi' ? 'Tìm thành phố...' : 'Search city...');

  useEffect(() => {
    if (value) setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
    setQuery(city.key);
    setOpen(false);
    setResults([]);
    onSelect(city);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); handleSelect(results[highlighted]); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ marginBottom: '4px' }}>
        <label style={{ fontSize: '10px', color: '#D4AF37', display: 'block', marginBottom: '3px' }}>
          🏙 {LANG_LABEL[lang] || 'City'}
          {loading && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}> (加载中...)</span>}
        </label>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.trim().length >= 1 && results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={ph}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '7px 10px',
            background: 'rgba(255,255,255,0.08)',
            border: open ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(212,175,55,0.25)',
            borderRadius: '6px',
            color: '#D4AF37',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0, right: 0,
          zIndex: 1000,
          background: '#0D0D1A',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: '8px',
          marginTop: '2px',
          maxHeight: '260px',
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          {results.map((city, i) => (
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
                <div style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 500 }}>{city.key}</div>
                {city.search && city.search.length > 1 && (
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                    {city.search.slice(1, 3).join(' · ')}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                <div>{city.tz.split('/').pop()?.replace('_', ' ')}</div>
                <div>{city.lat.toFixed(2)}°, {city.lon > 0 ? 'E' : 'W'}{Math.abs(city.lon).toFixed(2)}°</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {value && !open && (
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', paddingLeft: '2px' }}>
          {tz.split('/').pop()?.replace('_', ' ')} · {lat.toFixed(2)}° {lon > 0 ? 'E' : 'W'}{Math.abs(lon).toFixed(2)}°
          {query !== value && <span style={{ color: 'rgba(212,175,55,0.6)' }}> ← {value}</span>}
        </div>
      )}
    </div>
  );
};
