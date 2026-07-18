import { useState } from 'react';
import { useGame } from '@/game/store';
import { BUSINESSES } from '@/game/config';
import { businessCost, businessIncome, formatMoney, getGlobalMultipliers } from '@/game/engine';
import { Lock, TrendingUp, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SparkleBurst } from './SparkleBurst';

export function BusinessesPanel() {
  const state = useGame((s) => s.state);
  const buy = useGame((s) => s.buy);
  const collect = useGame((s) => s.collect);
  const { income, perBiz } = getGlobalMultipliers(state);
  const [bursts, setBursts] = useState<Record<string, number>>({});
  const [squash, setSquash] = useState<Record<string, number>>({});
  const [flash, setFlash] = useState<Record<string, number>>({});
  const [shake, setShake] = useState<Record<string, number>>({});
  const [pulseKey, setPulseKey] = useState<Record<string, number>>({});
  const fireBurst = (id: string) => setBursts((b) => ({ ...b, [id]: (b[id] ?? 0) + 1 }));
  const fireFx = (id: string, opts: { shakeStrong?: boolean } = {}) => {
    setSquash((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
    setFlash((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
    setShake((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
    setPulseKey((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
    fireBurst(id);
    setTimeout(() => setSquash((s) => ({ ...s, [id]: 0 })), 420);
    setTimeout(() => setFlash((s) => ({ ...s, [id]: 0 })), 340);
    setTimeout(() => setShake((s) => ({ ...s, [id]: 0 })), opts.shakeStrong ? 380 : 320);
  };

  return (
    <div className="space-y-3">
      {BUSINESSES.map((def) => {
        const b = state.businesses[def.id];
        const locked = state.totalEarned + state.money < def.unlockAt && !b.owned;
        const cost = businessCost(def.baseCost, b.level);
        const canAfford = state.money >= cost;
        const perCycle = b.owned ? businessIncome(def.baseIncome, b.level, income, perBiz[def.id] ?? 1) : businessIncome(def.baseIncome, 1, income, perBiz[def.id] ?? 1);

        if (locked) {
          return (
            <div key={def.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 opacity-60">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl grayscale">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-display font-semibold text-muted-foreground">{def.name}</div>
                <div className="text-xs text-muted-foreground">Unlocks at {formatMoney(def.unlockAt)} earned</div>
              </div>
            </div>
          );
        }

        return (
          <div key={def.id} className={cn(
            'group relative overflow-hidden rounded-xl border border-border/60 bg-card-gradient p-3 transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.4)] animate-slide-in-up',
            squash[def.id] && 'animate-squash',
            flash[def.id] && 'animate-flash',
            shake[def.id] && 'animate-screen-shake'
          )}>
            {/* One-shot pulse ring on purchase/upgrade */}
            {pulseKey[def.id] ? (
              <span
                key={pulseKey[def.id]}
                className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary/70 animate-sparkle-pop"
                aria-hidden
              />
            ) : null}
            {/* Card-level pixel particle burst */}
            <div className="pointer-events-none absolute inset-0">
              <SparkleBurst trigger={pulseKey[def.id] ?? 0} count={12} color="var(--primary)" />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (b.owned && b.progress >= 1) {
                    collect(def.id);
                    fireBurst(def.id);
                  }
                }}
                className={cn(
                  'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-3xl transition-all btn-press',
                  b.owned
                    ? 'bg-gradient-to-br from-secondary to-background ring-1 ring-primary/30'
                    : 'bg-secondary',
                  b.owned && b.progress >= 1 && !b.hasManager && 'animate-pulse-glow cursor-pointer'
                )}
              >
                <span className={cn('relative z-10', b.owned && b.progress >= 1 && !b.hasManager && 'animate-bob-rot')}>{def.icon}</span>
                {b.owned && b.hasManager && (
                  <UserCheck className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-success p-0.5 text-success-foreground" />
                )}
                <SparkleBurst trigger={bursts[def.id] ?? 0} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-display font-semibold">{def.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Lv {b.level}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="font-mono text-success">{formatMoney(perCycle)}</span>
                  <span>/ {def.productionTime}s</span>
                </div>

                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background/60">
                  <div
                    className={cn('h-full bg-gradient-to-r from-primary to-primary-glow transition-[width] duration-100', b.owned && b.progress > 0.02 && 'bar-shine')}
                    style={{ width: `${b.owned ? b.progress * 100 : 0}%` }}
                  />
                </div>
              </div>

              <button
                disabled={!canAfford}
                onClick={() => { if (canAfford) { buy(def.id); fireFx(def.id, { shakeStrong: !b.owned }); } }}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-2 font-display text-xs font-bold uppercase tracking-wider btn-press',
                  canAfford
                    ? 'bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                <div className="text-[9px] opacity-80">{b.owned ? 'Upgrade' : 'Buy'}</div>
                <div>{formatMoney(cost)}</div>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
