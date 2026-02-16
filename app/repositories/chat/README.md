# Chat repositories

**Repository layer**: data access only. No business logic, no HTTP.

- **`channel_repository.ts`** – Create channel, find by id, list by member, attach members.
- **`message_repository.ts`** – Create message, paginated list by channel.
- **`channel_member_repository.ts`** – Find member, check membership, add member.

Used by `ChatService` only. Controllers and the Socket.IO gateway call the service, not repositories.
