import { DateTime } from 'luxon'
import ChannelMember from '#models/channel_member'

/**
 * Data access for channel membership. No business logic.
 */
export class ChannelMemberRepository {
  async findByChannelAndUser(channelId: number, userId: number): Promise<ChannelMember | null> {
    return ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()
  }

  async isMember(channelId: number, userId: number): Promise<boolean> {
    const member = await this.findByChannelAndUser(channelId, userId)
    return !!member
  }

  async addMember(channelId: number, userId: number): Promise<ChannelMember> {
    const existing = await this.findByChannelAndUser(channelId, userId)
    if (existing) return existing

    return ChannelMember.create({
      channelId,
      userId,
      joinedAt: DateTime.now(),
    })
  }
}
