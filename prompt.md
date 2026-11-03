# MASTER BUILD PROMPT: MONEY DECISION ENGINE

## Complete Low-Fidelity Mobile App Prototype

Act as a senior product designer, UX architect, and frontend engineer.

Build a complete, interactive, low-fidelity prototype of a mobile
financial intelligence application called **Money Decision Engine**.

This is not a generic finance dashboard, expense tracker, banking
application, or chatbot. It is a personal financial intelligence
platform that helps people understand their financial position, explore
alternative financial futures, compare decisions, understand trade-offs,
and make informed financial choices.

Translate the product strategy, information architecture, screen
inventory, user journeys, and MVP requirements below into a fully
navigable mobile application prototype.

Prioritise structure, hierarchy, functionality, content, and
interaction. Do not jump into high-fidelity visual design. Branding,
typography, colour, iconography, animations, and detailed styling will
be addressed later.

------------------------------------------------------------------------

# 1. PRODUCT OVERVIEW

**Product name:** Money Decision Engine\
**Tagline:** Don't just track your money. Understand what to do with
it.\
**Category:** Personal Financial Intelligence Platform\
**Market:** India-first

## Target audience

Build one adaptable product for three segments, not three separate
applications:

1.  **Emerging professionals:** salaried people building savings and
    investments, making their first major financial decisions, and
    balancing spending, savings, and investments.
2.  **Financially responsible households:** people managing household
    finances, home and vehicle loans, investments, family
    responsibilities, and major purchases.
3.  **Independent earners:** freelancers, consultants, business owners,
    and people with variable or irregular income.

The product must adapt its inputs, insights, calculations, and workflows
to the user's financial profile.

## Product vision

Help people make better financial decisions by connecting financial
information, personal goals, and alternative scenarios.

Users should be able to ask: - Can I afford to buy a car worth ₹12
lakh? - Should I prepay my home loan or continue investing? - How much
can I safely spend every month? - Am I financially ready to purchase a
house? - What happens if my income decreases? - How will this purchase
affect my savings? - Can I achieve two financial goals simultaneously? -
How much emergency savings should I maintain? - What is the financial
impact of taking another loan?

This product must connect financial context to decisions, not simply
display financial information.

------------------------------------------------------------------------

# 2. BUILD REQUIREMENTS

Build a real interactive prototype, not static mockups.

Mandatory: 1. The application runs locally. 2. All primary navigation
works. 3. All major screens are accessible through navigation or
contextual actions. 4. Forms accept user input and validate it. 5.
Inputs update relevant financial data. 6. Financial overview values are
derived from underlying data wherever possible. 7. Scenario inputs
produce updated projections. 8. Users can compare alternative scenarios.
9. Users can save decisions and scenarios. 10. Users can edit financial
information. 11. Empty, loading, error, and incomplete-data states are
represented. 12. Use realistic Indian financial examples. 13. No
external banking integration is required. 14. No real financial
transactions are executed. 15. Do not create fake API integrations or
pretend to access real bank accounts. 16. Use local mock data and
deterministic calculations. 17. Persist relevant prototype state locally
so navigation does not reset the experience.

The result must feel like one connected application. Do not create a
landing-page website with unrelated sections.

------------------------------------------------------------------------

# 3. DEVICE MOCKUP AND PRESENTATION

The complete application must be presented inside an **iPhone 18 Pro Max
device mockup**.

This is a critical requirement. The mockup is a presentation frame
around the application, not the application itself. Keep the app
properly structured and responsive internally.

## Device presentation

-   Create a realistic iPhone 18 Pro Max outer device frame.
-   Display the application inside the device screen.
-   Include rounded device corners.
-   Include an appropriate top sensor / Dynamic Island area.
-   Include a status bar with time, signal, Wi-Fi, and battery
    indicators.
-   Include a bottom home indicator.
-   Keep the device frame visually separate from the application
    viewport.
-   Respect device safe areas.
-   Make the application scroll vertically inside the device.
-   Prevent content from overflowing beyond the device screen.
-   Centre the device in the browser.
-   On smaller desktop viewports, scale the device down without breaking
    its proportions.

Use a reference device viewport of approximately **440 CSS pixels wide
by 956 CSS pixels high**. Treat these as prototype dimensions, not
verified official hardware specifications.

## Browser presentation

The desktop browser should function as a prototype preview environment.
The iPhone should be the main focus. Do not build a desktop dashboard
around the phone.

Optionally provide subtle developer-only controls outside the device for
quickly accessing screens. These must not become part of the actual
application UI.

The user-facing application must retain the five-item mobile bottom
navigation.

------------------------------------------------------------------------

# 4. LOW-FIDELITY DESIGN DIRECTION

Use a neutral low-fidelity visual system.

## Visual characteristics

