// Supabase database types for family-dashboard
// Hand-written for simplicity (only 4 tables, stable schema)

export interface Grocery {
  id: string;
  name: string;
  checked: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Timer {
  id: string;
  label: string;
  duration_seconds: number;
  started_at: string;
  cancelled: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Chore {
  id: string;
  title: string;
  assigned_to: string | null;
  schedule: 'daily' | 'weekly' | 'once';
  is_active: boolean;
  created_at: string;
}

export interface ChoreCompletion {
  id: string;
  chore_id: string;
  completed_by: string;
  completed_at: string;
}

export interface Database {
  public: {
    Tables: {
      groceries: {
        Row: Grocery;
        Insert: Omit<Grocery, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Grocery, 'id'>>;
      };
      timers: {
        Row: Timer;
        Insert: Omit<Timer, 'id' | 'created_at'>;
        Update: Partial<Omit<Timer, 'id'>>;
      };
      chores: {
        Row: Chore;
        Insert: Omit<Chore, 'id' | 'created_at'>;
        Update: Partial<Omit<Chore, 'id'>>;
      };
      chore_completions: {
        Row: ChoreCompletion;
        Insert: Omit<ChoreCompletion, 'id' | 'completed_at'>;
        Update: Partial<Omit<ChoreCompletion, 'id'>>;
      };
    };
  };
}
