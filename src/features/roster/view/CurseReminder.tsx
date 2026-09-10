import {BALEWOLF_RULES} from '../../postBattle/model/lycanthrope'
export function CurseReminder({names}:{names:string[]}){
 if(!names.length)return null
 return <details className="rounded border border-border bg-surface-low px-4 py-3 text-sm"><summary className="min-h-11 cursor-pointer font-medium">Balewolf curse — {names.join(', ')}</summary><div className="flex flex-col gap-2"><p>Whenever wounded, take a Leadership test. Failure transforms the cursed model; only the named models carry the curse.</p><p>M5 · WS4 · BS0 · S5 · T5 · W3 · I4 · A2 + jaws · Ld7</p><p>{BALEWOLF_RULES}</p><p>Transformation destroys worn equipment. Dropped weapons may be recovered after the battle. Then roll D6: 1 leaves permanently; 2–6 returns to normal, still cursed. Record the actual transformation and equipment in the post-battle report.</p></div></details>
}
