import { supabase } from '../supabase';
import type { Chore, ChoreCompletion } from '../../types/database';

export async function fetchChores(): Promise<Chore[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chores')
    .select('*')
    .eq('is_active', true)
    .order('assigned_to', { ascending: true })
    .order('title', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentCompletions(): Promise<ChoreCompletion[]> {
  if (!supabase) return [];
  const boundary = new Date(Date.now() - 8 * 86400000).toISOString();
  const { data, error } = await supabase
    .from('chore_completions')
    .select('*')
    .gte('completed_at', boundary)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addChore(
  title: string,
  assignedTo: string | null,
  schedule: 'daily' | 'weekly' | 'once',
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('chores')
    .insert({ title, assigned_to: assignedTo, schedule });
  if (error) throw error;
}

export async function completeChore(choreId: string, completedBy: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('chore_completions')
    .insert({ chore_id: choreId, completed_by: completedBy });
  if (error) throw error;
}

export async function uncompleteChore(completionId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('chore_completions')
    .delete()
    .eq('id', completionId);
  if (error) throw error;
}

export async function deactivateChore(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('chores')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}
