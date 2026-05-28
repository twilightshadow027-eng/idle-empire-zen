import { useGame } from '@/game/store';
import { BUSINESSES } from '@/game/config';
import { Target, Zap, Bell } from 'lucide-react';
import { useMemo } from 'react';

export function MissionsPanel() {
  const state = useGame((s) => s.state);

  const missions = useMemo(() => {
    const owned = Object.values(state.businesses).filter((b) => b.owned).length;
    const totalLevels = Object.values(state.businesses).reduce((a, b) => a + b.level, 0);
    return [
      { id: 'm1', label: 'Own 3 businesses', progress: Math.min(owned / 3, 1), reward: '+$500' },
      { id: 'm2', label: 'Reach $10K total earned', progress: Math.min(state.totalEarned / 10_000, 1), reward: '+1 Influence' },
      { id: 'm3', label: 'Total business levels: 50', progress: Math.min(totalLevels / 50, 1), reward: '+$5K' },
      { id: 'm4', label: 'Hire your first Manager', progress: state.employees.some((e) => e.role === 'Manager') ? 1 : 0, reward: 'Auto-income' },
    ];
  }, [state.businesses, state.totalEarned, state.employees]);

  const events = [
    { icon: '📈', text: 'Tech stocks rallying after AI breakthrough' },
    { icon: '⚠️', text: 'Supply chain disruption affecting Food' },
    { icon: '💎', text: 'Energy crisis driving prices up' },
    { icon: '🚀', text: 'Transport sector innovation surge' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Target className="h-3.5 w-3.5" /> Missions
        </h3>
        <div className="space-y-2">
          {missions.map((m) => {
            const done = m.progress >= 1;
            return (
              <div key={m.id} className="rounded-lg border border-border/60 bg-card/60 p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={done ? 'text-success' : 'text-foreground'}>{m.label}</span>
                  <span className="font-bold text-primary">{m.reward}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-background/60">
                  <div
                    className={`h-full transition-all ${done ? 'bg-success' : 'bg-gradient-to-r from-primary to-primary-glow'}`}
                    style={{ width: `${m.progress * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Bell className="h-3.5 w-3.5" /> Live Events
        </h3>
        <div className="space-y-1.5">
          {events.map((e, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-border/40 bg-card/40 p-2 text-xs">
              <span className="text-base">{e.icon}</span>
              <span className="text-muted-foreground">{e.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
