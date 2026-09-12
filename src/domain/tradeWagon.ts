import {z} from 'zod'
import {henchmanGroupRowSchema,itemRowSchema,uuidSchema} from './rows'
// Keep every original database field: the server compares and restores the complete row.
const originalItem=itemRowSchema.and(z.record(z.string(),z.unknown()))
const originalGroup=henchmanGroupRowSchema.and(z.record(z.string(),z.unknown()))
export const tradeWagonSnapshotSchema=z.object({
  match_id:uuidSchema,merchant_id:uuidSchema,captor_id:uuidSchema,
  failed_rout:z.literal(true),driver_present:z.literal(false),
  merchant_all_ooa:z.boolean(),rare_search_blocked:z.boolean(),
  wagon:z.discriminatedUnion('kind',[
    z.object({kind:z.literal('item'),expected:originalItem}),
    z.object({kind:z.literal('group'),expected:originalGroup}),
  ]),
  cargo:z.object({items:z.array(originalItem),wyrdstone:z.number().int().nonnegative()}),
})
