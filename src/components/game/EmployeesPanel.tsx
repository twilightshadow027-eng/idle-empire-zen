import { useGame } from '@/game/store';
import { BUSINESSES } from '@/game/config';
import { formatMoney } from '@/game/engine';
import { EmployeeRole } from '@/game/types';
import { Briefcase, Calculator, Eye, Wrench, Handshake, Shield, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES: { role: EmployeeRole; cost: number; icon: typeof Briefcase; desc: string }[] = [
  { role: 'Manager', cost: 5000, icon: Briefcase, desc: 'Auto-collects from a business' },
  { role: 'Accountant', cost: 3000, icon: Calculator, desc: 'Boosts global income' },
  { role: 'Engineer', cost: 8000, icon: Wrench, desc: 'Boosts production speed' },
  { role: 'Spy', cost: 12000, icon: Eye, desc: 'Espionage (coming soon)' },
  { role: 'Negotiator', cost: 3000, icon: Handshake, desc: 'Better trade deals (soon)' },
  { role: 'Security', cost: 3000, icon: Shield, desc: 'Defends against sabotage' },
];

export function EmployeesPanel() {
  const state = useGame((s) => s.state);
  const hire = useGame((s) => s.hireEmployee);
  const fire = useGame((s) => s.fireEmployee);
  const assign = useGame((s) => s.assignManager);

  const ownedBiz = BUSINESSES.filter((b) => state.businesses[b.id].owned);

  return (
    <div className="space-y-4">
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
            {state.employees.map((e) => (
              <div key={e.id} className="rounded-xl border border-border/60 bg-card-gradient p-3 animate-scale-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold">{e.name}</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">{e.role}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <Stat label="INT" v={e.intelligence} />
                      <Stat label="LOY" v={e.loyalty} />
                      <Stat label="GRD" v={e.greed} />
                      <Stat label="PRD" v={e.productivity} />
                    </div>
                  </div>
                  <button onClick={() => fire(e.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
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
            ))}
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
