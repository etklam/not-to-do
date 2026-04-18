import { NextResponse } from 'next/server'
import { db } from '@/db'
import { notToDos } from '@/db/schema'
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

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
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
