# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users
India-first. Three segments served by one adaptable product: emerging professionals (salaried, first major financial decisions), financially responsible households (home and vehicle loans, family responsibilities), and independent earners (freelancers and business owners with variable income). They open the app with a decision in mind ("Can I afford a ₹12 lakh car?", "Prepay my home loan or keep investing?"), not to log transactions.

## Product Purpose
Money Decision Engine is a personal financial intelligence app. It connects a person's financial position, goals and alternative scenarios so they can understand trade-offs and make informed choices. Success is a user who reaches a confident decision and saves it, not one who checks a balance.

## Positioning
Tagline: "Don't just track your money. Understand what to do with it." Not an expense tracker, bank or chatbot. The mechanism a neighbour could not copy: decisions are first-class objects (ask, scenario, compare, save, revisit) built on the user's own data with deterministic, inspectable calculations.

## Operating Context
Phone, usually in a considered moment (before a purchase, loan or investment choice). Currency is INR with lakh and crore grouping. Demo profiles: Ananya (salaried, vehicle loan), Rahul (household, home and car loan), Arjun (freelancer, variable income). The prototype runs in a browser inside an iPhone-style frame, with a development-only prototype navigator beside it.

## Capabilities and Constraints
Adaptive onboarding, financial overview derived from underlying data, decisions (car affordability, prepay vs invest, safe spending), scenarios with projections and comparison, goals, profile, system states (offline, failed connection, expired session). All calculations are deterministic and local (src/calculations, src/intelligence). Stack: Vite, React 18, TypeScript, react-router (HashRouter). Currently a low-fidelity prototype with a first visual pass; figures are illustrative and no real financial connections exist.

## Brand Commitments
Name stays "Money Decision Engine" and the tagline stays. The prototype's first-pass look (bone canvas, ink tiles, electric-lime accent) is the incumbent and is treated as evidence, not as a commitment.

## Evidence on Hand
prompt.md (full build brief), src/ (screens and calculation engine), demo profiles in src/data/mock-data/demoProfiles.ts. No real users, customer proof or brand assets (logo, photography) exist. Do not invent claims.

## Product Principles
1. Decisions, not dashboards: every screen moves toward a choice or explains one.
2. Show the trade-off, not just the answer: assumptions and risk are visible, never buried.
3. Trust through legibility: numbers are inspectable and uncertainty is stated plainly.
4. One product, three financial lives: the same system adapts to salaried, household and variable-income users.

## Accessibility & Inclusion
Prototype is for a portfolio case study: aim for WCAG AA contrast, 44pt touch targets, Dynamic Type friendly sizing and a real dark appearance. Copy is plain English suited to people making first big financial decisions.
