---
name: start-system
description: Boot the whole E-Learning stack with public Cloudflare URLs. Use when the user wants to "run the system", "start everything", "เปิดระบบ", "รัน backend+frontend+cloudflare", or expose the app publicly via trycloudflare tunnels. Runs backend → backend tunnel → injects backend URL into frontend env → frontend → frontend tunnel → reports both public URLs.
---

# start-system

Boots the full stack and exposes it through Cloudflare quick tunnels (`*.trycloudflare.com`).
The tunnel URLs are **random on every run**, so this skill always re-captures them and
re-writes the env files in the correct order before starting each service.

## Topology

| Service  | Dir         | Start cmd        | Local port |
|----------|-------------|------------------|------------|
| Backend  | `backend/`  | `npm run dev`    | 5000       |
| Frontend | `frontend/` | `npm run dev`    | 3000       |

Env wiring:
- `frontend/.env.local` → `NEXT_PUBLIC_API_URL` = **backend** public URL
- `frontend/.env.local` → `NEXT_PUBLIC_FRONTEND_URL` = **frontend** public URL
- `backend/.env` → `FRONTEND_ENDPOINT` = **frontend** public URL (CORS allow-origin)

`cloudflared` binary: `C:\Program Files (x86)\cloudflared\cloudflared.exe`

> Order matters: Next.js inlines `NEXT_PUBLIC_*` at dev-server start, so the backend URL
> MUST be written into `frontend/.env.local` **before** the frontend process starts.

## Procedure

Run each long-lived process with `run_in_background: true` (Bash tool). Capture each
background task's id so you can read its output later.

### 1. Start backend
```
npm run dev --prefix backend
```
Wait until the log prints `Server running at http://0.0.0.0:5000` before continuing.

### 2. Start backend Cloudflare tunnel
```
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5000
```
cloudflared prints the assigned URL to its output, e.g.
`https://some-random-words.trycloudflare.com`. Poll the background task's output until a
`https://<...>.trycloudflare.com` line appears, then extract it. Call it **BACKEND_URL**.

### 3. Inject BACKEND_URL into frontend env
Edit `frontend/.env.local`, set:
```
NEXT_PUBLIC_API_URL=<BACKEND_URL>
```
(Replace the existing value — do not append a duplicate line.)

### 4. Start frontend
```
npm run dev --prefix frontend
```
Wait until Next.js prints its `Local: http://localhost:3000` ready line.

### 5. Start frontend Cloudflare tunnel
```
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
```
Poll its output for the `https://<...>.trycloudflare.com` URL. Call it **FRONTEND_URL**.

### 6. Wire FRONTEND_URL back in (for CORS + self-links)
- `frontend/.env.local` → set `NEXT_PUBLIC_FRONTEND_URL=<FRONTEND_URL>`
- `backend/.env` → set `FRONTEND_ENDPOINT=<FRONTEND_URL>`

Because the frontend dev server already started, **restart the frontend process** (stop the
background task from step 4, start it again) so it picks up `NEXT_PUBLIC_FRONTEND_URL`.
Backend reads `FRONTEND_ENDPOINT` for CORS — if CORS errors appear, restart the backend too
(step 1), which forces re-capture of the backend tunnel URL, so prefer setting CORS to also
accept the frontend origin without a backend restart if the code allows it. If a backend
restart is unavoidable, repeat from step 2.

### 7. Report
Print clearly to the user:
```
✅ ระบบพร้อมใช้งาน
Frontend (เปิดอันนี้): <FRONTEND_URL>
Backend API:           <BACKEND_URL>
```

## Notes & gotchas
- **Quick tunnels are ephemeral**: every restart = new URL. Always re-run the full order; never
  reuse an old `trycloudflare.com` URL from a previous session or from the committed env files.
- Keep all four background tasks alive for the duration of the session. If any dies, its
  tunnel/URL is gone and dependents must be re-wired.
- To extract the URL from cloudflared output, match the regex `https://[a-z0-9-]+\.trycloudflare\.com`.
- Do not commit the rewritten env files — the tunnel URLs are throwaway.
- If `cloudflared.exe` is missing, tell the user to install it; do not silently skip the tunnel.
