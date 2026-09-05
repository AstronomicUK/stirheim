-- The report functions keep bookkeeping columns (status, undo, revision) on match_reports that
-- players must not edit directly, so the row policies stay GM-only for updates. The functions
-- therefore run as their definer: each one checks the caller itself (participant, warband owner or
-- GM, campaign settings) before touching anything, and the audit trigger still records auth.uid().

alter function public.apply_battle_report(uuid) security definer;
alter function public.revert_battle_report(uuid) security definer;
alter function public.complete_match_if_reported(uuid) security definer;
alter function public.submit_battle_report(uuid, uuid, jsonb, text) security definer;
alter function public.approve_battle_report(uuid) security definer;
alter function public.return_battle_report(uuid, text) security definer;
alter function public.withdraw_battle_report(uuid, uuid) security definer;

-- Only the functions above write these; keep direct access to the internal helpers off.
revoke all on function public.apply_battle_report(uuid) from public, authenticated;
revoke all on function public.revert_battle_report(uuid) from public, authenticated;
revoke all on function public.complete_match_if_reported(uuid) from public, authenticated;
