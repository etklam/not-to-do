import { NextResponse } from 'next/server'
import { db } from '@/db'
import { challenges, challengeParticipants, notToDos } from '@/db/schema'
import { eq, and, or, sql, count } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

function randomToken(length: number) {
  return Math.random().toString(36).replace('0.', '').slice(0, length)
}

function toChallengeResponse(
  challenge: {
    shareCode?: string | null
    slug: string
    [key: string]: unknown
  },
  origin: string
) {
  const shareCode = challenge.shareCode || null
  const shareUrl = shareCode
    ? `${origin}/challenges/share/${shareCode}`
    : `${origin}/challenges/${challenge.slug}`

  return {
    ...challenge,
    shareCode,
    shareUrl,
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const origin = new URL(request.url).origin

    // Get all public challenges + challenges user participates in
    const results = await db
      .select({
        id: challenges.id,
        title: challenges.title,
        description: challenges.description,
        slug: challenges.slug,
        shareCode: challenges.shareCode,
        status: challenges.status,
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
          and(eq(challenges.isPublic, true), eq(challenges.status, 'active')),
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

    const challengeList = results.map((c) =>
      toChallengeResponse(
        {
          ...c,
          hasJoined: joinedSet.has(c.id),
        },
        origin
      )
    )

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
    const sourceItemId = body.sourceItemId ?? body.notToDoId
    const { title, description, isPublic } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!sourceItemId) {
      return NextResponse.json(
        { error: 'sourceItemId is required' },
        { status: 400 }
      )
    }

    // Verify source item belongs to the user
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

    const origin = new URL(request.url).origin
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    let challenge:
      | {
          id: string
          slug: string
          shareCode: string
          [key: string]: unknown
        }
      | null = null

    for (let i = 0; i < 5; i += 1) {
      const slug = `${baseSlug}-${randomToken(4)}`
      const shareCode = randomToken(10)
      try {
        const [created] = await db
          .insert(challenges)
          .values({
            title: title.trim(),
            description: description?.trim() || '',
            slug,
            shareCode,
            status: 'active',
            creatorId: user.id,
            isPublic: isPublic ?? true,
          })
          .returning()
        challenge = created as {
          id: string
          slug: string
          shareCode: string
          [key: string]: unknown
        }
        break
      } catch {
        challenge = null
      }
    }

    if (!challenge) {
      return NextResponse.json(
        { error: 'Failed to generate unique challenge URL' },
        { status: 500 }
      )
    }

    const [challengeItem] = await db
      .insert(notToDos)
      .values({
        userId: user.id,
        title: item.title,
        description: item.description || '',
        mode: 'challenge',
        challengeId: String(challenge.id),
      })
      .returning()

    // Creator automatically becomes a participant
    const [participant] = await db.insert(challengeParticipants).values({
      challengeId: String(challenge.id),
      userId: user.id,
      notToDoId: challengeItem.id,
    }).returning()

    return NextResponse.json(
      {
        challenge: toChallengeResponse(challenge, origin),
        participant,
        item: challengeItem,
        slug: String(challenge.slug),
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
