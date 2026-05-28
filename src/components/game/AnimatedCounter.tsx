import { useEffect, useState } from 'react';
import { formatMoney } from '@/game/engine';

interface Props { value: number; className?: string; prefix?: string; }

export function AnimatedCounter({ value, className, prefix = '' }: Props) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const delta = value - start;
    if (Math.abs(delta) < 0.01) return;
    const duration = 300;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(start + delta * eased);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{prefix}{formatMoney(display)}</span>;
}
