import { useCallback, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 🐾 E36 · FamiliarOverlay —— 灵宠悬浮层【插拔槽 · Stub】
//
//   🔴 本批（E36）**只建插拔槽与状态通信桩**，刻意**不挂载任何重量级动画库**
//      （Spine / PixiJS / Live2D / Rive / Three 一律不引入）⇒ 包体积零增长、首屏零阻塞。
//      未来接入：美术出 Milo / Sophia 立绘并打骨骼 → 通过 `renderAvatar` 插槽替换占位层；
//      换色靠 Spine `skin swap`（`state.palette.skin`），**资产仍只需 2 套骨架**。
//
//   🔴 出参形状与 `/api/v1/embodied/…` 四条端点的槽位**逐字段同源**（palette / emotion_state /
//      voice_stream_meta / motion_intent）—— 设备侧与 Web 侧消费**同一份契约**，
//      未来机器人 / 座舱 / 独立站无需各自造一套。
//      （注：本注释刻意用省略号而不用通配星号形态 —— 星号紧跟斜杠会被下游注释剥离器
//        误判为块注释起点，从而跨行吞码；E36 实测踩坑，见闸门 H5 防守。）
//
//   🔴 本期全 inert：`voice_stream_meta` 三字段 null ⇒ 不做 Lip-Sync；
//      `motion_intent` null ⇒ 只做呼吸与眨眼占位；气泡文案由调用方注入（不在此硬编码文案）。
// ═══════════════════════════════════════════════════════════════════════════

export type RelationMode = 'girlfriend' | 'buddy' | 'bestie' | 'boyfriend';

export type EmotionalTone = 'caring' | 'energetic' | 'deep_affection' | 'witty';

/** 设备灯效 / 配色（与 relation.palette 同源；禁前端重算） */
export interface OverlayPalette {
  skin: string;
  primary: string;
  secondary: string;
}

/** 语音双模态槽（E36 立 · 本期 inert） */
export interface VoiceStreamMeta {
  voice_id: string | null;
  emotional_tone: EmotionalTone | null;
  viseme_timeline: unknown[] | null;
}

/** 中枢下发的悬浮层状态（与 /api/v1/embodied/persona 出参同形） */
export interface FamiliarOverlayState {
  relationMode: RelationMode;
  petName: 'Sophia' | 'Milo';
  palette: OverlayPalette | null;
  /** neutral | happy | tired | comfort | excited */
  emotionState: string;
  voice: VoiceStreamMeta | null;
  motionIntent: string | null;
}

export interface FamiliarOverlayProps {
  state: FamiliarOverlayState;
  /** 气泡文案（由调用方注入；为 null 时不渲染气泡） */
  bubbleText?: string | null;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  /** 点击灵宠（未来触发语音打招呼 / 摸头反馈） */
  onTap?: () => void;
  /**
   * 🔴 渲染插槽：未来接入 Spine 2D 骨骼渲染器。
   *    传 null / 不传 ⇒ 走内置静态占位层（本批默认）。
   */
  renderAvatar?: (state: FamiliarOverlayState, look: { x: number; y: number }) => ReactNode;
}

/** 眼神跟随归一化（-1 ~ 1）；容器尺寸为 0 时回中，绝不产生 NaN */
function normalizeLook(
  clientX: number,
  clientY: number,
  box: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  if (!box.width || !box.height) return { x: 0, y: 0 };
  const x = ((clientX - box.left) / box.width) * 2 - 1;
  const y = ((clientY - box.top) / box.height) * 2 - 1;
  return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
}

export default function FamiliarOverlay({
  state,
  bubbleText = null,
  minimized = false,
  onToggleMinimize,
  onTap,
  renderAvatar,
}: FamiliarOverlayProps) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [look, setLook] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  const primary = state.palette?.primary || '#8A8A8A';
  const secondary = state.palette?.secondary || '#C9C9C9';

  const handleMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setLook(normalizeLook(e.clientX, e.clientY, r));
  }, []);

  const resetLook = useCallback(() => setLook({ x: 0, y: 0 }), []);

  // ── 最小化态：一颗呼吸点（点击还原）──
  if (minimized) {
    return (
      <div
        ref={boxRef}
        role="button"
        tabIndex={0}
        aria-label={`${state.petName} minimized`}
        onClick={onToggleMinimize}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleMinimize?.(); }}
        style={{
          position: 'fixed', right: 20, bottom: 20, width: 46, height: 46,
          borderRadius: '50%', cursor: 'pointer',
          background: `radial-gradient(circle at 34% 30%, ${primary}, ${secondary})`,
          boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
        }}
        title={`${state.petName} · ${state.relationMode}`}
      />
    );
  }

  return (
    <div
      ref={boxRef}
      onMouseMove={handleMove}
      onMouseLeave={() => { resetLook(); setHover(false); }}
      onMouseEnter={() => setHover(true)}
      style={{ position: 'fixed', right: 20, bottom: 20, width: 220, userSelect: 'none' }}
    >
      {bubbleText ? (
        <div
          style={{
            marginBottom: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.5,
            borderRadius: 12, background: 'rgba(255,255,255,0.96)',
            border: `1px solid ${primary}`, color: '#1e293b',
            boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
          }}
        >
          {bubbleText}
        </div>
      ) : null}

      <div
        onClick={onTap}
        role="button"
        tabIndex={0}
        aria-label={`${state.petName} avatar`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTap?.(); }}
        style={{
          height: 150, borderRadius: 16, cursor: onTap ? 'pointer' : 'default',
          overflow: 'hidden', position: 'relative',
          border: `1px solid ${primary}`,
          background: `linear-gradient(150deg, ${primary}22, ${secondary}33)`,
          transform: hover ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'transform 160ms ease',
        }}
      >
        {renderAvatar ? (
          renderAvatar(state, look)
        ) : (
          <div style={{ position: 'absolute', inset: 0 }}>
            {/* 静态占位层：仅瞳位随指针微动（Spine 2D 骨骼层未来经 renderAvatar 替换） */}
            <div
              style={{
                position: 'absolute', left: '50%', top: '44%',
                transform: 'translate(-50%, -50%)',
                width: 74, height: 74, borderRadius: '50%',
                background: `radial-gradient(circle at 38% 34%, ${primary}, ${secondary})`,
              }}
            />
            <div style={{ position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%, -50%)', display: 'flex', gap: 13 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#1e293b', transform: `translate(${look.x * 3}px, ${look.y * 3}px)` }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#1e293b', transform: `translate(${look.x * 3}px, ${look.y * 3}px)` }} />
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8, textAlign: 'center', fontSize: 12, color: '#475569' }}>
              {state.petName} · {state.relationMode}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
        <span>{state.emotionState}</span>
        {onToggleMinimize ? (
          <button
            type="button"
            onClick={onToggleMinimize}
            style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 12 }}
          >
            ··
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 🔴 状态通信桩 —— 把 `/api/v1/embodied/*` 出参槽位规整为悬浮层可用状态。
 * 无真值时**显式降级**（palette / voice 置 null），绝不伪造配色或声线。
 */
