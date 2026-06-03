// Core game types
export type BusinessId =
  | 'lemonade' | 'grocery' | 'coffee' | 'delivery' | 'logistics' | 'tech'
  | 'casino' | 'oilrig' | 'bank' | 'biotech_lab' | 'space_station';

export interface BusinessDef {
  id: BusinessId;
  name: string;
  icon: string;
  baseCost: number;
  baseIncome: number;       // per cycle
  productionTime: number;   // seconds per cycle
  industry: IndustryId;
  unlockAt: number;         // money required to unlock
}

export interface BusinessState {
  id: BusinessId;
  level: number;
  owned: boolean;
  progress: number;         // 0..1 toward next payout
  hasManager: boolean;
}

export type IndustryId =
  // Energy
  | 'oil' | 'gas' | 'coal' | 'solar' | 'nuclear' | 'energy'
  // Metals & Materials
  | 'gold' | 'silver' | 'copper' | 'platinum' | 'lithium'
  // Crypto
  | 'crypto' | 'eth' | 'doge' | 'sol'
  // Tech & AI
  | 'tech' | 'ai' | 'semis' | 'cloud' | 'gaming'
  // Finance
  | 'finance' | 'banks' | 'insurance'
  // Consumer
  | 'food' | 'luxury' | 'media' | 'retail'
  // Industrial
  | 'transport' | 'logistics' | 'military' | 'space'
  // Real Estate & Health
  | 'realestate' | 'pharma' | 'biotech';

export type IndustryCategory = 'Energy' | 'Metals' | 'Crypto' | 'Tech' | 'Finance' | 'Consumer' | 'Industrial' | 'RealEstate';

export interface IndustryState {
  id: IndustryId;
  name: string;
  price: number;
  basePrice: number;
  trend: number; // -1..1
  history: number[];
}

export type Timeframe = '1m' | '5m' | '15m' | '1h';

export interface MarketEvent {
  id: string;
  label: string;
  icon: string;
  industryId: IndustryId;
  trendBoost: number;       // additive trend bias per second
  expiresAt: number;
}

export interface Quest {
  id: string;
  label: string;
  target: number;
  reward: string;
  rewardMoney: number;
  metric: 'owned' | 'totalEarned' | 'totalLevels' | 'managers' | 'portfolio' | 'employees' | 'upgrades' | 'dividends' | 'prestige' | 'industries';
}

export type UpgradeId =
  | 'speed1' | 'speed2' | 'speed3'
  | 'efficiency1' | 'efficiency2' | 'efficiency3'
  | 'automation1' | 'automation2'
  | 'worker1' | 'worker2'
  | 'market1' | 'market2';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  cost: number;
  category: 'speed' | 'efficiency' | 'automation' | 'worker';
  effect: { type: 'globalIncome' | 'globalSpeed' | 'businessIncome'; value: number; businessId?: BusinessId };
}

export type EmployeeRole = 'Manager' | 'Accountant' | 'Spy' | 'Engineer' | 'Negotiator' | 'Security';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  intelligence: number;
  loyalty: number;
  greed: number;
  productivity: number;
  salary: number;
  assignedTo?: BusinessId;
  hiredAt: number;
  level: number;          // training level
  trainingCost: number;   // cost for next training
}

export interface ClanState {
  name: string;
  rank: number;
  influence: number;
  members: number;
  vault: number;
}

export interface DailyReward {
  day: number;
  money: number;
  prestige?: number;
  title: string;
  icon: string;
}

export type WheelSegmentType = 'cash' | 'speed' | 'income' | 'upgrade' | 'employee' | 'mega_cash' | 'prestige_dust' | 'nothing';

export interface WheelSegment {
  type: WheelSegmentType;
  label: string;
  icon: string;
  color: string; // CSS color for segment
  chance: number; // weight 0-1
  value: number;  // cash amount, multiplier, or minutes
}

export interface StockHolding {
  shares: number;
  avgCost: number;
}

export interface ActiveBoost {
  id: string;
  type: 'speed' | 'income';
  multiplier: number;
  expiresAt: number; // timestamp
}

export type TxKind =
  | 'collect' | 'auto' | 'dividend'
  | 'business' | 'upgrade'
  | 'hire' | 'fire'
  | 'market_buy' | 'market_sell'
  | 'wheel' | 'daily' | 'quest' | 'prestige' | 'event';

export interface Transaction {
  id: string;
  ts: number;
  kind: TxKind;
  label: string;
  amount: number; // signed
}

export interface GameState {
  money: number;
  totalEarned: number;
  multiplier: number;
  businesses: Record<BusinessId, BusinessState>;
  upgrades: Record<UpgradeId, boolean>;
  employees: Employee[];
  industries: Record<IndustryId, IndustryState>;
  marketInfluence: number;
  clan: ClanState;
  lastTick: number;
  prestigePoints: number;
  lastClaimedDate: string;
  claimStreak: number;
  lastWheelSpin: number;
  activeBoosts: ActiveBoost[];
  holdings: Record<IndustryId, StockHolding>;
  totalInvested: number;
  totalRealized: number;
  totalDividends: number;
  events: MarketEvent[];
  questsClaimed: Record<string, boolean>;
  transactions: Transaction[];
  lastDividendLogTs: number;
}
