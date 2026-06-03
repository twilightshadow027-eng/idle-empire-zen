import { BUSINESSES, COST_GROWTH, UPGRADES, INDUSTRY_NAMES, INDUSTRY_VOLATILITY, INDUSTRY_DIVIDEND, DAILY_REWARDS, WHEEL_SEGMENTS, WHEEL_COOLDOWN_MS, MARKET_EVENT_POOL, QUESTS } from './config';
import { BusinessId, BusinessState, GameState, IndustryId, IndustryState, StockHolding, Transaction, TxKind } from './types';

const TX_CAP = 250;

function newTx(kind: TxKind, label: string, amount: number): Transaction {
  return { id: crypto.randomUUID(), ts: Date.now(), kind, label, amount };
}

/** Immutable: return new state with tx prepended. */
export function withTx(s: GameState, kind: TxKind, label: string, amount: number): GameState {
  return { ...s, transactions: [newTx(kind, label, amount), ...(s.transactions ?? [])].slice(0, TX_CAP) };
}

/** Mutating: only safe on a freshly-cloned state (e.g. inside tick). */
function pushTx(s: GameState, kind: TxKind, label: string, amount: number) {
  s.transactions = [newTx(kind, label, amount), ...(s.transactions ?? [])].slice(0, TX_CAP);
}


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
      basePrice,
      trend: (Math.random() - 0.5) * 0.4,
      history: Array.from({ length: 120 }, () => basePrice * (0.92 + Math.random() * 0.16)),
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
    totalDividends: 0,
    events: [],
    questsClaimed: {},
    transactions: [],
    lastDividendLogTs: 0,
  };
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as GameState;
    // Heal missing fields from updates
    const fresh = createInitialState();
    const mergedIndustries = { ...fresh.industries } as Record<IndustryId, IndustryState>;
    (Object.keys(mergedIndustries) as IndustryId[]).forEach((id) => {
      const saved = (parsed.industries ?? ({} as any))[id];
      if (saved) {
        mergedIndustries[id] = {
          ...mergedIndustries[id],
          ...saved,
          basePrice: saved.basePrice ?? mergedIndustries[id].basePrice,
        };
      }
    });
    return {
      ...fresh, ...parsed,
      businesses: { ...fresh.businesses, ...parsed.businesses },
      industries: mergedIndustries,
      clan: { ...fresh.clan, ...parsed.clan },
      activeBoosts: parsed.activeBoosts ?? [],
      lastWheelSpin: parsed.lastWheelSpin ?? 0,
      holdings: { ...fresh.holdings, ...(parsed.holdings ?? {}) },
      totalInvested: parsed.totalInvested ?? 0,
      totalRealized: parsed.totalRealized ?? 0,
      totalDividends: parsed.totalDividends ?? 0,
      events: parsed.events ?? [],
      questsClaimed: parsed.questsClaimed ?? {},
      transactions: parsed.transactions ?? [],
      lastDividendLogTs: parsed.lastDividendLogTs ?? 0,
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
  // Deep-clone mutable sub-state so we don't mutate the previous reference.
  const next: GameState = {
    ...state,
    businesses: Object.fromEntries(
      Object.entries(state.businesses).map(([k, v]) => [k, { ...v }])
    ) as Record<BusinessId, BusinessState>,
    industries: Object.fromEntries(
      Object.entries(state.industries).map(([k, v]) => [k, { ...v }])
    ) as Record<IndustryId, IndustryState>,
    transactions: state.transactions ?? [],
  };
  const { income: incMult, speed, perBiz } = getGlobalMultipliers(next);
  const earned: { id: BusinessId; amount: number }[] = [];
  // Aggregate manager auto-collect per business per tick for the ledger.
  const autoAgg: Partial<Record<BusinessId, number>> = {};

  BUSINESSES.forEach((def) => {
    const b = next.businesses[def.id];
    if (!b.owned || b.level === 0) return;
    const cycle = def.productionTime / speed;
    b.progress += dtSec / cycle;
    let safety = 0;
    while (b.progress >= 1 && safety++ < 50) {
      b.progress -= 1;
      if (b.hasManager) {
        const amt = businessIncome(def.baseIncome, b.level, incMult, perBiz[def.id] ?? 1);
        next.money += amt;
        next.totalEarned += amt;
        earned.push({ id: def.id, amount: amt });
        autoAgg[def.id] = (autoAgg[def.id] ?? 0) + amt;
      } else {
        b.progress = 1;
        break;
      }
    }
  });
  (Object.keys(autoAgg) as BusinessId[]).forEach((id) => {
    const def = BUSINESSES.find((b) => b.id === id)!;
    pushTx(next, 'auto', `${def.icon} ${def.name} auto-collect`, autoAgg[id]!);
  });

  const now = Date.now();
  if (next.activeBoosts.some((b) => b.expiresAt <= now)) {
    next.activeBoosts = next.activeBoosts.filter((b) => b.expiresAt > now);
  }
  if ((next.events ?? []).some((e) => e.expiresAt <= now)) {
    next.events = next.events.filter((e) => e.expiresAt > now);
  }

  if ((next.events?.length ?? 0) < 4 && Math.random() < dtSec / 35) {
    const pick = MARKET_EVENT_POOL[Math.floor(Math.random() * MARKET_EVENT_POOL.length)];
    next.events = [...(next.events ?? []), {
      id: crypto.randomUUID(),
      label: pick.label,
      icon: pick.icon,
      industryId: pick.industryId,
      trendBoost: pick.trendBoost,
      expiresAt: now + pick.durationMs,
    }];
    pushTx(next, 'event', `${pick.icon} ${pick.label} (${INDUSTRY_NAMES[pick.industryId]})`, 0);
  }

  const eventBias: Partial<Record<IndustryId, number>> = {};
  (next.events ?? []).forEach((e) => {
    eventBias[e.industryId] = (eventBias[e.industryId] ?? 0) + e.trendBoost;
  });

  (Object.keys(next.industries) as IndustryId[]).forEach((id) => {
    const ind = next.industries[id];
    const vol = INDUSTRY_VOLATILITY[id] ?? 1;
    const deviation = (ind.price - ind.basePrice) / ind.basePrice;
    const reversion = -deviation * 0.04 * dtSec;
    ind.trend += (Math.random() - 0.5) * 0.03 * vol * dtSec + reversion;
    if (eventBias[id]) ind.trend += eventBias[id]! * dtSec * 0.5;
    if (Math.random() < dtSec * 0.0015) {
      ind.trend += (Math.random() - 0.5) * 1.8 * vol;
    }
    ind.trend = Math.max(-1, Math.min(1, ind.trend * 0.992));
    const drift = ind.trend * 0.0025 * vol * dtSec * 60;
    const noise = (Math.random() - 0.5) * 0.0012 * vol;
    let nextPrice = ind.price * (1 + drift + noise);
    const lo = ind.basePrice * 0.2;
    const hi = ind.basePrice * 1.8;
    if (nextPrice < lo) { nextPrice = lo; ind.trend = Math.max(ind.trend, 0.05); }
    if (nextPrice > hi) { nextPrice = hi; ind.trend = Math.min(ind.trend, -0.05); }
    ind.price = nextPrice;
    if (Math.random() < dtSec * 0.25) {
      ind.history = [...ind.history.slice(-19), ind.price];
    }
  });

  // Dividends — log aggregate roughly once per minute.
  let dividendTotal = 0;
  (Object.keys(next.holdings) as IndustryId[]).forEach((id) => {
    const h = next.holdings[id];
    if (!h || h.shares <= 0) return;
    const ratePerMin = INDUSTRY_DIVIDEND[id] ?? 0;
    if (ratePerMin <= 0) return;
    const payout = h.shares * next.industries[id].price * (ratePerMin / 100) * (dtSec / 60);
    dividendTotal += payout;
  });
  if (dividendTotal > 0) {
    next.money += dividendTotal;
    next.totalEarned += dividendTotal;
    next.totalDividends += dividendTotal;
    if (now - (next.lastDividendLogTs ?? 0) >= 60_000) {
      const since = next.lastDividendLogTs ? (now - next.lastDividendLogTs) / 1000 : 60;
      // Estimate batch by per-second rate
      const batch = dividendTotal * (since / dtSec);
      pushTx(next, 'dividend', `Dividend payouts (last ${Math.round(since)}s)`, batch);
      next.lastDividendLogTs = now;
    } else if (next.lastDividendLogTs === 0) {
      next.lastDividendLogTs = now;
    }
  }

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
  return { state: withTx(next, 'collect', `${def.icon} ${def.name} collected`, amount), amount };
}

