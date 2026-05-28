import { useGame } from '@/game/store';
import { DAILY_REWARDS } from '@/game/config';
import { formatMoney, canClaimToday } from '@/game/engine';
import { Gift, Check, Flame, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DailyRewardsPanel() {
  const state = useGame((s) => s.state);
  const claim = useGame((s) => s.claimDailyReward);
  const available = canClaimToday(state);
  const streak = state.claimStreak;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Daily Rewards</h2>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-accent">
            <Flame className="h-4 w-4 fill-accent" />
            <span className="text-sm font-bold">{streak} Day Streak</span>
          </div>
        )}
      </div>

      {available && (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-center">
          <p className="text-sm text-muted-foreground">Your daily reward is ready!</p>
          <button
            onClick={claim}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-5 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-transform hover:scale-105 active:scale-95"
          >
            <Gift className="h-4 w-4" /> Claim Reward
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
        {DAILY_REWARDS.map((r, i) => {
          const dayNum = i + 1;
          const claimed = streak >= dayNum && !available;
          const isToday = dayNum === streak + 1 && available;
          const isFuture = dayNum > streak + 1;

          return (
            <div
              key={r.day}
              className={cn(
                'relative flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all sm:p-3',
                claimed && 'border-success/40 bg-success/10 opacity-70',
                isToday && 'border-primary/60 bg-primary/15 shadow-[0_0_15px_hsl(var(--primary)/0.3)]',
                isFuture && 'border-border/40 bg-card/40 opacity-50',
                !claimed && !isToday && !isFuture && 'border-border/60 bg-card/60'
              )}
            >
              <span className="absolute -top-2 rounded-full bg-card px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border/40">
                Day {r.day}
              </span>
              <span className="mt-2 text-xl sm:text-2xl">{r.icon}</span>
              <span className="text-[10px] font-semibold leading-tight text-foreground sm:text-xs">
                {r.title}
              </span>
              <span className="text-[10px] font-bold text-gradient-gold">
                {formatMoney(r.money)}
              </span>
              {r.prestige && (
                <span className="text-[9px] font-bold text-primary">+{r.prestige} PP</span>
              )}
              {claimed && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/30 backdrop-blur-[1px]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success/20">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                </div>
              )}
              {isFuture && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/20">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border/40 bg-card/40 p-3 text-xs text-muted-foreground">
        <p>Come back every day to build your streak. Missing a day resets your streak to Day 1. Day 7 rewards a Prestige Point!</p>
      </div>
    </div>
  );
}
