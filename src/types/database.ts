// Supabase database types for family-dashboard
// Hand-written to match Supabase CLI output format (only 4 tables, stable schema)

export type Grocery = Database['public']['Tables']['groceries']['Row'];
export type Timer = Database['public']['Tables']['timers']['Row'];
export type Chore = Database['public']['Tables']['chores']['Row'];
export type ChoreCompletion = Database['public']['Tables']['chore_completions']['Row'];
// EventRow (not `Event`) to avoid clashing with the DOM `Event` global
export type EventRow = Database['public']['Tables']['events']['Row'];
export type Reward = Database['public']['Tables']['rewards']['Row'];
export type PointsBalance = Database['public']['Views']['points_balances']['Row'];

export interface Database {
  public: {
    Tables: {
      groceries: {
        Row: {
          id: string;
          name: string;
          checked: boolean;
          added_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          checked?: boolean;
          added_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          checked?: boolean;
          added_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      timers: {
        Row: {
          id: string;
          label: string;
          duration_seconds: number;
          started_at: string;
          cancelled: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          duration_seconds: number;
          started_at: string;
          cancelled?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          duration_seconds?: number;
          started_at?: string;
          cancelled?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chores: {
        Row: {
          id: string;
          title: string;
          assigned_to: string | null;
          schedule: 'daily' | 'weekly' | 'once';
          is_active: boolean;
          created_at: string;
          points?: number; // absent until supabase/migrations/2026-10-03-rewards.sql runs
        };
        Insert: {
          id?: string;
          title: string;
          assigned_to?: string | null;
          schedule?: 'daily' | 'weekly' | 'once';
          is_active?: boolean;
          created_at?: string;
          points?: number;
        };
        Update: {
          id?: string;
          title?: string;
          assigned_to?: string | null;
          schedule?: 'daily' | 'weekly' | 'once';
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          label: string;
          emoji: string;
          event_date: string; // 'YYYY-MM-DD'
          added_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          emoji?: string;
          event_date: string;
          added_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          emoji?: string;
          event_date?: string;
          added_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rewards: {
        Row: {
          id: string;
          title: string;
          cost: number;
          emoji: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          cost: number;
          emoji?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          cost?: number;
          emoji?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      reward_redemptions: {
        Row: {
          id: string;
          reward_id: string;
          redeemed_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reward_id: string;
          redeemed_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reward_id?: string;
          redeemed_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      chore_completions: {
        Row: {
          id: string;
          chore_id: string;
          completed_by: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          chore_id: string;
          completed_by: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          chore_id?: string;
          completed_by?: string;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chore_completions_chore_id_fkey';
            columns: ['chore_id'];
            isOneToOne: false;
            referencedRelation: 'chores';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      points_balances: {
        Row: {
          person: string;
          earned: number;
          spent: number;
          balance: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
