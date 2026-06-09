import { useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { useToast } from "@/components/shared/Toast";
import { getCurrentUser, onAuthChange } from "@/lib/supabase/client";
import type { Player, Match, TrainingEvent, Exercise } from "@/types";

export const useSupabase = () => {
  const store = useAppStore();
  const { addToast } = useToast();

  // Initialize auth listener
  useEffect(() => {
    const {
      data: { subscription },
    } = onAuthChange((event, session) => {
      if (event === "SIGNED_IN") {
        console.log("✅ Usuario autenticado");
      } else if (event === "SIGNED_OUT") {
        console.log("👋 Usuario desautenticado");
        // Clear store on sign out
        store.setPlayers([]);
        store.setMatches([]);
        store.setTrainingEvents([]);
        store.setExercises([]);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [store]);

  // Sync data to Supabase (when app data changes)
  const syncPlayers = useCallback(async (players: Player[]) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.warn("Not authenticated, skipping sync");
        return;
      }

      // TODO: Implement actual sync to Supabase
      // This would batch upsert players to the database
      console.log("📤 Syncing players to Supabase...", players.length);
    } catch (error) {
      console.error("Error syncing players:", error);
    }
  }, []);

  const syncMatches = useCallback(async (matches: Match[]) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.warn("Not authenticated, skipping sync");
        return;
      }

      console.log("📤 Syncing matches to Supabase...", matches.length);
    } catch (error) {
      console.error("Error syncing matches:", error);
    }
  }, []);

  const syncExercises = useCallback(async (exercises: Exercise[]) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.warn("Not authenticated, skipping sync");
        return;
      }

      console.log("📤 Syncing exercises to Supabase...", exercises.length);
    } catch (error) {
      console.error("Error syncing exercises:", error);
    }
  }, []);

  // Load data from Supabase
  const loadPlayersFromSupabase = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // TODO: Implement actual fetch from Supabase
      console.log("📥 Loading players from Supabase...");
    } catch (error) {
      console.error("Error loading players:", error);
      addToast("Error al cargar jugadores", "error");
    }
  }, [addToast]);

  const loadMatchesFromSupabase = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      console.log("📥 Loading matches from Supabase...");
    } catch (error) {
      console.error("Error loading matches:", error);
      addToast("Error al cargar partidos", "error");
    }
  }, [addToast]);

  const loadExercisesFromSupabase = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      console.log("📥 Loading exercises from Supabase...");
    } catch (error) {
      console.error("Error loading exercises:", error);
      addToast("Error al cargar ejercicios", "error");
    }
  }, [addToast]);

  return {
    syncPlayers,
    syncMatches,
    syncExercises,
    loadPlayersFromSupabase,
    loadMatchesFromSupabase,
    loadExercisesFromSupabase,
  };
};
