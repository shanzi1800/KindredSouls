import { useState } from 'react';
// @ts-ignore —— useCitySearch 为既有城市检索 hook（6.9MB 城市库懒加载）
import { useCitySearch } from '../../hooks/useCitySearch';
// @ts-ignore —— resonanceI18n.mjs 为纯 JS 字典（E155 单源）
import { resT } from '../../lib/resonanceI18n.mjs';

export type PersonDraft = {
  name: string;
  birthDate: string;
  birthTime: string;
  timeUnknown: boolean;
  city: string;
  lat: number | null;
  lon: number | null;
  tz: string;
};

export const emptyPerson = (): PersonDraft => ({ name: '', birthDate: '', birthTime: '', timeUnknown: true, city: '', lat: null, lon: null, tz: '' });

/** 草稿 ⇒ API 档案（未知时间 ⇒ birthTime ''，显式降级标记的真源） */
export function personDraftToProfile(d: PersonDraft) {
  const p: Record<string, unknown> = { birthDate: d.birthDate, birthTime: d.timeUnknown ? '' : d.birthTime };
  if (d.name.trim()) p.name = d.name.trim();
  if (d.city.trim()) p.city = d.city.trim();
  if (d.lat != null && d.lon != null) { p.lat = d.lat; p.lon = d.lon; }
  if (d.tz) p.tz = d.tz;
  return p;
}

type Props = {
  value: PersonDraft;
  onChange: (v: PersonDraft) => void;
  lang: string;
  label: string;
  namePlaceholder: string;
};

/** 单人生辰录入（日期 / 选填时间 / 城市；锁图标列固定 48px，右侧文案受控换行） */
export default function PersonBirthForm({ value, onChange, lang, label, namePlaceholder }: Props) {
  const { cities, loading, search } = useCitySearch();
  const [cityOpen, setCityOpen] = useState(false);
  const set = (patch: Partial<PersonDraft>) => onChange({ ...value, ...patch });
  const cityLabel = (c: { key: string; names?: { [k: string]: string } }) => (c.names && (c.names[lang] || c.names.en)) || c.key;

  return (
    <section className="rs-person" data-testid="rs-person">
      <h3 className="rs-person__label">{label}</h3>

      <label className="rs-field">
        <span className="rs-field__icon" aria-hidden="true">✦</span>
        <span className="rs-field__body">
          <span className="rs-field__title">{resT(lang, 'f_name')}</span>
          <input className="rs-input" value={value.name} maxLength={40} placeholder={namePlaceholder}
            onChange={(e) => set({ name: e.target.value })} />
        </span>
      </label>

      <label className="rs-field">
        <span className="rs-field__icon" aria-hidden="true">📅</span>
        <span className="rs-field__body">
          <span className="rs-field__title">{resT(lang, 'f_birth_date')}</span>
          <input className="rs-input" type="date" value={value.birthDate} data-testid="rs-birth-date"
            onChange={(e) => set({ birthDate: e.target.value })} />
        </span>
      </label>

      <div className="rs-field">
        <span className="rs-field__icon" aria-hidden="true">🕐</span>
        <div className="rs-field__body">
          <span className="rs-field__title">{resT(lang, 'f_birth_time')}</span>
          <div className="rs-row">
            <input className="rs-input rs-input--time" type="time" value={value.timeUnknown ? '' : value.birthTime} disabled={value.timeUnknown}
              onChange={(e) => set({ birthTime: e.target.value })} />
            <label className="rs-check">
              <input type="checkbox" checked={value.timeUnknown} data-testid="rs-time-unknown"
                onChange={(e) => set({ timeUnknown: e.target.checked, birthTime: e.target.checked ? '' : value.birthTime })} />
              <span>{resT(lang, 'f_time_unknown')}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="rs-field">
        <span className="rs-field__icon" aria-hidden="true">📍</span>
        <div className="rs-field__body">
          <span className="rs-field__title">{resT(lang, 'f_city')}</span>
          <input className="rs-input" value={value.city} placeholder={resT(lang, 'f_city_ph')} autoComplete="off"
            onChange={(e) => { set({ city: e.target.value, lat: null, lon: null, tz: '' }); setCityOpen(true); search(e.target.value); }} />
          {cityOpen && value.city.trim() && (
            <ul className="rs-city-list" role="listbox">
              {loading && <li className="rs-city-list__hint">…</li>}
              {cities.slice(0, 6).map((c) => (
                <li key={c.key} role="option" aria-selected={false}
                  onClick={() => { set({ city: cityLabel(c), lat: c.lat, lon: c.lon, tz: c.tz }); setCityOpen(false); }}>
                  {cityLabel(c)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="rs-degrade-note">{resT(lang, 'degrade_note')}</p>
    </section>
  );
}
