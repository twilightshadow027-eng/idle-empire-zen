import { create } from 'zustand';
import { BusinessId, GameState, IndustryId } from './types';
import { buyOrUpgrade, buyStock, buyUpgrade, calculateOfflineEarnings, collectBusiness, claimDailyReward, claimQuest, createInitialState, loadState, saveState, sellStock, tick, spinWheel, withTx } from './engine';
import { EMPLOYEE_NAMES } from './config';

interface FloatingNumber { id: number; amount: number; x: number; y: number; }

interface Store {
  state: GameState;
  floatings: FloatingNumber[];
  offlineEarned: number;
  init: () => void;
  doTick: (dtSec: number) => void;
  collect: (id: BusinessId, x?: number, y?: number) => void;
  buy: (id: BusinessId) => void;
  buyUpgradeAction: (id: string) => void;
  hireEmployee: (role: import('./types').EmployeeRole) => void;
  trainEmployee: (id: string) => void;
  fireEmployee: (id: string) => void;
  assignManager: (employeeId: string, businessId: BusinessId) => void;
  prestige: () => void;
  claimDailyReward: () => void;
  spinWheelAction: (forced?: import('./types').WheelSegment) => void;
  buyStockAction: (id: IndustryId, shares: number) => void;
  sellStockAction: (id: IndustryId, shares: number) => void;
  claimQuestAction: (questId: string) => void;
  clearOffline: () => void;
  reset: () => void;
}

let floatingId = 0;

