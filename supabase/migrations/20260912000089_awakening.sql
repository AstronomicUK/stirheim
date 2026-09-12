-- #229 core Spell of Awakening: durable, report-backed offers and preserved equipment.
-- Source: campaigns/magic Spell of Awakening; only ordinary Heroes with a final Dead result.
create table public.awakening_catalogue (
  item_rules_id text primary key
);
alter table public.awakening_catalogue enable row level security;
create table public.awakening_templates (
  warband_rules_id text primary key,
  zombie_rules_id text not null,
  base_limit integer not null
);
alter table public.awakening_templates enable row level security;

create table public.awakening_offers (
 id uuid primary key default gen_random_uuid(),
 report_id uuid not null references public.match_reports(id) on delete cascade,
 report_revision integer not null,
 match_id uuid not null references public.matches(id) on delete cascade,
 from_warband_id uuid not null references public.warbands(id) on delete cascade,
 to_warband_id uuid not null references public.warbands(id) on delete cascade,
 hero_id uuid not null,
 hero_name text not null,
 snapshot jsonb not null,
 state text not null default 'offered' check(state in ('offered','accepted','declined','withdrawn','reversed')),
 created_at timestamptz not null default now(),
 resolved_at timestamptz,
 resolved_by uuid references auth.users(id),
 reason text not null default '',
 raised_group_id uuid,
 raised_snapshot jsonb,
 recipient_report_id uuid references public.match_reports(id),
 unique(report_id,report_revision,hero_id,to_warband_id),
 check(from_warband_id<>to_warband_id)
);
create index awakening_recipient_idx on public.awakening_offers(to_warband_id,state);
create index awakening_source_idx on public.awakening_offers(from_warband_id,state);
alter table public.awakening_offers enable row level security;
create policy awakening_read on public.awakening_offers for select to authenticated using (
 public.can_edit_warband(from_warband_id) or public.can_edit_warband(to_warband_id)
);
grant select on public.awakening_offers to authenticated;

create function public.create_awakening_offers() returns trigger language plpgsql security definer set search_path='' as $$
declare line jsonb; h public.heroes%rowtype; recipient record; kit jsonb; before_stats jsonb; offer_id uuid; owner_id uuid;
begin
 if new.undo is null or old.undo is not null then return new; end if;
 for line in select x from jsonb_array_elements(new.injuries) x where x->>'subjectType'='hero' and x->>'outcome'='dead' loop
  -- The source names 11–15, including a Dead result within Multiple Injuries; not merely OOA.
  if not exists(select 1 from jsonb_array_elements_text(coalesce(line->'rolls','[]')) die where die::integer between 11 and 15) then continue; end if;
  select * into h from public.heroes where id=(line->>'subjectId')::uuid and warband_id=new.warband_id and not is_hired_sword and status='dead';
  if not found then continue; end if;
  select x->'before'->'stats' into before_stats from jsonb_array_elements(new.undo->'heroes') x where x->>'id'=h.id::text;
  select coalesce(jsonb_agg(x),'[]') into kit from (
    select x from jsonb_array_elements(coalesce(new.undo->'removed_items','[]')) x where x->>'holder_id'=h.id::text
    union select to_jsonb(i) from public.items i where i.holder_type='hero' and i.holder_id=h.id and i.warband_id=h.warband_id
  ) items;
  for recipient in select distinct w.id,w.owner_id,w.name from public.match_participants p join public.warbands w on w.id=p.warband_id
    join public.awakening_templates t on t.warband_rules_id=w.type_rules_id
    where p.match_id=new.match_id and w.id<>new.warband_id and exists(select 1 from public.heroes caster where caster.warband_id=w.id and caster.status='active' and 'spell_of_awakening'=any(caster.spells)) loop
    insert into public.awakening_offers(report_id,report_revision,match_id,from_warband_id,to_warband_id,hero_id,hero_name,snapshot)
      values(new.id,new.revision,new.match_id,new.warband_id,recipient.id,h.id,h.name,jsonb_build_object('hero',to_jsonb(h),'stats',coalesce(before_stats,h.stats),'items',kit))
      on conflict do nothing returning id into offer_id;
    if offer_id is null then continue; end if;
    insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) values(recipient.owner_id,'awakening',left(h.name||' may be raised as a Zombie',140),'An enemy Hero has died. Review Spell of Awakening after both warbands have filed their reports.','/warbands/'||recipient.id,'awakening:'||offer_id||':recipient') on conflict do nothing;
    select w.owner_id into owner_id from public.warbands w where w.id=new.warband_id;
    insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) values(owner_id,'awakening',left(h.name||' can be raised by an enemy',140),recipient.name||' knows Spell of Awakening. Their player has been notified.','/warbands/'||new.warband_id,'awakening:'||offer_id||':source') on conflict do nothing;
  end loop;
 end loop;
 return new;