-   White or very light neutral background.
-   Light grey containers.
-   Black or dark grey text.
-   Neutral borders.
-   Minimal shadows.
-   Simple placeholder icons.
-   Basic typography.
-   Simple line charts.
-   Basic progress indicators.
-   Standard mobile form controls.
-   Simple cards.
-   Clear spacing and hierarchy.

Avoid: - Elaborate gradients. - Glassmorphism. - Complex
illustrations. - Decorative backgrounds. - Elaborate animations. - Heavy
shadows. - Highly stylised financial charts. - Excessive colours. -
Detailed branding. - High-fidelity visual polish.

## Design principles

1.  One primary objective per screen.
2.  Clear information hierarchy.
3.  Minimal cognitive load.
4.  Progressive disclosure.
5.  Clear next steps.
6.  Transparent financial assumptions.
7.  Easy editing of financial data.
8.  Consistent navigation.
9.  Accessible touch targets.
10. Clear feedback after every important action.

Use appropriate mobile patterns: bottom sheets, expandable cards, inline
editing, step-based forms, segmented controls, sliders, select menus,
confirmation dialogs, contextual actions, and sticky bottom CTAs where
useful.

------------------------------------------------------------------------

# 5. TECHNICAL IMPLEMENTATION

First inspect the existing repository and understand its structure.
Preserve useful existing work. If no project exists, initialise an
appropriate frontend application.

Preferred stack: - React. - TypeScript. - Vite. - Tailwind CSS or a
lightweight styling approach. - React Router or equivalent routing. -
Lucide icons or simple icon placeholders. - Reusable components. - Local
state management. - Local persistence using localStorage.

Do not introduce unnecessary libraries. Keep the architecture modular
and maintainable. Do not put the entire application into one large React
component.

Suggested structure:

``` text
src/
  components/
    device/
    navigation/
    cards/
    forms/
    charts/
    bottom-sheets/
    feedback/
    layout/
  pages/
    auth/
    onboarding/
    home/
    decide/
    simulate/
    goals/
    profile/
    shared/
  features/
    financial-profile/
    income/
    expenses/
    assets/
    liabilities/
    commitments/
    decisions/
    scenarios/
    goals/
  data/
    mock-data/
    initial-state/
  calculations/
    financial/
    projections/
    validation/
  hooks/
  types/
  utils/
  styles/
  App.tsx
  main.tsx
```

This structure is a recommendation. Adjust it if a better architecture
is needed.

Create shared TypeScript types for financial records, decisions, goals,
and scenarios. Separate calculation logic from UI components. Keep the
intelligence layer replaceable so a real AI service could be connected
later.

------------------------------------------------------------------------

# 6. PRODUCT INFORMATION ARCHITECTURE

Build five primary bottom navigation destinations.

## 1. Home

Purpose: Give users an understandable overview of their financial
position.

Contains: - Net worth. - Assets. - Liabilities. - Liquid funds. -
Monthly income. - Monthly expenses. - Estimated surplus. - Financial
insights. - Upcoming commitments. - Recent activity. - Quick actions.

## 2. Decide

Purpose: Help users evaluate important financial decisions.

Contains: - Ask a financial question. - Create a decision. - Decision
clarification. - Financial context review. - Decision workspace. -
Alternatives. - Trade-offs. - Explanation. - Saved decisions. - Decision
history.

## 3. Simulate

Purpose: Help users explore alternative financial futures.

Contains: - Scenario library. - Create scenario. - Configure
variables. - Scenario projections. - Scenario comparison. - Cash-flow
projections. - Liquidity projections. - Goal impact. - Assumptions and
methodology. - Saved scenarios.

## 4. Goals

Purpose: Help users define, monitor, and evaluate financial goals.

Contains: - Goal overview. - Create goal. - Goal configuration. - Goal
details. - Goal progress. - Contributions. - Goal impact analysis.

## 5. Profile

Purpose: Manage personal and financial information.

Contains: - Personal information. - Financial profile. - Income
sources. - Accounts. - Assets. - Liabilities. - Data connections. -
Privacy and consent. - Notifications. - Preferences. - Help and support.

Notifications, global search, quick add, add income, add expense, add
asset, add liability, add commitment, add goal, hide sensitive balances,
and help should be accessible contextually.

Do not create separate bottom navigation destinations for Opportunities
or Action Centre in the MVP. Show these contextually within Home and
Decide.

------------------------------------------------------------------------

# 7. COMPLETE SCREEN INVENTORY

These are product screens, not necessarily unique layouts. Reuse
components, layouts, and patterns wherever appropriate.

## A. Authentication

### AUTH-01: Welcome / Introduction

-   Product name and tagline.
-   Short product explanation.
-   Get started.
-   I already have an account.

### AUTH-02: Create account

Fields: - Full name. - Email address. - Mobile number. - Password.

Include input validation, password visibility toggle, terms and privacy
acknowledgement, and Continue.

### AUTH-03: Login

-   Email or mobile.
-   Password.
-   Forgot password.
-   Continue.
-   Create account.

### AUTH-04: OTP verification

