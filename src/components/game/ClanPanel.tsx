import { useEffect, useMemo, useState } from 'react';
import { useGame } from '@/game/store';
import { formatMoney, getCoordinatorReduction, getInfluencerBonus } from '@/game/engine';
import {
  Handshake, Sparkles, Zap, TrendingUp, Crown, ShieldCheck, Lock, CheckCircle2,
  Send, Hourglass, Users, Briefcase, Check, Compass, Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ENVOY_TIERS = [
  { id: 'short',  label: 'Short Trip',       durationMin: 5,  cost: 5_000 },
  { id: 'medium', label: 'Trade Run',        durationMin: 15, cost: 20_000 },
  { id: 'long',   label: 'Diplomatic Tour',  durationMin: 60, cost: 80_000 },
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

function sizeDurationMult(n: number): number {
  return n <= 1 ? 1 : n === 2 ? 0.85 : n === 3 ? 0.75 : 0.65;
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
  { id: 'logistics_pact',    name: 'Logistics Pact',     partner: 'Harbor Guild',       description: 'Streamlined supply chains for every business.', influenceCost: 8,  type: 'speed',  multiplier: 1.5, durationMin: 10, tier: 1 },
  { id: 'trade_alliance',    name: 'Trade Alliance',     partner: 'Merchant Coalition', description: 'Preferred pricing across all your industries.', influenceCost: 12, type: 'income', multiplier: 1.4, durationMin: 15, tier: 1 },
  { id: 'royal_charter',     name: 'Royal Charter',      partner: 'Crown Treasury',     description: 'A nobility-granted income surcharge.',          influenceCost: 28, type: 'income', multiplier: 1.8, durationMin: 20, tier: 2 },
  { id: 'union_accord',      name: 'Union Accord',       partner: 'Engineers Union',    description: 'Workers run double shifts under your banner.',  influenceCost: 32, type: 'speed',  multiplier: 2.0, durationMin: 15, tier: 2 },
  { id: 'oligarch_deal',     name: 'Oligarch Deal',      partner: 'Shadow Syndicate',   description: 'Off-book backers triple your throughput.',      influenceCost: 80, type: 'income', multiplier: 2.5, durationMin: 30, tier: 3 },
  { id: 'global_cooperation',name: 'Global Cooperation', partner: 'UN Trade Council',   description: 'World-scale operations, world-scale speed.',    influenceCost: 110,type: 'speed',  multiplier: 3.0, durationMin: 30, tier: 3 },
];

export function ClanPanel() {
  const state = useGame((s) => s.state);
  const doPrestige = useGame((s) => s.prestige);
  const claimDeal = useGame((s) => s.claimDeal);
  const dispatchEnvoy = useGame((s) => s.dispatchEnvoy);

  const influence = state.marketInfluence;
  const activeBoosts = state.activeBoosts;
  const employees = state.employees;
  const envoys = state.envoys ?? [];
  const totalEarned = state.totalEarned;
  const prestigesDone = state.prestigesDone ?? 0;
  const nextPrestigeReq = Math.ceil(5_000_000 * Math.pow(1.5, prestigesDone));
  const canPrestige = totalEarned >= nextPrestigeReq;
  const ptsGain = Math.max(1, Math.floor(Math.sqrt(totalEarned / 5_000_000)));

  const activeById = new Map(activeBoosts.map((b) => [b.id, b]));
  const busyIds = new Set<string>();
  envoys.forEach((e) => (e.members ?? [e.employeeId]).forEach((m) => busyIds.add(m)));
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

      <EnvoysSection
        money={state.money}
        employees={available}
        envoys={envoys}
        onDispatch={dispatchEnvoy}
      />

      <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Prestige</h3>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Reset your empire for permanent +7% income per prestige point. Each prestige raises the next requirement by ×1.5.
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg border border-border/40 bg-background/40 px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current points</div>
            <div className="font-display text-base font-bold text-primary">{state.prestigePoints}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Done × {prestigesDone}</div>
            <div className="font-display text-base font-bold text-primary">×1.5 next</div>
          </div>
          <div className="col-span-2 rounded-lg border border-accent/40 bg-accent/10 px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-accent">Next requirement</div>
            <div className="font-mono text-sm font-bold text-accent">
              {formatMoney(totalEarned)} / {formatMoney(nextPrestigeReq)}
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-background/60">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${Math.min(100, (totalEarned / nextPrestigeReq) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={doPrestige}
          disabled={!canPrestige}
          className="mt-3 w-full rounded-lg bg-gradient-to-b from-primary to-primary-glow px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          Prestige (+{ptsGain} pts)
        </button>
      </div>
    </div>
  );
}

function DealCard({
  deal, canAfford, isActive, expiresAt, onClaim,
}: {
  deal: Deal; canAfford: boolean; isActive: boolean; expiresAt?: number; onClaim: () => void;
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

function EnvoysSection({
  money, employees, envoys, onDispatch,
}: {
  money: number;
  employees: { id: string; name: string; role: string; intelligence: number; productivity: number; level: number }[];
  envoys: { id: string; employeeName: string; memberNames?: string[]; endsAt: number; reward: number; label: string; cost: number; startedAt: number }[];
  onDispatch: (memberIds: string[], durationMin: number, cost: number, label: string) => void;
}) {
  const [tier, setTier] = useState<TierId>('medium');
  const [selected, setSelected] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Drop selections that aren't currently dispatchable.
  useEffect(() => {
    const valid = new Set(employees.map((e) => e.id));
    setSelected((cur) => cur.filter((id) => valid.has(id)));
  }, [employees]);

  const tierDef = ENVOY_TIERS.find((t) => t.id === tier)!;

  const selectedEmps = useMemo(
    () => selected.map((id) => employees.find((e) => e.id === id)).filter(Boolean) as typeof employees,
    [selected, employees]
  );

  // Preview math (mirrors store.ts dispatchEnvoy).
  const sizeMult = sizeDurationMult(selectedEmps.length || 1);
  const coordCutLocal = (() => {
    const coords = selectedEmps.filter((e) => e.role === 'Coordinator');
    if (!coords.length) return 0;
    const raw = coords.reduce((a, e) => a + (e.productivity / 100) * (1 + (e.level - 1) * 0.25), 0);
    return Math.min(0.5, raw * 0.06);
  })();
  const effectiveMin = Math.max(1, tierDef.durationMin * sizeMult * (1 - coordCutLocal));
  const previewReward = (() => {
    if (!selectedEmps.length) return 0;
    const teamInfMult = (() => {
      const infs = selectedEmps.filter((e) => e.role === 'Influencer');
      if (!infs.length) return 1;
      const raw = infs.reduce((a, e) => a + ((e.productivity + e.intelligence) / 200) * (1 + (e.level - 1) * 0.25), 0);
      return 1 + Math.min(0.6, raw * 0.06);
    })();
    const perMember = selectedEmps.reduce((sum, emp) => {
      const skill = 0.3 + emp.intelligence / 200 + emp.productivity / 300;
      const base = Math.max(1, tierDef.durationMin / 8);
      return sum + base * skill;
    }, 0);
    return Math.max(1, Math.round(perMember * teamInfMult));
  })();

  const canDispatch = selectedEmps.length >= 1 && money >= tierDef.cost;

  const toggle = (id: string) =>
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 4) return cur;
      return [...cur, id];
    });

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-primary" />
        <h3 className="font-display font-semibold">Group Envoy Missions</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Send up to 4 staff. More teammates → faster trip. Influencers boost rewards, Coordinators cut duration.
      </p>

      {envoys.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            On Mission ({envoys.length})
          </div>
          {envoys.map((env) => {
            const total = Math.max(1, env.endsAt - env.startedAt);
            const remaining = Math.max(0, env.endsAt - now);
            const pct = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
            const names = env.memberNames?.length ? env.memberNames.join(', ') : env.employeeName;
            return (
              <div key={env.id} className="rounded-lg border border-border/60 bg-card/60 p-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex min-w-0 items-center gap-1 font-semibold">
                    <Hourglass className="h-3 w-3 shrink-0 text-primary" />
                    <span className="truncate">{names}</span>
                    <span className="shrink-0 text-muted-foreground">· {env.label}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Sparkles className="h-3 w-3" /> +{env.reward}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-background/60">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono">{fmtCountdown(remaining)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mission tier */}
      <div className="mt-3">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mission tier</div>
        <div className="flex flex-wrap items-center gap-1">
          {ENVOY_TIERS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className={cn(
                'rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition',
                tier === t.id ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border/60 bg-background/40 text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label} · {t.durationMin}m · {formatMoney(t.cost)}
            </button>
          ))}
        </div>
      </div>

      {/* Selection preview */}
      <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Team ({selectedEmps.length}/4)</span>
          <span>size ×{sizeMult.toFixed(2)} duration</span>
        </div>
        {selectedEmps.length === 0 ? (
          <div className="mt-1 text-xs text-muted-foreground">Pick 1–4 staff below to preview the mission.</div>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1">
            {selectedEmps.map((e) => (
              <span key={e.id} className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] font-semibold">
                {e.role === 'Influencer' && <Megaphone className="h-3 w-3 text-accent" />}
                {e.role === 'Coordinator' && <Compass className="h-3 w-3 text-sky-400" />}
                {e.name}
                <span className="text-muted-foreground">· {e.role}</span>
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
          <div className="rounded border border-border/40 bg-background/40 px-1.5 py-1">
            <div className="text-muted-foreground uppercase tracking-wider">Duration</div>
            <div className="font-mono text-xs font-bold">{fmtCountdown(effectiveMin * 60_000)}</div>
          </div>
          <div className="rounded border border-border/40 bg-background/40 px-1.5 py-1">
            <div className="text-muted-foreground uppercase tracking-wider">Reward</div>
            <div className="font-mono text-xs font-bold text-accent">+{previewReward} infl</div>
          </div>
          <div className="rounded border border-border/40 bg-background/40 px-1.5 py-1">
            <div className="text-muted-foreground uppercase tracking-wider">Cost</div>
            <div className="font-mono text-xs font-bold">{formatMoney(tierDef.cost)}</div>
          </div>
        </div>
        <button
          onClick={() => {
            if (!canDispatch) return;
            onDispatch(selected, tierDef.durationMin, tierDef.cost, tierDef.label);
            setSelected([]);
          }}
          disabled={!canDispatch}
          className={cn(
            'mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition',
            canDispatch
              ? 'bg-gradient-to-b from-primary to-primary-glow text-primary-foreground hover:scale-[1.01]'
              : 'border border-border/40 bg-background/30 text-muted-foreground'
          )}
        >
          <Send className="h-3 w-3" /> Dispatch Team
        </button>
      </div>

      {/* Available staff */}
      <div className="mt-3 space-y-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Available Staff ({employees.length})
        </div>
        {employees.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-card/40 px-3 py-3 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Hire staff (or wait for envoys to return) to assemble a team.
          </div>
        ) : (
          employees.map((emp) => {
            const isSel = selected.includes(emp.id);
            const disabled = !isSel && selected.length >= 4;
            return (
              <button
                key={emp.id}
                onClick={() => toggle(emp.id)}
                disabled={disabled}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg border bg-card/60 p-2 text-left transition',
                  isSel ? 'border-primary/60 ring-1 ring-primary/40' : 'border-border/60 hover:border-primary/30',
                  disabled && 'opacity-40'
                )}
              >
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-semibold">
                    {emp.name}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      · {emp.role} Lv{emp.level}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    INT {emp.intelligence} · PRD {emp.productivity}
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-md border',
                    isSel ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border/60 bg-background/40 text-muted-foreground'
                  )}
                >
                  {isSel ? <Check className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// silence lint for retained utilities
void getInfluencerBonus;
void getCoordinatorReduction;
