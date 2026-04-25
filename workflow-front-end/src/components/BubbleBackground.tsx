import { useEffect, useRef } from "react";

const PARTICLE_COLORS = ["#00CFFF", "#48CAE4", "#90E0EF", "#ADE8F4", "#00F5C4"];

export default function BubbleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Dot = { x: number; y: number; r: number; color: string; vx: number; vy: number };
    let dots: Dot[] = [];
    let animId: number;

    const init = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      dots = Array.from({ length: 35 }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 6 + 3,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        vx:    (Math.random() - 0.5) * 0.2,
        vy:    -(Math.random() * 0.4 + 0.1),
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((d) => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < -d.r) d.x = canvas.width + d.r;
        if (d.x > canvas.width + d.r) d.x = -d.r;
        if (d.y < -d.r) { d.y = canvas.height + d.r; d.x = Math.random() * canvas.width; }
      });

      const byColor: Record<string, Dot[]> = {};
      dots.forEach((d) => { (byColor[d.color] ??= []).push(d); });
      Object.entries(byColor).forEach(([color, group]) => {
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.2;
        group.forEach((d) => {
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
      });
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(draw);
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(init, 150); };
    window.addEventListener("resize", onResize);
    init();
    draw();

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-60 pointer-events-none"
    />
  );
}
