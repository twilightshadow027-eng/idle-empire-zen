import { useMemo, useState } from 'react';
import { useGame } from '@/game/store';
import { formatMoney } from '@/game/engine';
import type { TxKind } from '@/game/types';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Coins, Briefcase, ChevronUp, Users, ShoppingCart, Banknote, Dices, Gift, Target, Sparkles, Bell, Filter } from 'lucide-react';

const KIND_META: Record<TxKind, { label: string; icon: React.ComponentType<{ className?: string }>; tone: 'success' | 'destructive' | 'accent' | 'primary' | 'muted' }> = {
  collect:      { label: 'Collect',  icon: Briefcase,    tone: 'success' },
  auto:         { label: 'Auto',     icon: Briefcase,    tone: 'success' },
  dividend:     { label: 'Dividend', icon: Coins,        tone: 'accent' },
  business:     { label: 'Biz',      icon: ShoppingCart, tone: 'destructive' },
  upgrade:      { label: 'Upgrade',  icon: ChevronUp,    tone: 'destructive' },
  hire:         { label: 'Hire',     icon: Users,        tone: 'destructive' },
  fire:         { label: 'Fire',     icon: Users,        tone: 'muted' },
  market_buy:   { label: 'Buy',      icon: ArrowDownRight, tone: 'destructive' },
  market_sell:  { label: 'Sell',     icon: ArrowUpRight,   tone: 'success' },
  wheel:        { label: 'Wheel',    icon: Dices,        tone: 'primary' },
  daily:        { label: 'Daily',    icon: Gift,         tone: 'primary' },
  quest:        { label: 'Quest',    icon: Target,       tone: 'success' },
  prestige:     { label: 'Prestige', icon: Sparkles,     tone: 'primary' },
  event:        { label: 'Event',    icon: Bell,         tone: 'muted' },
};

const FILTERS: { id: 'all' | 'income' | 'spend' | TxKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'income', label: 'Income' },
  { id: 'spend', label: 'Spend' },
  { id: 'market_buy', label: 'Buys' },
  { id: 'market_sell', label: 'Sells' },
  { id: 'dividend', label: 'Dividends' },
  { id: 'quest', label: 'Quests' },
  { id: 'wheel', label: 'Wheel' },
];

function fmtTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  const d = new Date(ts);
  return d.toLocaleString();
}

export function TransactionsPanel() {
  const txs = useGame((s) => s.state.transactions ?? []);
  const totalEarned = useGame((s) => s.state.totalEarned);
  const [filter, setFilter] = useState<'all' | 'income' | 'spend' | TxKind>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return txs;
    if (filter === 'income') return txs.filter((t) => t.amount > 0);
    if (filter === 'spend') return txs.filter((t) => t.amount < 0);
    return txs.filter((t) => t.kind === filter);
  }, [txs, filter]);

  const income = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spend = txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Lifetime" value={formatMoney(totalEarned)} tone="primary" />
        <Stat label="Ledger +" value={formatMoney(income)} tone="success" />
        <Stat label="Ledger −" value={formatMoney(spend)} tone="destructive" />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all',
              filter === f.id ? 'border-primary bg-primary/15 text-primary' : 'border-border/50 bg-card/40 text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-xs text-muted-foreground">
            No transactions yet. Start collecting income and trading.
          </div>
        )}
        {filtered.map((t) => {
          const meta = KIND_META[t.kind];
          const Icon = meta.icon;
          const positive = t.amount > 0;
          const neutral = t.amount === 0;
          const toneCls = {
            success: 'text-success',
            destructive: 'text-destructive',
            accent: 'text-accent',
            primary: 'text-primary',
            muted: 'text-muted-foreground',
          }[meta.tone];
          return (
            <div key={t.id} className="flex items-start gap-2 rounded-lg border border-border/40 bg-card/40 p-2">
              <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/60', toneCls)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs">{t.label}</span>
                  <span className={cn('shrink-0 font-mono text-xs font-bold', neutral ? 'text-muted-foreground' : positive ? 'text-success' : 'text-destructive')}>
                    {neutral ? '—' : `${positive ? '+' : ''}${formatMoney(t.amount)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="uppercase tracking-wider">{meta.label}</span>
                  <span>{fmtTime(t.ts)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'success' | 'destructive' }) {
  const cls = {
    primary: 'text-primary border-primary/30 bg-primary/5',
    success: 'text-success border-success/30 bg-success/5',
    destructive: 'text-destructive border-destructive/30 bg-destructive/5',
  }[tone];
  return (
    <div className={cn('rounded-xl border p-2', cls)}>
      <div className="text-[9px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-bold">{value}</div>
    </div>
  );
}

export const _unused = Banknote;