end $$;
revoke all on function public.create_awakening_offers() from public;
create trigger create_awakening_offers after update of undo on public.match_reports for each row execute function public.create_awakening_offers();

create function public.guard_awakening_report() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (tg_op='DELETE' or (old.undo is not null and new.undo is null)) then
  if exists(select 1 from public.awakening_offers where state='accepted' and (report_id=old.id or recipient_report_id=old.id)) then
   raise exception 'A Hero was raised using this report. Reverse the Awakening first before withdrawing or correcting the report.';
  end if;
  update public.awakening_offers set state='withdrawn',resolved_at=now(),reason='The source report was withdrawn or corrected.' where report_id=old.id and state='offered';
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.guard_awakening_report() from public;
create trigger guard_awakening_report before update of undo or delete on public.match_reports for each row execute function public.guard_awakening_report();

create function public.resolve_awakening(p_offer_id uuid,p_action text,p_reason text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare o public.awakening_offers%rowtype; t public.awakening_templates%rowtype; g uuid; item jsonb; item_ids uuid[]:='{}'; inserted uuid; r uuid; model_count integer; current_group jsonb; current_items jsonb; source_name text; target_name text; retained jsonb:='[]'; source_row jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in first.' using errcode='42501'; end if;
 -- Serialize accept/reverse with report application/withdrawal by locking both report rows first.
 select * into o from public.awakening_offers where id=p_offer_id;
 if not found then raise exception 'Awakening opportunity not found.'; end if;
 perform id from public.match_reports where match_id=o.match_id order by id for update;
 perform id from public.warbands where id in(o.from_warband_id,o.to_warband_id) order by id for update;
 select * into o from public.awakening_offers where id=p_offer_id for update;
 if not public.can_edit_warband(o.to_warband_id) then raise exception 'Only the receiving player or campaign GM can resolve this opportunity.' using errcode='42501'; end if;
 if p_action not in ('accept','decline','reverse') then raise exception 'Choose an Awakening action.'; end if;
 if p_action='reverse' then
  if o.state<>'accepted' then raise exception 'This Awakening has not been accepted.'; end if;
  if char_length(btrim(p_reason))<5 then raise exception 'Explain why the Awakening is being reversed.'; end if;
  select to_jsonb(h)-'updated_at' into current_group from public.henchman_groups h where id=o.raised_group_id for update;
  select coalesce(jsonb_agg(to_jsonb(i)-'updated_at' order by i.id),'[]') into current_items from public.items i where holder_type='group' and holder_id=o.raised_group_id;
  if current_group is not null and (current_group is distinct from o.raised_snapshot->'group' or current_items is distinct from o.raised_snapshot->'items') then raise exception 'The raised warrior or its equipment has changed. The campaign GM must remove the raised warrior and its equipment before releasing this report dependency.'; end if;
  if current_group is null and jsonb_array_length(current_items)>0 then raise exception 'Remove the raised warrior’s remaining equipment before reversing.'; end if;
  perform set_config('stirheim.audit_reason','Awakening reversed: '||btrim(p_reason),true);
  delete from public.items where holder_type='group' and holder_id=o.raised_group_id;
  delete from public.henchman_groups where id=o.raised_group_id;
  for item in select x from jsonb_array_elements(coalesce(o.raised_snapshot->'retained_source_items','[]')) x loop
   if exists(select 1 from public.items where id=(item->>'id')::uuid) then raise exception 'Original equipment has been restored separately. Ask the GM to reconcile it before reversing.'; end if;
   insert into public.items select (jsonb_populate_record(null::public.items,item)).*;
  end loop;
  update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),o.hero_name||': Awakening reversed — '||btrim(p_reason)) where id in(o.report_id,o.recipient_report_id);
  update public.awakening_offers set state='reversed',resolved_at=now(),resolved_by=auth.uid(),reason=btrim(p_reason) where id=o.id;
  insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) select owner_id,'awakening',left(o.hero_name||': Awakening reversed',140),left(btrim(p_reason),2000),'/warbands/'||o.from_warband_id,'awakening:'||o.id||':reversed' from public.warbands where id=o.from_warband_id on conflict do nothing;
  return null;
 end if;
 if o.state<>'offered' then raise exception 'This opportunity has already been resolved or withdrawn.'; end if;
 if p_action='decline' then
  update public.awakening_offers set state='declined',resolved_at=now(),resolved_by=auth.uid(),reason=btrim(p_reason) where id=o.id;
  update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),o.hero_name||': the opposing warband declined Spell of Awakening. '||btrim(p_reason)) where id=o.report_id;
  insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) select owner_id,'awakening',left(o.hero_name||': Awakening declined',140),'The opposing player declined to raise this Hero.','/warbands/'||o.from_warband_id,'awakening:'||o.id||':declined' from public.warbands where id=o.from_warband_id on conflict do nothing;
  return null;
 end if;
 if not exists(select 1 from public.match_reports where id=o.report_id and revision=o.report_revision and undo is not null) then raise exception 'The source report has changed. Review the latest report.'; end if;
 select id into r from public.match_reports where match_id=o.match_id and warband_id=o.to_warband_id and undo is not null;
 if r is null then raise exception 'File your own post-battle report first, so the surviving spellcaster is confirmed.'; end if;
 if not exists(select 1 from public.heroes where warband_id=o.to_warband_id and status='active' and 'spell_of_awakening'=any(spells)) then raise exception 'There is no surviving spellcaster with Spell of Awakening in this warband.'; end if;
 if not exists(select 1 from public.heroes where id=o.hero_id and warband_id=o.from_warband_id and status='dead') then raise exception 'The enemy Hero is no longer recorded as dead.'; end if;
 if exists(select 1 from public.awakening_offers where report_id=o.report_id and hero_id=o.hero_id and state='accepted') then raise exception 'This Hero has already been raised.'; end if;
 if (select count(*) from public.awakening_offers where report_id=o.report_id and report_revision=o.report_revision and hero_id=o.hero_id and state='offered')>1 then raise exception 'Several warbands can raise this Hero. Agree the recipient before resolving the opportunity.'; end if;
 select template.* into t from public.awakening_templates template join public.warbands w on w.type_rules_id=template.warband_rules_id where w.id=o.to_warband_id;
 if not found then raise exception 'This warband has no supported Zombie entry.'; end if;
 select (select count(*) from public.heroes where warband_id=o.to_warband_id and status in('active','captured') and not is_hired_sword)+coalesce((select sum(size) from public.henchman_groups where warband_id=o.to_warband_id),0)
  +coalesce((select sum(i.quantity) from public.items i join public.heroes h on h.id=i.holder_id and h.warband_id=i.warband_id where i.warband_id=o.to_warband_id and i.holder_type='hero' and i.item_rules_id in('wardogs','gnoblar_fighter') and h.status='active' and not h.is_hired_sword),0) into model_count;
 if model_count>=t.base_limit and char_length(btrim(p_reason))<5 then raise exception 'The warband is at its printed model limit. Dismiss a warrior first, or record the rule/house-rule reason allowing a larger warband.'; end if;
 if exists(select 1 from jsonb_array_elements(o.snapshot->'items') x where x->>'item_rules_id' is null) and char_length(btrim(p_reason))<5 then raise exception 'This Hero had custom equipment. Record how it was treated at the table before raising the Hero; only recognised weapons and armour transfer automatically.'; end if;
 perform set_config('stirheim.audit_reason','Spell of Awakening: '||o.hero_name||' raised as a Zombie.',true);
 insert into public.henchman_groups(warband_id,unit_type_rules_id,name,size,stats,xp,level_ups,notes)
 values(o.to_warband_id,t.zombie_rules_id,o.hero_name||' (Zombie)',1,o.snapshot->'stats',0,0,'Raised by Spell of Awakening. Retains characteristics, weapons and armour; no skills, miscellaneous equipment use, running or experience. '||btrim(p_reason)) returning id into g;
 for item in select x from jsonb_array_elements(o.snapshot->'items') x join public.awakening_catalogue c on c.item_rules_id=x->>'item_rules_id' loop
  -- Usually removed by the death report; also remove any surviving source row so no item duplicates.
  select to_jsonb(i) into source_row from public.items i where id=(item->>'id')::uuid for update;
  if source_row is not null then
   if source_row-'updated_at' is distinct from item-'updated_at' then raise exception 'The original equipment has changed since the death report. Correct that report before raising the Hero.'; end if;
   retained:=retained||jsonb_build_array(source_row);
   delete from public.items where id=(item->>'id')::uuid and warband_id=o.from_warband_id and holder_id=o.hero_id;
  end if;
  insert into public.items(warband_id,holder_type,holder_id,item_rules_id,custom_name,quantity,notes)
    values(o.to_warband_id,'group',g,item->>'item_rules_id',item->>'custom_name',(item->>'quantity')::integer,coalesce(item->>'notes','')) returning id into inserted;
  item_ids:=array_append(item_ids,inserted);
 end loop;
 select to_jsonb(h)-'updated_at' into current_group from public.henchman_groups h where id=g;
 select coalesce(jsonb_agg(to_jsonb(i)-'updated_at' order by i.id),'[]') into current_items from public.items i where id=any(item_ids);
 update public.awakening_offers set state='accepted',resolved_at=now(),resolved_by=auth.uid(),reason=btrim(p_reason),raised_group_id=g,raised_snapshot=jsonb_build_object('group',current_group,'items',current_items,'retained_source_items',retained),recipient_report_id=r where id=o.id;
 select name into source_name from public.warbands where id=o.from_warband_id; select name into target_name from public.warbands where id=o.to_warband_id;
 update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),o.hero_name||' of '||source_name||' was raised as a Zombie by '||target_name||'. '||btrim(p_reason)) where id in(o.report_id,r);
 insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) select owner_id,'awakening',left(o.hero_name||' was raised as a Zombie',140),target_name||' has resolved Spell of Awakening. The result is recorded in both battle reports.','/warbands/'||o.from_warband_id,'awakening:'||o.id||':accepted' from public.warbands where id=o.from_warband_id on conflict do nothing;
 return g;
