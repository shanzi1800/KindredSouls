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
// @ts-ignore —— userNameMemory.mjs 纯 JS 逻辑核（形状由 E118 闸门守备）
import { extractUserNameIntent, readUserNameProfile, writeUserNameProfile, prependUserName } from '../lib/userNameMemory.mjs';
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
import { AmuletScribeSlotCard, AmuletPreviewModal } from './companion/AmuletScribeSlot';
import type { ScribeAmuletType } from './companion/AmuletScribeSlot';
// 🏆 E124-LIFESTYLE-MUSE 刀四（主公军令 2026-11-05）：生活卡微缩插槽＋
//    1080×1748 大图预览弹层（Aura Style Capsule / Soul Roadtrip Guide）。
import { LifestyleMuseSlotCard, LifestylePreviewModal } from './companion/LifestyleMuseSlot';
import type { LifestyleCardType } from './companion/LifestyleMuseSlot';
// 🆕 E129-刀四（军令 2026-11-09）：羊皮纸星轨长卷＋首页内嵌暗金支付托盘——
//    对话流递卡（三七开剧透）⇒ 就地解锁（零跳出付费闭环＝军令最高原则）。
import { SacredScrollModal } from './reports/SacredScrollModal';
import type { SacredSection } from './reports/SacredScrollModal';
import { InSituPaymentSheet } from './checkout/InSituPaymentSheet';

export type FamiliarIp = 'Milo' | 'Sophia';

/** 🆕 E129-刀四：长卷递卡六语标签（自容字典——零 i18n 新键铁律） */
const SCROLL_OFFER_LABEL: Record<string, string> = {
  zh: '本月专属星轨长卷', en: 'Your Sacred Monthly Scroll', fr: 'Parchemin Sacré du Mois',
  es: 'Pergamino Sagrado del Mes', th: 'ม้วนดวงดาวประจำเดือน', vi: 'Cuộn Thiên Kinh Tháng Này',
};
const SCROLL_OFFER_HINT: Record<string, string> = {
  zh: '点开 · 前三成免费开卷', en: 'Tap · first 30% free', fr: 'Touchez · 30% offerts',
  es: 'Toca · 30% gratis', th: 'แตะ · เปิดอ่านฟรี 30%', vi: 'Chạm · 30% đầu miễn phí',
};

/** 🏆 E112-刀二：开场首语九分支——六档报告第一击（love/wealth × core/monthly/
 *  annual）＋E111 情境三分支（sweet/soothe/plain）；
 *  🏆 E113-刀四：新增 daily 分支——跨自然日无当日新解锁 ⇒ 流转今日幸运锦囊
 *  问候（{{color}}/{{num}} 插值真值来自 dailyFortune 确定性核）。
 *  🏆 E123-刀四：新增 mood 分支——罗盘情绪记忆（ks_active_mood 当日＋2h
 *  时效命中）⇒ 5 情绪×6 语第一人称共情抚慰首句（军令钦定句式逐字）。 */
type HelloMode =
  | 'sweet' | 'soothe' | 'plain' | 'daily' | 'mood'
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