export const useGame = create<Store>((set, get) => ({
  state: loadState(),
  floatings: [],
  offlineEarned: 0,

  init: () => {
    const s = loadState();
    const offline = calculateOfflineEarnings(s, Date.now());
    const next = { ...s, money: s.money + offline, totalEarned: s.totalEarned + offline, lastTick: Date.now() };
    saveState(next);
    set({ state: next, offlineEarned: offline });
  },

  doTick: (dtSec) => {
    const { state } = get();
    const { state: next, earned } = tick(state, dtSec);
    next.lastTick = Date.now();
    // Auto-saves every tick are cheap-ish; throttle below
    set({ state: next });
    if (earned.length) {
      // spawn floaters at random positions (managers auto-collect)
      const floats = earned.map((e) => ({
        id: ++floatingId,
        amount: e.amount,
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 30,
      }));
      const current = get().floatings;
      set({ floatings: [...current.slice(-40), ...floats] });
      setTimeout(() => {
        const cur = get().floatings;
        const ids = new Set(floats.map((f) => f.id));
        set({ floatings: cur.filter((f) => !ids.has(f.id)) });
      }, 1400);
    }
  },

  collect: (id, x = 50, y = 50) => {
    const { state } = get();
    const { state: next, amount } = collectBusiness(state, id);
    if (amount > 0) {
      const f: FloatingNumber = { id: ++floatingId, amount, x, y };
      set({ state: next, floatings: [...get().floatings, f] });
      setTimeout(() => set({ floatings: get().floatings.filter((x) => x.id !== f.id) }), 1400);
    }
  },

  buy: (id) => set({ state: buyOrUpgrade(get().state, id) }),
  buyUpgradeAction: (id) => set({ state: buyUpgrade(get().state, id) }),

  hireEmployee: (role) => {
    const s = get().state;
    const base = role === 'Manager' ? 5000 : role === 'Engineer' ? 8000 : role === 'Spy' ? 12000 : 3000;
    if (s.money < base) return;
    const name = EMPLOYEE_NAMES[Math.floor(Math.random() * EMPLOYEE_NAMES.length)];
    const emp = {
      id: crypto.randomUUID(),
      name,
      role,
      intelligence: 30 + Math.floor(Math.random() * 70),
      loyalty: 30 + Math.floor(Math.random() * 70),
      greed: 10 + Math.floor(Math.random() * 80),
      productivity: 30 + Math.floor(Math.random() * 70),
      salary: base,
      hiredAt: Date.now(),
      level: 1,
      trainingCost: Math.round(base * 0.4),
    };
    const next: GameState = { ...s, money: s.money - base, employees: [...s.employees, emp] };
    set({ state: withTx(next, 'hire', `Hired ${role}: ${name}`, -base) });
  },

  trainEmployee: (id: string) => {
    const s = get().state;
    const emp = s.employees.find((e) => e.id === id);
    if (!emp || s.money < emp.trainingCost) return;
    const productivityGain = 8 + Math.floor(Math.random() * 6);
    const newProductivity = Math.min(100, emp.productivity + productivityGain);
    const newLevel = emp.level + 1;
    const newTrainingCost = Math.round(emp.trainingCost * 1.7);
    const employees = s.employees.map((e) =>
      e.id === id ? { ...e, productivity: newProductivity, level: newLevel, trainingCost: newTrainingCost } : e
    );
    const next: GameState = { ...s, money: s.money - emp.trainingCost, employees };
    set({ state: withTx(next, 'hire', `Trained ${emp.name} → Lv${newLevel}`, -emp.trainingCost) });
  },

  fireEmployee: (id) => {
    const s = get().state;
    const emp = s.employees.find((e) => e.id === id);
    if (!emp) return;
    let businesses = s.businesses;
    if (emp.assignedTo) {
      businesses = { ...businesses, [emp.assignedTo]: { ...businesses[emp.assignedTo], hasManager: false } };
    }
    const next: GameState = { ...s, employees: s.employees.filter((e) => e.id !== id), businesses };
    set({ state: withTx(next, 'fire', `Fired ${emp.role}: ${emp.name}`, 0) });
  },

  assignManager: (employeeId, businessId) => {
    const s = get().state;
    const emp = s.employees.find((e) => e.id === employeeId);
    if (!emp || emp.role !== 'Manager') return;
    const prevBiz = emp.assignedTo;
    // Clear another manager already on target, plus this manager's previous business.
    const employees = s.employees.map((e) => {
      if (e.id === employeeId) return { ...e, assignedTo: businessId };
      if (e.assignedTo === businessId && e.role === 'Manager') return { ...e, assignedTo: undefined };
      return e;
    });
    const businesses = {
      ...s.businesses,
      [businessId]: { ...s.businesses[businessId], hasManager: true },
      ...(prevBiz && prevBiz !== businessId
        ? { [prevBiz]: { ...s.businesses[prevBiz], hasManager: false } }
        : {}),
    };
    set({ state: { ...s, employees, businesses } });
  },

  prestige: () => {
    const s = get().state;
    if (s.totalEarned < 1_000_000) return;
    const pts = Math.floor(Math.sqrt(s.totalEarned / 1_000_000));
    const fresh = createInitialState();
    const reset: GameState = {
      ...fresh,
      money: 100,
      prestigePoints: s.prestigePoints + pts,
      clan: s.clan,
      lastClaimedDate: s.lastClaimedDate,
      claimStreak: s.claimStreak,
      lastWheelSpin: s.lastWheelSpin,
      lastTick: Date.now(),
      transactions: s.transactions, // keep ledger history through prestige
    };
    set({ state: withTx(reset, 'prestige', `Prestige reset — +${pts} prestige`, 0) });
  },

  claimDailyReward: () => set({ state: claimDailyReward(get().state) }),
  spinWheelAction: (forced) => set({ state: spinWheel(get().state, EMPLOYEE_NAMES, forced as any) }),
  buyStockAction: (id, shares) => set({ state: buyStock(get().state, id, shares) }),
  sellStockAction: (id, shares) => set({ state: sellStock(get().state, id, shares) }),
  claimQuestAction: (questId) => set({ state: claimQuest(get().state, questId) }),

  clearOffline: () => set({ offlineEarned: 0 }),
  reset: () => {
    localStorage.removeItem('idle-empire-save-v1');
    location.reload();
  },
}));

// Auto-save loop
let lastSave = 0;
setInterval(() => {
  const now = Date.now();
  if (now - lastSave > 4000) {
    saveState(useGame.getState().state);
    lastSave = now;
  }
}, 1000);

window.addEventListener('beforeunload', () => saveState(useGame.getState().state));
