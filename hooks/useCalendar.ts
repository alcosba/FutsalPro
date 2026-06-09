import { useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { TrainingEvent } from "@/types";
import { useToast } from "@/components/shared/Toast";
import { generateId } from "@/lib/utils";

export const useCalendar = () => {
  const { trainingEvents, addTrainingEvent, updateTrainingEvent, deleteTrainingEvent, setTrainingEvents } =
    useAppStore();
  const { addToast } = useToast();

  const handleAddEvent = useCallback(
    (data: Omit<TrainingEvent, "id" | "createdAt">) => {
      try {
        const newEvent: TrainingEvent = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        addTrainingEvent(newEvent);
        addToast(`${data.type === "partido" ? "Partido" : "Entrenamiento"} añadido`, "success");
        return newEvent;
      } catch (error) {
        addToast("Error al añadir evento", "error");
        throw error;
      }
    },
    [addTrainingEvent, addToast]
  );

  const handleUpdateEvent = useCallback(
    (id: string, data: Partial<TrainingEvent>) => {
      try {
        updateTrainingEvent(id, data);
        addToast("Evento actualizado", "success");
      } catch (error) {
        addToast("Error al actualizar evento", "error");
        throw error;
      }
    },
    [updateTrainingEvent, addToast]
  );

  const handleDeleteEvent = useCallback(
    (id: string) => {
      try {
        const event = trainingEvents.find((e) => e.id === id);
        deleteTrainingEvent(id);
        addToast(`${event?.type === "partido" ? "Partido" : "Entrenamiento"} eliminado`, "success");
      } catch (error) {
        addToast("Error al eliminar evento", "error");
        throw error;
      }
    },
    [deleteTrainingEvent, trainingEvents, addToast]
  );

  const getEventById = useCallback(
    (id: string) => {
      return trainingEvents.find((e) => e.id === id);
    },
    [trainingEvents]
  );

  const getEventsByType = useCallback(
    (type: "entrenamiento" | "partido") => {
      return trainingEvents.filter((e) => e.type === type);
    },
    [trainingEvents]
  );

  const getEventsByDate = useCallback(
    (date: string) => {
      return trainingEvents.filter((e) => e.start.startsWith(date));
    },
    [trainingEvents]
  );

  const getUpcomingEvents = useCallback(
    (days: number = 7) => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      return trainingEvents.filter((e) => {
        const eventDate = new Date(e.start);
        return eventDate >= now && eventDate <= futureDate;
      });
    },
    [trainingEvents]
  );

  return {
    trainingEvents,
    handleAddEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    getEventById,
    getEventsByType,
    getEventsByDate,
    getUpcomingEvents,
    setTrainingEvents,
  };
};
