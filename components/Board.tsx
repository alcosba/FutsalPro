"use client";

import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/shared/Toast";

type Tool =
  | "select"
  | "cono"
  | "flecha"
  | "balon"
  | "monigote"
  | "porteria"
  | "linea"
  | "arco"
  | "zona"
  | "freehand"
  | "borrador";
type PitchType = "full" | "half" | "third";
type PitchStyle = "parquet" | "blue" | "green" | "white";

interface DrawingObject {
  type: string;
  x: number;
  y: number;
  data: any;
}

const TOOLS = [
  { id: "select", label: "Seleccionar", icon: "↖️" },
  { id: "cono", label: "Cono", icon: "🔴" },
  { id: "flecha", label: "Flecha", icon: "➜" },
  { id: "balon", label: "Balón", icon: "⚽" },
  { id: "monigote", label: "Jugador", icon: "🧑" },
  { id: "porteria", label: "Portería", icon: "🥅" },
  { id: "linea", label: "Línea", icon: "─" },
  { id: "arco", label: "Arco", icon: "⌢" },
  { id: "zona", label: "Zona", icon: "▭" },
  { id: "freehand", label: "Dibujar", icon: "✏️" },
  { id: "borrador", label: "Borrador", icon: "🗑️" },
];

const COLORS = [
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ffa500",
  "#ff69b4",
  "#90ee90",
];

