import { SelectField } from '../../ui'
import { CONTROLLERS } from '../../rules/resolve/rosterComposition'
export function ConstructController({value, onChange}: {value?: typeof CONTROLLERS[number]; onChange: (value: typeof CONTROLLERS[number] | undefined) => void}) {
 return <SelectField label="Scarecrow controller" value={value ?? ''} onChange={e => onChange(CONTROLLERS.find(id => id === e.target.value))} hint="One Scarecrow per Liche or Necromancer. It sits out whenever its controller cannot fight.">
  <option value="">Choose a controller…</option><option value="restless_dead_liche">Liche</option><option value="restless_dead_necromancer">Necromancer</option>
 </SelectField>
}
