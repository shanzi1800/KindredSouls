/**
 * FamiliarChatSheet.tsx —— 灵魂兽半屏上滑毛玻璃抽屉舱（E66 · 主公军令 2026-10-18）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令要点（E66 模块一「半屏上滑抽屉舱」）：
 *   - 从屏幕底部优雅上滑的**深空毛玻璃**抽屉舱，占屏高 65%~70%；
 *   - 点击遮罩 / 下滑手势 ⇒ 无缝收起；**零路由跳转**，不破坏首页上下文；
 *   - 三段式：①顶部坐席（灵宠头像＋呼吸态＋状态副标题＋关闭）②中间对话流
 *     （开场自动置顶一条结合今日运势与本命盘的问候 ＋ 3 个快捷提问药丸）
 *     ③底部输入栏（文本框＋发送＋**麦克风/语音播报槽位**，为少年音 Milo /
 *     少女音 Sophia 预留 UI 锚点）。
 *
 * 🔴 三条工程纪律（沿袭封仓铁律）：
 *   ① 前端**只传对话**，prompt/星盘/运势全部由服务端真值装配（禁前端拼系统提示）；
 *   ② 流式渲染 **90ms 节流**（E60/E61 验证成熟）：delta 先进 ref 缓冲，定时批量
 *      setState，避免逐字 setState 引发的重排风暴与「拉扯/归顶」；
 *   ③ 权益门禁由服务端 fail-closed 兜底（401/402/429 三态），前端只做友好提示，
 *      绝不把「未解锁也能聊」做成前端假象。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import miloSprite from '../assets/familiar_milo.webp';
import sophiaSprite from '../assets/familiar_sophia.webp';
// @ts-ignore —— 纯逻辑核（本命真值提取；形状由既有 E46/E49 闸门守备）
import { extractBirthTruth, readFamiliarRecord, familiarChartSig } from '../lib/familiarHome.mjs';
// 🏆 E112-刀二（主公军令 2026-11-01）：最近解锁付费报告读取（形状守卫 fail-closed）
// @ts-ignore —— soulRecentReport.mjs 纯 JS 逻辑核（形状由 E112 闸门守备）
import { readRecentReport } from '../lib/soulRecentReport.mjs';
// 🏆 E113-刀三/刀四（主公军令 2026-11-01）：按日会话固化核（24:00 失效＋跨日判定）
// @ts-ignore —— dailyChatSession.mjs 纯 JS 逻辑核（形状由 E113 闸门守备）
import { loadDailyChatSession, saveDailyChatSession, readLastChatDay, chatSessionDateKey, sessionToChatMsgs } from '../lib/dailyChatSession.mjs';
// @ts-ignore —— dailyFortune.mjs 确定性今日运势核（helloDaily 插值真值·与首页锦囊同源）
import { dailyFortune } from '../lib/dailyFortune.mjs';
// 🏆 E114-刀一（主公军令 2026-11-01）：首语插值真值核——六语模板占位符
//    {{tarotCard}}/{{trinePattern}} 的运行时变量（报告真值查表，禁硬编码牌名）
// @ts-ignore —— greetingTruth.mjs 纯 JS 逻辑核（形状由 E114 闸门守备）
import { readReportTarotId, readRecentTarotId, readTrineKey, resolveHelloVars } from '../lib/greetingTruth.mjs';
// 🏆 E118-刀一/刀二/刀四（主公军令 2026-11-02）：用户姓名/昵称静默捕获＋
//    跨日永久档案（ks_familiar_profile_${chartSig} 永不过期——根治跨日失忆）
//    （E142.1-刀二唤名熔断门核统一在 L68 顶部 import——此处旧行退役防重复）
// @ts-ignore —— FAMILIAR_LS_KEY 与 FamiliarHomeCard 同源唯一键
import { FAMILIAR_LS_KEY } from './FamiliarPicker';
// 🏆 E121-SCRIBE-SLOT（主公军令 2026-11-03 · 任务 #701 销项）：破冰密函插槽
//    消费端接线——detectScribeIntent（E120-刀四触发器）＋微缩插槽/大图预览弹层。
// @ts-ignore —— companionScribeTrigger.mjs 纯 JS 逻辑核（形状由 E120/E121 闸门守备）
import { detectScribeIntent } from '../lib/companionScribeTrigger.mjs';
// 🏆 E124-LIFESTYLE-MUSE 刀二（主公军令 2026-11-05）：生活方式意图网——密函
//    静默时接管（STYLE/ROADTRIP 六语捕获；fail-closed 寒暄一律 null）。
// @ts-ignore —— detectLifestyleIntent.mjs 纯 JS 逻辑核（形状由 E124 闸门守备）
import { detectLifestyleIntent } from '../lib/detectLifestyleIntent.mjs';
// 🏆 E123-刀四（主公军令 2026-11-04）：罗盘情绪记忆贯通——ks_active_mood
//    读取（当日＋2h 时效）＋5 情绪×6 语第一人称共情首句字典（零 i18n 新键）。
// @ts-ignore —— companionMoodGreetings.mjs 纯 JS 逻辑核（形状由 E123 闸门守备）
import { readActiveMood, moodGreetingLine } from '../lib/companionMoodGreetings.mjs';
// 🆕 E142-刀一（主公军令 2026-11-16）：灵宠有序话题记忆栈——P1 已解锁付费报告
//    话题（隔日持久锚）＋P2 罗盘情绪串联合成器＋tier 归一化根修（写入侧年报档
//    'annual' 与消费端 '_yearly' 错位曾致模式落空跌 plain 兜底——病灶①真根）。
//    🆕 E142.1-刀一（军令 2026-11-17）：P1 话题胶囊前置退役（首句已自然引导，
//    胶囊画蛇添足——topicPillLabel 彻底删除，胶囊栏恒 chatQ1/Q3 基底两颗）。
// @ts-ignore —— companionTopicQueue.mjs 纯 JS 逻辑核（形状由 E142 闸门守备）
import { resolveCompanionGreetingAndQueue, normalizeReportKey, normalizeReportTier } from '../lib/companionTopicQueue.mjs';
// 🆕 E149-刀二/刀三（主公军令 2026-11-20）：L1 行动回访标记——done 帧静默写入
//  ＋body 随行＋P3 首句消费后单次死锁归档（microActionMemory 纯核）
import { readMicroAction, writeMicroAction, markMicroActionFollowedUp } from '../lib/microActionMemory.mjs';
// 🆕 E142.1-刀二（军令 2026-11-17）：唤名三重熔断客户端门——极值情绪在场且
//    当日配额<2 才允许首句/锦囊带名；本地计数随行上行，done 帧权威计数回写。
// @ts-ignore —— userNameMemory.mjs 纯 JS 逻辑核（形状由 E118/E142 闸门守备）
import { extractUserNameIntent, readUserNameProfile, writeUserNameProfile, prependUserName, extremeMoodForName, readNameCallCount, bumpNameCallCount, syncNameCallCount, NAME_CALL_LIMIT } from '../lib/userNameMemory.mjs';
// 🆕 E142-刀三（主公军令 2026-11-16）：用户终端时钟同步三件套——每次聊天
//    请求实时构造随 body 上行（localISO/timezone/formattedLocalTime 含星期
//    与时段）；服务端形状守卫后注入 System Prompt 顶部高优块（拔「不知道
//    时间/服务器 UTC」病灶③；fail-soft：构造异常 ⇒ 不传 ⇒ 现行为零破坏）。
// @ts-ignore —— clientTimeContext.mjs 纯 JS 逻辑核（形状由 E142 闸门守备）
import { buildClientTimeContext } from '../lib/clientTimeContext.mjs';
// 🆕 E143-刀一/刀三（军令 2026-11-17）：灵犀共生状态机＋显式记忆星光微标纯核
//    （bondLevel 三档/resonanceScore 0-100/六语自容字典；微标三触发去重＋
//    后台 ks_astral_resonance_log 共振日志零 PII——军令模块一）
// @ts-ignore —— soulBondState.mjs 纯 JS 逻辑核（形状由 E143 闸门守备）
import { readSoulBondState, applyBondDelta, resonanceGainFromUserText, bondStatusBarLabel, writeSoulBondState } from '../lib/soulBondState.mjs';
// @ts-ignore —— astralMemoryBadge.mjs 纯 JS 逻辑核（形状由 E143 闸门守备）
import { badgeLabel, shouldShowBadge, recordBadge, appendResonanceLog } from '../lib/astralMemoryBadge.mjs';
// 🆕 E144-刀一~刀五（军令 2026-11-18）：星灵律动纯核——昼夜色温/跨日重逢/
// 短句留白消费/天时日历锁（.ics）/嘴替三档行内复制（六语自容字典零 i18n 扰动）。
// @ts-ignore —— astralRhythmAction.mjs 纯 JS 逻辑核（形状由 e144 闸门守备）
import {
  resolveCircadianPhase, composeCircadianStatus,
  readLastActiveTs, writeLastActiveTs, computeAstralReunionContext, astralReunionBadgeLabel,
  detectAstralCalendarEvent, detectAstralCalendarIntent, defaultAstralWindow,
  buildAstralCalendarICS, astralCalendarFilename, buildAstralCalendarRichFields,
  calendarLockPillLabel, calendarEventSummary,
  parseProxyLine, copyDoneLabel,
} from '../lib/astralRhythmAction.mjs';
import { AmuletScribeSlotCard, AmuletPreviewModal } from './companion/AmuletScribeSlot';
import type { ScribeAmuletType } from './companion/AmuletScribeSlot';
// 🏆 E124-LIFESTYLE-MUSE 刀四（主公军令 2026-11-05）：生活卡微缩插槽＋
//    1080×1748 大图预览弹层（Aura Style Capsule / Soul Roadtrip Guide）。
import { LifestyleMuseSlotCard, LifestylePreviewModal } from './companion/LifestyleMuseSlot';
import type { LifestyleCardType } from './companion/LifestyleMuseSlot';
// 🆕 E137-刀二（军令 2026-11-12）：星盘时令能量处方卡（服务端 meta 帧 wellnessRx
// 投影驱动——chatQ3/养生语义触发时随流下发，前端纯渲染零重算）
import { WellnessRxSlotCard, isWellnessRxMeta } from './companion/WellnessRxSlot';
import type { WellnessRxMeta } from './companion/WellnessRxSlot';
// 🆕 E139-刀二（军令 2026-11-15）：星盘财商与守财罗盘卡（服务端 meta 帧
//    wealthPrescription 投影驱动——chatQ1/财富语义触发时随流下发，前端纯
//    渲染零重算；主按钮灵宠真名追问直发 send）
import { WealthAdvisorySlotCard, isWealthAdvisoryMeta } from './companion/WealthAdvisorySlot';
import type { WealthAdvisoryMeta } from './companion/WealthAdvisorySlot';
// ⚖️ E130-PURE-SANCTUARY-RESTORE（主公军令 2026-11-09）：对话舱＝神圣陪伴净土——
//    E129-刀四的羊皮卷长卷弹层（z-140）与内嵌收银托盘（z-141）整体清退；
//    付费引导改为话语间含蓄点拨，交易动作回归 WealthPaywall 专门付费墙页面
//    完成。删 imports + 递卡字典 + state + 函数 + JSX＝零残留。

export type FamiliarIp = 'Milo' | 'Sophia';

/** 🏆 E112-刀二：开场首语九分支——六档报告第一击（love/wealth × core/monthly/
 *  annual）＋E111 情境三分支（sweet/soothe/plain）；
 *  🏆 E113-刀四：新增 daily 分支——跨自然日无当日新解锁 ⇒ 流转今日幸运锦囊
 *  问候（{{color}}/{{num}} 插值真值来自 dailyFortune 确定性核）。
 *  🏆 E123-刀四：新增 mood 分支——罗盘情绪记忆（ks_active_mood 当日＋2h
 *  时效命中）⇒ 5 情绪×6 语第一人称共情抚慰首句（军令钦定句式逐字）。 */
