import { useMemo } from 'react';

/**
 * Fixed-position ambient dust motes drifting across the viewport.
 * Purely decorative, GPU-only transforms, pointer-events disabled.
 */
export function AmbientParticles({ count = 22 }: { count?: number }) {
  const motes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 47) % 100,
        top: 40 + ((i * 29) % 60),
        delay: (i * 0.7) % 12,
        duration: 10 + ((i * 3) % 8),
        size: 1 + (i % 3),
        hue: i % 3 === 0 ? 'var(--primary)' : i % 3 === 1 ? 'var(--accent)' : 'var(--foreground)',
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {motes.map((m) => (
        <span
          key={m.id}
          className="animate-dust absolute rounded-full"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            background: `hsl(${m.hue} / 0.5)`,
            boxShadow: `0 0 6px hsl(${m.hue} / 0.6)`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
