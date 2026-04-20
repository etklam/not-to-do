import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, createSession } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { ok } = rateLimit(`login:${ip}`, 5, 60 * 1000)
    if (!ok) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = result[0]
    const valid = await verifyPassword(password, user.passwordHash)

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    await createSession(user.id)

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
