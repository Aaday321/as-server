import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

export const createMessageSchema = vine.object({
  body: vine.string().trim().minLength(1).maxLength(10000),
})

export type CreateMessagePayload = Infer<typeof createMessageSchema>

export const createMessageValidator = vine.compile(createMessageSchema)
