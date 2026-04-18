import { NextResponse } from 'next/server'
import { db } from '@/db'
import { dailyResists, notToDos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notToDoId, date } = body

    if (!notToDoId || !date) {
      return NextResponse.json(
        { error: 'notToDoId and date are required' },
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

    // Upsert: increment count or create
    const existing = await db
      .select()
      .from(dailyResists)
      .where(
        and(eq(dailyResists.notToDoId, notToDoId), eq(dailyResists.date, date))
      )
      .limit(1)

    let resist
    if (existing.length > 0) {
      ;[resist] = await db
        .update(dailyResists)
        .set({
          count: existing[0].count + 1,
          updatedAt: new Date(),
        })
        .where(eq(dailyResists.id, existing[0].id))
        .returning()
    } else {
      ;[resist] = await db
        .insert(dailyResists)
        .values({
          notToDoId,
          date,
          count: 1,
        })
        .returning()
    }

    return NextResponse.json({ resist, count: resist.count })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
