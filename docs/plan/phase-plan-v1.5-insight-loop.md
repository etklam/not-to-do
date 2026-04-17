# Phase Plan: V1.5 Insight Loop

Generated from CEO review on 2026-04-17
Branch: `main`
Mode: `SELECTIVE EXPANSION`
Status: Implemented on 2026-04-17

## Phase Summary

The current app has a working daily streak loop, but it still behaves mostly like a clean tracker.

This phase adds the missing product truth: `想做了，但我沒有做`.

The goal is to capture temptation context without blowing up scope, without adding backend infrastructure, and without weakening the streak integrity rules.

## Why This Phase Now

What exists today:

- single-player local-first flow works
- item CRUD works
- yesterday-success `Day +1` and same-day fail logging work
- heatmap and milestone feedback exist

What is still missing:

- why the user almost failed
- when temptation hits
- which triggers keep showing up
- a reflection layer that helps the user learn from the pattern

If we skip this and jump straight to auth or social, we build infrastructure before sharpening the product.

## Phase Goal

Turn Not-To-Do from a streak counter into a personal anti-habit insight tool while keeping the app:

- local-first
- single-player
- fast to use
- mobile-friendly

## User Outcome

After this phase, a user should be able to say:

- "I made it to Day 9."
- "I almost broke three times this week."
- "Most of my failures happen late at night."
- "Stress and boredom are my real triggers."

That is a meaningfully better product than just "I tapped the green button."

## Scope Decisions

| Proposal | Decision | Why |
|---|---|---|
| Add temptation metadata to daily check-ins | Accepted | This is the core product insight |
| Add trigger tags | Accepted | Gives reflection something real to work with |
| Add weekly reflection summary | Accepted | Turns raw logs into pattern recognition |
| Keep `Day +1` to one yesterday record per date | Accepted | Protects clarity and streak integrity |
| Add multi-event journaling throughout the day | Deferred | Useful, but too much UI and state for this phase |
| Add auth and sync | Deferred | Infra, not product truth |
| Add Hall of Shame or challenge groups | Deferred | Social should wait until the single-player loop is sharper |
| Add screenshot sharing | Deferred | Nice, but not the highest-leverage next step |

## Product Spec

### 1. Success Check-in Flow

When the user taps `Day +1`:

- Open a fast follow-up sheet or modal
- Ask a single required question: `昨天有多想破戒？`
- Options:
  - `沒有被誘惑`
  - `有想做，但忍住了`
  - `很多次都忍住了`
- Allow optional trigger chips:
  - `無聊`
  - `壓力`
  - `睡前`
  - `拖延`
  - `社群媒體`
  - `情緒低落`
  - `嘴饞`
  - `其他`
- Confirm and save

Constraint:

- total interaction should stay lightweight, ideally 2 taps after the initial button press
- this action only records yesterday, so a failure can still be recorded later on the current day

### 2. Failure Check-in Flow

When the user taps `破戒，重置 Day`:

- Open a fast follow-up sheet or modal
- Ask the user what the main trigger was
- Allow an optional short note
- Save the failure and reset streak to `Day 0`

Constraint:

- today's failure can only be recorded once, but today's `忍住 +1` can keep accumulating

### 3. Detail Page Insights

Add an insight section to `/items/[id]` showing:

- temptation days in the last 7 days
- most common trigger tags
- current risk window if one pattern is obvious, for example `最近多數失守都發生在晚上`
- short weekly reflection copy

This should feel interpretive, not dashboard spam.

### 4. Weekly Reflection Surface

Add a compact reflection card on the dashboard or item detail page:

- `本週成功 X 天`
- `本週最常見誘因：壓力`
- `最危險時段：深夜`
- `你不是每天都難熬，你是在特定情境容易出事`

This is the feature that starts making the app feel smart without AI theater.

## Data Model Changes

Extend the daily check-in record with insight fields.

```ts
interface Checkin {
  id: string
  notToDoId: string
  date: string
  status: 'resisted' | 'failed'
  resistCount: number
  temptationLevel?: 'none' | 'some' | 'many'
  triggerTags?: string[]
  note?: string
  createdAt: string
}
```

Rules:

- Existing records must continue to load safely
- Migration should default missing insight fields to empty values
- `Day +1` remains limited to one record per yesterday date
- today's failure remains limited to one record per current date

## Proposed File Changes

- `src/lib/types.ts`
  Add new check-in metadata types
- `src/lib/store.ts`
  Persist insight metadata, migrate old local data, keep yesterday/today action guards
- `src/components/CheckInButtons.tsx`
  Trigger follow-up flow instead of saving immediately
- `src/components/CheckinContextModal.tsx`
  New component for temptation and trigger capture
- `src/app/page.tsx`
  Show weekly reflection summary if placed on dashboard
- `src/app/items/[id]/page.tsx`
  Add insight section and weekly pattern readout
- `src/lib/messages.ts`
  Add reflection copy helpers if needed

## Non-Goals

This phase does not include:

- login
- sync
- backend APIs
- challenge system
- share links
- Hall of Shame
- push notifications
- cross-device persistence

## Acceptance Criteria

- User can record temptation intensity when saving a successful day
- User can record at least one trigger on failure
- Old local data migrates without breaking the app
- Same item still cannot gain more than one `Day +1` for the same yesterday date
- Same item still cannot gain more than one `破戒` record for the same current date
- Same item can accumulate multiple `忍住 +1` presses on the current date
- Item detail page shows useful insight summaries based on stored data
- The new flow remains mobile-usable and visually consistent with current UI
- `npm run build` passes

## Verification Plan

### Functional Checks

1. Create a new item
2. Check in with `Day +1` for yesterday
3. Save temptation metadata
4. Confirm streak increments once
5. Try to check in again for the same yesterday date
6. Confirm streak does not increment again
7. Record `忍住 +1` multiple times on the current day
8. Confirm the resist counter accumulates
9. Record a failure on the current day after `Day +1`
10. Confirm streak resets and trigger data is preserved
11. Open item detail page
12. Confirm insight summaries and history render correctly

### Migration Checks

1. Seed local data in the old shape without new fields
2. Load app
3. Confirm existing items and history still render
4. Confirm new check-ins save the new metadata shape

### Build Check

- Run `npm run build`

## Risks

- Too much check-in friction could hurt daily completion
- Too much analytics UI could make the app feel like homework
- Over-designed tagging can become fake precision

Mitigation:

- keep the capture UI lightweight
- use chips, not long forms
- show only the most useful insight summaries

## CEO Review Decision

This phase is the right next move because it increases product sharpness, not just product surface area.

It keeps scope under control while moving the app toward the thing that is actually differentiated.

That is the whole bet.
