// Local-only catalogue and succession regression. All fixture writes roll back.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const generated=execFileSync(process.execPath,[`${root}/scripts/generate-warband-leaders.mjs`],{encoding:'utf8'});
const migration=readFileSync(`${root}/supabase/migrations/20260913000128_warband_leader_catalogue.sql`,'utf8');
if(generated!==migration)throw Error('Leader migration differs from the current roster catalogue.');
const sql=`begin;
${migration}
do $$
declare owner uuid := gen_random_uuid(); band uuid := gen_random_uuid();
 profile jsonb := '{"M":4,"WS":3,"BS":3,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":7}';
 native uuid := gen_random_uuid(); successor uuid := gen_random_uuid(); temp uuid := gen_random_uuid(); priest uuid := gen_random_uuid(); dreamer uuid := gen_random_uuid();
begin
 insert into auth.users(id,email,raw_user_meta_data) values(owner, owner::text||'@stirheim.test','{"display_name":"Disposable leader check"}');
 insert into public.warbands(id,owner_id,name,type_rules_id) values(band,owner,'Disposable leader check','mercenaries_reikland');
 insert into public.heroes(id,warband_id,name,unit_type_rules_id,stats,status,flags) values
 (native,band,'Captain','mercenaries_reikland_captain',profile,'active','{}'),
 (successor,band,'Successor','mercenaries_reikland_champion',profile,'active','{"leaderRoleId":"mercenaries_reikland_captain"}'),
 (temp,band,'Acting leader','mercenaries_reikland_champion',profile,'active','{"temporaryLeader":true}');
 if public.warband_leader(band) is distinct from native then raise exception 'Native leader precedence failed'; end if;
 update public.heroes set status='dead' where id=native;
 if public.warband_leader(band) is distinct from successor then raise exception 'Permanent succession failed'; end if;
 update public.heroes set status='dead' where id=successor;
 if public.warband_leader(band) is distinct from temp then raise exception 'Temporary succession failed'; end if;
 update public.heroes set is_hired_sword=true, unit_type_rules_id=null, hired_sword_rules_id='ogre_bodyguard' where id=temp;
 if public.warband_leader(band) is not null then raise exception 'Hired Sword became leader'; end if;
 update public.warbands set type_rules_id='dreamwalkers_cult_of_morr' where id=band;
 insert into public.heroes(id,warband_id,name,unit_type_rules_id,stats,status) values
 (priest,band,'Priest','dreamwalkers_priest_of_morr',profile,'active'),
 (dreamer,band,'Dreamer','dreamwalkers_dreamer',profile,'active');
 if public.warband_leader(band) is distinct from dreamer then raise exception 'Dreamer precedence failed'; end if;
 update public.heroes set status='dead' where id=dreamer;
 if public.warband_leader(band) is distinct from priest then raise exception 'Priest fallback failed'; end if;
 if public.warband_leader_unit('black_dwarfs') is distinct from 'black_dwarfs_sorcerer' then raise exception 'Existing Chaos Dwarf lookup regressed'; end if;
 if public.warband_leader_unit('not_a_warband') is not null then raise exception 'Unknown catalogue entry invented'; end if;
 if has_function_privilege('anon','public.warband_leader(uuid)','EXECUTE') or has_function_privilege('authenticated','public.warband_leader(uuid)','EXECUTE') then raise exception 'Private leader helper exposed'; end if;
end $$;
rollback;`;
execFileSync('docker',['exec','-i','supabase_db_stirheim','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-q'],{input:sql,encoding:'utf8',env:{...process.env,DOCKER_HOST:'unix:///Users/tombrookes/.docker/run/docker.sock'},stdio:['pipe','pipe','pipe']});
console.log('PASS: generated catalogue matches roster templates; native/permanent/temporary leadership, hired exclusion, Dreamwalker precedence and private permissions verified. Fixtures and migration rolled back.');
