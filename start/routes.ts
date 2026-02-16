/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const ChannelsController = () => import('#controllers/chat/channels_controller')
const MessagesController = () => import('#controllers/chat/messages_controller')

router.get('/', async () => ({
  hello: 'world',
}))

// ---------------------------------------------------------------------------
// Chat API (REST + real-time via Socket.IO at /socket.io)
// ---------------------------------------------------------------------------
router
  .group(() => {
    router.get('/channels', [ChannelsController, 'index'])
    router.post('/channels', [ChannelsController, 'store'])
    router.get('/channels/:id', [ChannelsController, 'show'])

    router.get('/channels/:channelId/messages', [MessagesController, 'index'])
    router.post('/channels/:channelId/messages', [MessagesController, 'store'])
  })
  .prefix('/api')
  .use(middleware.auth())
