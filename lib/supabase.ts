// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export type DBExercise = {
  id: string;
  folder_id: string;
  name: string;
  image_path: string;
  created_at: string;
};

export type DBFolder = {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
};

export type DBEvent = {
  id: string;
  user_id: string;
  type: 'training' | 'match';
  title: string;
  start: string;
  end: string;
  location: string | null;
  opponent: string | null;
  board_exercise_id: string | null;
  notes: string | null;
};

export type DBPlayer = {
  id: string;
  user_id: string;
  name: string;
  goals: number;
  minutes: number;
  speed: number | null;
  dribble: number | null;
  coordination: number | null;
  finishing: number | null;
  behavior: string | null;
};

export type DBMatch = {
  id: string;
  user_id: string;
  date: string;
  opponent: string;
  location: string;
  time: string;
  attack_patterns: string[];
  defense_patterns: string[];
  notes: string | null;
};
