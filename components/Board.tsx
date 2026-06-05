"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { supabase } from "@/lib/supabase";

type Folder = {
  id: string;
  name: string;
};

type Exercise = {
  id: string;
  name: string;
  folderId: string;
  image: string; // base64 representation
  createdAt: string;
};

export default function Board() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Load folders and exercises
  useEffect(() => {
    const storedFolders = localStorage.getItem("futsal_board_folders");
    let currentFolders: Folder[] = [];
    if (storedFolders) {
      currentFolders = JSON.parse(storedFolders);
    } else {
      currentFolders = [{ id: "general", name: "General" }];
      localStorage.setItem("futsal_board_folders", JSON.stringify(currentFolders));
    }
    setFolders(currentFolders);
    setActiveFolderId(currentFolders[0]?.id || "general");

    const storedExercises = localStorage.getItem("futsal_board_exercises");
    if (storedExercises) {
      setExercises(JSON.parse(storedExercises));
    }
  }, []);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvasWidth = containerRef.current.clientWidth || 800;
    const canvasHeight = 500;

    const fbCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#166534", // beautiful futsal pitch green
    });

    fabricCanvasRef.current = fbCanvas;

    // Draw pitch lines (Futsal Court layout)
    drawFutsalCourt(fbCanvas, canvasWidth, canvasHeight);

    const handleResize = () => {
      if (!containerRef.current || !fabricCanvasRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      fabricCanvasRef.current.setDimensions({ width: newWidth });
      fabricCanvasRef.current.renderAll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      fbCanvas.dispose();
    };
  }, []);

  const drawFutsalCourt = (canvas: fabric.Canvas, w: number, h: number) => {
    const borderOffset = 20;
    const pitchW = w - borderOffset * 2;
    const pitchH = h - borderOffset * 2;

    // Outer boundary line
    const outerRect = new fabric.Rect({
      left: borderOffset,
      top: borderOffset,
      width: pitchW,
      height: pitchH,
      fill: "transparent",
      stroke: "#ffffff",
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });
    canvas.add(outerRect);

    // Center line
    const centerLine = new fabric.Line(
      [w / 2, borderOffset, w / 2, h - borderOffset],
      {
        stroke: "#ffffff",
        strokeWidth: 3,
        selectable: false,
        evented: false,
      }
    );
    canvas.add(centerLine);

    // Center circle
    const centerCircle = new fabric.Circle({
      left: w / 2 - 60,
      top: h / 2 - 60,
      radius: 60,
      fill: "transparent",
      stroke: "#ffffff",
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });
    canvas.add(centerCircle);

    // Center spot
    const centerSpot = new fabric.Circle({
      left: w / 2 - 4,
      top: h / 2 - 4,
      radius: 4,
      fill: "#ffffff",
      selectable: false,
      evented: false,
    });
    canvas.add(centerSpot);

    // Penalty Areas (simple arcs/rects for 6m line)
    // Left Penalty Area
    const leftPenalty = new fabric.Rect({
      left: borderOffset,
      top: h / 2 - 80,
      width: 80,
      height: 160,
      fill: "transparent",
      stroke: "#ffffff",
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });
    canvas.add(leftPenalty);

    // Right Penalty Area
    const rightPenalty = new fabric.Rect({
      left: w - borderOffset - 80,
      top: h / 2 - 80,
      width: 80,
      height: 160,
      fill: "transparent",
      stroke: "#ffffff",
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });
    canvas.add(rightPenalty);
  };

  // Add elements
  const addPlayer = (team: "A" | "B", number: string) => {
    if (!fabricCanvasRef.current) return;
    const color = team === "A" ? "#dc2626" : "#2563eb"; // Premium Red vs Blue
    const circle = new fabric.Circle({
      radius: 16,
      fill: color,
      stroke: "#ffffff",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
    });

    const text = new fabric.Textbox(number, {
      fontSize: 14,
      fill: "#ffffff",
      fontWeight: "bold",
      originX: "center",
      originY: "center",
      textAlign: "center",
    });

    const group = new fabric.Group([circle, text], {
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
    });

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  };

  const addCone = () => {
    if (!fabricCanvasRef.current) return;
    // Standard tactical triangle for a cone
    const cone = new fabric.Triangle({
      width: 24,
      height: 28,
      fill: "#ea580c", // bright orange
      stroke: "#ffffff",
      strokeWidth: 1.5,
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
    });
    fabricCanvasRef.current.add(cone);
    fabricCanvasRef.current.setActiveObject(cone);
    fabricCanvasRef.current.renderAll();
  };

  const addBall = () => {
    if (!fabricCanvasRef.current) return;
    const ball = new fabric.Circle({
      radius: 8,
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 2,
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
    });
    fabricCanvasRef.current.add(ball);
    fabricCanvasRef.current.setActiveObject(ball);
    fabricCanvasRef.current.renderAll();
  };

  const addGoal = () => {
    if (!fabricCanvasRef.current) return;
    const goal = new fabric.Rect({
      width: 12,
      height: 60,
      fill: "#ffffff",
      stroke: "#374151",
      strokeWidth: 2,
      left: 30,
      top: 220,
    });
    fabricCanvasRef.current.add(goal);
    fabricCanvasRef.current.setActiveObject(goal);
    fabricCanvasRef.current.renderAll();
  };

  const clearBoard = () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    canvas.clear();
    canvas.backgroundColor = "#166534";
    drawFutsalCourt(canvas, canvas.getWidth(), canvas.getHeight());
    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return;
    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    activeObjects.forEach((obj) => {
      fabricCanvasRef.current?.remove(obj);
    });
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
  };

  // Folders & Saves
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName,
    };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem("futsal_board_folders", JSON.stringify(updatedFolders));
    setActiveFolderId(newFolder.id);
    setNewFolderName("");
    setShowFolderModal(false);
  };

  const handleSaveExercise = () => {
    if (!fabricCanvasRef.current || !exerciseName.trim()) return;
    const dataUrl = fabricCanvasRef.current.toDataURL({ format: "png", multiplier: 1 });
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exerciseName,
      folderId: activeFolderId,
      image: dataUrl,
      createdAt: new Date().toISOString(),
    };
    const updatedExercises = [...exercises, newExercise];
    setExercises(updatedExercises);
    localStorage.setItem("futsal_board_exercises", JSON.stringify(updatedExercises));
    setExerciseName("");
    setShowSaveModal(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas Area */}
        <div className="flex-1 bg-zinc-950 p-4 border border-zinc-800 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-zinc-100">Pizarra Táctica</h2>
            <div className="flex gap-2">
              <button
                onClick={clearBoard}
                className="px-3 py-1.5 text-sm font-medium border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition"
              >
                Limpiar Pizarra
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1.5 text-sm font-medium bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/60 transition"
              >
                Eliminar Selección
              </button>
            </div>
          </div>

          <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden border border-zinc-700">
            <canvas ref={canvasRef} className="block w-full" />
          </div>

          {/* Palette Tools */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => addPlayer("A", "1")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition transform active:scale-95"
            >
              + Jugador Rojo
            </button>
            <button
              onClick={() => addPlayer("B", "1")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition transform active:scale-95"
            >
              + Jugador Azul
            </button>
            <button
              onClick={addCone}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition transform active:scale-95"
            >
              + Cono
            </button>
            <button
              onClick={addBall}
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-100 text-zinc-950 font-bold rounded-lg shadow-md transition transform active:scale-95"
            >
              + Balón
            </button>
            <button
              onClick={addGoal}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg shadow-md transition transform active:scale-95"
            >
              + Portería
            </button>
          </div>
        </div>

        {/* Sidebar Folder Manager & Exercise List */}
        <div className="w-full lg:w-80 bg-zinc-950 p-4 border border-zinc-800 rounded-xl shadow-2xl flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-zinc-400">Carpeta Activa</label>
              <button
                onClick={() => setShowFolderModal(true)}
                className="text-xs text-emerald-400 hover:underline"
              >
                + Nueva Carpeta
              </button>
            </div>
            <select
              value={activeFolderId}
              onChange={(e) => setActiveFolderId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 outline-none focus:border-zinc-700"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={() => setShowSaveModal(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition transform active:scale-98"
            >
              Guardar Ejercicio actual
            </button>
          </div>

          {/* List of exercises in current folder */}
          <div className="flex-1 flex flex-col gap-3 min-h-[250px]">
            <h3 className="font-bold text-zinc-300 border-b border-zinc-800 pb-2 text-sm">Ejercicios Guardados</h3>
            <div className="flex-1 overflow-y-auto max-h-[300px] flex flex-col gap-2 pr-1">
              {exercises
                .filter((ex) => ex.folderId === activeFolderId)
                .map((ex) => (
                  <div
                    key={ex.id}
                    className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition flex items-center gap-3"
                  >
                    <img src={ex.image} alt={ex.name} className="w-16 h-10 object-cover rounded border border-zinc-800" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{ex.name}</p>
                      <p className="text-xs text-zinc-500">{new Date(ex.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              {exercises.filter((ex) => ex.folderId === activeFolderId).length === 0 && (
                <p className="text-xs text-zinc-600 text-center my-auto">Sin ejercicios en esta carpeta.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-100 mb-4">Nueva Carpeta</h3>
            <input
              type="text"
              placeholder="Nombre de la carpeta..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 outline-none mb-4 focus:border-zinc-700"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 border border-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-950 text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-100 mb-4">Guardar Ejercicio</h3>
            <input
              type="text"
              placeholder="Nombre del ejercicio..."
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 outline-none mb-4 focus:border-zinc-700"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-950 text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveExercise}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
