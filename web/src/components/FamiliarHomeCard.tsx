/**
 * FamiliarHomeCard.tsx —— 灵宠首页「破框骑键」宿主（E53 净化版 · 主公亲令 2026-10-15）
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 E53-1 首页净化铁律（主公钦定白名单）：首页只允许保留
 *    星空背景 ＋ 缘分天定 ＋ 趴在「开始测算」按钮上的灵宠 ＋ 极简切换语言。
 *    ⇒ ① E46 时代的「未认领折叠条 / 生辰认领表单」整体拔除（认领全链路收归
 *      报告页付费流：付费墙 FamiliarPicker ＋ 报告尾 AdoptFamiliarCTA）；
 *    ⇒ ② 「换一位伙伴」（↺ 重置浮钮）扫地出门 —— 更换灵宠属 $99.99 高阶灵契
 *      特权（见下方商业锚点契约），首页不再提供任何更换入口；
 *    ⇒ ③ 本组件在「未认领」时渲染空壳（零网络 / 零挂件），有档且有权益才呈现灵宠。
 *
 * 🔴 E53-2 商业锚点契约（本期仅预留架构，不接支付）：
 *    - $4.99 首次解锁报告 ⇒ 免费契约认领 1 只灵宠入驻首页（现状，唯一通路＝报告页）；
 *    - FAMILIAR_DUAL_PRICE_USD = $99.99 ⇒「Milo ＋ Sophia 双宠齐聚骑键」高阶灵契
 *      （未来实现：支付成功 ⇒ 权益位 familiar_dual ⇒ 第二档灵宠写入 ⇒ 本组件
 *      recs 数组天然容纳两条 HomeRecord，破框骑键层双宠同台：Milo 左 / Sophia 右，
 *      CSS 定位已按 IP 自洽，无需新增样式）。
 *
 * 🔴 沿袭铁律（E48/E49/E50/E51/E52，一概不放松）：
 *    - E50 门禁 fail-closed：paidOk !== true（判定中 / 查库失败）一律不呈现；
 *    - E49 按盘隔离：认领档必带 chartSig，URL ?reset=1 自洁，签名不匹配即弃即清；
 *    - E51/E52 破框骑键：外层 pointer-events:none 物理穿透，仅头部/宝石命中区可点；
 *      眨眼帧 ＋ 独立尾层蠕动 ＋ 巡视动画（CSS 真值见 App.css E52 区）；
 *    - 沙箱态保留 🧪 一键重置（live 态零呈现，测试基建不属「挂件」）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FAMILIAR_LS_KEY, type FamiliarProfile } from './FamiliarPicker';
import { supabase } from '../lib/supabase';
// 🐾 E51：主公钦定原画切片（macOS Vision 主体提取 + Alpha 透明 WebP，几何真值见 /tmp/e51_assets/out/geometry.json）
// 🐾 E52（主公亲令 2026-10-15）：本体已擦尾（尾层独立可摆）＋ 眨眼帧（毛色环形取样盖眼＋闭眼弧）；
//   Sophia 本体经脸型收窄 warp（y0=0.92 → y320=1.0，对齐 Milo 头身比）
// 🐾 E53-3（主公亲令 2026-10-15）：Sophia 鼻/吻线/晶簇咬合角对齐 Milo 同源雕琢
//   ＋ 头部及耳后「深曜紫玉矿石外壳」（加工真源 /tmp/e53_assets/e53_process.py）
import miloSprite from '../assets/familiar_milo.webp';
import sophiaSprite from '../assets/familiar_sophia.webp';
import miloTail from '../assets/familiar_milo_tail.webp';
import miloBlink from '../assets/familiar_milo_blink.webp';
import sophiaTail from '../assets/familiar_sophia_tail.webp';
import sophiaBlink from '../assets/familiar_sophia_blink.webp';
// @ts-ignore —— familiarHome.mjs 为纯 JS 逻辑核（形状由 E46 灵宠首页闸门守备）
import { FAMILIAR_HOME_TESTID, readFamiliarRecord, clearFamiliarRecord, whisperIndex, localDateKey, extractBirthTruth, recordMatchesChart } from '../lib/familiarHome.mjs';

const WHISPER_COUNT = 5;

const SAFE: React.CSSProperties = { overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 };

/** 💎 E53-2 商业锚点：$99.99「双宠齐聚」高阶灵契（本期仅常量入列，支付链路后续接） */
export const FAMILIAR_DUAL_PRICE_USD = 99.99;
/** 💎 E53-2 双宠特权 SKU（未来 Stripe price / 权益位 familiar_dual 的契约名） */
export const FAMILIAR_DUAL_SKU = 'familiar_dual_unlock';
/** 💎 E53-2 首页骑键位上限：1 只（$4.99 免费契约）→ 2 只（$99.99 双宠齐聚） */
export const FAMILIAR_MAX_HOME_SLOTS = 2;

