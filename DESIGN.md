---
name: Money Decision Engine
description: "Don't just track your money. Understand what to do with it. Every screen lives under a sky that follows the time of day."
colors:
  ink: "#0d1b2a"
  ink-2: "#2a3c52"
  ink-3: "#4a5d74"
  muted: "#4f6278"
  faint: "#8d9cae"
  on-ink: "#ffffff"
  midnight: "#0f2238"
  sky-1: "#6fb6ef"
  sky-2: "#a6d3f6"
  sky-3: "#d6ebfa"
  haze: "#eef5fb"
  page: "#dce8f2"
  sky-morning-1: "#8ec0f0"
  sky-morning-2: "#cfe1f4"
  sky-morning-3: "#fbe2cf"
  haze-morning: "#f5f4f2"
  sky-evening-1: "#7c84d6"
  sky-evening-2: "#c3a6dc"
  sky-evening-3: "#f4bfb0"
  haze-evening: "#f3f0f7"
  sky-night-1: "#070f26"
  sky-night-2: "#0e1d42"
  sky-night-3: "#15295a"
  haze-night: "#0a1430"
  ink-night: "#eef4fb"
  solid-night: "#111f3f"
  glass: "rgba(255, 255, 255, 0.56)"
  glass-strong: "rgba(255, 255, 255, 0.8)"
  glass-edge: "rgba(255, 255, 255, 0.9)"
  glass-night: "rgba(255, 255, 255, 0.07)"
  line: "rgba(13, 27, 42, 0.1)"
  border-strong: "rgba(13, 27, 42, 0.18)"
  fill: "rgba(13, 27, 42, 0.06)"
  accent: "#1769d6"
  accent-ink: "#0f56b5"
  accent-soft: "rgba(23, 105, 214, 0.12)"
  accent-bright: "#8fc6fb"
  accent-night: "#6cb4ff"
  rain: "#3b8ee8"
  est-ink: "#4a3cb8"
  est-tint: "rgba(106, 91, 216, 0.13)"
  seg-1: "#1c3557"
  series-2: "#8b7cf0"
  series-3: "#f2a33a"
  series-4: "#93a3b5"
  ok: "#23915c"
  ok-ink: "#15693f"
  ok-tint: "rgba(35, 145, 92, 0.14)"
  aware: "#c99a00"
  aware-ink: "#6b5200"
  aware-tint: "rgba(232, 182, 0, 0.18)"
  prepare: "#ea8a26"
  prepare-ink: "#8a4806"
  prepare-tint: "rgba(234, 138, 38, 0.17)"
  act: "#d23f33"
  act-ink: "#a0261c"
  act-tint: "rgba(210, 63, 51, 0.13)"
typography:
  display:
    fontFamily: "Figtree Variable, Figtree, -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "60px"
    fontWeight: 650
    lineHeight: 0.96
    letterSpacing: "-0.045em"
    fontFeature: "tnum"
  figure:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "40px"
    fontWeight: 650
    lineHeight: 0.98
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  figure-sm:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "28px"
    fontWeight: 650
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  headline-sm:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "26px"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  section-title:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  caption:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
  level:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "11.5px"
    fontWeight: 650
    lineHeight: 1.3
  tab:
    fontFamily: "Figtree Variable, Figtree, -apple-system, sans-serif"
    fontSize: "10.5px"
    fontWeight: 500
rounded:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  card: "24px"
  tile: "26px"
  dialog: "30px"
  sheet: "34px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  card: "18px"
  gutter: "20px"
  lg: "26px"
  section: "34px"
