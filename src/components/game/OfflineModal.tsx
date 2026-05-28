import { useGame } from '@/game/store';
import { formatMoney } from '@/game/engine';
import { Sparkles } from 'lucide-react';

export function OfflineModal() {
  const earned = useGame((s) => s.offlineEarned);
  const clear = useGame((s) => s.clearOffline);
  if (earned <= 0) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-primary/40 bg-card-gradient p-6 text-center shadow-[0_0_60px_hsl(var(--primary)/0.3)] animate-scale-in">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold">Welcome back, Tycoon!</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your empire earned while you were away</p>
        <div className="my-4 font-display text-4xl font-bold text-gradient-gold">+{formatMoney(earned)}</div>
        <button
          onClick={clear}
          className="w-full rounded-xl bg-gradient-to-b from-primary to-primary/80 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all hover:scale-[1.02] active:scale-95"
        >
          Collect
        </button>
      </div>
    </div>
  );
}
