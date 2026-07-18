import { useEffect, useMemo, useState } from 'react';
import { useGame } from '@/game/store';
import { BUSINESSES } from '@/game/config';
import { FloatingNumbers } from './FloatingNumbers';

/**
 * Headquarters scene. Building visuals upgrade through 5 tiers:
 *   1 Storefront  →  2 Office  →  3 Highrise  →  4 Skyscraper  →  5 Arcology
 * Each tier adds floors, accent lights, a roof feature, and a denser worker crowd.
 */
export function OfficeBuilding() {
  const businesses = useGame((s) => s.state.businesses);
  const ownedCount = Object.values(businesses).filter((b) => b.owned).length;
  const tier = Math.min(5, Math.max(1, Math.floor(ownedCount / 2) + 1));

  const floors = 2 + tier * 2; // 4 → 12
  const widthPx = 96 + tier * 18; // wider with tier
  const tierName = ['Storefront', 'Office', 'Highrise', 'Skyscraper', 'Arcology'][tier - 1];

  const [lightSeed, setLightSeed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLightSeed((n) => n + 1), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex h-full min-h-[280px] items-end justify-center overflow-hidden rounded-2xl border border-border/60 bg-card-gradient">
      {/* Sky / starfield */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-px rounded-full bg-accent/60"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 65}%`,
              opacity: 0.3 + ((i * 7) % 7) / 10,
              boxShadow: '0 0 4px hsl(var(--accent))',
              animation: `pulse-glow ${2 + (i % 5)}s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Drifting clouds */}
      <div className="pointer-events-none absolute inset-x-0 top-4 h-16 opacity-30">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-3 rounded-full bg-foreground/40 blur-sm"
            style={{
              width: 40 + i * 20,
              left: `${(i * 40) % 100}%`,
              top: i * 12,
              animation: `ticker ${60 + i * 20}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Smoke puffs from higher-tier building */}
      {tier >= 2 && (
        <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className="animate-smoke absolute block h-3 w-3 rounded-full bg-muted-foreground/40 blur-[2px]"
              style={{ left: i * 6 - 6, animationDelay: `${i * 1.2}s` }}
            />
          ))}
        </div>
      )}


      {/* Neighbor skyline silhouettes (depth) */}
      <div className="pointer-events-none absolute bottom-12 left-0 right-0 flex items-end justify-around opacity-50">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="bg-secondary/70"
            style={{
              width: 18 + ((i * 7) % 14),
              height: 30 + ((i * 23) % 70),
              boxShadow: 'inset 0 0 0 1px hsl(var(--border))',
            }}
          />
        ))}
      </div>

      {/* Ground glow */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Main building */}
      <div className="relative z-10 mb-4 flex flex-col items-center animate-building-glow">
        {/* Antenna / spire — fancier at higher tiers */}
        {tier >= 2 && (
          <>
            <div className="h-6 w-0.5 bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
            <div className="-mt-1 h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent))]" />
          </>
        )}
        {tier >= 4 && (
          <div className="-mt-1 h-3 w-6 rounded-full bg-primary/80 shadow-[0_0_12px_hsl(var(--primary))]" />
        )}

        {/* Roof feature */}
        <div
          className="h-3 rounded-t-md bg-gradient-to-b from-primary/80 to-primary/40"
          style={{ width: widthPx + 8 }}
        />
        {tier >= 3 && (
          <div className="h-1 w-full bg-accent/60" style={{ width: widthPx + 4 }} />
        )}

        {/* Floors */}
        <div className="flex flex-col" style={{ background: 'var(--gradient-building)', width: widthPx }}>
          {Array.from({ length: floors }).map((_, i) => {
            const isAccentFloor = tier >= 3 && i % 4 === 0;
            return (
              <div
                key={i}
                className={
                  'flex justify-center gap-1.5 border-b border-background/40 px-2 py-1.5'
                }
                style={{
                  background: isAccentFloor ? 'linear-gradient(180deg, hsl(var(--accent) / 0.15), transparent)' : undefined,
                }}
              >
                {Array.from({ length: tier >= 3 ? 5 : 4 }).map((_, j) => {
                  const lit = (i + j + lightSeed) % 3 !== 0;
                  return (
                    <div
                      key={j}
                      className={`h-2.5 w-3.5 rounded-sm transition-colors ${
                        lit ? 'bg-primary/90 shadow-[0_0_6px_hsl(var(--primary)/0.8)]' : 'bg-background/60'
                      }`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Base */}
        <div className="h-2 rounded-b-md bg-gradient-to-b from-secondary to-background" style={{ width: widthPx + 8 }} />
        {/* Entrance */}
        <div className="-mt-2 h-2.5 w-6 rounded-t-md bg-accent/70 shadow-[0_0_10px_hsl(var(--accent)/0.7)]" />

        {/* Rotating rooftop gears for industrial vibe (tier 3+) */}
        {tier >= 3 && (
          <div className="pointer-events-none absolute -right-2 top-8 flex flex-col gap-1.5 opacity-80">
            <svg viewBox="0 0 24 24" className="h-5 w-5 animate-gear-spin text-primary/80" fill="currentColor" aria-hidden>
              <path d="M12 2l1.5 3 3.3-.7L15 7l3 1.5-3 1.5 1.8 2.7-3.3-.7L12 15l-1.5-3-3.3.7L9 10 6 8.5 9 7 7.2 4.3 10.5 5z"/>
              <circle cx="12" cy="9" r="2" fill="hsl(var(--background))"/>
            </svg>
            <svg viewBox="0 0 24 24" className="h-4 w-4 animate-gear-spin-rev text-accent/80" fill="currentColor" aria-hidden>
              <path d="M12 2l1.5 3 3.3-.7L15 7l3 1.5-3 1.5 1.8 2.7-3.3-.7L12 15l-1.5-3-3.3.7L9 10 6 8.5 9 7 7.2 4.3 10.5 5z"/>
            </svg>
          </div>
        )}

        {/* Rooftop fan (tier 4+) */}
        {tier >= 4 && (
          <div className="pointer-events-none absolute -left-2 top-10">
            <div className="relative h-4 w-4">
              <span className="animate-fan absolute inset-0 block">
                <span className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 bg-muted-foreground" />
                <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-muted-foreground" />
              </span>
              <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
            </div>
          </div>
        )}


        {/* Animated worker crowd */}
        <div className="mt-3 flex gap-2">
          {Array.from({ length: Math.min(ownedCount + 1, 6) }).map((_, i) => (
            <div key={i} className="animate-character-bob" style={{ animationDelay: `${i * 0.18}s` }}>
              <div className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_4px_hsl(var(--accent))]" />
              <div className="mt-0.5 h-3 w-2 rounded-sm bg-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* Tier badge */}
      <div className="absolute right-3 top-3 rounded-full border border-primary/40 bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">
        Tier {tier} · {tierName}
      </div>
      <div className="absolute left-3 top-3 rounded-full border border-accent/40 bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur">
        {ownedCount}/{BUSINESSES.length} Owned
      </div>

      <FloatingNumbers />
    </div>
  );
}