components:
  button-primary:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.on-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "0 26px"
    height: "56px"
  button-primary-night:
    backgroundColor: "{colors.on-ink}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 26px"
    height: "56px"
  button-ghost:
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    height: "56px"
  button-danger:
    backgroundColor: "{colors.act-tint}"
    textColor: "{colors.act-ink}"
    rounded: "{rounded.pill}"
    height: "56px"
  button-sm:
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  card-glass:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
  tile-glass:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.tile}"
    padding: "20px"
  list-glass:
    backgroundColor: "{colors.glass-strong}"
    rounded: "{rounded.card}"
  list-row:
    padding: "13px 16px"
    height: "60px"
  input:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "54px"
  chip:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "42px"
  chip-selected:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.pill}"
  segmented:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.sm}"
    padding: "3px"
  level-ok:
    backgroundColor: "{colors.ok-tint}"
    textColor: "{colors.ok-ink}"
    typography: "{typography.level}"
    rounded: "{rounded.pill}"
    padding: "3px 10px 3px 8px"
  level-aware:
    backgroundColor: "{colors.aware-tint}"
    textColor: "{colors.aware-ink}"
    typography: "{typography.level}"
    rounded: "{rounded.pill}"
    padding: "3px 10px 3px 8px"
  level-prepare:
    backgroundColor: "{colors.prepare-tint}"
    textColor: "{colors.prepare-ink}"
    typography: "{typography.level}"
    rounded: "{rounded.pill}"
    padding: "3px 10px 3px 8px"
  level-act:
    backgroundColor: "{colors.act-tint}"
    textColor: "{colors.act-ink}"
    typography: "{typography.level}"
    rounded: "{rounded.pill}"
    padding: "3px 10px 3px 8px"
  tab-bar:
    textColor: "{colors.muted}"
    typography: "{typography.tab}"
    height: "92px"
  tab-active:
    textColor: "{colors.accent}"
  tab-hub:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.on-ink}"
    rounded: "15px"
    width: "52px"
    height: "30px"
  sheet:
    backgroundColor: "{colors.haze}"
    rounded: "{rounded.sheet}"
---

# Design System: Money Decision Engine

## Overview

**Creative North Star: "Under the Sky"**

A money decision is a forecast, so the app lives under a real sky. The sky follows the time of day (morning gold and blue, clear day blue, evening lilac and rose, night navy with stars) and fades into a pale haze where the reading content begins. Headline figures sit directly on that sky with no container; only grouped, tappable content earns a surface, and that surface is borderless frosted glass so the sky keeps reading through it. Risk is spoken as a weather bulletin in four levels (ok, be aware, be prepared, take action), never as green up and red down decoration.

The world is calm, open and airy. Density is moderate: one strong figure per module, generous section breaks, and hairlines instead of boxes where a group only needs separating. One typeface (Figtree) carries everything from the 60px hero figure to the 10.5px tab label, with tight negative tracking on figures. Primary action is midnight ink; deep sky blue is the voice of selection and data; violet means estimate. The prototype is an iOS screen shown in a 440px device frame.

Retired and not to return: the earlier storm-teal tile world, Barlow numerals, isobar contour lines, blob art and dot grids. Boxed bento cards, bordered containers and a single neon fintech accent are rejected by this world.

**Key Characteristics:**
- Time-of-day sky backdrop with drifting clouds on top-level screens, a softer sky on sub-screens.
- Hero figures on the sky with no surface; everything else grouped on borderless frosted glass.
- Four bulletin colours reserved for state.
- Figtree only, tabular figures with tight tracking.
- Phosphor icons: regular by default, fill when selected, duotone inside tinted badges.
- Midnight pill for primary actions and for the Decide tab.

## Colors

A sky palette (blue, gold, lilac, navy) under midnight ink, with one deep sky blue for action and data, a violet for estimates, and four warning colours held back for state.

### Primary
- **Midnight Ink** (midnight): primary buttons, the Decide hub pill, selected chips, the FAB, chart event and low-point flags, the offline bar and the start node in illustrations. At night it inverts to white with ink text.
- **Deep Sky Blue** (accent, accent-ink for text): selection, the active tab, focus rings, links, progress fills, the hero sparkline and positive chart areas. Night swaps in **Night Sky Blue** (accent-night).

### Secondary
- **Pale Day Blue** (accent-bright): the end-point dot on lines, text selection, icons inside midnight chips and toasts, the "left over" ribbon segment.
- **Rain Blue** (rain): second ribbon segment, gradient partner to accent in progress and runway fills, the comparison range band.

