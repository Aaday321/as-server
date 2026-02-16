import Channel from '#models/channel'
import type User from '#models/user'

/**
 * Data access for channels. No business logic.
 */
export class ChannelRepository {
  async create(data: { name: string; type: 'direct' | 'group'; createdById: number }): Promise<Channel> {
    return Channel.create(data)
  }

  async findById(id: number): Promise<Channel | null> {
    return Channel.find(id)
  }

  async findByIdWithRelations(id: number, relations: ('createdBy' | 'members')[]): Promise<Channel | null> {
    const channel = await Channel.find(id)
    if (!channel) return null
    for (const rel of relations) {
      await channel.load(rel)
    }
    return channel
  }

  /**
   * List channels where the given user is a member, ordered by updated_at desc.
   */
  async listWhereUserIsMember(user: User): Promise<Channel[]> {
    return Channel.query()
      .whereHas('members', (q) => q.where('users.id', user.id))
      .preload('createdBy')
      .preload('members')
      .orderBy('updated_at', 'desc')
  }

  /**
   * Find channel by id only if user is a member.
   */
  async findByIdForMember(channelId: number, user: User): Promise<Channel | null> {
    return Channel.query()
      .where('id', channelId)
      .whereHas('members', (q) => q.where('users.id', user.id))
      .preload('createdBy')
      .preload('members')
      .first()
  }

  async attachMembers(channel: Channel, userIds: number[]): Promise<void> {
    await channel.related('members').attach(userIds)
  }
}
