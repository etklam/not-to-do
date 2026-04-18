import { NextResponse } from 'next/server'
import { db } from '@/db'
import { challenges, challengeParticipants, notToDos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const { notToDoId } = body

    if (!notToDoId) {
      return NextResponse.json(
        { error: 'notToDoId is required' },
        { status: 400 }
      )
    }

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

    // Verify the notToDo belongs to the user
    const [item] = await db
      .select({ id: notToDos.id })
      .from(notToDos)
      .where(and(eq(notToDos.id, notToDoId), eq(notToDos.userId, user.id)))

    if (!item) {
      return NextResponse.json(
        { error: 'Not-to-do item not found' },
        { status: 404 }
      )
    }

    // Check not already joined
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

    // Check max 3 active challenges per user
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

    const [participant] = await db
      .insert(challengeParticipants)
      .values({
        challengeId: challenge.id,
        userId: user.id,
        notToDoId,
      })
      .returning()

    return NextResponse.json({ participant }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