-   OTP input.
-   Resend OTP.
-   Verification feedback. Use mock verification.

### AUTH-05: Account recovery

-   Email/mobile input.
-   Recovery confirmation.

------------------------------------------------------------------------

# 8. ONBOARDING EXPERIENCE

This is one of the most important parts of the MVP. Establish enough
financial context to make the overview useful, but do not make
onboarding feel like a lengthy banking form.

Use progressive, adaptive onboarding. Users can skip optional
information and complete their profile later.

## ONB-01: Product introduction

Headline: **"Your money has possibilities. Understand them."**

Supporting text: "Bring your financial life together, explore different
possibilities and make decisions with greater confidence."

CTA: Get started.\
Secondary action: I already have an account.

## ONB-02: Financial profile

Ask: "Which best describes your financial situation?"

Options: - Working professional. - Self-employed / Freelancer. -
Business owner. - Managing household finances. - Student / Early
career. - Other.

Allow multiple selections where appropriate. Use the selection to
influence subsequent questions.

## ONB-03: Income type

Ask: "How do you earn money?"

Options: - Fixed monthly salary. - Variable salary. - Freelance /
Project-based income. - Business income. - Multiple income sources. -
Other.

Conditional logic: - Salaried users: fixed monthly income fields. -
Freelancers: typical monthly income, lowest typical month, highest
typical month, payment frequency. - Business owners: average monthly
personal income and additional business income sources. - Multiple
income sources: allow multiple income entries.

## ONB-04: Income details

Capture: - Monthly take-home income. - Additional income. - Income
frequency. - Income source. - Currency: INR.

For variable income: - Average monthly income. - Minimum monthly
income. - Maximum monthly income.

Allow approximate values.

## ONB-05: Monthly expenses

Capture estimated monthly expenses by category: - Housing / Rent. - Food
and groceries. - Transportation. - Utilities. - Lifestyle. -
Healthcare. - Education. - Family responsibilities. - Insurance. -
Subscriptions. - Other.

Allow category amount, monthly frequency, custom categories, and
estimated vs exact values. Show total estimated monthly expenses.

## ONB-06: Savings and bank balances

Capture: - Savings account balance. - Current account balance. - Cash. -
Fixed deposits. - Other liquid funds.

Explain the difference between liquid funds and long-term investments.

## ONB-07: Investments and assets

Categories: - Mutual funds. - Stocks and ETFs. - Gold. - Property. -
Retirement savings. - Other investments.

Capture approximate current value. Clearly label user-entered estimates.
Do not assume investment returns.

## ONB-08: Loans and liabilities

Categories: - Home loan. - Vehicle loan. - Personal loan. - Education
loan. - Credit card outstanding. - Other liabilities.

Capture: - Outstanding amount. - Interest rate, if known. - Monthly
EMI. - Remaining tenure. - Loan type.

Allow users to skip unknown fields.

## ONB-09: Financial goals

Optional. Ask: "What are you working towards?"

Options: - Emergency fund. - Buying a car. - Buying a house. -
Marriage. - Education. - Travel. - Retirement. - Other.

Allow multiple goals.

## ONB-10: Connect financial accounts

Explain the option to connect supported financial accounts through a
consent-based integration, where available.

Options: - Connect accounts. - Continue manually.

This is a prototype only. Do not implement or claim a real Account
Aggregator connection. Show a clear consent explanation and an
illustrative connection state.

## ONB-11: Financial information review

Display: - Income. - Expenses. - Savings. - Investments. - Assets. -
Liabilities. - Missing information.

Allow editing each section and show a completeness indicator.

## ONB-12: Profile completion

Headline: **"Your financial picture is taking shape."**

Explain what the application has understood.

Primary CTA: Explore my finances.\
Secondary action: Complete more details later.

On completion, navigate to Home.

## Onboarding logic

-   Users can navigate backwards.
-   Users can skip optional steps.
-   Users can resume incomplete onboarding.
-   Values persist.
-   Conditional questions respond to income type.
-   Empty values must not be treated as zero unless explicitly entered
    as zero.
-   Estimated values must be labelled.
-   Users can edit everything later.
-   Minimum data is required only for the calculation being requested.
-   Incomplete profiles do not block access to Home.

------------------------------------------------------------------------

# 9. HOME: FINANCIAL OVERVIEW

Home is the main screen after onboarding. It should answer:

1.  Where do I stand financially?
2.  How much money is accessible?
3.  How much am I earning and spending?
4.  What commitments are coming up?
5.  What needs my attention?

## HOME-01: Home overview

### Section 1: Header

-   Personalised greeting.
-   Profile avatar.
-   Notifications.
-   Financial data freshness indicator.

Example: "Good morning" "Here's where your money stands."

### Section 2: Net worth

Display: - Total net worth. - Total assets. - Total liabilities. - View
details.

Calculation: Net worth = Total assets - Total liabilities.

