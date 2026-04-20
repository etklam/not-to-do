import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  date,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Challenges ───

export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').default(''),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  shareCode: varchar('share_code', { length: 32 }).unique().notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  creatorId: uuid('creator_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const notToDos = pgTable('not_to_dos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').default(''),
  streak: integer('streak').default(0).notNull(),
  bestStreak: integer('best_streak').default(0).notNull(),
  lastCheckin: date('last_checkin'),
  isActive: boolean('is_active').default(true).notNull(),
  mode: varchar('mode', { length: 20 }).default('personal').notNull(),
  challengeId: uuid('challenge_id').references(() => challenges.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const checkins = pgTable(
  'checkins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notToDoId: uuid('not_to_do_id')
      .references(() => notToDos.id, { onDelete: 'cascade' })
      .notNull(),
    date: date('date').notNull(),
    status: varchar('status', { length: 20 }).notNull(), // 'resisted' | 'failed'
    resistCount: integer('resist_count').default(0).notNull(),
    temptationLevel: varchar('temptation_level', { length: 20 }), // 'none' | 'some' | 'many' | null
    triggerTags: text('trigger_tags').default('[]').notNull(), // JSON array
    note: text('note').default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.notToDoId, t.date)]
)

export const dailyResists = pgTable(
  'daily_resists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notToDoId: uuid('not_to_do_id')
      .references(() => notToDos.id, { onDelete: 'cascade' })
      .notNull(),
    date: date('date').notNull(),
    count: integer('count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.notToDoId, t.date)]
)

export const challengeParticipants = pgTable(
  'challenge_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    challengeId: uuid('challenge_id')
      .references(() => challenges.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    notToDoId: uuid('not_to_do_id')
      .references(() => notToDos.id, { onDelete: 'cascade' })
      .notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.challengeId, t.userId)]
)

// ─── Push Subscriptions ───

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
