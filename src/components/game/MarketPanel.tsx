import { useState } from 'react';
import { useGame } from '@/game/store';
import { formatMoney } from '@/game/engine';
import { IndustryId } from '@/game/types';
import { TrendingDown, TrendingUp, Wallet, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarketPanel() {
  const industries = useGame((s) => s.state.industries);
  const holdings = useGame((s) => s.state.holdings);
  const money = useGame((s) => s.state.money);
  const totalRealized = useGame((s) => s.state.totalRealized);
  const buyStock = useGame((s) => s.buyStockAction);
  const sellStock = useGame((s) => s.sellStockAction);

  // Total portfolio value
  const portfolioValue = Object.entries(holdings).reduce((sum, [id, h]) => {
    if (!h || h.shares === 0) return sum;
    return sum + h.shares * industries[id as IndustryId].price;
  }, 0);
  const portfolioCost = Object.values(holdings).reduce((sum, h) => sum + (h?.shares ?? 0) * (h?.avgCost ?? 0), 0);
  const unrealized = portfolioValue - portfolioCost;

  return (
    <div className="space-y-3">
      {/* Portfolio summary */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard icon={<Wallet className="h-3.5 w-3.5" />} label="Cash" value={formatMoney(money)} tone="primary" />
        <SummaryCard icon={<Briefcase className="h-3.5 w-3.5" />} label="Portfolio" value={formatMoney(portfolioValue)} tone="accent" />
        <SummaryCard
          icon={unrealized >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          label="P/L"
          value={`${unrealized >= 0 ? '+' : ''}${formatMoney(unrealized)}`}
          tone={unrealized >= 0 ? 'success' : 'destructive'}
        />
      </div>
      {totalRealized !== 0 && (
        <div className="text-center text-[11px] text-muted-foreground">
          Realized lifetime: <span className={totalRealized >= 0 ? 'text-success' : 'text-destructive'}>{totalRealized >= 0 ? '+' : ''}{formatMoney(totalRealized)}</span>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {Object.values(industries).map((i) => (
          <StockCard
            key={i.id}
            industry={i}
            holding={holdings[i.id]}
            cash={money}
            onBuy={(shares) => buyStock(i.id, shares)}
            onSell={(shares) => sellStock(i.id, shares)}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'primary' | 'accent' | 'success' | 'destructive' }) {
  const colorMap = {
    primary: 'text-primary border-primary/30 bg-primary/5',
    accent: 'text-accent border-accent/30 bg-accent/5',
    success: 'text-success border-success/30 bg-success/5',
    destructive: 'text-destructive border-destructive/30 bg-destructive/5',
  };
  return (
    <div className={cn('rounded-xl border p-2.5', colorMap[tone])}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-80">
        {icon}{label}
      </div>
      <div className="mt-0.5 font-mono text-sm font-bold sm:text-base">{value}</div>
    </div>
  );
}

function StockCard({
  industry: i,
  holding,
  cash,
  onBuy,
  onSell,
}: {
  industry: ReturnType<typeof useGame> extends never ? never : import('@/game/types').IndustryState;
  holding?: import('@/game/types').StockHolding;
  cash: number;
  onBuy: (shares: number) => void;
  onSell: (shares: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const up = i.trend >= 0;
  const max = Math.max(...i.history);
  const min = Math.min(...i.history);
  const range = Math.max(1, max - min);
  const shares = holding?.shares ?? 0;
  const avg = holding?.avgCost ?? 0;
  const pl = shares * (i.price - avg);
  const cost = i.price * qty;
  const canBuy = cash >= cost;
  const canSell = shares >= qty;

  return (
    <div className="rounded-xl border border-border/60 bg-card-gradient p-3">
      <div className="flex items-center justify-between">
        <div className="font-display font-semibold">{i.name}</div>
        <div className={`flex items-center gap-0.5 text-xs font-bold ${up ? 'text-success' : 'text-destructive'}`}>
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {(i.trend * 100).toFixed(1)}%
        </div>
      </div>
      <div className="mt-1 font-mono text-lg font-bold">${i.price.toFixed(2)}</div>
      <div className="mt-1 flex h-8 items-end gap-0.5">
        {i.history.map((p, idx) => {
          const h = ((p - min) / range) * 100;
          return (
            <div key={idx} className={`flex-1 rounded-sm ${up ? 'bg-success/60' : 'bg-destructive/60'}`} style={{ height: `${Math.max(6, h)}%` }} />
          );
        })}
      </div>

      {shares > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-2 py-1 text-[11px]">
          <span className="text-muted-foreground">
            {shares} sh @ <span className="font-mono text-foreground">${avg.toFixed(2)}</span>
          </span>
          <span className={cn('font-mono font-bold', pl >= 0 ? 'text-success' : 'text-destructive')}>
            {pl >= 0 ? '+' : ''}{formatMoney(pl)}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex items-center rounded-lg border border-border/60 bg-background/40">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-1.5 py-1 text-muted-foreground hover:text-foreground"
          >–</button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 bg-transparent text-center font-mono text-sm outline-none"
          />
          <button
            onClick={() => setQty((q) => q + 1)}
            className="px-1.5 py-1 text-muted-foreground hover:text-foreground"
          >+</button>
        </div>
        <button
          onClick={() => onBuy(qty)}
          disabled={!canBuy}
          className="flex-1 rounded-lg bg-success/80 px-2 py-1.5 text-xs font-bold text-success-foreground transition hover:bg-success disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy ${cost.toFixed(0)}
        </button>
        <button
          onClick={() => onSell(qty)}
          disabled={!canSell}
          className="flex-1 rounded-lg bg-destructive/80 px-2 py-1.5 text-xs font-bold text-destructive-foreground transition hover:bg-destructive disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sell
        </button>
      </div>
      {shares > 0 && (
        <div className="mt-1 flex gap-1">
          <button onClick={() => setQty(Math.max(1, Math.floor(shares / 2)))} className="flex-1 rounded text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">½</button>
          <button onClick={() => setQty(shares)} className="flex-1 rounded text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Max Sell</button>
        </div>
      )}
    </div>
  );
}
