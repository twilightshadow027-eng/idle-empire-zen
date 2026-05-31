import { BusinessDef, IndustryId, UpgradeDef } from './types';

export const COST_GROWTH = 1.15;
export const TICK_MS = 100;

export const BUSINESSES: BusinessDef[] = [
  { id: 'lemonade', name: 'Lemonade Stand', icon: '🍋', baseCost: 10, baseIncome: 1, productionTime: 1.2, industry: 'food', unlockAt: 0 },
  { id: 'grocery', name: 'Grocery Shop', icon: '🛒', baseCost: 250, baseIncome: 18, productionTime: 3, industry: 'food', unlockAt: 100 },
  { id: 'coffee', name: 'Coffee Chain', icon: '☕', baseCost: 2_500, baseIncome: 120, productionTime: 6, industry: 'food', unlockAt: 1_000 },
  { id: 'delivery', name: 'Delivery Co.', icon: '🚚', baseCost: 25_000, baseIncome: 950, productionTime: 10, industry: 'transport', unlockAt: 10_000 },
  { id: 'logistics', name: 'Logistics HQ', icon: '🏭', baseCost: 250_000, baseIncome: 8_500, productionTime: 18, industry: 'transport', unlockAt: 100_000 },
  { id: 'tech', name: 'Tech Startup', icon: '💻', baseCost: 2_500_000, baseIncome: 75_000, productionTime: 30, industry: 'tech', unlockAt: 1_000_000 },
];

export const UPGRADES: UpgradeDef[] = [
  { id: 'speed1', name: 'Faster Workers', description: '+25% global production speed', cost: 5_000, category: 'speed',
    effect: { type: 'globalSpeed', value: 1.25 } },
  { id: 'speed2', name: 'Logistics Network', description: '+50% global production speed', cost: 250_000, category: 'speed',
    effect: { type: 'globalSpeed', value: 1.5 } },
  { id: 'efficiency1', name: 'Lean Operations', description: '+50% global income', cost: 15_000, category: 'efficiency',
    effect: { type: 'globalIncome', value: 1.5 } },
  { id: 'efficiency2', name: 'AI Optimization', description: '×3 global income', cost: 750_000, category: 'efficiency',
    effect: { type: 'globalIncome', value: 3 } },
  { id: 'automation1', name: 'Auto-Collect Bots', description: 'Smoother passive income flow', cost: 50_000, category: 'automation',
    effect: { type: 'globalIncome', value: 1.2 } },
  { id: 'worker1', name: 'Worker Bonuses', description: '+40% income from food industry', cost: 35_000, category: 'worker',
    effect: { type: 'businessIncome', value: 1.4, businessId: 'coffee' } },
];

export const INDUSTRY_NAMES: Record<IndustryId, string> = {
  food: 'FOOD', tech: 'TECH', energy: 'NRG', transport: 'TRNS', media: 'MDIA', military: 'MILX',
  crypto: 'CRYP', gold: 'AUX', oil: 'OIL', realestate: 'REIT', pharma: 'PHRM',
  finance: 'FINX', ai: 'AI', gaming: 'GMNG', space: 'SPCE', luxury: 'LUXE',
};

export const INDUSTRY_VOLATILITY: Record<IndustryId, number> = {
  food: 0.6, tech: 1.4, energy: 1.1, transport: 0.7, media: 1.0, military: 0.9,
  crypto: 3.5, gold: 0.4, oil: 1.6, realestate: 0.5, pharma: 1.2,
  finance: 1.0, ai: 2.6, gaming: 1.8, space: 2.2, luxury: 1.3,
};

// Dividend yield expressed as % of share price paid per IN-GAME MINUTE.
// Stable/value sectors pay more; growth/crypto pay little to nothing.
export const INDUSTRY_DIVIDEND: Record<IndustryId, number> = {
  food: 0.8, tech: 0.2, energy: 1.0, transport: 0.7, media: 0.5, military: 0.6,
  crypto: 0, gold: 0.4, oil: 1.2, realestate: 1.6, pharma: 0.9,
  finance: 1.4, ai: 0.1, gaming: 0.3, space: 0, luxury: 0.6,
};

export const EMPLOYEE_NAMES = [
  'Aria Chen', 'Marcus Vale', 'Kira Okafor', 'Dmitri Volkov', 'Sofia Reyes',
  'Jin Park', 'Nora Hassan', 'Liam Brooks', 'Yuki Tanaka', 'Eli Cohen',
  'Zara Khan', 'Theo Lange', 'Mira Singh', 'Owen Black', 'Lyra Stone',
];

export const DAILY_REWARDS = [
  { day: 1, money: 500, title: 'Starter Pack', icon: '📦' },
  { day: 2, money: 1_500, title: 'Growing Empire', icon: '📈' },
  { day: 3, money: 3_000, title: 'Business Boom', icon: '💼' },
  { day: 4, money: 6_000, title: 'Mogul Milestone', icon: '💎' },
  { day: 5, money: 12_000, title: 'Tycoon Tuesday', icon: '🏆' },
  { day: 6, money: 25_000, title: 'Empire Builder', icon: '🏢' },
  { day: 7, money: 50_000, prestige: 1, title: 'Legendary Loot', icon: '👑' },
] as const;

export const WHEEL_COOLDOWN_MS = 1000 * 60 * 60; // 1 hour

export const WHEEL_SEGMENTS = [
  { type: 'cash' as const, label: 'Cash Drop', icon: '💰', color: '#4ade80', chance: 0.22, value: 2500 },
  { type: 'speed' as const, label: 'Speed Surge', icon: '⚡', color: '#facc15', chance: 0.16, value: 2 },
  { type: 'income' as const, label: 'Income Burst', icon: '📈', color: '#60a5fa', chance: 0.16, value: 2 },
  { type: 'upgrade' as const, label: 'Free Upgrade', icon: '⬆️', color: '#a78bfa', chance: 0.10, value: 1 },
  { type: 'employee' as const, label: 'Hire Rush', icon: '👤', color: '#fb923c', chance: 0.10, value: 1 },
  { type: 'mega_cash' as const, label: 'Mega Cash', icon: '💎', color: '#f472b6', chance: 0.10, value: 25000 },
  { type: 'prestige_dust' as const, label: 'Prestige Dust', icon: '✨', color: '#c084fc', chance: 0.08, value: 1 },
  { type: 'nothing' as const, label: 'Nothing', icon: '🌪️', color: '#94a3b8', chance: 0.08, value: 0 },
] as const;
