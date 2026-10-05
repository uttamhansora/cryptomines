import { useEffect, useMemo, useRef } from 'react';

const COLORS = ['#22D3EE', '#06B6D4', '#A78BFA', '#F59E0B', '#34D399'];

/**
 * Lightweight DOM confetti — 60 absolutely-positioned divs animated with
 * transform/opacity only, removed on animationend. No dependencies.
 */
export default function Confetti({ count = 60 }) {
  const ref = useRef(null);

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.4 + Math.random() * 1.2,
        dx: (Math.random() - 0.5) * 240,
        rot: (Math.random() - 0.5) * 720,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
      })),
    [count]
  );

  // Clean up if unmounted mid-flight
  useEffect(() => {
    const node = ref.current;
    return () => node?.querySelectorAll('.cm-confetti-piece').forEach((el) => el.remove());
  }, []);

  return (
    <div className="cm-confetti" ref={ref} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="cm-confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--cm-cf-dx': `${p.dx}px`,
            '--cm-cf-rot': `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
