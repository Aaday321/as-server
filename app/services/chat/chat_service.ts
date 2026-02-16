import type User from '#models/user'
import type Channel from '#models/channel'
import type Message from '#models/message'
import type ChannelMember from '#models/channel_member'
import type { CreateChannelPayload } from '#validators/create_channel'
import type { CreateMessagePayload } from '#validators/create_message'
import { ChannelRepository } from '#repositories/chat/channel_repository'
import { MessageRepository } from '#repositories/chat/message_repository'
import { ChannelMemberRepository } from '#repositories/chat/channel_member_repository'

/**
 * Chat application service: business logic and orchestration.
 * Delegates all data access to repositories.
 */
export class ChatService {
  constructor(
    private readonly channelRepo = new ChannelRepository(),
    private readonly messageRepo = new MessageRepository(),
    private readonly memberRepo = new ChannelMemberRepository()
  ) {}

  /**
   * Create a channel and add creator + optional members (business rule: creator is always included).
   */
  async createChannel(creator: User, payload: CreateChannelPayload): Promise<Channel> {
    const channel = await this.channelRepo.create({
      name: payload.name,
      type: payload.type,
      createdById: creator.id,
    })

    const memberIds = payload.memberIds ?? []
    const allMemberIds = [creator.id, ...memberIds].filter(
      (id, i, arr) => arr.indexOf(id) === i
    )
    await this.channelRepo.attachMembers(channel, allMemberIds)

    const withRelations = await this.channelRepo.findByIdWithRelations(channel.id, [
      'createdBy',
      'members',
    ])
    return withRelations!
  }

  /**
   * List channels the user is a member of.
   */
  async listChannelsForUser(user: User): Promise<Channel[]> {
    return this.channelRepo.listWhereUserIsMember(user)
  }

  /**
   * Get a channel by id if the user is a member.
   */
  async getChannelForUser(channelId: number, user: User): Promise<Channel | null> {
    return this.channelRepo.findByIdForMember(channelId, user)
  }

  /**
   * Add a user to a channel (idempotent). Caller is responsible for authorization.
   */
  async addMember(channelId: number, userId: number): Promise<ChannelMember> {
    return this.memberRepo.addMember(channelId, userId)
  }

  /**
   * Create a message in a channel. Caller must ensure user is a member.
   */
  async createMessage(
    channelId: number,
    user: User,
    payload: CreateMessagePayload
  ): Promise<Message> {
    return this.messageRepo.create({
      channelId,
      userId: user.id,
      body: payload.body,
    })
  }

  /**
   * Paginated messages for a channel. Caller must ensure user is a member.
   */
  async getMessages(
    channelId: number,
    options: { beforeId?: number; limit?: number } = {}
  ): Promise<Message[]> {
    return this.messageRepo.listByChannel(channelId, options)
  }

  /**
   * Check if user is a member of the channel.
   */
  async isMember(channelId: number, userId: number): Promise<boolean> {
    return this.memberRepo.isMember(channelId, userId)
  }
}
