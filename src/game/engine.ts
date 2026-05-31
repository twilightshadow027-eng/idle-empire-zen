import { BUSINESSES, COST_GROWTH, UPGRADES, INDUSTRY_NAMES, INDUSTRY_VOLATILITY, INDUSTRY_DIVIDEND, DAILY_REWARDS, WHEEL_SEGMENTS, WHEEL_COOLDOWN_MS } from './config';
import { BusinessId, BusinessState, GameState, IndustryId, IndustryState, StockHolding } from './types';

export const STORAGE_KEY = 'idle-empire-save-v1';

export function createInitialState(): GameState {
  const businesses = {} as Record<BusinessId, BusinessState>;
  BUSINESSES.forEach((b) => {
    businesses[b.id] = { id: b.id, level: 0, owned: false, progress: 0, hasManager: false };
  });
  const industries = {} as Record<IndustryId, IndustryState>;
  (Object.keys(INDUSTRY_NAMES) as IndustryId[]).forEach((id) => {
    const vol = INDUSTRY_VOLATILITY[id] ?? 1;
    const basePrice = 20 + Math.random() * 480 * Math.max(0.5, vol);
    industries[id] = {
      id, name: INDUSTRY_NAMES[id],
      price: basePrice,
      trend: (Math.random() - 0.5) * 0.6 * vol,
      history: Array.from({ length: 20 }, () => basePrice * (0.85 + Math.random() * 0.3)),
    };
  });
  return {
    money: 20,
    totalEarned: 0,
    multiplier: 1,
    businesses,
    upgrades: {} as GameState['upgrades'],
    employees: [],
    industries,
    marketInfluence: 0,
    clan: { name: 'Solo Tycoon', rank: 9999, influence: 0, members: 1, vault: 0 },
    lastTick: Date.now(),
    prestigePoints: 0,
    lastClaimedDate: '',
    claimStreak: 0,
    lastWheelSpin: 0,
    activeBoosts: [],
    holdings: {} as Record<IndustryId, StockHolding>,
    totalInvested: 0,
    totalRealized: 0,
  };
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as GameState;
    // Heal missing fields from updates
    const fresh = createInitialState();
    return {
      ...fresh, ...parsed,
      businesses: { ...fresh.businesses, ...parsed.businesses },
      industries: { ...fresh.industries, ...parsed.industries },
      clan: { ...fresh.clan, ...parsed.clan },
      activeBoosts: parsed.activeBoosts ?? [],
      lastWheelSpin: parsed.lastWheelSpin ?? 0,
      holdings: { ...fresh.holdings, ...(parsed.holdings ?? {}) },
      totalInvested: parsed.totalInvested ?? 0,
      totalRealized: parsed.totalRealized ?? 0,
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(s: GameState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function businessCost(baseCost: number, level: number) {
  return Math.ceil(baseCost * Math.pow(COST_GROWTH, level));
}

export function businessIncome(baseIncome: number, level: number, globalMult: number, bizMult: number) {
  return baseIncome * Math.max(level, 1) * globalMult * bizMult;
}

export function getGlobalMultipliers(s: GameState) {
  let income = s.multiplier;
  let speed = 1;
  const perBiz: Partial<Record<BusinessId, number>> = {};
  UPGRADES.forEach((u) => {
    if (!s.upgrades[u.id]) return;
    if (u.effect.type === 'globalIncome') income *= u.effect.value;
    if (u.effect.type === 'globalSpeed') speed *= u.effect.value;
    if (u.effect.type === 'businessIncome' && u.effect.businessId) {
      perBiz[u.effect.businessId] = (perBiz[u.effect.businessId] ?? 1) * u.effect.value;
    }
  });
  // Prestige bonus
  income *= 1 + s.prestigePoints * 0.1;
  // Employees boost
  s.employees.forEach((e) => {
    if (e.role === 'Manager' && e.assignedTo) {
      // handled via hasManager flag
    }
    if (e.role === 'Accountant') income *= 1 + (e.productivity / 1000);
    if (e.role === 'Engineer') speed *= 1 + (e.productivity / 1500);
  });
  // Active wheel boosts
  const now = Date.now();
  s.activeBoosts.forEach((b) => {
    if (b.expiresAt > now) {
      if (b.type === 'speed') speed *= b.multiplier;
      if (b.type === 'income') income *= b.multiplier;
    }
  });
  return { income, speed, perBiz };
}

export function tick(state: GameState, dtSec: number): { state: GameState; earned: { id: BusinessId; amount: number }[] } {
  const next = { ...state, businesses: { ...state.businesses } };
  const { income: incMult, speed, perBiz } = getGlobalMultipliers(next);
  const earned: { id: BusinessId; amount: number }[] = [];

  BUSINESSES.forEach((def) => {
    const b = next.businesses[def.id];
    if (!b.owned || b.level === 0) return;
    const cycle = def.productionTime / speed;
    b.progress += dtSec / cycle;
    while (b.progress >= 1) {
      b.progress -= 1;
      if (b.hasManager) {
        const amt = businessIncome(def.baseIncome, b.level, incMult, perBiz[def.id] ?? 1);
        next.money += amt;
        next.totalEarned += amt;
        earned.push({ id: def.id, amount: amt });
      } else {
        // Stop at 1, await manual collect
        b.progress = 1;
        break;
      }
    }
  });

  // Clean expired boosts
  const now = Date.now();
  if (next.activeBoosts.some((b) => b.expiresAt <= now)) {
    next.activeBoosts = next.activeBoosts.filter((b) => b.expiresAt > now);
  }

  // Drift market prices — volatility per industry, with shock events
  (Object.keys(next.industries) as IndustryId[]).forEach((id) => {
    const ind = next.industries[id];
    const vol = INDUSTRY_VOLATILITY[id] ?? 1;
    // Trend random walk
    ind.trend += (Math.random() - 0.5) * 0.25 * vol * dtSec;
    // Occasional shock (pump/dump)
    if (Math.random() < dtSec * 0.04 * vol) {
      ind.trend += (Math.random() - 0.5) * 1.2 * vol;
    }
    ind.trend = Math.max(-1, Math.min(1, ind.trend * 0.985));
    // Price moves with trend + jitter
    const drift = ind.trend * 0.015 * vol * dtSec * 60;
    const noise = (Math.random() - 0.5) * 0.008 * vol;
    ind.price = Math.max(1, ind.price * (1 + drift + noise));
    if (Math.random() < dtSec * 0.8) {
      ind.history = [...ind.history.slice(-19), ind.price];
    }
  });

  return { state: next, earned };
}

export function collectBusiness(state: GameState, id: BusinessId): { state: GameState; amount: number } {
  const def = BUSINESSES.find((b) => b.id === id)!;
  const b = state.businesses[id];
  if (!b.owned || b.progress < 1) return { state, amount: 0 };
  const { income, perBiz } = getGlobalMultipliers(state);
  const amount = businessIncome(def.baseIncome, b.level, income, perBiz[id] ?? 1);
  const next: GameState = {
    ...state,
    money: state.money + amount,
    totalEarned: state.totalEarned + amount,
    businesses: { ...state.businesses, [id]: { ...b, progress: 0 } },
  };
  return { state: next, amount };
}

export function buyOrUpgrade(state: GameState, id: BusinessId): GameState {
  const def = BUSINESSES.find((b) => b.id === id)!;
  const b = state.businesses[id];
  const cost = businessCost(def.baseCost, b.level);
  if (state.money < cost) return state;
  return {
    ...state,
    money: state.money - cost,
    businesses: { ...state.businesses, [id]: { ...b, owned: true, level: b.level + 1 } },
  };
}

export function buyUpgrade(state: GameState, id: string): GameState {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) return state;
  if (state.upgrades[u.id]) return state;
  if (state.money < u.cost) return state;
  return { ...state, money: state.money - u.cost, upgrades: { ...state.upgrades, [u.id]: true } };
}

export function calculateOfflineEarnings(state: GameState, nowMs: number): number {
  const dtSec = Math.min((nowMs - state.lastTick) / 1000, 60 * 60 * 4); // cap 4h
  if (dtSec < 5) return 0;
  const { income: incMult, speed, perBiz } = getGlobalMultipliers(state);
  let total = 0;
  BUSINESSES.forEach((def) => {
    const b = state.businesses[def.id];
    if (!b.owned || !b.hasManager) return;
    const cycle = def.productionTime / speed;
    const cycles = dtSec / cycle;
    total += businessIncome(def.baseIncome, b.level, incMult, perBiz[def.id] ?? 1) * cycles * 0.5; // offline at 50%
  });
  return Math.floor(total);
}

export function formatMoney(n: number): string {
  if (n < 1000) return `$${n.toFixed(n < 10 ? 2 : 0)}`;
  const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
  const v = n / Math.pow(1000, tier);
  return `$${v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0)}${units[tier] ?? 'e' + tier * 3}`;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isYesterday(today: string, lastDate: string): boolean {
  const t = new Date(today + 'T00:00:00');
  const l = new Date(lastDate + 'T00:00:00');
  const diff = (t.getTime() - l.getTime()) / (1000 * 60 * 60 * 24);
  return diff === 1;
}

export function canClaimToday(state: GameState): boolean {
  if (!state.lastClaimedDate) return true;
  return state.lastClaimedDate !== getToday();
}

export function claimDailyReward(state: GameState): GameState {
  if (!canClaimToday(state)) return state;
  const today = getToday();
  const streak = state.lastClaimedDate && isYesterday(today, state.lastClaimedDate)
    ? Math.min(state.claimStreak + 1, 7)
    : 1;
  const reward = DAILY_REWARDS[streak - 1];
  let next: GameState = {
    ...state,
    money: state.money + reward.money,
    totalEarned: state.totalEarned + reward.money,
    claimStreak: streak,
    lastClaimedDate: today,
  };
  if ('prestige' in reward && reward.prestige) {
    next.prestigePoints = next.prestigePoints + reward.prestige;
  }
  return next;
}

export function canSpin(state: GameState): boolean {
  return Date.now() - state.lastWheelSpin >= WHEEL_COOLDOWN_MS;
}

export function getWheelResult() {
  const r = Math.random();
  let acc = 0;
  for (const seg of WHEEL_SEGMENTS) {
    acc += seg.chance;
    if (r <= acc) return seg;
  }
  return WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1];
}

export function spinWheel(state: GameState, empNames: string[], forcedResult?: typeof WHEEL_SEGMENTS[number]): GameState {
  if (!canSpin(state)) return state;
  const result = forcedResult ?? getWheelResult();
  const now = Date.now();
  let next: GameState = { ...state, lastWheelSpin: now };

  switch (result.type) {
    case 'cash':
      next.money += result.value;
      next.totalEarned += result.value;
      break;
    case 'mega_cash':
      next.money += result.value;
      next.totalEarned += result.value;
      break;
    case 'speed':
      next.activeBoosts = [...next.activeBoosts, {
        id: crypto.randomUUID(), type: 'speed', multiplier: result.value, expiresAt: now + 5 * 60 * 1000,
      }];
      break;
    case 'income':
      next.activeBoosts = [...next.activeBoosts, {
        id: crypto.randomUUID(), type: 'income', multiplier: result.value, expiresAt: now + 5 * 60 * 1000,
      }];
      break;
    case 'upgrade': {
      const affordable = UPGRADES.filter((u) => !state.upgrades[u.id]).sort((a, b) => a.cost - b.cost);
      if (affordable.length) {
        const u = affordable[0];
        next.upgrades = { ...next.upgrades, [u.id]: true };
      }
      break;
    }
    case 'employee': {
      const roles: import('./types').EmployeeRole[] = ['Manager', 'Accountant', 'Spy', 'Engineer', 'Negotiator', 'Security'];
      const role = roles[Math.floor(Math.random() * roles.length)];
      const base = role === 'Manager' ? 5000 : role === 'Engineer' ? 8000 : role === 'Spy' ? 12000 : 3000;
      const emp = {
        id: crypto.randomUUID(),
        name: empNames[Math.floor(Math.random() * empNames.length)],
        role,
        intelligence: 30 + Math.floor(Math.random() * 70),
        loyalty: 30 + Math.floor(Math.random() * 70),
        greed: 10 + Math.floor(Math.random() * 80),
        productivity: 30 + Math.floor(Math.random() * 70),
        salary: base,
        hiredAt: now,
      };
      next.employees = [...next.employees, emp];
      break;
    }
    case 'prestige_dust':
      next.prestigePoints += result.value;
      break;
    case 'nothing':
    default:
      break;
  }
  return next;
}



export function buyStock(state: GameState, id: IndustryId, shares: number): GameState {
  if (shares <= 0) return state;
  const ind = state.industries[id];
  const cost = ind.price * shares;
  if (state.money < cost) return state;
  const existing = state.holdings[id] ?? { shares: 0, avgCost: 0 };
  const newShares = existing.shares + shares;
  const newAvg = (existing.avgCost * existing.shares + cost) / newShares;
  return {
    ...state,
    money: state.money - cost,
    totalInvested: state.totalInvested + cost,
    holdings: { ...state.holdings, [id]: { shares: newShares, avgCost: newAvg } },
  };
}

export function sellStock(state: GameState, id: IndustryId, shares: number): GameState {
  if (shares <= 0) return state;
  const ind = state.industries[id];
  const existing = state.holdings[id];
  if (!existing || existing.shares < shares) return state;
  const proceeds = ind.price * shares;
  const remaining = existing.shares - shares;
  const realized = proceeds - existing.avgCost * shares;
  return {
    ...state,
    money: state.money + proceeds,
    totalEarned: state.totalEarned + Math.max(0, realized),
    totalRealized: state.totalRealized + realized,
    holdings: {
      ...state.holdings,
      [id]: { shares: remaining, avgCost: remaining === 0 ? 0 : existing.avgCost },
    },
  };
}
