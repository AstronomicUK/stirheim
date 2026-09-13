import {createRoot} from 'react-dom/client'
import {ForcedCaptiveForm} from '../../../src/features/roster/view/ForcedCaptiveForm'
export function mount(){
 const host=document.createElement('main');document.body.replaceChildren(host)
 createRoot(host).render(<ForcedCaptiveForm name="Captured warrior" ownerGold={50} pending={false} submitLabel="Propose outcome" allowSell={false} onSubmit={()=>{}}/>)
}
