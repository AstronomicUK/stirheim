-- Stirheim dev seed. Applied by `supabase db reset` on the LOCAL stack only (never pushed).
--
-- Two accounts, password "stirheim-dev" for both:
--   gm@stirheim.test      Tom (GM)   owns "Reikland Watch" and runs the campaign
--   player@stirheim.test  Ana        owns "Claws of Eshin", enrolled in the campaign
-- Campaign "Ruins of the Stir" has invite code test-2026.

-- ---------------------------------------------------------------------------------------------
-- Users (GoTrue-compatible rows; the profiles trigger fills public.profiles)
-- ---------------------------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111',
   'authenticated', 'authenticated', 'gm@stirheim.test',
   extensions.crypt('stirheim-dev', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Tom (GM)"}', now(), now(),
   '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222',
   'authenticated', 'authenticated', 'player@stirheim.test',
   extensions.crypt('stirheim-dev', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Ana"}', now(), now(),
   '', '', '', '', false);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
  from auth.users u
 where u.email in ('gm@stirheim.test', 'player@stirheim.test');

-- ---------------------------------------------------------------------------------------------
-- Warbands
-- ---------------------------------------------------------------------------------------------

insert into public.warbands (id, owner_id, name, type_rules_id, gold, wyrdstone, notes)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Reikland Watch', 'mercenaries_reikland', 35, 0, 'Seed warband. Fresh from Altdorf.'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
   'Claws of Eshin', 'skaven_of_clan_eshin', 20, 2, 'Seed warband.');

-- Reikland Watch
insert into public.heroes (id, warband_id, name, unit_type_rules_id, stats, xp, level_ups, skill_tables, sort_order)
values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Captain Ulrich Brandt',
   'mercenaries_reikland_captain', '{"M":4,"WS":4,"BS":4,"S":3,"T":3,"W":1,"I":4,"A":1,"Ld":8}', 20, 8,
   '{combat,shooting,academic,strength,speed}', 0),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Marta Voss',
   'mercenaries_reikland_champions', '{"M":4,"WS":4,"BS":3,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":7}', 8, 4,
   '{combat,shooting,strength}', 1),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'Klaus Reiter',
   'mercenaries_reikland_champions', '{"M":4,"WS":4,"BS":3,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":7}', 8, 4,
   '{combat,shooting,strength}', 2),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000001', 'Pieter',
   'mercenaries_reikland_youngbloods', '{"M":4,"WS":2,"BS":2,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":6}', 0, 0,
   '{combat,shooting,speed}', 3);

insert into public.henchman_groups (id, warband_id, name, unit_type_rules_id, size, stats, sort_order)
values
  ('cccccccc-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Watchmen',
   'mercenaries_reikland_warriors', 3, '{"M":4,"WS":3,"BS":3,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":7}', 0),
  ('cccccccc-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Marksmen',
   'mercenaries_reikland_marksmen', 2, '{"M":4,"WS":3,"BS":4,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":7}', 1);

insert into public.items (warband_id, holder_type, holder_id, item_rules_id, quantity)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'hero', 'bbbbbbbb-0000-4000-8000-000000000001', 'sword', 1),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'hero', 'bbbbbbbb-0000-4000-8000-000000000001', 'dagger', 1),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'hero', 'bbbbbbbb-0000-4000-8000-000000000001', 'light_armour', 1),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'hero', 'bbbbbbbb-0000-4000-8000-000000000002', 'sword', 1),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'hero', 'bbbbbbbb-0000-4000-8000-000000000002', 'dagger', 1),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'hero', 'bbbbbbbb-0000-4000-8000-000000000003', 'dagger', 1),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'hero', 'bbbbbbbb-0000-4000-8000-000000000004', 'dagger', 1),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'cccccccc-0000-4000-8000-000000000001', 'dagger', 3),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'cccccccc-0000-4000-8000-000000000002', 'bow', 2),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'cccccccc-0000-4000-8000-000000000002', 'dagger', 2),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'stash', null, 'dagger', 1);

-- Claws of Eshin
insert into public.heroes (id, warband_id, name, unit_type_rules_id, stats, xp, level_ups, skill_tables, sort_order)
values
  ('bbbbbbbb-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000002', 'Skritch Nightblade',
   'skaven_assassin_adept', '{"M":6,"WS":4,"BS":4,"S":4,"T":3,"W":1,"I":5,"A":1,"Ld":7}', 20, 8,
   '{combat,shooting,academic,strength,speed,skaven_of_clan_eshin_skills}', 0),
  ('bbbbbbbb-0000-4000-8000-000000000012', 'aaaaaaaa-0000-4000-8000-000000000002', 'Queek',
   'skaven_black_skaven', '{"M":6,"WS":4,"BS":3,"S":4,"T":3,"W":1,"I":5,"A":1,"Ld":6}', 8, 4,
   '{combat,strength,speed,skaven_of_clan_eshin_skills}', 1),
  ('bbbbbbbb-0000-4000-8000-000000000013', 'aaaaaaaa-0000-4000-8000-000000000002', 'Sneek',
   'skaven_night_runners', '{"M":6,"WS":2,"BS":3,"S":3,"T":3,"W":1,"I":5,"A":1,"Ld":4}', 0, 0,
   '{combat,shooting,speed}', 2);

insert into public.henchman_groups (id, warband_id, name, unit_type_rules_id, size, stats, sort_order)
values
  ('cccccccc-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000002', 'Verminkin',
   'skaven_verminkin', 4, '{"M":5,"WS":3,"BS":3,"S":3,"T":3,"W":1,"I":4,"A":1,"Ld":5}', 0),
  ('cccccccc-0000-4000-8000-000000000012', 'aaaaaaaa-0000-4000-8000-000000000002', 'Giant Rats',
   'skaven_giant_rats', 2, '{"M":6,"WS":2,"BS":0,"S":3,"T":3,"W":1,"I":4,"A":1,"Ld":4}', 1);

insert into public.items (warband_id, holder_type, holder_id, item_rules_id, quantity)
values
  ('aaaaaaaa-0000-4000-8000-000000000002', 'hero', 'bbbbbbbb-0000-4000-8000-000000000011', 'sword', 1),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'hero', 'bbbbbbbb-0000-4000-8000-000000000011', 'dagger', 1),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'hero', 'bbbbbbbb-0000-4000-8000-000000000012', 'dagger', 1),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'hero', 'bbbbbbbb-0000-4000-8000-000000000013', 'dagger', 1),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'group', 'cccccccc-0000-4000-8000-000000000011', 'dagger', 4);

-- ---------------------------------------------------------------------------------------------
-- Campaign
-- ---------------------------------------------------------------------------------------------

insert into public.campaigns (id, gm_id, name, invite_code, rules_markdown)
values ('dddddddd-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
        'Ruins of the Stir', 'test-2026',
        'Seed campaign. House rules: no armour erosion, optional criticals, half-price armour.');

insert into public.campaign_members (campaign_id, warband_id, user_id)
values
  ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111'),
  ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222');
