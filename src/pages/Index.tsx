import { useEffect } from 'react';
import { useGame } from '@/game/store';
import { useUI } from '@/game/uiStore';
import { TopBar } from '@/components/game/TopBar';
import { OfficeBuilding } from '@/components/game/OfficeBuilding';
import { BusinessesPanel } from '@/components/game/BusinessesPanel';
import { UpgradesPanel } from '@/components/game/UpgradesPanel';
import { EmployeesPanel } from '@/components/game/EmployeesPanel';
import { MarketPanel } from '@/components/game/MarketPanel';
import { ClanPanel } from '@/components/game/ClanPanel';
import { MissionsPanel } from '@/components/game/MissionsPanel';
import { DailyRewardsPanel } from '@/components/game/DailyRewardsPanel';
import { SpinWheelPanel } from '@/components/game/SpinWheelPanel';
import { TransactionsPanel } from '@/components/game/TransactionsPanel';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import { OfflineModal } from '@/components/game/OfflineModal';
import { AmbientParticles } from '@/components/game/AmbientParticles';
import { Briefcase, ChevronUp, Users, LineChart, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';

// Wheel feature retired — kept import alive only to satisfy legacy tree.
void SpinWheelPanel;

const TABS = [
  { id: 'businesses', label: 'Biz', icon: Briefcase },
  { id: 'upgrades', label: 'Upgrades', icon: ChevronUp },
  { id: 'employees', label: 'Staff', icon: Users },
  { id: 'market', label: 'Market', icon: LineChart },
  { id: 'clan', label: 'Deals', icon: Handshake },
] as const;

const Index = () => {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const init = useGame((s) => s.init);
  const doTick = useGame((s) => s.doTick);

  useEffect(() => { init(); }, [init]);

  // 5 Hz tick keeps gameplay smooth without storming the chart-heavy market with 60 re-renders/s.
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.5);
      last = now;
      doTick(dt);
    }, 200);
    return () => clearInterval(id);
  }, [doTick]);

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col">
      <AmbientParticles />
      <h1 className="sr-only">Idle Empire Builder — Tycoon Game</h1>
      <TopBar />

      <div className="flex-1 px-3 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
        <div className="flex flex-col gap-4">
          <OfficeBuilding />

          <div className="lg:hidden">
            <MissionsPanel />
          </div>

          <section key={tab} className="animate-panel-in card-aura rounded-2xl border border-border/60 bg-card/40 p-3 sm:p-4">
            {tab === 'businesses' && <BusinessesPanel />}
            {tab === 'upgrades' && <UpgradesPanel />}
            {tab === 'employees' && <EmployeesPanel />}
            {tab === 'market' && <MarketPanel />}
            {tab === 'clan' && <ClanPanel />}
            {tab === 'rewards' && <DailyRewardsPanel />}
            {tab === 'ledger' && <TransactionsPanel />}
            {tab === 'settings' && <SettingsPanel />}
          </section>

        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <MissionsPanel />
          </div>
        </aside>
      </div>

      <nav className="sticky bottom-0 z-30 border-t border-border/60 bg-background/90 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-0.5 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex shrink-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1.5 py-2 transition-all',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                  active ? 'bg-primary/15 animate-neon-ping' : 'hover:bg-primary/10 hover:text-primary'
                )}>
                  <Icon className={cn('h-4 w-4 transition-transform', active && 'scale-110 drop-shadow-[0_0_6px_hsl(var(--primary)/0.9)]')} />
                </div>

                <span className="font-display text-[9px] font-bold uppercase tracking-wider">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <OfflineModal />
    </main>
  );
};

export default Index;
