import { NextResponse } from 'next/server'
import { db } from '@/db'
import { checkins, notToDos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

function getTodayUtcDateString(): string {
  return new Date().toISOString().split('T')[0]
}

function getYesterdayUtcDateString(today: string): string {
  const d = new Date(`${today}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}

function getStreakEndingOnDate(
  targetDate: string,
  statusByDate: Map<string, string>
): number {
  let streak = 0
  let cursor = targetDate
  while (statusByDate.get(cursor) === 'resisted') {
    streak += 1
    cursor = getYesterdayUtcDateString(cursor)
  }
  return streak
}

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

    if (status !== 'resisted' && status !== 'failed') {
      return NextResponse.json(
        { error: 'status must be "resisted" or "failed"' },
        { status: 400 }
      )
    }

    // Validate triggerTags
    if (triggerTags !== undefined) {
      if (!Array.isArray(triggerTags) || triggerTags.length > 10 || triggerTags.some((t: unknown) => typeof t !== 'string' || (t as string).length > 50)) {
        return NextResponse.json(
          { error: 'Invalid triggerTags' },
          { status: 400 }
        )
      }
    }

    // Validate note length
    if (note && typeof note === 'string' && note.length > 2000) {
      return NextResponse.json(
        { error: 'Note is too long (max 2000 characters)' },
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

    const today = getTodayUtcDateString()
    const yesterday = getYesterdayUtcDateString(today)
    const allCheckins = await db
      .select({
        date: checkins.date,
        status: checkins.status,
      })
      .from(checkins)
      .where(eq(checkins.notToDoId, notToDoId))

    const statusByDate = new Map<string, string>()
    for (const row of allCheckins) {
      statusByDate.set(String(row.date), String(row.status))
    }

    let newStreak = getStreakEndingOnDate(yesterday, statusByDate)
    if (statusByDate.get(today) === 'failed') {
      newStreak = 0
    }

    const currentItem = item[0]
    const newBestStreak = Math.max(currentItem.bestStreak, newStreak)
    const currentLastCheckin = currentItem.lastCheckin
      ? String(currentItem.lastCheckin)
      : null
    const nextLastCheckin =
      currentLastCheckin && currentLastCheckin > String(date)
        ? currentLastCheckin
        : String(date)

    const [updatedItem] = await db
      .update(notToDos)
      .set({
        streak: newStreak,
        bestStreak: newBestStreak,
        lastCheckin: nextLastCheckin,
      })
      .where(eq(notToDos.id, notToDoId))
      .returning()

    return NextResponse.json(
      { checkin, item: updatedItem },
      { status: existing.length > 0 ? 200 : 201 }
    )
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
