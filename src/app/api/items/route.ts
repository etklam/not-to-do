import { NextResponse } from 'next/server'
import { db } from '@/db'
import { challenges, notToDos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await db
      .select()
      .from(notToDos)
      .where(eq(notToDos.userId, user.id))
      .orderBy(notToDos.createdAt)

    return NextResponse.json({ items })
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
    const { title, description } = body
    const requestedMode =
      body.mode === 'challenge' ? 'challenge' : 'personal'
    const challengeId =
      typeof body.challengeId === 'string' ? body.challengeId : null

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (requestedMode === 'personal' && challengeId) {
      return NextResponse.json(
        { error: 'Personal item cannot have challengeId' },
        { status: 400 }
      )
    }

    if (requestedMode === 'challenge' && !challengeId) {
      return NextResponse.json(
        { error: 'challengeId is required when mode is challenge' },
        { status: 400 }
      )
    }

    if (requestedMode === 'challenge' && challengeId) {
      const [challenge] = await db
        .select({ id: challenges.id })
        .from(challenges)
        .where(eq(challenges.id, challengeId))

      if (!challenge) {
        return NextResponse.json(
          { error: 'Challenge not found' },
          { status: 404 }
        )
      }
    }

    // Check max 3 active items
    const activeItems = await db
      .select({ id: notToDos.id })
      .from(notToDos)
      .where(and(eq(notToDos.userId, user.id), eq(notToDos.isActive, true)))

    if (activeItems.length >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 active items allowed' },
        { status: 400 }
      )
    }

    const [item] = await db
      .insert(notToDos)
      .values({
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || '',
        mode: requestedMode,
        challengeId: requestedMode === 'challenge' ? challengeId : null,
      })
      .returning()

    return NextResponse.json({ item }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
