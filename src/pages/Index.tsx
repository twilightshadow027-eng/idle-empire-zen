import { useEffect, useState } from 'react';
import { useGame } from '@/game/store';
import { TopBar } from '@/components/game/TopBar';
import { OfficeBuilding } from '@/components/game/OfficeBuilding';
import { BusinessesPanel } from '@/components/game/BusinessesPanel';
import { UpgradesPanel } from '@/components/game/UpgradesPanel';
import { EmployeesPanel } from '@/components/game/EmployeesPanel';
import { MarketPanel } from '@/components/game/MarketPanel';
import { ClanPanel } from '@/components/game/ClanPanel';
import { MissionsPanel } from '@/components/game/MissionsPanel';
import { DailyRewardsPanel } from '@/components/game/DailyRewardsPanel';
import { OfflineModal } from '@/components/game/OfflineModal';
import { Briefcase, ChevronUp, Users, LineChart, Crown, RotateCcw, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'businesses' | 'upgrades' | 'employees' | 'market' | 'clan' | 'rewards';

const TABS: { id: Tab; label: string; icon: typeof Briefcase }[] = [
  { id: 'businesses', label: 'Biz', icon: Briefcase },
  { id: 'upgrades', label: 'Upgrades', icon: ChevronUp },
  { id: 'employees', label: 'Staff', icon: Users },
  { id: 'market', label: 'Market', icon: LineChart },
  { id: 'clan', label: 'Clan', icon: Crown },
  { id: 'rewards', label: 'Daily', icon: Gift },
];

const Index = () => {
  const [tab, setTab] = useState<Tab>('businesses');
  const init = useGame((s) => s.init);
  const doTick = useGame((s) => s.doTick);
  const reset = useGame((s) => s.reset);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.5);
      last = t;
      doTick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [doTick]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col">
      <h1 className="sr-only">Idle Empire Builder — Tycoon Game</h1>
      <TopBar />

      <div className="flex-1 px-3 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
        <div className="flex flex-col gap-4">
          <OfficeBuilding />

          {/* Mobile missions */}
          <div className="lg:hidden">
            <MissionsPanel />
          </div>

          <section className="rounded-2xl border border-border/60 bg-card/40 p-3 sm:p-4">
            {tab === 'businesses' && <BusinessesPanel />}
            {tab === 'upgrades' && <UpgradesPanel />}
            {tab === 'employees' && <EmployeesPanel />}
            {tab === 'market' && <MarketPanel />}
            {tab === 'clan' && <ClanPanel />}
            {tab === 'rewards' && <DailyRewardsPanel />}
          </section>

          <button
            onClick={() => { if (confirm('Reset all progress?')) reset(); }}
            className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="h-3 w-3" /> Reset Save
          </button>
        </div>

        {/* Desktop side panel */}
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <MissionsPanel />
          </div>
        </aside>
      </div>

      {/* Bottom tab bar */}
      <nav className="sticky bottom-0 z-30 border-t border-border/60 bg-background/90 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-all',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                  active && 'bg-primary/15 shadow-[0_0_15px_hsl(var(--primary)/0.4)]'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-display text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
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
