import { useEffect, useState } from 'react';

/**
 * Emits a one-shot pixel sparkle burst when `trigger` changes.
 * Mount inside a relative-positioned parent.
 */
export function SparkleBurst({ trigger, count = 8, color = 'var(--primary)' }: { trigger: number; count?: number; color?: string }) {
  const [key, setKey] = useState(0);
  useEffect(() => { if (trigger) setKey((k) => k + 1); }, [trigger]);
  if (!key) return null;
  return (
    <div key={key} className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dx = Math.cos(angle) * 28;
        const dy = Math.sin(angle) * 28;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-sm animate-sparkle-pop pixel-crisp"
            style={{
              background: `hsl(${color})`,
              boxShadow: `0 0 8px hsl(${color} / 0.9)`,
              // @ts-ignore - custom translate via inline transform override
              transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`,
              animationDelay: `${i * 20}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
