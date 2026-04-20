import { NextResponse } from 'next/server'
import { db } from '@/db'
import { challenges, challengeParticipants, notToDos } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shareCode } = await params
    const body = await request.json()
    const sourceItemId = body.sourceItemId ?? body.notToDoId

    if (!sourceItemId) {
      return NextResponse.json(
        { error: 'sourceItemId is required' },
        { status: 400 }
      )
    }

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

    const [item] = await db
      .select({
        id: notToDos.id,
        title: notToDos.title,
        description: notToDos.description,
      })
      .from(notToDos)
      .where(and(eq(notToDos.id, sourceItemId), eq(notToDos.userId, user.id)))

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
