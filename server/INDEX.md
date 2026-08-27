# Server map

Purpose: loopback API and constrained Pi assistant runtime.

Read first:

- `index.ts` — Express/Vite process and API boundary.
- `workspace.ts` — rebuilds dashboard data from Markdown, JSON sidecars, and JSON links.
- `assistant/runtime.ts` — thread isolation, provider wiring, retries.
- `assistant/prompt.ts` — product boundary sent to the model.
- `assistant/schemas.ts` — request and tool schemas.
