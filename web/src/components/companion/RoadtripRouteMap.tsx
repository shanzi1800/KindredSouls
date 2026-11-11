/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E134-AESTHETIC-25D-ROUTE-MAP（主公军令 2026-11-11）：2.5D 暗金等高线
 * 星轨意境沙盘（对话舱内嵌·纯 SVG 矢量零第三方 3D 依赖）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚（几何真源 ROADTRIP_MAP_SPEC——与 Canvas 渲染域同源）：
 *   · 深邃暗夜黑金渐变底＋4~5 层半透明暗金等高线（stroke rgba(212,175,55,0.16)）
 *     营造 2.5D 山海起伏景深；
 *   · 发光金色三次贝塞尔航线（Cubic Bézier）贯穿起止、串联 3 气场节点，
 *     呼吸光晕（<animate> opacity 2.6s 循环）；
 *   · 三座极简暗金胶囊路牌：①启程·醒神（左下起点）②驻足·纳气（中右转折）
 *     ③归宿·枕星（右上终点）——tag 走 ROADTRIP_ROUTE_UI 六语词表（军师钦定），
 *     地名走模板 waypoints（E126 Geo-Locale 变体随行）；
 *   · 🔴 零收银红线（E130）：纯灵性打卡点，sponsor_badge 槽位在场不渲染。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React from 'react';
// @ts-ignore —— .mjs 纯 JS 逻辑核（形状由 E134 闸门守备）
import { ROADTRIP_MAP_SPEC, ROADTRIP_ROUTE_UI } from '../../lib/lifestyleMuseData.mjs';

type Lang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

export interface RoadtripRouteMapProps {
  lang: string;
  waypoints: Array<{ name: string; query: string }> | null;
  /** 高度（px）——宽随容器 100% 自适应（viewBox 等比） */
  height?: number;
}

/** 字宽估算（CJK≈1em · 拉丁≈0.55em · 泰/越≈0.5em——铁律 14 mono 真实字宽同族经验值） */
function estTextWidth(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of String(text || '')) {
    const cp = ch.codePointAt(0) || 0;
    if (cp >= 0x2e80 && cp <= 0x9fff) w += 1;            // CJK
    else if (cp >= 0x0e00 && cp <= 0x0e7f) w += 0.52;     // 泰文
    else if (cp >= 0x1a00 && cp <= 0x1aff) w += 0.55;     // 越南扩展
    else if (cp >= 0x00c0 && cp <= 0x024f) w += 0.62;     // 拉丁扩展（é ü ñ）
    else w += 0.55;                                        // 基本拉丁/数字/符号
  }
  return w * fontSize;
}

/** 地名截断（军令：泰/法/西超长地名自动截断——≥22 视觉宽字符后加 …） */
function clipPlaceName(name: string): string {
  const s = String(name || '');
  if ([...s].length <= 14) return s;
  return [...s].slice(0, 13).join('') + '…';
}

