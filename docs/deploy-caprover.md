# Deploy This Project To CapRover

Last verified: 2026-04-21

## Target

- CapRover dashboard: `https://captain.rnsj.913555.xyz/#/apps/details/ntd`
- App name: `ntd`
- Public app URL: `http://ntd.rnsj.913555.xyz`
- Database app: `ntd-postgres`
- Database dashboard: `https://captain.rnsj.913555.xyz/#/apps/details/ntd-postgres`

This project is deployed through CapRover using:

- [captain-definition](/Users/klam/Desktop/project/not-to-do/captain-definition)
- [Dockerfile](/Users/klam/Desktop/project/not-to-do/Dockerfile)

`captain-definition` tells CapRover to build from `./Dockerfile`.

## Database

As of 2026-04-18, this project has a dedicated PostgreSQL service on CapRover.

- Database app: `ntd-postgres`
- Image: `postgres:17-alpine`
- Database name: `ntd`
- Database user: `ntd`
- Internal host for CapRover apps: `srv-captain--ntd-postgres`
- Internal port: `5432`
- Published external port: `54321`
- Docker volume: `ntd-postgres-data`
- Data path in container: `/var/lib/postgresql/data`

Connection string templates:

```text
postgresql://ntd:<POSTGRES_PASSWORD>@srv-captain--ntd-postgres:5432/ntd
postgresql://ntd:<POSTGRES_PASSWORD>@captain.rnsj.913555.xyz:54321/ntd
```

Notes:

- The actual `POSTGRES_PASSWORD` is stored in the CapRover app env vars for `ntd-postgres`.
- Do not commit the real password to this repository.
- As of 2026-04-20, production `ntd` is wired to PostgreSQL through `DATABASE_URL`.

## Prerequisites

- `caprover` CLI installed locally
- Access password for `captain.rnsj.913555.xyz`
- Run commands from the project root

## Recommended: Deploy Current Working Tree

Use this flow when you want the deploy to include local uncommitted files, such as a new `captain-definition`.

1. Verify the production build works locally:

```bash
npm run build
```

2. Create a clean tarball for CapRover:

```bash
tar --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./.gstack' \
  --exclude='./.claude' \
  --exclude='./*.tar' \
  --exclude='./*.tgz' \
  -czf /tmp/ntd-caprover-deploy-clean.tar.gz .
```

3. Deploy it to the `ntd` app:

```bash
caprover deploy \
  -h captain.rnsj.913555.xyz \
  -a ntd \
  -t /tmp/ntd-caprover-deploy-clean.tar.gz
```

4. When prompted, enter the CapRover machine password.

5. Ensure `ntd` app env vars include `DATABASE_URL`:

```text
DATABASE_URL=postgresql://ntd:<POSTGRES_PASSWORD>@srv-captain--ntd-postgres:5432/ntd
```

6. Apply schema changes to production DB from project root:

```bash
DATABASE_URL='postgresql://ntd:<POSTGRES_PASSWORD>@captain.rnsj.913555.xyz:54321/ntd' npm run db:push
```

Without this step, API endpoints can still fail with `500` due to missing tables even if `DATABASE_URL` is set.

## Provision Or Recreate The PostgreSQL App

If you need to recreate the database app manually in CapRover, use these settings:

1. Create a new app named `ntd-postgres`
2. Enable persistent data
3. Mark it as not exposed as a web app
4. Set image name to `postgres:17-alpine`
5. Add env vars:

```text
POSTGRES_DB=ntd
POSTGRES_USER=ntd
POSTGRES_PASSWORD=<generate a strong password>
```

6. Add the persistent volume mapping:

```text
/var/lib/postgresql/data -> ntd-postgres-data
```

7. Add the port mapping:

```text
54321 -> 5432
```

8. Deploy the app and confirm the image is running

For app-to-db traffic inside CapRover, the internal host should be preferred:

```text
postgresql://ntd:<POSTGRES_PASSWORD>@srv-captain--ntd-postgres:5432/ntd
```

## Alternative: Deploy A Committed Branch

If everything you need is already committed to git, you can deploy by branch instead:

```bash
caprover deploy \
  -h captain.rnsj.913555.xyz \
  -a ntd \
  -b main
```

Do not use branch deploy when required files are still uncommitted, because CapRover will only package the git branch content.

## Alternative: Deploy via CapRover REST API

Use this when the `caprover` CLI crashes with `ERR_USE_AFTER_CLOSE` (known issue on Node.js >= 25 due to readline incompatibility with inquirer).

### 1. Login and save auth token

