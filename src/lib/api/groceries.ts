import { supabase } from '../supabase';
import type { Grocery } from '../../types/database';

export async function fetchGroceries(): Promise<Grocery[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('groceries')
    .select('*')
    .order('checked', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addGrocery(name: string, addedBy?: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('groceries')
    .insert({ name, checked: false, added_by: addedBy ?? null });
  if (error) throw error;
}

export async function toggleGrocery(id: string, checked: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('groceries')
    .update({ checked, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function removeGrocery(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('groceries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function clearCheckedGroceries(): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('groceries')
    .delete()
    .eq('checked', true);
  if (error) throw error;
}
