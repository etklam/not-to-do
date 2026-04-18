import { NextResponse } from 'next/server'
import { db } from '@/db'
import { notToDos, checkins, dailyResists } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

interface SyncItem {
  id: string
  title: string
  description: string
  streak: number
  bestStreak: number
  lastCheckin: string | null
  isActive: boolean
  createdAt: string
}

interface SyncCheckin {
  id: string
  notToDoId: string
  date: string
  status: string
  resistCount: number
  temptationLevel: string | null
  triggerTags: string[]
  note: string
  createdAt: string
}

interface SyncResist {
  id: string
  notToDoId: string
  date: string
  count: number
  createdAt: string
  updatedAt: string
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, checkins: syncCheckins, dailyResists: syncResists } = body as {
      items: SyncItem[]
      checkins: SyncCheckin[]
      dailyResists: SyncResist[]
    }

    // Check if user already has data (don't overwrite)
    const existingItems = await db
      .select({ id: notToDos.id })
      .from(notToDos)
      .where(eq(notToDos.userId, user.id))
      .limit(1)

    if (existingItems.length > 0) {
      return NextResponse.json(
        { error: 'User already has data. Sync only works for new accounts.' },
        { status: 409 }
      )
    }

    // Build a map from old localStorage IDs to new DB IDs
    const itemIdMap = new Map<string, string>()

    // Insert items
    if (items?.length) {
      for (const item of items) {
        const [inserted] = await db
          .insert(notToDos)
          .values({
            userId: user.id,
            title: item.title,
            description: item.description || '',
            streak: item.streak || 0,
            bestStreak: item.bestStreak || 0,
            lastCheckin: item.lastCheckin || null,
            isActive: item.isActive ?? true,
          })
          .returning({ id: notToDos.id })

        itemIdMap.set(item.id, inserted.id)
      }
    }

    // Insert checkins with mapped IDs
    if (syncCheckins?.length) {
      for (const checkin of syncCheckins) {
        const newNotToDoId = itemIdMap.get(checkin.notToDoId)
        if (!newNotToDoId) continue

        await db.insert(checkins).values({
          notToDoId: newNotToDoId,
          date: checkin.date,
          status: checkin.status,
          resistCount: checkin.resistCount || 0,
          temptationLevel: checkin.temptationLevel || null,
          triggerTags: JSON.stringify(checkin.triggerTags || []),
          note: checkin.note || '',
        })
      }
    }

    // Insert daily resists with mapped IDs
    if (syncResists?.length) {
      for (const resist of syncResists) {
        const newNotToDoId = itemIdMap.get(resist.notToDoId)
        if (!newNotToDoId) continue

        await db.insert(dailyResists).values({
          notToDoId: newNotToDoId,
          date: resist.date,
          count: resist.count,
        })
      }
    }

    return NextResponse.json({
      ok: true,
      synced: {
        items: itemIdMap.size,
        checkins: syncCheckins?.length || 0,
        dailyResists: syncResists?.length || 0,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