/** 🐾 E51：relation_mode ⇒ IP（与服务端 familiar_engine.IP_OF 同源白名单） */
const IP_OF_MODE: Record<string, 'Sophia' | 'Milo'> = {
  girlfriend: 'Sophia', bestie: 'Sophia', buddy: 'Milo', boyfriend: 'Milo',
};

interface HomeRecord {
  profile: FamiliarProfile;
  triad: Record<string, unknown> | null;
  persisted: boolean;
  adoptedAt: string;
  /** 🔒 E49: 星盘签名（birthDate|birthTime|lat|lon|tz 归一）—— 按盘隔离 */
  chartSig?: string;
}

const FamiliarHomeCard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = String((i18n.language || 'zh').split('-')[0] || 'zh');

  const [rec, setRec] = useState<HomeRecord | null>(null);

  /* 🔒 E48（沿袭）: 呈现门禁 —— paidOk 三态：true=放行 / false=拦截 / null=判定中（fail-closed 同拦截） */
  const [paidOk, setPaidOk] = useState<boolean | null>(null);

  /* 🔒 E48: 权益自检（与 WealthReportPage::isWealthPaid 同源谓词，简化版同语义） */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        // 💳 E50: 绿道去粘性 —— 只认当前 URL 显式 free_access=1（同 WealthReportPage E50 整改）
        if (params.get('free_access') === '1') {
          if (alive) setPaidOk(true);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { if (alive) setPaidOk(false); return; }
        const { data: profiles, error: dbErr } = await supabase
          .from('user_profiles')
          .select('paid_plans')
          .eq('user_id', session.user.id)
          .limit(1);
        if (dbErr) { if (alive) setPaidOk(false); return; }
        const raw = profiles?.[0]?.paid_plans;
        const planMap: Record<string, any> = {};
        if (Array.isArray(raw)) {
          for (const p of raw) {
            if (typeof p === 'string') planMap[p] = true;
            else if (p && typeof p === 'object' && p.plan) planMap[p.plan] = p;
          }
        } else if (raw && typeof raw === 'object') {
          Object.assign(planMap, raw);
        }
        const now = Date.now();
        let ok = planMap.wealth_once === true
          || planMap.wealth_monthly_report === true
          || planMap.wealth_yearly_report === true;
        if (!ok && planMap.all_pass_yearly) {
          const ap = planMap.all_pass_yearly;
          const exp = (ap && (ap.expires_at || ap.all_pass_expires_at)) || planMap.all_pass_expires_at;
          ok = !exp || new Date(exp).getTime() > now;
        }
        if (!ok && planMap.star_monthly_vip) {
          const sv = typeof planMap.star_monthly_vip === 'object' ? planMap.star_monthly_vip : planMap;
          const used = Number(sv.star_monthly_wealth_used ?? 0) || 0;
          const allow = Number(sv.star_monthly_wealth_allowance ?? 0) || 0;
          ok = allow > 0 && used < allow; // 与后端同源：只看余量
        }
        if (alive) setPaidOk(!!ok);
      } catch (_) {
        if (alive) setPaidOk(false); // fail-closed：判不了 ⇒ 视同未购
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ── 取词（🔴 全部为**静态字面量**调用 ⇒ i18n 门禁可静态收录，防 key 字面量上屏）── */
  const whisperText = (i: number): string => (
    i === 0 ? t('familiar.whisper1')
      : i === 1 ? t('familiar.whisper2')
        : i === 2 ? t('familiar.whisper3')
          : i === 3 ? t('familiar.whisper4')
            : i === 4 ? t('familiar.whisper5')
              : ''
  );
  /** 关系模式 ⇒ 标签（与 FamiliarPicker 同源键 familiar.girlfriend/…） */
  const relationLabel = (mode: string): string => t(`familiar.${mode}`);

  /* ── 挂载：读认领档 ⇒ 有档即破框骑键 ──
     🔒 E49（沿袭）: ① URL ?reset=1 ⇒ 一进页自洁灵宠档；
        ② 星盘绑定校验 —— 有当前盘真值且签名不匹配（或旧档无签名）⇒ 即弃即清，
        换生日后严禁串出上一张盘的灵宠；无真值可校验（纯首页会话）⇒ 保留呈现。 */
  useEffect(() => {
    const store = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
    const search = (typeof window !== 'undefined' && window.location) ? window.location.search : '';
    const _rp = new URLSearchParams(search).get('reset');
    if (_rp === '1' || _rp === 'true') clearFamiliarRecord(store, FAMILIAR_LS_KEY);
    const r = readFamiliarRecord(store, FAMILIAR_LS_KEY);
    const tr = extractBirthTruth(search, store);
    if (r) {
      if (tr && !recordMatchesChart(r, { birthDate: tr.birthDate, birthTime: tr.birthTime || '', lat: tr.lat, lon: tr.lon, tz: tr.tz })) {
        clearFamiliarRecord(store, FAMILIAR_LS_KEY); // 串味旧档 ⇒ 清洗（认领收归报告页，首页不再补录）
      } else {
        setRec(r as HomeRecord);
      }
    }
  }, []);

  /* 🔒 E49（沿袭）: 沙箱/管理员态一键重置 —— 清本机灵宠档 + 服务端该账号绑定 */
  const [sandboxMode, setSandboxMode] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/sandbox/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j && j.sandbox === true) setSandboxMode(true); })
      .catch(() => { /* live 态 ⇒ 静默不显示 */ });
    return () => { alive = false; };
  }, []);
  const purgeTestFamiliar = async () => {
    clearFamiliarRecord(window.localStorage, FAMILIAR_LS_KEY);
    setRec(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch('/api/sandbox/reset-familiar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: '{}',
        });
      }
    } catch (_) { /* 本机已清 ⇒ 服务端清理失败不阻断 */ }
  };

  /* ═══════════ E53 净化版：唯一渲染态＝破框骑键（未认领 ⇒ 空壳）═══════════
     🔒 E50 门禁：paidOk!==true（含判定中 / 查库失败）一律不呈现 —— fail-closed。
     物理穿透（军令铁律）：容器 pointer-events:none，灵宠身体与爪子区域 100% 让路给
     「开始测算」按钮；仅头部 / 爱心宝石命中区保留点击（呼吸微光 + 今日寄语气泡）。
     💎 E53-2 双宠预留：recs 恒从单档装配（本期）；未来 $99.99 双宠档 ⇒ 两条
        HomeRecord 同列，Milo/Sophia 各按 IP 类名左右自洽落位，渲染核零改动。 */
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setAnchorEl(document.getElementById('ks-familiar-anchor'));
  }, []);
  const [famPulse, setFamPulse] = useState(false);
  const famPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [famBubble, setFamBubble] = useState<{ name: string; sub: string; line: string } | null>(null);
  const famBubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tapFamiliar = useCallback((rec0: HomeRecord) => {
    const profile = rec0.profile;
    const mode = String(profile.relation_mode || '');
    const name = String(profile.name || '') || (IP_OF_MODE[mode] ?? 'Sophia');
    setFamPulse(true);
    if (famPulseTimer.current) clearTimeout(famPulseTimer.current);
    famPulseTimer.current = setTimeout(() => setFamPulse(false), 1500);
    const wIdx = whisperIndex(profile, localDateKey(new Date()), WHISPER_COUNT);
    setFamBubble({ name, sub: relationLabel(mode), line: wIdx >= 0 ? whisperText(wIdx) : '' });
    if (famBubbleTimer.current) clearTimeout(famBubbleTimer.current);
    famBubbleTimer.current = setTimeout(() => setFamBubble(null), 6500);
  }, [relationLabel, whisperText]);

  /* 💎 E53-2：骑键位装配（本期单档；双宠契约见文件头 —— 渲染核已按数组就位） */
  const recs: HomeRecord[] = rec ? [rec] : [];
  const showBreakout = paidOk === true; // 🔒 E50: fail-closed（判定中也不显）

  return (
    <div className="ks-pet-card" data-testid={FAMILIAR_HOME_TESTID}>
      {anchorEl && showBreakout && recs.map((rec0) => {
        const mode = String(rec0.profile.relation_mode || '');
        const ip = IP_OF_MODE[mode] ?? 'Sophia';
        return createPortal(
          <div
            key={`${rec0.adoptedAt}-${mode}`}
            className={`ks-fam-breakout ks-fam-${ip.toLowerCase()}${famPulse ? ' ks-fam-pulse' : ''}`}
            data-testid="familiar-breakout"
            data-ip={ip}
          >
            <div className="ks-fam-breathe" aria-hidden="true">
              <img className="ks-fam-img" src={ip === 'Milo' ? miloSprite : sophiaSprite} alt="" draggable={false} />
              {/* 🐾 E52：眨眼帧叠加（周期性瞬目，3~5s 一次；reduced-motion 降级为不眨） */}
              <img className="ks-fam-img-blink" src={ip === 'Milo' ? miloBlink : sophiaBlink} alt="" draggable={false} />
              {/* 🐾 E52：独立尾层（transform-origin 在尾根，正弦蠕动；真源 geometry.json E52/E53） */}
              <img className="ks-fam-tail" src={ip === 'Milo' ? miloTail : sophiaTail} alt="" draggable={false} />
            </div>
            {/* 仅头部 / 爱心宝石保留点击（tabIndex=-1 + aria-hidden：纯装饰，不入 a11y 树） */}
            <button type="button" className="ks-fam-zone ks-fam-zone-head" onClick={() => tapFamiliar(rec0)} aria-hidden="true" tabIndex={-1} />
            <button type="button" className="ks-fam-zone ks-fam-zone-gem" onClick={() => tapFamiliar(rec0)} aria-hidden="true" tabIndex={-1} />
            {famBubble && (
              <div className="ks-fam-bubble" aria-hidden="true">
                <span className="ks-fam-bubble-name" style={{ ...SAFE }}>{famBubble.name} · {famBubble.sub}</span>
                {famBubble.line && <span className="ks-fam-bubble-line" style={{ ...SAFE }}>{famBubble.line}</span>}
              </div>
            )}
            {sandboxMode && (
              <button
                type="button"
                className="ks-fam-chip ks-fam-chip-test"
                data-testid="familiar-home-purge"
                onClick={purgeTestFamiliar}
                title={lang === 'zh' ? '重置测试数据 / 清除领养状态' : 'Reset Test Familiar'}
              >
                🧪
              </button>
            )}
          </div>,
          anchorEl,
        );
      })}
    </div>
  );
};

export default FamiliarHomeCard;
