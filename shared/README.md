# shared/

Plain TypeScript used by `client/` (game + admin) and `server/`. **No imports from npm packages**
and no DOM/Node APIs here, so both sides can compile it as-is.

- `game-types.ts` – spec of the 10 mini-game types (`GameSpec`) + display names
- `content-types.ts` – `Chapter`, `LevelDef`
- `scoring.ts` – stars & points rules (server re-computes results with the same code)
- `api-types.ts` – request/response shapes of the HTTP API
- `user-agent.ts` – browser name from a user-agent (error log)