const RoadtripRouteMap: React.FC<RoadtripRouteMapProps> = ({ lang, waypoints, height = 208 }) => {
  const l = (ROADTRIP_ROUTE_UI as Record<string, (typeof ROADTRIP_ROUTE_UI)['zh']>)[lang] || ROADTRIP_ROUTE_UI.en;
  const tags = [l.waypoint_1_tag, l.waypoint_2_tag, l.waypoint_3_tag];
  const VW = ROADTRIP_MAP_SPEC.viewBoxWidth;   // 320
  const VH = ROADTRIP_MAP_SPEC.viewBoxHeight;  // 210
  const N = ROADTRIP_MAP_SPEC.nodes;           // 归一化三节点
  const P = N.map((n: { nx: number; ny: number }) => ({ x: n.nx * VW, y: n.ny * VH }));
  // 航线三贝塞尔（两段：P0→P1、P1→P2）——控制点沿切向展开营造星轨弧线
  const c1 = { x: (P[0].x + P[1].x) / 2 + 26, y: (P[0].y + P[1].y) / 2 + 18 };
  const c2 = { x: (P[1].x + P[2].x) / 2 - 18, y: (P[1].y + P[2].y) / 2 - 14 };
  const routeD = `M ${P[0].x},${P[0].y} C ${c1.x},${c1.y} ${P[1].x - 30},${P[1].y + 6} ${P[1].x},${P[1].y} C ${c2.x},${c2.y} ${P[2].x - 22},${P[2].y + 10} ${P[2].x},${P[2].y}`;

  // 路牌布局：n1 上方 / n2 下方 / n3 左上（贴边防溢出）
  const plateAnchors: Array<{ tag: string; name: string; px: number; py: number; align: 'middle' | 'start' }> = [];
  for (let i = 0; i < 3; i++) {
    const name = clipPlaceName(waypoints && waypoints[i] ? waypoints[i].name : '');
    const tag = tags[i];
    if (i === 0) plateAnchors.push({ tag, name, px: P[0].x + 6, py: P[0].y - 44, align: 'middle' });
    else if (i === 1) plateAnchors.push({ tag, name, px: P[1].x, py: P[1].y + 18, align: 'middle' });
    else plateAnchors.push({ tag, name, px: P[2].x - 8, py: P[2].y - 34, align: 'middle' });
  }

  return (
    <div
      data-testid="roadtrip-route-map"
      role="img"
      aria-label={l.route_map_subtitle}
      style={{ width: '100%', marginTop: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.35)', boxShadow: '0 6px 22px rgba(0,0,0,0.45)' }}
    >
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height={height} style={{ display: 'block', background: '#0B0B0E' }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ks-map-bg" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="#14131c" />
            <stop offset="55%" stopColor="#0e0d15" />
            <stop offset="100%" stopColor="#0a0a12" />
          </linearGradient>
          <filter id="ks-route-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 底图：暗夜黑金渐变 */}
        <rect x="0" y="0" width={VW} height={VH} fill="url(#ks-map-bg)" />

        {/* 2.5D 等高线（5 层半透明暗金倾斜椭圆×两组——山海起伏景深） */}
        <g stroke={ROADTRIP_MAP_SPEC.contourColor} fill="none" strokeWidth="1">
          {[0, 1, 2, 3, 4].map((k) => (
            <ellipse key={`ea${k}`} cx={186 - k * 4} cy={104 + k * 3} rx={30 + k * 23} ry={17 + k * 13} transform={`rotate(-16 ${186 - k * 4} ${104 + k * 3})`} />
          ))}
          {[0, 1, 2, 3].map((k) => (
            <ellipse key={`eb${k}`} cx={118 + k * 5} cy={148 - k * 4} rx={22 + k * 17} ry={12 + k * 9} transform={`rotate(11 ${118 + k * 5} ${148 - k * 4})`} />
          ))}
        </g>

        {/* 星轨航线：金色三次贝塞尔＋呼吸光晕（军令钦定 anim） */}
        <g filter="url(#ks-route-glow)">
          <path d={routeD} fill="none" stroke={ROADTRIP_MAP_SPEC.routeColor} strokeWidth="2.2" strokeLinecap="round" opacity="0.9">
            <animate attributeName="opacity" values="0.55;1;0.55" dur="2.6s" repeatCount="indefinite" />
          </path>
        </g>

        {/* 三气场节点：金芯＋光晕外环 */}
        {P.map((pt: { x: number; y: number }, i: number) => (
          <g key={`node${i}`}>
            <circle cx={pt.x} cy={pt.y} r="7.5" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
            <circle cx={pt.x} cy={pt.y} r="3.4" fill="#F3E5AB" />
          </g>
        ))}

        {/* 三座暗金胶囊路牌（tag 军师词表＋地名模板真源） */}
        {plateAnchors.map((pl, i) => {
          const w = Math.max(estTextWidth(pl.tag, 9.5), estTextWidth(pl.name, 7.5)) + 16;
          const x = pl.align === 'middle' ? pl.px - w / 2 : pl.px;
          const cx = Math.max(6, Math.min(VW - w - 6, x)); // 双侧防溢出 clamp
          return (
            <g key={`plate${i}`} data-testid={`roadtrip-waypoint-plate-${i + 1}`}>
              <rect x={cx} y={pl.py} width={w} height="26" rx="7" fill="rgba(13,13,26,0.92)" stroke="rgba(212,175,55,0.55)" strokeWidth="1" />
              <text x={cx + w / 2} y={pl.py + 11.5} textAnchor="middle" fontSize="9.5" fill="#F3E5AB" fontWeight={700} letterSpacing="0.4">{pl.tag}</text>
              <text x={cx + w / 2} y={pl.py + 21.5} textAnchor="middle" fontSize="7.5" fill="rgba(212,188,122,0.88)">{pl.name}</text>
            </g>
          );
        })}

        {/* 副题：2.5D 沙盘铭牌（底部居中小字） */}
        <text x={VW / 2} y={VH - 8} textAnchor="middle" fontSize="8" fill="rgba(212,188,122,0.72)" letterSpacing="1.6">{l.route_map_subtitle}</text>
      </svg>
    </div>
  );
};

export default RoadtripRouteMap;