export function toOverlayState(payload: Record<string, unknown> | null | undefined): FamiliarOverlayState | null {
  if (!payload || typeof payload !== 'object') return null;
  const relation = (payload.relation && typeof payload.relation === 'object')
    ? (payload.relation as Record<string, unknown>)
    : null;
  const rawPalette = (payload.display_palette && typeof payload.display_palette === 'object')
    ? (payload.display_palette as Record<string, unknown>)
    : (relation?.palette as Record<string, unknown> | undefined);
  const palette = (rawPalette && typeof rawPalette.skin === 'string')
    ? {
      skin: String(rawPalette.skin),
      primary: String(rawPalette.primary || ''),
      secondary: String(rawPalette.secondary || ''),
    }
    : null;
  const voice = (payload.voice_stream_meta && typeof payload.voice_stream_meta === 'object')
    ? (payload.voice_stream_meta as VoiceStreamMeta)
    : null;
  const mode = String(payload.relation_mode || (relation?.mode as string) || 'girlfriend') as RelationMode;
  const petName = mode === 'girlfriend' || mode === 'bestie' ? 'Sophia' : 'Milo';
  return {
    relationMode: mode,
    petName,
    palette,
    emotionState: String(payload.emotion_state || 'neutral'),
    voice,
    motionIntent: (payload.motion_intent as string | null) ?? null,
  };
}
