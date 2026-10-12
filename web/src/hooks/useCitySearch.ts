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
    // 🛡️ E42+ 45-D2 先锋战：城市库 URL 携带**内容指纹**。
    //   服务端对 /data/cities.json 下发 `Cache-Control: public, max-age=31536000, immutable`
    //   （6.63MB→616KB brotli 预压缩，强缓存后二次访问零字节）。
    //   immutable 必须配内容指纹 URL：内容变 ⇒ 指纹变 ⇒ URL 变 ⇒ 自动穿透旧缓存，
    //   否则升级城市库后老用户会被一年缓存永久钉死在旧数据上。
    //   ⚠️ `__CITIES_VERSION__` 由 vite define 注入；非 Vite 环境取 'dev'（绝不裸用，防 ReferenceError）。
    const _ver = (typeof __CITIES_VERSION__ === 'string' && __CITIES_VERSION__) ? __CITIES_VERSION__ : 'dev';
    const url_json = `/data/cities.json?v=${encodeURIComponent(_ver)}`;
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

  const search = useCallback((query: string, limit = 8, lang: string = 'en'): CityRecord[] => {
    const q = query.trim();
    if (!q || cities.length === 0) return [];
    const results: FuseResult[] = [];
    for (const city of cities) {
      // 🛠️ V117h: 查 search 数组（所有语种别名）+ names[lang] 当前语种本地名
      // 原因：search 数组只在 57 个 Top 城市含中文，其余 31947 个只有 names.zh，拼音能查 search，中文需查 names
      const candidates: string[] = [...(city.search || [])];
      if (city.names) {
        for (const ln of ['zh', 'en', 'vi', 'es', 'fr', 'th']) {
          const n = city.names[ln];
          if (n) candidates.push(n);
        }
      }
      const matched = candidates.some(s => fuzzyMatch(s, q));
      if (matched) {
        results.push({ item: city });
        if (results.length >= limit * 3) break;
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
