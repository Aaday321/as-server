import type { ApplicationService } from '@adonisjs/core/types'
import { ws } from '#services/chat/ws_service'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    const emitter = await this.app.container.make('emitter')
    emitter.on('http:server_ready', async () => {
      const server = await this.app.container.make('server')
      const nodeServer = server.getNodeServer()
      if (nodeServer) {
        ws.attachTo(nodeServer)
      }
    })
  }
}
