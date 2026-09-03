# Instrument — standing instructions

Single-user local research tool. GUI prototyped in Google AI Studio, exported,
now being wired to a real backend and a real LLM.

**The purpose drives every decision in this file:**

> The LLM does not do the user's research. It checks the user's reasoning.

The tool makes the structure of a research argument visible, and makes the weak
parts impossible to ignore. It is not a note-taking app, not a reference
manager, not a chat wrapper.

**Test for any proposed feature:** if it makes the user's work faster by doing
part of it for them, it is probably wrong for this project. Say so.

---

## 1. Data model

Three levels, never deeper. A strict tree.

| Level | Meaning |
|---|---|
| `QUESTION` | What is being asked. Zero or more per graph. Carries tags. |
| `CLAIM` | The user's assertion that answers a question. Several per question. |
| `EVIDENCE` | A finding under a claim, described by independent `origin` and `form` fields. |

Evidence uses the smallest useful vocabulary:

- `origin`: `literature` | `experiment` | `own_reasoning`
- `form`: `measurement` | `derivation` | `counterexample`

These fields exist so the app can show the right provenance, fields and context
to both the user and the assistant. They are not a research taxonomy and do not
determine whether evidence is valid or whether its link holds. Add a new value
only when a real evidence record cannot be represented without losing
information; do not add speculative or catch-all values.

Evidence with `origin = experiment` references an experiment. An experiment has
status `planned` / `running` / `done` and owns artifacts (plots, tables, notes).

Evidence with `form = derivation` has a validity assessment independent of its
link status:

- `validity`: `unassessed` | `valid` | `invalid` | `uncertain`
- `validity_reason`: required unless validity is `unassessed`

Only the user may set or change derivation validity. Each change is versioned,
never overwritten. An invalid derivation neither supports nor contradicts its
claim, but remains in history. The assistant checks the derivation→claim link
conditionally: **if the derivation is valid**, do its conclusion, scope and
target support the claim? It may expose structural mismatches, but it must not
declare a proof or derivation correct.

A **ghost node** is rendered where a claim has no evidence, or a question has no
claims. It is a rendering of absence, **not a stored row**. No ghost table, no
ghost id, no "dismiss ghost".

### Evidence is a finding, not a paper

`Olshausen & Field 1996` is **not** evidence. `Sparse codes emerge from image
statistics` is.

One paper produces several findings, and some may cut against the claim. If
anyone proposes making the node the paper itself, **refuse and explain why**:
paper-as-node collapses distinct findings into one row and hides the ones that
contradict the claim.

### The link is the product

Every node except a question has exactly one link to its parent. The link
carries:

| Field | Rule |
|---|---|
| `user_reason` | Why the user believes the child supports the parent. **REQUIRED. Written by the user. Never by the LLM.** |
| `status` | `holds` \| `weak` \| `missing` |
| `check_note` | The LLM's finding on this link |

**A link with no `user_reason` cannot be checked.** Enforce in the UI *and* in
the API. An API that accepts a link without a reason is a bug, not a
convenience.

---

## 2. The surfaces

These are the jobs the interface must do, not a commitment to five separate
tabs. Layout may change; the jobs and their refusals may not.

### THE MAP
One continuous, zoomable space that holds the whole argument. It absorbs the
jobs previously split between GRAPH and DETAIL: seeing where the argument is
broken, and working on one link.

- Layout is **deterministic** — layered, orthogonal elbow edges, **no
  force-directed physics**. The same graph must look the same on every open, or
  two viewings cannot be compared.
- Zoom changes detail, not location: far shows shape and edge colour, mid adds
  question and claim text, near reveals evidence, the user's reason and the
  check. Moving between overview and detail is a zoom, not a navigation.
- **The link carries the visual weight.** Nodes are near-grayscale and ranked by
  size and weight alone: question largest, claim medium, evidence smallest.
  Status colour appears **only** on links — green `holds`, amber `weak`, red
  `missing` — so colour always means exactly one thing.
- Weak and missing links are drawn heavier than sound ones, so a healthy
  argument is visually quiet and a broken one is loud without needing a filter.
- **Links are selectable.** Selecting a link opens the working view: the user's
  reason first, then the model's finding, the three-row Type / Scope / Target
  table marked Pass / Partial / Mismatch, then the actions *Weaken claim*,
  *Add experiment*, *Reject*.
