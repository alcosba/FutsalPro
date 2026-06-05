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
      backgroundColor: "transparent",
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
    const paddingX = 40;
    const paddingY = 30;
    const pitchW = w - paddingX * 2;
    const pitchH = h - paddingY * 2;

    // A. Draw professional LNFS-style blue outer zones (the run-off borders around the playing pitch)
    const borderStyle = {
      fill: "#1e3a8a", // elegant deep blue (LNFS / FIFA style)
      selectable: false,
      evented: false,
    };
    
    // Top border
    const topBorder = new fabric.Rect({
      left: 0,
      top: 0,
      width: w,
      height: paddingY,
      ...borderStyle,
    });
    // Bottom border
    const bottomBorder = new fabric.Rect({
      left: 0,
      top: h - paddingY,
      width: w,
      height: paddingY,
      ...borderStyle,
    });
    // Left border
    const leftBorder = new fabric.Rect({
      left: 0,
      top: paddingY,
      width: paddingX,
      height: pitchH,
      ...borderStyle,
    });
    // Right border
    const rightBorder = new fabric.Rect({
      left: w - paddingX,
      top: paddingY,
      width: paddingX,
      height: pitchH,
      ...borderStyle,
    });
    canvas.add(topBorder, bottomBorder, leftBorder, rightBorder);

    const lineStyle = {
      fill: "transparent",
      stroke: "#ffffff",
      strokeWidth: 3,
      selectable: false,
      evented: false,
    };

    // 1. Outer boundary line
    const outerRect = new fabric.Rect({
      left: paddingX,
      top: paddingY,
      width: pitchW,
      height: pitchH,
      ...lineStyle,
    });
    canvas.add(outerRect);

    // 2. Center line
    const centerLine = new fabric.Line(
      [w / 2, paddingY, w / 2, h - paddingY],
      {
        ...lineStyle,
      }
    );
    canvas.add(centerLine);

    // 3. Center circle
    const centerCircleRadius = pitchH * 0.15;
    const centerCircle = new fabric.Circle({
      left: w / 2 - centerCircleRadius,
      top: h / 2 - centerCircleRadius,
      radius: centerCircleRadius,
      ...lineStyle,
    });
    canvas.add(centerCircle);

    // 4. Center spot
    const centerSpot = new fabric.Circle({
      left: w / 2 - 4,
      top: h / 2 - 4,
      radius: 4,
      fill: "#ffffff",
      selectable: false,
      evented: false,
    });
    canvas.add(centerSpot);

    // Futsal goal width is 3m. Let's scale it as 15% of pitch height
    const goalW = pitchH * 0.15;
    // Penalty area radius is 6m, which is twice the goal width
    const penaltyRadius = goalW * 2;

    // 5. Left Penalty Area (Official D-shape)
    const leftPenaltyPath = `M ${paddingX} ${h / 2 - goalW / 2 - penaltyRadius} ` +
      `A ${penaltyRadius} ${penaltyRadius} 0 0 1 ${paddingX + penaltyRadius} ${h / 2 - goalW / 2} ` +
      `L ${paddingX + penaltyRadius} ${h / 2 + goalW / 2} ` +
      `A ${penaltyRadius} ${penaltyRadius} 0 0 1 ${paddingX} ${h / 2 + goalW / 2 + penaltyRadius}`;

    const leftPenalty = new fabric.Path(leftPenaltyPath, {
      ...lineStyle,
    });
    canvas.add(leftPenalty);

    // 6. Right Penalty Area (Official D-shape)
    const rightPenaltyPath = `M ${w - paddingX} ${h / 2 - goalW / 2 - penaltyRadius} ` +
      `A ${penaltyRadius} ${penaltyRadius} 0 0 0 ${w - paddingX - penaltyRadius} ${h / 2 - goalW / 2} ` +
      `L ${w - paddingX - penaltyRadius} ${h / 2 + goalW / 2} ` +
      `A ${penaltyRadius} ${penaltyRadius} 0 0 0 ${w - paddingX} ${h / 2 + goalW / 2 + penaltyRadius}`;

    const rightPenalty = new fabric.Path(rightPenaltyPath, {
      ...lineStyle,
    });
    canvas.add(rightPenalty);

    // 7. Left Goal Frame (behind goal line)
    const goalDepth = 20;
    const leftGoalBack = new fabric.Line(
      [paddingX - goalDepth, h / 2 - goalW / 2, paddingX - goalDepth, h / 2 + goalW / 2],
      { ...lineStyle }
    );
    const leftGoalTop = new fabric.Line(
      [paddingX, h / 2 - goalW / 2, paddingX - goalDepth, h / 2 - goalW / 2],
      { ...lineStyle }
    );
    const leftGoalBottom = new fabric.Line(
      [paddingX, h / 2 + goalW / 2, paddingX - goalDepth, h / 2 + goalW / 2],
      { ...lineStyle }
    );
    canvas.add(leftGoalBack, leftGoalTop, leftGoalBottom);

    // Left Goal Netting Lines
    const leftNetLines: fabric.Line[] = [];
    for (let offset = -goalW / 2; offset <= goalW / 2; offset += 10) {
      leftNetLines.push(
        new fabric.Line([paddingX, h / 2 + offset, paddingX - goalDepth, h / 2 + offset + 5], {
          stroke: "rgba(255, 255, 255, 0.25)",
          strokeWidth: 1,
          selectable: false,
          evented: false,
        })
      );
      leftNetLines.push(
        new fabric.Line([paddingX, h / 2 + offset, paddingX - goalDepth, h / 2 + offset - 5], {
          stroke: "rgba(255, 255, 255, 0.25)",
          strokeWidth: 1,
          selectable: false,
          evented: false,
        })
      );
    }
    canvas.add(...leftNetLines);

    // 8. Right Goal Frame (behind goal line)
    const rightGoalBack = new fabric.Line(
      [w - paddingX + goalDepth, h / 2 - goalW / 2, w - paddingX + goalDepth, h / 2 + goalW / 2],
      { ...lineStyle }
    );
    const rightGoalTop = new fabric.Line(
      [w - paddingX, h / 2 - goalW / 2, w - paddingX + goalDepth, h / 2 - goalW / 2],
      { ...lineStyle }
    );
    const rightGoalBottom = new fabric.Line(
      [w - paddingX, h / 2 + goalW / 2, w - paddingX + goalDepth, h / 2 + goalW / 2],
      { ...lineStyle }
    );
    canvas.add(rightGoalBack, rightGoalTop, rightGoalBottom);

    // Right Goal Netting Lines
    const rightNetLines: fabric.Line[] = [];
    for (let offset = -goalW / 2; offset <= goalW / 2; offset += 10) {
      rightNetLines.push(
        new fabric.Line([w - paddingX, h / 2 + offset, w - paddingX + goalDepth, h / 2 + offset + 5], {
          stroke: "rgba(255, 255, 255, 0.25)",
          strokeWidth: 1,
          selectable: false,
          evented: false,
        })
      );
      rightNetLines.push(
        new fabric.Line([w - paddingX, h / 2 + offset, w - paddingX + goalDepth, h / 2 + offset - 5], {
          stroke: "rgba(255, 255, 255, 0.25)",
          strokeWidth: 1,
          selectable: false,
          evented: false,
        })
      );
    }
    canvas.add(...rightNetLines);

    // 8.5 Striped Goalposts (White & Red)
    const postStyle = {
      radius: 5,
      fill: "#ffffff",
      stroke: "#ef4444", // red stripes look
      strokeWidth: 2,
      selectable: false,
      evented: false,
    };
    const leftPost1 = new fabric.Circle({
      left: paddingX - 5,
      top: h / 2 - goalW / 2 - 5,
      ...postStyle,
    });
    const leftPost2 = new fabric.Circle({
      left: paddingX - 5,
      top: h / 2 + goalW / 2 - 5,
      ...postStyle,
    });
    const rightPost1 = new fabric.Circle({
      left: w - paddingX - 5,
      top: h / 2 - goalW / 2 - 5,
      ...postStyle,
    });
    const rightPost2 = new fabric.Circle({
      left: w - paddingX - 5,
      top: h / 2 + goalW / 2 - 5,
      ...postStyle,
    });
    canvas.add(leftPost1, leftPost2, rightPost1, rightPost2);

    // 9. Penalty spots (6m spots)
    const left6mSpot = new fabric.Circle({
      left: paddingX + penaltyRadius - 3,
      top: h / 2 - 3,
      radius: 3,
      fill: "#ffffff",
      selectable: false,
      evented: false,
    });
    const right6mSpot = new fabric.Circle({
      left: w - paddingX - penaltyRadius - 3,
      top: h / 2 - 3,
      radius: 3,
      fill: "#ffffff",
      selectable: false,
      evented: false,
    });
    canvas.add(left6mSpot, right6mSpot);

    // 10. Double-penalty spots (10m spots)
    const doublePenaltyDist = penaltyRadius * (10 / 6);
    const left10mSpot = new fabric.Circle({
      left: paddingX + doublePenaltyDist - 3,
      top: h / 2 - 3,
      radius: 3,
      fill: "#ffffff",
      selectable: false,
      evented: false,
    });
    const right10mSpot = new fabric.Circle({
      left: w - paddingX - doublePenaltyDist - 3,
      top: h / 2 - 3,
      radius: 3,
      fill: "#ffffff",
      selectable: false,
      evented: false,
    });
    canvas.add(left10mSpot, right10mSpot);

    // 11. Corner Arcs
    const cornerRadius = 15;
    // Top-Left Corner
    const tlCorner = new fabric.Path(
      `M ${paddingX + cornerRadius} ${paddingY} A ${cornerRadius} ${cornerRadius} 0 0 1 ${paddingX} ${paddingY + cornerRadius}`,
      { ...lineStyle }
    );
    // Bottom-Left Corner
    const blCorner = new fabric.Path(
      `M ${paddingX} ${h - paddingY - cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 1 ${paddingX + cornerRadius} ${h - paddingY}`,
      { ...lineStyle }
    );
    // Top-Right Corner
    const trCorner = new fabric.Path(
      `M ${w - paddingX} ${paddingY + cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 1 ${w - paddingX - cornerRadius} ${paddingY}`,
      { ...lineStyle }
    );
    // Bottom-Right Corner
    const brCorner = new fabric.Path(
      `M ${w - paddingX - cornerRadius} ${h - paddingY} A ${cornerRadius} ${cornerRadius} 0 0 1 ${w - paddingX} ${h - paddingY - cornerRadius}`,
      { ...lineStyle }
    );
    canvas.add(tlCorner, blCorner, trCorner, brCorner);

    // 12. Substitution zones (marks at the bottom touchline)
    const tickLen = 6;
    const subZoneOffset1 = pitchW * 0.125;
    const subZoneOffset2 = pitchW * 0.25;

    const ticks: [number, number, number, number][] = [
      // Left side substitution zone
      [w / 2 - subZoneOffset2, h - paddingY - tickLen, w / 2 - subZoneOffset2, h - paddingY + tickLen],
      [w / 2 - subZoneOffset1, h - paddingY - tickLen, w / 2 - subZoneOffset1, h - paddingY + tickLen],
      // Right side substitution zone
      [w / 2 + subZoneOffset1, h - paddingY - tickLen, w / 2 + subZoneOffset1, h - paddingY + tickLen],
      [w / 2 + subZoneOffset2, h - paddingY - tickLen, w / 2 + subZoneOffset2, h - paddingY + tickLen],
    ];

    ticks.forEach((t) => {
      const tickLine = new fabric.Line(t, {
        stroke: "#ffffff",
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      canvas.add(tickLine);
    });
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
    canvas.backgroundColor = "transparent";
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

          <div
            ref={containerRef}
            className="relative w-full rounded-lg overflow-hidden border border-zinc-700"
            style={{
              backgroundImage: "url('/parquet.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
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
