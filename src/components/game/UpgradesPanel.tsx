import { useGame } from '@/game/store';
import { UPGRADES } from '@/game/config';
import { formatMoney } from '@/game/engine';
import { Zap, Gauge, Bot, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = { speed: Gauge, efficiency: Zap, automation: Bot, worker: Users };

export function UpgradesPanel() {
  const state = useGame((s) => s.state);
  const buy = useGame((s) => s.buyUpgradeAction);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {UPGRADES.map((u) => {
        const owned = !!state.upgrades[u.id];
        const Icon = icons[u.category];
        const canAfford = state.money >= u.cost;
        return (
          <div
            key={u.id}
            className={cn(
              'relative overflow-hidden rounded-xl border p-3 transition-all',
              owned
                ? 'border-success/40 bg-success/5'
                : 'border-border/60 bg-card-gradient hover:border-accent/40'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                owned ? 'bg-success/20 text-success' : 'bg-accent/10 text-accent'
              )}>
                {owned ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.description}</div>
                {!owned && (
                  <button
                    disabled={!canAfford}
                    onClick={() => buy(u.id)}
                    className={cn(
                      'mt-2 w-full rounded-lg py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all',
                      canAfford
                        ? 'bg-gradient-to-b from-accent to-accent/80 text-accent-foreground hover:scale-[1.02] active:scale-95'
                        : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {formatMoney(u.cost)}
                  </button>
                )}
                {owned && <div className="mt-2 text-xs font-bold uppercase tracking-wider text-success">Active</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
