import { useState, useMemo, useEffect } from 'react';
import { Area, AreaChart, Line, ComposedChart, ResponsiveContainer, YAxis } from 'recharts';
import { useGame } from '@/game/store';
import { useUI } from '@/game/uiStore';
import { formatMoney } from '@/game/engine';
import { INDUSTRY_DIVIDEND, INDUSTRY_CATEGORY, CATEGORY_ORDER, CATEGORY_LABELS } from '@/game/config';
import type { IndustryCategory, IndustryId, IndustryState, StockHolding, Timeframe } from '@/game/types';
import { TrendingDown, TrendingUp, Wallet, Briefcase, Coins, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarketPanel() {
  const industries = useGame((s) => s.state.industries);
  const holdings = useGame((s) => s.state.holdings);
  const money = useGame((s) => s.state.money);
  const totalRealized = useGame((s) => s.state.totalRealized);
  const totalDividends = useGame((s) => s.state.totalDividends);
  const buyStock = useGame((s) => s.buyStockAction);
  const sellStock = useGame((s) => s.sellStockAction);

  const highlightedIndustry = useUI((s) => s.highlightedIndustry);
  const highlightToken = useUI((s) => s.highlightToken);
  const clearHighlight = useUI((s) => s.clearHighlight);

  const [collapsed, setCollapsed] = useState<Record<IndustryCategory, boolean>>({} as any);

  useEffect(() => {
    if (!highlightedIndustry) return;
    const cat = INDUSTRY_CATEGORY[highlightedIndustry];
    setCollapsed((c) => ({ ...c, [cat]: false }));
    const t = setTimeout(() => {
      const el = document.getElementById(`stock-${highlightedIndustry}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
          clearHighlight();
        }, 2500);
      }
    }, 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedIndustry, highlightToken]);


  const divPerMin = Object.entries(holdings).reduce((sum, [id, h]) => {
    if (!h || h.shares === 0) return sum;
    const rate = INDUSTRY_DIVIDEND[id as IndustryId] ?? 0;
    return sum + h.shares * industries[id as IndustryId].price * (rate / 100);
  }, 0);

  const portfolioValue = Object.entries(holdings).reduce((sum, [id, h]) => {
    if (!h || h.shares === 0) return sum;
    return sum + h.shares * industries[id as IndustryId].price;
  }, 0);
  const portfolioCost = Object.values(holdings).reduce((sum, h) => sum + (h?.shares ?? 0) * (h?.avgCost ?? 0), 0);
  const unrealized = portfolioValue - portfolioCost;

  // Group industries by category in canonical order
  const grouped = useMemo(() => {
    const out: Record<IndustryCategory, IndustryState[]> = {} as any;
    CATEGORY_ORDER.forEach((c) => (out[c] = []));
    Object.values(industries).forEach((ind) => {
      const cat = INDUSTRY_CATEGORY[ind.id];
      if (!out[cat]) out[cat] = [];
      out[cat].push(ind);
    });
    return out;
  }, [industries]);

  return (
    <div className="space-y-3">
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
      {(totalRealized !== 0 || totalDividends > 0 || divPerMin > 0) && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {totalRealized !== 0 && (
            <span>
              Realized: <span className={totalRealized >= 0 ? 'text-success' : 'text-destructive'}>
                {totalRealized >= 0 ? '+' : ''}{formatMoney(totalRealized)}
              </span>
            </span>
          )}
          {totalDividends > 0 && (
            <span className="inline-flex items-center gap-1">
              <Coins className="h-3 w-3 text-accent" />
              Dividends: <span className="text-accent">{formatMoney(totalDividends)}</span>
            </span>
          )}
          {divPerMin > 0 && (
            <span>
              Yield: <span className="text-accent">{formatMoney(divPerMin)}/min</span>
            </span>
          )}
        </div>
      )}

      {CATEGORY_ORDER.map((cat) => {
        const list = grouped[cat];
        if (!list || list.length === 0) return null;
        const isCollapsed = collapsed[cat];
        // Aggregate ownership for category
        const ownedCount = list.filter((i) => (holdings[i.id]?.shares ?? 0) > 0).length;
        return (
          <div key={cat} className="space-y-2">
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
              className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-card/40 px-3 py-1.5 text-left transition hover:bg-card/70"
            >
              <div className="flex items-center gap-2">
                <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isCollapsed && '-rotate-90')} />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-[10px] text-muted-foreground">{list.length} symbols</span>
              </div>
              {ownedCount > 0 && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                  {ownedCount} held
                </span>
              )}
            </button>
            {!isCollapsed && (
              <div className="grid gap-2 sm:grid-cols-2">
                {list.map((i) => (
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
            )}
          </div>
        );
      })}
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
  industry: IndustryState;
  holding?: StockHolding;
  cash: number;
  onBuy: (shares: number) => void;
  onSell: (shares: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const [tf, setTf] = useState<Timeframe>('1m');
  const up = i.trend >= 0;
  const shares = holding?.shares ?? 0;
  const avg = holding?.avgCost ?? 0;
  const pl = shares * (i.price - avg);
  const cost = i.price * qty;
  const canBuy = cash >= cost;
  const canSell = shares >= qty;
  const divRate = INDUSTRY_DIVIDEND[i.id] ?? 0;
  const divPerMin = shares * i.price * (divRate / 100);

  // Timeframe → number of samples (~1 sample/sec)
  const tfSamples: Record<Timeframe, number> = { '1m': 60, '5m': 180, '15m': 300, '1h': 300 };
  const windowed = useMemo(() => i.history.slice(-tfSamples[tf]), [i.history, tf]);

  // SMA window proportional to view
  const smaPeriod = Math.max(5, Math.floor(windowed.length / 6));
  const sma = useMemo(() => {
    const out: (number | null)[] = [];
    for (let idx = 0; idx < windowed.length; idx++) {
      if (idx < smaPeriod - 1) { out.push(null); continue; }
      let sum = 0;
      for (let j = idx - smaPeriod + 1; j <= idx; j++) sum += windowed[j];
      out.push(sum / smaPeriod);
    }
    return out;
  }, [windowed, smaPeriod]);

  const chartData = useMemo(
    () => windowed.map((p, idx) => ({ idx, price: p, sma: sma[idx] })),
    [windowed, sma]
  );
  const min = Math.min(...windowed);
  const max = Math.max(...windowed);
  const gradId = `grad-${i.id}`;
  const stroke = up ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  // Simple signal: price vs SMA + slope
  const lastSma = sma[sma.length - 1] ?? i.price;
  const firstSma = sma.find((v) => v !== null) ?? i.price;
  const slopeUp = (lastSma as number) > (firstSma as number);
  const signal = i.price > (lastSma as number) && slopeUp
    ? { label: 'BUY',  tone: 'text-success border-success/40 bg-success/10' }
    : i.price < (lastSma as number) && !slopeUp
    ? { label: 'SELL', tone: 'text-destructive border-destructive/40 bg-destructive/10' }
    : { label: 'HOLD', tone: 'text-muted-foreground border-border/60 bg-secondary' };

  return (
    <div id={`stock-${i.id}`} className="rounded-xl border border-border/60 bg-card-gradient p-3 transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="truncate font-display text-sm font-semibold">{i.name}</div>
          {divRate > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-accent">
              <Coins className="h-2.5 w-2.5" />{divRate.toFixed(1)}%
            </span>
          )}
        </div>
        <div className={cn('flex shrink-0 items-center gap-0.5 text-xs font-bold', up ? 'text-success' : 'text-destructive')}>
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {(i.trend * 100).toFixed(1)}%
        </div>
      </div>

      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <div className="font-mono text-lg font-bold">${i.price.toFixed(2)}</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          L ${min.toFixed(2)} · H ${max.toFixed(2)}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex gap-0.5 rounded-md border border-border/40 bg-background/40 p-0.5">
          {(['1m', '5m', '15m'] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={cn(
                'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition',
                tf === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >{t}</button>
          ))}
        </div>
        <span className={cn('rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider', signal.tone)}>
          {signal.label} · SMA{smaPeriod}
        </span>
      </div>

      <div className="mt-1 h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={stroke}
              strokeWidth={1.75}
              fill={`url(#${gradId})`}
              isAnimationActive={false}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="sma"
              stroke="hsl(var(--primary))"
              strokeWidth={1.25}
              strokeDasharray="3 3"
              isAnimationActive={false}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
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
      {shares > 0 && divPerMin > 0 && (
        <div className="mt-1 flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-2 py-1 text-[11px]">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Coins className="h-3 w-3 text-accent" /> Dividend
          </span>
          <span className="font-mono font-bold text-accent">+{formatMoney(divPerMin)}/min</span>
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
          className="flex flex-1 flex-col items-center justify-center rounded-lg bg-success/80 px-2 py-1 text-success-foreground transition hover:bg-success disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-xs font-bold leading-tight">Buy ×{qty}</span>
          <span className="font-mono text-[10px] leading-tight opacity-80">{formatMoney(cost)}</span>
        </button>
        <button
          onClick={() => onSell(qty)}
          disabled={!canSell}
          className="flex flex-1 flex-col items-center justify-center rounded-lg bg-destructive/80 px-2 py-1 text-destructive-foreground transition hover:bg-destructive disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-xs font-bold leading-tight">Sell ×{qty}</span>
          <span className="font-mono text-[10px] leading-tight opacity-80">{formatMoney(i.price * qty)}</span>
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
