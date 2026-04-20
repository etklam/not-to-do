import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/db'
import { challenges, challengeParticipants, notToDos, users } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { createSession, getCurrentUser, hashPassword } from '@/lib/auth'

function randomToken(length: number) {
  return randomBytes(Math.ceil(length * 0.75)).toString('base64url').slice(0, length)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    let user = await getCurrentUser()

    const { shareCode } = await params
    const body = await request.json()
    const sourceItemId = body.sourceItemId ?? body.notToDoId

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.shareCode, shareCode))

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    if (!challenge.isPublic || challenge.status !== 'active') {
      return NextResponse.json(
        { error: 'Challenge is not joinable' },
        { status: 400 }
      )
    }

    if (!user) {
      const [guestUser] = await db
        .insert(users)
        .values({
          email: `guest-${Date.now()}-${randomToken(6)}@guest.ntd.local`,
          passwordHash: await hashPassword(randomToken(20)),
          name: 'Guest',
        })
        .returning({ id: users.id, email: users.email, name: users.name })
      await createSession(guestUser.id)
      user = guestUser
    }

    let item:
      | {
          id: string
          title: string
          description: string | null
        }
      | undefined

    if (sourceItemId) {
      ;[item] = await db
        .select({
          id: notToDos.id,
          title: notToDos.title,
          description: notToDos.description,
        })
        .from(notToDos)
        .where(and(eq(notToDos.id, sourceItemId), eq(notToDos.userId, user.id)))
    } else {
      ;[item] = await db
        .insert(notToDos)
        .values({
          userId: user.id,
          title: challenge.title,
          description: challenge.description || '',
          mode: 'personal',
          challengeId: null,
        })
        .returning({
          id: notToDos.id,
          title: notToDos.title,
          description: notToDos.description,
        })
    }

    if (!item) {
      return NextResponse.json(
        { error: 'Not-to-do item not found' },
        { status: 404 }
      )
    }

    const [existing] = await db
      .select({ id: challengeParticipants.id })
      .from(challengeParticipants)
      .where(
        and(
          eq(challengeParticipants.challengeId, challenge.id),
          eq(challengeParticipants.userId, user.id)
        )
      )

    if (existing) {
      return NextResponse.json(
        { error: 'Already joined this challenge' },
        { status: 400 }
      )
    }

    const activeParticipations = await db
      .select({ id: challengeParticipants.id })
      .from(challengeParticipants)
      .where(eq(challengeParticipants.userId, user.id))

    if (activeParticipations.length >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 active challenges per user' },
        { status: 400 }
      )
    }

    const [challengeItem] = await db
      .insert(notToDos)
      .values({
        userId: user.id,
        title: item.title,
        description: item.description || '',
        mode: 'challenge',
        challengeId: challenge.id,
      })
      .returning()

    const [participant] = await db
      .insert(challengeParticipants)
      .values({
        challengeId: challenge.id,
        userId: user.id,
        notToDoId: challengeItem.id,
      })
      .returning()

    return NextResponse.json(
      { participant, item: challengeItem, slug: challenge.slug },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
