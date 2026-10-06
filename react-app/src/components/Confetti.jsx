import { useMemo } from 'react';

/**
 * Win celebration particles — reference palette only (cyan + gold).
 * Pure CSS transform/opacity keyframes; pieces are static spans so the
 * effect costs nothing per frame after mount and never blocks interaction.
 */
const COLORS = ['#00F0FF', '#00D2D3', '#F5B94C', '#FFD98A'];

export default function Confetti({ count = 60 }) {
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

  return (
    <div className="cm-confetti" aria-hidden="true">
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
