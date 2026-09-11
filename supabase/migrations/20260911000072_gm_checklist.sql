-- Personal campaign onboarding state; no campaign audit noise or shared GM completion.
create table public.gm_checklists (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open','hidden','complete')),
  completed_steps text[] not null default '{}' check (completed_steps <@ array['invite','house_rules','members','first_match','import']::text[]),
  primary key (campaign_id,user_id)
);
alter table public.gm_checklists enable row level security;
create policy gm_checklist_owner on public.gm_checklists for all to authenticated
using (user_id = auth.uid() and exists (select 1 from public.campaigns c where c.id=campaign_id and c.gm_id=auth.uid()))
with check (user_id = auth.uid() and exists (select 1 from public.campaigns c where c.id=campaign_id and c.gm_id=auth.uid()));
grant select,insert,update,delete on public.gm_checklists to authenticated;
