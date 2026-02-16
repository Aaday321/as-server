import type { Server, Socket } from 'socket.io'
import User from '#models/user'
import { ChatService } from '#services/chat/chat_service'

const chatService = new ChatService()

const CHANNEL_ROOM_PREFIX = 'channel:'

export function getChannelRoom(channelId: number): string {
  return `${CHANNEL_ROOM_PREFIX}${channelId}`
}

/**
 * Resolve authenticated user from socket handshake (token in auth.token or query.token).
 */
async function authenticateSocket(socket: Socket): Promise<User | null> {
  const token =
    (socket.handshake.auth && (socket.handshake.auth as { token?: string }).token) ||
    (socket.handshake.query && (socket.handshake.query as { token?: string }).token)

  if (!token || typeof token !== 'string') return null

  const accessToken = await User.accessTokens.verify(token as any)
  if (!accessToken || accessToken.isExpired()) return null

  const user = await User.find(accessToken.tokenableId as number)
  return user ?? null
}

/**
 * Register Socket.IO event handlers for chat (join, leave, send_message, typing).
 * Call after io is created and use after connection middleware sets socket.data.user.
 */
export function registerChatHandlers(io: Server): void {
  io.on('connection', async (socket: Socket) => {
    const user = await authenticateSocket(socket)
    if (!user) {
      socket.emit('error', { message: 'Authentication required' })
      socket.disconnect(true)
      return
    }

    socket.data.userId = user.id
    socket.data.user = user

    socket.on('join_channel', async (payload: { channelId: number }, cb) => {
      const channelId = payload?.channelId
      if (typeof channelId !== 'number') {
        cb?.({ ok: false, error: 'Invalid channelId' })
        return
      }
      const isMember = await chatService.isMember(channelId, user.id)
      if (!isMember) {
        cb?.({ ok: false, error: 'Not a member of this channel' })
        return
      }
      const room = getChannelRoom(channelId)
      await socket.join(room)
      cb?.({ ok: true })
    })

    socket.on('leave_channel', (payload: { channelId: number }, cb) => {
      const channelId = payload?.channelId
      if (typeof channelId !== 'number') {
        cb?.({ ok: false, error: 'Invalid channelId' })
        return
      }
      socket.leave(getChannelRoom(channelId))
      cb?.({ ok: true })
    })

    socket.on(
      'send_message',
      async (
        payload: { channelId: number; body: string },
        cb?: (res: { ok: boolean; error?: string; message?: any }) => void
      ) => {
        const channelId = payload?.channelId
        const body = typeof payload?.body === 'string' ? payload.body.trim() : ''
        if (typeof channelId !== 'number' || !body) {
          cb?.({ ok: false, error: 'Invalid channelId or body' })
          return
        }
        const isMember = await chatService.isMember(channelId, user.id)
        if (!isMember) {
          cb?.({ ok: false, error: 'Not a member of this channel' })
          return
        }
        try {
          const message = await chatService.createMessage(channelId, user, { body })
          const room = getChannelRoom(channelId)
          const payload = message.serialize() as Record<string, unknown>
          io.to(room).emit('message', payload)
          cb?.({ ok: true, message: payload })
        } catch (e) {
          cb?.({ ok: false, error: 'Failed to send message' })
        }
      }
    )

    socket.on('typing_start', async (payload: { channelId: number }) => {
      const channelId = payload?.channelId
      if (typeof channelId !== 'number') return
      const isMember = await chatService.isMember(channelId, user.id)
      if (!isMember) return
      socket.to(getChannelRoom(channelId)).emit('user_typing', {
        channelId,
        userId: user.id,
        fullName: user.fullName,
      })
    })

    socket.on('typing_stop', (payload: { channelId: number }) => {
      const channelId = payload?.channelId
      if (typeof channelId !== 'number') return
      socket.to(getChannelRoom(channelId)).emit('user_stopped_typing', {
        channelId,
        userId: user.id,
      })
    })

    socket.on('disconnect', () => {})
  })
}
