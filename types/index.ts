// Player type
export type Player = {
  id: string;
  name: string;
  number: number;
  goals: number;
  assists: number;
  minutes: number;
  createdAt: string;
};

// Match type
export type Match = {
  id: string;
  date: string;
  opponent: string;
  location: string;
  time: string;
  attackForms: string[];
  defenseForms: string[];
  notes: string;
  createdAt: string;
};

// Training/Event type
export type TrainingEvent = {
  id: string;
  title: string;
  start: string;
  type: "entrenamiento" | "partido";
  location: string;
  time: string;
  notes: string;
  boardImage?: string;
  createdAt: string;
};

// Exercise (drawing on board) type
export type Exercise = {
  id: string;
  name: string;
  folderId: string;
  data: object; // Fabric.js JSON format
  createdAt: string;
  updatedAt: string;
};

// Folder for organizing exercises
export type Folder = {
  id: string;
  name: string;
  createdAt: string;
};

// API Response wrapper
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
