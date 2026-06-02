import { useGame } from '@/game/store';
import { useUI } from '@/game/uiStore';
import { QUESTS, INDUSTRY_NAMES } from '@/game/config';
import { computeQuestProgress, formatMoney } from '@/game/engine';
import { Target, Bell, Check, LineChart, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function MissionsPanel() {
  const state = useGame((s) => s.state);
  const claim = useGame((s) => s.claimQuestAction);
  const focusIndustry = useUI((s) => s.focusIndustry);
  const [, force] = useState(0);
  const [claimModal, setClaimModal] = useState<{ questId: string; reward: string; rewardMoney: number; label: string; nextQuestId?: string } | null>(null);

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
      const score = (x: typeof a) => (x.claimed ? 2 : x.done ? 0 : 1);
      return score(a) - score(b);
    });
  }, [state]);

  const nextActionable = useMemo(
    () => quests.find((q) => !q.claimed && !q.done) ?? quests.find((q) => q.done && !q.claimed),
    [quests]
  );

  function handleClaim(questId: string) {
    const q = QUESTS.find((x) => x.id === questId);
    if (!q) return;
    claim(questId);
    // Find next unclaimed quest (excluding the one just claimed)
    const next = QUESTS.find((x) => x.id !== questId && !state.questsClaimed[x.id]);
    setClaimModal({
      questId,
      reward: q.reward,
      rewardMoney: q.rewardMoney,
      label: q.label,
      nextQuestId: next?.id,
    });
  }

  const events = state.events ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Target className="h-3.5 w-3.5" /> Quests
        </h3>
        <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
          {quests.map((q) => (
            <div
              key={q.id}
              className={cn(
                'rounded-lg border p-2.5 transition-all',
                q.claimed ? 'border-success/30 bg-success/5 opacity-70' : 'border-border/60 bg-card/60',
                nextActionable?.id === q.id && !q.claimed && 'ring-1 ring-primary/40'
              )}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={cn(q.done && !q.claimed ? 'text-success font-semibold' : 'text-foreground')}>{q.label}</span>
                <span className="font-bold text-primary">{q.reward}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-background/60">
                  <div
                    className={cn('h-full transition-all',
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
                  onClick={() => handleClaim(q.id)}
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
        <div className="space-y-2">
          {events.length === 0 && (
            <div className="rounded-lg border border-border/40 bg-card/40 p-2 text-xs text-muted-foreground">
              Markets are calm. Events appear every minute or so.
            </div>
          )}
          {events.map((e) => {
            const remaining = Math.max(0, e.expiresAt - Date.now());
            const total = Math.max(remaining, 60_000);
            const m = Math.floor(remaining / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            const positive = e.trendBoost >= 0;
            const symbol = INDUSTRY_NAMES[e.industryId] ?? e.industryId.toUpperCase();
            const impact = `${positive ? '+' : ''}${(e.trendBoost * 100).toFixed(0)}%`;
            return (
              <div
                key={e.id}
                className={cn(
                  'overflow-hidden rounded-lg border text-xs',
                  positive ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5'
                )}
              >
                <div className="flex items-start gap-2 p-2">
                  <span className="text-lg leading-none">{e.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-foreground">{e.label}</span>
                      <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold',
                        positive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                      )}>{impact}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        Symbol <span className="rounded bg-background/60 px-1 py-0 font-mono font-bold text-foreground">{symbol}</span>
                      </span>
                      <span className="font-mono">⏱ {m}m {String(s).padStart(2, '0')}s</span>
                    </div>
                  </div>
                </div>
                <div className="h-1 w-full bg-background/40">
                  <div
                    className={cn('h-full transition-all', positive ? 'bg-success' : 'bg-destructive')}
                    style={{ width: `${Math.min(100, (remaining / total) * 100)}%` }}
                  />
                </div>
                <button
                  onClick={() => focusIndustry(e.industryId)}
                  className={cn(
                    'flex w-full items-center justify-center gap-1.5 border-t px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all',
                    positive
                      ? 'border-success/30 text-success hover:bg-success/10'
                      : 'border-destructive/30 text-destructive hover:bg-destructive/10'
                  )}
                >
                  <LineChart className="h-3 w-3" /> View {symbol} on chart
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!claimModal} onOpenChange={(o) => !o && setClaimModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Quest Complete
            </DialogTitle>
            <DialogDescription>{claimModal?.label}</DialogDescription>
          </DialogHeader>
          {claimModal && (
            <div className="space-y-3">
              <div className="rounded-xl border border-success/30 bg-success/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reward</div>
                <div className="mt-0.5 font-mono text-2xl font-bold text-success">+{formatMoney(claimModal.rewardMoney)}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Added to your cash balance instantly.</div>
              </div>
              {claimModal.nextQuestId && (
                <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next quest</div>
                  {(() => {
                    const next = QUESTS.find((q) => q.id === claimModal.nextQuestId)!;
                    const value = computeQuestProgress(state, next.metric);
                    const progress = Math.min(value / next.target, 1);
                    return (
                      <>
                        <div className="mt-1 flex items-center justify-between text-sm">
                          <span className="font-semibold">{next.label}</span>
                          <span className="font-bold text-primary">{next.reward}</span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-background/60">
                          <div className="h-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${progress * 100}%` }} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setClaimModal(null)}
              className="w-full rounded-lg bg-primary py-2 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110"
            >
              {claimModal?.nextQuestId ? 'Continue' : 'Done'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Keep tree-shake-friendly named imports referenced
export const _x = X;
