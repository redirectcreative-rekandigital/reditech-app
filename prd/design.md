---
version: alpha
name: Celestial
description: A black-and-white shadcn/ui theme with a bright aqua primary and black labels on that aqua. by tweakcn.
colors:
  background: "#ffffff"
  foreground: "#000000"
  card: "#f7f8f8"
  primary: "#58d3db"
  primary-foreground: "#000000"
  secondary: "#202020"
  secondary-foreground: "#ffffff"
  muted: "#f1f5f9"
  muted-foreground: "#323232"
  accent: "#e3ecf6"
  accent-foreground: "#323232"
  destructive: "#f4212e"
  border: "#e1eaef"
  input: "#f7f9fa"
  ring: "#58d3db"
  sidebar: "#f7f8f8"
  sidebar-foreground: "#000000"
  sidebar-primary: "#58d3db"
  chart-1: "#58d3db"
  chart-2: "#00b87a"
  chart-3: "#f7b928"
  chart-4: "#17bf63"
  chart-5: "#e0245e"
  dark-background: "#121212"
  dark-foreground: "#e7e9ea"
  dark-card: "#17181c"
  dark-primary: "#58d3db"
  dark-secondary: "#e7e9ea"
  dark-muted: "#1a1d1e"
  dark-muted-foreground: "#8b98a5"
  dark-accent: "#12383b"
  dark-border: "#2f3336"
  dark-sidebar: "#17181c"
  dark-destructive: "#f4212e"
typography:
  display:
    fontFamily: Open Sans
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Open Sans
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Open Sans
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
  body-lg:
    fontFamily: Georgia
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.65
  body-md:
    fontFamily: Georgia
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
  body-sm:
    fontFamily: Open Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Open Sans
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
  sans-ui:
    fontFamily: Open Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: Menlo
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
  section: 64px
  gutter: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: 12px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 12px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 24px
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 12px
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.sidebar-foreground}"
---

# Celestial

A premade shadcn/ui theme by [tweakcn](https://tweakcn.com). Install tokens with `npx shadcn@latest add @shadcnblocks/theme/celestial`, then keep this DESIGN.md in the project root (or `.agents/`) so coding agents stay on-brand.

## Overview

Celestial is a high-contrast theme: white stage, black ink, and a bright aqua primary (`#58d3db`) that reads as a signal. The secondary is near-black (`#202020`) in light mode and pale in dark mode.

It is **crisp, nocturnal, and graphic**. It suits launches and tools that can hold a cyan mark on a stark field.

**Open Sans** leads display and UI. **Georgia** is the reading face. **Menlo** is for code.

Emotional targets: bright, lunar, exact — never a purple galaxy wash, never white text on the aqua.

## Colors

- **Primary (`#58d3db`):** Bright aqua — primary buttons and brand marks. Pair with black text (`#000000`); the aqua is too light for white labels. Dark mode keeps `#58d3db`.
- **Accent (`#e3ecf6`):** Quiet highlight (`#e3ecf6`) with text `#323232` for selected chips.
- **Secondary (`#202020`):** Supporting actions and quiet structure. Text `#ffffff`.
- **Foreground (`#000000`):** Body text. Do not swap it for a random gray.
- **Background (`#ffffff`):** Page stage.
- **Card (`#f7f8f8`):** Content surfaces.
- **Muted (`#f1f5f9`):** Quiet chrome. Muted text is `#323232`.
- **Border (`#e1eaef`):** Structural lines. Prefer these over heavy shadows.
- **Destructive (`#f4212e` / dark `#f4212e`):** Errors only. Keep them distinct from the brand color when the hues differ.
- **Ring (`#58d3db`):** Focus ring.

Dark mode stage is `#121212`, cards `#17181c`, foreground `#e7e9ea`.

## Typography

**Open Sans** leads display and UI. **Georgia** is the reading face. **Menlo** is for code.

- **Display / headlines:** Open Sans SemiBold, tight tracking.
- **Body / reading:** Georgia Regular at 16–18px, line-height about 1.65.
- **UI chrome / labels:** Open Sans Medium or Regular. Sentence case.
- **Mono:** Menlo for code, tokens, and IDs.

Do not replace Georgia in long-form text with the UI sans, and do not set dense tables or nav entirely in the serif.

## Layout

Use the semantic stage, then cards, then one primary action.

- Base spacing is an 8px scale. Section rhythm is about 64px.
- Prefer a readable prose column (~65–75ch) and a wider shell (~1200px) for app chrome.
- One primary action per view.

## Elevation & Depth

Depth is **soft and short**. Let borders and a single filled button carry emphasis.

- Prefer semantic surfaces: background, then card, then the primary action.
- Dark mode elevates with the dark card color, not bright white borders.

## Shapes

Radius is **modest** — base `--radius` is `0.5rem` (8px). Controls stay rounded, not pills.

- Controls: about 6px.
- Cards: about 8px.
- Full pills only for chips and avatars.

## Components

Built for the shadcn/ui token contract. Prefer semantic tokens (`bg-primary`, `text-muted-foreground`) over raw hex in component code.

- **Primary button:** `#58d3db` fill, `#000000` label.
- **Secondary button:** `#202020` fill, `#ffffff` label.
- **Cards:** `#f7f8f8` surface, `#e1eaef` border, padding about 24px.
- **Inputs:** stage or card fill, border `#e1eaef`, focus ring `#58d3db`.
- **Sidebar:** `#f7f8f8` with `#000000` labels. Do not paint the whole nav in primary.
- **Charts:** `#58d3db`, `#00b87a`, `#f7b928`, `#17bf63`, `#e0245e` in that order.

## Do's and Don'ts

**Do**

- Do keep the stage white or near-black and spend aqua on one primary action.
- Do keep black labels on the aqua primary.
- Do keep Open Sans for UI and Georgia for longer reading.
- Do support light and dark with the same aqua.
- Do use shadcn semantic tokens instead of one-off hex in components.

**Don't**

- Don't put white text on the aqua primary.
- Don't flood backgrounds with aqua.
- Don't shift the accent toward purple.
- Don't invent extra brand colors when a token already exists.
