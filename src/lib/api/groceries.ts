import { supabase } from '../supabase';
import type { Grocery } from '../../types/database';
import { toPreferredGroceryName } from '../grocery/preferences';

export async function fetchGroceries(): Promise<Grocery[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('groceries')
    .select('*')
    .order('checked', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((item) => {
    const normalizedName = toPreferredGroceryName(item.name);
    if (normalizedName === item.name) return item;
    return { ...item, name: normalizedName };
  });
}

export async function addGrocery(name: string, addedBy?: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const normalizedName = toPreferredGroceryName(name);
  const { error } = await supabase
    .from('groceries')
    .insert({ name: normalizedName, checked: false, added_by: addedBy ?? null });
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
