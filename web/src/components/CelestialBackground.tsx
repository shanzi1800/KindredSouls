import { useRef, useEffect } from 'react';

/**
 * CelestialBackground — 星尘显化粒子动画
 * 
 * 视觉概念：两颗星核 + 引力轨道 + 粉紫星云交融
 * 技术方案：Canvas 2D（轻量，无 WebGL 依赖，<100KB）
 * 配色：午夜蓝底 + 日落粉/迷幻紫/香槟金
 */
export default function CelestialBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    
    let W = 0, H = 0;
    let t = 0;

    // ── Color palette ──
    const C = {
      midnight: '#0a0a1a',
      nebulaPink: 'rgba(220,120,180,0.12)',
      nebulaPurple: 'rgba(140,80,200,0.10)',
      sunsetRose: '#e8a0b8',
      auraPurple: '#9b7ed8',
      champagneGold: '#d4af37',
      starWhite: 'rgba(255,255,255,0.85)',
      dustSoft: 'rgba(232,160,184,0.4)',
    };

    // ── Particles ──
    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      alpha: number;
      alphaSpeed: number;
      color: string;
      type: 'star' | 'dust' | 'sparkle';
    }

    let particles: Particle[] = [];

    // ── Two celestial cores (orbit centers) ──
    interface Core {
      cx: number; cy: number;
      orbitRadius: number;
      orbitSpeed: number;
      orbitPhase: number;
      size: number;
      glowSize: number;
      color: string;
      glowColor: string;
    }

    const coreA: Core = {
      cx: 0, cy: 0,
      orbitRadius: 0,
      orbitSpeed: 0.0003,
      orbitPhase: 0,
      size: 3,
      glowSize: 60,
      color: C.sunsetRose,
      glowColor: 'rgba(232,160,184,0.15)',
    };

    const coreB: Core = {
      cx: 0, cy: 0,
      orbitRadius: 0,
      orbitSpeed: 0.0004,
      orbitPhase: Math.PI,
      size: 2.5,
      glowSize: 50,
      color: C.auraPurple,
      glowColor: 'rgba(155,126,216,0.12)',
    };

    function resize() {
      W = canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      H = canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      
      // Position cores
      coreA.cx = W * 0.38;
      coreA.cy = H * 0.45;
      coreA.orbitRadius = Math.min(W, H) * 0.08;
      
      coreB.cx = W * 0.62;
      coreB.cy = H * 0.5;
      coreB.orbitRadius = Math.min(W, H) * 0.065;
      
      initParticles();
    }

    function initParticles() {
      particles = [];
      const count = Math.min(Math.floor((W * H) / 8000), 280);
      
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let type: Particle['type'] = 'dust';
        if (rand > 0.92) type = 'sparkle';
        else if (rand > 0.75) type = 'star';
        
        const colors = [C.dustSoft, `rgba(155,126,216,0.35)`, `rgba(212,175,55,0.3)`, 'rgba(255,255,255,0.25)'];
        
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.25 - 0.1, // slight upward drift
          size: type === 'sparkle' ? Math.random() * 2.5 + 0.5 : type === 'star' ? Math.random() * 1.8 + 0.5 : Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.8 + 0.2,
          alphaSpeed: Math.random() * 0.02 + 0.005,
          color: colors[Math.floor(Math.random() * colors.length)],
          type,
        });
      }
      
      // Add orbital dust around each core
      for (let c = 0; c < 2; c++) {
        const core = c === 0 ? coreA : coreB;
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 / 20) * i + Math.random() * 0.5;
          const r = core.orbitRadius * (0.6 + Math.random() * 0.8);
          particles.push({
            x: core.cx + Math.cos(angle) * r,
            y: core.cy + Math.sin(angle) * r,
            vx: 0, vy: 0,
            size: Math.random() * 1.5 + 0.4,
            alpha: Math.random() * 0.6 + 0.3,
            alphaSpeed: Math.random() * 0.03 + 0.01,
            color: c === 0 ? C.dustSoft : `rgba(155,126,216,0.45)`,
            type: 'dust',
          });
        }
      }
    }

    function drawNebula() {
      // Soft pink-purple nebula clouds (gradient blobs)
      const nx1 = W * 0.3 + Math.sin(t * 0.0002) * W * 0.05;
      const ny1 = H * 0.35 + Math.cos(t * 0.00015) * H * 0.03;
      
      const g1 = ctx.createRadialGradient(nx1, ny1, 0, nx1, ny1, W * 0.4);
      g1.addColorStop(0, 'rgba(220,120,180,0.08)');
      g1.addColorStop(0.5, 'rgba(180,100,200,0.04)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);
      
      const nx2 = W * 0.65 + Math.cos(t * 0.00018) * W * 0.06;
      const ny2 = H * 0.55 + Math.sin(t * 0.00022) * H * 0.04;
      
      const g2 = ctx.createRadialGradient(nx2, ny2, 0, nx2, ny2, W * 0.35);
      g2.addColorStop(0, 'rgba(140,80,200,0.07)');
      g2.addColorStop(0.6, 'rgba(200,130,180,0.03)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    }

    function drawCore(core: Core, phaseOffset: number) {
      const wobbleX = Math.sin(t * core.orbitSpeed + core.orbitPhase) * core.orbitRadius;
      const wobbleY = Math.cos(t * core.orbitSpeed * 0.7 + core.orbitPhase) * core.orbitRadius * 0.6;
      const x = core.cx + wobbleX;
      const y = core.cy + wobbleY;
      
      // Pulsing glow
      const pulse = 1 + Math.sin(t * 0.0015 + phaseOffset) * 0.25;
      const gs = core.glowSize * pulse;
      
      // Outer glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, gs);
      glow.addColorStop(0, core.glowColor);
      glow.addColorStop(0.4, core.color.replace(')', ',0.08)').replace('rgb', 'rgba'));
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, gs, 0, Math.PI * 2);
      ctx.fill();
      
      // Bright center
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = core.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = core.color;
      ctx.beginPath();
      ctx.arc(x, y, core.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      
      return { x, y };
    }

    function drawOrbitPath(cx: number, cy: number, radius: number, color: string) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.12;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    function drawParticle(p: Particle) {
      p.alpha += Math.sin(t * p.alphaSpeed) * 0.008;
      p.alpha = Math.max(0.08, Math.min(1, p.alpha));
      
      // Gentle drift toward center (gravity feel)
      const centerX = W * 0.5;
      const centerY = H * 0.45;
      p.vx += (centerX - p.x) * 0.00002;
      p.vy += (centerY - p.y) * 0.000015;
      
      p.x += p.vx;
      p.y += p.vy;
      
      // Wrap around edges
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
      
      ctx.globalAlpha = p.alpha;
      
      if (p.type === 'sparkle') {
        // Crystal prism effect — 4-point star
        const sparkleSize = p.size * (1 + Math.sin(t * 0.005 + p.x) * 0.5);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(t * 0.001 + p.x * 0.01);
        
        // Light leak rainbow
        const hue = (t * 0.02 + p.y * 0.1) % 360;
        ctx.fillStyle = `hsla(${hue}, 70%, 75%, ${p.alpha * 0.6})`;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i;
          const sx = Math.cos(angle) * sparkleSize;
          const sy = Math.sin(angle) * sparkleSize;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
          const mx = Math.cos(angle + Math.PI / 4) * sparkleSize * 0.35;
          const my = Math.sin(angle + Math.PI / 4) * sparkleSize * 0.35;
          ctx.lineTo(mx, my);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'star') {
        // Soft round star with glow
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = C.starWhite;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Dust — tiny soft dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    }

    function drawEnergyBridge(posA: { x: number; y: number }, posB: { x: number; y: number }) {
      // Energy connection between two cores when close
      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.min(W, H) * 0.4;
      
      if (dist < maxDist) {
        const intensity = 1 - dist / maxDist;
        const midX = (posA.x + posB.x) / 2;
        const midY = (posA.y + posB.y) / 2;
        
        // Pulsing energy field at midpoint
        const pulseSize = 30 + Math.sin(t * 0.002) * 15;
        const bridge = ctx.createRadialGradient(midX, midY, 0, midX, midY, pulseSize * intensity);
        bridge.addColorStop(0, `rgba(232,160,184,${0.15 * intensity})`);
        bridge.addColorStop(0.5, `rgba(155,126,216,${0.08 * intensity})`);
        bridge.addColorStop(1, 'transparent');
        ctx.fillStyle = bridge;
        ctx.beginPath();
        ctx.arc(midX, midY, pulseSize * intensity, 0, Math.PI * 2);
        ctx.fill();
        
        // Subtle connecting line
        ctx.globalAlpha = 0.06 * intensity;
        ctx.strokeStyle = C.champagneGold;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.moveTo(posA.x, posA.y);
        ctx.lineTo(posB.x, posB.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }

    function animate() {
      t++;
      
      // Clear with midnight base
      ctx.fillStyle = C.midnight;
      ctx.fillRect(0, 0, W, H);
      
      // Nebula background layers
      drawNebula();
      
      // Draw non-orbital particles first (background layer)
      particles.filter(p => !(p.vx === 0 && p.vy === 0)).forEach(drawParticle);
      
      // Orbit paths
      drawOrbitPath(coreA.cx, coreA.cy, coreA.orbitRadius, C.sunsetRose);
      drawOrbitPath(coreB.cx, coreB.cy, coreB.orbitRadius, C.auraPurple);
      
      // Cores with position
      const posA = drawCore(coreA, 0);
      const posB = drawCore(coreB, Math.PI);
      
      // Energy bridge between cores
      drawEnergyBridge(posA, posB);
      
      // Orbital particles (foreground)
      particles.filter(p => p.vx === 0 && p.vy === 0).forEach((p, i) => {
        // Animate orbital particles along their core's orbit
        const core = i < 20 ? coreA : coreB;
        const idx = i < 20 ? i : i - 20;
        const angle = (Math.PI * 2 / 20) * idx + t * 0.0008 * (i < 20 ? 1 : -1);
        const r = core.orbitRadius * (0.6 + ((idx * 17) % 10) / 10 * 0.8);
        p.x = core.cx + Math.cos(angle + t * core.orbitSpeed * (i < 20 ? 1 : 1.3)) * r;
        p.y = core.cy + Math.sin(angle + t * core.orbitSpeed * (i < 20 ? 1 : 1.3)) * r * 0.6;
        p.alpha = 0.4 + Math.sin(t * 0.003 + idx) * 0.3;
        
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      
      // Occasional shooting star
      if (Math.random() < 0.002) {
        const sx = Math.random() * W * 0.7;
        const sy = Math.random() * H * 0.3;
        const grad = ctx.createLinearGradient(sx, sy, sx + 80, sy + 40);
        grad.addColorStop(0, 'rgba(255,255,255,0.7)');
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 80, sy + 40);
        ctx.stroke();
      }
      
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

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
