import { NextResponse } from 'next/server'
import { db } from '@/db'
import { challenges, challengeParticipants, notToDos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
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

    // Creator cannot leave their own challenge
    if (challenge.creatorId === user.id) {
      return NextResponse.json(
        { error: 'Creator cannot leave the challenge. Delete it instead.' },
        { status: 400 }
      )
    }

    const [participation] = await db
      .select({ id: challengeParticipants.id, notToDoId: challengeParticipants.notToDoId })
      .from(challengeParticipants)
      .where(
        and(
          eq(challengeParticipants.challengeId, challenge.id),
          eq(challengeParticipants.userId, user.id)
        )
      )

    if (!participation) {
      return NextResponse.json(
        { error: 'Not a participant in this challenge' },
        { status: 400 }
      )
    }

    await db
      .update(notToDos)
      .set({ isActive: false })
      .where(eq(notToDos.id, participation.notToDoId))

    await db
      .delete(challengeParticipants)
      .where(eq(challengeParticipants.id, participation.id))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