type HelloMode =
  | 'sweet' | 'soothe' | 'plain' | 'daily' | 'mood' | 'p1queue'
  | 'love_core' | 'love_monthly' | 'love_yearly'
  | 'wealth_core' | 'wealth_monthly' | 'wealth_yearly';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  ip: FamiliarIp;
  name: string;
  relationMode: string;
  lang: string;
  /** 🔒 E66：与服务端同源门禁；false/null ⇒ 不发起请求，直接提示解锁 */
  paidOk: boolean | null;
  /** 🏆 E111-刀二：情境首语分支真值（首页 Context First-Strike 引擎判定：
   *  sweet＝恋人牌/三合六合；soothe＝六冲/低分磨合；plain＝无报告数据）。
   *  旧 greeting 通道（dailyFortune color/num 注入）已物理拔除——首语严禁复读锦囊。 */
  greetingMode?: 'sweet' | 'soothe' | 'plain' | null;
  /** 🏆 E112-刀三（主公军令 2026-11-01）：灵犀星累计数——徽章迁移至对话舱
   *  Header 右侧（与标题 Sophia/Milo 平行、关闭按钮 ✕ 左侧，黑金轻奢胶囊）。
   *  首页灵宠身侧旧徽章物理拆除（贴在「开始测算」按钮下方破坏布局——主公
   *  实机验收实锤）。每日 +1 打卡逻辑仍在首页 FamiliarHomeCard。 */
  starCount?: number;
  /** 🏆 E114-刀五（主公军令 2026-11-01）：SSE 吐字流状态上行——isStreaming=true
   *  期间首页灵宠切入「共鸣倾听/欢快分享」姿态（Sophia 双耳前倾＋宝石 4Hz
   *  呼吸微光＋尾梢打拍；Milo 摇尾 1.8s 周期＋头顶金色星尘），流式完毕平滑
   *  回落待机趴键态。由 FamiliarHomeCard 注入 setChatLive（breakout 加
   *  .ks-fam-live class 驱动 CSS 姿态）。 */
  onStreamingChange?: (streaming: boolean) => void;
  /** 🏆 E137.1-RX-MONOGRAPH-DRAWER（主公军令 2026-11-13）：手札追问注入通道——
   *   RxMonographModal「让伴侣定制调理时辰」⇒ App 层 CustomEvent ⇒ HomeCard
   *   开舱并置此 prop；ChatSheet 收到非空 pendingAsk（且非流式中）自动 send
   *   发送，随后回调 onPendingAskConsumed 清空（单次单发防重复注入）。 */
  pendingAsk?: string | null;
  onPendingAskConsumed?: () => void;
}

const THROTTLE_MS = 90;

/**
 * 🧩 E68 输入栏独立微组件（军令①：根除打字滞后）——
 * 打字 state 局部化在本组件内，敲键只重渲染这 38px 输入栏，
 * 严禁触发外层对话流 / 毛玻璃抽屉重渲染（此前 input 在父级，每键全树 diff）。
 * 🏆 E110-刀三：焦点自动保活——
 *   ① 发送（Enter/点击↑）清空文本后立即 focus() 光标回输入框；
 *   ② 流式期间只置灰发送按钮防连击，input 绝不 disabled（disabled 会强制移焦）；
 *   ③ 流式结束（streaming true→false）兜底 refocus，支持连续敲字零鼠标。
 */
const ChatInputBar: React.FC<{
  streaming: boolean;
  placeholder: string;
  micTitle: string;
  sendLabel: string;
  onSend: (text: string) => void;
}> = ({ streaming, placeholder, micTitle, sendLabel, onSend }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wasStreamingRef = useRef(false);
  const submit = () => {
    const v = text.trim();
    if (!v || streaming) return;
    setText('');
    onSend(v);
    // 🏆 E110-刀三：发送后光标保活（清空即回焦，连续键入零鼠标）
    inputRef.current?.focus();
  };
  // 🏆 E110-刀三：流式收尾兜底 refocus（仅 true→false 转变时触发，
  //    首次挂载/舱未开时不抢焦——防移动端键盘误弹）
  useEffect(() => {
    if (wasStreamingRef.current && !streaming) inputRef.current?.focus();
    wasStreamingRef.current = streaming;
  }, [streaming]);
  return (
    <div className="ks-chat-bar">
      <input
        ref={inputRef}
        className="ks-chat-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // 中文输入法组词中的回车只上屏不发送（isComposing 保护）
          if (e.key === 'Enter' && !(e.nativeEvent as KeyboardEvent).isComposing) submit();
        }}
        placeholder={placeholder}
        maxLength={300}
        autoComplete="off"
      />
      {/* 🎙 E66 语音扩展槽位：清朗少年音 Milo / 温柔少女音 Sophia（UI 锚点，功能待接入） */}
      <button type="button" className="ks-chat-mic" disabled title={micTitle} aria-label={micTitle}>🎙</button>
      <button type="button" className="ks-chat-send" onClick={submit} disabled={streaming || !text.trim()} aria-label={sendLabel}>↑</button>
    </div>
  );
};
const MemoChatInputBar = React.memo(ChatInputBar);