### Tertiary
- **Estimate Violet** (est-ink on est-tint): anything estimated or assumed: the default banner, dashed estimate tags. It never signals risk.
- **Data series** (seg-1 Deep Harbour Navy, series-2 Soft Violet, series-3 Sun Gold, series-4 Cloud Grey): categorical chart colours. Series one is accent. Series four, hatched, means locked or illiquid.

### Neutral
- **Ink** (ink, ink-2, ink-3): text tiers. **Slate Muted** (muted) for labels and captions, **Faint Slate** (faint) for placeholders, chevrons and disabled text.
- **Haze** (haze): the canvas the sky fades into; also the base of sheets, dialogs and sticky footers. **Page Mist** (page) is the stage behind the device.
- **Frost** (glass, glass-strong, glass-edge): translucent white surfaces and their top highlight. Night glass is nearly clear (glass-night).
- **Hairline** (line, border-strong, fill): separators, list dividers, neutral fills for tracks, skeletons and segmented controls.

### Skies
Each time of day overrides three sky stops, the haze, the sun glow position and cloud opacity on the screen root. Day is the default (sky-1..3, haze). Morning uses sky-morning-1..3 with a warm haze and the sun at the left; evening uses sky-evening-1..3 with the sun low left and fainter clouds; night uses sky-night-1..3 and haze-night, removes clouds, adds a starfield and is the dark appearance (ink becomes ink-night, solids become solid-night). Morning, day and evening are chosen automatically from the clock; night follows the dark appearance setting. Night is verified on Home and Decide only; every other screen inherits the night tokens but has not been checked.

### Named Rules
**The Bulletin Rule.** Ok green, aware amber, prepare orange and act red only ever mean state: a level chip, a negative delta, a shortfall, a destructive action, an error. They never colour a category, a decoration or a brand moment.

**The Midnight Acts Rule.** The filled primary action is midnight ink (white at night). Deep sky blue selects and charts; it does not fill primary buttons.

**The Violet Means Estimate Rule.** Violet tint marks assumed or estimated values and nothing else.

## Typography

**Display Font:** Figtree Variable (with -apple-system, SF Pro Text, Segoe UI, Roboto, Arial fallback)
**Body Font:** Figtree Variable, the same family
**Label/Mono Font:** none; figures use Figtree with tabular numerals

**Character:** One friendly geometric sans across every role. Hierarchy comes from size, weight (400 to 700, with 650 as the figure weight) and tracking that tightens as size grows.

### Hierarchy
- **Display** (650, 60px, 0.96, -0.045em, tabular): the single hero figure. Home sets the net worth at 56px with the same treatment.
- **Figure** (650, 40px, 0.98, -0.04em, tabular): the lead figure of a glass module; smaller module figures step down to 30px and 26px on the same treatment. **Figure small** (650, 28px, -0.03em) for secondary figures.
- **Headline** (700, 34px, 1.06, -0.03em, balanced wrap): the large screen title, set on the sky. **Headline small** (650, 26px, 1.12) for in-content headings.
- **Section title** (650, 20px, -0.02em): headings above each section group. Sheet titles use 700 at 21px.
- **Title** (600, 17px, -0.01em): centred navigation bar title on sub-screens; row titles use 600 at body size.
- **Body** (400, 15px, 1.45): running text; buttons use 600 at 16px.
- **Label** (500, 13px, muted): the name above a figure, form labels (600, ink-2).
- **Caption** (400, 12.5px, muted): units, context lines, chart notes.
- **Level** (650, 11.5px): bulletin chips. **Tab** (500, 10.5px; 600 when active).

### Named Rules
**The One Family Rule.** Figtree is the only typeface, including inside SVG illustrations and chart labels. No second display face, no mono.

**The Tight Figures Rule.** Every money figure is tabular and tracked negative (-0.03em to -0.045em, tighter as it grows). Sentence case everywhere; nothing is set in uppercase.

## Layout

A single 440px iOS column inside the device frame. Content runs in a 20px gutter; top-level screens open with a large left-aligned title on the sky (34px), sub-screens use a centred 17px title with a back button. The header gains a blurred haze background only once the body scrolls.

