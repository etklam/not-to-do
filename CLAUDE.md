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
