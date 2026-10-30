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
 * 🔴 E54（主公亲令 2026-10-15 · 终极整合军令）：
 *    - E54-1 **绝对趴键落位**：真机抓形「Sophia 悬挂半空」⇒ 垂直锚点重标定 —— 旧值
 *      0.780/0.775 实测的是爪尖/尾梢，真实**身体球底** Milo 0.7806 / Sophia 0.7485
 *      ⇒ translateY 25.4% / 28.6%（球底压键 ≈3px，CSS 真值见 App.css E54-1 段）；
 *    - E54-2 **接管今日运势**：E53 撤下的幸运数字/颜色/花朵/贵人方位**灵魂融合**进灵宠
 *      交互池（dailyFortune.mjs 真值核 + 点击轮播 + 9s 主动锦囊气泡），首页仍零方框；
 *    - E54-3 尾巴仿生慢摇 4s（App.css）；E54-4 进阶定制殿堂页 `/familiar/custom`。
 *
 * 🔴 E63（主公亲令 2026-10-17 · 「灵魂兽」终版定妆总令）：
 *    - E63-1 **Milo 朝向核验**：「面朝右、尾在左、与 Sophia 相对」——现渲染即军令形态
 *      （Milo 尾层 left:0% 在左＋面朝右前；主公所附原画截图为尾右形态，按军令调左后＝现渲染），
 *      经 PIL 双形态合成实测后**不做翻转**（翻转后尾右面左，双违军令）；
 *    - E63-2 **尾梢慢旋小圈**：主公钦定 keyframes ksFamTailLeisurely（4.5s ease-in-out
 *      infinite alternate，rotate ±1.8°/skew ±1°/translateY ±0.5px），与瞬目错峰。
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
import { FAMILIAR_HOME_TESTID, readFamiliarRecord, clearFamiliarRecord, whisperIndex, localDateKey, extractBirthTruth, recordMatchesChart, triadTruth } from '../lib/familiarHome.mjs';
// 🌟 E54-2（主公亲令 2026-10-15）：今日命理赋能真值核 —— 幸运数字/颜色/花朵/贵人方位
//   （自 E53 撤下的 DailyDashboard 迁移而来；灵宠亲口轮播分享，首页零方框）
// @ts-ignore —— dailyFortune.mjs 纯逻辑核（确定性/四象方位；见文件头契约）
import { dailyFortune } from '../lib/dailyFortune.mjs';
// 🐾 E66（主公军令 2026-10-18）：灵魂兽半屏毛玻璃抽屉舱（Gemini 流式对话容器）
import FamiliarChatSheet, { type FamiliarIp } from './FamiliarChatSheet';
// 🍀 E108-刀三（主公军令 2026-11-01）：废除 E107 居中大 Modal「今日幸运卡片」
//   （遮挡灵宠＋交互割裂实锤），复活图 9 贴身伴随式「今日运势锦囊」轻气泡——
//   点灵宠 ⇒ 0.75s 微光脉冲＋两翼贴身锦囊气泡（幸运数字/色/能量微语＋
//   「✦ 与TA聊聊」胶囊 ⇒ 气泡隐退开舱 420×600 对话窗）。

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

  /* 🔒 E48: 权益自检（与 WealthReportPage::isWealthPaid 同源谓词，简化版同语义）
     🏆 E106-刀三（主公军令 2026-10-30）：合法灵宠档熔断付费拦截——病根＝沙盒 $4.99
        匿名直通（E99）不落 user_profiles ⇒ 旧判定无 session 恒 paidOk=false ⇒
        付讫认领回首页后趴键不渲染、对话舱被「解锁报告后我就能天天陪你了」拦截。
        军令钦定：首页检测到**合法灵宠档**（ks_familiar 经 readFamiliarRecord 形状
        守卫＋E49 按盘隔离清洗链）即熔断付费拦截——认领档只能经付费漏斗产生
        （付费墙 FamiliarPicker 全卡上锁＋报告尾 AdoptFamiliarCTA 解锁后承接），
        档在场＝付费证明；fail-closed 契约不动（无档仍须账号/绿道判定）。 */
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
        // 🏆 E106-刀三：合法灵宠档熔断（沙盒匿名付讫用户的主通路）
        const famStore = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
        if (readFamiliarRecord(famStore, FAMILIAR_LS_KEY)) {
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
        // 🔴 E88-④（主公军令 2026-10-26）：姻缘线权益纳入门禁白名单——旧白名单只认
        //    财富线（wealth_*/all_pass/star_vip），姻缘 $4.99 解锁用户（compatibility_*）
        //    认领灵宠回首页后被 fail-closed 拦死（灵宠不显示的真正根因，非账号冲突）。
        //    本地 ks_familiar 档为渲染真源；权益门禁只决定「呈现」，两全其美。
        let ok = planMap.wealth_once === true
          || planMap.wealth_monthly_report === true
          || planMap.wealth_yearly_report === true
          || planMap.compatibility_once === true
          || planMap.compatibility_monthly_report === true
          || planMap.compatibility_yearly_report === true;
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
  const [famBubble, setFamBubble] = useState<{ name: string; sub: string; line: string; line2?: string; hShift: number; vRaise: number } | null>(null);
  const famBubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 🛡️ E109-刀二（主公军令 2026-10-30）：灵宠本体加载守卫——webp 首帧解码
     （100~300ms）未就绪前，锦囊气泡容器一律不渲染（消除「气泡抢跑灵宠」
     时序跳闪）；onLoad 即置位（任一帧到达 ⇒ 视为就绪，双宠未来同构）。 */
  const [petLoaded, setPetLoaded] = useState(false);

  /** 弹出气泡（统一收口：计时重置 + 6.5s 自动消散）
   * 🧩 E82 防遮挡动态解耦（主公亲令 2026-10-21 军令②「锚点与主标题外边界彻底解耦」）：
   * 旧 E71 静态 44px 位移只按中文 4 字标题标定，六语真页实测 EN 已重叠 947px²、fr 5580px²、vi 4019px²。
   * 策略：横向优先外推（保持漫画侧位，与标题边缘间隙 ≥24px，屏内钳制）；
   * 窄屏横向无解（390 屏标题宽 380 几乎满幅）⇒ 垂直抬升到标题上方（bottom 增量）。
   * 双宠对称：Sophia 向左 / Milo 向右，量测与钳制全对称。 */
  const showBubble = useCallback((name: string, sub: string, line: string, line2?: string) => {
    let hShift = 0;
    let vRaise = 0;
    try {
      const breakout = anchorEl?.querySelector('.ks-fam-breakout');
      const titleEl = document.querySelector('.title');
      if (breakout && titleEl) {
        const b = breakout.getBoundingClientRect();
        const tr = titleEl.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        const BUB = 150; // 气泡 max-width 上限（App.css）
        const GAP = 24;  // 军令：与标题文字边缘恒 ≥24px
        const MARGIN = 44; // E71 基础位移
        if (breakout.classList.contains('ks-fam-sophia')) {
          const curOuter = b.left - MARGIN;               // 气泡右缘现值
          const need = curOuter - (tr.left - GAP);        // >0 ⇒ 标题左缘入侵，需左移
          const room = curOuter - 8 - BUB;                // 屏内可移空间（留 8px 安全边）
          if (need > 0) {
            if (need <= room) hShift = Math.ceil(need);
            else vRaise = Math.ceil((b.bottom - 0.56 * b.height) - (tr.top - GAP));
          }
        } else {
          const curOuter = b.right + MARGIN;              // 气泡左缘现值
          const need = tr.right + GAP - curOuter;         // >0 ⇒ 标题右缘入侵，需右移
          const room = vw - 8 - BUB - curOuter;
          if (need > 0) {
            if (need <= room) hShift = Math.ceil(need);
            else vRaise = Math.ceil((b.bottom - 0.56 * b.height) - (tr.top - GAP));
          }
        }
        if (vRaise < 0) vRaise = 0;
      }
    } catch (_) { /* 量测失败 ⇒ 保持 E71 原位，绝不阻塞气泡 */ }
    setFamBubble({ name, sub, line, line2, hShift, vRaise });
    if (famBubbleTimer.current) clearTimeout(famBubbleTimer.current);
    famBubbleTimer.current = setTimeout(() => setFamBubble(null), 6500);
  }, [anchorEl]);

  const nameOf = (rec0: HomeRecord): string => {
    const mode = String(rec0.profile.relation_mode || '');
    return String(rec0.profile.name || '') || (IP_OF_MODE[mode] ?? 'Sophia');
  };

  /* 🐾 E66：抽屉舱开关 + 开场问候真值（今日运势来自 dailyFortune 确定性核，零伪造） */
  const [chatOpen, setChatOpen] = useState(false);

  /** 🍀 E108-刀三：贴身锦囊真值（幸运数字/色/能量微语——dailyFortune 确定性核） */
  const luckPouch = useCallback((rec0: HomeRecord | null) => {
    const sun = rec0 ? String((triadTruth(rec0) || {}).sun || '') : '';
    const f = dailyFortune({ lang, sunSign: sun });
    return {
      line: `🔢 ${t('familiar.luckNum')} ${f.luckyNumber} · 🎨 ${t('familiar.luckColor')} ${f.color.name}`,
      line2: String(f.vibe || ''),
    };
  }, [lang, t]);

  const tapFamiliar = useCallback((rec0: HomeRecord) => {
    /* 🏆 E108-刀三（主公军令 2026-11-01）：头部/宝石点击区 ⇒ 0.75s 微光脉冲＋
       贴身「今日运势锦囊」气泡（图 9 形态：幸运数字/色/能量微语＋「✦ 与TA聊聊」
       胶囊⇒气泡隐退开舱）。E107 居中大 Modal「今日幸运卡片」物理废除（遮挡灵宠
       ＋交互割裂实锤）；对话舱只可经气泡 CTA 显式点开——禁直开。 */
    setFamPulse(true);
    if (famPulseTimer.current) clearTimeout(famPulseTimer.current);
    famPulseTimer.current = setTimeout(() => setFamPulse(false), 750);
    setFamBubble(null);
    const p = luckPouch(rec0);
    showBubble(nameOf(rec0), t('familiar.luckLead'), p.line, p.line2);
  }, [luckPouch, showBubble, t]);

  /* 🛡️ E109-刀二（主公军令 2026-10-30）：E54-2「9s 主动锦囊气泡」定时器整段拔除——
     军令钦定「彻底拔除任何 useEffect 内的自动开舱/冒泡定时器」：锦囊气泡只可由
     点击灵宠身体/爱心显式呼出（初态恒 null）。微光脉冲（E76 带路提示）保留。 */

  /* 💎 E53-2：骑键位装配（本期单档；双宠契约见文件头 —— 渲染核已按数组就位） */
  const recs: HomeRecord[] = rec ? [rec] : [];
  const showBreakout = paidOk === true; // 🔒 E50: fail-closed（判定中也不显）

  // 🐾 E76（主公亲令 2026-10-20）: 报告页「由她/他带路开始互动吧」→ 回首页即唤醒对话舱。
  //   标记由 WealthReportPage 的带路按钮写入（一次性意图）；此处**消费即删**，防刷新重复弹。
  //   🍀 E107-刀二：回首页禁自动弹舱改微光提示；🛡️ E109-刀二（主公军令 2026-10-30）
  //   再收紧：带路回首页**仅 0.75s 微光脉冲**提示灵宠在此——自动冒锦囊气泡一并拔除
  //   （气泡抢跑灵宠 webp 解码 100~300ms ⇒ 「气泡先冒、灵宠后现」时序破相实锤；
  //   军令钦定：锦囊只可由点击灵宠身体/爱心显式呼出）。无灵宠档时不动。
  useEffect(() => {
    if (!rec) return;
    try {
      if (sessionStorage.getItem('ks_open_familiar_chat') !== '1') return;
      sessionStorage.removeItem('ks_open_familiar_chat');
      // 微光提示（不弹舱、不冒气泡）：脉冲一次，静候主人点触
      setFamPulse(true);
      if (famPulseTimer.current) clearTimeout(famPulseTimer.current);
      famPulseTimer.current = setTimeout(() => setFamPulse(false), 750);
    } catch (_) { /* iOS 无痕模式下 sessionStorage 抛错 → 静默降级为不提示 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec]);
  const chatIp: FamiliarIp = (rec && (IP_OF_MODE[String(rec.profile.relation_mode || '')] === 'Milo')) ? 'Milo' : 'Sophia';
  const chatGreeting = React.useMemo(() => {
    const sun = rec ? String((triadTruth(rec) || {}).sun || '') : '';
    const f = dailyFortune({ lang, sunSign: sun });
    return { sun, color: f.color && f.color.name, num: f.luckyNumber };
  }, [rec, lang]);

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
              {/* 🐾 E65e：尾层置于身体下层（主公参照稿铁律「尾根藏球后」）——分离切口与根际残片被球体遮蔽，尾巴自球后自然生出 */}
              <img className="ks-fam-tail" src={ip === 'Milo' ? miloTail : sophiaTail} alt="" draggable={false} />
              {/* 🛡️ E109-刀二：本体 onLoad ⇒ petLoaded 置位（气泡渲染守卫解锁） */}
              <img className="ks-fam-img" src={ip === 'Milo' ? miloSprite : sophiaSprite} alt="" draggable={false} onLoad={() => setPetLoaded(true)} />
              {/* 🐾 E52：眨眼帧叠加（周期性瞬目，3~5s 一次；reduced-motion 降级为不眨） */}
              <img className="ks-fam-img-blink" src={ip === 'Milo' ? miloBlink : sophiaBlink} alt="" draggable={false} />
            </div>
            {/* 仅头部 / 爱心宝石保留点击（tabIndex=-1 + aria-hidden：纯装饰，不入 a11y 树） */}
            <button type="button" className="ks-fam-zone ks-fam-zone-head" onClick={() => tapFamiliar(rec0)} aria-hidden="true" tabIndex={-1} />
            <button type="button" className="ks-fam-zone ks-fam-zone-gem" onClick={() => tapFamiliar(rec0)} aria-hidden="true" tabIndex={-1} />
            {/* 🛡️ E109-刀二：petLoaded 守卫——灵宠未解码就绪前气泡一律不出（点击驱动的显式气泡也可能被守卫延迟到首帧后） */}
            {famBubble && petLoaded && (
              <div
                className="ks-fam-bubble"
                /* 🧩 E82 动态解耦落点：横向外推（覆盖 E71 的 44px 基础位移）＋窄屏垂直抬升 */
                style={{
                  ...(ip === 'Sophia'
                    ? { marginRight: 44 + famBubble.hShift }
                    : { marginLeft: 44 + famBubble.hShift }),
                  ...(famBubble.vRaise ? { bottom: `calc(56% + ${famBubble.vRaise}px)` } : null),
                } as React.CSSProperties}
              >
                <span className="ks-fam-bubble-name" style={{ ...SAFE }}>{famBubble.name} · {famBubble.sub}</span>
                {famBubble.line && <span className="ks-fam-bubble-line" style={{ ...SAFE }}>{famBubble.line}</span>}
                {famBubble.line2 && <span className="ks-fam-bubble-line" style={{ ...SAFE, color: 'rgba(240, 230, 200, 0.78)' }}>{famBubble.line2}</span>}
                {/* 🐾 E66 衔接入口：气泡末尾的「与 TA 聊聊」引子 —— 平滑唤醒半屏抽屉舱 */}
                <button
                  type="button"
                  className="ks-fam-bubble-cta"
                  data-testid="familiar-chat-cta"
                  onClick={() => { setFamBubble(null); setChatOpen(true); }}
                >
                  {t('familiar.chatCta')}
                </button>
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
      {/* 🍀 E108-刀三：居中大 Modal「今日幸运卡片」物理废除——贴身锦囊气泡即三阶动线
          第二阶（点灵宠呼出；气泡「✦ 与TA聊聊」胶囊才开舱） */}
      {/* 🐾 E66：半屏毛玻璃抽屉舱（portal 到 body；零路由跳转，不破坏首页上下文） */}
      <FamiliarChatSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        ip={chatIp}
        name={rec ? nameOf(rec) : chatIp}
        relationMode={rec ? String(rec.profile.relation_mode || '') : ''}
        lang={lang}
        paidOk={paidOk}
        greetingVars={chatGreeting}
      />
    </div>
  );
};

export default FamiliarHomeCard;
