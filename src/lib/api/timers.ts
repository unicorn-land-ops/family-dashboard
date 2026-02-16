import { supabase } from '../supabase';
import type { Timer } from '../../types/database';

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
  return (data ?? []).filter((timer) => {
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
