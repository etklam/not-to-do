# Not-To-Do Design

Updated: 2026-04-17
Status: Current V1 recorded
Branch: `main`

## Product

Not-To-Do is a local-first anti-habit tracker.

Each item is something the user wants to stop doing. `Day +1` is a next-day confirmation that yesterday was successful. A failure resets the item to `Day 0` immediately on the day it happens. The current shipped version is intentionally single-player and browser-local.

All streak copy uses zero-based labels: `Day 0`, `Day 1`, `Day n`.

## Current Version Snapshot

- Runtime: single-user, client-side only
- Persistence: `localStorage`
- Routes: `/`, `/items`, `/items/new`, `/items/[id]`
- Check-in model: `Day +1` 統計昨天成功，`忍住 +1` 統計今天且可同日累積，`破戒，重置 Day` 統計今天
- Repeat protection: each item can only record one result for yesterday and one failure for today, while `忍住 +1` can accumulate on the current day
- Installability: manifest exists, full service worker flow does not
- Product shape: insight-aware daily streak tracker, not yet a social challenge app

## Implemented Features

### Dashboard

- Shows all active items for today's update flow
- Displays yesterday-confirmed completion count, active item count, and total streak count
- Supports direct check-in from each streak card
- Shows a random encouragement message on load
- Shows a recent 7-day reflection summary across check-ins
- Triggers milestone celebration modal on Day 7, 14, 30, 60, and 100

### Item Management

- Create a not-to-do item with title and optional description
- View active items and archived items separately
- Archive, restore, and permanently delete items

### Check-in Rules

- `Day +1` confirms yesterday was successful and increments streak by 1
- `忍住 +1` 單獨累積當天忍住次數，不直接增加 streak
- `破戒，重置 Day` records today's failure and resets streak to 0
- Successful check-ins record temptation intensity
- Check-ins can record trigger tags, failures can also store a short note
- No check-in means no gain and no penalty
- Same item cannot record more than one `Day +1` for the same yesterday date
- Even after `Day +1`, the user can still press `破戒，重置 Day`
- `bestStreak` is updated automatically when a new record is reached

### Detail Page

- Shows current streak as the hero number
- Shows best streak, success rate, resisted day count, and failed day count
- Shows recent 7-day insight summaries, common triggers, and risk window hints
- Shows a heatmap-style check-in history view
- Supports archive action from the detail page

### Delight and UI

- Bottom navigation for main flows
- Milestone confetti modal
- Warm, playful visual theme instead of punitive dark mode
- Mobile-first layout

## Actual Tech Stack

| Layer | Current choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18 client components |
| Styling | Tailwind CSS |
| Persistence | Browser `localStorage` |
| Animation / celebration | `canvas-confetti` |
| PWA surface | `manifest.json` only |
| Backend | None |
| Auth | None |
| Database | None |

## Current Routes

- `/` dashboard for today's update flow
- `/items` list management for active and archived items
- `/items/new` create a new not-to-do item
- `/items/[id]` item detail, metrics, and heatmap history

## Current Data Model

```ts
interface NotToDoItem {
  id: string
  title: string
  description: string
  streak: number
  bestStreak: number
  lastCheckin: string | null
  isActive: boolean
  createdAt: string
}

interface Checkin {
  id: string
  notToDoId: string
  date: string
  status: 'resisted' | 'failed'
  resistCount: number
  temptationLevel: 'none' | 'some' | 'many' | null
  triggerTags: string[]
  note: string
  createdAt: string
}
```

Notes:

- `resistCount` is a legacy compatibility field; failed records mirror the current-day resist total for context
- The current product rule is `Day +1` for yesterday once per date, while `忍住 +1` can accumulate multiple times today
- Local storage keys are `ntd_items`, `ntd_checkins`, `ntd_daily_resists`, and `ntd_schema_version`

## What Is Not Implemented Yet

- User accounts or login
- Cloud sync across devices
- PostgreSQL, Drizzle, Prisma, or any server database
- Public or private challenges
- Share links
- Hall of Shame
- Leaderboards
- Push notifications
- Service worker caching
- Screenshot sharing

## Product Reality Check

This current version is stronger than a plain streak loop now. It records some of the tension behind the result, not just the result itself.

The core product idea, `想做了，但我沒有做`, is now partially represented in the shipped data model. The app records temptation intensity, trigger tags, and failure notes, then turns those into simple 7-day reflections.

The remaining gap is depth. The app still captures one summary per day, not a richer sequence of near-misses across the day.

## Near-Term Direction

The next high-leverage step is not auth or social infra.

The next step is to deepen the single-player loop again:

- refine the quality of the reflection layer
- decide whether multiple same-day temptation events are worth capturing
- make shareable artifacts from the new insight data

The product has crossed from tracker into insight tool. Now it needs sharper reflection and better output.

## Longer-Term Direction

After the single-player insight loop is strong, the future expansion path is:

1. Optional account and sync
2. Shareable progress artifacts
3. Challenges and accountability groups
4. Hall of Shame and social pressure mechanics

The order matters. Social features are more powerful after the product already knows why the user struggles.
