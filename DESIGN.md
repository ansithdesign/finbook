---
name: Money Decision Engine
description: Don't just track your money. Understand what to do with it. A monsoon bulletin for money decisions.
colors:
  cloud: "#e7edef"
  paper: "#f8fbfb"
  page: "#cddae0"
  ink: "#0b1f29"
  ink-2: "#1c3846"
  ink-3: "#2c4d5d"
  muted: "#4b6572"
  faint: "#8aa1ab"
  line: "#cad7dc"
  line-2: "#dae4e8"
  border-strong: "#b3c4cb"
  storm: "#0c3a47"
  storm-2: "#14515f"
  shell-muted: "#9fc1ca"
  radar: "#0a7c8f"
  radar-ink: "#07616f"
  radar-bright: "#6fd5e3"
  on-bright: "#06222b"
  rain: "#2f78b8"
  rain-tint: "#d6eaf3"
  estimate: "#4a62c9"
  estimate-tint: "#e1e6f8"
  estimate-ink: "#2f43a3"
  level-ok: "#2f8a5b"
  level-ok-tint: "#dcf0e4"
  level-ok-ink: "#1d6a42"
  level-aware: "#d9a800"
  level-aware-tint: "#faf0c4"
  level-aware-ink: "#6b5200"
  level-prepare: "#e6801b"
  level-prepare-tint: "#fbe4cb"
  level-prepare-ink: "#8a4806"
  level-act: "#c9382e"
  level-act-tint: "#f8dbd7"
  level-act-ink: "#9c231b"
typography:
  large-title:
    fontFamily: "Barlow Semi Condensed, Barlow, -apple-system, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Barlow Semi Condensed, Barlow, -apple-system, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  section-title:
    fontFamily: "Barlow Semi Condensed, Barlow, -apple-system, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    letterSpacing: "-0.012em"
  hero-number:
    fontFamily: "Barlow Semi Condensed, Barlow, -apple-system, system-ui, sans-serif"
    fontSize: "58px"
    fontWeight: 600
    lineHeight: 0.96
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  stat-number:
    fontFamily: "Barlow Semi Condensed, Barlow, -apple-system, system-ui, sans-serif"
    fontSize: "29px"
    fontWeight: 600
    letterSpacing: "-0.015em"
    fontFeature: "tnum"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  input: "14px"
  stat: "18px"
  card: "20px"
  option: "22px"
  tile: "24px"
  sheet: "32px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "14px"
  lg: "18px"
  screen-gutter: "20px"
  section-gap: "30px"
components:
  button-primary:
    backgroundColor: "{colors.radar}"
    textColor: "#ffffff"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "0 26px"
    height: "56px"
  button-primary-on-storm:
    backgroundColor: "{colors.radar-bright}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "56px"
  button-danger:
    backgroundColor: "{colors.level-act-tint}"
    textColor: "{colors.level-act-ink}"
    rounded: "{rounded.pill}"
    height: "56px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "18px"
  tile-storm:
    backgroundColor: "{colors.storm}"
    textColor: "#ffffff"
    rounded: "{rounded.tile}"
    padding: "20px"
  tile-signal:
    backgroundColor: "{colors.radar-bright}"
    textColor: "{colors.on-bright}"
    rounded: "{rounded.tile}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    height: "54px"
  level-pill-aware:
    backgroundColor: "{colors.level-aware-tint}"
    textColor: "{colors.level-aware-ink}"
    rounded: "{rounded.pill}"
  chip-on:
    backgroundColor: "{colors.storm}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "42px"
  tab-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    height: "90px"
---

# Design System: Money Decision Engine

## Overview

**Creative North Star: "The Monsoon Bulletin"**

A money decision is a forecast, so the app speaks like a weather bulletin. Outcomes are ranges, not single futures. Something changes at an onset marker. State is told in a four-level warning vocabulary (ok, aware, prepare, act) instead of green up and red down. The ground is overcast cloud grey with a cool green bias, cards are paper white, hero tiles are deep storm teal, actions are radar teal, and data and estimates are rain blue. The product is a decision tool for people in a considered moment (a car, a loan, a prepayment), so the system favors calm, legible numerals and plain sentences over dashboard density.

