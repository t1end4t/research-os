# src/

React frontend. All of it is still the AI Studio export — see root `CLAUDE.md`
§6 for what that means.

Read root `CLAUDE.md` first. It is the authority on what this app is and what
the assistant may not do. This file only covers how the code here is laid out.

## Read first

- `types.ts` — every shared type. **Known to drift from the real schema; root
  `CLAUDE.md` §6 lists exactly how.** Do not treat it as the data model.
- `App.tsx` (1700 lines) — holds *all* app state: active tab, global selection,
  the graph tree, assistant threads, survey notes. Every pane is a controlled
  child. There is no store, no context, no router.

## Layout

```
App.tsx              all state, tab switching, global selection
types.ts             shared types
theme/nodeColors.ts  node-type tints and link-status colors
data/                hardcoded fixtures (see below)
components/          one pane per tab + shared cards
```

Panes map 1:1 to tabs: `GraphPane` `SurveyPane` `PapersPane` `ExperimentsPane`,
plus `CheckPane` (the Detail middle column) and `AssistantDock` (global right
dock, every tab, `Cmd/Ctrl+J`).

`GraphCanvas` is the layered three-column renderer. **Deterministic layout,
orthogonal elbow edges, no force-directed physics.** Do not swap in a graph
library that simulates.

## Local conventions

- Tailwind 4 utility classes inline. No CSS modules, no styled-components.
- Icons from `lucide-react` only.
- Colors go through `theme/nodeColors.ts` — never hardcode a status hex. Green
  `holds`, amber `weak`, red `missing`.
- `@/` aliases the repo root (`vite.config.ts`), but existing imports are
  relative. Match what the file already does.

## Boundaries

- **No component calls a model directly.** `App.tsx` sends assistant messages
  through `/api/assistant`; provider configuration stays in the server, and no
  key reaches the browser.
- **Any UI that writes a link must block on `user_reason`.** Disabled submit,
  not a validation message after the fact. This applies to `+ Evidence` in
  `PapersPane` and to every add-node path.
- **Never render a text input, placeholder, or "suggest" button that would let
  the model fill a reason field.** Root `CLAUDE.md` §4.

## Gotchas

- `vite.config.ts` disables HMR and file watching when `DISABLE_HMR=true` (an
  AI Studio behavior). If edits do not appear, check that env var.
- Ghost nodes are computed at render time from "claim has no evidence" /
  "question has no claims". They are not in `data/` and must never be stored.
- `App.tsx` is large. Extract only when a specific change needs it — do not
  refactor it as a warm-up.

## Commands

- `npm run dev` — port 3000
- `npm run lint` — `tsc --noEmit`. There is no test runner yet.
