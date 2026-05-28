import { useGame } from '@/game/store';
import { AnimatedCounter } from './AnimatedCounter';
import { TrendingDown, TrendingUp, Trophy, Sparkles, Gift, Dices } from 'lucide-react';
import { canClaimToday, canSpin } from '@/game/engine';
import { cn } from '@/lib/utils';

export function TopBar() {
  const money = useGame((s) => s.state.money);
  const influence = useGame((s) => s.state.marketInfluence);
  const prestige = useGame((s) => s.state.prestigePoints);
  const industries = useGame((s) => s.state.industries);
  const state = useGame((s) => s.state);
  const dailyAvailable = canClaimToday(state);
  const wheelAvailable = canSpin(state);

  const tickerItems = Object.values(industries);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
            <span className="font-display text-lg font-bold text-primary-foreground">E</span>
          </div>
          <div>
            <div className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">Idle Empire</div>
            <AnimatedCounter value={money} className="font-display text-xl font-bold text-gradient-gold sm:text-2xl" />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {dailyAvailable && (
            <button
              onClick={() => {
                const rewardsBtn = Array.from(document.querySelectorAll('nav button')).find(b => b.textContent?.includes('Daily')) as HTMLElement | undefined;
                rewardsBtn?.click();
              }}
              className={cn(
                'relative flex items-center gap-1.5 rounded-lg border border-primary/60 bg-primary/15 px-2.5 py-1.5 animate-pulse',
              )}
            >
              <Gift className="h-3.5 w-3.5 text-primary" />
              <span className="hidden text-xs font-bold text-primary sm:inline">Daily Ready</span>
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive"></span>
              </span>
            </button>
          )}
          {wheelAvailable && (
            <button
              onClick={() => {
                const wheelBtn = Array.from(document.querySelectorAll('nav button')).find(b => b.textContent?.includes('Wheel')) as HTMLElement | undefined;
                wheelBtn?.click();
              }}
              className={cn(
                'relative flex items-center gap-1.5 rounded-lg border border-accent/60 bg-accent/15 px-2.5 py-1.5 animate-pulse',
              )}
            >
              <Dices className="h-3.5 w-3.5 text-accent" />
              <span className="hidden text-xs font-bold text-accent sm:inline">Spin Ready</span>
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent"></span>
              </span>
            </button>
          )}
          <Badge icon={<Sparkles className="h-3.5 w-3.5" />} label="Influence" value={influence.toString()} color="accent" />
          <Badge icon={<Trophy className="h-3.5 w-3.5" />} label="Prestige" value={prestige.toString()} color="primary" />
        </div>
      </div>

      <div className="relative overflow-hidden border-t border-border/40 bg-card/40 py-1.5">
        <div className="flex w-max animate-ticker gap-8 whitespace-nowrap px-4 text-xs">
          {[...tickerItems, ...tickerItems].map((i, idx) => (
            <span key={idx} className="flex items-center gap-1.5 font-mono">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">{i.name}</span>
              <span className="font-bold text-foreground">${i.price.toFixed(2)}</span>
              {i.trend >= 0 ? (
                <span className="flex items-center gap-0.5 text-success"><TrendingUp className="h-3 w-3" />{(i.trend * 100).toFixed(1)}%</span>
              ) : (
                <span className="flex items-center gap-0.5 text-destructive"><TrendingDown className="h-3 w-3" />{(i.trend * 100).toFixed(1)}%</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

function Badge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'primary' | 'accent' }) {
  const c = color === 'primary' ? 'text-primary' : 'text-accent';
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1.5">
      <span className={c}>{icon}</span>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-xs font-bold ${c}`}>{value}</div>
      </div>
    </div>
  );
}
