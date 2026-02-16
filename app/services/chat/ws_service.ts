import { Server } from 'socket.io'
import type { Server as NodeHttpServer } from 'node:http'
import { registerChatHandlers } from '#services/chat/ws_gateway'

/**
 * Singleton Socket.IO server.
 * Boot with attachTo(httpServer) after the HTTP server is listening.
 */
class WsService {
  public io: Server | null = null
  private booted = false

  attachTo(httpServer: NodeHttpServer): void {
    if (this.booted) return
    this.booted = true

    this.io = new Server(httpServer, {
      cors: {
        origin: true,
        credentials: true,
      },
      path: '/socket.io',
    })

    registerChatHandlers(this.io)
  }

  getIo(): Server | null {
    return this.io
  }
}

export const ws = new WsService()
