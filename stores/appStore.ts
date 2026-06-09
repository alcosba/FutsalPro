import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  Player,
  Match,
  TrainingEvent,
  Exercise,
  Folder,
} from "@/types";

interface AppStore {
  // Players
  players: Player[];
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  setPlayers: (players: Player[]) => void;

  // Matches
  matches: Match[];
  addMatch: (match: Match) => void;
  updateMatch: (id: string, match: Partial<Match>) => void;
  deleteMatch: (id: string) => void;
  setMatches: (matches: Match[]) => void;

  // Training Events (Calendar)
  trainingEvents: TrainingEvent[];
  addTrainingEvent: (event: TrainingEvent) => void;
  updateTrainingEvent: (id: string, event: Partial<TrainingEvent>) => void;
  deleteTrainingEvent: (id: string) => void;
  setTrainingEvents: (events: TrainingEvent[]) => void;

  // Exercises (Board drawings)
  exercises: Exercise[];
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, exercise: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  setExercises: (exercises: Exercise[]) => void;

  // Folders
  folders: Folder[];
  activeFolderId: string;
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, folder: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  setFolders: (folders: Folder[]) => void;
  setActiveFolderId: (id: string) => void;

  // UI State
  isLoading: boolean;
  error: string | null;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        // Players
        players: [],
        addPlayer: (player) =>
          set((state) => ({
            players: [...state.players, player],
          })),
        updatePlayer: (id, player) =>
          set((state) => ({
            players: state.players.map((p) =>
              p.id === id ? { ...p, ...player } : p
            ),
          })),
        deletePlayer: (id) =>
          set((state) => ({
            players: state.players.filter((p) => p.id !== id),
          })),
        setPlayers: (players) => set({ players }),

        // Matches
        matches: [],
        addMatch: (match) =>
          set((state) => ({
            matches: [...state.matches, match],
          })),
        updateMatch: (id, match) =>
          set((state) => ({
            matches: state.matches.map((m) =>
              m.id === id ? { ...m, ...match } : m
            ),
          })),
        deleteMatch: (id) =>
          set((state) => ({
            matches: state.matches.filter((m) => m.id !== id),
          })),
        setMatches: (matches) => set({ matches }),

        // Training Events
        trainingEvents: [],
        addTrainingEvent: (event) =>
          set((state) => ({
            trainingEvents: [...state.trainingEvents, event],
          })),
        updateTrainingEvent: (id, event) =>
          set((state) => ({
            trainingEvents: state.trainingEvents.map((e) =>
              e.id === id ? { ...e, ...event } : e
            ),
          })),
        deleteTrainingEvent: (id) =>
          set((state) => ({
            trainingEvents: state.trainingEvents.filter((e) => e.id !== id),
          })),
        setTrainingEvents: (events) => set({ trainingEvents: events }),

        // Exercises
        exercises: [],
        addExercise: (exercise) =>
          set((state) => ({
            exercises: [...state.exercises, exercise],
          })),
        updateExercise: (id, exercise) =>
          set((state) => ({
            exercises: state.exercises.map((e) =>
              e.id === id ? { ...e, ...exercise } : e
            ),
          })),
        deleteExercise: (id) =>
          set((state) => ({
            exercises: state.exercises.filter((e) => e.id !== id),
          })),
        setExercises: (exercises) => set({ exercises }),

        // Folders
        folders: [],
        activeFolderId: "",
        addFolder: (folder) =>
          set((state) => ({
            folders: [...state.folders, folder],
          })),
        updateFolder: (id, folder) =>
          set((state) => ({
            folders: state.folders.map((f) =>
              f.id === id ? { ...f, ...folder } : f
            ),
          })),
        deleteFolder: (id) =>
          set((state) => ({
            folders: state.folders.filter((f) => f.id !== id),
            // If deleting active folder, switch to first available
            activeFolderId:
              state.activeFolderId === id
                ? state.folders[0]?.id || ""
                : state.activeFolderId,
          })),
        setFolders: (folders) => set({ folders }),
        setActiveFolderId: (id) => set({ activeFolderId: id }),

        // UI State
        isLoading: false,
        error: null,
        setIsLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
      }),
      {
        name: "futsal-coach-store",
      }
    )
  )
);
