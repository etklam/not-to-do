import { NextResponse } from 'next/server'
import { db } from '@/db'
import { challenges, challengeParticipants, notToDos, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.slug, slug))

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Get all participants with their linked not-to-do data
    const participants = await db
      .select({
        userId: challengeParticipants.userId,
        joinedAt: challengeParticipants.joinedAt,
        userName: users.name,
        userEmail: users.email,
        notToDoTitle: notToDos.title,
        streak: notToDos.streak,
        bestStreak: notToDos.bestStreak,
        lastCheckin: notToDos.lastCheckin,
        isActive: notToDos.isActive,
      })
      .from(challengeParticipants)
      .innerJoin(users, eq(challengeParticipants.userId, users.id))
      .innerJoin(notToDos, eq(challengeParticipants.notToDoId, notToDos.id))
      .where(eq(challengeParticipants.challengeId, challenge.id))
      .orderBy(notToDos.streak)

    const hasJoined = participants.some((p) => p.userId === user.id)

    return NextResponse.json({
      challenge: {
        ...challenge,
        hasJoined,
        participantCount: participants.length,
      },
      participants,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.slug, slug))

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    if (challenge.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Only the creator can delete this challenge' },
        { status: 403 }
      )
    }

    await db.delete(challenges).where(eq(challenges.id, challenge.id))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
