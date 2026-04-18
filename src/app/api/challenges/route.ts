import { NextResponse } from 'next/server'
import { db } from '@/db'
import { challenges, challengeParticipants, notToDos } from '@/db/schema'
import { eq, and, or, sql, count } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all public challenges + challenges user participates in
    const results = await db
      .select({
        id: challenges.id,
        title: challenges.title,
        description: challenges.description,
        slug: challenges.slug,
        creatorId: challenges.creatorId,
        isPublic: challenges.isPublic,
        createdAt: challenges.createdAt,
        participantCount: count(challengeParticipants.id),
      })
      .from(challenges)
      .leftJoin(
        challengeParticipants,
        eq(challenges.id, challengeParticipants.challengeId)
      )
      .where(
        or(
          eq(challenges.isPublic, true),
          sql`${challenges.id} IN (
            SELECT ${challengeParticipants.challengeId}
            FROM ${challengeParticipants}
            WHERE ${challengeParticipants.userId} = ${user.id}
          )`
        )
      )
      .groupBy(challenges.id)
      .orderBy(challenges.createdAt)

    // Get challenges the user has joined
    const userParticipations = await db
      .select({ challengeId: challengeParticipants.challengeId })
      .from(challengeParticipants)
      .where(eq(challengeParticipants.userId, user.id))

    const joinedSet = new Set(userParticipations.map((p) => p.challengeId))

    const challengeList = results.map((c) => ({
      ...c,
      hasJoined: joinedSet.has(c.id),
    }))

    return NextResponse.json({ challenges: challengeList })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, notToDoId, description, isPublic } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!notToDoId) {
      return NextResponse.json(
        { error: 'notToDoId is required' },
        { status: 400 }
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

    // Check max 3 active challenges per user (as participant)
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

    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 6)

    const [challenge] = await db
      .insert(challenges)
      .values({
        title: title.trim(),
        description: description?.trim() || '',
        slug,
        creatorId: user.id,
        isPublic: isPublic ?? true,
      })
      .returning()

    // Creator automatically becomes a participant
    await db.insert(challengeParticipants).values({
      challengeId: challenge.id,
      userId: user.id,
      notToDoId,
    })

    return NextResponse.json({ challenge }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
