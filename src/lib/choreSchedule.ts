import { startOfDay, startOfWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Chore, ChoreCompletion } from '../types/database';

const TIMEZONE = 'Europe/Berlin';

/**
 * Returns the start of the current period for the given schedule type.
 * Daily: Berlin midnight today. Weekly: Berlin Monday midnight. Once: epoch.
 */
export function getPeriodStart(schedule: 'daily' | 'weekly' | 'once'): Date {
  if (schedule === 'once') return new Date(0);
  const berlinNow = toZonedTime(new Date(), TIMEZONE);
  if (schedule === 'daily') return startOfDay(berlinNow);
  return startOfWeek(berlinNow, { weekStartsOn: 1 });
}

/**
 * Returns true if the chore has a completion in the current period.
 */
export function isChoreCompleted(chore: Chore, completions: ChoreCompletion[]): boolean {
  const periodStart = getPeriodStart(chore.schedule);
  return completions.some(
    (c) => c.chore_id === chore.id && new Date(c.completed_at) >= periodStart,
  );
}

/**
 * Returns the matching completion record for display (who did it, when),
 * or undefined if the chore is not completed in the current period.
 */
export function getCompletionInfo(
  chore: Chore,
  completions: ChoreCompletion[],
): ChoreCompletion | undefined {
  const periodStart = getPeriodStart(chore.schedule);
  return completions.find(
    (c) => c.chore_id === chore.id && new Date(c.completed_at) >= periodStart,
  );
}

/**
 * Groups chores by assigned_to. Null assigned_to becomes 'unassigned'.
 */
export function groupByAssignee(chores: Chore[]): Map<string, Chore[]> {
  const map = new Map<string, Chore[]>();
  for (const chore of chores) {
    const key = chore.assigned_to ?? 'unassigned';
    const group = map.get(key) ?? [];
    group.push(chore);
    map.set(key, group);
  }
  return map;
}

/**
 * Returns how many chores are completed in the current period vs total.
 */
export function getChoreProgress(
  chores: Chore[],
  completions: ChoreCompletion[],
): { completed: number; total: number } {
  const completed = chores.filter((chore) => isChoreCompleted(chore, completions)).length;
  return { completed, total: chores.length };
}
