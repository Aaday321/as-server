import Message from '#models/message'

/**
 * Data access for messages. No business logic.
 */
export class MessageRepository {
  async create(data: { channelId: number; userId: number; body: string }): Promise<Message> {
    const message = await Message.create(data)
    await message.load('user')
    return message
  }

  /**
   * Paginated list for a channel, newest first (by id desc).
   */
  async listByChannel(
    channelId: number,
    options: { beforeId?: number; limit?: number } = {}
  ): Promise<Message[]> {
    const limit = Math.min(options.limit ?? 50, 100)
    const q = Message.query()
      .where('channel_id', channelId)
      .preload('user')
      .orderBy('id', 'desc')
      .limit(limit)

    if (options.beforeId != null) {
      q.where('id', '<', options.beforeId)
    }

    return q
  }
}
