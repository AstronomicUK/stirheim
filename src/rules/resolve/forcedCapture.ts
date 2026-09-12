/** Clan Moulder: Subjugator of Mankind (grade-2a-part2, line 731). The Hero must
 * be equipped with a Thingcatcher; the rule does not require that weapon to deal the blow. */
export function subjugatorCaptures(input:{outOfAction:boolean;attackerIsHero:boolean;skills:readonly string[];equipment:readonly string[];targetLarge:boolean}):boolean {
 return input.outOfAction && input.attackerIsHero && !input.targetLarge
  && input.skills.includes('skaven_of_clan_moulder_special_skills_subjugator_of_mankind')
  && input.equipment.includes('thingcatcher')
}
