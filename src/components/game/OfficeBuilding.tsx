import { useEffect, useState } from 'react';
import { useGame } from '@/game/store';
import { BUSINESSES } from '@/game/config';
import { FloatingNumbers } from './FloatingNumbers';

export function OfficeBuilding() {
  const businesses = useGame((s) => s.state.businesses);
  const ownedCount = Object.values(businesses).filter((b) => b.owned).length;
  const tier = Math.min(5, Math.floor(ownedCount));

  const floors = Math.max(3, tier + 3);

  const [lightSeed, setLightSeed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLightSeed((n) => n + 1), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex h-full min-h-[260px] items-end justify-center overflow-hidden rounded-2xl border border-border/60 bg-card-gradient">
      {/* Starfield */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-px rounded-full bg-accent/60"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 60}%`,
              opacity: 0.3 + ((i * 7) % 7) / 10,
              boxShadow: '0 0 4px hsl(var(--accent))',
            }}
          />
        ))}
      </div>

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Building */}
      <div className="relative z-10 mb-4 flex flex-col items-center animate-building-glow">
        {/* Antenna */}
        <div className="h-6 w-0.5 bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
        <div className="-mt-1 h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent))]" />

        {/* Roof */}
        <div className="h-3 w-32 rounded-t-md bg-gradient-to-b from-primary/80 to-primary/40" />

        {/* Floors */}
        <div className="flex flex-col" style={{ background: 'var(--gradient-building)' }}>
          {Array.from({ length: floors }).map((_, i) => (
            <div key={i} className="flex w-28 justify-center gap-1.5 border-b border-background/40 px-2 py-1.5">
              {Array.from({ length: 4 }).map((_, j) => {
                const lit = (i + j + Math.floor(Date.now() / 2000)) % 3 !== 0;
                return (
                  <div
                    key={j}
                    className={`h-2.5 w-4 rounded-sm transition-colors ${
                      lit ? 'bg-primary/90 shadow-[0_0_6px_hsl(var(--primary)/0.8)]' : 'bg-background/60'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Base */}
        <div className="h-2 w-32 rounded-b-md bg-gradient-to-b from-secondary to-background" />

        {/* Workers */}
        <div className="mt-3 flex gap-2">
          {Array.from({ length: Math.min(ownedCount + 1, 4) }).map((_, i) => (
            <div key={i} className="animate-worker" style={{ animationDelay: `${i * 0.2}s` }}>
              <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_4px_hsl(var(--accent))]" />
              <div className="mt-0.5 h-3 w-2 rounded-sm bg-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* Tier badge */}
      <div className="absolute right-3 top-3 rounded-full border border-primary/40 bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">
        Empire Tier {tier + 1}
      </div>
      <div className="absolute left-3 top-3 rounded-full border border-accent/40 bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur">
        {ownedCount}/{BUSINESSES.length} Owned
      </div>

      <FloatingNumbers />
    </div>
  );
}
