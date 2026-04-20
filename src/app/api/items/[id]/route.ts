import { NextResponse } from 'next/server'
import { db } from '@/db'
import { notToDos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify ownership + read immutable mode linkage
    const existing = await db
      .select({ id: notToDos.id })
      .from(notToDos)
      .where(and(eq(notToDos.id, id), eq(notToDos.userId, user.id)))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (body.mode !== undefined || body.challengeId !== undefined) {
      return NextResponse.json(
        {
          error:
            'mode/challengeId are immutable. Create a new item instead of converting.',
        },
        { status: 400 }
      )
    }

    // Only allow updating specific fields
    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) {
      const title = body.title.trim()
      if (!title) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        )
      }
      updates.title = title
    }
    if (body.description !== undefined)
      updates.description = body.description.trim()
    if (body.isActive !== undefined) updates.isActive = body.isActive

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const [item] = await db
      .update(notToDos)
      .set(updates)
      .where(eq(notToDos.id, id))
      .returning()

    return NextResponse.json({ item })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await db
      .select({ id: notToDos.id })
      .from(notToDos)
      .where(and(eq(notToDos.id, id), eq(notToDos.userId, user.id)))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.delete(notToDos).where(eq(notToDos.id, id))

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await db
      .select()
      .from(notToDos)
      .where(and(eq(notToDos.id, id), eq(notToDos.userId, user.id)))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ item: result[0] })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
