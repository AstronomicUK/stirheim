// Generate the native classification snapshot used by capture migrations. Catalogue data only.
import {rolldown} from 'rolldown';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const code=`import {WARBAND_TEMPLATES} from '${root}/src/rules/data/warbandTemplates/index.ts';
import {unitIsLarge} from '${root}/src/rules/resolve/builder.ts';
import {unitRules} from '${root}/src/rules/data/campaignRules/index.ts';
import {HIRED_SWORDS} from '${root}/src/rules/data/campaign/hiredSwords.ts';
import {DRAMATIS_PERSONAE} from '${root}/src/rules/data/campaign/dramatisPersonae.ts';
export default [...WARBAND_TEMPLATES.flatMap(w=>[...w.heroTemplates,...w.henchmanTemplates].map(u=>({key:u.id,large:unitIsLarge(u),animal:Boolean(unitRules(u.id).isAnimal)}))),...[...HIRED_SWORDS,...DRAMATIS_PERSONAE].map(u=>({key:'hired:'+u.id,large:Boolean(u.detail?.specialRules.some(r=>/large/i.test(r.name))),animal:Boolean(u.detail?.specialRules.some(r=>/^animals?$/i.test(r.name)))}))];`;
const bundle=await rolldown({input:'virtual:traits',plugins:[{name:'traits',resolveId:id=>id==='virtual:traits'?id:null,load:id=>id==='virtual:traits'?code:null}]});
const out=await bundle.generate({format:'esm'});await bundle.close();
const rows=(await import('data:text/javascript;base64,'+Buffer.from(out.output[0].code).toString('base64'))).default;
const unique=[...new Map(rows.map(r=>[r.key,r])).values()].sort((a,b)=>a.key.localeCompare(b.key));
console.log(JSON.stringify(unique,null,2));
