import { useGame } from '@/game/store';
import { useUI } from '@/game/uiStore';
import { AnimatedCounter } from './AnimatedCounter';
import { TrendingDown, TrendingUp, Trophy, Sparkles, Gift, ScrollText, Settings } from 'lucide-react';
import { canClaimToday } from '@/game/engine';
import { cn } from '@/lib/utils';

export function TopBar() {
  const money = useGame((s) => s.state.money);
  const influence = useGame((s) => s.state.marketInfluence);
  const prestige = useGame((s) => s.state.prestigePoints);
  const industries = useGame((s) => s.state.industries);
  const state = useGame((s) => s.state);
  const dailyAvailable = canClaimToday(state);
  const setTab = useUI((s) => s.setTab);

  const tickerItems = Object.values(industries);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 shadow-[0_1px_0_hsl(40_20%_96%/0.04)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-secondary/60 shadow-[inset_0_1px_0_hsl(40_20%_96%/0.08)]">
            <span className="font-display text-base font-bold text-gradient-gold">IE</span>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <span className="eyebrow">Idle Empire</span>
              <span className="h-3 w-px bg-border" />
              <QuickAction onClick={() => setTab('rewards')} title="Daily reward" pulse={dailyAvailable}>
                <Gift className="h-3 w-3" />
              </QuickAction>
              <QuickAction onClick={() => setTab('ledger')} title="Transaction ledger">
                <ScrollText className="h-3 w-3" />
              </QuickAction>
              <QuickAction onClick={() => setTab('settings')} title="Settings">
                <Settings className="h-3 w-3" />
              </QuickAction>
            </div>
            <AnimatedCounter value={money} className="font-display text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl" />
          </div>
        </div>

        <div className="flex items-center divide-x divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card/50">
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

function QuickAction({
  onClick,
  title,
  pulse,
  children,
}: {
  onClick: () => void;
  title: string;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'relative inline-flex h-5 w-5 items-center justify-center rounded-md border border-border/60 bg-card/60 text-muted-foreground transition hover:border-primary/60 hover:text-primary',
        pulse && 'border-primary/60 text-primary'
      )}
    >
      {children}
      {pulse && (
        <span className="absolute -right-0.5 -top-0.5 flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
        </span>
      )}
    </button>
  );
}

function Badge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'primary' | 'accent' }) {
  const c = color === 'primary' ? 'text-primary' : 'text-accent';
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className={c}>{icon}</span>
      <div className="leading-tight">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        <div className={`font-display text-xs font-bold tabular-nums ${c}`}>{value}</div>
      </div>
    </div>
  );
}
