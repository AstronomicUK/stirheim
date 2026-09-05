-- Phase 11: "Pick later". A skill or spell advance can be rolled in the post-battle wizard and the
-- choice left for later: the roll is kept on the pending row so the Bestow Advancements screen
-- starts at the choice. resolved_at / resolution stay null until the pick is made.

alter table public.pending_advances
  add column rolled jsonb check (rolled is null or jsonb_typeof(rolled) = 'object');

comment on column public.pending_advances.rolled is 'The 2D6 (and any sub-roll) already made for this advance when the choice was deferred; shape owned by the advances screen.';
