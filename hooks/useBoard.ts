import { useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { Exercise, Folder } from "@/types";
import { useToast } from "@/components/shared/Toast";
import { generateId } from "@/lib/utils";

export const useBoard = () => {
  const {
    exercises,
    folders,
    activeFolderId,
    addExercise,
    updateExercise,
    deleteExercise,
    setExercises,
    addFolder,
    updateFolder,
    deleteFolder,
    setFolders,
    setActiveFolderId,
  } = useAppStore();
  const { addToast } = useToast();

  // Exercise management
  const handleAddExercise = useCallback(
    (data: Omit<Exercise, "id" | "createdAt" | "updatedAt">) => {
      try {
        if (!activeFolderId) {
          addToast("Por favor, selecciona una carpeta", "warning");
          return;
        }

        const newExercise: Exercise = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addExercise(newExercise);
        addToast(`Ejercicio "${data.name}" guardado`, "success");
        return newExercise;
      } catch (error) {
        addToast("Error al guardar ejercicio", "error");
        throw error;
      }
    },
    [activeFolderId, addExercise, addToast]
  );

  const handleUpdateExercise = useCallback(
    (id: string, data: Partial<Exercise>) => {
      try {
        updateExercise(id, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
        addToast("Ejercicio actualizado", "success");
      } catch (error) {
        addToast("Error al actualizar ejercicio", "error");
        throw error;
      }
    },
    [updateExercise, addToast]
  );

  const handleDeleteExercise = useCallback(
    (id: string) => {
      try {
        const exercise = exercises.find((e) => e.id === id);
        deleteExercise(id);
        addToast(`Ejercicio "${exercise?.name}" eliminado`, "success");
      } catch (error) {
        addToast("Error al eliminar ejercicio", "error");
        throw error;
      }
    },
    [deleteExercise, exercises, addToast]
  );

  const getExerciseById = useCallback(
    (id: string) => {
      return exercises.find((e) => e.id === id);
    },
    [exercises]
  );

  const getExercisesByFolder = useCallback(
    (folderId: string) => {
      return exercises.filter((e) => e.folderId === folderId);
    },
    [exercises]
  );

  const getActiveExercises = useCallback(() => {
    return getExercisesByFolder(activeFolderId);
  }, [activeFolderId, getExercisesByFolder]);

  // Folder management
  const handleAddFolder = useCallback(
    (name: string) => {
      try {
        const newFolder: Folder = {
          id: generateId(),
          name,
          createdAt: new Date().toISOString(),
        };
        addFolder(newFolder);
        setActiveFolderId(newFolder.id);
        addToast(`Carpeta "${name}" creada`, "success");
        return newFolder;
      } catch (error) {
        addToast("Error al crear carpeta", "error");
        throw error;
      }
    },
    [addFolder, setActiveFolderId, addToast]
  );

  const handleUpdateFolder = useCallback(
    (id: string, name: string) => {
      try {
        updateFolder(id, { name });
        addToast("Carpeta actualizada", "success");
      } catch (error) {
        addToast("Error al actualizar carpeta", "error");
        throw error;
      }
    },
    [updateFolder, addToast]
  );

  const handleDeleteFolder = useCallback(
    (id: string) => {
      try {
        const folder = folders.find((f) => f.id === id);
        
        // Delete all exercises in this folder
        const exercisesToDelete = getExercisesByFolder(id);
        exercisesToDelete.forEach((e) => {
          deleteExercise(e.id);
        });

        deleteFolder(id);
        addToast(`Carpeta "${folder?.name}" eliminada`, "success");
      } catch (error) {
        addToast("Error al eliminar carpeta", "error");
        throw error;
      }
    },
    [deleteFolder, deleteExercise, folders, getExercisesByFolder, addToast]
  );

  const handleSetActiveFolder = useCallback(
    (id: string) => {
      setActiveFolderId(id);
    },
    [setActiveFolderId]
  );

  return {
    // Exercises
    exercises,
    handleAddExercise,
    handleUpdateExercise,
    handleDeleteExercise,
    getExerciseById,
    getExercisesByFolder,
    getActiveExercises,
    setExercises,

    // Folders
    folders,
    activeFolderId,
    handleAddFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleSetActiveFolder,
    setFolders,
  };
};
