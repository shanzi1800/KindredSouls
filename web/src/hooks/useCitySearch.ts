import { useState, useEffect, useRef, useCallback } from 'react';

export interface CityRecord {
  key: string;
  search: string[];  // 保留兼容：英文名 + 所有语言本地名（用于模糊搜索）
  names?: { [lang: string]: string };  // 多语种名映射 { en, zh, vi, es, fr, th }
  lat: number;
  lon: number;
  tz: string;        // IANA timezone
}

interface FuseResult {
  item: CityRecord;
  score?: number;
}

// 轻量 fuse 实现（手写，无外部依赖）
function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  // 前缀优先
  if (t.startsWith(q)) return true;
  // 包含
  if (t.includes(q)) return true;
  // 逐字模糊
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi >= q.length * 0.7; // 70% 匹配即过
}

export function useCitySearch() {
  const [cities, setCities] = useState<CityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<CityRecord[] | null>(null);

  useEffect(() => {
    if (cacheRef.current) { setCities(cacheRef.current); setLoading(false); return; }
    const url_json = '/data/cities.json';
    fetch(url_json)
      .then(r => r.text())
      .then(text => {
        const data = JSON.parse(text);
        const arr: CityRecord[] = data.fuse_index || data.cities || [];
        cacheRef.current = arr;
        setCities(arr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const search = useCallback((query: string, limit = 8): CityRecord[] => {
    const q = query.trim();
    if (!q || cities.length === 0) return [];
    const results: FuseResult[] = [];
    for (const city of cities) {
      const matched = city.search.some(s => fuzzyMatch(s, q));
      if (matched) {
        results.push({ item: city });
        if (results.length >= limit * 3) break; // 预取足够多
      }
    }
    // 排序：key 完全匹配优先，再前缀，再包含
    results.sort((a, b) => {
      const ak = a.item.key.toLowerCase();
      const bk = b.item.key.toLowerCase();
      const q2 = q.toLowerCase();
      if (ak === q2) return -1;
      if (bk === q2) return 1;
      if (ak.startsWith(q2)) return -1;
      if (bk.startsWith(q2)) return 1;
      if (ak.includes(q2)) return -1;
      if (bk.includes(q2)) return 1;
      return 0;
    });
    return results.slice(0, limit).map(r => r.item);
  }, [cities]);

  return { cities, loading, search };
}
