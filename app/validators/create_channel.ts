import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

export const createChannelSchema = vine.object({
  name: vine.string().trim().minLength(1).maxLength(255),
  type: vine.enum(['direct', 'group']),
  memberIds: vine.array(vine.number()).optional(),
})

export type CreateChannelPayload = Infer<typeof createChannelSchema>

export const createChannelValidator = vine.compile(createChannelSchema)
