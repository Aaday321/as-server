import { DateTime } from 'luxon'
import Channel from '#models/channel'
import Message from '#models/message'
import ChannelMember from '#models/channel_member'
import User from '#models/user'
import type { CreateChannelPayload } from '#validators/create_channel'
import type { CreateMessagePayload } from '#validators/create_message'

/**
 * Chat domain service: channel and message operations.
 * Keeps controllers thin and centralizes business rules.
 */
export class ChatService {
  /**
   * Create a channel and optionally add members.
   */
  async createChannel(creator: User, payload: CreateChannelPayload): Promise<Channel> {
    const channel = await Channel.create({
      name: payload.name,
      type: payload.type,
      createdById: creator.id,
    })

    const memberIds = payload.memberIds ?? []
    const allMemberIds = [creator.id, ...memberIds].filter(
      (id, i, arr) => arr.indexOf(id) === i
    )

    await channel.related('members').attach(allMemberIds)

    await channel.load('createdBy')
    await channel.load('members')
    return channel
  }

  /**
   * List channels the user is a member of.
   */
  async listChannelsForUser(user: User): Promise<Channel[]> {
    return Channel.query()
      .whereHas('members', (q) => q.where('users.id', user.id))
      .preload('createdBy')
      .preload('members')
      .orderBy('updated_at', 'desc')
  }

  /**
   * Get a single channel by id if the user is a member.
   */
  async getChannelForUser(channelId: number, user: User): Promise<Channel | null> {
    return Channel.query()
      .where('id', channelId)
      .whereHas('members', (q) => q.where('users.id', user.id))
      .preload('createdBy')
      .preload('members')
      .first()
  }

  /**
   * Add a user to a channel (if allowed by policy; caller should check).
   */
  async addMember(channelId: number, userId: number): Promise<ChannelMember> {
    const existing = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()
    if (existing) return existing

    const member = await ChannelMember.create({
      channelId,
      userId,
      joinedAt: DateTime.now(),
    })
    return member
  }

  /**
   * Create a message in a channel. Caller must ensure user is a member.
   */
  async createMessage(
    channelId: number,
    user: User,
    payload: CreateMessagePayload
  ): Promise<Message> {
    const message = await Message.create({
      channelId,
      userId: user.id,
      body: payload.body,
    })
    await message.load('user')
    return message
  }

  /**
   * Paginated messages for a channel. User must be a member (caller checks).
   */
  async getMessages(
    channelId: number,
    options: { beforeId?: number; limit?: number } = {}
  ): Promise<Message[]> {
    const limit = Math.min(options.limit ?? 50, 100)
    const q = Message.query()
      .where('channel_id', channelId)
      .preload('user')
      .orderBy('id', 'desc')
      .limit(limit)

    if (options.beforeId) {
      q.where('id', '<', options.beforeId)
    }

    return q
  }

  /**
   * Check if user is a member of the channel.
   */
  async isMember(channelId: number, userId: number): Promise<boolean> {
    const m = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()
    return !!m
  }
}
