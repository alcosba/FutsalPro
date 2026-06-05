"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import Papa from "papaparse";

type Player = {
  id: string;
  name: string;
  goals: number;
  assists: number;
  minutes: number;
  speed: number;        // scale 1-10 or 1-100
  dribble: number;      // scale 1-10 or 1-100
  coordination: number;  // scale 1-10 or 1-100
  finishing: number;     // scale 1-10 or 1-100
  behavior: string;
};

type Match = {
  id: string;
  date: string;
  opponent: string;
  location: string;
  time: string;
  attackPatterns: string[];
  defensePatterns: string[];
  notes: string;
};

export default function Stats() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"players" | "matches">("players");

  // Load Initial Data
  useEffect(() => {
    const storedPlayers = localStorage.getItem("futsal_players");
    if (storedPlayers) {
      setPlayers(JSON.parse(storedPlayers));
    } else {
      const defaultPlayers: Player[] = [
        { id: "1", name: "Carlos Ortiz", goals: 12, assists: 8, minutes: 240, speed: 85, dribble: 90, coordination: 88, finishing: 82, behavior: "Excelente liderazgo" },
        { id: "2", name: "Sergio Lozano", goals: 15, assists: 5, minutes: 220, speed: 92, dribble: 85, coordination: 80, finishing: 95, behavior: "Gran intensidad" },
      ];
      setPlayers(defaultPlayers);
      localStorage.setItem("futsal_players", JSON.stringify(defaultPlayers));
    }

    const storedMatches = localStorage.getItem("futsal_matches");
    if (storedMatches) {
      setMatches(JSON.parse(storedMatches));
    } else {
      const defaultMatches: Match[] = [
        { id: "1", date: "2026-05-15", opponent: "Inter Movistar", location: "Pabellón Jorge Garbajosa", time: "19:00", attackPatterns: ["4-0", "Salida de presión"], defensePatterns: ["Defensa individual", "Cambios automáticos"], notes: "Partido muy disputado, clave la presión alta." },
      ];
      setMatches(defaultMatches);
      localStorage.setItem("futsal_matches", JSON.stringify(defaultMatches));
    }
  }, []);

  // Update localStorage when state changes
  const savePlayers = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    localStorage.setItem("futsal_players", JSON.stringify(updatedPlayers));
  };

  const saveMatches = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
    localStorage.setItem("futsal_matches", JSON.stringify(updatedMatches));
  };

  // Add Handlers
  const addPlayer = () => {
    const name = prompt("Nombre del jugador:", "Nuevo Jugador");
    if (!name) return;
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      goals: 0,
      assists: 0,
      minutes: 0,
      speed: 70,
      dribble: 70,
      coordination: 70,
      finishing: 70,
      behavior: "Buena actitud",
    };
    savePlayers([...players, newPlayer]);
  };

  const addMatch = () => {
    const opponent = prompt("Nombre del rival:", "Rival");
    if (!opponent) return;
    const newMatch: Match = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      opponent,
      location: "Pabellón Local",
      time: "18:00",
      attackPatterns: [],
      defensePatterns: [],
      notes: "",
    };
    saveMatches([...matches, newMatch]);
  };

  // Delete Handlers
  const deletePlayer = (id: string) => {
    if (confirm("¿Seguro que deseas eliminar este jugador?")) {
      savePlayers(players.filter((p) => p.id !== id));
    }
  };

  const deleteMatch = (id: string) => {
    if (confirm("¿Seguro que deseas eliminar este partido?")) {
      saveMatches(matches.filter((m) => m.id !== id));
    }
  };

  // Inline Edit Handlers
  const handlePlayerChange = (id: string, field: keyof Player, value: any) => {
    const updated = players.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          [field]: field === "name" || field === "behavior" ? value : Number(value) || 0,
        };
      }
      return p;
    });
    savePlayers(updated);
  };

  const handleMatchChange = (id: string, field: keyof Match, value: any) => {
    const updated = matches.map((m) => {
      if (m.id === id) {
        if (field === "attackPatterns" || field === "defensePatterns") {
          return {
            ...m,
            [field]: value.split(",").map((s: string) => s.trim()).filter(Boolean),
          };
        }
        return {
          ...m,
          [field]: value,
        };
      }
      return m;
    });
    saveMatches(updated);
  };

  // CSV Exports
  const exportPlayersCSV = () => {
    const csv = Papa.unparse(players);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `jugadores_stats_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMatchesCSV = () => {
    const csv = Papa.unparse(matches.map(m => ({
      ...m,
      attackPatterns: m.attackPatterns.join("; "),
      defensePatterns: m.defensePatterns.join("; ")
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `partidos_stats_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Exports
  const exportPlayersPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Estadisticas de Jugadores - FutsalPro", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Fecha de exportacion: ${new Date().toLocaleString()}`, 14, 28);

    let y = 40;
    players.forEach((p, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${idx + 1}. ${p.name}`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Goles: ${p.goals}  |  Asistencias: ${p.assists}  |  Minutos: ${p.minutes}`, 18, y + 6);
      doc.text(`Velocidad: ${p.speed}%  |  Regate: ${p.dribble}%  |  Coordinacion: ${p.coordination}%  |  Finalizacion: ${p.finishing}%`, 18, y + 12);
      doc.text(`Comportamiento: ${p.behavior}`, 18, y + 18);
      y += 28;
    });

    doc.save(`jugadores_reporte_${new Date().toLocaleDateString()}.pdf`);
  };

  const exportMatchesPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Estadisticas de Partidos - FutsalPro", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Fecha de exportacion: ${new Date().toLocaleString()}`, 14, 28);

    let y = 40;
    matches.forEach((m, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${idx + 1}. vs ${m.opponent} (${m.date})`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Lugar: ${m.location}  |  Hora: ${m.time}`, 18, y + 6);
      doc.text(`Ataque: ${m.attackPatterns.join(", ") || "Ninguno"}`, 18, y + 12);
      doc.text(`Defensa: ${m.defensePatterns.join(", ") || "Ninguna"}`, 18, y + 18);
      doc.text(`Notas: ${m.notes || "Ninguna"}`, 18, y + 24);
      y += 34;
    });

    doc.save(`partidos_reporte_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-xl shadow-2xl">
      {/* Sub Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-zinc-800 pb-4">
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab("players")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeSubTab === "players" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Plantilla & Jugadores
          </button>
          <button
            onClick={() => setActiveSubTab("matches")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeSubTab === "matches" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Partidos & Análisis
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {activeSubTab === "players" ? (
            <>
              <button
                onClick={addPlayer}
                className="px-3.5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                + Añadir Jugador
              </button>
              <button
                onClick={exportPlayersCSV}
                className="px-3.5 py-2 text-sm font-semibold border border-zinc-800 hover:bg-zinc-900 text-zinc-300 rounded-lg transition"
              >
                Exportar CSV
              </button>
              <button
                onClick={exportPlayersPDF}
                className="px-3.5 py-2 text-sm font-semibold border border-zinc-800 hover:bg-zinc-900 text-zinc-300 rounded-lg transition"
              >
                Exportar PDF
              </button>
            </>
          ) : (
            <>
              <button
                onClick={addMatch}
                className="px-3.5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                + Añadir Partido
              </button>
              <button
                onClick={exportMatchesCSV}
                className="px-3.5 py-2 text-sm font-semibold border border-zinc-800 hover:bg-zinc-900 text-zinc-300 rounded-lg transition"
              >
                Exportar CSV
              </button>
              <button
                onClick={exportMatchesPDF}
                className="px-3.5 py-2 text-sm font-semibold border border-zinc-800 hover:bg-zinc-900 text-zinc-300 rounded-lg transition"
              >
                Exportar PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Players Section */}
      {activeSubTab === "players" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-zinc-300 border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase font-bold bg-zinc-900/30">
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-2 w-16 text-center">Goles</th>
                <th className="py-3 px-2 w-16 text-center">Asist.</th>
                <th className="py-3 px-2 w-20 text-center">Min.</th>
                <th className="py-3 px-2 w-20 text-center">Vel. (%)</th>
                <th className="py-3 px-2 w-20 text-center">Reg. (%)</th>
                <th className="py-3 px-2 w-20 text-center">Coord. (%)</th>
                <th className="py-3 px-2 w-20 text-center">Fin. (%)</th>
                <th className="py-3 px-4">Comportamiento / Notas</th>
                <th className="py-3 px-4 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/20 transition-colors text-sm">
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handlePlayerChange(p.id, "name", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-900/50 p-1 rounded font-semibold text-zinc-100 w-full"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      value={p.goals}
                      onChange={(e) => handlePlayerChange(p.id, "goals", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-900/50 p-1 rounded text-center w-full text-zinc-100"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      value={p.assists}
                      onChange={(e) => handlePlayerChange(p.id, "assists", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-900/50 p-1 rounded text-center w-full text-zinc-100"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      value={p.minutes}
                      onChange={(e) => handlePlayerChange(p.id, "minutes", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-900/50 p-1 rounded text-center w-full text-zinc-100"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={p.speed}
                      onChange={(e) => handlePlayerChange(p.id, "speed", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-900/50 p-1 rounded text-center w-full text-zinc-100"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={p.dribble}
                      onChange={(e) => handlePlayerChange(p.id, "dribble", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-900/50 p-1 rounded text-center w-full text-zinc-100"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={p.coordination}
                      onChange={(e) => handlePlayerChange(p.id, "coordination", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-900/50 p-1 rounded text-center w-full text-zinc-100"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={p.finishing}
                      onChange={(e) => handlePlayerChange(p.id, "finishing", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-900/50 p-1 rounded text-center w-full text-zinc-100"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={p.behavior}
                      onChange={(e) => handlePlayerChange(p.id, "behavior", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-900/50 p-1 rounded w-full text-zinc-300"
                      placeholder="Comportamiento, rol táctico..."
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => deletePlayer(p.id)}
                      className="text-red-500 hover:text-red-400 font-semibold text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-500 text-xs">
                    Sin jugadores registrados. Añade uno arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Matches Section */}
      {activeSubTab === "matches" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((m) => (
            <div
              key={m.id}
              className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4 shadow-lg hover:border-zinc-700 transition"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="date"
                      value={m.date}
                      onChange={(e) => handleMatchChange(m.id, "date", e.target.value)}
                      className="bg-transparent text-xs text-zinc-400 outline-none border-0 focus:bg-zinc-950 p-0.5 rounded w-28"
                    />
                    <input
                      type="time"
                      value={m.time}
                      onChange={(e) => handleMatchChange(m.id, "time", e.target.value)}
                      className="bg-transparent text-xs text-zinc-400 outline-none border-0 focus:bg-zinc-950 p-0.5 rounded w-16"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-100 font-bold text-lg">
                    <span>vs</span>
                    <input
                      type="text"
                      value={m.opponent}
                      onChange={(e) => handleMatchChange(m.id, "opponent", e.target.value)}
                      className="bg-transparent border-0 outline-none focus:bg-zinc-950 p-1 rounded font-bold w-full"
                    />
                  </div>
                  <input
                    type="text"
                    value={m.location}
                    onChange={(e) => handleMatchChange(m.id, "location", e.target.value)}
                    className="bg-transparent border-0 text-xs text-zinc-500 outline-none focus:bg-zinc-950 p-0.5 rounded w-full"
                    placeholder="Lugar del encuentro..."
                  />
                </div>

                <button
                  onClick={() => deleteMatch(m.id)}
                  className="text-red-500 hover:text-red-400 font-semibold text-xs shrink-0"
                >
                  Eliminar
                </button>
              </div>

              {/* Tactical patterns */}
              <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Patrones de Ataque (separar por comas)</label>
                  <input
                    type="text"
                    value={m.attackPatterns.join(", ")}
                    onChange={(e) => handleMatchChange(m.id, "attackPatterns", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg p-2 text-zinc-200 text-xs outline-none focus:border-zinc-700"
                    placeholder="E.g., 4-0, Salida de presión, Pivot estático"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {m.attackPatterns.map((pat, idx) => (
                      <span key={idx} className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        {pat}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Estrategias Defensivas (separar por comas)</label>
                  <input
                    type="text"
                    value={m.defensePatterns.join(", ")}
                    onChange={(e) => handleMatchChange(m.id, "defensePatterns", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg p-2 text-zinc-200 text-xs outline-none focus:border-zinc-700"
                    placeholder="E.g., Defensa 1-2-1, Presión total, Zona media"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {m.defensePatterns.map((pat, idx) => (
                      <span key={idx} className="bg-red-950/40 border border-red-900/30 text-red-400 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        {pat}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Notas del Partido / Oponente</label>
                  <textarea
                    value={m.notes}
                    onChange={(e) => handleMatchChange(m.id, "notes", e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg p-2 text-zinc-200 text-xs outline-none focus:border-zinc-700 resize-none"
                    placeholder="Detalles sobre puntos débiles del rival, táctica de juego parado..."
                  />
                </div>
              </div>
            </div>
          ))}
          {matches.length === 0 && (
            <div className="col-span-2 py-12 text-center text-zinc-600 text-xs">
              Sin partidos registrados. Añade uno arriba.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
