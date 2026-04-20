## Deploy Configuration
- Platform: CapRover
- Dashboard URL: https://captain.rnsj.913555.xyz/#/apps/details/ntd
- App name: ntd
- Production URL: http://ntd.rnsj.913555.xyz
- Deploy workflow: Manual CapRover deploy from local workspace
- Deploy status command: `curl -i -sS http://ntd.rnsj.913555.xyz/zh-HK`
- Project type: Next.js web app
- Post-deploy health check: `http://ntd.rnsj.913555.xyz/zh-HK`

### Custom deploy hooks
- Pre-deploy: `npm run build`
- Deploy trigger: `caprover deploy -h captain.rnsj.913555.xyz -a ntd -t /tmp/ntd-caprover-deploy-clean.tar.gz`
- Deploy status: Watch `caprover deploy` build logs until `Deployed successfully ntd`
- Health check: `/` should return `307` to `/zh-HK`, and `/zh-HK` should return `200`

### Notes
- `captain-definition` points CapRover at `./Dockerfile`.
- HTTPS on `ntd.rnsj.913555.xyz` is currently backed by a self-signed certificate. As of 2026-04-18, the verified working public URL is `http://ntd.rnsj.913555.xyz`.

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required at runtime)
- `PUBLIC_ORIGIN` — Override host-header detection for share URLs (recommended: `http://ntd.rnsj.913555.xyz`)

## Architecture

### Security
- Rate limiting on auth endpoints (5 login / 3 register attempts per minute per IP)
- Input validation: max lengths on title (255), description (2000), note (2000), triggerTags (10 items, 50 chars each)
- Streak/bestStreak are server-computed only (not client-settable via PATCH)
- Crypto-secure random tokens for share codes and slugs
- Security headers: X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy

### Shared Utilities
- `src/lib/utils.ts` — `getStreakEmoji()`, `formatDate(dateStr, locale?)`, date helpers
- `src/lib/messages.ts` — `MILESTONE_DAYS` constant (single source of truth)
- `src/lib/rate-limit.ts` — In-memory rate limiter for API routes
