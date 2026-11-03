# Money Decision Engine — low-fidelity prototype

> Don't just track your money. Understand what to do with it.

An interactive, low-fidelity mobile prototype of a personal financial intelligence app (India-first), shown inside an iPhone-style device frame. It covers authentication, adaptive onboarding, the financial overview, decisions, scenarios, goals, profile and system states. All of it runs locally with deterministic calculations.

**Visual design:** original modern fintech system — bone canvas, ink tiles and a single electric-lime accent (cobalt marks assumptions, coral marks risk), Bricolage Grotesque numerals with Geist text, bento layout and a floating tab bar with a raised Decide button. Data viz is custom SVG: income-flow and liquidity ribbons, a month-cell emergency runway, area charts with a shaded shortfall zone and event markers, dot-plot comparisons, diverging cash-flow bars and a goal path-to-target chart (`src/components/charts`). Abstract node-and-contour assets live in `src/components/illustrations`. Tokens are at the top of `src/styles/global.css`.

---

## Run it

Requirements: Node 18+ (a portable Node 22 is bundled in `.tools/` for this machine).

```bash
./run.sh            # installs dependencies on first run, then starts Vite
```

Open the URL Vite prints (default http://localhost:5173). Other scripts:

```bash
./run.sh test       # unit tests for the calculation engine (Vitest)
./run.sh build      # type-check + production build into dist/
```

With your own Node: `npm install`, `npm run dev`, `npm test`, `npm run build`.

---

## Navigating the prototype

- **Inside the device:** a five-tab bottom navigation (Home, Decide, Simulate, Goals and Profile), plus contextual links, sheets and dialogs.
- **Prototype navigator** (left of the phone, development only; it is not part of the app):
  - **Demo profiles.** One click signs in with realistic data:
    - *Ananya*: salaried, ₹85k salary + ₹5k side income, vehicle loan. Use for the **car** journey.
    - *Rahul*: household with two incomes, a home loan and a car loan. Use for the **prepay vs invest** journey.
    - *Arjun*: freelancer with income of ₹45k–₹1.6 lakh a month. Use for the **safe spending** journey.
    - *New user (empty)*: resets everything and starts at sign-up.
  - **Simulate conditions:** offline mode, failing account connection, expired session.
  - **Screens:** jumps to every screen ID in the spec (AUTH-01 … SYS-10). Screens that need an ID use the current profile's first goal, decision or scenario.
- **Mock credentials:** sign-up accepts any valid details. The OTP is `123456`.

### Flagship journeys

1. **Can I afford a ₹12 lakh car?** Load Ananya, then go to Decide → template "Can I afford a car?" → Explore. Answer the clarifying questions, review the context, then open the workspace. From there you can compare options A–E, read the explanation, save the decision, convert an option to a goal, or open it in the simulator.
2. **Prepay home loan vs SIPs.** Load Rahul and use the prepay template. Only the additional monthly amount and the return assumption are asked, because the loan details come from the profile. Contractual interest savings are shown separately from investment projections, which come with a 6–12% range.
3. **Safe spending with variable income.** Load Arjun and use the safe-spending template. The result is a range, not a single number. Four scenarios are shown (average, low, high and unexpected expense), and a slider shows the impact of discretionary spending.

---

## Architecture

```
src/
  App.tsx                 routes, session guard, device stage
  components/
    device/               iPhone frame, status bar, scaling
    navigation/           bottom nav, prototype navigator (dev only)
    layout/               Screen template (header, scroll body, sticky footer)
    cards/ forms/ charts/ reusable UI (lists, KV rows, fields, sliders, SVG charts)
    feedback/             toasts, bottom sheets, confirm dialogs, empty/loading states
    bottom-sheets/        quick-add menu
  pages/                  auth, onboarding, home, decide, simulate, goals, profile, shared (search, notifications, system states)
  features/               cross-cutting logic: decision helpers, goal impact
  calculations/
    financial/            overview.ts, loans.ts, goals.ts (+ unit tests)
    projections/          scenario.ts (month-by-month engine), templates.ts
    validation/           completeness / missing-information detection
    insights.ts           rule-based insights, each with "why"
  intelligence/           simulated AI layer (see below)
  data/                   initial state + demo profiles
  hooks/                  useApp (store + persistence), useFinance (derived metrics)
  types/                  shared domain types
  utils/                  INR formatting, validation, ids
```

**State.** A single store (`hooks/useAppState.tsx`) is persisted to `localStorage` under the key `mde-prototype-state-v1`. All screens read derived numbers from `useFinance()`, so editing any record updates Home, insights, decisions, scenarios and goals together.

## Main data models (`src/types`)

| Model | Key fields |
|---|---|
| `IncomeSource` | amount, frequency, min/max for variable income, isAdditional, source |
| `Expense` | category, amount, frequency, essential/discretionary, source |
| `Asset` | category, value, liquidity (`liquid` / `market` / `locked`), emergencyEligible |
| `Liability` | outstanding, rate, EMI, remaining months |
| `Commitment` | amount, next due date, recurrence, status, `linkedTo` (prevents double counting) |
| `Goal` | target, starting amount, contributions, target date, priority, planned contribution |
| `Decision` | intent, question, inputs (answers + assumptions), chosen option, saved, status |
| `Scenario` | template, variables (`ScenarioVars`), saved |
| `Activity`, `AppNotification`, `Connection` | history, inbox, illustrative connections |

Every record carries a `source`: `connected`, `manual`, `estimated` or `calculated`. **`null` always means unknown, never zero.**

## Calculation functions

`calculations/financial/overview.ts`:
- `calculateTotalAssets`, `calculateTotalLiabilities`, `calculateNetWorth`
- `calculateMonthlyIncome`, `calculateIncomeRange`, `calculateMonthlyExpenses`, `calculateEssentialExpenses`
- `calculateMonthlyEmi` (derives the EMI from loan terms when it is unknown and flags it as estimated)
- `calculateMonthlySurplus`: income − expenses − EMIs − commitments not linked to an expense or loan. SIPs are treated as investing.
- `calculateLiquidFunds` (liquid assets only), `calculateEmergencyReserves`, `calculateEmergencyCoverage`
- `calculateFixedObligations`, `calculateFixedCommitmentRatio`

`calculations/financial/loans.ts`: `calculateEmi` (P·r·(1+r)^n / ((1+r)^n − 1)), `loanSummary`, `calculateTotalInterest`, `calculateRemainingBalance`, `inferRemainingMonths`, `amortize` (with prepayment), `futureValueOfMonthly`.

`calculations/financial/goals.ts`: `calculateGoalProgress`, `calculateGoalContribution`, `monthsToReach`, `allocateToGoals` (by priority), `compareGoalAllocations`.

`calculations/projections/scenario.ts`: `projectScenario` produces month-by-month cash flow and liquidity. It handles existing-loan amortisation, a new purchase loan, investments at an assumed return, goal savings (which fund a planned purchase first), and one-off costs. It returns a summary with surplus, minimum liquidity, end debt, coverage and stability.

Results report how many inputs were missing and whether any were estimated, so the UI can say "partial total" or "includes estimates" instead of hiding gaps. Unit tests live in `src/calculations/financial/financial.test.ts`.

## Simulated intelligence layer (`src/intelligence`)

The layer is split into replaceable stages:
1. **`intent.ts`**: keyword-rule intent recognition. It extracts only amounts the user typed (for example "₹12 lakh").
2. **`context.ts`**: retrieves context from the user's records and detects missing information.
3. **`questions.ts`**: conditional clarification questions. It skips anything the profile already answers, and labels assumptions.
4. **`analyses/car.ts`, `prepay.ts`, `safeSpend.ts`**: deterministic calculations, alternatives and explanations.
5. **`index.ts`**: the `analyzeDecision()` facade.

No external AI API is called, and the layer cannot invent financial values. To use a real model later, replace `recognizeIntent` and/or the explanation text while keeping the calculation modules.

## What is simulated / not connected

- **Authentication** is mock: there is no server, the OTP is `123456`, and passwords are only stored as a non-secure local hash.
- **Account connections** are illustrative. No Account Aggregator, bank or AMC is contacted, and no data is imported. Connected states are labelled "Illustrative".
- **No real transactions.** "Mark as decided", "Add contribution" and similar actions only record information.
- **Investment returns** are user-editable assumptions and are never guaranteed.
- **Demo data** is illustrative. The salaried and household profiles include a few months of seeded history so trend insights can be shown. New users get no trend insights until real history exists.
- **Not regulated advice.** The app explains trade-offs. It does not recommend financial products.
