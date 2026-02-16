import type { HttpContext } from '@adonisjs/core/http'
import { ChatService } from '#services/chat/chat_service'
import { createChannelValidator } from '#validators/create_channel'

const chatService = new ChatService()

/**
 * REST API for chat channels.
 * All routes require auth (middleware).
 */
export default class ChannelsController {
  /**
   * List channels the authenticated user is a member of.
   */
  async index({ auth }: HttpContext) {
    const user = auth.user!
    const channels = await chatService.listChannelsForUser(user)
    return { data: channels }
  }

  /**
   * Create a new channel (and optionally add members).
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(createChannelValidator)
    const channel = await chatService.createChannel(user, payload)
    return response.created({ data: channel })
  }

  /**
   * Get a single channel by id (must be a member).
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const channel = await chatService.getChannelForUser(Number(params.id), user)
    if (!channel) {
      return response.notFound({ message: 'Channel not found' })
    }
    return { data: channel }
  }
}
