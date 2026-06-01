import { useState, useRef, useCallback, useEffect } from 'react';
import { useGame } from '@/game/store';
import { canSpin, formatMoney, getWheelResult } from '@/game/engine';
import { WHEEL_SEGMENTS, WHEEL_COOLDOWN_MS } from '@/game/config';
import type { WheelSegment } from '@/game/types';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, Zap, TrendingUp, ArrowUpCircle, UserPlus, Gem, Frown, X } from 'lucide-react';

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;

const ICON_MAP: Record<string, React.ReactNode> = {
  '💰': <Gem className="h-4 w-4" />,
  '⚡': <Zap className="h-4 w-4" />,
  '📈': <TrendingUp className="h-4 w-4" />,
  '⬆️': <ArrowUpCircle className="h-4 w-4" />,
  '👤': <UserPlus className="h-4 w-4" />,
  '💎': <Gem className="h-4 w-4" />,
  '✨': <Sparkles className="h-4 w-4" />,
  '🌪️': <Frown className="h-4 w-4" />,
};

function wedgeClip(startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const cx = 50, cy = 50, r = 50;
  const steps = 5;
  const points: string[] = [`${cx}% ${cy}%`];
  for (let s = 0; s <= steps; s++) {
    const d = startDeg + (endDeg - startDeg) * (s / steps);
    const x = cx + r * Math.sin(toRad(d));
    const y = cy - r * Math.cos(toRad(d));
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  }
  return `polygon(${points.join(', ')})`;
}