Rhythm: sections are 34px apart (10px for the first), section heads sit 12px above their content, stacks step 8, 14 and 26px, two-up grids gap 12px, stat grids gap 18 by 16px. Modules stack full width; a pair of half-width modules closes a group at most. Sticky footers fade up from the haze instead of drawing a bar. The scroll area reserves 104px for the tab bar.

### Named Rules
**The Open Sky Rule.** The first figure on a top-level screen sits directly on the sky: no surface, no radius, no shadow, just its label, the figure, a delta chip and an open chart.

## Elevation & Depth

Depth comes from translucency, not stacking. Glass surfaces blur what is behind them (18px blur, 1.5 saturation) and carry a hairline white highlight on the top edge plus one soft, sky-tinted shadow that falls well below the surface. Floating chrome (tab bar 24px blur, scrolled header 20px blur) uses the same material over the haze. Only things that float above content (FAB, toast, dialog) get the deeper float shadow.

### Shadow Vocabulary
- **Soft sky** (`box-shadow: 0 14px 34px -22px rgba(23, 63, 112, 0.45)`): every glass surface, paired with the glass-edge inset highlight.
- **Float** (`box-shadow: 0 18px 40px -18px rgba(13, 27, 42, 0.5)`): FAB, toasts, dialogs.
- **Midnight lift** (`box-shadow: 0 12px 26px -16px rgba(15, 34, 56, 0.8)`): primary buttons.
- **Glass edge** (`box-shadow: inset 0 0.5px 0 var(--glass-edge)`): the top highlight that replaces a border.

### Named Rules
**The No Border Rule.** Surfaces never take a stroke. Their edge is a 0.5px inset highlight and a soft shadow; selection is a 2px inset accent ring, and only inputs and secondary controls use a 0.5px inset hairline.

## Shapes

Generously rounded, continuous forms. Glass cards and lists 24px, module tiles 26px, insights 22px, option cards and expanders 20px, chip buttons 18px, inputs and date boxes 16px, segmented controls 12px with 9px segments, checkboxes 8px. Buttons, chips, tags, level chips and deltas are full pills. Sheets round 34px at the top; dialogs 30px. Icon badges and avatars are circles. Illustrations are clipped into 26px sky windows.

## Components

### Buttons
Calm, heavy and round: a midnight pill that presses in.
- **Shape:** full pill (999px), 56px tall, 26px side padding; small variant 40px tall with 16px padding.
- **Primary:** midnight with white 600 16px text and the midnight lift shadow. At night: white with ink text.
- **Press / Focus:** scales to 0.97 on press with the house ease; focus is a 2px accent outline offset 2px.
- **Secondary:** strong frosted glass with ink text, 0.5px hairline and soft shadow, 16px blur.
- **Ghost:** transparent with accent-ink text. **Danger:** act tint with act-ink text. **Disabled:** neutral fill, faint text, no shadow.
- **Icon button:** 44px circle, transparent, neutral fill on press.

### Chips
- **Choice chip:** strong glass pill, 42px tall, hairline inset; selected turns midnight with white text and a pale-blue icon.
- **Tag:** small neutral pill (11.5px, 600). Midnight tag for emphasis; violet tint tag for estimates; act tint tag for warnings.
- **Delta chip:** ok tint for a gain; prepare tint for a negative change on the hero; act tint for other negatives.

### Bulletin Level
The signature state marker: an 11.5px pill with a 7px dot in the current colour, tinted background, ink-toned text. Four levels only: ok, aware, prepare ("Be prepared"), act. Insights at attention severity carry the prepare level and a prepare-tinted wash into glass.

### Cards / Containers
- **Corner Style:** 24px (card, list), 26px (tile), 22px (insight).
- **Background:** glass (0.56 white) by default, strong glass (0.8 white) for lists, elevated cards and inputs; near-clear glass at night.
- **Shadow Strategy:** soft sky shadow plus glass-edge highlight (see Elevation & Depth).
- **Border:** none.
- **Internal Padding:** 18px cards (14px tight), 20px tiles, 16px insights and list rows.
- **Hero tile:** no background, no shadow, no radius, 2px inset padding: the figure stands on the sky.
- **Stats:** open, no box: a 0.5px top hairline over a 26px figure.
- **Signal tile:** a solid deep-sky-blue gradient tile with white type appears once on Home (liquid funds) and once on Simulate. It is an existing exception to the glass rule, not a pattern to extend.
- **Press:** tappable modules scale to 0.985.

