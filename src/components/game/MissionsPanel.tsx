import { useGame } from '@/game/store';
import { QUESTS } from '@/game/config';
import { computeQuestProgress, formatMoney } from '@/game/engine';
import { Target, Bell, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export function MissionsPanel() {
  const state = useGame((s) => s.state);
  const claim = useGame((s) => s.claimQuestAction);
  const [, force] = useState(0);

  // Re-render every second so event countdowns tick.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const quests = useMemo(() => {
    return QUESTS.map((q) => {
      const value = computeQuestProgress(state, q.metric);
      const progress = Math.min(value / q.target, 1);
      const done = progress >= 1;
      const claimed = !!state.questsClaimed[q.id];
      return { ...q, value, progress, done, claimed };
    }).sort((a, b) => {
      // unclaimed-done first, then in-progress, then claimed last
      const score = (x: typeof a) => (x.claimed ? 2 : x.done ? 0 : 1);
      return score(a) - score(b);
    });
  }, [state]);

  const events = state.events ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Target className="h-3.5 w-3.5" /> Quests
        </h3>
        <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
          {quests.map((q) => (
            <div key={q.id} className={cn('rounded-lg border p-2.5', q.claimed ? 'border-success/30 bg-success/5 opacity-70' : 'border-border/60 bg-card/60')}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={cn(q.done && !q.claimed ? 'text-success font-semibold' : 'text-foreground')}>{q.label}</span>
                <span className="font-bold text-primary">{q.reward}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-background/60">
                  <div
                    className={cn(
                      'h-full transition-all',
                      q.claimed ? 'bg-muted-foreground/40' : q.done ? 'bg-success' : 'bg-gradient-to-r from-primary to-primary-glow'
                    )}
                    style={{ width: `${q.progress * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {q.metric === 'totalEarned' || q.metric === 'portfolio' || q.metric === 'dividends'
                    ? `${formatMoney(q.value)}/${formatMoney(q.target)}`
                    : `${Math.floor(q.value)}/${q.target}`}
                </span>
              </div>
              {q.done && !q.claimed && (
                <button
                  onClick={() => claim(q.id)}
                  className="mt-1.5 w-full rounded bg-success py-1 font-display text-[10px] font-bold uppercase tracking-wider text-success-foreground hover:brightness-110"
                >
                  Claim {q.reward}
                </button>
              )}
              {q.claimed && (
                <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-success">
                  <Check className="h-3 w-3" /> Claimed
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Bell className="h-3.5 w-3.5" /> Live Events
        </h3>
        <div className="space-y-1.5">
          {events.length === 0 && (
            <div className="rounded-lg border border-border/40 bg-card/40 p-2 text-xs text-muted-foreground">
              Markets are calm. Events appear every minute or so.
            </div>
          )}
          {events.map((e) => {
            const remaining = Math.max(0, e.expiresAt - Date.now());
            const m = Math.floor(remaining / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            const positive = e.trendBoost >= 0;
            return (
              <div key={e.id} className={cn('flex items-start gap-2 rounded-lg border p-2 text-xs', positive ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5')}>
                <span className="text-base">{e.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-foreground">{e.label}</div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className={positive ? 'text-success' : 'text-destructive'}>
                      {positive ? '+' : ''}{(e.trendBoost * 100).toFixed(0)}% bias
                    </span>
                    <span className="font-mono">{m}m {s}s</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
