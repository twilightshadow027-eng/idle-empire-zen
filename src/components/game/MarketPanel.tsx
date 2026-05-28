import { useGame } from '@/game/store';
import { TrendingDown, TrendingUp } from 'lucide-react';

export function MarketPanel() {
  const industries = useGame((s) => s.state.industries);
  const influence = useGame((s) => s.state.marketInfluence);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Market Influence</div>
        <div className="font-display text-2xl font-bold text-gradient-cyan">{influence}</div>
        <div className="text-xs text-muted-foreground">Grow your businesses to gain influence and move markets.</div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {Object.values(industries).map((i) => {
          const up = i.trend >= 0;
          const max = Math.max(...i.history);
          const min = Math.min(...i.history);
          const range = Math.max(1, max - min);
          return (
            <div key={i.id} className="rounded-xl border border-border/60 bg-card-gradient p-3">
              <div className="flex items-center justify-between">
                <div className="font-display font-semibold">{i.name}</div>
                <div className={`flex items-center gap-0.5 text-xs font-bold ${up ? 'text-success' : 'text-destructive'}`}>
                  {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {(i.trend * 100).toFixed(1)}%
                </div>
              </div>
              <div className="mt-1 font-mono text-lg font-bold">${i.price.toFixed(2)}</div>
              {/* Mini sparkline */}
              <div className="mt-1 flex h-8 items-end gap-0.5">
                {i.history.map((p, idx) => {
                  const h = ((p - min) / range) * 100;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-sm ${up ? 'bg-success/60' : 'bg-destructive/60'}`}
                      style={{ height: `${Math.max(6, h)}%` }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