- Ghosts render as dashed, unfilled absence, never as an unfilled node.
- Filter row: `All | Weak only | Missing only`.

Answers exactly one question: *where is my argument broken?*

### SURVEY
For when there is no question yet. Prefer a visual field over lists or tables:

- Loose open-problem notes are objects in one spatial field. Each is one line in
  the form "what is still open here?", has a source and has no parent.
- Candidate questions appear as visible group boundaries around accepted note
  clusters, not as a separate column that disconnects the candidate from its
  material.
- Unconnected clusters stay visibly separated. The app may show the absence of
  a bridge; it must not generate one.
- The layout is stable enough that returning to the survey preserves the user's
  mental map. Do not use decorative random motion as a substitute for structure.

A candidate is promoted to a real `QUESTION` only after the user writes a claim
that answers it **and** confirms the claim could be false **and** could be
settled within a year.

**Hard stop at 15 loose notes with fewer than 3 candidates: no new notes until
three candidates exist.** This is deliberate friction, not a bug. Do not remove
it, do not add an override flag, do not make it a warning toast.

Promotion is one-way. There is no demote.

### PAPERS
A reader. Multiple papers open as tabs, each keeping its own scroll, zoom, and
assistant thread.
- Selecting text raises a floating toolbar: `Ask`, `+ Evidence`, `Highlight`.
- `+ Evidence` creates an evidence node under a chosen claim and **requires a
  one-line reason before it can be created.**
- A left rail marks passages already linked into the graph.

The reader's purpose is to produce nodes. **A reading session that produces no
node has produced nothing.**

### EXPERIMENTS
A gallery of artifacts — plots, tables, notes — grouped under **the claim each
experiment tests**, not under the experiment alone. This keeps every artifact
one click from the claim it was supposed to test, and makes an experiment that
tests something else visible.
- Filter by status.
- Clicking an artifact opens an overlay with a required field: *"What did this
  show?"*

---

## 3. Projects

**There is NO project container and no project level in the tree.**

Projects are **tags on questions**. A project view is a saved filter. A tag
dropdown in the top bar filters every surface.

This is deliberate. Separate containers would partition the graph, and the
highest-value observation the tool can make is that **a claim in one topic is
the same claim as in another**. Do not propose adding a project entity.

---

## 4. The assistant

One global dock on the right, available on every surface, resizable by dragging
its left edge, toggled with `Cmd/Ctrl+J`. **Not per-surface.** The dock is a
drop target for visible research objects: nodes, links, paper passages,
experiments and artifacts. Dropping an object makes it explicit context; it does
not grant the model new permissions.

### Context and threads
The dock follows the app's selection or an explicit drop. Context chips above
the input show exactly what it is looking at: whole graph, a node, a link, a
paper or passage, an experiment or artifact, or the survey pile. Each context
has its own thread, and threads persist. Switching context switches the
transcript; **it never appends across contexts.**

Dropping a link is the primary assistant gesture. If it has a `user_reason`, the
dock may offer the existing Type / Scope / Target check. If it has no reason,
the dock shows that absence and refuses the check; it never offers to fill the
reason. Unsupported dropped combinations remain visible as context but do not
expand the assistant's MAY list.

### MAY do
- **Check a link.** Given parent, child, and the user's reason, decide whether
  the child supports the parent. Exactly three checks:
  - `Type` — claim is causal, evidence is correlational
  - `Scope` — evidence holds in a narrower setting than the claim
  - `Target` — the experiment measures something other than the claim

  Return a status and a short finding. **Nothing else.**
- **Edit graph structure on instruction.** Five operations only — add, move,
  rename, split, delete — as structured output. Show each edit as a confirmation
  line with an Undo link.
- **Cluster loose survey notes** into proposed groupings for the user to accept
  or reject.
- **Answer questions about an open paper.**

### MUST NOT do
- **Write or edit any `user_reason` field, anywhere.** This is the single most
  important rule in the project. The check is only meaningful because the user
  committed a reason first; if the model writes it, the model grades its own
  work and the whole tool becomes decoration. If a user asks for it, refuse in
  the transcript.
- Write the promote claim or tick the promote checkboxes.
- **Summarize a paper.** Summarizing replaces the reading that produces
  understanding.
