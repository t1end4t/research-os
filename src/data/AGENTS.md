# src/data/

Hardcoded fixtures from the AI Studio export. Every tab currently reads from
here. There is no database yet.

## Files

| File | Feeds |
|---|---|
| `initialData.ts` | the question/claim/evidence tree — Graph and Detail |
| `papersData.ts` | full paper documents with sections, paragraphs, left-rail marks |
| `surveyData.ts` | loose open-problem notes and candidate questions |
| `experimentsData.ts` | experiment groups and their artifacts |

## What these are and are not

**These are fixtures, not the schema.** They are shaped for the prototype UI and
carry the drift listed in root `CLAUDE.md` §6 — most importantly, an evidence
item has no `user_reason` of its own. Do not derive the real table design from
these files.

**These are staying for now** (user decision). The eventual source of truth is a
SQLite file inside a user-chosen local workspace folder; the app is an interface
onto that folder. When that lands, these files become seed data and offline
fixtures for evals, not a live read path.

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