Show historical change only if sufficient historical data exists. Do not
fabricate historical performance.

### Section 3: Financial capacity

Display: - Liquid funds. - Monthly income. - Monthly expenses. -
Estimated monthly surplus.

Example values may be used for initial demo data, but they must be
clearly illustrative prototype values.

### Section 4: Financial insights

Create contextual insights such as: - Your expenses have increased. -
Your monthly surplus is decreasing. - Your emergency reserves may be
insufficient. - Your upcoming EMI obligations are significant. - You
have incomplete financial information.

Every insight must explain why it is displayed. Do not show generic
AI-generated motivational messages.

### Section 5: Upcoming commitments

Display EMI payments, rent, insurance, credit card payments, and other
planned expenses. Allow users to view details and add commitments.

### Section 6: Recent activity

Display income added, expense added, asset updated, liability updated,
goal created, and decision saved.

### Section 7: Quick actions

-   Add income.
-   Add expense.
-   Add asset.
-   Add liability.
-   Create decision.
-   Create goal.

## HOME-02: Net worth details

-   Assets.
-   Liabilities.
-   Net worth.
-   Breakdown by category.
-   Data provenance.
-   Last updated.

## HOME-03: Income breakdown

-   Income sources.
-   Monthly income.
-   Additional income.
-   Income history if available.

## HOME-04: Expense breakdown

-   Expense categories.
-   Total expenditure.
-   Monthly comparison only if historical data exists.
-   Estimated vs recorded values.

## HOME-05: Assets overview

-   Savings.
-   Cash.
-   Fixed deposits.
-   Mutual funds.
-   Stocks.
-   Gold.
-   Property.
-   Other assets.

Include Add asset, Edit asset, and View details.

## HOME-06: Liabilities overview

-   Loans.
-   Credit card outstanding.
-   Outstanding balance.
-   EMI obligations.
-   Interest rates.
-   Remaining tenure.

## HOME-07: Liquidity details

-   Total liquid funds.
-   Emergency reserve.
-   Accessible funds.
-   Less accessible investments.
-   Estimated months of expense coverage.

Do not classify all investments as immediately accessible cash.

## HOME-08: Upcoming commitments

Display payment, amount, due date, recurrence, and status.

## HOME-09: Financial insight details

Show: - What was observed. - Why it matters. - Relevant financial
data. - Potential implications. - Suggested next action.

## HOME-10: Financial activity history

Display a chronological activity list.

## HOME-11: Add financial record

Support income, expense, asset, liability, and commitment.

## HOME-12: Edit financial record

Allow users to modify or delete their own records with confirmation.

------------------------------------------------------------------------

# 10. FINANCIAL DATA MANAGEMENT

Implement a connected data system with shared models for: - User
profile. - Income sources. - Expenses. - Assets. - Liabilities. -
Commitments. - Goals. - Decisions. - Scenarios. - Financial activity.

Every financial value must have a source classification: 1. Connected:
imported from an authorised source. 2. Manual: entered by the user. 3.
Estimated: based on user assumptions. 4. Calculated: derived from other
records.

Show the relevant source label wherever it helps users understand the
reliability of a number. Include last-updated information.

## Financial calculations

Implement deterministic calculation functions.

**Net worth** = Total assets - Total liabilities.

**Monthly surplus** = Normalised monthly income - Monthly expenditure -
applicable monthly commitments not already included in expenditure.

Avoid double-counting EMIs or expenses.

**Liquidity:** Only include assets classified as readily accessible.

**Fixed commitment ratio** = Fixed monthly obligations / Normalised
monthly income.

**Emergency fund coverage** = Eligible liquid emergency reserves /
Essential monthly expenditure.

If data is incomplete, show an estimate or explain why the calculation
cannot be completed. Do not silently treat missing information as zero.

------------------------------------------------------------------------

# 11. DECIDE: FINANCIAL DECISION EXPERIENCE

Users should be able to express a financial question in natural language
and convert it into a structured decision workflow.

The AI interface must not become a generic chat application.

Combine: - Natural-language input. - Structured clarification. - Context
review. - Decision alternatives. - Financial calculations. - Scenario
comparisons. - Explainable results.

For the prototype, use deterministic mock reasoning and predefined
scenario logic. Do not require a real LLM API.

## DEC-01: Decision landing

Show: - Ask a financial question. - Start a new decision. - Suggested
decision templates. - Recent decisions. - Saved decisions.

Example templates: - Can I afford a car? - Should I prepay my loan? -
Can I increase my monthly investment? - How much can I safely spend?

## DEC-02: Ask a question

Provide a large input area.

Placeholder: "What financial decision are you thinking about?"

Allow example prompts.

CTA: Explore this decision.

## DEC-03: Decision clarification

Identify missing information and ask relevant questions.

Example: User: "Can I afford to buy a car worth ₹12 lakh?"

Follow-up questions: - What is your expected down payment? - Will you
take a loan? - What loan tenure are you considering? - Do you have a
preferred monthly EMI? - When are you planning to purchase?

