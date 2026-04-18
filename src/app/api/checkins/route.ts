import { NextResponse } from 'next/server'
import { db } from '@/db'
import { checkins, notToDos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notToDoId, date, status, resistCount, temptationLevel, triggerTags, note } = body

    if (!notToDoId || !date || !status) {
      return NextResponse.json(
        { error: 'notToDoId, date, and status are required' },
        { status: 400 }
      )
    }

    // Verify ownership of the item
    const item = await db
      .select()
      .from(notToDos)
      .where(and(eq(notToDos.id, notToDoId), eq(notToDos.userId, user.id)))
      .limit(1)

    if (item.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Upsert checkin (one per item per day)
    const existing = await db
      .select()
      .from(checkins)
      .where(and(eq(checkins.notToDoId, notToDoId), eq(checkins.date, date)))
      .limit(1)

    let checkin
    if (existing.length > 0) {
      ;[checkin] = await db
        .update(checkins)
        .set({
          status,
          resistCount: resistCount ?? 0,
          temptationLevel: temptationLevel ?? null,
          triggerTags: JSON.stringify(triggerTags ?? []),
          note: note ?? '',
        })
        .where(eq(checkins.id, existing[0].id))
        .returning()
    } else {
      ;[checkin] = await db
        .insert(checkins)
        .values({
          notToDoId,
          date,
          status,
          resistCount: resistCount ?? 0,
          temptationLevel: temptationLevel ?? null,
          triggerTags: JSON.stringify(triggerTags ?? []),
          note: note ?? '',
        })
        .returning()
    }

    return NextResponse.json({ checkin }, { status: existing.length > 0 ? 200 : 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notToDoId = searchParams.get('notToDoId')

    if (!notToDoId) {
      return NextResponse.json(
        { error: 'notToDoId is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const item = await db
      .select({ id: notToDos.id })
      .from(notToDos)
      .where(and(eq(notToDos.id, notToDoId), eq(notToDos.userId, user.id)))
      .limit(1)

    if (item.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const result = await db
      .select()
      .from(checkins)
      .where(eq(checkins.notToDoId, notToDoId))
      .orderBy(checkins.date)

    // Parse triggerTags from JSON string
    const parsed = result.map((c) => ({
      ...c,
      triggerTags: JSON.parse(c.triggerTags as string),
    }))

    return NextResponse.json({ checkins: parsed })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
