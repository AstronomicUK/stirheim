# Feedback, resurrection and reloading — approved 12 September 2026

Tom approved #230 first, then #229, then #231. Keep a single release batch. Core Priority 1–5 is already deployed; do not repeat that work. Codex owns design, frontend and integration; Claude assists with bounded backend implementation and source audit. Questions to Tom go through Codex.

## #230 backend contract (Codex/Claude)

UI types: src/features/feedback/types.ts. Tables/RPC names below are interface agreement, not implemented status.

- feedback_issues public readable: fields exactly FeedbackIssue. ID bigint starts at 232 so imported #1–231 retain original IDs. kind bug/improvement; priority high/medium/low; status reported/reviewed/working_on/implemented/confirmed. No raw internal audit data. Public notes are plain text.
- feedback_releases: FeedbackRelease fields. Public reads published only; maintainers can read drafts. Version unique. No publication before actual deployment.
- app_notifications: FeedbackNotification plus private user_id. Owners read and mark read only; no arbitrary notifications to other players. Reusable for later #229.
- feedback_maintainers: user_id, service-role-managed only. No self-promotion or trusting editable auth metadata. Tom's maintainer identity is pending.
- feedback_subscriptions: user_id + issue_id unique, owner readable; use RPC to follow/unfollow (including canonical merged issue). Original reporter follows automatically.
- RPC submit_feedback(p_kind text,p_title text,p_notes text) returns bigint id. Requires sign-in, reported default, medium provisional priority, actual profile display_name attribution (no spoofed model name). Trim/validate lengths title 5–140, notes 10–12000. Rate limit 10 submissions/hour/user. User-facing form explains reports public.
- RPC is_feedback_maintainer() returns boolean.
- RPC follow_feedback(p_issue_id bigint,p_follow boolean) returns void.
- RPC review_feedback(p_issue_id bigint,p_title text,p_notes text,p_priority text,p_status text,p_kind text,p_release_id uuid default null) returns void. Maintainer-only; implemented/confirmed require published linked release. Concurrent changes should reject stale edits: add p_expected_updated_at timestamptz (required UI argument).
- RPC merge_feedback(p_issue_id bigint,p_target_id bigint) returns void, maintainer-only, lock rows stable order, reject cycles/self and existing duplicate targets or resolve canonical. Transfer subscriptions, retain visible duplicate link and notes. Must not send false fix notifications.
- RPC publish_feedback_release(p_release_id uuid) returns void: service role or maintainer only, publish draft, transition linked working_on issues to implemented; atomically notify subscribers exactly once per issue/release. Reviewed/reported issues should not be silently advanced. Repeat idempotent. Existing implemented issues in this release also handled idempotently.
- RPC mark_notification_read(p_id uuid) returns void, owner only.

Claude: own migration 088, src/api/database.types.ts generation, backend integration tests only. Codex: API wrapper src/api/feedback.ts and frontend. Local disposable DB verification only, no deployment. Reconcile imports separately; don't bulk-import historical raw tracker into public tables.

## Acceptance still outstanding

Backend RLS/RPC tests; public and signed-in responsive board; exhaustive pagination/search; detail view; report form; follow and private inbox; maintainer review/merge; release history and publication tooling; reviewed historical tracker import; mobile/desktop visual QA. #229 source audit then implementation; #231 source audit and chamber UI mockups then implementation. Nothing in this batch is complete or deployed yet.

## Tracker milestone — frontend and real local journey

Public /feedback route and discreet Account link built. Desktop board, phone stage selector, full-title/details search, report detail deep links, signed-in submission, follow controls, maintainer review/merge, private release draft/publication and owner-only inbox are wired. All three board unit tests pass. Actual disposable two-user browser journey passes at 390px/1440px: submit → automatic follow → reload → maintainer review → private release draft/link → publish → implemented → one notification → detail link/read. Fixtures removed. Script in audits/2026-09-12-feedback/browser-acceptance.mjs. Layout-only screenshots use illustrative cards, not historical verification claims.

Claude backend checkpoint daf2e6a is local. Codex requested concurrency/idempotency hardening and verified the happy path; final backend test handoff remains to be read. Historical import manifest still needs review; tooling refuses unreviewed entries and never overwrites an existing report. Tom's maintainer identity is pending. No changes deployed.
