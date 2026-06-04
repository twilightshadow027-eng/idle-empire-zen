import { useGame } from '@/game/store';
import { formatMoney } from '@/game/engine';
import { Crown, Shield, Swords, Users, Vault } from 'lucide-react';

export function ClanPanel() {
  const clan = useGame((s) => s.state.clan);
  const prestige = useGame((s) => s.state.prestigePoints);
  const totalEarned = useGame((s) => s.state.totalEarned);
  const doPrestige = useGame((s) => s.prestige);
  const canPrestige = totalEarned >= 5_000_000;
  const ptsGain = Math.floor(Math.sqrt(totalEarned / 5_000_000));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
          <div>
            <div className="font-display text-xl font-bold text-gradient-gold">{clan.name}</div>
            <div className="text-xs text-muted-foreground">Global Rank #{clan.rank}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat icon={<Users className="h-4 w-4" />} label="Members" value={clan.members.toString()} />
          <Stat icon={<Shield className="h-4 w-4" />} label="Influence" value={clan.influence.toString()} />
          <Stat icon={<Vault className="h-4 w-4" />} label="Vault" value={formatMoney(clan.vault)} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card-gradient p-4">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-destructive" />
          <h3 className="font-display font-semibold">Clan Wars</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Multiplayer wars, alliances, shared vaults, and territory control are coming in Phase 2 (requires Lovable Cloud + realtime backend).
        </p>
      </div>

      <div className="rounded-xl border border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent" />
          <h3 className="font-display font-semibold">Prestige</h3>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Reset your empire for permanent +7% income per prestige point.
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Current</div>
            <div className="font-display text-lg font-bold text-accent">{prestige} pts</div>
          </div>
          <button
            onClick={doPrestige}
            disabled={!canPrestige}
            className="rounded-lg bg-gradient-to-b from-accent to-accent/80 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-[0_0_20px_hsl(var(--accent)/0.4)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
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

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/40 p-2">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-sm font-bold">{value}</div>
    </div>
  );
}
