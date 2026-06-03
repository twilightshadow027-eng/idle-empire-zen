import { useGame } from '@/game/store';
import { BUSINESSES } from '@/game/config';
import { formatMoney, getNegotiatorDiscount } from '@/game/engine';
import { EmployeeRole } from '@/game/types';
import { Briefcase, Calculator, Eye, Wrench, Handshake, Shield, X, Plus, GraduationCap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES: { role: EmployeeRole; cost: number; icon: typeof Briefcase; desc: string }[] = [
  { role: 'Manager',    cost: 5000,  icon: Briefcase,  desc: 'Auto-collects from a business' },
  { role: 'Accountant', cost: 3000,  icon: Calculator, desc: '+income (productivity / 1000)' },
  { role: 'Engineer',   cost: 8000,  icon: Wrench,     desc: '+speed (productivity / 1500)' },
  { role: 'Negotiator', cost: 3000,  icon: Handshake,  desc: 'Trade discount on stocks' },
  { role: 'Security',   cost: 3000,  icon: Shield,     desc: 'Defends against sabotage' },
  { role: 'Spy',        cost: 12000, icon: Eye,        desc: 'Espionage (coming soon)' },
];

export function EmployeesPanel() {
  const state = useGame((s) => s.state);
  const hire = useGame((s) => s.hireEmployee);
  const fire = useGame((s) => s.fireEmployee);
  const assign = useGame((s) => s.assignManager);
  const train = useGame((s) => s.trainEmployee);

  const ownedBiz = BUSINESSES.filter((b) => state.businesses[b.id].owned);
  const negDisc = getNegotiatorDiscount(state);

  // Summary of staff bonuses
  const accIncome = state.employees
    .filter((e) => e.role === 'Accountant')
    .reduce((a, e) => a * (1 + e.productivity / 1000), 1);
  const engSpeed = state.employees
    .filter((e) => e.role === 'Engineer')
    .reduce((a, e) => a * (1 + e.productivity / 1500), 1);

  return (
    <div className="space-y-4">
      {state.employees.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <BonusCard label="Income" value={`×${accIncome.toFixed(2)}`} tone="success" />
          <BonusCard label="Speed"  value={`×${engSpeed.toFixed(2)}`}  tone="primary" />
          <BonusCard label="Trade"  value={negDisc > 0 ? `-${(negDisc*100).toFixed(1)}%` : '—'} tone="accent" />
        </div>
      )}

      <section>
        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">Hire</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((r) => {
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
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display text-sm font-semibold">{r.role}</span>
                    <span className="font-mono text-xs font-bold text-primary">{formatMoney(r.cost)}</span>
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{r.desc}</div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
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
              const canTrain = state.money >= e.trainingCost && e.productivity < 100;
              return (
                <div key={e.id} className="rounded-xl border border-border/60 bg-card-gradient p-3 animate-scale-in">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => train(e.id)}
                        disabled={!canTrain}
                        className={cn(
                          'flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all',
                          canTrain
                            ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                            : 'border-border/40 bg-secondary text-muted-foreground opacity-60'
                        )}
                        title={e.productivity >= 100 ? 'Max productivity' : `Train: ${formatMoney(e.trainingCost)}`}
                      >
                        <GraduationCap className="h-3 w-3" />
                        {e.productivity >= 100 ? <Sparkles className="h-3 w-3" /> : formatMoney(e.trainingCost)}
                      </button>
                      <button onClick={() => fire(e.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
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
