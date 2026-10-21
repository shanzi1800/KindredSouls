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
import { extractBirthTruth } from '../lib/familiarHome.mjs';

export type FamiliarIp = 'Milo' | 'Sophia';

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
  /** 开场问候真值（由首页 dailyFortune 注入；缺省则只问候不报运势） */
  greetingVars?: { sun?: string; color?: string; num?: number | string } | null;
}

const THROTTLE_MS = 90;

/**
 * 🧩 E68 输入栏独立微组件（军令①：根除打字滞后）——
 * 打字 state 局部化在本组件内，敲键只重渲染这 38px 输入栏，
 * 严禁触发外层对话流 / 毛玻璃抽屉重渲染（此前 input 在父级，每键全树 diff）。
 */
const ChatInputBar: React.FC<{
  streaming: boolean;
  placeholder: string;
  micTitle: string;
  sendLabel: string;
  onSend: (text: string) => void;
}> = ({ streaming, placeholder, micTitle, sendLabel, onSend }) => {
  const [text, setText] = useState('');
  const submit = () => {
    const v = text.trim();
    if (!v || streaming) return;
    setText('');
    onSend(v);
  };
  return (
    <div className="ks-chat-bar">
      <input
        className="ks-chat-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // 中文输入法组词中的回车只上屏不发送（isComposing 保护）
          if (e.key === 'Enter' && !(e.nativeEvent as KeyboardEvent).isComposing) submit();
        }}
        placeholder={placeholder}
        maxLength={300}
        disabled={streaming}
        autoComplete="off"
      />
      {/* 🎙 E66 语音扩展槽位：清朗少年音 Milo / 温柔少女音 Sophia（UI 锚点，功能待接入） */}
      <button type="button" className="ks-chat-mic" disabled title={micTitle} aria-label={micTitle}>🎙</button>
      <button type="button" className="ks-chat-send" onClick={submit} disabled={streaming || !text.trim()} aria-label={sendLabel}>↑</button>
    </div>
  );
};
const MemoChatInputBar = React.memo(ChatInputBar);

const FamiliarChatSheet: React.FC<Props> = ({ open, onClose, ip, name, relationMode, lang, paidOk, greetingVars }) => {
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
   * 舱开着切语言 ⇒ 纯开场白态实时替换为新语言（已展开对话不扰，历史即历史）。 */
  useEffect(() => {
    if (!open) return;
    const hello = greetingVars && greetingVars.color
      ? t('familiar.chatHello', {
        name,
        sun: greetingVars.sun || '',
        color: greetingVars.color,
        num: greetingVars.num ?? '',
      })
      : t('familiar.chatHelloPlain', { name });
    setMsgs([{ id: 'hello', role: 'assistant', text: hello }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setMsgs((prev) => {
      if (!(prev.length === 1 && prev[0].id === 'hello')) return prev;
      const hello = greetingVars && greetingVars.color
        ? t('familiar.chatHello', {
          name,
          sun: greetingVars.sun || '',
          color: greetingVars.color,
          num: greetingVars.num ?? '',
        })
        : t('familiar.chatHelloPlain', { name });
      return [{ id: 'hello', role: 'assistant', text: hello }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, name, greetingVars]);

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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setNotice(t('familiar.chatNeedLogin'));
        setStreaming(false); stopThrottle();
        setMsgs((prev) => prev.filter((m) => m.id !== aid));
        return;
      }
      // 🔒 只传对话 + 本命锚点；星盘与运势由服务端真值装配
      const bt = extractBirthTruth(window.location.search, window.localStorage);
      const body = {
        lang,
        relationMode,
        name,
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
