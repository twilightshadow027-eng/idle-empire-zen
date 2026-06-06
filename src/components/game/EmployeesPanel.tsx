import { useGame } from '@/game/store';
import { BUSINESSES } from '@/game/config';
import { formatMoney, getInfluencerBonus, getCoordinatorReduction } from '@/game/engine';
import { EmployeeRole } from '@/game/types';
import { Briefcase, Calculator, Eye, Wrench, Megaphone, Compass, X, Plus, GraduationCap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type RoleCategory = 'Operations' | 'Finance' | 'Security' | 'Trading';

interface RoleDef {
  role: EmployeeRole;
  cost: number;
  icon: typeof Briefcase;
  desc: string;
  category: RoleCategory;
  /** Tailwind color tokens for the animated avatar */
  hue: string;
  accentHue: string;
}

const ROLES: RoleDef[] = [
  { role: 'Manager',    cost: 8_000,  icon: Briefcase,  desc: 'Auto-collects from an assigned business', category: 'Operations', hue: 'bg-primary',     accentHue: 'bg-primary-glow' },
  { role: 'Engineer',   cost: 12_000, icon: Wrench,     desc: 'Boosts global production speed',          category: 'Operations', hue: 'bg-amber-500',   accentHue: 'bg-amber-300' },
  { role: 'Accountant', cost: 5_000,  icon: Calculator, desc: 'Raises global income multiplier',         category: 'Finance',    hue: 'bg-emerald-500', accentHue: 'bg-emerald-300' },
  { role: 'Negotiator', cost: 5_000,  icon: Handshake,  desc: 'Discount on every stock trade',           category: 'Trading',    hue: 'bg-accent',      accentHue: 'bg-accent-glow' },
  { role: 'Security',   cost: 6_000,  icon: Shield,     desc: 'Dampens negative market events',          category: 'Security',   hue: 'bg-slate-500',   accentHue: 'bg-slate-300' },
  { role: 'Spy',        cost: 18_000, icon: Eye,        desc: 'Quiet intel siphons extra income',        category: 'Security',   hue: 'bg-violet-600',  accentHue: 'bg-violet-300' },
];

const CATEGORY_ORDER: RoleCategory[] = ['Operations', 'Finance', 'Trading', 'Security'];

export function EmployeesPanel() {
  const state = useGame((s) => s.state);
  const hire = useGame((s) => s.hireEmployee);
  const fire = useGame((s) => s.fireEmployee);
  const assign = useGame((s) => s.assignManager);
  const train = useGame((s) => s.trainEmployee);

  const ownedBiz = BUSINESSES.filter((b) => state.businesses[b.id].owned);
  const inflBonus = getInfluencerBonus(state);
  const coordCut  = getCoordinatorReduction(state);

  // Live staff bonuses
  const accIncome = state.employees
    .filter((e) => e.role === 'Accountant')
    .reduce((a, e) => a * (1 + e.productivity / 1400), 1);
  const engSpeed = state.employees
    .filter((e) => e.role === 'Engineer')
    .reduce((a, e) => a * (1 + e.productivity / 1800), 1);
  const spyBonus = state.employees
    .filter((e) => e.role === 'Spy')
    .reduce((a, e) => a * (1 + e.intelligence / 3000), 1);

  return (
    <div className="space-y-4">
      {state.employees.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          <BonusCard label="Income"     value={`×${accIncome.toFixed(2)}`} tone="success" />
          <BonusCard label="Speed"      value={`×${engSpeed.toFixed(2)}`}  tone="primary" />
          <BonusCard label="Influence"  value={inflBonus > 1 ? `×${inflBonus.toFixed(2)}` : '—'} tone="accent" />
          <BonusCard label="Coord."     value={coordCut > 0 ? `-${(coordCut * 100).toFixed(0)}% time` : (spyBonus > 1 ? `×${spyBonus.toFixed(2)} intel` : '—')} tone="primary" />
        </div>
      )}

      <section>
        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">Hire by Department</h3>
        {CATEGORY_ORDER.map((cat) => (
          <div key={cat} className="mb-3">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-accent/80">{cat}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLES.filter((r) => r.category === cat).map((r) => {
                const can = state.money >= r.cost;
                const Icon = r.icon;
                return (
                  <button
                    key={r.role}
                    disabled={!can}
                    onClick={() => hire(r.role)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all',
                      can ? 'border-border/60 bg-card-gradient hover:border-primary/40 active:scale-[0.98]' : 'border-border/40 bg-card/40 opacity-50'
                    )}
                  >
                    <CharacterAvatar role={r.role} hue={r.hue} accentHue={r.accentHue} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1.5 font-display text-sm font-semibold">
                          <Icon className="h-3.5 w-3.5 text-accent" /> {r.role}
                        </span>
                        <span className="font-mono text-xs font-bold text-primary">{formatMoney(r.cost)}</span>
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">{r.desc}</div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Staff ({state.employees.length})
        </h3>
        {state.employees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
            No employees yet. Hire a Manager to auto-collect income.
          </div>
        ) : (
          <div className="space-y-2">
            {state.employees.map((e) => {
              const canTrain = state.money >= e.trainingCost;
              const def = ROLES.find((r) => r.role === e.role)!;
              return (
                <div key={e.id} className="rounded-xl border border-border/60 bg-card-gradient p-3 animate-scale-in">
                  <div className="flex items-start gap-3">
                    <CharacterAvatar role={e.role} hue={def.hue} accentHue={def.accentHue} size={44} level={e.level} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold">{e.name}</span>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">{e.role}</span>
                        <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">Lv {e.level}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <Stat label="INT" v={e.intelligence} />
                        <Stat label="LOY" v={e.loyalty} />
                        <Stat label="GRD" v={e.greed} />
                        <Stat label="PRD" v={e.productivity} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => train(e.id)}
                        disabled={!canTrain}
                        className={cn(
                          'flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all',
                          canTrain
                            ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                            : 'border-border/40 bg-secondary text-muted-foreground opacity-60'
                        )}
                        title={`Train all traits — ${formatMoney(e.trainingCost)}`}
                      >
                        <GraduationCap className="h-3 w-3" />
                        {formatMoney(e.trainingCost)}
                      </button>
                      <button onClick={() => fire(e.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive" title="Fire">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {e.role === 'Manager' && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ownedBiz.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => assign(e.id, b.id)}
                          className={cn(
                            'rounded-md border px-2 py-1 text-[11px] transition-all',
                            e.assignedTo === b.id
                              ? 'border-success bg-success/20 text-success'
                              : 'border-border/60 bg-background/60 hover:border-primary/40'
                          )}
                        >
                          {b.icon} {b.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  )}
                  {e.role !== 'Manager' && (
                    <div className="mt-1.5 text-[10px] text-muted-foreground">
                      <Sparkles className="mr-1 inline h-3 w-3 text-accent" />
                      {def.desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  const color = v > 70 ? 'text-success' : v > 40 ? 'text-primary' : 'text-destructive';
  return (
    <span>
      <span className="text-muted-foreground">{label}</span> <span className={`font-mono font-bold ${color}`}>{v}</span>
    </span>
  );
}

function BonusCard({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'accent' | 'success' }) {
  const map = {
    primary: 'border-primary/30 bg-primary/5 text-primary',
    accent: 'border-accent/30 bg-accent/5 text-accent',
    success: 'border-success/30 bg-success/5 text-success',
  };
  return (
    <div className={cn('rounded-lg border px-2 py-1.5 text-center', map[tone])}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  );
}

/** Tiny CSS character with role-specific feature (hat, visor, mask, headset, glasses). */
function CharacterAvatar({
  role, hue, accentHue, size = 40, level,
}: { role: EmployeeRole; hue: string; accentHue: string; size?: number; level?: number }) {
  // Head & body proportions
  const head = size * 0.55;
  const body = size * 0.65;

  return (
    <div className="relative shrink-0 animate-character-bob" style={{ width: size, height: size }}>
      {/* Body / shoulders */}
      <div
        className={cn('absolute left-1/2 -translate-x-1/2 rounded-t-[40%]', hue)}
        style={{ width: body, height: size * 0.45, bottom: 0, boxShadow: '0 -2px 6px hsl(0 0% 0% / 0.25)' }}
      />
      {/* Head */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[hsl(28_50%_82%)] ring-1 ring-black/10"
        style={{ width: head, height: head, top: 0 }}
      >
        {/* Eyes */}
        <div className="absolute top-[45%] left-[22%] h-[14%] w-[14%] animate-character-blink rounded-full bg-background" />
        <div className="absolute top-[45%] right-[22%] h-[14%] w-[14%] animate-character-blink rounded-full bg-background" style={{ animationDelay: '0.15s' }} />
        {/* Mouth */}
        <div className="absolute bottom-[18%] left-1/2 h-[6%] w-[30%] -translate-x-1/2 rounded-full bg-black/30" />

        {/* Role-specific feature */}
        {role === 'Manager' && (
          // Suit tie hint via collar + small hat
          <div className="absolute -top-1 left-1/2 h-[26%] w-[78%] -translate-x-1/2 rounded-t-md bg-foreground/80" />
        )}
        {role === 'Engineer' && (
          // Hard hat
          <div className={cn('absolute -top-1 left-1/2 h-[32%] w-[85%] -translate-x-1/2 rounded-t-full', accentHue)} />
        )}
        {role === 'Accountant' && (
          // Round glasses
          <>
            <div className="absolute top-[42%] left-[16%] h-[20%] w-[22%] rounded-full border border-foreground/70" />
            <div className="absolute top-[42%] right-[16%] h-[20%] w-[22%] rounded-full border border-foreground/70" />
          </>
        )}
        {role === 'Influencer' && (
          // Megaphone + bright hair tuft
          <div className="absolute top-0 left-1/2 h-[22%] w-[70%] -translate-x-1/2 rounded-t-full bg-accent" />
        )}
        {role === 'Coordinator' && (
          // Headset band
          <>
            <div className="absolute top-[5%] left-[10%] right-[10%] h-[14%] rounded-full bg-foreground/80" />
            <div className="absolute top-[28%] -left-1 h-[14%] w-[14%] rounded-full bg-foreground/85" />
          </>
        )}
        {role === 'Spy' && (
          // Sunglasses + small earpiece
          <>
            <div className="absolute top-[42%] left-[10%] h-[18%] w-[80%] rounded-sm bg-foreground/85" />
            <div className="absolute top-[55%] -right-1 h-[18%] w-[18%] rounded-full bg-foreground/85" />
          </>
        )}
      </div>

      {/* Level badge */}
      {typeof level === 'number' && level > 1 && (
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-background bg-primary text-[9px] font-bold text-primary-foreground">
          {level}
        </div>
      )}
    </div>
  );
}