end $$;
revoke all on function public.resolve_awakening(uuid,text,text) from public;
grant execute on function public.resolve_awakening(uuid,text,text) to authenticated;

-- Generated from the app equipment catalogue: only weapons and armour.
insert into public.awakening_catalogue(item_rules_id) values
('axe'),
('ball_and_chain'),
('barbed_whip'),
('barding'),
('beastlash'),
('beastwhip'),
('bec_de_corbin'),
('belaying_pins'),
('blowpipe'),
('blunderbuss'),
('boar_spear'),
('boat_hook'),
('bolas'),
('bone_helmet'),
('boss_pole'),
('bow'),
('brass_knuckles'),
('brazier_iron'),
('bretonnian_barding'),
('broadsword'),
('buckler'),
('cat_o_nine_tails'),
('cathayan_candles'),
('cathayan_longsword'),
('cathayan_quilted_silk_armour'),
('censer'),
('chain_sticks'),
('chaos_armour'),
('chaos_dwarf_blunderbuss'),
('chest_talon'),
('claw_of_the_old_ones'),
('cleaver'),
('club'),
('club_mace_or_hammer'),
('cooking_pot_helmet'),
('crossbow'),
('crossbow_pistol'),
('daemon_weapon'),
('dagger'),
('dark_elf_blade'),
('darksteel_blade'),
('disease_dagger'),
('double_barrelled_duelling_pistol'),
('double_barrelled_handgun'),
('double_barrelled_pistol'),
('double_handed_weapon'),
('dragon_sword'),
('draich'),
('duelling_pistol'),
('dwarf_axe'),
('elf_bow'),
('enchanted_skins'),
('fighting_claws'),
('firepots_miragliano'),
('fish_hook_shot'),
('fist'),
('flail'),
('great_axe'),
('gromril_armour'),
('gromril_axe'),
('gromril_barbed_whip'),
('gromril_broadsword'),
('gromril_chain_sticks'),
('gromril_cleaver'),
('gromril_club'),
('gromril_disease_dagger'),
('gromril_double_handed_weapon'),
('gromril_dragon_sword'),
('gromril_dwarf_axe'),
('gromril_flail'),
('gromril_great_axe'),
('gromril_halberd'),
('gromril_hammer'),
('gromril_horsemans_hammer'),
('gromril_lance'),
('gromril_mace'),
('gromril_main_gauche'),
('gromril_man_catcher'),
('gromril_misericordia'),
('gromril_morning_star'),
('gromril_ogre_club'),
('gromril_pike_merchant_caravans'),
('gromril_pike_tileans'),
('gromril_quarter_staff'),
('gromril_rapier'),
('gromril_serpent_staff'),
('gromril_shortsword'),
('gromril_sigmarite_warhammer'),
('gromril_spear'),
('gromril_starblade'),
('gromril_steel_whip'),
('gromril_sword'),
('gromril_sword_breaker'),
('gromril_tenderiser'),
('gromril_trident'),
('gromril_weapon'),
('gwen_rolling_pin'),
('halberd'),
('hammer'),
('hand_held_mortar'),
('handgun'),
('harpoon_crossbow'),
('heavy_armour'),
('hedonist_whip'),
('helmet'),
('hersten_wenkler_pigeon_bombs'),
('hobgoblin_poisoned_daggers'),
('horsemans_hammer'),
('hunting_rifle'),
('icefang_axe'),
('ienh_khain'),
('imperial_tactician_plate_armour'),
('iron_fist'),
('ithilmar_armour'),
('ithilmar_axe'),
('ithilmar_barbed_whip'),
('ithilmar_broadsword'),
('ithilmar_chain_sticks'),
('ithilmar_cleaver'),
('ithilmar_club'),
('ithilmar_disease_dagger'),
('ithilmar_double_handed_weapon'),
('ithilmar_dragon_sword'),
('ithilmar_dwarf_axe'),
('ithilmar_flail'),
('ithilmar_great_axe'),
('ithilmar_halberd'),
('ithilmar_hammer'),
('ithilmar_horsemans_hammer'),
('ithilmar_lance'),
('ithilmar_mace'),
('ithilmar_main_gauche'),
('ithilmar_man_catcher'),
('ithilmar_misericordia'),
('ithilmar_morning_star'),
('ithilmar_ogre_club'),
('ithilmar_pike_merchant_caravans'),
('ithilmar_pike_tileans'),
('ithilmar_quarter_staff'),
('ithilmar_rapier'),
('ithilmar_serpent_staff'),
('ithilmar_shortsword'),
('ithilmar_sigmarite_warhammer'),
('ithilmar_spear'),
('ithilmar_starblade'),
('ithilmar_steel_whip'),
('ithilmar_sword'),
('ithilmar_sword_breaker'),
('ithilmar_tenderiser'),
('ithilmar_trident'),
('ithilmar_weapon'),
('javelins'),
('kanabo'),
('katar'),
('kitchen_knife'),
('kite_shield'),
('kusarigama'),
('ladle'),
('lamellar_armour'),
('lance'),
('light_armour'),
('longbow'),
('mace'),
('main_gauche'),
('man_catcher'),
('masterwork_heavy_armour'),
('maximilian_holy_weapon'),
('mechanical_suit'),
('misericordia'),
('morning_star'),
('nehekharan_javelins'),
('nicodemus_staff'),
('ninja_gnoblar_bo'),
('ninja_gnoblar_shurikens'),
('norse_rune_staff'),
('obsidian_weapon'),
('ogre_club'),
('ostlander_double_barrelled_hunting_rifle'),
('ostlander_double_barrelled_pistol'),
('pavise'),
('pebble'),
('pike_merchant_caravans'),
('pike_tileans'),
('pistol'),
('poison_daggers'),
('priest_hammer_of_sigmar'),
('pry_bar'),
('quarter_staff'),
('rapier'),
('repeater_crossbow'),
('repeater_handgun'),
('repeater_pistol'),
('scenario_ancient_bone_armour'),
('scenario_athame'),
('scenario_magic_sickle'),
('scenario_silver_sickle'),
('scenario_sword_of_the_herald'),
('scythe'),
('serpent_staff'),
('sharp_stuff'),
('shield'),
('shield_of_sigmar'),
('short_bow'),
('shortsword'),
('sigmarite_warhammer'),
('silver_tip_stake'),
('slaaneshi_man_catcher'),
('sling'),
('slingshot'),
('sons_of_hashut_obsidian_weapon'),
('spear'),
('spiked_gauntlet'),
('staff_of_light'),
('starblade'),
('starsword'),
('steel_whip'),
('sun_gauntlet'),
('sunstaff'),
('sunstaff_lustria'),
('swivel_gun'),
('sword'),
('sword_breaker'),
('tenderiser'),
('thingcatcher'),
('throwing_knives_stars'),
('toughened_leathers'),
('trident'),
('tufenk'),
('veskit_eshin_claws'),
('veskit_warplock_pistols'),
('warplock_pistol'),
('weeping_blades'),
('whirling_blades'),
('wizards_staff');
insert into public.awakening_templates(warband_rules_id,zombie_rules_id,base_limit) values
('the_undead','undead_zombies',15),
('the_restless_dead','restless_dead_zombies',12),
('masters_of_horror','masters_of_horror_zombies',12),
('necrarchs_the_soul_stealers','necrarchs_zombies',15),
('the_restless_dead_variant','restless_dead_variant_zombies',12);
