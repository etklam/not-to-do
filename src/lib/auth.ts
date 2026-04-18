import { cookies } from 'next/headers'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const SESSION_COOKIE = 'ntd_session'
const SESSION_DAYS = 30

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const token = uuidv4()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS)

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })

  return token
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1)

  if (result.length === 0) return null

  const session = await db
    .select({ expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1)

  if (session.length === 0 || session[0].expiresAt < new Date()) {
    // Expired session — clean up
    await db.delete(sessions).where(eq(sessions.token, token))
    const cs = await cookies()
    cs.delete(SESSION_COOKIE)
    return null
  }

  return result[0]
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token))
    cookieStore.delete(SESSION_COOKIE)
  }
}
