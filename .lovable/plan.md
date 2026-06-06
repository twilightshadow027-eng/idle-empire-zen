# Implementation Plan

I'll ship this in 4 focused passes so the preview stays stable between steps.

## Pass 1 — Staff role swap + influence rebalance
- Replace `Negotiator` role with `Influencer`; replace `Security` with `Coordinator` in `src/game/types.ts`, `config.ts`, `engine.ts`, `EmployeesPanel.tsx`.
- Migration: on load, map any existing `Negotiator`→`Influencer`, `Security`→`Coordinator`.
- Influencer: boosts envoy reward + passive influence (replaces old Negotiator math).
- Coordinator: reduces envoy mission duration (% shown in card; scales with level + productivity).
- Cut passive influence generation ~50% and envoy reward formula ~40%.

## Pass 2 — Group Envoy missions
- New `Envoy.members: string[]` (up to 4 employee IDs). Keep `employeeId` for back-compat / legacy resolution.
- Duration multiplier by party size: 1→1.0, 2→0.85, 3→0.75, 4→0.65, further reduced by best Coordinator on the team.
- Reward = sum of per-member skill contributions × influencer bonus.
- `ClanPanel` EnvoysSection rewritten: multi-select staff (max 4), preview lists chosen envoys, combined reward + adjusted duration shown before dispatch. Progress bar on active group missions.

## Pass 3 — Prestige scaling + Ledger wheel removal
- `prestige()` cost = `5_000_000 * 1.5^prestigesDone`. Track `prestigesDone` in state (derive from existing `prestigePoints` increments — add explicit counter). Display next requirement in `ClanPanel`/prestige UI.
- Remove `SpinWheelPanel` from `TransactionsPanel`/Ledger and any wheel buttons. Delete wheel UI usage but keep `spinWheel` engine fn untouched to avoid breaking saves.

## Pass 4 — Market open-positions QoL + more businesses
- `PortfolioSummary` dialog rows: name, qty, avg, price, P/L, View (jumps to chart for that symbol, preserves timeframe via `uiStore`), Sell (opens existing sell flow / quick-confirm with partial+max).
- Expand `BUSINESSES` in `config.ts` to the 5-tier list (~23 entries) with scaled `baseCost`/`baseIncome`/`unlockAt`. Add new `BusinessId`s to `types.ts`. Reuse existing visual tiers in `OfficeBuilding`.

## Technical notes
- All state additions are backfilled in `parseGameState` so existing saves load.
- No new tables / backend; pure client state.
- Will run typecheck via the harness after each pass.

Reply **approve** to start with Pass 1, or tell me to reorder/skip any pass.