const FamiliarChatSheet: React.FC<Props> = ({ open, onClose, ip, name, relationMode, lang, paidOk, greetingMode, starCount, onStreamingChange, pendingAsk, onPendingAskConsumed }) => {
  const { t } = useTranslation();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  /* 🏆 E121-SCRIBE-SLOT 刀一/刀三：密函插槽状态——绑定本轮 assistant 消息 ID
   * （单轮防刷：state 单槽驱动，滚动/重绘不追加；新问答回合覆盖旧槽）＋
   * 大图预览弹层开关（null=关；四型之一=开）。 */
  const [scribeSlot, setScribeSlot] = useState<{ aid: string; type: ScribeAmuletType } | null>(null);
  const [amuletPreview, setAmuletPreview] = useState<ScribeAmuletType | null>(null);
  /* 🏆 E124-LIFESTYLE-MUSE：生活卡插槽状态（E121 同构单轮防刷——绑定本轮
   * aid；密函命中时本槽恒 null 互斥）＋大图预览弹层开关（null=关）。 */
  const [lifestyleSlot, setLifestyleSlot] = useState<{ aid: string; type: LifestyleCardType } | null>(null);
  /* 🆕 E137-刀二（军令 2026-11-12）：星盘时令能量处方槽——SSE meta 帧 wellnessRx
   * 投影（服务端引擎单源算好六语文案）；形状不全 ⇒ 不挂载（零破坏）。 */
  const [wellnessSlot, setWellnessSlot] = useState<{ aid: string; rx: WellnessRxMeta } | null>(null);
  /* 🆕 E139-刀二（军令 2026-11-15）：星盘财商处方槽——SSE meta 帧
   * wealthPrescription 投影（E137 同构；形状不全 ⇒ 不挂载零破坏）。 */
  const [wealthSlot, setWealthSlot] = useState<{ aid: string; rx: WealthAdvisoryMeta } | null>(null);
  const [lifestylePreview, setLifestylePreview] = useState<LifestyleCardType | null>(null);
  /* ⚖️ E130：E129-刀四长卷/支付托盘五 state 全数清退（神圣净土零收银）。 */

  const flowRef = useRef<HTMLDivElement | null>(null);

  const bufRef = useRef('');
  const throttleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartY = useRef<number | null>(null);
  const listRef = useRef<ChatMsg[]>([]);
  listRef.current = msgs;

  /** 开场问候（🧩 E82 语言联动根治，主公亲令 2026-10-21 军令③）：
   * 旧「一生一次」ref 门闩＋ msgs 跨关闭不重置 ⇒ 首次 zh 开舱后，切 EN 重开永远中文旧句
   * （六语真机实锤）。舱开着切语言 ⇒ 纯开场白态实时替换为新语言（已展开对话不扰）。
   * 🏆 E111-刀二（主公军令 2026-11-01）：彻底拔除「幸运色/幸运数字」复读——
   *  sweet（恋人牌/三合六合）⇒ chatHello 甜句；soothe（六冲/低分磨合）⇒ 慰句；
   *  plain ⇒ chatHelloPlain 中性陪伴句。首语只在「带路回首页后开舱」或「当日
   *  首次开舱」出现一次（sessionStorage ks_familiar_firststrike_day 日标记）。
   * 🏆 E112-刀二（主公军令 2026-11-01）：六档报告第一击——本地存在最近解锁
   *  付费报告（soul_recent_unlocked_report）⇒ 首语直接切入该报告情境。
   * 🏆 E113-刀三/刀四（主公军令 2026-11-01）：会话按日固化＋跨日流转三路判定：
   *  ① 当日未过期会话档在场 ⇒ **复原全部历史，禁止重复首句**（军令验收②）；
   *     除非当日新解锁报告晚于最后一条消息 ⇒ 立即重置为最新报告第一击；
   *  ② 当日新解锁报告（unlockedAt 落今日）⇒ 六档报告第一击（E112 语义收窄为
   *     「当日有效」——军令刀四「新解锁⇒立即重置」）；
   *  ③ 跨自然日（昨聊过 lastChatDay < today 且无当日新解锁）⇒ 首语流转为
   *     今日幸运锦囊问候 helloDaily（{{color}}/{{num}} 真值插值）；
   *  ④ 其余 ⇒ 维持 E111 情境链（日标记契约照旧）。 */
  const [helloMode, setHelloMode] = useState<HelloMode>('plain');
  /* 🆕 E143-刀三（军令 2026-11-17）：灵犀共生状态——bondLevel 三档
   *  （Lv.1 初识星伴→Lv.2 星轨同频→Lv.3 灵魂共生）＋resonanceScore 0-100；
   *  开舱读档（ks_soul_bond_state 均档容错归零重建）＋send 埋点累加写档。 */
  const [bondState, setBondState] = useState<{ resonanceScore: number; bondLevel: string; updatedAt: number }>(
    () => readSoulBondState((typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null));
  /* 🆕 E143-刀三：灵犀状态 ref 镜像（send 闭包防陈旧——累加恒基于最新值） */
  const bondStateRef = useRef<{ resonanceScore: number; bondLevel: string; updatedAt: number }>(
    readSoulBondState((typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null));
  /* 🆕 E143-刀三：本轮回复气泡顶部星光微标（{id: assistantMsgId, type}——
   *  流式落地渲染；fail-closed 坏类型永不挂） */
  const [badgeOnMsg, setBadgeOnMsg] = useState<{ id: string; type: string } | null>(null);
  /* 🆕 E143-刀三：星光呼吸（1.5s 金色光晕——默契跃迁/微标点亮时触发） */
  const [avatarBreathe, setAvatarBreathe] = useState(false);
  /* 🆕 E143-刀三：微标会话去重集合（随 dailyChatSession 档存/读——单会话
   *  同类型恰 1 次；开舱复原时从档回填） */
  const badgeLogRef = useRef<string[]>([]);
  /* 🆕 E144-刀五（军令 2026-11-18）：嘴替行轻点复制反馈锚（✓ 已复制 1.5s
   *  内联闪现——绑定 {msgId, lineIdx} 精确到行）。 */
  const [copiedProxy, setCopiedProxy] = useState<{ id: string; idx: number } | null>(null);
  /* 🆕 E144-刀四（军令 2026-11-18）＋E144.1-刀二（补刀军令）：天时日程锁槽
   * ——双保险触发（精确时窗/胶囊直通/语义宽域）⇒ 📅 内联微胶囊；note＝
 * 本轮回复核心句（入 .ics DESCRIPTION 日历备注）。 */
  const [calSlot, setCalSlot] = useState<{
    aid: string;
    ev: { dateOffset: number; startHH: number; startMM: number; endHH: number; endMM: number; kind: string };
    note: string;
    dateISO: string;
  } | null>(null);
  /* 🆕 E144-刀三（军令 2026-11-18）：跨日重逢微标锚（✨ 挂首条/末条 assistant
   *  气泡顶部——E143 微标同槽；单会话 1 次）。 */
  const [reunionBadge, setReunionBadge] = useState<{ id: string } | null>(null);
  /* 🆕 E144-刀二（军令 2026-11-18）：昼夜时钟快照（开舱锚定——状态栏色温
   *  前缀＋舱体色温 class 单源；06:00–17:59 暖金 / 18:00–05:59 星夜紫）。 */
  const [circadianClock, setCircadianClock] = useState<{ hour: number; minute: number }>(() => {
    const d = new Date();
    return { hour: d.getHours(), minute: d.getMinutes() };
  });
  /* 🏆 E113-刀三：会话档锚（open 时算定，实时写 effect 复用——避免逐消息重算） */
  const sessionSigRef = useRef('anon');
  const sessionDateRef = useRef('');
  /* 🏆 E123-刀四：罗盘情绪记忆锚（open 时读一次；mood 分支首语查表真源——
   *  舱开着切语言重渲染 effect 按 helloMode==='mood' 用当前 lang 重查字典） */
  const activeMoodRef = useRef<string | null>(null);
  /* 🆕 E142-刀一（军令 2026-11-16）：有序话题快照锚（open 时锚一次——p1queue
   *  首句与 P1 话题胶囊消费真源；rr＝soul_recent_unlocked_report 持久档、
   *  mood＝ks_active_mood 2h 窗——队列合成自两真源，不另立存储防双源漂移） */
  const topicSnapshotRef = useRef<{ rr: { category?: string; tier?: string } | null; mood: string | null } | null>(null);
  /* 🆕 E142.1-刀二（军令 2026-11-17）：唤名门锚（open 时锚一次——首句/锦囊
   *  带名唯一准入真源；重写效应按锚重查保证切语言重生同形，不二次计数）。 */
  const nameGateRef = useRef<boolean>(false);
  /* 🏆 E118-刀二：用户姓名档案锚（open 时读永久档一次；跨日首语带名真源——
   *  档案 ks_familiar_profile_${chartSig} 永不过期，与当日 24:00 过期的会话档解耦） */
  const profileNameRef = useRef('');
  /* 🆕 E129-刀三（军令 2026-11-09）：会话首击标志——每次开舱（mount）后的
   *  第一条用户消息 body 带 sessionOpen:true，服务端据此检索 ≤48h 未决事件
   *  ＋新月/满月 ±24h 注入 LIVING_AGENT_CONTEXT 块（主动伴生节律底座）。 */
  const firstStrikeRef = useRef(true);
  /* 🆕 E149-刀三：P3 轻复盘已展示锚——首语产出 followedUp 时置位；用户发送
   *  第一条消息时执行 markMicroActionFollowedUp 单次死锁归档（防翻旧账）。
   *  归档延至发送期：切语言重渲染重合成首语时档仍在，不丢句不闪变。 */
  const _e149P3ShownRef = useRef(false);
  /* 🏆 E114-刀一：首语插值真值锚（open 时读报告真值一次；helloFor 按当前
   * 语言即时查表——舱开着切语言 t 变更效应会用当前 lang 重渲染首语） */
  const helloTruthRef = useRef<{ tarotId: number | null; trineKey: string | null }>({ tarotId: null, trineKey: null });
  const helloFor = useCallback((mode: HelloMode): string => {
    // 🏆 E114-刀一（主公军令 2026-11-01）：六语模板占位符运行时插值——牌名/局名
    //  走报告真值查表（tarotNames.mjs 单源），无真值 ⇒ 中性词（fail-closed，
    //  绝不臆造具体牌名——《恋人》写死病根物理拔除）
    const vars = () => resolveHelloVars(lang, helloTruthRef.current);
    if (mode === 'p1queue') {
      // 🆕 E142-刀一（军令 2026-11-16）：有序话题队列首句——P1 已解锁报告话题
      //  （六档六语自容字典，零 i18n 新键）＋P2 罗盘情绪丝滑串联；合成器
      //  fail-closed null ⇒ 现行为兜底。舱开着切语言实时按当前 lang 重查字典
      //  （快照存输入不存产出——语言不锁死）。
      //  🆕 E142.1-刀二（军令 2026-11-17）：姓名前缀改门控供应（唤名门未开 ⇒
      //  不带名——军令「平时常规问候禁喊名/日 2 次/极值情绪门」三重熔断）。
      const snap = topicSnapshotRef.current;
      const q = snap ? resolveCompanionGreetingAndQueue({
        recentReport: snap.rr, activeMood: snap.mood, lang,
        userName: nameGateRef.current ? profileNameRef.current : undefined,
        // 🆕 E149-刀三：P3 轻复盘——48h 内未回访微动作＋当前角色口吻（军令顺位
        //  P1＞P2＞P3＞P4；fail-closed 白名单在核内）；followedUp ⇒ 发送期归档
        lastMicroAction: readMicroAction(
          (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null,
          sessionSigRef.current),
        relationMode,
      }) : null;
      if (q && q.firstLine) {
        if (q.followedUp) _e149P3ShownRef.current = true; // 归档延至发送期（防切语言重渲染丢首句）
        return q.firstLine;
      }
      return helloFor('plain');
    }
    if (mode === 'mood') {
      // 🏆 E123-刀四（军令 2026-11-04）：罗盘情绪记忆第一击——5 情绪×6 语
      //  第一人称共情抚慰句（COMPANION_MOOD_GREETINGS 军令钦定句式逐字；
      //  坏 key/坏 lang ⇒ moodGreetingLine null ⇒ 递归回落 plain 中性陪伴句
      //  fail-closed，绝不臆造情绪）
      const line = activeMoodRef.current
        ? moodGreetingLine(activeMoodRef.current, lang)
        : null;
      if (line) return line;
      return helloFor('plain');
    }
    if (mode === 'love_core') return t('familiar.helloLoveCore', vars());
    if (mode === 'love_monthly') return t('familiar.helloLoveMonthly');
    if (mode === 'love_yearly') return t('familiar.helloLoveYearly');
    if (mode === 'wealth_core') return t('familiar.helloWealthCore');
    if (mode === 'wealth_monthly') return t('familiar.helloWealthMonthly');
    if (mode === 'wealth_yearly') return t('familiar.helloWealthYearly');
    if (mode === 'daily') {
      // 🏆 E113-刀四：今日锦囊真值（dailyFortune 确定性核——与首页 luckPouch 同源，
      //    同日同盘恒定不抖动；无本命太阳 ⇒ 回落全池，绝不臆造）
      // 🏆 E118-刀四（主公军令 2026-11-02）：跨日唤醒首语带名——永久档案有名字
      //    ⇒ 六语前缀装配（「North，新的一天，星轨又为你转动啦！」同构）；
      //    无名字 ⇒ 原样透传（今日现行为兜底，零 i18n 新键）
      //    🆕 E142.1-刀二（军令 2026-11-17）：前缀改唤名门控供应——极值情绪
      //    在场且日配额未满才带名（军令「次日晨间问候连喊 2 次」病灶根治）。
      const f = dailyFortune({ lang, sunSign: '' });
      const base = t('familiar.helloDaily', { color: String(f.color.name), num: String(f.luckyNumber) });
      return nameGateRef.current
        ? prependUserName(lang, profileNameRef.current, base) : base;
    }
    if (mode === 'sweet') return t('familiar.chatHello', { tarotCard: vars().tarotCard });
    if (mode === 'soothe') return t('familiar.chatHelloSoothe');
    return t('familiar.chatHelloPlain', { name });
  }, [t, name, lang]);
  useEffect(() => {
    if (!open) return;
    const store = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
    const today = chatSessionDateKey();
    // 🏆 E113-刀三：chartSig 会话键真源——认领档绑定签名优先，本命真值推导兜底
    let sig = 'anon';
    try {
      const famRec = readFamiliarRecord(store, FAMILIAR_LS_KEY);
      if (famRec && typeof famRec.chartSig === 'string' && famRec.chartSig) sig = famRec.chartSig;
      else {
        const bt = extractBirthTruth(window.location.search, window.localStorage);
        if (bt) sig = familiarChartSig({ birthDate: bt.birthDate, birthTime: bt.birthTime || '', lat: bt.lat, lon: bt.lon, tz: bt.tz });
      }
    } catch { /* 隐私模式 ⇒ anon 共享档兜底（fail-soft） */ }
    sessionSigRef.current = sig;
    sessionDateRef.current = today;
    /* 🆕 E144-刀三/刀二（军令 2026-11-18）：星象天时跨日重逢判定＋最后活跃
     *  时刻写档（ks_last_active_ts——localStorage 白名单在册）。≥6h 或跨本地
     *  自然日 ⇒ 重逢微标；写档/读档 fail-soft 零抛错外溢。 */
    setReunionBadge(null); // 每次开舱先复位（防上次开舱残留）
    let _e144Reunion = false;
    try {
      const _e144NowTs = Date.now();
      const _e144Ctx = computeAstralReunionContext({
        lastActiveTs: readLastActiveTs(store),
        nowTs: _e144NowTs,
        localISO: today,
      });
      _e144Reunion = _e144Ctx.reunion;
      writeLastActiveTs(store, _e144NowTs);
    } catch { /* 隐私模式 fail-soft */ }
    /* 🆕 E144-刀二：昼夜时钟快照（状态栏色温前缀＋舱体色温 class 单源） */
    try {
      const _e144Now = new Date();
      setCircadianClock({ hour: _e144Now.getHours(), minute: _e144Now.getMinutes() });
    } catch { /* noop */ }
    // 🏆 E118-刀二：永久姓名档案开舱即读（跨日首语带名真源；坏档/隐私 ⇒ 空名兜底）
    try {
      profileNameRef.current = (readUserNameProfile(store, sig) || null)?.displayName || '';
    } catch { profileNameRef.current = ''; }
    // 🏆 E114-刀一：首语插值真值装配（开舱一次）——sessionStorage 当次报告塔罗
    //    （E109 一盘一清）→ localStorage 最近解锁报告 keyAspects（E112 跨会话）
    //    → null；三合/六合走 ks_result bazi.meta（E92 真值）。坏档 fail-soft。
    try {
      const tarotId = readReportTarotId(sessionStorage) ?? readRecentTarotId(store);
      helloTruthRef.current = { tarotId, trineKey: readTrineKey(sessionStorage) };
    } catch { /* 无痕模式 ⇒ 中性词兜底（fail-soft 不臆造） */ }
    try {
      const rr = readRecentReport(store);
      // 🆕 E142-刀一（军令 2026-11-16）：P1/P2 话题快照锚＋罗盘情绪读取前置
      //  （首句合成消费真源——队列合成自两真源，不另立存储防双源漂移）。
      let _e142Mood: string | null = null;
      try { _e142Mood = readActiveMood(sessionStorage); } catch { _e142Mood = null; }
      activeMoodRef.current = _e142Mood;
      topicSnapshotRef.current = { rr, mood: _e142Mood };
      // 🆕 E142.1-刀二（军令 2026-11-17）：唤名门锚——极值情绪（罗盘五原型＝
      //  非常失落/非常兴奋族）在场且当日配额 <2 且永久档案有名字 ⇒ 首句/锦囊
      //  才允许带名；平时常规问候一律中性不带名（军令三重熔断客户端面）。
      try {
        nameGateRef.current = !!(profileNameRef.current
          && extremeMoodForName(_e142Mood)
          && readNameCallCount(store, today) < NAME_CALL_LIMIT);
      } catch { nameGateRef.current = false; }
      // E113-刀四：当日新解锁判定（unlockedAt 落今日本地日期）
      const freshReport = !!(rr && chatSessionDateKey(new Date(Number(rr.unlockedAt))) === today);
      /* 🆕 E142.1-刀一（军令 2026-11-17）：问候模式链**前置**计算（先于会话档
       * 复原分支）——关窗重开严禁跌回 plain 兜底：复原分支吃存档 greetingMode
       * （旧档无字段 ⇒ 本重算值兜底，输入确定性 ⇒ 与首次开舱同值）。firststrike
       * 写入侧效移至首语新发路径（复原路径不再误标）。 */
      let _e1421MarkFirststrike = false;
      let mode: HelloMode = greetingMode || 'plain';
      // 🏆 E123-刀四（军令 2026-11-04）：罗盘情绪记忆首语拦截——当日有效
      //  ks_active_mood（≤2h）命中 ⇒ 强制替换默认冷淡招呼为对应情绪的
      //  第一人称共情抚慰句。优先级（🆕 E148-刀一重排）：当日新解锁报告第一击
      //  （E112 收窄为仅当日）＞罗盘情绪（E123，隔日历史牌面静默时为 P2 主承接
      //  ）＞跨日锦囊问候（E113）＞E111 情境链。隔日报告档不再承接 P1 首句
      //  （E148-刀一根治隔日首句串台：合成器 isToday 硬门＋此处分支拆除双保险）。
      if (rr && freshReport) {
        // 当日新解锁 ⇒ 报告第一击（军令刀四）；🆕 E142-刀一：罗盘情绪同时在
        //  场 ⇒ 升级 P1+P2 串联首句（军令钦定「首句 P1+P2 丝滑串联」）；
        //  tier 归一化根修——写入侧年报档 'annual' 与消费端 '_yearly' 错位
        //  曾致模式落空跌 plain 兜底（主公产线实锤病灶①真根）。
        mode = (_e142Mood && normalizeReportKey(rr)) ? 'p1queue'
          : `${rr.category}_${normalizeReportTier(rr.tier)}` as HelloMode;
      } else if (_e142Mood) {
        mode = 'mood'; // 罗盘情绪在场 ⇒ 情绪共情第一击（E123 军令刀四；隔日牌面静默）
      } else {
        const lastDay = readLastChatDay(store);
        if (lastDay && lastDay < today) {
          mode = 'daily'; // ③ 跨自然日无当日新解锁 ⇒ 流转今日锦囊问候（军令刀四）
        } else {
          const day = today;
          const key = 'ks_familiar_firststrike_day';
          if (sessionStorage.getItem(key) === day) mode = 'plain'; // 当日已给过情境首语 ⇒ 不再给
          else _e1421MarkFirststrike = true; // 🆕 E142.1：写入侧效延迟到首语新发路径
        }
      }
      // ① E113-刀三：当日未过期会话档在场 ⇒ 复原全部历史（禁重复首句）
      //    🆕 E142.1-刀一（军令 2026-11-17）：严禁 setHelloMode('plain') 重置——
      //    复原分支吃存档问候模式（白名单净化，坏值 ⇒ 前置重算兜底）。存档仅
      //    单条 hello 消息时重写效应按正确模式重生首句＝首次开舱同文本；多条
      //    历史时存档首句原样置顶。绝对禁止跌回「我在呢。今天想聊点什么？」
      const sess = loadDailyChatSession(store, sig, today);
      const lastTs = (sess && sess.messages.length)
        ? Number(sess.messages[sess.messages.length - 1].timestamp) : 0;
      if (sess && sess.messages.length > 0 && !(freshReport && Number(rr.unlockedAt) > lastTs)) {
        setHelloMode((sess && (sess as { greetingMode?: HelloMode }).greetingMode) || mode);
        const _e144Restored = sessionToChatMsgs(sess);
        setMsgs(_e144Restored);
        // 🆕 E143-刀三：微标去重集合随会话档回填（白名单净化；旧档无字段 ⇒ 空集）
        const _e143Log = (sess as { badgeLog?: string[] }).badgeLog;
        badgeLogRef.current = Array.isArray(_e143Log) ? _e143Log.filter((x) => typeof x === 'string') : [];
        // 🆕 E144-刀三：复原分支重逢（≥6h 同日回访）——微标挂历史末条顶部
        //  （零改写历史文本零新增消息；E113「禁重复首句」铁律原样守备）。
        if (_e144Reunion && _e144Restored.length) {
          setReunionBadge({ id: _e144Restored[_e144Restored.length - 1].id });
        }
        return;
      }
      if (_e1421MarkFirststrike) {
        try { sessionStorage.setItem('ks_familiar_firststrike_day', today); } catch { /* 隐私模式 fail-soft */ }
      }
      setHelloMode(mode);
      const _e1421FirstLine = helloFor(mode);
      setMsgs([{ id: 'hello', role: 'assistant', text: _e1421FirstLine }]);
      // 🆕 E144-刀三（军令 2026-11-18）：跨日/久别重逢 ⇒ ✨ 微标挂首语气泡
      //  顶部（E143 同槽 11px 形制零新增卡片；首句语义骑 E113 问候链零破坏）。
      if (_e144Reunion) setReunionBadge({ id: 'hello' });
      // 🆕 E142.1-刀二：首句带名即计一次日配额（重写效应重生同句不再计数）
      if (nameGateRef.current && profileNameRef.current
        && _e1421FirstLine.includes(profileNameRef.current)) {
        try { bumpNameCallCount(store, today); } catch { /* fail-soft */ }
      }
    } catch {
      /* iOS 无痕模式存储抛错 ⇒ 首语照给（fail-soft） */
      const mode: HelloMode = greetingMode || 'plain';
      setHelloMode(mode);
      setMsgs([{ id: 'hello', role: 'assistant', text: helloFor(mode) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  /* 🏆 E113-刀三：消息变更实时落档（军令钦定——当日 24:00 固化，
   * 流式空壳空文本不落档；写满/无痕 fail-soft 静默） */
  useEffect(() => {
    if (!open || !msgs.length || !sessionDateRef.current) return;
    const store = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
    // 🆕 E142.1-刀一（军令 2026-11-17）：问候模式随档固化——关窗重开复原吃档
    //  模式（单 hello 档重写效应重生同文本；严禁跌回 plain 兜底）。
    // 🆕 E143-刀三（军令 2026-11-17）：微标去重集合随档固化（第 6 可选参——
    //  会话内单类型恰 1 次的持久真源；空集合不写字段）。每轮 send 埋点后
    //  badgeLogRef 即时更新 ⇒ 下次消息变更落档携带。
    saveDailyChatSession(store, sessionSigRef.current, sessionDateRef.current, msgs, helloMode, badgeLogRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, open, helloMode]);
  /* 🏆 E114-刀五（主公军令 2026-11-01）：SSE 吐字流状态上行——streaming 翻转
   * 即上报 HomeCard（灵宠切「共鸣倾听/欢快分享」姿态；关舱复位效应已把
   * streaming 归 false ⇒ 姿态平滑回落待机趴键态，禁常驻卡姿态） */
  useEffect(() => {
    onStreamingChange?.(streaming);
  }, [streaming, onStreamingChange]);
  useEffect(() => {
    if (!open) return;
    setMsgs((prev) => {
      if (!(prev.length === 1 && prev[0].id === 'hello')) return prev;
      return [{ id: 'hello', role: 'assistant', text: helloFor(helloMode) }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, name, helloMode]);

  /** 关舱复位（仅交互态； msgs 历史保留——🏆 E113-刀三 军令：重开按当日
   *  会话档复原全部聊天记录，禁首语复读；私密内容随当日 24:00 过期自动清理） */
  useEffect(() => {
    if (open) return;
    setDragY(0);
    setNotice(null);
    setStreaming(false);
    bufRef.current = '';
    if (throttleRef.current) { clearInterval(throttleRef.current); throttleRef.current = null; }
  }, [open]);

  /** 90ms 节流：把缓冲 delta 批量落到最后一条 assistant 消息上 */
  const startThrottle = useCallback(() => {
    if (throttleRef.current) return;
    throttleRef.current = setInterval(() => {
      const chunk = bufRef.current;
      if (!chunk) return;
      bufRef.current = '';
      setMsgs((prev) => {
        if (!prev.length) return prev;
        const next = prev.slice();
        const last = next[next.length - 1];
        if (last.role !== 'assistant') return prev;
        next[next.length - 1] = { ...last, text: last.text + chunk };
        return next;
      });
      const el = flowRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, THROTTLE_MS);
  }, []);

  const stopThrottle = useCallback(() => {
    if (throttleRef.current) { clearInterval(throttleRef.current); throttleRef.current = null; }
  }, []);

  useEffect(() => () => stopThrottle(), [stopThrottle]);

  const send = useCallback(async (raw: string) => {
    const text = String(raw || '').trim();
    if (!text || streaming) return;
    setNotice(null);
    const uid = `u-${Date.now()}`;
    const aid = `a-${Date.now()}`;
    setMsgs((prev) => [...prev, { id: uid, role: 'user', text }, { id: aid, role: 'assistant', text: '' }]);
    setWellnessSlot(null); // 🆕 E137：新轮次先清处方槽（meta 帧命中即重挂）
    setCalSlot(null); // 🆕 E144：新轮次先清日历锁槽（收口探测命中即重挂）
    setStreaming(true);
    bufRef.current = '';
    startThrottle();

    try {
      if (paidOk !== true) {
        setNotice(t('familiar.chatNeedUnlock'));
        setStreaming(false); stopThrottle();
        setMsgs((prev) => prev.filter((m) => m.id !== aid));
        return;
      }
      /* 🏆 E107-刀三（主公军令 2026-10-31）：客户端无 token 硬拦截拔除——
       * 旧「无 session ⇒ 先登录，我才能听见你说话」把沙盒匿名付讫用户（E99 直通
       * 不落 user_profiles）拦死在舱外（主公核验六问⑥实锤）。现：
       *   ① 有 session ⇒ 带 Bearer（服务端按 paid_plans 判权益）；
       *   ② 无 session ⇒ 随行合法灵宠档证明（body.familiar——readFamiliarRecord
       *      形状守卫，档案在场＝付费证明，E106-刀三首页熔断同构）匿名发流；
       *   ③ 401 兜底映射保留（live 态档案亦缺 ⇒ fail-closed 提示仍体面）。 */
      let token: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
      } catch { /* 无痕/断网 ⇒ 走灵宠档匿名绿道 */ }
      const famRec = readFamiliarRecord(
        (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null,
        FAMILIAR_LS_KEY
      );
      // 🏆 E109-刀一（主公军令 2026-10-30）：当次付费报告塔罗随行——读
      //    sessionStorage 持久化牌档（App.tsx 报告成功时写入，一盘一清），
      //    形状守卫后随 body 上行；服务端查表 fail-closed 优先绑定为本命核
      //    之上的唯一塔罗真值（拔「隐士」幽灵）；坏档/无档 ⇒ 不传 ⇒ 回退本命核。
      let reportTarot: { id: number; isReversed: boolean } | undefined;
      try {
        const rt = JSON.parse(sessionStorage.getItem('ks_compat_report_tarot') || 'null');
        if (rt && typeof rt === 'object' && Number.isInteger(rt.id) && rt.id >= 0 && rt.id <= 21) {
          reportTarot = { id: rt.id, isReversed: !!rt.isReversed };
        }
      } catch { /* 坏档忽略：服务端回退 E107 本命核 */ }
      // 🔒 只传对话 + 本命锚点 + 灵宠档证明；星盘与运势由服务端真值装配
      const bt = extractBirthTruth(window.location.search, window.localStorage);
      // 🏆 E112-刀二（主公军令 2026-11-01）：最近解锁付费报告随行（形状守卫后上行，
      //    服务端注入 prompt【主人最近解锁的报告】块——不只首语，多轮对话持续咬合）
      const recentReport = readRecentReport(
        (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null
      ) || undefined;
      // 🏆 E118-刀一/刀二（主公军令 2026-11-02）：姓名意图静默捕获——发送每句话
      //    先流经 extractUserNameIntent（中英正则＋假阳性黑名单熔断），命中即写
      //    永久档案（ks_familiar_profile_${chartSig} 永不过期）；displayName 随行
      //    上行，服务端 _e118DisplayName 形状守卫后注入 prompt IDENTITY 块。
      let displayName: string | undefined;
      let _e143NameFirst = false;
      try {
        const ls = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
        const captured = extractUserNameIntent(text);
        // 🆕 E143-刀三（军令 2026-11-17）：name_first 首次捕获判定（落档前档案
        //  为空＝首落档——先读 prev 再写，防复写误报首次）。
        const _e143PrevProfile = readUserNameProfile(ls, sessionSigRef.current);
        _e143NameFirst = !!(captured && ls && !_e143PrevProfile);
        if (captured && ls && writeUserNameProfile(ls, sessionSigRef.current, captured)) {
          profileNameRef.current = captured;
        }
        displayName = (readUserNameProfile(ls, sessionSigRef.current) || null)?.displayName || undefined;
      } catch { /* 隐私模式 ⇒ 无名上行（服务端回退无 IDENTITY 块） */ }
      // 🏆 E123-刀四：罗盘情绪上下文随行（2h 时效内每轮上行——服务端
      //  _e123ActiveMood 形状守卫后注入 prompt【User Emotional Context】块，
      //  多轮回复持续扣紧该情绪底色绝不跳戏；失效/无档 ⇒ 不传）
      let activeMood: string | undefined;
      try {
        const m = readActiveMood(sessionStorage);
        if (m) activeMood = m;
      } catch { /* 无痕 ⇒ 不传（服务端回退无情绪块） */ }
      // 🆕 E149-刀二（主公军令 2026-11-20）：last_micro_action 随行（形状/48h
      //  /死锁守卫在纯核内 fail-closed；服务端 _e149MicroAction 二次守卫后
      //  进 prompt 回访上下文块）。发送期顺带执行 P3 单次死锁归档（若首语
      //  曾产出 followedUp——军令「最多触发 1 次回访」）。
      // 🆕 E143-刀三（军令 2026-11-17）：显式记忆星光微标三触发判定——
      //  name_first＝首次落档姓名；p1_first＝P1 报告底牌在场（normalizeReportKey
      //  命中六档白名单）；mood_first＝罗盘情绪在场。单会话同类型恰 1 次
      //  （badgeLogRef 去重随会话档固化）；命中挂本轮 assistant 气泡顶部。
      let _e143BadgeType: 'name_first' | 'p1_first' | 'mood_first' | null = null;
      if (_e143NameFirst && shouldShowBadge(badgeLogRef.current, 'name_first')) _e143BadgeType = 'name_first';
      else if (recentReport && normalizeReportKey(recentReport) && shouldShowBadge(badgeLogRef.current, 'p1_first')) _e143BadgeType = 'p1_first';
      else if (activeMood && shouldShowBadge(badgeLogRef.current, 'mood_first')) _e143BadgeType = 'mood_first';
      if (_e143BadgeType) {
        badgeLogRef.current = recordBadge(badgeLogRef.current, _e143BadgeType);
        setBadgeOnMsg({ id: aid, type: _e143BadgeType });
        setAvatarBreathe(true); // 微标点亮 ⇒ 星光呼吸 1.5s
        try {
          appendResonanceLog(
            (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null,
            { kind: 'badge' });
        } catch { /* 隐私模式 fail-soft */ }
      }
      // 🆕 E143-刀三：灵犀默契累加（走心回复/情绪在场增益——纯核启发）＋跃迁
      //  星光呼吸；后台共振日志（chat_round＋followUp 非首击——仅计数零 PII）。
      try {
        const _e143Ls = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
        const _e143Gain = resonanceGainFromUserText(text) + (activeMood ? 1 : 0);
        const _e143Applied = applyBondDelta(bondStateRef.current, _e143Gain);
        bondStateRef.current = _e143Applied.state;
        setBondState(_e143Applied.state);
        writeSoulBondState(_e143Ls, _e143Applied.state);
        appendResonanceLog(_e143Ls, { kind: 'chat_round', followUp: firstStrikeRef.current !== true });
        if (_e143Applied.leveledUp) {
          setAvatarBreathe(true); // 默契跃迁 ⇒ 星光呼吸 1.5s
          appendResonanceLog(_e143Ls, { kind: 'bond' });
        }
      } catch { /* 隐私模式 fail-soft */ }
      // 🆕 E126-刀三（主公军令 2026-11-05 晚）：Geo-Locale 解耦——客户端时区
      //    随行（服务端 cf-ipcountry 缺席时兜底解析物理生活区；fail-soft：
      //    Intl 不可用/无痕 ⇒ 不传 ⇒ 服务端回退 E124 语言生活区零破坏）
      let timezone: string | undefined;
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) timezone = tz;
      } catch { /* Intl 缺席 ⇒ 不传 */ }
      // 🆕 E142-刀三（军令 2026-11-16）：终端时钟三件套实时构造随行（每次
      //  聊天请求都带——时钟同步不随轮次衰减；fail-soft 构造异常 ⇒ 不传）
      let clientTimeContext: { localISO: string; timezone: string; formattedLocalTime: string } | undefined;
      try {
        clientTimeContext = buildClientTimeContext(undefined, timezone, lang);
      } catch { clientTimeContext = undefined; }
      const body = {
        lang,
        relationMode,
        name,
        // 🆕 E129-刀三：会话首击标志（服务端 sessionOpen===true 严格判定 ⇒ 主动
        //  节律检索：未决事件回溯＋月相微仪式；非首击不传 ⇒ 服务端零查询零破坏）
        sessionOpen: firstStrikeRef.current === true ? true : undefined,
        // 🆕 E126-刀三：物理区域时区随行（服务端白名单 fail-closed）
        timezone,
        // 🆕 E142-刀三：用户终端时钟三件套随行（服务端形状守卫后注入 prompt）
        clientTimeContext,
        // 🆕 E142.1-刀二（军令 2026-11-17）：当日唤名配额本地计数随行（服务端
        //  取 max(服务端, 本地) 计有效值——本地/服务端双层记账军令口径）
        nameQuotaCount: (() => {
          try {
            return readNameCallCount(
              (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null,
              chatSessionDateKey());
          } catch { return 0; }
        })(),
        // 🏆 E123-刀四：罗盘情绪真值随行（服务端白名单 fail-closed）
        activeMood,
        // 🏆 E118-刀二：永久姓名档案随行（服务端查形状 fail-closed 后进 prompt）
        displayName,
        // 🏆 E112-刀二：最近解锁报告凭证随行（服务端查形状 fail-closed）
        recentReport,
        // 🆕 E149-刀二：L1 行动回访标记随行（48h 内且未归档才非空）
        lastMicroAction: (() => {
          try {
            const ls = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
            if (_e149P3ShownRef.current) {
              markMicroActionFollowedUp(ls, sessionSigRef.current);
              _e149P3ShownRef.current = false;
              return undefined;
            }
            return readMicroAction(ls, sessionSigRef.current) || undefined;
          } catch { return undefined; }
        })(),
        // 🏆 E109-刀一：当次报告塔罗（恋人牌等）随行绑定
        reportTarot,
        // 🏆 E107-刀三：合法 ks_familiar 档随行（服务端 fail-closed 形状校验后放行）
        familiar: (token || !famRec) ? undefined : {
          relationMode: String(famRec.profile.relation_mode || ''),
          chartSig: String(famRec.chartSig || ''),
          adoptedAt: String(famRec.adoptedAt || ''),
        },
        birth: bt ? {
          date: bt.birthDate, time: bt.birthTime || '', lat: bt.lat, lon: bt.lon, tz: bt.tz,
        } : undefined,
        messages: [...listRef.current, { id: uid, role: 'user', text }]
          .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.text))
          .map((m) => ({ role: m.role, content: m.text }))
          .slice(-8),
      };
      // 🆕 E129-刀三：首击标志消费即翻面（本舱后续消息不再携带——服务端
      //  仅在会话首击做节律检索，省去逐轮查询）
      firstStrikeRef.current = false;
      const res = await fetch('/api/familiar/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const map: Record<number, string> = {
          401: t('familiar.chatNeedLogin'),
          402: t('familiar.chatNeedUnlock'),
          429: t('familiar.chatTooFast'),
        };
        setNotice(map[res.status] || t('familiar.chatNetErr'));
        setMsgs((prev) => prev.filter((m) => m.id !== aid));
        setStreaming(false); stopThrottle();
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('no-stream');
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const ln of lines) {
          const s = ln.trim();
          if (!s.startsWith('data:')) continue;
          const payload = s.slice(5).trim();
          if (!payload) continue;
          try {
            const j = JSON.parse(payload);
            if (j.delta) bufRef.current += j.delta;
            // 🆕 E142.1-刀二（军令 2026-11-17）：done 帧服务端权威唤名计数回写
            //  （仅向上取 max——防服务端重启清零拉低本地记账；fail-soft）。
            if (j.done && Number.isFinite(j.nameQuota)) {
              try {
                syncNameCallCount(
                  (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null,
                  chatSessionDateKey(), Number(j.nameQuota));
              } catch { /* 隐私模式 fail-soft */ }
            }
            // 🆕 E147-刀四（军令 2026-11-19）：done 帧年鉴双门槛档案随行回写
            //  （服务端权威 {anchorAt, sessions}——懒回填锚＋蒸馏轨迹持久化；
            //  SoulChronicleCard 直读 ks_chronicle_state 判蓄能/启封；fail-soft）。
            if (j.done && j.chronicle && typeof j.chronicle === 'object') {
              try {
                const ls = (typeof window !== 'undefined' && window.localStorage)
                  ? window.localStorage : null;
                if (ls) {
                  const aOk = typeof j.chronicle.anchorAt === 'string'
                    && /^\d{4}-\d{2}-\d{2}/.test(j.chronicle.anchorAt);
                  const sNum = Number(j.chronicle.sessions);
                  const sOk = Number.isFinite(sNum) && sNum >= 0 && sNum <= 9999;
                  if (aOk || sOk) {
                    ls.setItem('ks_chronicle_state', JSON.stringify({
                      anchorAt: aOk ? j.chronicle.anchorAt : null,
                      sessions: sOk ? Math.floor(sNum) : 0,
                    }));
                  }
                }
              } catch { /* 隐私模式 fail-soft */ }
            }
            // 🆕 E149-刀二（主公军令 2026-11-20）：done 帧 microAction 静默写入
            //  （emotionSignal 命中时服务端随行 {emotion_key, action_summary,
            //  created_date}——异步写 localStorage 不阻塞流式、不渲染；
            //  48h 过期＋followed_up 单次死锁在纯核内执行；fail-soft）。
            if (j.done && j.microAction && typeof j.microAction === 'object') {
              try {
                writeMicroAction(
                  (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null,
                  sessionSigRef.current, j.microAction);
              } catch { /* 隐私模式 fail-soft */ }
            }
            // 🆕 E137-刀二（军令 2026-11-12）：meta 帧 wellnessRx 投影——chatQ3/
            //    养生语义触发时服务端引擎随流下发四维处方（形状守卫 fail-closed）。
            if (j.meta && j.meta.wellnessRx && isWellnessRxMeta(j.meta.wellnessRx)) {
              setWellnessSlot({ aid, rx: j.meta.wellnessRx });
            }
            // 🆕 E139-刀二（军令 2026-11-15）：meta 帧 wealthPrescription 投影——
            //    chatQ1/财富语义触发时服务端引擎随流下发五阶四维处方（形状守卫
            //    fail-closed；金融合规红线由引擎与 e139 闸门守备）。
            if (j.meta && j.meta.wealthPrescription && isWealthAdvisoryMeta(j.meta.wealthPrescription)) {
              setWealthSlot({ aid, rx: j.meta.wealthPrescription });
            }
            // 🏆 E115-刀三（主公军令 2026-11-02）：服务端代词违规弃流重试——
            //    reset 帧清空当前 assistant 流式文本（已显的违规代词文本整体作废，
            //    重试流从空壳续写重建，杜绝「他/她」倒错文本残留屏上）
            if (j.reset) {
              bufRef.current = '';
              setMsgs((prev) => {
                const next = prev.slice();
                const last = next[next.length - 1];
                if (last && last.role === 'assistant') next[next.length - 1] = { ...last, text: '' };
                return next;
              });
            }
            if (j.error) { setNotice(t('familiar.chatNetErr')); }
          } catch { /* 半包忽略 */ }
        }
      }
    } catch {
      setNotice(t('familiar.chatNetErr'));
    } finally {
      // 收尾：再 flush 一次残余，避免最后一帧丢字
      const tail = bufRef.current;
      bufRef.current = '';
      if (tail) {
        setMsgs((prev) => {
          if (!prev.length) return prev;
          const next = prev.slice();
          const last = next[next.length - 1];
          if (last.role !== 'assistant') return next;
          next[next.length - 1] = { ...last, text: last.text + tail };
          return next;
        });
      }
      stopThrottle();
      setStreaming(false);
      setMsgs((prev) => prev.filter((m) => m.text || m.role === 'user'));
      /* 🏆 E121-SCRIBE-SLOT 刀一：流式收口（!streaming）后意图探测——本轮用户
       * 文本 detectScribeIntent 命中（apology 优先于 longing）⇒ 激活微缩密函
       * 插槽（绑定本轮 aid，紧随该条 assistant 气泡下方渲染）；未命中 ⇒ null
       * （fail-closed 严禁无意图强推——寒暄一律普通气泡）。 */
      const scribeIntent = detectScribeIntent(text);
      setScribeSlot(scribeIntent ? { aid, type: (scribeIntent.type as ScribeAmuletType) } : null);
      /* 🏆 E124-LIFESTYLE-MUSE 刀二：密函静默 ⇒ 生活方式意图网接管（STYLE/
       * ROADTRIP 六语捕获；fail-closed 未命中一律 null 严禁强推）。两槽互斥：
       * 密函优先（吵架/破冰为第一诉求），生活卡仅在密函静默时挂载。 */
      const lifestyleIntent = scribeIntent ? null : detectLifestyleIntent(text);
      setLifestyleSlot(lifestyleIntent ? { aid, type: (lifestyleIntent.type as LifestyleCardType) } : null);
      /* 🆕 E144-刀四（军令 2026-11-18）＋E144.1-刀二（补刀军令 2026-11-18）：
       * 天时日程锁双保险触发——①精确时窗优先（detectAstralCalendarEvent
       * 有钟点时窗，原 fail-closed 逻辑不动）；②锁A 快捷胶囊直通：本轮用户
       * 文本＝chatQ1「💰 今日财运与破财避坑」/ chatQ3「🔮 结合星盘的今日指引」
       * 胶囊文案 ⇒ 100% 必出微胶囊（Q1 ⇒ caution / Q3 ⇒ lucky，lang 无关);
       * ③锁B 语义宽域命中（用户或回复文本命中财运/破财/避坑/冲动消费/指引/
       * 吉时/日程/约见等）——②③无钟点 ⇒ 纯核按当前本地时间推算默认提醒窗
       * （defaultAstralWindow 午后 14-16/晚间 20-22 高发窗）；回复核心句入备注。 */
      try {
        const _e144LastA = [...listRef.current].reverse().find((x) => x.id === aid && x.role === 'assistant' && x.text);
        let _e144CalEv = _e144LastA ? detectAstralCalendarEvent(_e144LastA.text) : null;
        if (!_e144CalEv) {
          const _e144UserText = String(text || '').trim();
          const _e144PillKind = _e144UserText === t('familiar.chatQ1') ? 'caution'
            : _e144UserText === t('familiar.chatQ3') ? 'lucky' : null;
          const _e144Intent = _e144PillKind
            || detectAstralCalendarIntent(_e144UserText)
            || (_e144LastA ? detectAstralCalendarIntent(_e144LastA.text) : null);
          if (_e144PillKind || _e144Intent) {
            _e144CalEv = { ...defaultAstralWindow(new Date().getHours()), kind: _e144Intent || 'lucky' };
          }
        }
        setCalSlot(_e144CalEv ? {
          aid,
          ev: _e144CalEv,
          note: _e144LastA ? String(_e144LastA.text || '').slice(0, 200) : '',
          dateISO: chatSessionDateKey(new Date(Date.now() + _e144CalEv.dateOffset * 86400000)),
        } : null);
      } catch { setCalSlot(null); }
      const el = flowRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [paidOk, streaming, t, lang, relationMode, name, startThrottle, stopThrottle]);

  /* 🏆 E137.1-RX-MONOGRAPH-DRAWER（主公军令 2026-11-13）：手札追问自动发送——
   *   pendingAsk 非空且舱已开且非流式中 ⇒ 自动 send（追问句直接作为用户消息
   *   上屏）随后回调清空（单次单发防重复）。舱未开/流式中挂起等待，不丢消息。 */
  useEffect(() => {
    const msg = String(pendingAsk || '').trim();
    if (!msg || !open || streaming) return;
    onPendingAskConsumed?.();
    void send(msg);
  }, [pendingAsk, open, streaming, send, onPendingAskConsumed]);

  /* ── 下滑手势收起（触屏；鼠标拖拽不接管，避免桌面误触） ── */
  /* 🆕 E143-刀三：星光呼吸复位（1.5s 动画＋100ms 缓冲自动熄灭——纯 CSS
   *  关键帧零算力，App.css ksAstralBreathe） */
  useEffect(() => {
    if (!avatarBreathe) return;
    const tm = window.setTimeout(() => setAvatarBreathe(false), 1600);
    return () => window.clearTimeout(tm);
  }, [avatarBreathe]);

  /* 🆕 E144-刀五：✓ 已复制 1.5s 内联闪现复位 */
  useEffect(() => {
    if (!copiedProxy) return;
    const tm = window.setTimeout(() => setCopiedProxy(null), 1500);
    return () => window.clearTimeout(tm);
  }, [copiedProxy]);
  /* 🆕 E144-刀五（军令 2026-11-18）：嘴替行轻点复制——剥壳话术入剪贴板
   *  （clipboard API 主＋execCommand 兜底 http 环境）＋默契 +5（星光呼吸）。 */
  const handleProxyCopy = useCallback((msgId: string, idx: number, content: string) => {
    const ok = ((): boolean => {
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          void navigator.clipboard.writeText(content).catch(() => { /* noop */ });
          return true;
        }
      } catch { /* fallthrough */ }
      try {
        const ta = document.createElement('textarea');
        ta.value = content;
        ta.setAttribute('style', 'position:fixed;top:0;left:0;opacity:0;');
        document.body.appendChild(ta);
        ta.select();
        const r = document.execCommand('copy');
        ta.remove();
        return r;
      } catch { return false; }
    })();
    if (!ok) return;
    setCopiedProxy({ id: msgId, idx });
    try {
      const ls = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
      const applied = applyBondDelta(bondStateRef.current, 5);
      bondStateRef.current = applied.state;
      setBondState(applied.state);
      writeSoulBondState(ls, applied.state);
      setAvatarBreathe(true); // 默契 +5 ⇒ 星光呼吸 1.5s
      appendResonanceLog(ls, { kind: 'bond' });
    } catch { /* 隐私模式 fail-soft */ }
  }, []);
  /* 🆕 E144-刀四（军令 2026-11-18）：日历锁轻点——RFC-5545 .ics Blob 下载
   *  （VALARM 15min 提前提醒；文件名钦定 KindredSouls-AstralLock-YYYYMMDD.ics）
   *  ＋默契 +5。 */
  const handleCalendarLock = useCallback(() => {
    const slot = calSlot;
    if (!slot || !slot.ev) return;
    try {
      const summary = calendarEventSummary(lang, slot.ev.kind);
      // 🆕 E145-刀六（军令 2026-11-19）：锁屏日历富字段——标题带灵宠名与核心
      // 动作／LOCATION 宜忌／DESCRIPTION 三段＋回流链接／URL 字段（纯核单源）。
      const rich = buildAstralCalendarRichFields(lang, slot.ev.kind, slot.note, slot.ev);
      const ics = buildAstralCalendarICS({
        dateISO: slot.dateISO,
        startHH: slot.ev.startHH, startMM: slot.ev.startMM,
        endHH: slot.ev.endHH, endMM: slot.ev.endMM,
        summary, description: (slot.note || summary),
        uidSalt: sessionSigRef.current,
        ...(rich ? {
          lang,
          whisperName: name,
          actionCore: rich.actionCore,
          fortuneLine: rich.fortuneLine,
          tiLine: rich.tiLine,
          actionLine: rich.actionLine,
          whisperLine: rich.whisperLine,
        } : {}),
      });
      if (!ics) return;
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = astralCalendarFilename(slot.dateISO);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      const ls = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
      const applied = applyBondDelta(bondStateRef.current, 5);
      bondStateRef.current = applied.state;
      setBondState(applied.state);
      writeSoulBondState(ls, applied.state);
      setAvatarBreathe(true);
      appendResonanceLog(ls, { kind: 'bond' });
    } catch { /* 下载/存储 fail-soft */ }
  }, [calSlot, lang]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0]?.clientY ?? null; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const dy = (e.touches[0]?.clientY ?? 0) - touchStartY.current;
    if (dy > 0) setDragY(dy);
  };
  const onTouchEnd = () => {
    if (dragY > 110) onClose();
    setDragY(0);
    touchStartY.current = null;
  };

  if (!open) return null;

  /* 🏆 E135-刀三（主公军令 2026-11-11）：提示条三精二——旧情绪安抚药丸（familiar.chatQ2）
   *    六语退役；chatQ1（今日财运与破财避坑）原样保留；
   *    chatQ3 凝练为「结合星盘的今日指引」（六语军令钦定词表逐字）。
   * 🆕 E142.1-刀一（军令 2026-11-17）：P1 话题胶囊前置退役——首句已自然引导
   *    姻缘/财富话题，再加「💑 姻缘与塔罗」胶囊属画蛇添足（军令病灶②）；
   *    胶囊栏恒为 chatQ1/chatQ3 基底两颗（e133 钦定词表铁律原样）。 */
  const pills = [t('familiar.chatQ1'), t('familiar.chatQ3')];
  const avatar = ip === 'Milo' ? miloSprite : sophiaSprite;

  return createPortal(
    /* 🐾 E77（主公亲令 2026-10-20）: 桌面悬浮舱按**角色朝向**左右镜像 ——
       Milo 脸朝右 ⇒ 舱居右下（顺视线）；Sophia 脸朝左 ⇒ 舱居左下（同理），
       并与其左侧「今日运势锦囊」气泡形成左右呼应。
       `data-familiar` 是唯一定位真源（禁止按名字串猜 IP，名字可被用户自定义）。 */
    <div
      className="ks-chat-layer"
      data-familiar={ip === 'Milo' ? 'milo' : 'sophia'}
      role="dialog" aria-modal="true" aria-label={name}
    >
      <div className="ks-chat-mask" onClick={onClose} />
      <div
        className={`ks-chat-sheet${resolveCircadianPhase(circadianClock.hour, circadianClock.minute) === 'night' ? ' ks-circadian-night' : ''}`}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="ks-chat-grab" aria-hidden="true" />
        {/* 🆕 E144.1-刀一（补刀军令 2026-11-18）：头部双行彻底分层——
            第一行 .ks-chat-head-row：头像＋灵宠名称（左）与 ✦灵犀星胶囊＋✕（右）
            flex space-between 严格水平对齐；第二行 .ks-chat-status 独立整行
            占满宽度——根治灵犀星下沉挤压第二行致「晨曦星轨」ellipsis 截断的
            病灶（主公实测图实锤）；Sophia/Milo 共用同一结构零分叉。 */}
        <div className="ks-chat-head">
          <div className="ks-chat-head-row">
            <img
              className={`ks-chat-avatar${avatarBreathe ? ' ks-chat-avatar-breathe' : ''}`}
              src={avatar} alt="" draggable={false}
            />
            <div className="ks-chat-name">{name}</div>
            {/* 🏆 E112-刀三：灵犀星徽章归位——与标题行平行靠右（✕ 左侧），
                深空黑金轻奢胶囊 [ ✦ 灵犀星: N ]；首页按钮下方旧徽章已拆除。
                🏆 E113-刀五（军令钦定静默化）：2.0 兑换功能未就绪——胶囊零点击
                绑定（pointer-events:none 物理穿透），cursor:default 拔手型指针，
                悬浮提示 title 走 i18n（starTooltip：累计可在 2.0 版本兑换专属
                灵魂兽装扮——锁定 2.0 空间伏笔，防误触空框）。 */}
            <div
              className="ks-chat-star"
              data-testid="familiar-starlight"
              title={t('familiar.starTooltip')}
            >
              {t('familiar.starBadge', { count: Number(starCount) || 0 })}
            </div>
            <button type="button" className="ks-chat-close" onClick={onClose} aria-label={t('familiar.chatClose')}>✕</button>
          </div>
          {/* 🆕 E143-刀三（军令 2026-11-17）：灵犀共生默契状态栏前缀——
              六语自容（零 i18n 键扰动）；Lv.1/2＝灵犀默契 Lv.N 档位称号，
              Lv.3 满阶＝满阶共生称号（军令示例形态「● 灵犀默契 Lv.2 · …」）。
              🆕 E144-刀二（军令 2026-11-18）：昼夜色温前缀拼接——
              「灵犀默契 Lv.2 星轨同频 · 78/100 · 🌙 星夜守护磁场」形态。
              🆕 E144.1-刀一：独立第二行整行宽度（零遮挡零截断）。
              🆕 E145-刀一（军令 2026-11-19）：状态栏精简去冗——右侧
              「{{name}} 正在感应你的星盘磁场…」尾缀整行退役（主公三图
              实锤截断病灶；灵宠名已在第一行左侧，第二行仅留默契分＋
              昼夜词条，双视口零截断；chatStatus 六语键同批退役）。 */}
          <div className="ks-chat-status">
            <span className="ks-chat-dot" aria-hidden="true" />
            <span className="ks-chat-bond" data-testid="soul-bond-status">
              {composeCircadianStatus(bondStatusBarLabel(lang, bondState), circadianClock.hour, circadianClock.minute, lang)}
            </span>
          </div>
        </div>

        <div className="ks-chat-flow" ref={flowRef}>
          {msgs.map((m) => (
            <div key={m.id} className={`ks-chat-bubble ks-chat-${m.role}`}>
              {/* 🆕 E143-刀三（军令 2026-11-17）：显式记忆星光微标——本轮回复
                  气泡顶部 11px 毛玻璃星光胶囊（六语自容；单会话同类型恰 1 次；
                  fail-closed 坏类型/白名单外永不挂）。 */}
              {m.role === 'assistant' && badgeOnMsg && badgeOnMsg.id === m.id && (
                <div className="ks-chat-badge" data-testid="astral-memory-badge">
                  {badgeLabel(badgeOnMsg.type, lang)}
                </div>
              )}
              {/* 🆕 E144-刀三（军令 2026-11-18）：跨日/久别重逢微标（✨ 六语自容；
                  E143 微标同槽同 11px 形制零新增卡片）。 */}
              {m.role === 'assistant' && reunionBadge && reunionBadge.id === m.id && (
                <div className="ks-chat-badge" data-testid="astral-reunion-badge">
                  {astralReunionBadgeLabel(lang)}
                </div>
              )}
              {/* 🆕 E144-刀五（军令 2026-11-18）：assistant 气泡逐行渲染——
                  ▫️ 嘴替行（parseProxyLine 命中）⇒ 行级轻点复制（✓ 已复制
                  1.5s 内联闪现＋默契 +5）；其余行原样（空行保白维持 \n\n 留白）；
                  user 气泡仍走 pre-wrap 原文（零扰动）。 */}
              {m.role === 'assistant' && m.text
                ? m.text.replace(/\n+$/, '').split('\n').map((line, idx) => {
                    const proxy = parseProxyLine(line);
                    if (proxy) {
                      const isCopied = !!(copiedProxy && copiedProxy.id === m.id && copiedProxy.idx === idx);
                      return (
                        <div
                          key={`${m.id}-proxy-${idx}`}
                          className="ks-chat-proxy-line"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleProxyCopy(m.id, idx, String(proxy.content))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleProxyCopy(m.id, idx, String(proxy.content));
                            }
                          }}
                        >
                          <span className="ks-chat-proxy-text">{line}</span>
                          {isCopied && (
                            <span className="ks-chat-copy-done" data-testid="proxy-copy-done">
                              {copyDoneLabel(lang)}
                            </span>
                          )}
                        </div>
                      );
                    }
                    return <div key={`${m.id}-line-${idx}`}>{line || '\u00A0'}</div>;
                  })
                : m.text}
              {m.role === 'assistant' && m.text === '' && streaming && (
                <span className="ks-chat-typing" aria-label={t('familiar.chatThinking')}>
                  <i /><i /><i />
                </span>
              )}
            </div>
          ))}
          {/* 🏆 E121-SCRIBE-SLOT 刀一：密函微缩插槽——仅在本轮 assistant 回复
              完整落地（流结束＋文本非空＋id 精确匹配）时渲染；fail-closed：
              白名单外 type / 模板缺失 ⇒ AmuletScribeSlotCard 自身返 null。 */}
          {scribeSlot && !streaming && (() => {
            const last = msgs[msgs.length - 1];
            if (!last || last.role !== 'assistant' || last.id !== scribeSlot.aid || !last.text) return null;
            return (
              /* 🏆 E135-刀二：密函内框卡左对齐——与路书卡/气泡/提示条同一左垂线（Δ=0px） */
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
                <AmuletScribeSlotCard type={scribeSlot.type} lang={lang} onOpen={setAmuletPreview} />
              </div>
            );
          })()}
          {/* 🏆 E124-LIFESTYLE-MUSE 刀四：生活卡微缩插槽——E121 同构（本轮
              assistant 落地＋id 精确匹配才渲染；fail-closed：白名单外 type /
              模板缺失 ⇒ LifestyleMuseSlotCard 自身返 null；密函槽在场时互斥不渲）。 */}
          {lifestyleSlot && !scribeSlot && !streaming && (() => {
            const last = msgs[msgs.length - 1];
            if (!last || last.role !== 'assistant' || last.id !== lifestyleSlot.aid || !last.text) return null;
            return (
              /* 🏆 E135-刀二（主公军令 2026-11-11）：2.5D 路书卡左对齐——内框卡左沿
                 与下方提示条胶囊左沿 getBoundingClientRect().left Δ=0px（拔 flex-end
                 右挂造成的桌面端 89px 左豁口）。 */
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
                <LifestyleMuseSlotCard type={lifestyleSlot.type} lang={lang} onOpen={setLifestylePreview} />
              </div>
            );
          })()}
          {/* 🆕 E137-刀二（军令 2026-11-12）：星盘时令能量处方卡插槽——本轮
              assistant 落地＋id 精确匹配才渲染（E124 同构；fail-closed：meta 帧
              wellnessRx 形状不全 ⇒ 永不挂载零破坏）。零收银红线：卡内零价格符号
              零促销词（e137 闸门全量扫杀）。 */}
          {wellnessSlot && !streaming && (() => {
            const last = msgs[msgs.length - 1];
            if (!last || last.role !== 'assistant' || last.id !== wellnessSlot.aid || !last.text) return null;
            return (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
                <WellnessRxSlotCard wellness={wellnessSlot.rx} />
              </div>
            );
          })()}
          {/* 🆕 E139-刀二（军令 2026-11-15）：星盘财商与守财罗盘卡插槽——E137
              同构（本轮 assistant 落地＋id 精确匹配才渲染；fail-closed：meta 帧
              wealthPrescription 形状不全 ⇒ 永不挂载零破坏）。金融合规红线：卡内
              零个股代码零银行品牌零价格符号（e139 闸门全量扫杀）；主按钮灵宠
              真名追问 ⇒ send 直发（流式中禁点防重入）。 */}
          {wealthSlot && !streaming && (() => {
            const last = msgs[msgs.length - 1];
            if (!last || last.role !== 'assistant' || last.id !== wealthSlot.aid || !last.text) return null;
            return (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
                <WealthAdvisorySlotCard
                  wealth={wealthSlot.rx}
                  disabled={streaming}
                  onAsk={(msg) => { void send(msg); }}
                />
              </div>
            );
          })()}
          {/* 🆕 E144-刀四（军令 2026-11-18）：天时日程锁内联微胶囊——本轮回复
              落地＋id 精确匹配才渲染（复用 .ks-chat-badge 11px 毛玻璃形制零
              新增卡片）；轻点 ⇒ RFC-5545 .ics 下载（VALARM 15min）＋默契 +5。 */}
          {calSlot && !streaming && (() => {
            const last = msgs[msgs.length - 1];
            if (!last || last.role !== 'assistant' || last.id !== calSlot.aid || !last.text) return null;
            return (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
                <button
                  type="button"
                  className="ks-chat-badge ks-chat-cal-pill"
                  data-testid="astral-calendar-lock"
                  onClick={handleCalendarLock}
                >
                  {calendarLockPillLabel(lang)}
                </button>
              </div>
            );
          })()}
          {/* ⚖️ E130（主公军令 2026-11-09）：E129 递卡按钮整块清退——
              对话流零付费卡零价格签（神圣陪伴净土）。 */}
          {notice && <div className="ks-chat-notice">{notice}</div>}
        </div>

        <div className="ks-chat-pills">
          {pills.map((p) => (
            <button key={p} type="button" className="ks-chat-pill" onClick={() => send(p)} disabled={streaming}>{p}</button>
          ))}
        </div>

        {/* 🧩 E68：输入栏为独立微组件 —— 打字不触发对话流/毛玻璃重渲染 */}
        <MemoChatInputBar
          streaming={streaming}
          placeholder={t('familiar.chatPlaceholder')}
          micTitle={t('familiar.chatMicSoon')}
          sendLabel={t('familiar.chatSend')}
          onSend={send}
        />
      </div>
      {/* ⚖️ E130：羊皮卷长卷＋收银托盘两弹层 JSX 整块清退
          （付费动作回归 WealthPaywall 专门付费墙页面）。 */}
      {/* 🏆 E121-SCRIBE-SLOT 刀二：全屏 1080×1748 Canvas 大图预览弹层
          （fixed 层独立于抽屉舱——遮罩点击/关闭钮收起；保存走 a[download]；
          宿主落款取 E118 用户名档案——有名字才渲染，无名字零破坏） */}
      <AmuletPreviewModal
        type={amuletPreview}
        lang={lang}
        hostName={profileNameRef.current || undefined}
        onClose={() => setAmuletPreview(null)}
      />
      {/* 🏆 E124-LIFESTYLE-MUSE 刀四：生活卡全屏 1080×1748 大图预览弹层
          （E121 同构——保存走 a[download] 军令文件名
          KindredSouls-Style/Roadtrip-YYYYMMDD.png；宿主落款取 E118 用户名档案） */}
      <LifestylePreviewModal
        type={lifestylePreview}
        lang={lang}
        hostName={profileNameRef.current || undefined}
        onClose={() => setLifestylePreview(null)}
      />
    </div>,
    document.body
  );
};

export default FamiliarChatSheet;
