// Core game types
export type BusinessId = 'lemonade' | 'grocery' | 'coffee' | 'delivery' | 'logistics' | 'tech';

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

export type IndustryId = 'food' | 'tech' | 'energy' | 'transport' | 'media' | 'military';

export interface IndustryState {
  id: IndustryId;
  name: string;
  price: number;
  trend: number; // -1..1
  history: number[];
}

export type UpgradeId =
  | 'speed1' | 'speed2'
  | 'efficiency1' | 'efficiency2'
  | 'automation1'
  | 'worker1';

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
}

export interface ClanState {
  name: string;
  rank: number;
  influence: number;
  members: number;
  vault: number;
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
}