export function buyOrUpgrade(state: GameState, id: BusinessId): GameState {
  const def = BUSINESSES.find((b) => b.id === id)!;
  const b = state.businesses[id];
  const cost = businessCost(def.baseCost, b.level);
  if (state.money < cost) return state;
  const next: GameState = {
    ...state,
    money: state.money - cost,
    businesses: { ...state.businesses, [id]: { ...b, owned: true, level: b.level + 1 } },
  };
  const label = b.owned ? `Upgrade ${def.name} → Lv${b.level + 1}` : `Buy ${def.name}`;
  return withTx(next, 'business', `${def.icon} ${label}`, -cost);
}

export function buyUpgrade(state: GameState, id: string): GameState {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) return state;
  if (state.upgrades[u.id]) return state;
  if (state.money < u.cost) return state;
  const next = { ...state, money: state.money - u.cost, upgrades: { ...state.upgrades, [u.id]: true } };
  return withTx(next, 'upgrade', `Upgrade: ${u.name}`, -u.cost);
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
  if (!isFinite(n)) return '$0';
  const neg = n < 0;
  const abs = Math.abs(n);
  const sign = neg ? '-' : '';
  if (abs < 1000) return `${sign}$${abs.toFixed(abs < 10 ? 2 : 0)}`;
  const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
  const tier = Math.floor(Math.log10(abs) / 3);
  const v = abs / Math.pow(1000, tier);
  return `${sign}$${v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0)}${units[tier] ?? 'e' + tier * 3}`;
}

