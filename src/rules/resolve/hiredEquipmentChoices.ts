import type { RosterItem } from '../types/roster';

export interface HiredEquipmentChoice {
  id: string;
  label: string;
  equipment: RosterItem[];
}

const item = (itemId: string, quantity = 1): RosterItem => ({ itemId, quantity });
const choice = (id: string, label: string, equipment: RosterItem[]): HiredEquipmentChoice => ({ id, label, equipment });
const ogreWeapons = [['sword', 'Sword'], ['axe', 'Axe'], ['club_mace_or_hammer', 'Club']] as const;

/** Printed alternatives in reference/rules/04-hired-swords.md. Unique gear stays explicit. */
export const HIRED_EQUIPMENT_CHOICES: Record<string, HiredEquipmentChoice[]> = {
  dwarf_troll_slayer: [
    choice('axes', 'Two axes', [item('axe', 2)]),
    choice('double', 'Double-handed axe', [item('double_handed_weapon')]),
  ],
  ogre_bodyguard: [
    ...ogreWeapons.flatMap(([first, firstName], index) => ogreWeapons.slice(index).map(([second, secondName]) =>
      choice(`${first}-${second}`, first === second ? `Two ${firstName.toLowerCase()}s` : `${firstName} and ${secondName.toLowerCase()}`,
        [...(first === second ? [item(first, 2)] : [item(first), item(second)]), item('light_armour')]))),
    choice('double', 'Double-handed weapon', [item('double_handed_weapon'), item('light_armour')]),
  ],
  gaoler: [
    choice('flail', 'Chain of keys and locks (flail)', [item('flail')]),
    choice('clubs', 'Two hammers or clubs', [item('club_mace_or_hammer', 2)]),
  ],
  norse_shaman: ['sword', 'axe'].map(weapon => choice(weapon, `Rune Staff and ${weapon}`, [
    { itemId: null, customName: 'Rune Staff', quantity: 1 }, item(weapon),
  ])),
  witch_hunter: ['duelling_pistol', 'crossbow_pistol'].map(weapon => choice(weapon,
    weapon === 'duelling_pistol' ? 'Duelling pistol, sword and dagger' : 'Crossbow pistol, sword and dagger',
    [item(weapon), item('sword'), item('dagger')])),
  chaos_centaur: ['sword', 'spear'].map(weapon => choice(weapon, `${weapon === 'sword' ? 'Sword' : 'Spear'}, shield and throwing axes`, [
    item(weapon), item('shield'), item('throwing_knives_stars'),
  ])),
};
