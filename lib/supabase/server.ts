import { createClient } from "@supabase/supabase-js";
import type { Player, Match, TrainingEvent, Exercise } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Fetch all players from database
 */
export async function getPlayers(userId: string) {
  return supabaseServer
    .from("players")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

/**
 * Insert new player
 */
export async function insertPlayer(userId: string, player: Player) {
  return supabaseServer.from("players").insert({
    ...player,
    user_id: userId,
  });
}

/**
 * Update player
 */
export async function updatePlayerDB(id: string, updates: Partial<Player>) {
  return supabaseServer.from("players").update(updates).eq("id", id);
}

/**
 * Delete player
 */
export async function deletePlayerDB(id: string) {
  return supabaseServer.from("players").delete().eq("id", id);
}

/**
 * Fetch all matches
 */
export async function getMatches(userId: string) {
  return supabaseServer
    .from("matches")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
}

/**
 * Insert new match
 */
export async function insertMatch(userId: string, match: Match) {
  return supabaseServer.from("matches").insert({
    ...match,
    user_id: userId,
  });
}

/**
 * Update match
 */
export async function updateMatchDB(id: string, updates: Partial<Match>) {
  return supabaseServer.from("matches").update(updates).eq("id", id);
}

/**
 * Delete match
 */
export async function deleteMatchDB(id: string) {
  return supabaseServer.from("matches").delete().eq("id", id);
}

/**
 * Fetch all training events
 */
export async function getTrainingEvents(userId: string) {
  return supabaseServer
    .from("training_events")
    .select("*")
    .eq("user_id", userId)
    .order("start", { ascending: true });
}

/**
 * Insert new training event
 */
export async function insertTrainingEvent(
  userId: string,
  event: TrainingEvent
) {
  return supabaseServer.from("training_events").insert({
    ...event,
    user_id: userId,
  });
}

/**
 * Update training event
 */
export async function updateTrainingEventDB(
  id: string,
  updates: Partial<TrainingEvent>
) {
  return supabaseServer
    .from("training_events")
    .update(updates)
    .eq("id", id);
}

/**
 * Delete training event
 */
export async function deleteTrainingEventDB(id: string) {
  return supabaseServer.from("training_events").delete().eq("id", id);
}

/**
 * Fetch all exercises
 */
export async function getExercises(userId: string) {
  return supabaseServer
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

/**
 * Insert new exercise
 */
export async function insertExercise(userId: string, exercise: Exercise) {
  return supabaseServer.from("exercises").insert({
    ...exercise,
    user_id: userId,
  });
}

/**
 * Update exercise
 */
export async function updateExerciseDB(
  id: string,
  updates: Partial<Exercise>
) {
  return supabaseServer.from("exercises").update(updates).eq("id", id);
}

/**
 * Delete exercise
 */
export async function deleteExerciseDB(id: string) {
  return supabaseServer.from("exercises").delete().eq("id", id);
}
