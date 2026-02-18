import { supabase } from '../supabase';
import type { Timer } from '../../types/database';

/**
 * Parse duration from label when duration_seconds is 0 (Siri sentinel from old shortcuts).
 * Handles patterns like "pasta 10 minutes", "eggs 5 min", "laundry 30m", "roast 2 hours", "tea 90s".
 */
export function parseSiriTimer(timer: Timer): Timer {
  if (timer.duration_seconds !== 0) return timer;

  const match = timer.label.match(/(\d+)\s*(s(?:ec(?:ond)?s?)?|m(?:in(?:ute)?s?)?|h(?:(?:ou)?rs?)?)/i);
  if (!match) {
    // No parseable duration — default to 5 minutes
    return { ...timer, duration_seconds: 300 };
  }

  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  let durationSeconds: number;

  if (unit.startsWith('h')) durationSeconds = num * 3600;
  else if (unit.startsWith('s')) durationSeconds = num;
  else durationSeconds = num * 60;

  const cleanLabel = timer.label.replace(match[0], '').trim() || 'Timer';
  return { ...timer, label: cleanLabel, duration_seconds: durationSeconds };
}

export async function fetchActiveTimers(): Promise<Timer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('timers')
    .select('*')
    .eq('cancelled', false)
    .order('started_at', { ascending: false });
  if (error) throw error;

  // Keep running timers + recently completed (within last 60s) for alert display
  const cutoff = Date.now() - 60_000;
  return (data ?? []).map(parseSiriTimer).filter((timer) => {
    const endTime =
      new Date(timer.started_at).getTime() + timer.duration_seconds * 1000;
    return endTime > cutoff;
  });
}

export async function createTimer(
  label: string,
  durationSeconds: number,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('timers')
    .insert({ label, duration_seconds: durationSeconds, started_at: new Date().toISOString() });
  if (error) throw error;
}

export async function cancelTimer(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('timers')
    .update({ cancelled: true })
    .eq('id', id);
  if (error) throw error;
}

export async function dismissTimer(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('timers')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
