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
| `EVIDENCE` | Sits under a claim. Kind `paper` or `experiment`. |

An `experiment` has status `planned` / `running` / `done` and owns artifacts
(plots, tables, notes).

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

## 2. The tabs

### GRAPH
Read-only overview of the whole tree.
- Layered left to right in three columns. Orthogonal elbow edges. **No
  force-directed physics.**
- Cards tinted by node type. Edges and the card's left bar colored by link
  status: green `holds`, amber `weak`, red `missing`.
- Filter row: `All | Weak only | Missing only`.
- Clicking a node sets the global selection and routes by type: question or
  claim → Detail, paper → Papers, experiment → Experiments.

Answers exactly one question: *where is my argument broken?*

### DETAIL
The working view. Three columns.
- **Left:** the tree, indented, selected claim outlined.
- **Middle:** the link check for the selected claim — user's reason at top, then
  the LLM's finding, then a verification table of three rows (Type, Scope,
  Target) each marked Pass / Partial / Mismatch, then actions: *Weaken claim*,
  *Add experiment*, *Reject*.
- **Right:** the assistant dock.

### SURVEY
For when there is no question yet. Two columns.
- **Left — OPEN PROBLEMS:** loose one-line notes, form "what is still open
  here?", each with a source. No parent.
- **Right — CANDIDATE QUESTIONS:** groupings of those notes.

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
dropdown in the top bar filters every tab.

This is deliberate. Separate containers would partition the graph, and the
highest-value observation the tool can make is that **a claim in one topic is
the same claim as in another**. Do not propose adding a project entity.

---

## 4. The assistant

One global dock on the right, available on every tab, resizable by dragging its
left edge, toggled with `Cmd/Ctrl+J`. **Not per-tab.**

### Context and threads
The dock follows the app's selection. A context chip above the input shows what
it is looking at: whole graph, a claim, a paper, an experiment, or the survey
pile. Each context has its own thread, and threads persist. Switching context
switches the transcript; **it never appends across contexts.**

### MAY do
- **Check a link.** Given parent, child, and the user's reason, decide whether
  the child supports the parent. Exactly three checks:
  - `Type` — claim is causal, evidence is correlational
  - `Scope` — evidence holds in a narrower setting than the claim
  - `Target` — the experiment measures something other than the claim

  Return a status and a short finding. **Nothing else.**
- **Edit graph structure on instruction.** Four operations only — add, move,
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

### Model configuration
- **Pin one model per feature in config.** No router, no fallback chain, no
  automatic model selection. Behaviour must be reproducible or the eval set is
  meaningless.
- Every AI call is **single-shot** with a **strict JSON output schema**,
  validated on receipt, **one retry on parse failure**. No agent loops. No tool
  use. No filesystem or shell access from the model.
- **Record the model id on anything the model produced**, so the user can later
  filter to only what they asserted themselves.

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
5. Before changing any prompt, run the eval set and record the score against a
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
| Backend | Node + Express, TypeScript. Vite proxies `/api` to it. `127.0.0.1` only. |
| Storage | SQLite, one file, inside the active workspace folder |
| LLM | **Undecided — see §7** |

**Current state:** the repo is still the AI Studio export. `src/App.tsx` holds
all state. Every tab reads hardcoded fixtures from `src/data/*`. There is no
server, no SQLite, no `/api`, no real model call. `@google/genai` is in
`package.json` from the export but is not a committed decision.

`README.md` is AI Studio boilerplate and is stale. Root `AGENTS.md` is a Nix
template stub about `docs/` bridging — unrelated to this project. **This file
(`CLAUDE.md`) is the authority.**

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

---

## 7. Open decisions

Do not implement past a line marked **OPEN** without asking.

- **OPEN — LLM provider and pinned model ids.** Not decided. When taken, the
  decision must satisfy §4: one pinned model per feature, strict JSON schema,
  single-shot, model id recorded on every produced row. Structure the
  integration so the provider sits behind one narrow module and the four
  features (link check, structure edit, survey clustering, paper Q&A) each name
  their own pinned model in config. `@google/genai` being installed is an
  artifact of the export, not a choice.
- **OPEN — where the API key lives.** It must never reach the browser. Server
  reads it from env; the client calls `/api`.
- **OPEN — eval set location and runner.** Rule 5 requires one but does not
  place it. Nothing exists yet.

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
