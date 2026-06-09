import { useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { Match } from "@/types";
import { useToast } from "@/components/shared/Toast";
import { generateId } from "@/lib/utils";

export const useStats = () => {
  const { matches, players, addMatch, updateMatch, deleteMatch, setMatches } =
    useAppStore();
  const { addToast } = useToast();

  const handleAddMatch = useCallback(
    (data: Omit<Match, "id" | "createdAt">) => {
      try {
        const newMatch: Match = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        addMatch(newMatch);
        addToast(
          `Partido contra ${data.opponent} añadido`,
          "success"
        );
        return newMatch;
      } catch (error) {
        addToast("Error al añadir partido", "error");
        throw error;
      }
    },
    [addMatch, addToast]
  );

  const handleUpdateMatch = useCallback(
    (id: string, data: Partial<Match>) => {
      try {
        updateMatch(id, data);
        addToast("Partido actualizado", "success");
      } catch (error) {
        addToast("Error al actualizar partido", "error");
        throw error;
      }
    },
    [updateMatch, addToast]
  );

  const handleDeleteMatch = useCallback(
    (id: string) => {
      try {
        const match = matches.find((m) => m.id === id);
        deleteMatch(id);
        addToast(`Partido eliminado`, "success");
      } catch (error) {
        addToast("Error al eliminar partido", "error");
        throw error;
      }
    },
    [deleteMatch, matches, addToast]
  );

  const getMatchById = useCallback(
    (id: string) => {
      return matches.find((m) => m.id === id);
    },
    [matches]
  );

  // Statistics calculations
  const getTotalGoals = useCallback(() => {
    return players.reduce((sum, p) => sum + p.goals, 0);
  }, [players]);

  const getTotalMinutes = useCallback(() => {
    return players.reduce((sum, p) => sum + p.minutes, 0);
  }, [players]);

  const getTopScorers = useCallback(
    (limit: number = 5) => {
      return [...players]
        .sort((a, b) => b.goals - a.goals)
        .slice(0, limit);
    },
    [players]
  );

  const getPlayerRanking = useCallback(() => {
    return [...players].sort((a, b) => {
      const aScore = a.goals + a.assists * 0.5; // Goals worth more than assists
      const bScore = b.goals + b.assists * 0.5;
      return bScore - aScore;
    });
  }, [players]);

  const getMatchStats = useCallback(() => {
    if (matches.length === 0) {
      return {
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };
    }

    return {
      totalMatches: matches.length,
      wins: matches.filter((m) => m.notes?.includes("victoria")).length || 0,
      draws: matches.filter((m) => m.notes?.includes("empate")).length || 0,
      losses:
        matches.filter((m) => m.notes?.includes("derrota")).length || 0,
    };
  }, [matches]);

  const getTeamStats = useCallback(() => {
    const totalGoals = getTotalGoals();
    const totalMinutes = getTotalMinutes();
    const matchStats = getMatchStats();

    return {
      totalGoals,
      totalMinutes,
      goalsPerMatch: matchStats.totalMatches > 0 ? totalGoals / matchStats.totalMatches : 0,
      ...matchStats,
    };
  }, [getTotalGoals, getTotalMinutes, getMatchStats]);

  return {
    matches,
    handleAddMatch,
    handleUpdateMatch,
    handleDeleteMatch,
    getMatchById,
    getTotalGoals,
    getTotalMinutes,
    getTopScorers,
    getPlayerRanking,
    getMatchStats,
    getTeamStats,
    setMatches,
  };
};