export function computeQuestProgress(state: GameState, metric: import('./types').Quest['metric']): number {
  switch (metric) {
    case 'owned': return Object.values(state.businesses).filter((b) => b.owned).length;
    case 'totalEarned': return state.totalEarned;
    case 'totalLevels': return Object.values(state.businesses).reduce((a, b) => a + b.level, 0);
    case 'managers': return state.employees.filter((e) => e.role === 'Manager').length;
    case 'employees': return state.employees.length;
    case 'portfolio': return Object.entries(state.holdings).reduce((s, [id, h]) => s + (h?.shares ?? 0) * (state.industries[id as IndustryId]?.price ?? 0), 0);
    case 'upgrades': return Object.values(state.upgrades).filter(Boolean).length;
    case 'dividends': return state.totalDividends;
    case 'prestige': return state.prestigePoints;
    case 'industries': return Object.values(state.holdings).filter((h) => (h?.shares ?? 0) > 0).length;
  }
  return 0;
}

export function claimQuest(state: GameState, questId: string): GameState {
  const q = QUESTS.find((x) => x.id === questId);
  if (!q) return state;
  if (state.questsClaimed[questId]) return state;
  if (computeQuestProgress(state, q.metric) < q.target) return state;
  const next = {
    ...state,
    money: state.money + q.rewardMoney,
    totalEarned: state.totalEarned + q.rewardMoney,
    questsClaimed: { ...state.questsClaimed, [questId]: true },
  };
  return withTx(next, 'quest', `Quest: ${q.label}`, q.rewardMoney);
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
  return withTx(next, 'daily', `${reward.icon} Daily Reward (Day ${streak})`, reward.money);
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
        level: 1,
        trainingCost: Math.round(base * 0.4),
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
  return withTx(next, 'wheel', `Wheel: ${result.icon} ${result.label}`, result.type === 'cash' || result.type === 'mega_cash' ? result.value : 0);
}



export function buyStock(state: GameState, id: IndustryId, shares: number): GameState {
  if (shares <= 0) return state;
  const ind = state.industries[id];
  const cost = ind.price * shares;
  if (state.money < cost) return state;
  const existing = state.holdings[id] ?? { shares: 0, avgCost: 0 };
  const newShares = existing.shares + shares;
  const newAvg = (existing.avgCost * existing.shares + cost) / newShares;
  const next = {
    ...state,
    money: state.money - cost,
    totalInvested: state.totalInvested + cost,
    holdings: { ...state.holdings, [id]: { shares: newShares, avgCost: newAvg } },
  };
  return withTx(next, 'market_buy', `Buy ${shares} ${INDUSTRY_NAMES[id]} @ $${ind.price.toFixed(2)}`, -cost);
}

export function sellStock(state: GameState, id: IndustryId, shares: number): GameState {
  if (shares <= 0) return state;
  const ind = state.industries[id];
  const existing = state.holdings[id];
  if (!existing || existing.shares < shares) return state;
  const proceeds = ind.price * shares;
  const remaining = existing.shares - shares;
  const realized = proceeds - existing.avgCost * shares;
  const next = {
    ...state,
    money: state.money + proceeds,
    totalEarned: state.totalEarned + Math.max(0, realized),
    totalRealized: state.totalRealized + realized,
    holdings: {
      ...state.holdings,
      [id]: { shares: remaining, avgCost: remaining === 0 ? 0 : existing.avgCost },
    },
  };
  return withTx(next, 'market_sell', `Sell ${shares} ${INDUSTRY_NAMES[id]} @ $${ind.price.toFixed(2)} (P/L ${realized >= 0 ? '+' : ''}${formatMoney(realized)})`, proceeds);
}