Questions must be conditional. Do not ask for information already
available in the user's profile. Allow users to edit assumptions.

## DEC-04: Financial context review

Display relevant information retrieved from the financial profile.

For a car purchase: - Monthly income. - Monthly expenses. - Liquid
funds. - Existing EMIs. - Current liabilities. - Existing financial
goals.

Show missing information. Allow users to correct values before
continuing.

## DEC-05: Decision workspace

Display: - Decision title. - Decision objective. - Financial context. -
Primary assumptions. - Relevant financial metrics. - Available
alternatives.

## DEC-06: Decision alternatives

For the car purchase example:

**Option A:** Buy now, ₹12 lakh vehicle, selected down payment,
remaining amount financed.

**Option B:** Wait 12 months and save for a larger down payment.

**Option C:** Purchase a lower-priced vehicle.

**Option D:** Purchase without financing, if financially feasible.

Show how each alternative changes monthly cash flow, liquid reserves,
EMI obligations, emergency fund coverage, and existing goals.

## DEC-07: Decision explanation

Show: - Summary of findings. - Comparison of alternatives. -
Advantages. - Disadvantages. - Financial trade-offs. - Assumptions. -
Risks. - What could change the outcome.

Do not present one option as universally correct. Explain the reasoning
behind conclusions.

## DEC-08: Saved decisions

List saved decisions.

## DEC-09: Decision history

Display completed and ongoing decisions chronologically.

## DEC-10: Decision details

Reopen a saved decision, review assumptions, and modify scenarios.

## Decision workflow requirements

-   Save decisions.
-   Resume decisions.
-   Edit assumptions.
-   Compare alternatives.
-   View calculation details.
-   Review missing information.
-   See relevant financial context.
-   Convert a chosen decision into a goal or action where appropriate.

Do not automatically execute financial decisions.

------------------------------------------------------------------------

# 12. SIMULATE: SCENARIO SIMULATOR

Users should be able to explore how changes in financial variables
affect their future financial position.

## SIM-01: Scenario landing

Display: - Create scenario. - Suggested scenarios. - Saved scenarios. -
Recent simulations.

Suggested scenarios: - Buying a car. - Increasing investments. -
Prepaying a loan. - Income reduction. - Increasing monthly expenses. -
Saving for a major purchase.

## SIM-02: Create scenario

Allow users to choose a scenario template or create a custom scenario.

## SIM-03: Configure variables

Interactive inputs: - Income. - Expenses. - Down payment. - EMI. -
Interest rate. - Loan tenure. - Monthly investment. - Monthly savings. -
Purchase amount. - Time horizon.

Use numeric input, sliders, selectors, and frequency controls. Every
input must be editable.

## SIM-04: Scenario projection

Display: - Monthly cash-flow projection. - Estimated remaining
liquidity. - Monthly obligations. - Savings trajectory. - Relevant
financial goal impact.

## SIM-05: Scenario comparison

Allow up to three scenarios to be compared simultaneously.

Compare: - Monthly surplus. - Liquid funds. - Outstanding debt. - EMI
obligations. - Emergency reserve coverage. - Goal progress. - Cash-flow
stability.

Make trade-offs easy to identify.

## SIM-06: Cash-flow projection

Display a simplified month-by-month projection.

## SIM-07: Liquidity projection

Display: - Opening liquid balance. - Monthly inflows. - Monthly
outflows. - Closing liquid balance. - Minimum projected liquidity.

## SIM-08: Goal impact

Explain how the scenario affects existing financial goals.

## SIM-09: Assumptions and methodology

Display inputs used, calculation methodology, assumptions, excluded
variables, and data limitations.

## SIM-10: Save scenario

Allow users to save and revisit a scenario.

## Simulation requirements

-   Calculations must be deterministic.
-   Do not use invented investment returns as guaranteed outcomes.
-   Any projected investment return must be clearly marked as an
    assumption.
-   Display estimates and relevant limitations.
-   Use simplified but mathematically consistent financial models.

------------------------------------------------------------------------

# 13. GOALS: FINANCIAL GOAL INTELLIGENCE

## GOAL-01: Goal overview

Display active goals, target amounts, current progress, target dates,
and required monthly contribution.

Suggested goals: - Emergency fund. - Car. - House. - Marriage. -
Education. - Travel. - Retirement.

## GOAL-02: Create goal

Fields: - Goal name. - Target amount. - Current amount saved. - Target
date. - Goal priority.

## GOAL-03: Goal configuration

Allow: - Monthly contribution. - Current savings. - Target amount. -
Time horizon. - Priority.

## GOAL-04: Goal details

Display target amount, current savings, remaining amount, target date,
and monthly contribution requirement.

## GOAL-05: Goal progress

Display progress percentage, contributions, progress history where
available, and remaining amount.

## GOAL-06: Goal impact analysis

