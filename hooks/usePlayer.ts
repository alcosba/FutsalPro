import { useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { Player } from "@/types";
import { useToast } from "@/components/shared/Toast";
import { generateId } from "@/lib/utils";

export const usePlayer = () => {
  const { players, addPlayer, updatePlayer, deletePlayer, setPlayers } =
    useAppStore();
  const { addToast } = useToast();

  const handleAddPlayer = useCallback(
    (data: Omit<Player, "id" | "createdAt">) => {
      try {
        const newPlayer: Player = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        addPlayer(newPlayer);
        addToast(`Jugador ${data.name} añadido`, "success");
        return newPlayer;
      } catch (error) {
        addToast("Error al añadir jugador", "error");
        throw error;
      }
    },
    [addPlayer, addToast]
  );

  const handleUpdatePlayer = useCallback(
    (id: string, data: Partial<Player>) => {
      try {
        updatePlayer(id, data);
        addToast("Jugador actualizado", "success");
      } catch (error) {
        addToast("Error al actualizar jugador", "error");
        throw error;
      }
    },
    [updatePlayer, addToast]
  );

  const handleDeletePlayer = useCallback(
    (id: string) => {
      try {
        const player = players.find((p) => p.id === id);
        deletePlayer(id);
        addToast(`Jugador ${player?.name} eliminado`, "success");
      } catch (error) {
        addToast("Error al eliminar jugador", "error");
        throw error;
      }
    },
    [deletePlayer, players, addToast]
  );

  const getPlayerById = useCallback(
    (id: string) => {
      return players.find((p) => p.id === id);
    },
    [players]
  );

  const getPlayerStats = useCallback(
    (id: string) => {
      const player = getPlayerById(id);
      if (!player) return null;
      return {
        goals: player.goals,
        assists: player.assists,
        minutes: player.minutes,
        avgGoalsPerMinute: player.minutes
          ? (player.goals / player.minutes) * 90
          : 0,
      };
    },
    [getPlayerById]
  );

  return {
    players,
    handleAddPlayer,
    handleUpdatePlayer,
    handleDeletePlayer,
    getPlayerById,
    getPlayerStats,
    setPlayers,
  };
};