- Invent a claim, a paper, or a finding the user did not state.
- **Generate "interesting research questions" from a topic.** Questions must
  come from structure — an unsupported claim, an unresolved mismatch, a cluster
  of open problems — never from a topic prompt.
- Set or change a link status without the user's reason present.
- Set or change derivation validity, or declare a proof/derivation correct.

### Model configuration
- The assistant runtime is `@earendil-works/pi-agent-core`, connected to
  9router through its OpenAI Responses-compatible endpoint.
- **Pin the assistant model in server config.** No fallback chain, automatic
  model selection, or client-supplied model id. Behaviour must be reproducible
  or the eval set is meaningless.
- Agent loops are allowed only inside the assistant server and are bounded to
  four model turns per user message. Each app context owns one isolated agent
  thread; messages never cross contexts.
- The model may call only TypeBox-validated Instrument domain tools. The server
  exposes no shell, filesystem, general network, code execution, unrestricted
  database, or arbitrary HTTP tool.
- Every accepted assistant result must arrive through a strict domain tool
  schema. Reject malformed tool arguments. Retry once when no valid result is
  produced, then return an error without applying an edit.
- Prompt instructions explain refusals, but they are not the enforcement
  boundary. Tool and API schemas must make forbidden actions impossible: no
  writable `user_reason`, promotion decision, observation or derivation-validity
  field may be exposed to the model.
- At most one mutating graph tool may succeed per user message. Mutations remain
  explicit, versioned application operations with a confirmation line and Undo;
  the model never writes storage directly.
- **Record the model id on anything the model produced**, so the user can later
  filter to only what they asserted themselves.

### Provenance labelling

Every stored authored-content or history record identifies its author:

- `user` — the person asserted it. Every `user_reason`, observation, validity
  decision and promotion is always `user`.
- `system` — a mechanical application action such as an import or a locator
  update. It carries no research judgement.
- `model:<id>` — produced by the assistant, stamped with the pinned model id.

When content is known to be model-produced but the model is unknown, label it
`model:unknown`. Never stamp the pinned model id onto content it did not
produce; a filter for "only what I asserted" is worthless if provenance is
guessed. Absent data stays absent — the app renders it as empty rather than
inventing a default value.

---

## 5. Standing rules

1. When a proposed feature would remove friction, check first whether that
   friction **is** the mechanism. Required reason fields, the 15-note stop, and
   the promote test are all deliberate.
2. **Prefer refusing a feature to weakening the model boundary in §4.**
3. Storage is SQLite, one file, local. No auth, no accounts, no remote server.
   Bind to `127.0.0.1` only.
4. Positions and links are **versioned, not overwritten**. A change of mind is a
   new row with a reason. **The history is the product.**
   External artifact locations are also versioned: path is a locator, never the
   artifact's identity.
5. After the initial chat bootstrap, before changing any prompt, run the eval set and record the score against a
   hash of the prompt file. **Prompt changes without an eval run are not
   accepted.**
6. If something in this file conflicts with a later instruction, **say so**
   rather than silently choosing one.

---

## 6. Stack and current state

TypeScript only. No Python in this repo.

| Layer | Choice |
|---|---|
| UI | React 19, Vite 6, Tailwind 4, `lucide-react`, `motion` |
| Backend | Node + Express, TypeScript. Express hosts Vite middleware in dev. `127.0.0.1` only. |
| Storage | SQLite, one file, inside the active workspace folder |
| LLM | `@earendil-works/pi-agent-core` via 9router; pinned `cx/gpt-5.6-sol` |

**Current state:** the prototype implementation has been deleted deliberately.
The repository now holds the specification (`AGENTS.md`, `docs/`) and a sample
research workspace (`workspace/`) only. There is no application code, no build
config and no dependency manifest; the GUI is being rebuilt from scratch rather
than patched, because the prototype's visuals no longer match the decided
design. The deleted code remains in git history if a detail needs recovering.

The next build starts from the front end. It may use local fixture data shaped
like `workspace/` and must not fake an assistant that violates §4. Backend,
SQLite persistence, migration and real model calls come after, following
`docs/storage-design.md`.