Explain how a decision or scenario changes goal progress.

Example: "If you purchase the car now, your monthly contribution towards
your house goal may need to decrease."

Show the numbers and assumptions behind this observation.

------------------------------------------------------------------------

# 14. PROFILE AND SETTINGS

## PROF-01: Profile overview

Display personal information and financial profile summary.

## PROF-02: Personal information

Allow editing of name, email, mobile, and other basic profile details.

## PROF-03: Financial profile

Display employment type, income type, financial preferences, and
household financial context.

## PROF-04: Income sources

Add, edit, and remove income sources.

## PROF-05: Financial accounts

Display manually entered accounts and illustrative connected account
states.

## PROF-06: Connected account details

Show connection status, source, last synchronisation, permissions, and
disconnect action.

## PROF-07: Privacy and consent

Explain what financial data is stored, how it is used, what information
is shared, and how permissions can be withdrawn.

## PROF-08: Notifications

Notification preferences and notification history.

## PROF-09: Preferences

Include currency, notification preferences, display preferences, and
privacy options. Currency defaults to INR.

## PROF-10: Help and support

Show help topics and support contact placeholders.

------------------------------------------------------------------------

# 15. GLOBAL SYSTEM SCREENS AND STATES

Build reusable system states.

### SYS-01: Global search

Search financial records, goals, decisions, and scenarios.

### SYS-02: Notifications

Display relevant reminders and product notifications.

### SYS-03: Quick-add menu

Options: Income, Expense, Asset, Liability, Commitment, Goal.

### SYS-04: Data connection error

Show connection failure and recovery options.

### SYS-05: No financial data

Explain how to add financial information.

### SYS-06: Incomplete financial profile

Identify missing information and explain which features may be affected.

### SYS-07: Calculation in progress

Display a loading state for longer calculations.

### SYS-08: Offline state

Explain which features are unavailable and preserve entered information.

### SYS-09: Permission denied

Explain the required permission and provide a way to retry.

### SYS-10: Session expired

Provide a login recovery flow.

Also support empty states, error states, success states, confirmation
dialogs, delete confirmations, unsaved changes, invalid inputs, missing
data, stale data, and calculation limitations.

------------------------------------------------------------------------

# 16. MVP FLAGSHIP USE CASES

The prototype must demonstrate three complete, end-to-end financial
decision journeys. These are mandatory acceptance journeys and must work
through the actual product screens.

## USE CASE 01: CAN I AFFORD TO BUY A CAR WORTH ₹12 LAKH?

This is the primary demonstration journey.

Starting question: "Can I afford to buy a car worth ₹12 lakh?"

The application must: 1. Understand the user's question. 2. Identify the
purchase amount. 3. Retrieve relevant financial context. 4. Ask for
missing information. 5. Confirm down payment. 6. Confirm expected loan
tenure. 7. Confirm interest rate assumption. 8. Calculate estimated EMI.
9. Evaluate monthly cash flow. 10. Evaluate liquid reserves after down
payment. 11. Evaluate emergency fund coverage. 12. Evaluate existing
financial commitments. 13. Compare three or four alternatives. 14.
Explain the trade-offs. 15. Allow the user to save the decision. 16.
Allow the user to convert the chosen direction into a financial goal or
action.

### Required calculations

EMI:

`EMI = P × r × (1+r)^n / ((1+r)^n - 1)`

Where: - P = Loan principal. - r = Monthly interest rate. - n = Number
of monthly instalments.

Calculate: - Down payment. - Loan amount. - Estimated EMI. - Total
repayment. - Total interest. - Monthly surplus after EMI. - Remaining
liquid funds. - Emergency fund coverage.

### Alternatives

A. Buy now with a smaller down payment.\
B. Buy now with a larger down payment.\
C. Wait 12 months and save more.\
D. Choose a lower-priced car.

Make all scenario values editable. Explain implications, not just a
ranking.

## USE CASE 02: SHOULD I PREPAY MY HOME LOAN OR CONTINUE INVESTING?

Starting question: "Should I prepay my home loan or continue investing
through SIPs?"

Collect: - Outstanding loan amount. - Loan interest rate. - Remaining
tenure. - Current EMI. - Current SIP contribution. - Expected investment
return assumption. - Available additional monthly funds. - Existing
liquid reserves.

Compare:

A. Continue existing SIP and loan repayment.\
B. Increase loan prepayment.\
C. Split additional funds between prepayment and investing.\
D. Build additional liquidity before making either choice.

Show: - Interest cost under each repayment approach. - Potential change
in loan tenure. - Potential interest saved. - Projected investment value
under explicit assumptions. - Liquidity impact. - Risk and
uncertainty. - Goal impact.

Important: Investment returns are assumptions, not guarantees. Do not
present the comparison as a guaranteed investment-versus-loan outcome.
Clearly distinguish contractual loan interest savings from uncertain
investment projections.

