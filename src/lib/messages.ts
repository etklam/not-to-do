export function getRandomMessageIndex(count: number): number {
  return Math.floor(Math.random() * count)
}

export const MILESTONE_DAYS = [7, 14, 30, 60, 100]

export function getMilestoneKey(streak: number): string {
  if (MILESTONE_DAYS.includes(streak)) return `day${streak}`
  return 'default'
}