export default function Board() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addToast } = useToast();

  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState<string>("#ffffff");
  const [pitchType, setPitchType] = useState<PitchType>("full");
  const [pitchStyle, setPitchStyle] = useState<PitchStyle>("parquet");
  const [playerNumber, setPlayerNumber] = useState(1);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const pathRef = useRef<Array<{ x: number; y: number }>>([]);
  const objectsRef = useRef<DrawingObject[]>([]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = containerRef.current.clientWidth || 1000;
    const height = 600;

    canvas.width = width;
    canvas.height = height;

    redrawCanvas(ctx, canvas, pitchType, pitchStyle);

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      canvas.width = newWidth;
      canvas.height = height;
      redrawCanvas(ctx, canvas, pitchType, pitchStyle);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    redrawCanvas(ctx, canvasRef.current, pitchType, pitchStyle);
  }, [pitchType, pitchStyle]);

  const redrawCanvas = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    type: PitchType,
    style: PitchStyle
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgColor =
      style === "parquet"
        ? "#a67c52"
        : style === "blue"
          ? "#1e3a8a"
          : style === "green"
            ? "#065f46"
            : "#e5e7eb";

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawField(ctx, canvas, type, style);

    objectsRef.current.forEach((obj) => drawObject(ctx, obj));
  };

  const drawField = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    type: PitchType,
    style: PitchStyle
  ) => {
    const w = canvas.width;
    const h = canvas.height;
    const padding = 40;
    const fieldW = w - padding * 2;
    const fieldH = h - padding * 2;

    const lineColor = style === "white" ? "#1f2937" : "#ffffff";

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;

    ctx.strokeRect(padding, padding, fieldW, fieldH);

    ctx.beginPath();
    ctx.moveTo(w / 2, padding);
    ctx.lineTo(w / 2, h - padding);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    const goalW = fieldH * 0.25;
    const penaltyRadius = goalW * 1.3;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(padding, h / 2 - goalW / 2);
    ctx.lineTo(padding + penaltyRadius, h / 2 - goalW / 2);
    ctx.arc(
      padding + penaltyRadius,
      h / 2,
      goalW / 2,
      (-Math.PI) / 2,
      Math.PI / 2
    );
    ctx.lineTo(padding, h / 2 + goalW / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w - padding, h / 2 - goalW / 2);
    ctx.lineTo(w - padding - penaltyRadius, h / 2 - goalW / 2);
    ctx.arc(
      w - padding - penaltyRadius,
      h / 2,
      goalW / 2,
      Math.PI / 2,
      (-Math.PI) / 2
    );
    ctx.lineTo(w - padding, h / 2 + goalW / 2);
    ctx.stroke();
  };

  const drawObject = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    ctx.fillStyle = obj.data.color || "#ffffff";
    ctx.strokeStyle = obj.data.color || "#ffffff";
    ctx.lineWidth = obj.data.lineWidth || 2;

    switch (obj.type) {
      case "cono":
        drawCone(ctx, obj.x, obj.y, obj.data.color);
        break;
      case "balon":
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "monigote":
        drawPlayer(ctx, obj.x, obj.y, obj.data.number, obj.data.color);
        break;
      case "porteria":
        drawGoal(ctx, obj.x, obj.y, obj.data.color);
        break;
      case "linea":
        ctx.beginPath();
        ctx.moveTo(obj.data.x1, obj.data.y1);
        ctx.lineTo(obj.data.x2, obj.data.y2);
        ctx.stroke();
        break;
      case "arco":
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.data.radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "zona":
        ctx.fillStyle = obj.data.color + "26";
        ctx.fillRect(obj.data.x1, obj.data.y1, obj.data.x2, obj.data.y2);
        ctx.strokeStyle = obj.data.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.data.x1, obj.data.y1, obj.data.x2, obj.data.y2);
        break;
      case "flecha":
        drawArrow(
          ctx,
          obj.data.x1,
          obj.data.y1,
          obj.data.x2,
          obj.data.y2,
          obj.data.color
        );
        break;
      case "freehand":
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        obj.data.points.forEach((point: any, index: number) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
        break;
    }
  };

  const drawCone = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 10, y + 10);
    ctx.lineTo(x - 10, y + 10);
    ctx.closePath();
    ctx.fill();
  };

  const drawPlayer = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    number: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number), x, y);
  };

  const drawGoal = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ) => {
    const width = 40;
    const height = 60;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
      const offset = (i / 4) * width;
      ctx.beginPath();
      ctx.moveTo(x - width / 2 + offset, y - height / 2);
      ctx.lineTo(x - width / 2 + offset, y + height / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string
  ) => {
    const headlen = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headlen * Math.cos(angle - Math.PI / 6),
      y2 - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headlen * Math.cos(angle + Math.PI / 6),
      y2 - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    startPointRef.current = { x, y };
    isDrawingRef.current = true;
    pathRef.current = [];

    if (activeTool === "freehand") {
      pathRef.current = [{ x, y }];
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawingRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "freehand") {
      pathRef.current.push({ x, y });
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        redrawCanvas(ctx, canvasRef.current, pitchType, pitchStyle);
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        pathRef.current.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    isDrawingRef.current = false;

    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const distance = Math.sqrt(
      Math.pow(endX - startPointRef.current.x, 2) +
        Math.pow(endY - startPointRef.current.y, 2)
    );

    if (distance < 5) {
      switch (activeTool) {
        case "cono":
          objectsRef.current.push({
            type: "cono",
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            data: { color: activeColor },
          });
          addToast("Cono añadido", "success");
          break;
        case "balon":
          objectsRef.current.push({
            type: "balon",
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            data: { color: activeColor },
          });
          addToast("Balón añadido", "success");
          break;
        case "monigote":
          objectsRef.current.push({
            type: "monigote",
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            data: { color: activeColor, number: playerNumber },
          });
          addToast(`Jugador #${playerNumber} añadido`, "success");
          break;
        case "porteria":
          objectsRef.current.push({
            type: "porteria",
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            data: { color: activeColor },
          });
          addToast("Portería añadida", "success");
          break;
      }
    } else {
      switch (activeTool) {
        case "linea":
          objectsRef.current.push({
            type: "linea",
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            data: {
              color: activeColor,
              x1: startPointRef.current.x,
              y1: startPointRef.current.y,
              x2: endX,
              y2: endY,
            },
          });
          addToast("Línea dibujada", "success");
          break;
        case "arco":
          const radius = Math.sqrt(
            Math.pow(endX - startPointRef.current.x, 2) +
              Math.pow(endY - startPointRef.current.y, 2)
          );
          objectsRef.current.push({
            type: "arco",
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            data: { color: activeColor, radius },
          });
          addToast("Arco dibujado", "success");
          break;
        case "zona":
          const w = endX - startPointRef.current.x;
          const h = endY - startPointRef.current.y;
          objectsRef.current.push({
            type: "zona",
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            data: {
              color: activeColor,
              x1: startPointRef.current.x,
              y1: startPointRef.current.y,
              x2: Math.abs(w),
              y2: Math.abs(h),
            },
          });
          addToast("Zona dibujada", "success");
          break;
        case "flecha":
          objectsRef.current.push({
            type: "flecha",
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            data: {
              color: activeColor,
              x1: startPointRef.current.x,
              y1: startPointRef.current.y,
              x2: endX,
              y2: endY,
            },
          });
          addToast("Flecha dibujada", "success");
          break;
      }
    }

    if (activeTool === "freehand" && pathRef.current.length > 0) {
      objectsRef.current.push({
        type: "freehand",
        x: 0,
        y: 0,
        data: { color: activeColor, points: pathRef.current },
      });
      addToast("Dibujo guardado", "success");
    }

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      redrawCanvas(ctx, canvasRef.current, pitchType, pitchStyle);
    }
  };

  const clearCanvas = () => {
    objectsRef.current = [];
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        redrawCanvas(ctx, canvasRef.current, pitchType, pitchStyle);
      }
    }
    addToast("Pizarra limpiada", "success");
  };

  const saveExercise = () => {
    const name = prompt("Nombre del ejercicio:", `Ejercicio ${new Date().toLocaleTimeString()}`);
    if (!name || !canvasRef.current) return;

    const data = {
      name,
      objects: objectsRef.current,
      timestamp: Date.now(),
    };

    try {
      const key = `futsal_exercise_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(data));
      addToast(`Ejercicio "${name}" guardado`, "success");
    } catch (error) {
      addToast("Error al guardar ejercicio", "error");
    }
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `futsal_tactical_${Date.now()}.png`;
    link.click();
    addToast("Imagen descargada", "success");
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 p-4 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-300">
              Tipo de campo:
            </label>
            <select
              value={pitchType}
              onChange={(e) => setPitchType(e.target.value as PitchType)}
              className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            >
              <option value="full">Campo Completo</option>
              <option value="half">Media Cancha</option>
              <option value="third">Tercio</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-300">
              Superficie:
            </label>
            <select
              value={pitchStyle}
              onChange={(e) => setPitchStyle(e.target.value as PitchStyle)}
              className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            >
              <option value="parquet">Parquet</option>
              <option value="blue">Azul</option>
              <option value="green">Verde</option>
              <option value="white">Blanco</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={clearCanvas}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition"
            >
              🗑️ Limpiar
            </button>
            <button
              onClick={saveExercise}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
            >
              💾 Guardar
            </button>
            <button
              onClick={downloadImage}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition"
            >
              📥 Descargar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as Tool)}
              title={tool.label}
              className={`w-10 h-10 rounded flex items-center justify-center text-lg transition ${
                activeTool === tool.id
                  ? "bg-blue-600 ring-2 ring-blue-400"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              className={`w-8 h-8 rounded border-2 transition ${
                activeColor === color
                  ? "border-white ring-2 ring-yellow-400"
                  : "border-gray-500"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}

          <input
            type="number"
            min="1"
            max="99"
            value={playerNumber}
            onChange={(e) => setPlayerNumber(parseInt(e.target.value) || 1)}
            className="w-12 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            title="Número del jugador"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-950">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            className="border-2 border-gray-700 rounded shadow-lg cursor-crosshair"
          />
        </div>
      </div>
    </div>
  );
}
