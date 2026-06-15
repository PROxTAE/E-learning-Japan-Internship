---
name: start-system-build
description: Boot the whole E-Learning stack in PRODUCTION (build) mode with public Cloudflare URLs. Use when the user wants to "run build", "run the system in production", "build and start", "รันแบบ build", "รัน production", or expose a production build via trycloudflare tunnels. Like start-system but the frontend is compiled with `next build` and served with `next start` instead of `next dev`. Order: backend → backend tunnel → inject backend URL into frontend env → `next build` → `next start` → frontend tunnel → wire frontend URL back → report both public URLs.
---

# start-system-build

Production-mode counterpart of [[start-system]]. Same topology and tunnel wiring, but the
frontend is **compiled** (`next build`) and served with `next start` instead of `next dev`.

> **Critical difference from dev mode:** Next.js inlines every `NEXT_PUBLIC_*` value into the
> bundle at **build time**, not at server start. So both `NEXT_PUBLIC_API_URL` (backend tunnel)
> and `NEXT_PUBLIC_FRONTEND_URL` (frontend tunnel) must be written into `frontend/.env.local`
> **before** `next build` runs. Because the frontend tunnel URL is only known *after* the
> frontend is reachable, this skill builds with a placeholder loop: see step ordering below.
> You cannot "restart to pick up an env change" the way dev mode can — a changed
> `NEXT_PUBLIC_*` requires a **rebuild**.

## Topology

| Service  | Dir         | Build cmd      | Start cmd        | Local port |
|----------|-------------|----------------|------------------|------------|
| Backend  | `backend/`  | (none)         | `npm start`      | 5000       |
| Frontend | `frontend/` | `npm run build`| `npm start`      | 3000       |

Env wiring (identical to dev):
- `frontend/.env.local` → `NEXT_PUBLIC_API_URL` = **backend** public URL
- `frontend/.env.local` → `NEXT_PUBLIC_FRONTEND_URL` = **frontend** public URL
- `backend/.env` → `FRONTEND_ENDPOINT` = **frontend** public URL (CORS allow-origin)

`cloudflared` binary: `C:\Program Files (x86)\cloudflared\cloudflared.exe`

## Procedure

Run each long-lived process with `run_in_background: true` (Bash tool). Capture each
background task's id so you can read its output later. `next build` is **not** long-lived —
run it foreground and wait for it to finish.

### 1. Start backend
```
npm start --prefix backend
```
(`npm start` = `node src/server.js` — no nodemon, no auto-reload.)
Wait until the log prints `Server running at http://0.0.0.0:5000` before continuing.

### 2. Start backend Cloudflare tunnel
```
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5000
```
Poll the background task's output until a `https://<...>.trycloudflare.com` line appears,
then extract it (regex `https://[a-z0-9-]+\.trycloudflare\.com`). Call it **BACKEND_URL**.

### 3. Start the frontend tunnel EARLY (so its URL is known before the build)
Unlike dev mode, we need **FRONTEND_URL** before building, because it is inlined at build
time. Start a tunnel pointed at the (not-yet-running) frontend port now:
```
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
```
The tunnel URL is assigned immediately and is stable for the life of this process, even
though `localhost:3000` will 502 until `next start` is up. Poll its output for the
`https://<...>.trycloudflare.com` URL. Call it **FRONTEND_URL**.

### 4. Write ALL env values before building
Now both URLs are known, so write every env value up front:

`frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=<BACKEND_URL>
NEXT_PUBLIC_FRONTEND_URL=<FRONTEND_URL>
```
(Replace existing values — do not append duplicate lines.)

`backend/.env`:
```
FRONTEND_ENDPOINT=<FRONTEND_URL>
```
Backend reads `FRONTEND_ENDPOINT` for CORS. Since the backend started in step 1 before this
value was written, **restart the backend** (stop the step-1 task, run `npm start --prefix
backend` again) so CORS accepts the frontend origin. The backend tunnel from step 2 keeps
working across a backend restart — do **not** restart the tunnel, only the node process.

### 5. Build the frontend
```
npm run build --prefix frontend
```
Run foreground. Wait for it to finish successfully (`✓ Compiled` / route table printed,
exit code 0). If the build fails, fix the error and rerun — do not start a stale build.

### 6. Start the frontend (production server)
```
npm start --prefix frontend
```
(`npm start` = `next start`, serving the compiled `.next` build on port 3000.)
Wait until it prints its `Local: http://localhost:3000` / `Ready` line. The tunnel from
step 3 now resolves to a live server.

### 7. Report
Print clearly to the user:
```
✅ ระบบพร้อมใช้งาน (production build)
Frontend (เปิดอันนี้): <FRONTEND_URL>
Backend API:           <BACKEND_URL>
```

## Notes & gotchas
- **The big one:** any change to a `NEXT_PUBLIC_*` value (i.e. either tunnel URL) requires a
  **`next build` rerun**, not just a restart. That's why step 3 captures the frontend tunnel
  URL *before* the build. Never `next start` a build that was compiled with a stale URL.
- **Quick tunnels are ephemeral**: every restart = new URL. Always re-run the full order;
  never reuse an old `trycloudflare.com` URL from a previous session or the committed env files.
- Keep the three long-lived background tasks alive (backend, backend tunnel, frontend tunnel)
  plus the frontend server. If a tunnel dies, its URL is gone → re-wire and **rebuild**.
- To extract a URL from cloudflared output, match `https://[a-z0-9-]+\.trycloudflare\.com`.
- Do not commit the rewritten env files — the tunnel URLs are throwaway.
- If `cloudflared.exe` is missing, tell the user to install it; do not silently skip the tunnel.
- Production mode has no hot reload: code edits after step 5 need a rebuild + restart to appear.
