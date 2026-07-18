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
          <div key={def.id} className="group relative overflow-hidden rounded-xl border border-border/60 bg-card-gradient p-3 transition-all hover:border-primary/40 animate-fade-in">
            <div className="flex items-center gap-3">
              <button
                onClick={() => b.owned && b.progress >= 1 && collect(def.id)}
                className={cn(
                  'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-3xl transition-all',
                  b.owned
                    ? 'bg-gradient-to-br from-secondary to-background ring-1 ring-primary/30'
                    : 'bg-secondary',
                  b.owned && b.progress >= 1 && !b.hasManager && 'animate-pulse-glow cursor-pointer hover:scale-105'
                )}
              >
                <span className="relative z-10">{def.icon}</span>
                {b.owned && b.hasManager && (
                  <UserCheck className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-success p-0.5 text-success-foreground" />
                )}
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
                    className="h-full bg-gradient-to-r from-primary to-primary-glow transition-[width] duration-100"
                    style={{ width: `${b.owned ? b.progress * 100 : 0}%` }}
                  />
                </div>
              </div>

              <button
                disabled={!canAfford}
                onClick={() => buy(def.id)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all',
                  canAfford
                    ? 'bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)] hover:scale-105 active:scale-95'
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
