# V46.14 Access Gate 4.2 — Validation

## Automated result

**30 suites / 472 checks passed.**

Dedicated Access Gate 4.2 suite: **16/16**.

The dedicated checks cover:
- JavaScript syntax;
- tab-scoped default token storage;
- opt-in trusted-browser persistence;
- separation of email memory from authentication persistence;
- bounded 12-hour trust metadata;
- rejection of legacy unbounded localStorage sessions;
- deliberate resume requirement before protected records are shown;
- session-only cached identity;
- complete auth-storage clearing on logout/401;
- `/api/auth/me` validation before access;
- explicit access-chain UI;
- CSS isolation to the entry gate;
- preservation of Grounded and Staff Phase 4 contracts.

Historical regression suites remain green across V43.1 → V46.14, including Grounded 4.1A–E, Staff Phases 1–4, action-integrity suites and DOM-template safety.

## Preservation hashes

Unchanged from Grounded Phase 4.1E:
- `style.css` — `1f32b6405c1a45d916f74c64ff2798386070f2b34a592f65134ae9502e67202c`
- `grounded-core.js` — `738ed64d64f02358079b94635591b63bf3f5a227301c5e46f473acc98697220b`
- `activity45.js` — `c943857ad57655cfea16a505957587eb5cd00ec119c3696d98961ce2c80aaedb`
- `SUPABASE_SCHEMA.sql` — `66541c3c9017c7d6480831999ca33325e0953bdeccc193d4873a8e8a7a195768`
- `entry46.js` — `d8427ace7b2b8fa30a2ac3aaee89d96cf5897608b9c9a2e99ccdd92aaa30873b`

## Live acceptance still required

Automated tests cannot prove backend token lifetime or production browser storage behaviour. After deployment test:

1. existing pre-4.2 browser → should require one-time sign-in;
2. normal sign-in, refresh same tab → should validate and open;
3. normal sign-in, new browser session → should show sign-in;
4. trusted-browser sign-in, close/reopen browser → should show **Session verified**, not the workspace;
5. **Use another account** → must clear the trusted session;
6. explicit sign out → revisiting must show sign-in;
7. inactive/revoked account → `/api/auth/me` must prevent workspace access.

## Backend boundary

The available project artifact documents JWT middleware but does not include the backend implementation, and the connected GitHub source available in this session did not expose the backend repository. Server-side JWT lifetime, refresh/revocation and cookie controls therefore remain unverified and must not be inferred from the frontend result.
