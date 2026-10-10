import { useEffect, useRef, useState } from 'react';
import {
  BG_QUEUE_CONFIG_PATH,
  BG_VIDEOS,
  nextQueueIndex,
  pickQueueItem,
  resolveHoldMs,
  sanitizeBgQueue,
  shouldDegradeToSingle,
} from '../lib/bgQueue';
import type { BgItem } from '../lib/bgQueue';

/**
 * CelestialBackground — 视频背景 + 星尘粒子双层动画 v4
 *
 * 底层：**插拔式轮播容器**（队列驱动；队列只有 1 支时自动退化为单支常驻循环）
 * 上层：Canvas 粒子动画（半透明，视频透出来）
 * 中央粒子密集区自然覆盖视频水印位置
 *
 * ── 容器承载的三类内容（军师令）────────────────────────────
 *   ambient  默认星空底（兜底态，永不空场）
 *   story    15s 短剧切片（Milo / Sophia IP 宣发）
 *   ad       30s 商业广告位
 *
 * ── 引擎三件套（咬合锁死）──────────────────────────────────
 *   ① 时间控制器：按 resolveHoldMs(item) 定时切槽，固定列表顺序 Queue Loop
 *   ② 预加载：切换后立即把下一支塞进隐藏槽（preload=auto），杜绝等待黑屏
 *   ③ 双槽无缝过渡：A/B 两槽 opacity 交叉淡入；单元素换 src 必闪黑，故不用
 *
 * ── 插拔方式（运营侧，均无需改组件内核）────────────────────
 *   ① 运行期热插拔（推荐）：改 web/public/bg-queue.json → 刷新即生效
 *   ② 编译期：改 src/lib/bgQueue.ts 的 BG_VIDEOS
 *   ⚠️ 新增视频三件套：放入 web/public/ ＋ web/.gitignore 已配 !dist/*.mp4 豁免 ＋
 *      必须入库（git ls-files web/dist/<名>.mp4 能查到，否则生产镜像无此文件 —— E40+FIX 血训）
 */

const CROSSFADE_MS = 1500; // 交叉淡入淡出时长（毫秒）
// 弱网/省流开关：true = 命中 saveData / prefers-reduced-motion 时仍照常轮播；
// 默认 false ⇒ 降级为单支常驻（主干逻辑不阻断，弱网分支只降载不换轨 —— 军师令）
const ALLOW_ROTATION_ON_SLOW_NETWORK = false;

function envSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData);
}

function envReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CelestialBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotARef = useRef<HTMLVideoElement>(null);
  const slotBRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number>(0);
  const [isMuted, setIsMuted] = useState(true);

  // ── 插拔式队列：默认 1 支（自动退化为单支常驻循环，零额外请求）；可由 /bg-queue.json 热插拔 ──
  const [queue, setQueue] = useState<BgItem[]>(() =>
    shouldDegradeToSingle(BG_VIDEOS, {
      saveData: envSaveData(),
      reducedMotion: envReducedMotion(),
      allowOnSlow: ALLOW_ROTATION_ON_SLOW_NETWORK,
    })
      ? BG_VIDEOS.slice(0, 1)
      : BG_VIDEOS,
  );
  // 双槽轮播：a / b 各承载一支视频，交叉淡入实现无缝切换（单支时仅渲染 a）
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(0);
  const [visible, setVisible] = useState<'a' | 'b'>('a');
  const [readyA, setReadyA] = useState(false);
  const [readyB, setReadyB] = useState(false);
  const [switches, setSwitches] = useState(0);

  const multi = queue.length > 1;
  const itemA = pickQueueItem(queue, idxA);
  const itemB = pickQueueItem(queue, idxB);
  // 当前可见支是否可播 —— 决定整个视频层是否淡入（首屏体验与原版一致）
  const layerReady = visible === 'a' ? readyA : readyB;

  useEffect(() => {
    if (slotARef.current) slotARef.current.volume = 1.0;
    if (slotBRef.current) slotBRef.current.volume = 1.0;
  }, [isMuted]);

  // ── 运行期热插拔：拉取 /bg-queue.json 覆盖队列；失败/为空/非法一律静默回退默认，绝不阻断首屏 ──
  useEffect(() => {
    let alive = true;
    fetch(BG_QUEUE_CONFIG_PATH, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        if (!alive || !raw) return;
        let q = sanitizeBgQueue(raw);
        if (q.length === 0) return; // 配置不可用 ⇒ 保持默认队列
        if (
          shouldDegradeToSingle(q, {
            saveData: envSaveData(),
            reducedMotion: envReducedMotion(),
            allowOnSlow: ALLOW_ROTATION_ON_SLOW_NETWORK,
          })
        ) {
          q = q.slice(0, 1);
        }
        setQueue(q);
      })
      .catch(() => {
        /* 无配置文件 / 网络异常 ⇒ 保持默认单支，不影响首屏 */
      });
    return () => {
      alive = false;
    };
  }, []);

  // 队列热插拔后归位：A 槽自 0 起展示，B 槽预载下一支
  useEffect(() => {
    setVisible('a');
    setIdxA(0);
    setIdxB(queue.length > 1 ? nextQueueIndex(0, queue.length) : 0);
  }, [queue]);

  // src 变化时重置对应槽的可播标记（key 触发重挂载，等 onCanPlay 重新点亮）
  const prevSrcA = useRef(itemA.src);
  useEffect(() => {
    if (prevSrcA.current !== itemA.src) {
      prevSrcA.current = itemA.src;
      setReadyA(false);
    }
  }, [itemA.src]);
  const prevSrcB = useRef(itemB.src);
  useEffect(() => {
    if (prevSrcB.current !== itemB.src) {
      prevSrcB.current = itemB.src;
      setReadyB(false);
    }
  }, [itemB.src]);

  // ── ① 时间控制器：当前支播满 holdMs 即切槽（固定列表顺序 Queue Loop）──
  useEffect(() => {
    if (!multi || !layerReady) return;
    const cur = visible === 'a' ? idxA : idxB;
    const hold = resolveHoldMs(pickQueueItem(queue, cur));
    const timer = window.setTimeout(() => {
      const next = nextQueueIndex(cur, queue.length);
      console.log('[bg-queue] switch', { from: pickQueueItem(queue, cur).id, to: pickQueueItem(queue, next).id, holdMs: hold });
      setVisible((v) => (v === 'a' ? 'b' : 'a'));
      setSwitches((n) => n + 1);
    }, hold);
    return () => window.clearTimeout(timer);
  }, [multi, layerReady, visible, idxA, idxB, queue]);

  // ── ②③ 切换后：播放新可见支 ＋ 把下一支预载进隐藏槽（交叉淡入不闪黑）──
  useEffect(() => {
    if (!multi) return;
    const curEl = (visible === 'a' ? slotARef : slotBRef).current;
    const hidEl = (visible === 'a' ? slotBRef : slotARef).current;
    if (curEl) {
      try {
        curEl.currentTime = 0;
        const p = curEl.play();
        if (p && typeof p.then === 'function') p.catch(() => {});
      } catch {
        /* 自动播放被拦截时静默降级（仍有深色星空兜底） */
      }
    }
    if (hidEl) hidEl.pause();
    const cur = visible === 'a' ? idxA : idxB;
    const next = nextQueueIndex(cur, queue.length);
    if (visible === 'a') setIdxB(next);
    else setIdxA(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── 观测钩子：轮播态写入 <html data-bg-*>（仅多支时），供本地/线上实证与运营排障 ──
  useEffect(() => {
    if (!multi || typeof document === 'undefined') return;
    const cur = visible === 'a' ? idxA : idxB;
    const el = document.documentElement;
    el.dataset.bgSlot = visible;
    el.dataset.bgIndex = String(cur);
    el.dataset.bgId = pickQueueItem(queue, cur).id;
    el.dataset.bgSwitches = String(switches);
  }, [multi, visible, idxA, idxB, switches, queue]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    
    let W = 0, H = 0;
    let t = 0;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      alpha: number;
      alphaSpeed: number;
      color: string;
      type: 'star' | 'dust' | 'sparkle' | 'nebula';
    }

    interface ShootingStar {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      length: number;
    }

    let particles: Particle[] = [];
    let shootingStars: ShootingStar[] = [];

    function resize() {
      W = canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      H = canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      initParticles();
    }

    function initParticles() {
      particles = [];
      shootingStars = [];
      
      const density = (W * H) / 3000;
      const count = Math.min(Math.floor(density), 600);
      
      // 大量星尘粒子 — 中央区域加密（覆盖视频水印）
      const cx = W / 2, cy = H / 2;
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let type: Particle['type'] = 'dust';
        if (rand > 0.93) type = 'sparkle';
        else if (rand > 0.7) type = 'star';

        // 中央区域（水印位置）粒子密度翻倍
        let px: number, py: number;
        if (Math.random() < 0.35) {
          // 集中在中央 40% 区域
          px = cx + (Math.random() - 0.5) * W * 0.4;
          py = cy + (Math.random() - 0.5) * H * 0.35;
        } else {
          px = Math.random() * W;
          py = Math.random() * H;
        }
        
        const colors = {
          dust: [
            'rgba(232,160,184,0.5)',
            'rgba(155,126,216,0.45)',
            'rgba(212,175,55,0.35)',
            'rgba(255,200,220,0.4)',
            'rgba(180,140,255,0.4)',
            'rgba(255,255,255,0.3)',
          ],
          star: [
            'rgba(255,220,240,0.8)',
            'rgba(200,170,255,0.8)',
            'rgba(212,175,55,0.7)',
            'rgba(255,255,255,0.9)',
          ],
          sparkle: [
            'rgba(255,200,240,0.9)',
            'rgba(170,140,255,0.9)',
            'rgba(255,215,0,0.85)',
          ],
        };
        
        const pool = colors[type];
        particles.push({
          x: px, y: py,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.3 - 0.15,
          size: type === 'sparkle' ? Math.random() * 3 + 1 : type === 'star' ? Math.random() * 2 + 0.8 : Math.random() * 1.5 + 0.3,
          alpha: Math.random() * 0.7 + 0.3,
          alphaSpeed: Math.random() * 0.03 + 0.008,
          color: pool[Math.floor(Math.random() * pool.length)],
          type,
        });
      }

      // 星云团块 — 大面积半透明光晕
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.03,
          size: Math.random() * 150 + 100,
          alpha: Math.random() * 0.06 + 0.03,
          alphaSpeed: Math.random() * 0.005 + 0.002,
          color: i % 3 === 0 ? 'rgba(220,120,180,0.06)' : i % 3 === 1 ? 'rgba(140,80,200,0.05)' : 'rgba(100,60,160,0.04)',
          type: 'nebula',
        });
      }
    }

    function drawBackground() {
      // 半透明深空底 — 让视频透出来
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, 'rgba(7,0,20,0.35)');
      bg.addColorStop(0.3, 'rgba(13,13,43,0.25)');
      bg.addColorStop(0.6, 'rgba(18,13,36,0.2)');
      bg.addColorStop(1, 'rgba(26,13,46,0.3)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }

    function drawNebula() {
      // 固定位置的大星云光晕 — 粉紫色弥漫
      const positions = [
        { x: W * 0.25, y: H * 0.3, r: W * 0.45, c1: 'rgba(200,100,170,0.10)', c2: 'rgba(160,80,200,0.04)' },
        { x: W * 0.7, y: H * 0.5, r: W * 0.4, c1: 'rgba(140,70,210,0.08)', c2: 'rgba(180,100,180,0.03)' },
        { x: W * 0.5, y: H * 0.7, r: W * 0.5, c1: 'rgba(180,90,190,0.07)', c2: 'rgba(120,60,180,0.03)' },
        { x: W * 0.35, y: H * 0.8, r: W * 0.35, c1: 'rgba(220,130,180,0.06)', c2: 'transparent' },
      ];
      
      for (const n of positions) {
        const nx = n.x + Math.sin(t * 0.0002 + n.x) * W * 0.02;
        const ny = n.y + Math.cos(t * 0.00018 + n.y) * H * 0.015;
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.r);
        g.addColorStop(0, n.c1);
        g.addColorStop(0.5, n.c2);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function drawParticle(p: Particle) {
      if (p.type === 'nebula') {
        // 大星云团块
        const nx = p.x + Math.sin(t * 0.0003 + p.x * 0.01) * 20;
        const ny = p.y + Math.cos(t * 0.00025 + p.y * 0.01) * 15;
        p.alpha += Math.sin(t * p.alphaSpeed) * 0.002;
        p.alpha = Math.max(0.02, Math.min(0.1, p.alpha));
        
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, p.size);
        g.addColorStop(0, p.color);
        g.addColorStop(0.6, p.color.replace(/[\d.]+\)$/, (parseFloat(p.color.match(/[\d.]+\)$/)?.[0] || '0.04') * 0.4).toFixed(3) + ')'));
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(nx - p.size, ny - p.size, p.size * 2, p.size * 2);
        
        p.x += p.vx;
        p.y += p.vy;
        return;
      }
      
      p.alpha += Math.sin(t * p.alphaSpeed) * 0.01;
      p.alpha = Math.max(0.05, Math.min(1, p.alpha));
      
      // 缓慢漂移
      p.x += p.vx;
      p.y += p.vy;
      
      // 边界循环
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
      
      ctx.globalAlpha = p.alpha;
      
      if (p.type === 'sparkle') {
        // 晶体折射 — 彩虹色4角星
        const sparkleSize = p.size * (1 + Math.sin(t * 0.008 + p.x * 0.1) * 0.6);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(t * 0.002 + p.x * 0.01);
        
        const hue = (t * 0.05 + p.y * 0.15) % 360;
        ctx.fillStyle = `hsla(${hue}, 80%, 78%, ${p.alpha * 0.7})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${hue}, 80%, 70%, 0.5)`;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i;
          const sx = Math.cos(angle) * sparkleSize;
          const sy = Math.sin(angle) * sparkleSize;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
          const mx = Math.cos(angle + Math.PI / 4) * sparkleSize * 0.3;
          const my = Math.sin(angle + Math.PI / 4) * sparkleSize * 0.3;
          ctx.lineTo(mx, my);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      } else if (p.type === 'star') {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    }

    function updateShootingStars() {
      // 随机生成流星
      if (Math.random() < 0.008) {
        const sx = Math.random() * W * 0.8;
        const sy = Math.random() * H * 0.4;
        const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.2;
        const speed = 4 + Math.random() * 4;
        shootingStars.push({
          x: sx, y: sy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 30 + Math.random() * 30,
          length: 60 + Math.random() * 80,
        });
      }
      
      // 更新和绘制流星
      shootingStars = shootingStars.filter(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        
        const progress = s.life / s.maxLife;
        const alpha = progress < 0.2 ? progress * 5 : (1 - progress) * 1.25;
        
        const tailX = s.x - (s.vx / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.length;
        const tailY = s.y - (s.vy / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.length;
        
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,230,250,${alpha * 0.9})`);
        grad.addColorStop(0.3, `rgba(220,160,200,${alpha * 0.5})`);
        grad.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        
        // 流星头部光点
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(255,200,240,0.8)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        return s.life < s.maxLife;
      });
    }

    function drawEnergyOrbs() {
      // 两个脉动能量核 — 粉色和紫色
      const pulseA = 1 + Math.sin(t * 0.002) * 0.3;
      const pulseB = 1 + Math.sin(t * 0.0025 + 2) * 0.3;
      
      const ax = W * 0.42 + Math.sin(t * 0.0005) * W * 0.04;
      const ay = H * 0.45 + Math.cos(t * 0.0004) * H * 0.03;
      const bx = W * 0.58 + Math.cos(t * 0.0006) * W * 0.04;
      const by = H * 0.52 + Math.sin(t * 0.0005) * H * 0.03;
      
      const rA = 80 * pulseA;
      const rB = 70 * pulseB;
      
      // 能量核A — 玫瑰粉
      const gA = ctx.createRadialGradient(ax, ay, 0, ax, ay, rA);
      gA.addColorStop(0, 'rgba(255,150,200,0.25)');
      gA.addColorStop(0.3, 'rgba(220,120,180,0.12)');
      gA.addColorStop(0.7, 'rgba(180,100,200,0.04)');
      gA.addColorStop(1, 'transparent');
      ctx.fillStyle = gA;
      ctx.fillRect(ax - rA, ay - rA, rA * 2, rA * 2);
      
      // 亮核
      ctx.globalAlpha = 0.8 * pulseA;
      ctx.fillStyle = '#ff96c8';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff96c8';
      ctx.beginPath();
      ctx.arc(ax, ay, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      
      // 能量核B — 紫色
      const gB = ctx.createRadialGradient(bx, by, 0, bx, by, rB);
      gB.addColorStop(0, 'rgba(160,100,255,0.22)');
      gB.addColorStop(0.3, 'rgba(140,80,220,0.10)');
      gB.addColorStop(0.7, 'rgba(120,60,200,0.03)');
      gB.addColorStop(1, 'transparent');
      ctx.fillStyle = gB;
      ctx.fillRect(bx - rB, by - rB, rB * 2, rB * 2);
      
      ctx.globalAlpha = 0.75 * pulseB;
      ctx.fillStyle = '#a064ff';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#a064ff';
      ctx.beginPath();
      ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      
      // 连线 — 两核之间的能量丝
      const dist = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
      const maxDist = Math.min(W, H) * 0.5;
      if (dist < maxDist) {
        const intensity = 1 - dist / maxDist;
        const midX = (ax + bx) / 2;
        const midY = (ay + by) / 2;
        
        const gM = ctx.createRadialGradient(midX, midY, 0, midX, midY, 40 * intensity);
        gM.addColorStop(0, `rgba(232,160,184,${0.15 * intensity})`);
        gM.addColorStop(0.5, `rgba(155,126,216,${0.08 * intensity})`);
        gM.addColorStop(1, 'transparent');
        ctx.fillStyle = gM;
        ctx.beginPath();
        ctx.arc(midX, midY, 40 * intensity, 0, Math.PI * 2);
        ctx.fill();
        
        // 多条能量丝
        for (let i = 0; i < 3; i++) {
          const offset = (i - 1) * 8;
          ctx.globalAlpha = 0.08 * intensity;
          ctx.strokeStyle = i === 1 ? '#d4af37' : '#e8a0b8';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          const cpx = midX + Math.sin(t * 0.003 + i) * 30;
          const cpy = midY + offset + Math.cos(t * 0.004 + i) * 15;
          ctx.quadraticCurveTo(cpx, cpy, bx, by);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    function animate() {
      t++;
      
      drawBackground();
      drawNebula();
      
      // 星云粒子（最后面）
      particles.filter(p => p.type === 'nebula').forEach(drawParticle);
      
      // 普通粒子
      particles.filter(p => p.type !== 'nebula').forEach(drawParticle);
      
      // 能量核
      drawEnergyOrbs();
      
      // 流星
      updateShootingStars();
      
      animRef.current = requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // 首次用户交互取消静音（浏览器政策要求）
  useEffect(() => {
    const unmute = () => {
      setIsMuted(false);
      document.removeEventListener('click', unmute);
      document.removeEventListener('touchstart', unmute);
    };
    document.addEventListener('click', unmute);
    document.addEventListener('touchstart', unmute);
    return () => {
      document.removeEventListener('click', unmute);
      document.removeEventListener('touchstart', unmute);
    };
  }, []);

  return (
    <>
      {/* 最底层：深色星空兜底 —— 视频缺失/加载失败时保住暗色底，绝不露白 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at 20% 50%, #0F0E26 0%, #0A0914 50%, #0A0914 100%)',
          zIndex: 0,
        }}
      />
      {/* 底层：视频背景 A 槽 — 加载完再淡入；多支时按 holdMs 轮播 */}
      <video
        key={`a:${itemA.src}`}
        ref={slotARef}
        src={itemA.src}
        autoPlay
        loop
        playsInline
        muted={isMuted}
        preload="auto"
        onClick={() => setIsMuted(m => !m)}
        onCanPlay={() => setReadyA(true)}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0,
          opacity: visible === 'a' && readyA ? 1 : 0,
          transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
          pointerEvents: visible === 'a' ? 'auto' : 'none',
        }}
      />
      {/* 底层：视频背景 B 槽 — 仅多支队列时渲染，预载下一支以实现交叉淡入 */}
      {multi && (
        <video
          key={`b:${itemB.src}`}
          ref={slotBRef}
          src={itemB.src}
          loop
          playsInline
          muted={isMuted}
          preload="auto"
          onClick={() => setIsMuted(m => !m)}
          onCanPlay={() => setReadyB(true)}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            zIndex: 0,
            opacity: visible === 'b' && readyB ? 1 : 0,
            transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
            pointerEvents: visible === 'b' ? 'auto' : 'none',
          }}
        />
      )}
      {/* 上层：粒子动画（半透明，覆盖水印） */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