## USE CASE 03: HOW MUCH CAN I SAFELY SPEND WITH VARIABLE INCOME?

Starting question: "My income changes every month. How much can I safely
spend?"

Collect: - Average monthly income. - Lowest typical monthly income. -
Highest typical monthly income. - Essential monthly expenses. - Variable
monthly expenses. - Existing EMIs. - Emergency reserves. - Upcoming
commitments.

Compare: - Average-income scenario. - Low-income scenario. - High-income
scenario. - Unexpected expense scenario.

Show: - Safe spending estimate. - Essential commitments. - Available
liquidity. - Emergency reserve coverage. - Monthly cash-flow
projections. - Suggested reserve target. - Impact of discretionary
spending.

Do not calculate a single confident spending recommendation when data is
insufficient. Explain assumptions and limitations.

------------------------------------------------------------------------

# 17. DATA MODEL AND MOCK DATA

Create a realistic initial demo profile. Populate enough financial
information to demonstrate all three use cases.

Use Indian financial examples and INR formatting.

Example profile: - Monthly take-home income: ₹85,000. - Additional
income: ₹5,000. - Essential monthly expenses: ₹28,000. - Discretionary
monthly expenses: ₹15,000. - Existing EMI: ₹12,000. - Savings account:
₹2,50,000. - Fixed deposits: ₹1,00,000. - Mutual funds: ₹3,50,000. -
Stocks: ₹75,000. - Gold: ₹1,00,000. - Vehicle loan outstanding:
₹2,50,000.

These are illustrative demo values only.

Use the data model to derive displayed numbers. Do not hardcode separate
inconsistent values into different screens.

Make it possible to edit the profile and see the rest of the application
update.

Include a second demo profile or profile-switching development option
for a variable-income user so the freelancer/business-owner journey can
be demonstrated.

------------------------------------------------------------------------

# 18. FINANCIAL CALCULATION ENGINE

Create a dedicated calculation layer. Do not place financial
calculations directly inside React components.

Implement functions for: - Calculate net worth. - Calculate total
assets. - Calculate total liabilities. - Calculate monthly income. -
Calculate monthly expenses. - Calculate monthly surplus. - Calculate
EMI. - Calculate total loan interest. - Calculate remaining loan
balance. - Estimate emergency fund coverage. - Calculate fixed
commitment ratio. - Project monthly cash flow. - Project liquid
balance. - Compare scenarios. - Calculate goal contribution
requirements. - Calculate goal progress.

Use consistent date, currency, and rounding logic.

Format currency using the Indian numbering system: - ₹85,000 - ₹1.25
lakh - ₹12.5 lakh

Use full INR values where precise calculations matter.

Add validation and unit tests for the most important financial
calculation functions.

Avoid double-counting internal transfers, EMI expenses, or other
commitments.

------------------------------------------------------------------------

# 19. AI AND INTELLIGENCE LAYER

For this low-fidelity prototype, do not connect to an external AI API.
Build a simulated intelligence layer.

Separate: 1. Intent recognition. 2. Financial context retrieval. 3.
Missing-information detection. 4. Deterministic calculations. 5.
Scenario comparison. 6. Explanation generation.

Create predefined logic for the three flagship use cases.

The UI should make it appear that the application understands the user's
question, but all values and outputs must come from structured data and
deterministic calculations.

Do not allow simulated AI to invent financial values.

Keep the intelligence layer replaceable so a real AI service can be
connected later.

------------------------------------------------------------------------

# 20. UX INTERACTION REQUIREMENTS

The prototype must be interactive throughout.

## Navigation

-   Bottom navigation works.
-   Back navigation works.
-   Contextual links work.
-   Screen transitions preserve state.
-   Selected tab is visibly identifiable.

## Forms

-   Inputs are editable.
-   Currency fields accept numeric input.
-   Required fields validate.
-   Optional fields can be skipped.
-   Error messages are visible.
-   Values persist when navigating back.

## Financial records

-   Add records.
-   Edit records.
-   Delete records with confirmation.
-   Update calculated values after changes.

## Decisions

-   Create a decision.
-   Answer clarification questions.
-   Review financial context.
-   Edit assumptions.
-   Compare alternatives.
-   Save decisions.
-   Reopen saved decisions.

## Scenarios

-   Create a scenario.
-   Modify variables.
-   Update calculations.
-   Compare alternatives.
-   Save scenarios.
-   Reopen saved scenarios.

## Goals

-   Create goals.
-   Edit goals.
-   Update contributions.
-   Track progress.
-   View impact from scenarios.

## Feedback

Provide appropriate feedback for successful actions, invalid inputs,
calculation errors, missing information, unsaved changes, deleted
records, and empty states.

Every visible CTA must do something meaningful. Do not create decorative
buttons with no interaction.

------------------------------------------------------------------------

# 21. PRODUCT AND TRUST CONSTRAINTS

This is a financial product. Treat accuracy and user trust as essential.

