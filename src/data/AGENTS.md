# src/data/

Hardcoded fixtures from the AI Studio export. Questions, papers, and survey
data are now seeds for workspace files. Experiments still read from here.

## Files

| File | Feeds |
|---|---|
| `initialData.ts` | seed question/claim/evidence tree |
| `papersData.ts` | seed paper documents, sections, paragraphs, left-rail marks |
| `surveyData.ts` | seed loose open-problem notes and candidate questions |
| `experimentsData.ts` | experiment groups and their artifacts |

## What these are and are not

**These are fixtures, not the schema.** They are shaped for the prototype UI and
carry the drift listed in root `CLAUDE.md` §6 — most importantly, an evidence
item has no `user_reason` of its own. Do not derive the real table design from
these files.

The active workspace now supplies Markdown prose, JSON metadata sidecars, and
JSON links. The eventual source of truth remains versioned local storage inside
that folder. These files stay as seeds and offline fixtures;
`experimentsData.ts` remains the temporary live exception.

## Rules

- Ghost nodes are **not** in here and must never be added. They are computed at
  render time from absence.
- Do not add a project/container field. Projects are tags on questions — root
  `CLAUDE.md` §3.
- Do not add a field here to make a UI change easier without checking it against
  the real model first. Fixture-driven schema growth is how the drift in §6
  happened.
- Evidence entries are **findings**, not papers. If you add one, its title is
  what was found, not who wrote it.