const FamiliarChatSheet: React.FC<Props> = ({ open, onClose, ip, name, relationMode, lang, paidOk, greetingMode, starCount, onStreamingChange }) => {
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
  const [lifestylePreview, setLifestylePreview] = useState<LifestyleCardType | null>(null);
  /* 🆕 E129-刀四（军令 2026-11-09）：星轨长卷三态——递卡开卷 / 支付托盘 /
   *  解锁态（本会话沙盒付讫 ⇒ 即刻翻面＝DoD 断言 3「状态机即刻生效」；
   *  最近解锁凭证含财富月报 ⇒ 开舱即已解锁）。真月报文本经
   *  /api/wealth-oracle/stream 拉取（付费态真值；拉取失败 ⇒ 六语预览兜底）。 */
  const [scrollOpen, setScrollOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [scrollUnlocked, setScrollUnlocked] = useState(false);
  const [scrollSections, setScrollSections] = useState<SacredSection[]>([]);
  const [scrollLoading, setScrollLoading] = useState(false);

  const flowRef = useRef<HTMLDivElement | null>(null);

  /* ═══ 🆕 E129-刀四：星轨长卷内容核 ═══
   * 预览段（未付费）：六语自容——只述长卷内含什么（总运气场/行星交角/
   * 关键吉日/避坑时辰的章题导言），**绝不伪造任何占星断言**（真值纪律）。
   * 付费解锁态：调 /api/wealth-oracle/stream（reportType=monthly，契约与
   * WealthReportPage 同源）拉真实月报全文切分章节；402/异常 ⇒ 预览兜底。 */
  const SCROLL_PREVIEW: Record<string, SacredSection[]> = {
    zh: [
      { title: '本月总运气场', body: '开卷即见本月整体能量流向：宇宙行星交角如何在你头顶织出这张星轨图——先读总览，再入细节。' },
      { title: '行星交角趋势', body: '木星与土星的拉锯、金水的顺逆，每一组交角都对应你本月的一段呼吸节奏。' },
      { title: '感情关键摊牌吉日', body: '哪几天适合把心里那句话说出口——章节已备好（待解锁）。' },
      { title: '财务逆风避坑时辰', body: '本月最需要捂紧钱包的窗口，与你该出手捡漏的良辰（待解锁）。' },
    ],
    en: [
      { title: 'Monthly Aura Field', body: 'The overall energy flow of your month — how the planetary angles weave this star-trail above you. Overview first, details after.' },
      { title: 'Planetary Angle Trends', body: 'Jupiter and Saturn at tug-of-war, Venus and Mercury in spin — each angle maps to a rhythm of your month.' },
      { title: 'Key Love Reckoning Days', body: 'The days to finally say what\'s in your heart — chapter awaits (sealed).' },
      { title: 'Financial Headwind Windows', body: 'When to hold your purse tight, and when to strike — chapter awaits (sealed).' },
    ],
    fr: [
      { title: 'Champ d\'énergie du mois', body: 'Le flux global de votre mois — comment les angles planétaires tissent ce ciel au-dessus de vous.' },
      { title: 'Tendances des angles', body: 'Jupiter contre Saturne, Vénus et Mercure en danse — chaque angle épouse un rythme de votre mois.' },
      { title: 'Jours-clés du cœur', body: 'Les jours où dire enfin ce que vous gardez au fond — chapitre scellé.' },
      { title: 'Fenêtres financières à éviter', body: 'Quand serrer la bourse, quand saisir l\'aubaine — chapitre scellé.' },
    ],
    es: [
      { title: 'Campo de energía mensual', body: 'El flujo general de tu mes — cómo los ángulos planetarios tejen este cielo sobre ti.' },
      { title: 'Tendencias de los ángulos', body: 'Júpiter y Saturno en tensión, Venus y Mercurio en giro — cada ángulo marca un ritmo de tu mes.' },
      { title: 'Días clave del corazón', body: 'Los días para decir por fin lo que callas — capítulo sellado.' },
      { title: 'Ventanas financieras a vigilar', body: 'Cuándo cerrar la cartera y cuándo aprovechar — capítulo sellado.' },
    ],
    th: [
      { title: 'พลังงานรวมประจำเดือน', body: 'ภาพรวมพลังงานของเดือนนี้ — มุมดาวเคราะห์ถักทอดั่งฟ้าเหนือคุณอย่างไร' },
      { title: 'แนวโน้มมุมดาว', body: 'พฤหัสกับเสาร์เสี่ยงแรง ศุกร์กับพุธหมุนวน — ทุกมุมสัมพันธ์กับจังหวะชีวิตเดือนนี้' },
      { title: 'วันสำคัญของหัวใจ', body: 'วันที่ควรพูดสิ่งที่เก็บไว้ในใจ — บทนี้ผนึกไว้' },
      { title: 'ช่วงเวลาการเงินที่ต้องระวัง', body: 'เมื่อไรต้องรัดสายกระเป๋า เมื่อไรควรคว้าโอกาส — บทนี้ผนึกไว้' },
    ],
    vi: [
      { title: 'Trường năng lượng tháng', body: 'Dòng chảy tổng thể của tháng — các góc hành tinh dệt nên bức thiên đồ trên đầu bạn ra sao.' },
      { title: 'Xu hướng góc hành tinh', body: 'Mộc tinh với Thổ tinh giằng co, Kim tinh với Thủy tinh luân chuyển — mỗi góc ứng một nhịp tháng của bạn.' },
      { title: 'Ngày then chốt của tim', body: 'Những ngày nên nói ra điều giấu kín — chương này còn niêm phong.' },
      { title: 'Khung giờ tài chính cần né', body: 'Khi nào phải túm chặt ví, khi nào nên ra tay — chương này còn niêm phong.' },
    ],
  };

  /** E129：真月报拉取（付费态）——流式契约与 WealthReportPage 同源
   *  （data: {text} 快照/增量帧＋[DONE]；startsWith 快照对齐防阶梯重复）。 */
  const fetchMonthlySections = async (): Promise<SacredSection[] | null> => {
    try {
      const bt = extractBirthTruth(window.location.search, window.localStorage);
      if (!bt) return null;
      let token: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
      } catch { /* 匿名 ⇒ 服务端绿道/权益闸自判 */ }
      const res = await fetch('/api/wealth-oracle/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          birthDate: bt.birthDate, birthTime: bt.birthTime || '',
          lat: bt.lat, lon: bt.lon, tz: bt.tz,
          lang, reportType: 'monthly',
        }),
      });
      if (!res.ok || !res.body) return null; /* 402 权益不足/异常 ⇒ 预览兜底 */
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          let parsed: { text?: string; error?: unknown } | null = null;
          try { parsed = JSON.parse(dataStr); } catch { continue; }
          if (!parsed || typeof parsed.text !== 'string' || !parsed.text) continue;
          if (full && parsed.text.startsWith(full)) full = parsed.text; /* 全量快照 */
          else full += parsed.text;                                     /* 增量 */
        }
      }
      if (full.trim().length < 200) return null; /* 终稿过短 ⇒ 视为失败兜底 */
      /* 切分章节：'#'/'##' 标题行成章；无标题 ⇒ 按空行分段成块 */
      const sections: SacredSection[] = [];
      let curTitle = '';
      let curBody: string[] = [];
      const flush = () => {
        const body = curBody.join('\n').trim();
        if (curTitle || body) sections.push({ title: curTitle || '✦', body });
        curTitle = ''; curBody = [];
      };
      for (const line of full.split('\n')) {
        const t = line.trim();
        const m = t.match(/^#{1,3}\s*(.+)$/);
        if (m) { flush(); curTitle = m[1].trim().slice(0, 40); }
        else if (t) curBody.push(t);
      }
      flush();
      return sections.length ? sections : null;
    } catch {
      return null; /* fail-soft：预览兜底 */
    }
  };

  /** E129：开卷——解锁态拉真月报（加载中指示）；未解锁 ⇒ 六语预览即卷。 */
  const openScroll = async () => {
    setScrollOpen(true);
    if (scrollUnlocked) {
      setScrollLoading(true);
      setScrollSections(SCROLL_PREVIEW[lang] || SCROLL_PREVIEW.en);
      const real = await fetchMonthlySections();
      setScrollSections(real || (SCROLL_PREVIEW[lang] || SCROLL_PREVIEW.en));
      setScrollLoading(false);
    } else {
      setScrollSections(SCROLL_PREVIEW[lang] || SCROLL_PREVIEW.en);
    }
  };

  /** E129：沙盒付讫回调（InSituPaymentSheet onGranted）——状态机即刻翻面
   *  （DoD 断言 3）；翻面即拉真月报（长卷金芒绽放全文解密）。 */
  const handleScrollGranted = (plan: string) => {
    console.log(`[E129] 长卷就地解锁 plan=${plan}（状态机即刻生效）`);
    setScrollUnlocked(true);
    setScrollLoading(true);
    void (async () => {
      const real = await fetchMonthlySections();
      setScrollSections(real || (SCROLL_PREVIEW[lang] || SCROLL_PREVIEW.en));
      setScrollLoading(false);
    })();
  };

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
  /* 🏆 E113-刀三：会话档锚（open 时算定，实时写 effect 复用——避免逐消息重算） */
  const sessionSigRef = useRef('anon');
  const sessionDateRef = useRef('');
  /* 🏆 E123-刀四：罗盘情绪记忆锚（open 时读一次；mood 分支首语查表真源——
   *  舱开着切语言重渲染 effect 按 helloMode==='mood' 用当前 lang 重查字典） */
  const activeMoodRef = useRef<string | null>(null);
  /* 🏆 E118-刀二：用户姓名档案锚（open 时读永久档一次；跨日首语带名真源——
   *  档案 ks_familiar_profile_${chartSig} 永不过期，与当日 24:00 过期的会话档解耦） */
  const profileNameRef = useRef('');
  /* 🆕 E129-刀三（军令 2026-11-09）：会话首击标志——每次开舱（mount）后的
   *  第一条用户消息 body 带 sessionOpen:true，服务端据此检索 ≤48h 未决事件
   *  ＋新月/满月 ±24h 注入 LIVING_AGENT_CONTEXT 块（主动伴生节律底座）。 */
  const firstStrikeRef = useRef(true);
  /* 🏆 E114-刀一：首语插值真值锚（open 时读报告真值一次；helloFor 按当前
   * 语言即时查表——舱开着切语言 t 变更效应会用当前 lang 重渲染首语） */
  const helloTruthRef = useRef<{ tarotId: number | null; trineKey: string | null }>({ tarotId: null, trineKey: null });
  const helloFor = useCallback((mode: HelloMode): string => {
    // 🏆 E114-刀一（主公军令 2026-11-01）：六语模板占位符运行时插值——牌名/局名
    //  走报告真值查表（tarotNames.mjs 单源），无真值 ⇒ 中性词（fail-closed，
    //  绝不臆造具体牌名——《恋人》写死病根物理拔除）
    const vars = () => resolveHelloVars(lang, helloTruthRef.current);
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
      const f = dailyFortune({ lang, sunSign: '' });
      const base = t('familiar.helloDaily', { color: String(f.color.name), num: String(f.luckyNumber) });
      return prependUserName(lang, profileNameRef.current, base);
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
      // 🆕 E129-刀四：长卷开舱解锁判定——最近解锁凭证含财富月报/年报
      //    （付费态真实持有）⇒ 长卷开卷即解锁（沙盒付讫本会话翻面另计）。
      if (rr && rr.category === 'wealth' && (rr.tier === 'monthly' || rr.tier === 'yearly')) {
        setScrollUnlocked(true);
      }
      // E113-刀四：当日新解锁判定（unlockedAt 落今日本地日期）
      const freshReport = !!(rr && chatSessionDateKey(new Date(Number(rr.unlockedAt))) === today);
      // ① E113-刀三：当日未过期会话档在场 ⇒ 复原全部历史（禁重复首句）
      const sess = loadDailyChatSession(store, sig, today);
      const lastTs = (sess && sess.messages.length)
        ? Number(sess.messages[sess.messages.length - 1].timestamp) : 0;
      if (sess && sess.messages.length > 0 && !(freshReport && Number(rr.unlockedAt) > lastTs)) {
        setHelloMode('plain');
        setMsgs(sessionToChatMsgs(sess));
        return;
      }
      let mode: HelloMode = greetingMode || 'plain';
      // 🏆 E123-刀四（军令 2026-11-04）：罗盘情绪记忆首语拦截——当日有效
      //  ks_active_mood（≤2h）命中 ⇒ 强制替换默认冷淡招呼为对应情绪的
      //  第一人称共情抚慰句（军令验收：默认句「在的，今天有什么可以聊的」
      //  命中率 0）。优先级：当日新解锁报告第一击（E112）＞罗盘情绪（E123）
      //  ＞跨日锦囊问候（E113）＞E111 情境链。当日档复原分支已在上方 return。
      let e123Mood: string | null = null;
      try { e123Mood = readActiveMood(sessionStorage); } catch { e123Mood = null; }
      activeMoodRef.current = e123Mood;
      if (rr && freshReport) {
        mode = `${rr.category}_${rr.tier}` as HelloMode; // 当日新解锁 ⇒ 报告第一击（军令刀四）
      } else if (e123Mood) {
        mode = 'mood'; // 罗盘情绪在场 ⇒ 情绪共情第一击（E123 军令刀四）
      } else {
        const lastDay = readLastChatDay(store);
        if (lastDay && lastDay < today) {
          mode = 'daily'; // ③ 跨自然日无当日新解锁 ⇒ 流转今日锦囊问候（军令刀四）
        } else {
          const day = today;
          const key = 'ks_familiar_firststrike_day';
          if (sessionStorage.getItem(key) === day) mode = 'plain'; // 当日已给过情境首语 ⇒ 不再给
          else sessionStorage.setItem(key, day);
        }
      }
      setHelloMode(mode);
      setMsgs([{ id: 'hello', role: 'assistant', text: helloFor(mode) }]);
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
    saveDailyChatSession(store, sessionSigRef.current, sessionDateRef.current, msgs);
  }, [msgs, open]);
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
      try {
        const ls = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
        const captured = extractUserNameIntent(text);
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
      // 🆕 E126-刀三（主公军令 2026-11-05 晚）：Geo-Locale 解耦——客户端时区
      //    随行（服务端 cf-ipcountry 缺席时兜底解析物理生活区；fail-soft：
      //    Intl 不可用/无痕 ⇒ 不传 ⇒ 服务端回退 E124 语言生活区零破坏）
      let timezone: string | undefined;
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) timezone = tz;
      } catch { /* Intl 缺席 ⇒ 不传 */ }
      const body = {
        lang,
        relationMode,
        name,
        // 🆕 E129-刀三：会话首击标志（服务端 sessionOpen===true 严格判定 ⇒ 主动
        //  节律检索：未决事件回溯＋月相微仪式；非首击不传 ⇒ 服务端零查询零破坏）
        sessionOpen: firstStrikeRef.current === true ? true : undefined,
        // 🆕 E126-刀三：物理区域时区随行（服务端白名单 fail-closed）
        timezone,
        // 🏆 E123-刀四：罗盘情绪真值随行（服务端白名单 fail-closed）
        activeMood,
        // 🏆 E118-刀二：永久姓名档案随行（服务端查形状 fail-closed 后进 prompt）
        displayName,
        // 🏆 E112-刀二：最近解锁报告凭证随行（服务端查形状 fail-closed）
        recentReport,
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
      const el = flowRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [paidOk, streaming, t, lang, relationMode, name, startThrottle, stopThrottle]);

  /* ── 下滑手势收起（触屏；鼠标拖拽不接管，避免桌面误触） ── */
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

  const pills = [t('familiar.chatQ1'), t('familiar.chatQ2'), t('familiar.chatQ3')];
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
        className="ks-chat-sheet"
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="ks-chat-grab" aria-hidden="true" />
        <div className="ks-chat-head">
          <img className="ks-chat-avatar" src={avatar} alt="" draggable={false} />
          <div className="ks-chat-who">
            <div className="ks-chat-name">{name}</div>
            <div className="ks-chat-status">
              <span className="ks-chat-dot" aria-hidden="true" />
              {t('familiar.chatStatus', { name })}
            </div>
          </div>
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

        <div className="ks-chat-flow" ref={flowRef}>
          {msgs.map((m) => (
            <div key={m.id} className={`ks-chat-bubble ks-chat-${m.role}`}>
              {m.text}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <LifestyleMuseSlotCard type={lifestyleSlot.type} lang={lang} onOpen={setLifestylePreview} />
              </div>
            );
          })()}
          {/* 🆕 E129-刀四（军令 2026-11-09）：星轨长卷递卡——灵宠在对话流里的
              常设供奉（羊皮纸微缩卡：点击 ⇒ 首页正上方 z-140 长卷展开，绝不
              跳转；三七开剧透⇒毛玻璃锁⇒就地支付托盘＝零跳出付费闭环）。 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              data-testid="sacred-scroll-offer-card"
              onClick={openScroll}
              style={{
                maxWidth: 300, textAlign: 'left', cursor: 'pointer',
                padding: '10px 14px', borderRadius: 12,
                background: 'linear-gradient(175deg, rgba(29,22,8,0.95), rgba(13,10,4,0.95))',
                border: '1px solid rgba(212,175,55,0.5)',
                boxShadow: '0 6px 22px rgba(0,0,0,0.45)',
                fontFamily: '"Noto Serif SC","Songti SC",Georgia,serif',
              }}
            >
              <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: '#F3E5AB', fontWeight: 600 }}>
                ✦ {SCROLL_OFFER_LABEL[lang] || SCROLL_OFFER_LABEL.en} ✦
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(212,188,122,0.8)', marginTop: 3, letterSpacing: 0.5 }}>
                {SCROLL_OFFER_HINT[lang] || SCROLL_OFFER_HINT.en}
              </div>
            </button>
          </div>
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
      {/* 🆕 E129-刀四：羊皮纸星轨长卷（z-140 就地展开；三七开剧透＋毛玻璃暗金
          锁；解锁按钮 ⇒ 内嵌支付托盘——绝不跳离首页单窗口＝军令最高原则）。 */}
      <SacredScrollModal
        open={scrollOpen}
        onClose={() => setScrollOpen(false)}
        lang={lang as 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi'}
        unlocked={scrollUnlocked}
        onUnlockRequest={() => setPayOpen(true)}
        sections={scrollSections}
        loading={scrollLoading}
      />
      {/* 🆕 E129-刀四：内嵌暗金支付托盘（z-141 底部抽屉；沙盒态模拟支付——
          Stripe Elements live 接线挂账 P0 商业破局后切换零重构）。 */}
      <InSituPaymentSheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        lang={lang as 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi'}
        onGranted={handleScrollGranted}
      />
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
