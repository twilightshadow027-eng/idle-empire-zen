import { useEffect, useState } from 'react';
import { useGame } from '@/game/store';
import { formatMoney } from '@/game/engine';
import {
  Handshake, Sparkles, Zap, TrendingUp, Crown, ShieldCheck, Lock, CheckCircle2,
  Send, Hourglass, Users, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ENVOY_TIERS = [
  { id: 'short',  label: 'Short Trip',  durationMin: 5,  cost: 5_000 },
  { id: 'medium', label: 'Trade Run',   durationMin: 15, cost: 20_000 },
  { id: 'long',   label: 'Diplomatic Tour', durationMin: 60, cost: 80_000 },
] as const;

type TierId = typeof ENVOY_TIERS[number]['id'];

function fmtCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function estimateReward(empIntel: number, empProd: number, role: string, durationMin: number) {
  const roleBonus = role === 'Negotiator' ? 0.6 : role === 'Spy' ? 0.3 : 0;
  const skill = 0.5 + empIntel / 100 + empProd / 200 + roleBonus;
  const base = Math.max(1, Math.round(durationMin / 5));
  return Math.max(1, Math.round(base * skill));
}

interface Deal {
  id: string;
  name: string;
  partner: string;
  description: string;
  influenceCost: number;
  type: 'speed' | 'income';
  multiplier: number;
  durationMin: number;
  tier: 1 | 2 | 3;
}

const DEALS: Deal[] = [
  {
    id: 'logistics_pact',
    name: 'Logistics Pact',
    partner: 'Harbor Guild',
    description: 'Streamlined supply chains for every business.',
    influenceCost: 5,
    type: 'speed',
    multiplier: 1.5,
    durationMin: 10,
    tier: 1,
  },
  {
    id: 'trade_alliance',
    name: 'Trade Alliance',
    partner: 'Merchant Coalition',
    description: 'Preferred pricing across all your industries.',
    influenceCost: 8,
    type: 'income',
    multiplier: 1.4,
    durationMin: 15,
    tier: 1,
  },
  {
    id: 'royal_charter',
    name: 'Royal Charter',
    partner: 'Crown Treasury',
    description: 'A nobility-granted income surcharge.',
    influenceCost: 20,
    type: 'income',
    multiplier: 1.8,
    durationMin: 20,
    tier: 2,
  },
  {
    id: 'union_accord',
    name: 'Union Accord',
    partner: 'Engineers Union',
    description: 'Workers run double shifts under your banner.',
    influenceCost: 25,
    type: 'speed',
    multiplier: 2.0,
    durationMin: 15,
    tier: 2,
  },
  {
    id: 'oligarch_deal',
    name: 'Oligarch Deal',
    partner: 'Shadow Syndicate',
    description: 'Off-book backers triple your throughput.',
    influenceCost: 60,
    type: 'income',
    multiplier: 2.5,
    durationMin: 30,
    tier: 3,
  },
  {
    id: 'global_cooperation',
    name: 'Global Cooperation',
    partner: 'UN Trade Council',
    description: 'World-scale operations, world-scale speed.',
    influenceCost: 80,
    type: 'speed',
    multiplier: 3.0,
    durationMin: 30,
    tier: 3,
  },
];

export function ClanPanel() {
  const influence = useGame((s) => s.state.marketInfluence);
  const activeBoosts = useGame((s) => s.state.activeBoosts);
  const prestige = useGame((s) => s.state.prestigePoints);
  const totalEarned = useGame((s) => s.state.totalEarned);
  const money = useGame((s) => s.state.money);
  const employees = useGame((s) => s.state.employees);
  const envoys = useGame((s) => s.state.envoys ?? []);
  const doPrestige = useGame((s) => s.prestige);
  const claimDeal = useGame((s) => s.claimDeal);
  const dispatchEnvoy = useGame((s) => s.dispatchEnvoy);
  const canPrestige = totalEarned >= 5_000_000;
  const ptsGain = Math.floor(Math.sqrt(totalEarned / 5_000_000));

  const activeById = new Map(activeBoosts.map((b) => [b.id, b]));
  const busyIds = new Set(envoys.map((e) => e.employeeId));
  const available = employees.filter((e) => !busyIds.has(e.id));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-4">
        <div className="flex items-center gap-3">
          <Handshake className="h-8 w-8 text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.6)]" />
          <div className="flex-1">
            <div className="font-display text-lg font-bold text-gradient-gold">Deals &amp; Cooperations</div>
            <div className="text-xs text-muted-foreground">
              Spend influence to forge partnerships that boost your empire.
            </div>
          </div>
          <div className="rounded-lg border border-accent/40 bg-background/40 px-3 py-1.5 text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Influence</div>
            <div className="flex items-center gap-1 font-display text-lg font-bold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {influence}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {DEALS.map((deal) => {
          const active = activeById.get(`deal-${deal.id}`);
          const isActive = !!active && active.expiresAt > Date.now();
          const canAfford = influence >= deal.influenceCost;
          return (
            <DealCard
              key={deal.id}
              deal={deal}
              canAfford={canAfford}
              isActive={isActive}
              expiresAt={active?.expiresAt}
              onClaim={() => claimDeal(deal.id, deal.influenceCost, deal.type, deal.multiplier, deal.durationMin)}
            />
          );
        })}
      </div>

      <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Prestige</h3>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Reset your empire for permanent +7% income per prestige point.
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Current</div>
            <div className="font-display text-lg font-bold text-primary">{prestige} pts</div>
          </div>
          <button
            onClick={doPrestige}
            disabled={!canPrestige}
            className="rounded-lg bg-gradient-to-b from-primary to-primary-glow px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            Prestige (+{ptsGain})
          </button>
        </div>
        {!canPrestige && (
          <div className="mt-2 text-[11px] text-muted-foreground">Earn $5M total to unlock.</div>
        )}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  canAfford,
  isActive,
  expiresAt,
  onClaim,
}: {
  deal: Deal;
  canAfford: boolean;
  isActive: boolean;
  expiresAt?: number;
  onClaim: () => void;
}) {
  const Icon = deal.type === 'speed' ? Zap : TrendingUp;
  const tierLabel = deal.tier === 1 ? 'Tier I' : deal.tier === 2 ? 'Tier II' : 'Tier III';
  const tierTone =
    deal.tier === 1 ? 'border-border/60 text-muted-foreground'
    : deal.tier === 2 ? 'border-accent/40 text-accent'
    : 'border-primary/40 text-primary';

  const remaining = isActive && expiresAt ? Math.max(0, expiresAt - Date.now()) : 0;
  const minsLeft = Math.ceil(remaining / 60000);

  return (
    <div className={cn(
      'rounded-xl border bg-card-gradient p-3 transition',
      isActive ? 'border-success/50 shadow-[0_0_18px_hsl(var(--success)/0.25)]' : 'border-border/60'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', deal.type === 'speed' ? 'text-primary' : 'text-success')} />
            <div className="font-display text-sm font-bold">{deal.name}</div>
            <span className={cn('rounded-full border px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider', tierTone)}>
              {tierLabel}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">with {deal.partner}</div>
          <div className="mt-1 text-xs text-foreground/90">{deal.description}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
            <span className="inline-flex items-center gap-1 text-accent">
              <ShieldCheck className="h-3 w-3" />
              ×{deal.multiplier} {deal.type}
            </span>
            <span className="text-muted-foreground">for {deal.durationMin} min</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
            <Sparkles className="h-3 w-3" />
            {deal.influenceCost}
          </span>
          {isActive ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-success/50 bg-success/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-success">
              <CheckCircle2 className="h-3 w-3" />
              {minsLeft}m left
            </span>
          ) : (
            <button
              onClick={onClaim}
              disabled={!canAfford}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition',
                canAfford
                  ? 'bg-gradient-to-b from-accent to-accent/80 text-accent-foreground hover:scale-105'
                  : 'border border-border/40 bg-background/30 text-muted-foreground'
              )}
            >
              {canAfford ? <Handshake className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {canAfford ? 'Forge' : 'Need infl.'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _kept = formatMoney;
