# Server map

Purpose: loopback API and constrained Pi assistant runtime.

Read first:

- `index.ts` — Express/Vite process and API boundary.
- `assistant/runtime.ts` — thread isolation, provider wiring, retries.
- `assistant/prompt.ts` — product boundary sent to the model.
- `assistant/schemas.ts` — request and tool schemas.
