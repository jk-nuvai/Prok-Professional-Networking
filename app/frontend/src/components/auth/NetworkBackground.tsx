import React, { useEffect, useRef } from 'react';

interface Node {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number;
  pulseOffset: number;
}

const NetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const nodesRef  = useRef<Node[]>([]);
  const mouseRef  = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;

    const init = () => {
      const count = Math.max(Math.floor((cv.width * cv.height) / 18000), 40);
      nodesRef.current = Array.from({ length: count }, () => ({
        x:           Math.random() * cv.width,
        y:           Math.random() * cv.height,
        vx:          (Math.random() - 0.5) * 0.4,
        vy:          (Math.random() - 0.5) * 0.4,
        r:           1.5 + Math.random() * 2,
        alpha:       0.3 + Math.random() * 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      cv.width  = window.innerWidth;
      cv.height = window.innerHeight;
      init();
    };

    const CONNECT_DIST = 160;
    const MOUSE_DIST   = 200;

    let t = 0;
    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, cv.width, cv.height);

      // Subtle radial vignette
      const vg = ctx.createRadialGradient(
        cv.width / 2, cv.height / 2, cv.height * 0.1,
        cv.width / 2, cv.height / 2, cv.height * 0.9,
      );
      vg.addColorStop(0, 'rgba(80,57,184,0.04)');
      vg.addColorStop(1, 'rgba(6,6,15,0.0)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, cv.width, cv.height);

      const nodes = nodesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const n of nodes) {
        const dx = n.x - mx, dy = n.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST && dist > 0) {
          const force = (1 - dist / MOUSE_DIST) * 60;
          n.vx += (dx / dist) * force * 0.003;
          n.vy += (dy / dist) * force * 0.003;
        }
        n.vx *= 0.99;
        n.vy *= 0.99;
        n.x  += n.vx;
        n.y  += n.vy;
        if (n.x < -20) n.x = cv.width + 20;
        if (n.x > cv.width + 20) n.x = -20;
        if (n.y < -20) n.y = cv.height + 20;
        if (n.y > cv.height + 20) n.y = -20;
      }

      // Node–node connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d > CONNECT_DIST) continue;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(142,107,223,${(1 - d / CONNECT_DIST) * 0.18})`;
          ctx.lineWidth   = 1;
          ctx.stroke();
        }
      }

      // Mouse connection lines
      for (const n of nodes) {
        const dx = n.x - mx, dy = n.y - my;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d > MOUSE_DIST) continue;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(mx, my);
        ctx.strokeStyle = `rgba(155,122,234,${(1 - d / MOUSE_DIST) * 0.45})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      // Nodes
      for (const n of nodes) {
        const a = n.alpha * (0.6 + 0.4 * Math.sin(t * 1.8 + n.pulseOffset));
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
        grad.addColorStop(0, `rgba(142,107,223,${(a * 0.35).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(142,107,223,0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(178,158,244,${a.toFixed(3)})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMove  = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    resize();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
};

export default NetworkBackground;
