# Chat module

Real-time chat is implemented with **REST for persistence** and **Socket.IO for real-time delivery**.

## Structure

- **`chat_service.ts`** – Domain logic: create channels, add members, create messages, list messages.
- **`ws_service.ts`** – Singleton Socket.IO server; attaches to the HTTP server on `http:server_ready`.
- **`ws_gateway.ts`** – Socket.IO event handlers: auth, `join_channel`, `leave_channel`, `send_message`, `typing_start`, `typing_stop`.

## REST API (authenticated with Bearer token)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/channels` | List channels the user is in |
| POST | `/api/channels` | Create channel (body: `name`, `type`, optional `memberIds`) |
| GET | `/api/channels/:id` | Get one channel |
| GET | `/api/channels/:channelId/messages?beforeId=&limit=` | Paginated messages |
| POST | `/api/channels/:channelId/messages` | Create message (body: `body`) |

## Socket.IO (same origin or CORS)

Connect with the same Bearer token so the server can authenticate the socket:

- **Auth:** send token in `auth.token` or query `token` when connecting.
- **Events to emit:**
  - `join_channel` `{ channelId }` – join a channel room (must be a member).
  - `leave_channel` `{ channelId }`.
  - `send_message` `{ channelId, body }` – creates message and broadcasts to room.
  - `typing_start` / `typing_stop` `{ channelId }` – broadcast to others in room.
- **Events received:**
  - `message` – new message in a channel you joined.
  - `user_typing` / `user_stopped_typing` – typing indicators.

Messages created via REST are also broadcast to the channel’s Socket.IO room.