export function SpinWheelPanel() {
  const state = useGame((s) => s.state);
  const spinAction = useGame((s) => s.spinWheelAction);
  const activeBoosts = state.activeBoosts;

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cooldownText, setCooldownText] = useState('');
  const wheelRef = useRef<HTMLDivElement>(null);

  const available = canSpin(state);
  const lastSpin = state.lastWheelSpin;

  // Update cooldown text every second
  useEffect(() => {
    const update = () => {
      if (!lastSpin) { setCooldownText('Ready to spin!'); return; }
      const remaining = WHEEL_COOLDOWN_MS - (Date.now() - lastSpin);
      if (remaining <= 0) { setCooldownText('Ready to spin!'); return; }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCooldownText(`${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastSpin]);

  const handleSpin = useCallback(() => {
    if (spinning || !available) return;
    setSpinning(true);
    setShowResult(false);
    setResult(null);

    // Roll the actual weighted result up-front so the wheel lands on it.
    const landed = getWheelResult();
    const segmentIndex = WHEEL_SEGMENTS.findIndex((s) => s.type === landed.type);
    // Segment center sits at angle (segmentIndex * SEGMENT_ANGLE). The wheel must rotate
    // CLOCKWISE so that center aligns under the pointer at the top.
    // After N full spins, final rotation should make `rotation mod 360 === -segmentCenter (mod 360)`.
    const fullSpins = 6;
    const segmentCenter = segmentIndex * SEGMENT_ANGLE;
    // Small jitter within the segment so it doesn't land dead-center every time.
    const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);
    const currentMod = ((rotation % 360) + 360) % 360;
    const targetMod = ((-segmentCenter - jitter) % 360 + 360) % 360;
    const delta = ((targetMod - currentMod) + 360) % 360;
    const targetRotation = rotation + fullSpins * 360 + delta;

    setRotation(targetRotation);

    setTimeout(() => {
      spinAction(landed as WheelSegment);
      setResult(landed as WheelSegment);
      setShowResult(true);
      // Keep `spinning` true a moment longer so the long-duration transition class
      // isn't swapped to the short one mid-frame (which can cause a visual snap).
      setTimeout(() => setSpinning(false), 200);
    }, 4200);
  }, [spinning, available, rotation, spinAction]);

  const closeResult = () => setShowResult(false);

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {/* Active boosts */}
      {activeBoosts.length > 0 && (
        <div className="flex w-full flex-wrap gap-2 px-2">
          {activeBoosts.map((b) => (
            <div
              key={b.id}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold',
                b.type === 'speed'
                  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                  : 'border-blue-500/40 bg-blue-500/10 text-blue-400'
              )}
            >
              {b.type === 'speed' ? <Zap className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {b.type === 'speed' ? 'Speed' : 'Income'} ×{b.multiplier}
              <span className="ml-1 text-[10px] opacity-70">
                {Math.ceil((b.expiresAt - Date.now()) / 60000)}m
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Wheel container */}
      <div className="relative flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute -top-3 z-10">
          <div className="h-0 w-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
        </div>

        {/* Outer ring glow */}
        <div
          className={cn(
            'absolute rounded-full transition-all',
            available && !spinning && 'shadow-[0_0_40px_hsl(var(--primary)/0.3)]'
          )}
          style={{ width: 260, height: 260 }}
        />

        {/* Wheel */}
        <div
          ref={wheelRef}
          className={cn(
            'relative h-64 w-64 rounded-full border-4 border-border/80 shadow-2xl',
            spinning ? 'transition-transform duration-[4000ms]' : 'transition-transform duration-300'
          )}
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionTimingFunction: spinning ? 'cubic-bezier(0.17,0.67,0.12,0.99)' : undefined,
          }}
        >
          {/* Segments using clip-path wedges */}
          {WHEEL_SEGMENTS.map((seg, i) => {
            const start = i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
            const end = (i + 1) * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
            return (
              <div
                key={seg.type}
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: seg.color,
                  clipPath: wedgeClip(start, end),
                  opacity: 0.9,
                }}
              />
            );
          })}

          {/* Segment labels */}
          {WHEEL_SEGMENTS.map((seg, i) => {
            const angle = i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2 + SEGMENT_ANGLE / 2;
            return (
              <div
                key={`label-${seg.type}`}
                className="pointer-events-none absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-white/90"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-88px)`,
                }}
              >
                <span className="text-base drop-shadow-md">{seg.icon}</span>
              </div>
            );
          })}

          {/* Center hub */}
          <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-border bg-card shadow-xl z-10">
            <span className="text-2xl font-bold text-gradient-gold">E</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleSpin}
          disabled={!available || spinning}
          className={cn(
            'relative flex h-14 w-44 items-center justify-center rounded-xl font-display text-lg font-bold uppercase tracking-wider transition-all',
            available && !spinning
              ? 'bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[0_0_25px_hsl(var(--primary)/0.4)] hover:scale-105 hover:shadow-[0_0_35px_hsl(var(--primary)/0.6)] active:scale-95'
              : 'cursor-not-allowed bg-muted text-muted-foreground'
          )}
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Spinning...
            </span>
          ) : available ? (
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Spin Wheel
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {cooldownText}
            </span>
          )}
        </button>
        <p className="text-xs text-muted-foreground">
          {available ? 'Free spin available!' : 'One spin per hour'}
        </p>
      </div>

      {/* Legend */}
      <div className="grid w-full grid-cols-2 gap-2 px-2 sm:grid-cols-4">
        {WHEEL_SEGMENTS.map((seg) => (
          <div key={seg.type} className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-2 py-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs" style={{ backgroundColor: seg.color + '30', color: seg.color }}>
              {ICON_MAP[seg.icon] ?? seg.icon}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-bold leading-tight">{seg.label}</div>
              <div className="text-[10px] text-muted-foreground">
                {seg.type === 'cash' && `+${formatMoney(seg.value)}`}
                {seg.type === 'mega_cash' && `+${formatMoney(seg.value)}`}
                {seg.type === 'speed' && `×${seg.value} speed (5m)`}
                {seg.type === 'income' && `×${seg.value} income (5m)`}
                {seg.type === 'upgrade' && 'Free upgrade'}
                {seg.type === 'employee' && 'Random hire'}
                {seg.type === 'prestige_dust' && `+${seg.value} prestige`}
                {seg.type === 'nothing' && 'Better luck next time'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Result modal */}
      {showResult && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xs rounded-2xl border border-border/60 bg-card p-6 text-center shadow-2xl animate-scale-in">
            <button onClick={closeResult} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: result.color + '25', color: result.color }}
            >
              {result.icon}
            </div>

            <h3 className="font-display text-xl font-bold">{result.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.type === 'cash' && `You won ${formatMoney(result.value)}!`}
              {result.type === 'mega_cash' && `Jackpot! ${formatMoney(result.value)}!`}
              {result.type === 'speed' && `Production speed doubled for 5 minutes!`}
              {result.type === 'income' && `Income doubled for 5 minutes!`}
              {result.type === 'upgrade' && 'A free upgrade has been applied!'}
              {result.type === 'employee' && 'A new employee joined your empire!'}
              {result.type === 'prestige_dust' && `+${result.value} prestige point added!`}
              {result.type === 'nothing' && 'The wheel landed on empty space. Try again later!'}
            </p>

            <button
              onClick={closeResult}
              className="mt-5 w-full rounded-xl bg-primary py-2.5 font-display text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
            >
              Awesome
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
