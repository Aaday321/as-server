import type { HttpContext } from '@adonisjs/core/http'
import { ChatService } from '#services/chat/chat_service'
import { createMessageValidator } from '#validators/create_message'
import { ws } from '#services/chat/ws_service'
import { getChannelRoom } from '#services/chat/ws_gateway'

const chatService = new ChatService()

/**
 * REST API for channel messages (history, pagination).
 * Real-time delivery is handled via Socket.IO in start/socket.ts.
 */
export default class MessagesController {
  /**
   * Paginated messages for a channel. Query: ?beforeId=&limit=
   */
  async index({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const channelId = Number(params.channelId)
    const isMember = await chatService.isMember(channelId, user.id)
    if (!isMember) {
      return response.forbidden({ message: 'Not a member of this channel' })
    }

    const beforeId = request.input('beforeId')
    const limit = request.input('limit', 50)
    const messages = await chatService.getMessages(channelId, {
      beforeId: beforeId ? Number(beforeId) : undefined,
      limit: Number(limit),
    })

    return { data: messages.reverse() }
  }

  /**
   * Create a message (also used by Socket.IO handler; REST for compatibility).
   */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const channelId = Number(params.channelId)
    const isMember = await chatService.isMember(channelId, user.id)
    if (!isMember) {
      return response.forbidden({ message: 'Not a member of this channel' })
    }

    const payload = await request.validateUsing(createMessageValidator)
    const message = await chatService.createMessage(channelId, user, payload)
    const io = ws.getIo()
    if (io) {
      io.to(getChannelRoom(channelId)).emit('message', message.serialize())
    }
    return response.created({ data: message })
  }
}
