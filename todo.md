# Telemetry & Playback Improvements TODO
Created: 2025-12-21T16:57:08.123Z
Author: Automated auditor (follow-up tasks by maintainer)

Purpose
-------
Track work to: (A) wire lightweight telemetry into outro playback, (B) integrate telemetry with a real backend (Sentry/Segment), (C) add durable telemetry batching, and (D) implement an optional blob fallback for guaranteed instant playback.

Status Legend
-------------
- TODO: Not started
- IN-PROGRESS: Work has begun
- BLOCKED: Waiting on dependency/approval
- DONE: Implemented and verified

Summary of current state
------------------------
- DONE: Lightweight telemetry wrapper `utils/telemetry.ts` created (trackEvent / trackError).
- DONE: OutroSequence wired to emit structured telemetry events and prefetch/canplaythrough + fallback logic implemented.
- DONE: Video prefetch (link rel=preload + video.preload='auto' + vid.load()) implemented.
- DONE: Sentry scaffolding implemented for both client and serverless environments.
  - Client: dynamic @sentry/browser init in utils/telemetry.ts (reads VITE_SENTRY_DSN).
  - Serverless: example functions/sentry_serverless_example.js using @sentry/google-cloud-serverless (reads SENTRY_DSN or VITE_SENTRY_DSN).
  - NOTE: Do NOT commit DSN. Set in CI or environment: `VITE_SENTRY_DSN` for client builds, `SENTRY_DSN` for server-side functions.
- IN-PROGRESS: Telemetry batching & persistence implemented (in-memory queue, periodic flush, sendBeacon support). Further work: localStorage fallback + backoff retry.
- DONE: Blob fallback implemented and gated by VITE_OUTRO_USE_BLOB env flag (fetch -> blob -> createObjectURL). Verify memory under load.

Workplan (high level)
---------------------
1) Stabilize telemetry foundation (current) — DONE
   - Ensure events are consistent and have useful payloads
   - Events to emit: outro_video_prefetch_attempted, video_canplaythrough, video_played_immediate, video_played_after_canplaythrough, video_play_fallback, video_play_failed_*

2) Implement backend integration (Sentry / Segment) — IN-PROGRESS
   - Goal: Forward trackEvent and trackError to chosen provider with minimal coupling
   - Tasks:
     - Add `utils/telemetry.ts` initialization logic to optionally initialize Sentry when VITE_SENTRY_DSN is present (dynamic import)
     - Add Segment/analytics.js optional wiring behind VITE_SEGMENT_WRITE_KEY when required
     - Ensure privacy: opt-out via env var `VITE_TELEMETRY_DISABLED=true`
   - Acceptance criteria: events appear in provider when DSN/Key present; local dev falls back to console only

3) Implement durable telemetry batching & retry — TODO
   - Goal: avoid data loss, reduce network chatter, survive short offline windows
   - Tasks:
     - Implement in-memory queue with size cap (e.g., 500 events)
     - Use sendBeacon where available for unload-time flush
     - Periodic flush interval (e.g., every 10s) and immediate flush on important events
     - Backoff on network failure and persist to localStorage as fallback
   - Acceptance criteria: queued events flushed; retry/backoff works; no unlimited memory growth

4) Implement blob fallback for video playback (optional, higher cost) — TODO
   - Goal: guarantee immediate playback even on slow networks or offline (if asset cached)
   - Tasks:
     - Implement fetch(CONCLUSION_DATA.videoUrl, {mode:'cors'}) and read as blob
     - Create object URL via URL.createObjectURL(blob) and set video.src to that URL
     - Release old object URLs and free memory after use
     - Provide toggle to enable/disable blob fallback based on env var (e.g., VITE_OUTRO_USE_BLOB=true)
   - Tradeoffs: increased memory usage and network duplication; fewer CDN caching benefits; must monitor mem usage
   - Acceptance criteria: when toggled on, video plays immediately after prefetch in tested slow network; memory usage acceptable

Implementation notes & initial findings
-------------------------------------
- Telemetry wrapper (`utils/telemetry.ts`) intentionally minimal and pluggable. It currently logs to console + window.dataLayer if present.
- OutroSequence now emits structured events at key lifecycle points and attempts autoplay with canplaythrough + 5s fallback.
- Preload link and `video.preload='auto'` are best-effort; browsers may ignore preload hints depending on heuristics and user settings.

Immediate next steps (what I'll do now)
-------------------------------------
- [IN-PROGRESS] Add Sentry dynamic initialization scaffolding in `utils/telemetry.ts` (no hard dependency; will be no-op if package not installed)
- [TODO] Implement telemetry batching in `utils/telemetry.ts` with sendBeacon + periodic flush
- [TODO] Add blob fallback implementation in `components/OutroSequence.tsx` gated behind env flag

Safety / Security / Privacy notes
---------------------------------
- Telemetry must not capture PII. Events should avoid sending full URLs or any sensitive query params unless explicitly allowed.
- Respect `VITE_TELEMETRY_DISABLED` for opt-out in non-dev environments.
- When integrating Sentry or Segment, ensure DSN/keys are provided through secure envs and not committed to repo.

Commands & how to validate locally
---------------------------------
- Lint / format: `npm run lint` / `npm run format`
- Type check: `npm run type-check`
- Build (with type-check): `npm run build`
- Generate bundle + report: `npm run analyze`

Cloud Build / Secret Manager (build-time injection)
---------------------------------------------------
1. Enable Secret Manager API:
   ```bash
   gcloud services enable secretmanager.googleapis.com
   ```
2. Create the secret (replace with your DSN):
   ```bash
   echo -n "https://your-public-key@o0.ingest.sentry.io/your-project-id" | gcloud secrets create sentry-dsn --data-file=-
   ```
3. Grant Cloud Build access (replace $PROJECT_NUMBER):
   ```bash
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
     --role=roles/secretmanager.secretAccessor
   ```
4. Example cloudbuild.yaml (placed at repo root):
   ```yaml
   steps:
   - name: 'gcr.io/cloud-builders/npm'
     args: ['ci']
   - name: 'gcr.io/cloud-builders/npm'
     args: ['run', 'build']
     env:
     - 'VITE_SENTRY_DSN=$(SENTRY_DSN)'

   availableSecrets:
     secretManager:
     - versionName: projects/$PROJECT_ID/secrets/sentry-dsn/latest
       env: 'SENTRY_DSN'
   ```
5. Trigger build (substitute project config):
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

Notes:
- Vite uses `VITE_` prefixed env vars (use `VITE_SENTRY_DSN` for client bundling).
- Do NOT store the DSN in source control; inject it at build time via Secret Manager.
- You do not need runtime secrets on Cloud Run for client-side Sentry DSN because the DSN must be baked into the JS bundle at build time.

Change log (live)
-----------------
- 2025-12-21T16:57:08.123Z - TODO created, telemetry wrapper and outro wiring noted as DONE, Sentry integration marked IN-PROGRESS.
- 2025-12-21T18:17:41.397Z - Implemented telemetry batching (in-memory queue + sendBeacon/periodic flush), blob fallback in OutroSequence (gated by VITE_OUTRO_USE_BLOB), and Sentry dynamic import scaffolding.
- 2025-12-21T18:31:42.130Z - Added cloudbuild.yaml and documentation for build-time Secret Manager injection of VITE_SENTRY_DSN.


