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
import { extractBirthTruth, readFamiliarRecord } from '../lib/familiarHome.mjs';
// 🏆 E112-刀二（主公军令 2026-11-01）：最近解锁付费报告读取（形状守卫 fail-closed）
// @ts-ignore —— soulRecentReport.mjs 纯 JS 逻辑核（形状由 E112 闸门守备）
import { readRecentReport } from '../lib/soulRecentReport.mjs';
// @ts-ignore —— FAMILIAR_LS_KEY 与 FamiliarHomeCard 同源唯一键
import { FAMILIAR_LS_KEY } from './FamiliarPicker';

export type FamiliarIp = 'Milo' | 'Sophia';

/** 🏆 E112-刀二：开场首语九分支——六档报告第一击（love/wealth × core/monthly/
 *  annual）＋E111 情境三分支（sweet/soothe/plain） */
type HelloMode =
  | 'sweet' | 'soothe' | 'plain'
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

const FamiliarChatSheet: React.FC<Props> = ({ open, onClose, ip, name, relationMode, lang, paidOk, greetingMode, starCount }) => {
  const { t } = useTranslation();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);

  const flowRef = useRef<HTMLDivElement | null>(null);
  const bufRef = useRef('');
  const throttleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartY = useRef<number | null>(null);
  const listRef = useRef<ChatMsg[]>([]);
  listRef.current = msgs;

  /** 开场问候（🧩 E82 语言联动根治，主公亲令 2026-10-21 军令③）：
   * 旧「一生一次」ref 门闩＋ msgs 跨关闭不重置 ⇒ 首次 zh 开舱后，切 EN 重开永远中文旧句
   * （六语真机实锤）。现改为：每次唤醒都按当前语言重建干净会话（关闭即复位的既定语义）；
   * 舱开着切语言 ⇒ 纯开场白态实时替换为新语言（已展开对话不扰，历史即历史）。
   * 🏆 E111-刀二（主公军令 2026-11-01）：彻底拔除「幸运色/幸运数字」复读——
   *  sweet（恋人牌/三合六合）⇒ chatHello 甜句；soothe（六冲/低分磨合）⇒ 慰句；
   *  plain ⇒ chatHelloPlain 中性陪伴句。首语只在「带路回首页后开舱」或「当日
   *  首次开舱」出现一次（sessionStorage ks_familiar_firststrike_day 日标记）。
   * 🏆 E112-刀二（主公军令 2026-11-01）：六档报告第一击**最优先**——本地存在
   *  最近解锁付费报告（soul_recent_unlocked_report：姻缘/财富 × core/monthly/
   *  annual）⇒ 每次开舱首语直接切入该报告情境（军令断言：严禁「我在呢。今天
   *  想聊点什么？」空话；日标记不约束报告分支——「最近解锁」长期有效，新报告
   *  覆写即切换）。无报告档 ⇒ 维持 E111 情境链（日标记契约照旧）。 */
  const [helloMode, setHelloMode] = useState<HelloMode>('plain');
  const helloFor = useCallback((mode: HelloMode): string => {
    if (mode === 'love_core') return t('familiar.helloLoveCore');
    if (mode === 'love_monthly') return t('familiar.helloLoveMonthly');
    if (mode === 'love_yearly') return t('familiar.helloLoveYearly');
    if (mode === 'wealth_core') return t('familiar.helloWealthCore');
    if (mode === 'wealth_monthly') return t('familiar.helloWealthMonthly');
    if (mode === 'wealth_yearly') return t('familiar.helloWealthYearly');
    if (mode === 'sweet') return t('familiar.chatHello');
    if (mode === 'soothe') return t('familiar.chatHelloSoothe');
    return t('familiar.chatHelloPlain', { name });
  }, [t, name]);
  useEffect(() => {
    if (!open) return;
    let mode: HelloMode = greetingMode || 'plain';
    try {
      // 🏆 E112-刀二：最近解锁付费报告在场 ⇒ 六档报告第一击最优先（无日标记约束）
      const rr = readRecentReport((typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null);
      if (rr) mode = `${rr.category}_${rr.tier}` as HelloMode;
      else {
        const day = new Date().toISOString().slice(0, 10);
        const key = 'ks_familiar_firststrike_day';
        if (sessionStorage.getItem(key) === day) mode = 'plain'; // 当日已给过情境首语 ⇒ 不再给
        else sessionStorage.setItem(key, day);
      }
    } catch { /* iOS 无痕模式存储抛错 ⇒ 首语照给（fail-soft） */ }
    setHelloMode(mode);
    setMsgs([{ id: 'hello', role: 'assistant', text: helloFor(mode) }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setMsgs((prev) => {
      if (!(prev.length === 1 && prev[0].id === 'hello')) return prev;
      return [{ id: 'hello', role: 'assistant', text: helloFor(helloMode) }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, name, helloMode]);

  /** 关闭即复位（下次唤醒仍是干净会话，不残留上一次的私密内容） */
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
      const body = {
        lang,
        relationMode,
        name,
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
              深空黑金轻奢胶囊 [ ✦ 灵犀星: N ]；首页按钮下方旧徽章已拆除 */}
          <div className="ks-chat-star" data-testid="familiar-starlight">
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
    </div>,
    document.body
  );
};

export default FamiliarChatSheet;
