"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type Exercise = {
  id: string;
  name: string;
  image: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  type: "training" | "match";
  location: string;
  time: string;
  notes: string;
  boardExerciseId?: string;
};

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState("");

  // Form Fields
  const [eventType, setEventType] = useState<"training" | "match">("training");
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventTime, setEventTime] = useState("18:00");
  const [eventNotes, setEventNotes] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  // Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const storedEvents = localStorage.getItem("futsal_calendar_events");
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    }

    const storedExercises = localStorage.getItem("futsal_board_exercises");
    if (storedExercises) {
      setExercises(JSON.parse(storedExercises));
    }
  }, []);

  const handleDateClick = (info: any) => {
    setSelectedDateStr(info.dateStr);
    setEventTitle(eventType === "match" ? "Partido" : "Entrenamiento");
    setShowCreateModal(true);
  };

  const handleCreateEvent = () => {
    if (!eventTitle.trim()) return;

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: eventTitle,
      start: selectedDateStr + "T" + eventTime,
      type: eventType,
      location: eventLocation,
      time: eventTime,
      notes: eventNotes,
      boardExerciseId: eventType === "training" && selectedExerciseId ? selectedExerciseId : undefined,
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    localStorage.setItem("futsal_calendar_events", JSON.stringify(updatedEvents));

    // Reset Form
    setEventTitle("");
    setEventLocation("");
    setEventTime("18:00");
    setEventNotes("");
    setSelectedExerciseId("");
    setShowCreateModal(false);
  };

  const handleEventClick = (info: any) => {
    const ev = events.find((e) => e.id === info.event.id);
    if (ev) {
      setSelectedEvent(ev);
      setShowDetailModal(true);
    }
  };

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = events.filter((e) => e.id !== id);
    setEvents(updatedEvents);
    localStorage.setItem("futsal_calendar_events", JSON.stringify(updatedEvents));
    setShowDetailModal(false);
    setSelectedEvent(null);
  };

  // Find linked exercise image if any
  const getLinkedExercise = (exerciseId?: string) => {
    if (!exerciseId) return null;
    return exercises.find((ex) => ex.id === exerciseId);
  };

  return (
    <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-zinc-100">Planificador & Calendario</h2>
        <span className="text-xs text-zinc-500">Haz clic en cualquier día para añadir una sesión o partido</span>
      </div>

      <div className="calendar-dark-theme text-zinc-200">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="es"
          events={events.map((ev) => ({
            id: ev.id,
            title: ev.title,
            start: ev.start,
            backgroundColor: ev.type === "match" ? "#dc2626" : "#16a34a",
            borderColor: ev.type === "match" ? "#ef4444" : "#22c55e",
            textColor: "#ffffff",
          }))}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
        />
      </div>

      {/* CSS overrides to style FullCalendar inside Tailwind dark layout */}
      <style jsx global>{`
        .fc {
          --fc-border-color: #27272a;
          --fc-button-bg-color: #18181b;
          --fc-button-border-color: #27272a;
          --fc-button-text-color: #e4e4e7;
          --fc-button-hover-bg-color: #27272a;
          --fc-button-active-bg-color: #3f3f46;
          --fc-today-bg-color: #18181b;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f4f4f5;
        }
        .fc-col-header-cell-cushion, .fc-daygrid-day-number {
          color: #a1a1aa;
          font-size: 0.875rem;
          padding: 6px !important;
        }
        .fc .fc-button-primary:disabled {
          background-color: #09090b;
          border-color: #18181b;
        }
      `}</style>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-zinc-100">
            <h3 className="text-lg font-bold mb-4">Añadir Evento para el {selectedDateStr}</h3>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setEventType("training");
                  setEventTitle("Entrenamiento");
                }}
                className={`flex-1 py-2 font-semibold rounded-lg text-sm transition ${
                  eventType === "training" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                Entrenamiento
              </button>
              <button
                type="button"
                onClick={() => {
                  setEventType("match");
                  setEventTitle("Partido");
                }}
                className={`flex-1 py-2 font-semibold rounded-lg text-sm transition ${
                  eventType === "match" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                Partido
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Título del Evento</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 outline-none focus:border-zinc-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Hora</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 outline-none focus:border-zinc-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Lugar</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 outline-none focus:border-zinc-700 text-sm"
                  />
                </div>
              </div>

              {eventType === "training" && exercises.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Adjuntar Plantilla / Ejercicio</label>
                  <select
                    value={selectedExerciseId}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 outline-none focus:border-zinc-700 text-sm"
                  >
                    <option value="">-- Sin plantilla adjunta --</option>
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Notas de la sesión</label>
                <textarea
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 outline-none focus:border-zinc-700 text-sm resize-none"
                  placeholder="Detalles del entrenamiento, objetivos, convocatoria..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-950 text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEvent}
                className={`px-4 py-2 text-white rounded-lg text-sm font-semibold transition ${
                  eventType === "match" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Event Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-zinc-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase mb-2 ${
                    selectedEvent.type === "match" ? "bg-red-950/50 text-red-400 border border-red-900/30" : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"
                  }`}
                >
                  {selectedEvent.type === "match" ? "Partido" : "Entrenamiento"}
                </span>
                <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/50 text-sm">
                <div>
                  <span className="text-zinc-500 block text-xs">Fecha / Hora</span>
                  <span className="font-semibold">{selectedEvent.start.replace("T", " - ")}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs">Ubicación</span>
                  <span className="font-semibold">{selectedEvent.location || "N/A"}</span>
                </div>
              </div>

              {selectedEvent.notes && (
                <div>
                  <span className="text-zinc-500 block text-xs mb-1">Notas</span>
                  <div className="bg-zinc-950/20 p-3 rounded-lg border border-zinc-800 text-zinc-300 text-sm whitespace-pre-wrap">
                    {selectedEvent.notes}
                  </div>
                </div>
              )}

              {selectedEvent.boardExerciseId && getLinkedExercise(selectedEvent.boardExerciseId) && (
                <div>
                  <span className="text-zinc-500 block text-xs mb-2">Ejercicio adjunto (Pizarra)</span>
                  <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
                    <div className="bg-zinc-900 px-3 py-1.5 border-b border-zinc-800 flex justify-between items-center">
                      <span className="text-xs font-semibold text-zinc-300">
                        {getLinkedExercise(selectedEvent.boardExerciseId)?.name}
                      </span>
                    </div>
                    <img
                      src={getLinkedExercise(selectedEvent.boardExerciseId)?.image}
                      alt="Tactical board preview"
                      className="w-full h-auto max-h-60 object-contain mx-auto p-2"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800/80">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="px-3 py-1.5 text-xs font-semibold bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/60 transition"
              >
                Eliminar Evento
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