### Lists
Strong glass, 24px radius, rows 60px minimum with 13px by 16px padding. Leading icon in a 36px accent-soft circle with a duotone Phosphor icon. Dividers are 0.5px hairlines inset to the text. Values are tabular 600, trailing faint caret.

### Inputs / Fields
- **Style:** strong glass, 16px radius, 54px tall, 0.5px inset hairline, 16px 500 text, faint placeholder; muted affixes.
- **Focus:** 1.5px accent inset ring plus a 4px accent-soft halo.
- **Error / Disabled:** 1.5px act ring on act tint; error text act-ink 600 at 12.5px.
- **Segmented control:** neutral fill track, 3px inset; the selected segment is solid with a small lift.
- **Toggle:** 51 by 31px, white knob, on state filled with accent (never ok green, which is reserved for state).

### Navigation
- **Tab bar:** five tabs (Home, Simulate, Decide, Goals, Profile) on haze glass at 70% with a 24px blur and a hairline top edge. Icons 25px, regular when idle and fill when active; labels 10.5px. Idle tabs are muted, the active tab is accent at 600.
- **Decide hub:** the centre tab is a 52 by 30px midnight pill holding a 22px bold compass (fill when active). Active, the pill turns accent; at night it is white with ink.
- **Header:** large titles sit on the sky; on scroll the header picks up a 72% haze blur and a hairline.

### Sky Backdrop
The screen background on every light screen. Top-level screens get a 620px sky (sky-1 to sky-2 at 250px, sky-3 at 440px, haze at 620px) with a radial sun glow and three blurred clouds drifting over 70 to 110 seconds. Sub-screens get the soft 360px sky with no clouds. Night adds a faint starfield and drops clouds. Key moments (welcome, completion) use a full twilight gradient with white type.

### Illustrations
Authored SVG sky windows (26px radius) that read the live sky tokens, a sun glow and soft clouds. Decisions are drawn as white contrail paths, dashed for the options not taken and solid for the chosen route, between midnight and white nodes. Labels inside use Figtree. On twilight screens the window drops away and the drawing floats on the sky.

### Charts
Authored SVG, labelled directly. The primary line is accent at 3px with an accent area fading to clear; values below zero shade act. Comparisons add dashed secondary series and a rain-blue range band. Event and low-point flags are midnight pills with white text. Ribbons are rounded 10px segments with in-bar percentages; hatching marks locked money. Runways are month cells filled with a rain to accent gradient.

## Do's and Don'ts

### Do:
- **Do** put the hero figure directly on the sky with no container (no background, shadow or radius).
- **Do** use borderless frosted glass (glass or glass-strong, 18px blur, glass-edge highlight, soft sky shadow) for every other module.
- **Do** reserve ok, aware, prepare and act for state, and speak them through the level chip, deltas, shortfall shading and errors.
- **Do** use midnight for the filled primary action and the Decide pill, inverted to white at night.
- **Do** set every figure in Figtree 650 with tabular numerals and negative tracking.
- **Do** use Phosphor icons only: regular idle, fill selected, duotone in tinted badges.
- **Do** read sky colours from the sky tokens so morning, day, evening and night all work; verify night on any new screen.

### Don't:
- **Don't** bring back contour lines, isobars, blob art or dot grids, on the sky, in illustrations or behind charts.
- **Don't** put a border or stroke on a surface; use the glass-edge highlight and soft shadow.
- **Don't** box hero figures or arrange the overview as a grid of boxed bento cards.
- **Don't** use the bulletin colours for categories, chart series, decoration or on/off switches.
- **Don't** add a second typeface, a mono face or uppercase labels.
- **Don't** use text glyphs (arrows, chevrons, check marks) as icons; use Phosphor.
- **Don't** fill primary buttons with deep sky blue or introduce a neon accent.
