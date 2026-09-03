# Google AI Studio prompt — GUI rebuild

Prepared: 2026-09-03

Paste the text below into Google AI Studio after uploading this repository.

---

You are rebuilding the **Instrument Research OS GUI from scratch**. The previous
application implementation was deliberately deleted because this is a visual
and interaction redesign, not a refactor.

## Read before writing code

Read these repository files in this order:

1. `AGENTS.md` — authoritative product rules. Never violate it.
2. `docs/gui-design.md` — authoritative visual and interaction specification.
3. `docs/decisions.md` — accepted decisions and reasoning.
4. `docs/gate-map.md` — deliberate friction and transition gates.
5. `docs/research-forms.md` — research forms and failure modes.
6. `docs/storage-design.md` — future data shape; use it only to shape frontend
   types and adapter boundaries in this phase.
7. `workspace/` — sample research content. Use this content instead of generic
   lorem ipsum or invented scientific claims.

If a document conflicts with `AGENTS.md`, follow `AGENTS.md` and report the
conflict instead of silently choosing.

## Scope of this build

Build a polished, functional, **frontend-only** desktop GUI prototype.

- Create a fresh React 19 + Vite 6 + TypeScript + Tailwind 4 project.
- Use `lucide-react` for icons and `motion` only for the small motion budget in
  `docs/gui-design.md`.
- Do not build Express, SQLite, migrations, authentication, accounts or remote
  services yet.
- Do not call Gemini, OpenAI, 9router or any other model API. Do not expose an
  API key in the browser.
- The assistant dock is a faithful interactive mock: context switching,
  separate local threads, drag/drop states, imported model notes and refusal
  states must work, but there is no fake network request and no claim that a
  real model is running.
- Use an explicit typed data adapter and fixture layer derived from `workspace/`
  so the backend can replace it later without rewriting the UI.
- Do not modify `AGENTS.md` or the design documents.

## Product thesis

The model does not do the user's research. It checks the user's reasoning.

The GUI has one dominant job:

> Make the structure of the argument, its weak links and its missing parts
> visible before the user reads the details.

This is not a dashboard, note-taking app, reference manager, chatbot wrapper or
project-management board. Avoid generic SaaS cards, metric tiles, gradients,
large rounded rectangles, glassmorphism and decorative animation.

## Application shell

Build four surfaces in a narrow left rail:

1. **Map** — the default and dominant surface.
2. **Survey** — spatial open-problem notes and candidate clusters.
3. **Papers** — focused reader and evidence capture.
4. **Experiments** — claim-centric artifact gallery.

There is no separate Detail navigation item. Detail is the selected-link state
inside Map.

Use this desktop layout:

```text
┌──────────────────────────── top bar ─────────────────────────────┐
│rail│                                                              │
│ 48 │                         main surface                │ dock   │
│ px │                                                     │ 360px  │
│    ├──────── selected-link inspector, when needed ───────┤        │
└───────────────────────────────────────────────────────────────────┘
```

Top bar: Instrument wordmark, workspace name, tag filter, link-status filter,
search, theme toggle and assistant-dock toggle.

The assistant dock is global, resizable from 300px to 50% of the window and
toggled with Cmd/Ctrl+J. Below 1100px it overlays the right side rather than
crushing the main canvas.

## Visual system

Use these exact light-mode tokens:

```text
paper       #E8EAE6
surface     #F3F4F1
ink         #14181C
ink-muted   #5C6570
rule        #C9CCC5
holds       #3F7D58
weak        #B8862F
missing     #B4442E
```

Also implement a dark theme using the values specified in
`docs/gui-design.md`. Do not introduce another accent hue.

Typography encodes provenance:

- **Newsreader serif:** user-authored question, claim, reason and observation.
- **Public Sans:** interface chrome, buttons, labels and evidence metadata.
- **IBM Plex Mono:** model-produced content, always with a hatched left edge and
  visible model-id stamp such as `[model:unknown]` or `[cx/gpt-5.6-sol]`.

Never render model text like user prose.

Use 2px corner radii, hairline borders and no card shadows. Do not use gradients.
The memorable visual signature is the **load-bearing edge**, not the card.

## Map surface

Render a deterministic left-to-right strict tree:

```text
QUESTION → CLAIM → EVIDENCE
```

- Use orthogonal elbow SVG edges. No force-directed layout and no random node
  positions.
- Nodes are near-grayscale. Encode hierarchy using size and typography:
  Question largest, Claim medium, Evidence smallest.
- Status color appears only on edges and edge-status chips. Never tint node
  cards by status.
- `holds`: 1px solid, 50% opacity.
- `weak`: 2px solid and clearly visible.
- `missing`: 2px dashed `6 4`, visually loudest.
- unchecked: 1px neutral dotted line. Do not make unchecked resemble weak.
- Give edges a transparent 12px hit target so they are easy to select.
- A ghost is an unfilled dashed absence for a question with no claims or claim
  with no evidence. It is not a normal card and has no menu or dismiss action.

Implement pan, Fit, +/- controls and semantic zoom:

```text
SHAPE      zoom < 0.55   node blocks and edges only
STRUCTURE  0.55–1.3      question/claim text; evidence becomes compact
WORKING    zoom > 1.3    evidence details and relation affordances
```

Zoom changes detail, never layout. Transitions are a 120ms fade and disappear
under reduced-motion preferences.

Clicking a node highlights its connected component. Clicking an edge selects
the relationship and opens a bottom inspector without navigating away.

The selected-link inspector must present information in this order:

1. Parent and child.
2. User reason, in serif, visually dominant.
3. Derivation or run validity when applicable.
4. Model finding in mono with model id.
5. Type / Scope / Target verdicts: Pass / Partial / Mismatch.
6. Actions: Weaken claim, Add experiment, Reject.

When a relation has no user reason, show an explicit empty state: “This link has
no reason, so it cannot be checked.” Do not supply an example reason and do not
offer AI completion.

Use the real sample questions, claims, evidence and links from `workspace/`.
Preserve their text and reasons. Imported checks may be displayed as frozen
historical model notes labelled `[model:unknown]`, not as current checks.

## Survey surface

Build one stable spatial field, not two columns and not a table.

- Open-problem notes are compact one-line objects with their sources.
- Accepted candidate questions are translucent boundary regions around their
  member notes, with the candidate label on the boundary.
- Keep disconnected clusters visibly separated. Never draw a suggested bridge.
- Make positions deterministic and stable across reloads.
- Use the real open problems and candidate memberships from `workspace/survey/`.
- At 15 unclustered notes with fewer than three candidates, replace the add-note
  control with a permanent blocked state explaining the gate. No toast and no
  override button.
- Promotion is one-way and requires a user-written claim plus both falsifiability
  and one-year confirmations. The mock UI must not tick them automatically.

## Papers surface

Create a calm reader with multiple paper tabs. Each paper preserves its own
scroll position, zoom and assistant context.

- Use the Markdown papers in `workspace/papers/` as reader content.
- Selecting text raises a small floating toolbar: Ask, + Evidence, Highlight.
- + Evidence opens a capture slip that asks for a finding, target claim and a
  required one-line user reason. Creation remains disabled until the reason is
  present.
- The left rail marks passages already linked into the graph.
- A paper is never an evidence node; the captured finding is the evidence.
- Do not add a “Summarize” action anywhere.

## Experiments surface

The sample workspace contains no real experiment data. Show an honest empty
state grouped beneath the relevant claim structure instead of inventing results.

Design the empty and planned states so a future implementation can show:

- Planned / Running / Done status filter.
- Artifacts grouped under the claim the experiment tests.
- A visible Question → Claim → Experiment breadcrumb back to the map.
- Artifact detail overlay with required user field: “What did this show?”
- Artifact moved / replaced / unavailable states.

Do not generate a result, observation or research finding for visual decoration.

## Assistant dock and drag/drop

The dock follows selection or explicit drag/drop. Context chips show exactly
what is attached: graph, node, link, passage, experiment or artifact. Each
context has a separate local transcript; switching context never merges
messages.

Objects are not draggable for graph positioning. Show a dedicated drag grip on
hover/focus; edges have a midpoint grip.

- Drop a link: show the Type / Scope / Target check affordance if a user reason
  exists; otherwise show the refusal state.
- Drop a paper passage: allow a mock question about that passage.
- Drop an artifact: show it beside the claim it tests, but never write the
  observation.
- Multiple unsupported objects may remain visible as context, but do not infer
  or generate a bridge between them.

The frontend mock must embody the real enforcement boundary:

- No writable model control for `user_reason`.
- No model control for promotion checkboxes.
- No model control for observations or derivation validity.
- No client-supplied model selector.
- Refusal copy explains the missing structure and stops.

## Interaction quality

- Keyboard: Cmd/Ctrl+J dock, `/` search/filter, Esc clear selection, Tab through
  nodes in layout order, Enter open the selected relationship.
- Strong visible focus states.
- Full reduced-motion support.
- Only three motions: semantic-zoom fade 120ms, dock open/close 160ms and
  confirmation-line appearance 90ms.
- No typewriter effect, ambient drift, parallax, bouncing or hover scale.

## Architecture and quality bar

- Use strict TypeScript domain types matching `AGENTS.md`, not the deleted
  prototype shape.
- Do not put all state in `App.tsx`. Split shell, map, inspector, survey, reader,
  experiments, assistant dock and fixture adapter into focused modules.
- Keep fixture data separate from components.
- Derive map layout from data. Do not hardcode a screenshot with absolute
  positions per record.
- All main interactions must work: surface switching, pan/zoom/Fit, edge
  selection, filters, dock toggle/resize, drag/drop context, separate threads,
  paper tabs, text-selection toolbar and required-field gates.
- The app should feel like a serious local scientific instrument: quiet,
  precise, information-dense and visually distinctive because relationships
  carry weight.

Before finishing, run the build/typecheck and inspect the rendered GUI at
approximately 1440×900. Fix overflow, clipping, crossed edges, unreadable text,
weak focus states and any visual choice that makes nodes louder than links.

Return the complete working frontend project, not a screenshot or static mockup.