```bash
curl -sS -X POST https://captain.rnsj.913555.xyz/api/v2/login \
  -H 'content-type: application/json' \
  -d '{"password":"<CAPROVER_PASSWORD>"}' \
  -k | jq -r '.data.token' > /tmp/caprover-token.txt
```

### 2. Create and upload tarball

```bash
# Create tarball (same as the recommended flow)
tar --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./.gstack' \
  --exclude='./.claude' \
  --exclude='./*.tar' \
  --exclude='./*.tgz' \
  -czf /tmp/ntd-caprover-deploy-clean.tar.gz .

# Upload to CapRover
TOKEN=$(cat /tmp/caprover-token.txt)
curl -sS -X POST \
  "https://captain.rnsj.913555.xyz/api/v2/user/apps/appData/ntd?detached=1" \
  -H "x-captain-auth: $TOKEN" \
  -F "sourceFile=@/tmp/ntd-caprover-deploy-clean.tar.gz" \
  -k
```

Expected response: `{"status":101,"description":"Deploy is started","data":{}}`

### 3. Poll build status

```bash
TOKEN=$(cat /tmp/caprover-token.txt)
curl -sS "https://captain.rnsj.913555.xyz/api/v2/user/apps/appData/ntd" \
  -H "x-captain-auth: $TOKEN" -k \
  | jq '{isAppBuilding: .data.isAppBuilding, isBuildFailed: .data.isBuildFailed}'
```

Repeat until `isAppBuilding` is `false`. If `isBuildFailed` is `true`, inspect logs:

```bash
curl -sS "https://captain.rnsj.913555.xyz/api/v2/user/apps/appData/ntd" \
  -H "x-captain-auth: $TOKEN" -k \
  | jq -r '.data.logs.lines[]' | tail -30
```

### 4. Query app env vars (e.g. to get DB password)

```bash
TOKEN=$(cat /tmp/caprover-token.txt)
curl -sS "https://captain.rnsj.913555.xyz/api/v2/user/apps/appDefinitions" \
  -H "x-captain-auth: $TOKEN" -k \
  | jq '.data.appDefinitions[] | select(.appName=="ntd-postgres") | .envVars[]'
```

## Verification

After deploy finishes, CapRover should print:

```text
Deployed successfully ntd
App is available at http://ntd.rnsj.913555.xyz
```

Then verify HTTP responses:

```bash
curl -i -sS http://ntd.rnsj.913555.xyz
curl -i -sS http://ntd.rnsj.913555.xyz/zh-HK
```

Expected results:

- `/` returns `307 Temporary Redirect` to `/zh-HK`
- `/zh-HK` returns `200 OK`

Database verification:

```bash
nc -vz captain.rnsj.913555.xyz 54321
```

Expected result:

- TCP connect to port `54321` succeeds
- CapRover app definition for `ntd-postgres` shows image `postgres:17-alpine`

API verification (confirms DB wiring + schema):

```bash
EMAIL="caprover-check-$(date +%s)@example.com"
curl -i -sS http://ntd.rnsj.913555.xyz/api/auth/register \
  -H 'content-type: application/json' \
  --data "{\"email\":\"$EMAIL\",\"password\":\"test1234\",\"name\":\"caprover-check\"}"
```

Expected result:

- Response status is `201 Created`
- Response body contains a `user.id`

## Known HTTPS Caveat

As verified on 2026-04-18:

- `https://ntd.rnsj.913555.xyz` uses a self-signed certificate
- plain HTTP works correctly

If you want a clean HTTPS deployment, fix the CapRover certificate/domain configuration first, then re-run the verification with HTTPS.

## Troubleshooting

- If `caprover deploy` stalls on build, wait for Docker build logs to finish. The Next.js image build can take a while on first build.
- If CapRover says the app deployed but the site does not load, hit `http://ntd.rnsj.913555.xyz/zh-HK` directly to confirm the container is serving traffic.
- If your tarball is too large, make sure `.git`, `node_modules`, and `.next` are excluded.
- If you deploy by branch and changes are missing, switch to the tarball flow so CapRover uploads the current workspace instead of only git-tracked branch content.
- If APIs return `500` after deploy, first verify `ntd` env vars include `DATABASE_URL`, then run `npm run db:push` against production DB.
- If `caprover` CLI crashes with `ERR_USE_AFTER_CLOSE`, you are on Node.js >= 25. Use the **Deploy via CapRover REST API** section above instead.
- If `npm ci` fails inside Docker with "Missing: @swc/helpers", run `npm install @swc/helpers@latest --save-dev` locally, then regenerate the tarball and redeploy.
