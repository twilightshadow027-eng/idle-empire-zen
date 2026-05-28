import { useGame } from '@/game/store';
import { formatMoney } from '@/game/engine';

export function FloatingNumbers() {
  const floatings = useGame((s) => s.floatings);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {floatings.map((f) => (
        <div
          key={f.id}
          className="absolute animate-float-up font-display font-bold text-primary text-lg drop-shadow-[0_0_12px_hsl(var(--primary)/0.8)]"
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
        >
          +{formatMoney(f.amount)}
        </div>
      ))}
    </div>
  );
}
