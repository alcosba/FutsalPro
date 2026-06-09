import {
  isValidEmail,
  isValidDate,
  isValidTime,
} from "@/lib/utils";
import type { Player, Match, TrainingEvent, Exercise } from "@/types";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate player data
 */
export function validatePlayer(
  data: Partial<Player>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: "name", message: "Nombre es requerido" });
  }

  if (data.name && data.name.length > 100) {
    errors.push({ field: "name", message: "Nombre muy largo (máx 100 caracteres)" });
  }

  if (data.number !== undefined) {
    if (isNaN(data.number) || data.number < 1 || data.number > 99) {
      errors.push({ field: "number", message: "Número inválido (1-99)" });
    }
  }

  if (data.goals !== undefined && data.goals < 0) {
    errors.push({ field: "goals", message: "Los goles no pueden ser negativos" });
  }

  if (data.assists !== undefined && data.assists < 0) {
    errors.push({ field: "assists", message: "Las asistencias no pueden ser negativas" });
  }

  if (data.minutes !== undefined && data.minutes < 0) {
    errors.push({ field: "minutes", message: "Los minutos no pueden ser negativos" });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate match data
 */
export function validateMatch(
  data: Partial<Match>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.date || !isValidDate(data.date)) {
    errors.push({ field: "date", message: "Fecha inválida (formato: YYYY-MM-DD)" });
  }

  if (!data.opponent || data.opponent.trim().length === 0) {
    errors.push({ field: "opponent", message: "Rival es requerido" });
  }

  if (data.opponent && data.opponent.length > 100) {
    errors.push({ field: "opponent", message: "Rival muy largo (máx 100 caracteres)" });
  }

  if (data.location && data.location.length > 200) {
    errors.push({ field: "location", message: "Ubicación muy larga (máx 200 caracteres)" });
  }

  if (!data.time || !isValidTime(data.time)) {
    errors.push({ field: "time", message: "Hora inválida (formato: HH:MM)" });
  }

  if (data.notes && data.notes.length > 1000) {
    errors.push({ field: "notes", message: "Notas muy largas (máx 1000 caracteres)" });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate training event data
 */
export function validateTrainingEvent(
  data: Partial<TrainingEvent>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: "title", message: "Título es requerido" });
  }

  if (data.title && data.title.length > 100) {
    errors.push({ field: "title", message: "Título muy largo (máx 100 caracteres)" });
  }

  if (!data.type || !["entrenamiento", "partido"].includes(data.type)) {
    errors.push({
      field: "type",
      message: "Tipo inválido (debe ser 'entrenamiento' o 'partido')",
    });
  }

  if (!data.start) {
    errors.push({ field: "start", message: "Fecha/hora de inicio es requerida" });
  }

  if (data.location && data.location.length > 200) {
    errors.push({ field: "location", message: "Ubicación muy larga (máx 200 caracteres)" });
  }

  if (data.time && !isValidTime(data.time)) {
    errors.push({ field: "time", message: "Hora inválida (formato: HH:MM)" });
  }

  if (data.notes && data.notes.length > 1000) {
    errors.push({ field: "notes", message: "Notas muy largas (máx 1000 caracteres)" });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate exercise data
 */
export function validateExercise(
  data: Partial<Exercise>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: "name", message: "Nombre del ejercicio es requerido" });
  }

  if (data.name && data.name.length > 100) {
    errors.push({ field: "name", message: "Nombre muy largo (máx 100 caracteres)" });
  }

  if (!data.folderId || data.folderId.trim().length === 0) {
    errors.push({ field: "folderId", message: "Carpeta es requerida" });
  }

  if (!data.data || typeof data.data !== "object") {
    errors.push({ field: "data", message: "Datos del ejercicio inválidos" });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Batch validate multiple items
 */
export function validateBatch<T>(
  items: T[],
  validator: (item: T) => ValidationResult
): Map<number, ValidationError[]> {
  const results = new Map<number, ValidationError[]>();

  items.forEach((item, index) => {
    const result = validator(item);
    if (!result.valid) {
      results.set(index, result.errors);
    }
  });

  return results;
}