The shell borrows iOS grammar: large titles, grouped lists, a translucent tab bar with Decide centred, pill buttons and sheets. Numerals and headings use Barlow Semi Condensed so figures read like a bulletin board; running text uses the system San Francisco stack so the app feels native. Contour art on storm tiles is drawn as isobars, wobbling closed lines in radar-bright at falling opacity.

**Key Characteristics:**
- Cloud ground, paper cards, storm-teal hero surfaces, radar-teal action, rain-blue data.
- Four bulletin warning colours that only ever mean state.
- Condensed tabular numerals over native text.
- Soft, generous radii (14 to 24px, pills for controls) and almost no shadow.
- Isobar contour art on dark tiles; ranges and onset markers in charts.
- Dark appearance exists as a token set (see Elevation & Depth and Do's and Don'ts for its verification limits).

## Colors

A cool, rain-washed palette: one grey-green ground, one deep teal shell, one action teal, one data blue, and four state colours held in reserve.

### Primary
- **Radar Teal** (`colors.radar`, #0a7c8f): primary buttons, active tab label, focus glow (32% mix), stepper progress, bar fills, chart series 1.
- **Radar Bright** (`colors.radar-bright`, #6fd5e3): the lit accent on storm surfaces: progress fill, hub icon, primary button on storm tiles, signal tile, delta pill, text selection, link underline, chart end-point dots. Needs `on-bright` (#06222b) or `ink` text, never white.
- **Radar Ink** (`colors.radar-ink`, #07616f): accent-coloured text on light surfaces.

### Secondary
- **Storm Teal** (`colors.storm`, #0c3a47): the shell. Hero tiles, selected chips and segments, icon boxes, avatar, toggles on, toasts, chart callout labels, the tab bar hub button. `storm-2` (#14515f) is the lifted partner; `shell-muted` (#9fc1ca) is secondary text on storm.
- **Rain Blue** (`colors.rain`, #2f78b8): data. Chart series 2, the range band fill (16% opacity), best-cell tint in comparison tables (`rain-tint` #d6eaf3), info icons.
- **Estimate Indigo** (`colors.estimate`, #4a62c9): anything that is an estimate or assumption. Default banner background uses `estimate-tint` (#e1e6f8) with `estimate-ink` (#2f43a3) text; chart series 3.

### Tertiary: the four bulletin levels
- **Level OK** (#2f8a5b, tint #dcf0e4, ink #1d6a42): on track.
- **Level Aware** (#d9a800, tint #faf0c4, ink #6b5200): be aware.
- **Level Prepare** (#e6801b, tint #fbe4cb, ink #8a4806): be prepared; also the attention insight card and the negative delta pill.
- **Level Act** (#c9382e, tint #f8dbd7, ink #9c231b): take action; errors, invalid fields, destructive buttons, the notification dot, negative bars.

### Neutral
- **Cloud** (#e7edef): screen ground. **Paper** (#f8fbfb): cards, lists, inputs. **Page** (#cddae0): the stage behind the device frame.
- **Ink** (#0b1f29), **Ink 2** (#1c3846), **Ink 3** (#2c4d5d): text ramp. **Muted** (#4b6572): labels and captions. **Faint** (#8aa1ab): placeholders, chevrons, disabled text.
- **Line** (#cad7dc), **Line 2** (#dae4e8), **Border Strong** (#b3c4cb): borders, dividers, tab bar top rule, unchecked checks.

### Named Rules
**The Reserved Weather Rule.** The four level colours (green, yellow, orange, red) mean state and nothing else. They never decorate a tile, icon, chart series or illustration. Ink variants carry text; tints carry backgrounds; the saturated colour is for dots, borders and fills that state a level.

**The Lit-On-Storm Rule.** Radar Bright appears only on storm surfaces or as a small signal (delta pill, link underline, end-point dot). On cloud and paper, action is Radar Teal.

**The Estimate Is Indigo Rule.** Assumptions, projections and estimates are indigo or rain blue and may be dashed or hatched; they are never a level colour.

## Typography

**Display Font:** Barlow Semi Condensed (500, 600, 700 loaded via fontsource; fallback Barlow, system-ui)
**Body Font:** system San Francisco stack (-apple-system, BlinkMacSystemFont, SF Pro Text, Geist, Segoe UI, Roboto, Arial)

**Character:** A condensed bulletin face for every figure and heading against a native, quiet text face. Numerals are always tabular so columns of rupee amounts align.

### Hierarchy
- **Large Title** (600, 38px, 1.02, -0.015em): iOS large title in the screen header, left aligned.
- **Display H1** (700, 34px, 1.05, -0.04em): onboarding and empty-state headlines.
- **Headline** (600, 28px, 1.1, -0.01em): sheet and section-level statements.
- **Section Title** (600, 20px, -0.012em): section heads, with a link-style action at right.
- **Hero Number** (600, 58px, 0.96, tabular): the one number a tile exists to show.
- **Stat Number** (600, 29px tabular; 24px in stat cards): supporting figures.
- **Title** (600, 16px): list-row titles and compact header title.
- **Body** (400, 15px, 1.45): running text. Inputs 16px.
- **Label** (500, 12.5px, muted) and **Caption** (400, 12px, muted): helper and meta text. Tab labels 10.5px.

### Named Rules
**The Numerals Are Condensed Rule.** Every currency figure, big or small, is Barlow Semi Condensed with tabular figures. Decimals are muted where the screen shows them.

**The Native Text Rule.** Prose, labels and controls use the system stack. Barlow does not set paragraphs.

## Layout

A single phone column, 440 by 956 inside an iPhone frame with a 59px top safe area and 34px bottom safe area. Screens are a header (compact centred title or large title) plus a scrolling body with a 20px side gutter and a floating tab bar reserve of 104px at the bottom. Content stacks with 14px default gaps (8px tight, 26px loose) and 30px between sections. Bento grids use two columns at 12px gap with full-width spans; stat grids are two columns at 12px; lists run edge to edge inside a card. Touch targets are at least 44px (icon buttons 44, buttons 56 or 40 small, inputs 54, chips 42, list rows 60). Primary screen footers fade from the ground colour so a pinned button sits above content. The only responsive rule is for the development panel outside the device, which narrows under 900px.

## Elevation & Depth

Mostly flat, with depth from tone and one translucent layer. Cards, tiles and lists are separated from the cloud by paper fill and a 1px line, not by shadow. The bottom tab bar is the one material surface: paper at 84% mix with a 22px blur and 1.5 saturation, closed by a 0.5px strong border. Shadows are soft, low and cool, used only for floating things.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 12px 28px -14px rgba(7, 28, 38, 0.4)`): toasts and the floating action button.
- **Elevated card** (`box-shadow: 0 14px 30px -18px rgba(7, 28, 38, 0.28)`): the opt-in elevated card.
- **Selected ring** (`box-shadow: 0 0 0 2px var(--ink)`, 1.5px on option cards): selection is a hard ink ring, not a shadow.
- **Focus glow** (`0 0 0 4px` radar teal at 32%): input focus, with the border shifting to ink.

### Named Rules
**The Flat Until Floating Rule.** Surfaces rest flat with a hairline. Only toasts, the FAB and the tab bar float.

**The Dark Is A Token Set Rule.** The dark appearance (`data-theme="dark"` on the screen) re-values the same roles: cloud #08151c, paper #0f2430, ink #e8f1f4, radar #55c7d9, and brightened level colours with dark tints. It was verified on Home and Decide only. Other screens inherit it through tokens but have not been reviewed in dark.

## Shapes

Soft and rounded, in a clear size ladder: inputs 14px, stat cards 18px, cards and lists 20px, option cards 22px, hero tiles 24px, large text areas 26px, dialogs 30px, sheets 32px on top corners, device screen 56px. Every button, chip, tag, level pill, segmented control and delta is a full pill (999px). Icon containers are rounded squares (13 to 16px) in storm with radar-bright glyphs; avatars and the FAB are circles. Borders are 1px hairlines on cards and 1.5px on inputs and chips. Charts use rounded bars (up to 7px radius) and rounded 3 to 4px legend swatches.

## Components

### Buttons
- **Shape:** full pill, 56px tall (40px small), 26px side padding, 16px semibold.
- **Primary:** Radar Teal fill, white text. On storm tiles it becomes Radar Bright with ink text.
- **Secondary:** paper with a 1.5px inset ink ring. **Ghost:** transparent ink text. **Danger:** act tint with act ink text.
- **Press:** scale to 0.97 with an expo-out ease (cubic-bezier(0.16, 1, 0.3, 1), 0.2s). Disabled is line-2 fill with faint text.

### Cards, Tiles and Lists
- **Card:** paper, 1px line, 20px radius, 18px padding. **Tile:** 24px radius, 20px padding, may hold isobar contour art as an absolutely positioned first child.
- **Tile variants:** paper (default), storm (hero), signal (Radar Bright, ink text), flat (line-2).
- **List:** a paper card of 60px rows with 1px line-2 separators, a storm icon box at left, tabular value at right, faint chevron.
- **Bulletin card (insight):** 18px radius with an icon square; the attention severity switches to the prepare tint, border and icon.

### Level pill
Pill with a 7px currentColor dot, 11px bold, tinted background and ink text. One per level; the only way to state a warning level in text.

### Inputs / Fields
- 54px tall, 14px radius, 1.5px line border on paper, 16px medium text, muted affix.
- **Focus:** border to ink plus a 4px radar glow. **Error:** act border on act tint, error text in act ink semibold.

### Chips, Segments and Toggles
- Selected state is storm fill with white text and an ink border; unselected is paper with a line border. Segmented control is a line-2 pill track with a storm thumb. Toggle on is storm with a Radar Bright knob.

### Navigation
- **Tab bar:** five items on a translucent blurred bar, 10.5px labels in muted, active in Radar Teal semibold. Decide sits centre as a storm pill (54 by 30) with a Radar Bright glyph; when active it gains a 2px Radar Teal ring.
- **Header:** compact centred 16px title, or large title; a hairline appears under the header once the body scrolls.

### Charts (signature)
Series run in reading order: Radar Teal, Rain Blue, Estimate Indigo, Faint grey. Lines are drawn on with a stroke animation. Dashed hairline gridlines, a dashed ink onset marker with a storm pill label, a ringed low point with a storm callout, and a Radar Bright end-point dot with an ink ring. Estimates may be hatched. The income-flow ribbon and emergency runway are rounded segment strips that grow from the left. Dot plots place numbered storm dots on a line, with the best option in Radar Bright and an ink ring.

- **Range band:** the shaded Rain Blue band (16% opacity) appears on multi-option charts only, where it spans the true minimum to maximum across the options at each month. Single-series charts have no band.
- **Home net worth sparkline:** shows actual history only, a Radar Bright line with a fading area fill on the storm tile. It has no forecast band and no onset marker.

### Illustrations
Storm-teal scenes (360 wide, 30px radius) with dotted-line grids, dashed estimate paths in #2c6677, and a lit Radar Bright path with concentric ripple rings at its end. Isobar contours appear as `ContourArt` on tiles.

## Do's and Don'ts

### Do:
- **Do** use the four level colours only to state a level (pill, dot, border, error, negative delta).
- **Do** set every figure in Barlow Semi Condensed with tabular numerals; keep prose in the system stack.
- **Do** use Radar Teal for action on cloud and paper, and Radar Bright with ink text on storm.
- **Do** keep surfaces flat with a 1px line; reserve soft cool shadows (Float) for toasts and the FAB.
- **Do** use full pills for controls and the 14 to 24px radius ladder for containers.
- **Do** show ranges and an onset marker where a choice changes, and mark estimates in indigo, dashed or hatched.
- **Do** keep touch targets at or above 44px.

### Don't:
- **Don't** use green or red for plain up or down; use level meaning or neutral ink.
- **Don't** use a level colour as decoration in an illustration, chart series, tile or icon.
- **Don't** put white text on Radar Bright.
- **Don't** draw a range band on a single-series chart, or imply a forecast on the Home net worth sparkline.
- **Don't** assume dark appearance is designed beyond Home and Decide; verify other screens before relying on it.
- **Don't** return to the incumbent bone canvas, ink tiles and electric-lime accent.

## Not canonized (defects the build carries)

- Hardcoded hex values bypass tokens and do not re-theme in dark: `#fff` on storm surfaces, `#2c6677` and `#1a4c5b` in illustrations, `#6aa9de`, `#f0715f`, `#2f9fb4` in the on-dark chart palette, `#7aa3ae` hatch swatch.
- Tiny uppercase letter-spaced micro labels (`.datebox small` at 9.5px, the dev panel headings) are not a pattern for new surfaces.
- Legacy aliases (`--green-tint`, `--accent-tint`, `--warn`) remain and map to rain or act tokens; do not reuse the names.
- The Geist web font is requested in index.html but only sits as a late fallback in the text stack.
