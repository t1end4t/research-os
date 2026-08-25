# server/

Instrument's loopback-only Node backend. See `INDEX.md` for the file map.

## Boundaries

- Bind only to `127.0.0.1`.
- Model access stays inside `assistant/`; routes never construct providers.
- Pi currently receives one strict `reply` tool declared in `assistant/runtime.ts`.
- No shell, filesystem, arbitrary HTTP, or unrestricted database tool.
- `user_reason` is input-only. No tool schema may contain a writable reason.
- Do not add another tool before the assistant eval runner exists.

## Commands

- `npm run dev` — Express with Vite middleware on port 3000.
- `npm run lint` — TypeScript check.
