import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Message from '#models/message'
import ChannelMember from '#models/channel_member'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: 'direct' | 'group'

  @column({ columnName: 'created_by_id' })
  declare createdById: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'createdById' })
  declare createdBy: BelongsTo<typeof User>

  @hasMany(() => Message, { foreignKey: 'channelId' })
  declare messages: HasMany<typeof Message>

  @hasMany(() => ChannelMember, { foreignKey: 'channelId' })
  declare memberships: HasMany<typeof ChannelMember>

  @manyToMany(() => User, {
    pivotTable: 'channel_members',
    pivotForeignKey: 'channel_id',
    pivotRelatedForeignKey: 'user_id',
    pivotTimestamps: { createdAt: 'joined_at', updatedAt: false },
  })
  declare members: ManyToMany<typeof User>
}