1.  Do not claim to provide regulated investment advice.
2.  Do not execute financial transactions.
3.  Do not fabricate connected account information.
4.  Do not guarantee investment returns.
5.  Do not treat estimates as confirmed financial data.
6.  Do not hide assumptions.
7.  Do not treat missing data as zero without an explicit rule.
8.  Do not confuse net worth with liquid funds.
9.  Do not classify every investment as immediately accessible.
10. Do not double-count financial commitments.
11. Show calculation methodology where appropriate.
12. Allow users to correct financial information.
13. Explain when a result is based on incomplete data.
14. Clearly label projections as estimates.

------------------------------------------------------------------------

# 22. PROTOTYPE QUALITY REQUIREMENTS

The finished prototype must satisfy all of the following:

-   A new user can sign up.
-   A new user can complete onboarding.
-   A new user can skip optional onboarding fields.
-   The financial overview is generated from entered information.
-   A user can update income and expenses.
-   The overview updates after data changes.
-   A user can add assets and liabilities.
-   A user can create and monitor goals.
-   A user can ask a financial question.
-   A user can evaluate a car purchase.
-   A user can compare loan prepayment and investment alternatives.
-   A user with irregular income can explore safe spending scenarios.
-   A user can modify scenario assumptions.
-   A user can compare up to three scenarios.
-   A user can save and revisit decisions.
-   A user can save and revisit scenarios.
-   A user can understand how calculations were derived.
-   The five primary navigation destinations work.
-   All primary screens are accessible.
-   The application is contained inside the iPhone 18 Pro Max mockup.

------------------------------------------------------------------------

# 23. IMPLEMENTATION PROCESS

Do not attempt to write the entire application in one giant component or
one unstructured coding pass. Work in logical phases.

## Phase 1: Foundation

-   Inspect repository.
-   Set up project structure.
-   Configure routing.
-   Build the iPhone mockup.
-   Build shared layout.
-   Build bottom navigation.
-   Build reusable UI components.
-   Create global state and data models.

## Phase 2: Authentication and onboarding

-   Build authentication screens.
-   Build all onboarding screens.
-   Implement conditional onboarding logic.
-   Implement form validation.
-   Implement state persistence.

## Phase 3: Financial overview

-   Build Home.
-   Build financial breakdown screens.
-   Build financial record management.
-   Implement deterministic financial calculations.
-   Connect all data to the overview.

## Phase 4: Goals

-   Build goal creation.
-   Build goal details.
-   Build progress.
-   Build goal impact.

## Phase 5: Decision experience

-   Build decision landing.
-   Build question input.
-   Build clarification flow.
-   Build context review.
-   Build decision workspace.
-   Build alternatives.
-   Build explanation.
-   Build saved decisions and history.

## Phase 6: Scenario simulator

-   Build scenario landing.
-   Build scenario creation.
-   Build variable configuration.
-   Build projections.
-   Build comparison.
-   Build assumptions.
-   Build saved scenarios.

## Phase 7: Profile and system states

-   Build profile.
-   Build financial data management.
-   Build privacy and consent.
-   Build notifications.
-   Build system states.
-   Build quick actions.

## Phase 8: End-to-end integration

Test all three flagship use cases. Check that changes in financial
information are reflected in calculations, insights, scenarios, and goal
impacts. Fix broken navigation, invalid calculations, inconsistent data,
and incomplete interactions.

------------------------------------------------------------------------

# 24. FINAL DELIVERABLE

Deliver a complete low-fidelity, interactive mobile application
prototype including:

1.  iPhone 18 Pro Max device mockup.
2.  Authentication flow.
3.  Complete onboarding flow.
4.  Complete financial overview.
5.  Financial data management.
6.  Five-item bottom navigation.
7.  Decision experience.
8.  Scenario simulator.
9.  Goal management.
10. Profile and settings.
11. Global system states.
12. Three end-to-end flagship use cases.
13. Deterministic calculation engine.
14. Realistic Indian financial demo data.
15. Local persistence.
16. Reusable components.
17. Maintainable code structure.

Create a README explaining: - How to run the application. - Project
architecture. - Main data models. - Calculation functions. - How to
navigate the prototype. - Which features are simulated. - Which features
are not connected to real financial services.

## Final instructions

Before finishing: - Verify that the application runs. - Verify all five
navigation tabs. - Verify onboarding from beginning to end. - Verify
financial calculations. - Verify the car affordability journey. - Verify
the home loan prepayment versus investment journey. - Verify the
variable-income planning journey. - Verify saved decisions and
scenarios. - Verify edits update relevant screens. - Verify the iPhone
device mockup on desktop. - Fix all major runtime errors.

Do not start high-fidelity styling. Do not spend time creating a brand
identity. Do not redesign the product strategy. Do not omit screens
because the application is large.

Build the complete low-fidelity product experience with a strong,
consistent UX foundation.

**The priority is a working product prototype with complete user
journeys, not a collection of attractive static screens.**