The visual system, interaction model, SQLite tables and migration are decided
but not yet built. Read `docs/gui-design.md` and `docs/storage-design.md` before
implementing UI or persistence; `docs/decisions.md` records why. This file still
wins on any conflict.

Root `CLAUDE.md` is a compatibility pointer to this file. **This file
(`AGENTS.md`) is the authority.**

### Workspace folders

The app is an **interface only**. Research data lives in a local folder on disk
that the user points the app at, and there can be several such folders (one per
project-of-work).

Reconciling this with rule 3 ("SQLite, one file"): **one SQLite file per
workspace folder**, opened one at a time. The app never merges two workspaces
and never holds two open at once.

Note this is a real tension with §3 — a workspace folder *is* a container, and
containers partition the graph. Resolution: **tags remain the only within-graph
grouping.** A workspace is where the file lives, not a level in the tree. If a
feature request starts treating a workspace like a project entity (cross-
workspace queries, a workspace switcher inside the graph view, a workspace
column in the tree), that is the §3 violation arriving by the back door.
Refuse it and refer to this paragraph.

### External artifact identity

Run artifacts remain as files in the workspace; their bytes are not copied into
SQLite. Each artifact is an immutable Instrument record with:

- an app-generated `artifact_id`;
- the `run_id` that produced it;
- a SHA-256 `content_hash` for the exact file contents;
- a workspace-relative path used only as a locator;
- its media type and creation time.

Moving a file without changing its hash keeps the same artifact and creates a
new locator version. Changing the bytes, even at the same path, creates a new
artifact; observations never transfer automatically to the new content. If the
file is missing, retain the artifact metadata, locator history, provenance and
user observation. Reconnecting a file requires a matching hash.

The first implementation supports one file per artifact, not directory or
dataset hashing. Filename and path are never identity, and the content hash is
an integrity identity for the bytes rather than the database primary key.

---

## 7. LLM decisions

- **Provider and model:** 9router through the OpenAI Responses-compatible API.
  The server pins `cx/gpt-5.6-sol`; no fallback or model router exists inside
  Instrument. 9router routing is an external transport concern.
- **Package:** `@earendil-works/pi-agent-core`. Do not use the renamed legacy
  `@mariozechner/*` packages or `@google/genai`.
- **Credentials:** the server optionally reads `NINEROUTER_API_KEY` and
  `NINEROUTER_BASE_URL`; the browser receives neither. The default base URL is
  `http://127.0.0.1:20128/v1`, which currently accepts keyless local requests.
- **Eval location:** deferred until capabilities expand beyond chat. Put the
  runner and cases in `evals/assistant/` before the next prompt change.

### Assumptions in force (correct these if wrong)

These were inferred from the brief, not stated in it. They are load-bearing for
schema design.

1. **"Positions"** in rule 4 means a node's place in the tree (its parent), not
   layout coordinates — the graph layout is deterministic and there is no
   dragging. Every reparent is a new row with a reason.
2. **`check_note`** is one row holding the whole check result: the short finding
   plus the three Type/Scope/Target verdicts. Versioned per run, stamped with
   the model id.
3. **The 15-note stop** counts *unclustered* loose notes. A note that belongs to
   a candidate no longer counts, otherwise the stop can never be cleared.
4. **Survey note sources** are free text, not a foreign key to a paper.
5. **Tags** are free-form strings. No tag entity, no rename cascade.
6. **The artifact overlay's required "What did this show?"** is required at
   status `done`. A `planned` experiment has no result to describe yet.
7. **"Reject"** on a claim is a soft flag that preserves history, never a delete.
   Rule 4 makes deletion of a rejected claim wrong.

### Known schema drift

`src/types.ts` is the prototype's shape and does **not** match this brief. When
the real schema is built, the brief wins:

- `CheckItem.status` has five values (`aligned | partial | mismatch | missing |
  unverified`); the brief specifies three (Pass / Partial / Mismatch).
- `ClaimCheck` carries cosmetic `tag` / `tagColor` fields with no model meaning.
- **`EvidenceItem` has no `user_reason`.** The reason currently lives on
  `ClaimCheck.reasonText`, i.e. at claim level only — so an evidence→claim link
  cannot presently carry its own reason. This directly contradicts §1 and is the
  most important drift to fix.
- There is no versioning anywhere; every prototype edit overwrites.
