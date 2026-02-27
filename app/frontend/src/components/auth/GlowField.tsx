/**
 * GlowField
 *   1. Breath      — slow purple bottom-line pulse while focused
 *   2. Ripple      — expanding rings from border on focus gain
 *   3. Neon sweep  — comet traces the field border on focus gain
 *   4. Particles   — purple orbs float UP on every keystroke
 *   5. Word burst  — bigger radial burst when spacebar is pressed
 *   6. Dissolve    — glowing motes + flash ring at exact cursor on delete
 */
import React, { useRef, useEffect, useCallback } from 'react';

// ─── Palettes ─────────────────────────────────────────────────────────────────
const TYPING_COLORS  = ['#7B54D4','#8E6BDF','#9B7AEA','#5039B8','#6A4CC7','#B49EF4'];
const MOTE_COLORS    = ['#C4B0FF','#B49EF4','#9B7AEA','#D4C8FF','#8E6BDF','#ffffff'];

// ─── Canvas layout constants ───────────────────────────────────────────────────
const OL = 220, OT = 70, OR = 50, OB = 110;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Particle { x:number; yOff:number; vx:number; vy:number; life:number; decay:number; size:number; color:string; }

// Dissolve mote — glowing orb at exact cursor position
interface Mote { x:number; y:number; vx:number; vy:number; life:number; decay:number; r:number; color:string; }

// Flash ring — brief expanding glow circle at deletion point
interface Flash { x:number; y:number; life:number; decay:number; }

function rnd()  { return Math.random(); }
function pick<T>(arr: T[]) { return arr[Math.floor(rnd() * arr.length)]; }
function clamp(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }

function hexRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${clamp(a,0,1)})`;
}

// ─── Measure cursor pixel position inside the input ───────────────────────────
const _measureCanvas = document.createElement('canvas');
const _measureCtx    = _measureCanvas.getContext('2d')!;

function cursorPixelX(el: HTMLInputElement, fieldOffsetLeft: number): number {
  const idx    = el.selectionStart ?? el.value.length;
  const text   = el.value.slice(0, idx);
  const style  = window.getComputedStyle(el);
  _measureCtx.font = `${style.fontSize} ${style.fontFamily}`;
  const textW  = _measureCtx.measureText(text).width;
  const padL   = parseFloat(style.paddingLeft) || 44;
  // Clamp so it stays inside the visible field area
  return fieldOffsetLeft + clamp(padL + textW, padL, el.offsetWidth - 8);
}

// ─── Rounded-rect perimeter points ────────────────────────────────────────────
function rrectPoints(x:number,y:number,w:number,h:number,r:number,steps=200){
  const pts:[number,number][]=[];
  const corners:[number,number,number,number][]=[
    [x+r,  y+r,  Math.PI,    Math.PI*1.5],
    [x+w-r,y+r,  -Math.PI/2, 0          ],
    [x+w-r,y+h-r,0,          Math.PI/2  ],
    [x+r,  y+h-r,Math.PI/2,  Math.PI    ],
  ];
  const pc=Math.floor(steps/4);
  for(const [cx,cy,start,end] of corners){
    for(let i=0;i<=pc;i++){
      const a=start+(end-start)*i/pc;
      pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);
    }
  }
  return pts;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface GlowFieldProps {
  children: React.ReactNode;
  value: string;
  focused: boolean;
  glowColor?: string;
  borderRadius?: number;
}

export const GlowField: React.FC<GlowFieldProps> = ({
  children, value, focused,
  glowColor = '#8E6BDF',
  borderRadius = 12,
}) => {
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const breathAnimRef = useRef<number>(0);

  const particles = useRef<Particle[]>([]);
  const motes     = useRef<Mote[]>([]);
  const flashes   = useRef<Flash[]>([]);
  const prevValue = useRef(value);
  const prevFocus = useRef(focused);
  const rafRef    = useRef(0);
  const lastTimeRef = useRef(0);

  const sweepRef   = useRef({ progress: 0, active: false, startTime: 0 });
  const SWEEP_DUR  = 960;
  const rippleRef  = useRef({ progress: 0, active: false, startTime: 0 });
  const RIPPLE_DUR = 720;
  const breathRef  = useRef({ phase: 0, value: 0 });
  const fieldDims  = useRef({ w: 300, h: 48 });

  // ─── Spawn helpers ─────────────────────────────────────────────────────────
  const spawnParticles = useCallback((count = 0) => {
    const n = count > 0 ? count : 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      particles.current.push({
        x:     clamp(0.04 + rnd() * 0.92, 0.04, 0.96),
        yOff:  0,
        vx:    (rnd() - 0.5) * 0.14,
        vy:    22 + rnd() * 50,
        life:  1,
        decay: 1.8 + rnd() * 1.2,
        size:  0.5 + rnd() * 1.4,
        color: pick(TYPING_COLORS),
      });
    }
  }, []);

  const spawnWordBurst = useCallback(() => {
    const count = 6 + Math.floor(rnd() * 5);
    for (let i = 0; i < count; i++) {
      const angle = rnd() * 2 * Math.PI;
      const speed = 30 + rnd() * 60;
      particles.current.push({
        x:     clamp(0.5 + (rnd()-0.5)*0.1, 0.04, 0.96),
        yOff:  0,
        vx:    Math.cos(angle) * 0.18,
        vy:    22 + speed * Math.abs(Math.sin(angle + Math.PI/2)),
        life:  1,
        decay: 1.4 + rnd() * 1.0,
        size:  0.8 + rnd() * 1.8,
        color: pick(TYPING_COLORS),
      });
    }
  }, []);

  // ─── New: dissolve motes at exact cursor position ──────────────────────────
  const spawnDissolve = useCallback(() => {
    const { w: fw, h: fh } = fieldDims.current;

    // Resolve exact cursor x from the active input element
    let cx = OL + fw * 0.5; // fallback: field center
    const activeEl = document.activeElement as HTMLInputElement | null;
    if (activeEl && activeEl.tagName === 'INPUT' && wrapperRef.current?.contains(activeEl)) {
      cx = cursorPixelX(activeEl, OL);
    }
    const cy = OT + fh * 0.5;

    // Flash ring at deletion point
    flashes.current.push({ x: cx, y: cy, life: 1, decay: 5.5 });

    // Mote burst — tight radial spread, slight upward bias
    const count = 9 + Math.floor(rnd() * 5);
    for (let i = 0; i < count; i++) {
      // Bias angles toward upper half (−π to 0) for an upward bloom
      const angle  = -Math.PI * (0.1 + rnd() * 1.1) + (rnd() < 0.25 ? Math.PI * (rnd() * 0.4) : 0);
      const speed  = 18 + rnd() * 55;
      motes.current.push({
        x:     cx + (rnd() - 0.5) * 3,
        y:     cy + (rnd() - 0.5) * 3,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed,
        life:  1,
        decay: 2.8 + rnd() * 1.6,
        r:     0.6 + rnd() * 1.6,
        color: pick(MOTE_COLORS),
      });
    }
  }, []);

  // ─── Canvas sizing ─────────────────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const el = wrapperRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;
    const { offsetWidth: w, offsetHeight: h } = el;
    fieldDims.current = { w, h };
    cv.width  = w + OL + OR;
    cv.height = h + OT + OB;
    cv.style.left   = `-${OL}px`;
    cv.style.top    = `-${OT}px`;
    cv.style.width  = `${w + OL + OR}px`;
    cv.style.height = `${h + OT + OB}px`;
  }, []);

  // ─── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback((timestamp: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const { w: fw, h: fh } = fieldDims.current;
    ctx.clearRect(0, 0, cv.width, cv.height);

    const dt = lastTimeRef.current
      ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
      : 0.016;
    lastTimeRef.current = timestamp;

    // ── Physics ───────────────────────────────────────────────────────────────
    for (const p of particles.current) {
      p.x    += p.vx * dt;
      p.yOff += p.vy * dt;
      p.vy   -= p.vy * 0.9 * dt;
      p.life -= p.decay * dt;
    }
    particles.current = particles.current.filter(p => p.life > 0);

    for (const m of motes.current) {
      m.x  += m.vx * dt;
      m.y  += m.vy * dt;
      m.vx *= (1 - dt * 3.2);   // quick drag
      m.vy *= (1 - dt * 2.8);
      m.vy -= 8 * dt;            // subtle upward drift
      m.life -= m.decay * dt;
    }
    motes.current = motes.current.filter(m => m.life > 0);

    for (const fl of flashes.current) {
      fl.life -= fl.decay * dt;
    }
    flashes.current = flashes.current.filter(fl => fl.life > 0);

    // ── Sweep / ripple / breath ───────────────────────────────────────────────
    const sweepState  = sweepRef.current;
    if (sweepState.active) {
      sweepState.progress = Math.min((timestamp - sweepState.startTime) / SWEEP_DUR, 1);
      if (sweepState.progress >= 1) sweepState.active = false;
    }
    const rippleState = rippleRef.current;
    if (rippleState.active) {
      rippleState.progress = Math.min((timestamp - rippleState.startTime) / RIPPLE_DUR, 1);
      if (rippleState.progress >= 1) rippleState.active = false;
    }
    const breathState = breathRef.current;
    if (focused) {
      breathState.phase += dt * (2 * Math.PI / 2.2);
      breathState.value  = 0.5 + 0.5 * Math.sin(breathState.phase);
    } else {
      breathState.value = Math.max(0, breathState.value - dt * 3);
    }

    // ══ DRAW ══════════════════════════════════════════════════════════════════

    // ① Ripple rings ────────────────────────────────────────────────────────
    if (rippleState.progress > 0 && rippleState.progress < 1) {
      const t = rippleState.progress;
      const drawRing = (delay: number, maxA: number) => {
        const tA = clamp((t - delay) / (1 - delay), 0, 1);
        if (tA <= 0) return;
        const expand = tA * 50;
        const alpha  = (1 - tA) * maxA;
        if (alpha < 0.01) return;
        ctx.beginPath();
        ctx.roundRect(OL - expand, OT - expand, fw + expand*2, fh + expand*2, borderRadius + expand * 0.35);
        ctx.strokeStyle = hexRgba(glowColor, alpha);
        ctx.lineWidth   = 2.5 * (1 - tA);
        ctx.shadowColor = hexRgba(glowColor, alpha * 0.6);
        ctx.shadowBlur  = 3 + tA * 10;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      };
      drawRing(0.00, 0.55);
      drawRing(0.22, 0.28);
    }

    // ② Neon sweep comet ────────────────────────────────────────────────────
    if (sweepState.progress > 0 && sweepState.progress < 1) {
      const sweep   = sweepState.progress;
      const pts     = rrectPoints(OL, OT, fw, fh, borderRadius, 200);
      const total   = pts.length;
      const headIdx = Math.floor(sweep * total);
      const tailLen = Math.floor(total * 0.18);
      const endFade = sweep > 0.82 ? (1 - sweep) / 0.18 : 1.0;
      for (let i = 30; i >= 0; i--) {
        const frac = i / 30;
        const idx  = headIdx - Math.floor(tailLen * frac);
        if (idx < 0) continue;
        const pt = pts[idx % total];
        if (!pt) continue;
        const a    = (1 - frac) * endFade;
        if (a < 0.02) continue;
        const dotR = (1 - frac) * 3.2 + 0.5;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], dotR * 3, 0, Math.PI * 2);
        ctx.fillStyle   = hexRgba(glowColor, a * 0.26);
        ctx.shadowColor = hexRgba(glowColor, a * 0.4);
        ctx.shadowBlur  = dotR * 2.5;
        ctx.fill();
        ctx.shadowBlur  = 0;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], dotR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a * 0.78})`;
        ctx.fill();
      }
    }

    // ③ Typing particles ────────────────────────────────────────────────────
    for (const p of particles.current) {
      const a  = clamp(p.life * p.life, 0, 1);
      if (a < 0.01) continue;
      const px = OL + clamp(p.x, 0.04, 0.96) * fw;
      const py = OT + fh - p.yOff;
      ctx.beginPath();
      ctx.arc(px, py, p.size * 3.5, 0, Math.PI * 2);
      ctx.fillStyle   = hexRgba(p.color, a * 0.09);
      ctx.shadowColor = hexRgba(p.color, a * 0.3);
      ctx.shadowBlur  = p.size * 3;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, p.size * 1.8, 0, Math.PI * 2);
      ctx.fillStyle  = hexRgba(p.color, a * 0.24);
      ctx.shadowBlur = p.size * 1.2;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(px, py, p.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle  = hexRgba(p.color, a * 0.52);
      ctx.fill();
    }

    // ④ Flash rings at deletion point ───────────────────────────────────────
    for (const fl of flashes.current) {
      const a = clamp(fl.life, 0, 1);
      if (a < 0.01) continue;
      // Inner tight ring
      const r1 = (1 - a) * 14 + 2;
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, r1, 0, Math.PI * 2);
      ctx.strokeStyle = hexRgba('#D4C8FF', a * 0.75);
      ctx.lineWidth   = 1.5 * a;
      ctx.shadowColor = hexRgba('#B49EF4', a * 0.5);
      ctx.shadowBlur  = 6;
      ctx.stroke();
      ctx.shadowBlur  = 0;
      // Outer softer ring
      const r2 = (1 - a) * 26 + 4;
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, r2, 0, Math.PI * 2);
      ctx.strokeStyle = hexRgba(glowColor, a * 0.35);
      ctx.lineWidth   = 1 * a;
      ctx.stroke();
    }

    // ⑤ Dissolve motes ──────────────────────────────────────────────────────
    for (const m of motes.current) {
      const a = clamp(m.life * m.life, 0, 1); // quadratic — sharp start, smooth fade
      if (a < 0.01) continue;

      // Soft radial glow
      const grd = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 5);
      grd.addColorStop(0,   hexRgba(m.color, a * 0.55));
      grd.addColorStop(0.4, hexRgba(m.color, a * 0.18));
      grd.addColorStop(1,   hexRgba(m.color, 0));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * 5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle   = `rgba(255,255,255,${a * 0.88})`;
      ctx.shadowColor = hexRgba(m.color, a * 0.7);
      ctx.shadowBlur  = m.r * 4;
      ctx.fill();
      ctx.shadowBlur  = 0;
    }

    // ⑥ Breath bottom line ──────────────────────────────────────────────────
    const bv = breathRef.current.value;
    if (bv > 0.02) {
      const lineY  = OT + fh - 1;
      const lineX1 = OL + 6;
      const lineX2 = OL + fw - 6;
      const grad   = ctx.createLinearGradient(lineX1, lineY, lineX2, lineY);
      grad.addColorStop(0.00, 'transparent');
      grad.addColorStop(0.15, hexRgba(glowColor, clamp(bv * 0.62, 0, 1)));
      grad.addColorStop(0.85, hexRgba(glowColor, clamp(bv * 0.62, 0, 1)));
      grad.addColorStop(1.00, 'transparent');
      ctx.beginPath();
      ctx.moveTo(lineX1, lineY);
      ctx.lineTo(lineX2, lineY);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 2;
      ctx.shadowColor = hexRgba(glowColor, clamp(bv * 0.15, 0, 1));
      ctx.shadowBlur  = 8;
      ctx.stroke();
      ctx.shadowBlur  = 0;
    }

    // ── Continue loop ─────────────────────────────────────────────────────────
    const needLoop =
      particles.current.length > 0 ||
      motes.current.length     > 0 ||
      flashes.current.length   > 0 ||
      sweepState.active  ||
      rippleState.active ||
      breathRef.current.value > 0.01;

    if (needLoop) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      rafRef.current    = 0;
      lastTimeRef.current = 0;
    }
  }, [focused, glowColor, borderRadius]);

  const startLoop = useCallback(() => {
    if (rafRef.current) return;
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // ─── Focus changes ────────────────────────────────────────────────────────
  useEffect(() => {
    const wasFocused = prevFocus.current;
    prevFocus.current = focused;
    if (focused && !wasFocused) {
      const now = performance.now();
      rippleRef.current = { progress: 0, active: true, startTime: now };
      sweepRef.current  = { progress: 0, active: true, startTime: now };
      startLoop();
    }
    if (focused) startLoop();
  }, [focused, startLoop]);

  // ─── Value changes ────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = prevValue.current;
    prevValue.current = value;
    if (!focused) return;

    if (value.length < prev.length) {
      spawnDissolve();                      // ← new elite erase effect
    } else if (value.length > prev.length) {
      const added = value.slice(prev.length);
      if (added.includes(' ')) spawnWordBurst();
      else                      spawnParticles();
    }
    startLoop();
  }, [value, focused, spawnParticles, spawnWordBurst, spawnDissolve, startLoop]);

  // ─── Setup & cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => {
      ro.disconnect();
      if (rafRef.current)    cancelAnimationFrame(rafRef.current);
      if (breathAnimRef.current) cancelAnimationFrame(breathAnimRef.current);
    };
  }, [resizeCanvas]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'block' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', pointerEvents: 'none', zIndex: 10 }}
      />
      {children}
    </div>
  );
};

export default GlowField;
