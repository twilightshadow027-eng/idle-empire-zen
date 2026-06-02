import { useGame } from '@/game/store';
import { formatMoney } from '@/game/engine';
import { AlertTriangle, RotateCcw, Trash2, Sparkles, Save } from 'lucide-react';
import { useState } from 'react';

export function SettingsPanel() {
  const reset = useGame((s) => s.reset);
  const state = useGame((s) => s.state);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-4">
      <section>
        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Profile
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Cash" value={formatMoney(state.money)} />
          <Stat label="Lifetime" value={formatMoney(state.totalEarned)} />
          <Stat label="Prestige" value={`${state.prestigePoints}`} />
          <Stat label="Staff" value={`${state.employees.length}`} />
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Save
        </h3>
        <div className="space-y-2 rounded-xl border border-border/60 bg-card/60 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Save className="h-4 w-4 text-success" />
            Progress auto-saves to this device every few seconds.
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Ledger entries kept: {state.transactions?.length ?? 0} / 250
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-destructive">
          Danger Zone
        </h3>
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <div className="flex items-start gap-2 text-xs text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>
              <strong className="text-destructive">Reset progress</strong> wipes all money, businesses,
              upgrades, staff, market positions, quests, prestige and ledger. This cannot be undone.
            </span>
          </div>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-background/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-destructive transition hover:bg-destructive/10"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset progress
            </button>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-xs hover:bg-card/70"
              >
                Cancel
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-xs font-bold uppercase tracking-wider text-destructive-foreground hover:brightness-110"
              >
                <Trash2 className="h-3.5 w-3.5" /> Yes, wipe everything
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-mono text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}
