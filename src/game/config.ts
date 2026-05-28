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
  food: 'Food', tech: 'Technology', energy: 'Energy', transport: 'Transport', media: 'Media', military: 'Military',
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
