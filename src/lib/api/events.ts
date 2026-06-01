import { supabase } from '../supabase';
import type { EventRow } from '../../types/database';

export async function fetchEvents(): Promise<EventRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export interface NewEventInput {
  label: string;
  emoji: string;
  eventDate: string; // 'YYYY-MM-DD'
  addedBy?: string;
}

export async function addEvent(input: NewEventInput): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('events').insert({
    label: input.label,
    emoji: input.emoji,
    event_date: input.eventDate,
    added_by: input.addedBy ?? null,
  });
  if (error) throw error;
}

export async function removeEvent(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
