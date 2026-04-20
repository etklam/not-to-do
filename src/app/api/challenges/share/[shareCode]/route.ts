import { NextResponse } from 'next/server'
import { db } from '@/db'
import { challenges, challengeParticipants } from '@/db/schema'
import { and, count, eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { getPublicOrigin } from '@/lib/public-origin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { shareCode } = await params

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.shareCode, shareCode),
          eq(challenges.status, 'active')
        )
      )

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    if (!challenge.isPublic) {
      return NextResponse.json(
        { error: 'Challenge is private' },
        { status: 403 }
      )
    }

    const [participantCount] = await db
      .select({ count: count(challengeParticipants.id) })
      .from(challengeParticipants)
      .where(eq(challengeParticipants.challengeId, challenge.id))

    let hasJoined = false
    if (user) {
      const [joined] = await db
        .select({ id: challengeParticipants.id })
        .from(challengeParticipants)
        .where(
          and(
            eq(challengeParticipants.challengeId, challenge.id),
            eq(challengeParticipants.userId, user.id)
          )
        )
      hasJoined = Boolean(joined)
    }

    const origin = getPublicOrigin(request)
    return NextResponse.json({
      challenge: {
        ...challenge,
        shareUrl: `${origin}/challenges/share/${challenge.shareCode}`,
      },
      participantCount: participantCount?.count ?? 0,
      hasJoined,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
