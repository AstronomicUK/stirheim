export const CHAOS_MARKS=[{id:'undivided',name:'Chaos Undivided'},{id:'eagle',name:'Tchar the Eagle'},{id:'arkhar',name:'Arkhar the Dog'},{id:'crow',name:'Onogal the Crow'},{id:'serpent',name:'Shornaal the Serpent'}] as const
export function chaosMarkId(id:string|undefined){return id==='onogal'?'crow':id==='tchar'?'eagle':id==='shornaal'?'serpent':id}
