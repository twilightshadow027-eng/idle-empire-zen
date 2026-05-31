import { BusinessDef, IndustryCategory, IndustryId, UpgradeDef } from './types';

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
  // Energy
  oil: 'OIL', gas: 'NGAS', coal: 'COAL', solar: 'SOLR', nuclear: 'NUKE', energy: 'NRG',
  // Metals
  gold: 'AUX', silver: 'SLVR', copper: 'CPPR', platinum: 'PLAT', lithium: 'LITH',
  // Crypto
  crypto: 'BTC', eth: 'ETH', doge: 'DOGE', sol: 'SOL',
  // Tech
  tech: 'TECH', ai: 'AI', semis: 'CHIP', cloud: 'CLD', gaming: 'GMNG',
  // Finance
  finance: 'FINX', banks: 'BNK', insurance: 'INS',
  // Consumer
  food: 'FOOD', luxury: 'LUXE', media: 'MDIA', retail: 'RTL',
  // Industrial
  transport: 'TRNS', logistics: 'LGX', military: 'MILX', space: 'SPCE',
  // Real Estate / Health
  realestate: 'REIT', pharma: 'PHRM', biotech: 'BIO',
};

export const INDUSTRY_CATEGORY: Record<IndustryId, IndustryCategory> = {
  oil: 'Energy', gas: 'Energy', coal: 'Energy', solar: 'Energy', nuclear: 'Energy', energy: 'Energy',
  gold: 'Metals', silver: 'Metals', copper: 'Metals', platinum: 'Metals', lithium: 'Metals',
  crypto: 'Crypto', eth: 'Crypto', doge: 'Crypto', sol: 'Crypto',
  tech: 'Tech', ai: 'Tech', semis: 'Tech', cloud: 'Tech', gaming: 'Tech',
  finance: 'Finance', banks: 'Finance', insurance: 'Finance',
  food: 'Consumer', luxury: 'Consumer', media: 'Consumer', retail: 'Consumer',
  transport: 'Industrial', logistics: 'Industrial', military: 'Industrial', space: 'Industrial',
  realestate: 'RealEstate', pharma: 'RealEstate', biotech: 'RealEstate',
};

export const CATEGORY_ORDER: IndustryCategory[] = ['Crypto', 'Tech', 'Energy', 'Metals', 'Finance', 'Consumer', 'Industrial', 'RealEstate'];

export const CATEGORY_LABELS: Record<IndustryCategory, string> = {
  Energy: 'Energy', Metals: 'Metals & Materials', Crypto: 'Crypto', Tech: 'Tech & AI',
  Finance: 'Finance', Consumer: 'Consumer', Industrial: 'Industrial', RealEstate: 'Real Estate & Health',
};

export const INDUSTRY_VOLATILITY: Record<IndustryId, number> = {
  oil: 1.6, gas: 1.4, coal: 1.0, solar: 1.5, nuclear: 0.8, energy: 1.1,
  gold: 0.4, silver: 0.6, copper: 0.9, platinum: 0.7, lithium: 1.7,
  crypto: 3.5, eth: 3.2, doge: 4.5, sol: 3.8,
  tech: 1.4, ai: 2.6, semis: 1.8, cloud: 1.2, gaming: 1.8,
  finance: 1.0, banks: 0.7, insurance: 0.5,
  food: 0.6, luxury: 1.3, media: 1.0, retail: 0.9,
  transport: 0.7, logistics: 0.8, military: 0.9, space: 2.2,
  realestate: 0.5, pharma: 1.2, biotech: 2.0,
};

// Dividend yield expressed as % of share price paid per IN-GAME MINUTE.
// Stable/value sectors pay more; growth/crypto pay little to nothing.
export const INDUSTRY_DIVIDEND: Record<IndustryId, number> = {
  oil: 1.2, gas: 1.1, coal: 1.4, solar: 0.3, nuclear: 1.0, energy: 1.0,
  gold: 0.4, silver: 0.3, copper: 0.7, platinum: 0.5, lithium: 0.2,
  crypto: 0, eth: 0, doge: 0, sol: 0,
  tech: 0.2, ai: 0.1, semis: 0.5, cloud: 0.4, gaming: 0.3,
  finance: 1.4, banks: 1.6, insurance: 1.3,
  food: 0.8, luxury: 0.6, media: 0.5, retail: 0.9,
  transport: 0.7, logistics: 0.8, military: 0.6, space: 0,
  realestate: 1.6, pharma: 0.9, biotech: 0.2,
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
