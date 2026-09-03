# Mordheim Combat Probability Simulator

A browser-based, client-only calculator for Mordheim combat odds — exact probability via
combinatorics, no dice-rolling simulation. Built from a full project brief (see `NOTES.md` for
open items and judgment calls made along the way).

## What it does

- Exact Hit %, Wound %, and Injury-chart probability tables (full WS×WS and S×T grids).
- A per-phase "chance to take the target Out of Action" calculation that correctly handles the
  one-critical-hit-per-phase rule and the defender's single Parry across multiple attacks (see
  `src/engine/turnAggregate.ts`), two-wound critical hits (two Injury rolls, highest applies),
  helmets, weapon armour-save modifiers, poison and the rest of the weapon special rules.
- A Stat Gain Analyser (what does +1 WS/BS/S/T/A do, both attacking and defending?) and a Skill
  Gain Analyser (ranks the skills a warrior can actually take, attacking or defending, with the
  Knocked Down / Stunned / Out of Action split).
- Character/warband persistence in `localStorage`, with JSON import/export. No backend, no
  accounts.

## Scope

One phase at a time (the shooting phase or the hand-to-hand phase), against a fresh target with
its full Wounds. Multi-Wound targets are modelled: Injury is only rolled once every Wound is gone,
and two-wound critical hits count double. Not modelled: what happened in earlier turns, who strikes
first, psychology, and pistols used as close-combat weapons. See `NOTES.md` for the decisions.

## Development

```bash
npm install
npm run dev      # dev server
npm test         # or: npx vitest run
npm run build    # production build to dist/
```

The engine's trickiest logic (crit consumption across multiple attacks, two-wound crits, Parry,
weapon save modifiers) has hand-verified unit tests in `src/engine/__tests__/` — start there if
you're auditing correctness. `REVIEW-BETA-READINESS-2026-09-03.md` records the audit that drove the
current rules behaviour, and `NOTES.md` the decisions made along the way.

## Deployment

Two targets, same source:

- **Netlify** (or any static host) — `npm run build` produces the normal multi-file `dist/`.
- **Claude Artifact** — `npm run build:artifact` produces a single self-contained
  `artifact/mordheim-simulator.html` (via `vite-plugin-singlefile` + `scripts/build-artifact.mjs`,
  which strips the `<html>/<head>/<body>` wrapper Artifact pages don't want) — a persistent,
  bookmarkable URL that doesn't need a dev server or a Netlify account, useful as a fast interim
  deploy. Its "Export all data as JSON" button uses the `downloads` runtime capability when running
  inside the Artifact sandbox (a plain browser download link is silently blocked there), falling
  back to a normal browser download everywhere else — see `state/storage.ts`.
