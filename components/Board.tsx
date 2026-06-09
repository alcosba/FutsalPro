"use client";

import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { useToast } from "@/components/shared/Toast";

type Tool = "select" | "cono" | "flecha" | "balon" | "monigote" | "porteria" | "linea" | "arco" | "zona" | "freehand" | "borrador";
type PitchType = "full" | "half" | "third";
type PitchStyle = "parquet" | "blue" | "green" | "white";

interface ToolConfig {
  id: Tool;
  label: string;
  icon: string;
}

const TOOLS: ToolConfig[] = [
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
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const { addToast } = useToast();

  // UI State
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState<string>("#ffffff");
  const [pitchType, setPitchType] = useState<PitchType>("full");
  const [pitchStyle, setPitchStyle] = useState<PitchStyle>("parquet");
  const [playerNumber, setPlayerNumber] = useState(1);
  const [zoom, setZoom] = useState(1);

  // Drawing state
  const isDrawingRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const tempObjectRef = useRef<fabric.Object | null>(null);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 1000;
    const height = 600;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "transparent",
      selection: false,
    });

    fabricCanvasRef.current = canvas;
    drawField(canvas, pitchType, pitchStyle);

    // Canvas Event Listeners
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const newWidth = containerRef.current.clientWidth;
      canvas.setDimensions({ width: newWidth, height });
      drawField(canvas, pitchType, pitchStyle);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, []);

  // Redraw field when type or style changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    drawField(fabricCanvasRef.current, pitchType, pitchStyle);
  }, [pitchType, pitchStyle]);

  const handleMouseDown = (e: any) => {
    if (activeTool === "select") return;
    if (!fabricCanvasRef.current) return;

    const pointer = fabricCanvasRef.current.getPointer(e.e);
    startPointRef.current = { x: pointer.x, y: pointer.y };
    isDrawingRef.current = true;

    if (activeTool === "freehand") {
      fabricCanvasRef.current.isDrawingMode = true;
      if (fabricCanvasRef.current.freeDrawingBrush) {
        fabricCanvasRef.current.freeDrawingBrush.color = activeColor;
        fabricCanvasRef.current.freeDrawingBrush.width = 4;
      }
    } else if (activeTool === "borrador") {
      const target = fabricCanvasRef.current.findTarget(e.e as MouseEvent);
      if (target && !(target as any).isCourtLine) {
        fabricCanvasRef.current.remove(target);
        fabricCanvasRef.current.renderAll();
        addToast("Elemento eliminado", "success");
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawingRef.current || !fabricCanvasRef.current) return;
    if (activeTool === "freehand" || activeTool === "select" || activeTool === "borrador") return;

    const pointer = fabricCanvasRef.current.getPointer(e.e);
    const canvas = fabricCanvasRef.current;

    // Remove previous temp object
    if (tempObjectRef.current) {
      canvas.remove(tempObjectRef.current);
    }

    const dx = pointer.x - startPointRef.current.x;
    const dy = pointer.y - startPointRef.current.y;

    switch (activeTool) {
      case "linea":
        tempObjectRef.current = new fabric.Line(
          [startPointRef.current.x, startPointRef.current.y, pointer.x, pointer.y],
          {
            stroke: activeColor,
            strokeWidth: 3,
            selectable: false,
          }
        );
        break;

      case "arco":
        const radius = Math.sqrt(dx * dx + dy * dy);
        tempObjectRef.current = new fabric.Circle({
          left: startPointRef.current.x - radius,
          top: startPointRef.current.y - radius,
          radius,
          fill: "transparent",
          stroke: activeColor,
          strokeWidth: 3,
          selectable: false,
        });
        break;

      case "zona":
        tempObjectRef.current = new fabric.Rect({
          left: Math.min(startPointRef.current.x, pointer.x),
          top: Math.min(startPointRef.current.y, pointer.y),
          width: Math.abs(dx),
          height: Math.abs(dy),
          fill: activeColor,
          opacity: 0.15,
          stroke: activeColor,
          strokeWidth: 2,
          selectable: false,
        });
        break;

      case "flecha":
        const angle = Math.atan2(dy, dx);

        const line = new fabric.Line(
          [startPointRef.current.x, startPointRef.current.y, pointer.x, pointer.y],
          {
            stroke: activeColor,
            strokeWidth: 3,
            selectable: false,
          }
        );

        const arrowSize = 15;
        const arrowPoints = [
          { x: pointer.x, y: pointer.y },
          {
            x: pointer.x - arrowSize * Math.cos(angle - Math.PI / 6),
            y: pointer.y - arrowSize * Math.sin(angle - Math.PI / 6),
          },
          {
            x: pointer.x - arrowSize * Math.cos(angle + Math.PI / 6),
            y: pointer.y - arrowSize * Math.sin(angle + Math.PI / 6),
          },
        ];

        const arrow = new fabric.Polygon(arrowPoints, {
          fill: activeColor,
          selectable: false,
        });

        tempObjectRef.current = new fabric.Group([line, arrow], {
          selectable: false,
        });
        break;
    }

    if (tempObjectRef.current) {
      canvas.add(tempObjectRef.current);
      canvas.renderAll();
    }
  };

  const handleMouseUp = (e: any) => {
    if (!isDrawingRef.current || !fabricCanvasRef.current) return;
    isDrawingRef.current = false;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(e.e);

    if (tempObjectRef.current) {
      tempObjectRef.current.selectable = true;
      tempObjectRef.current.evented = true;
      tempObjectRef.current = null;
    }

    const dx = pointer.x - startPointRef.current.x;
    const dy = pointer.y - startPointRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5 && activeTool !== "linea" && activeTool !== "arco") {
      // Click action
      switch (activeTool) {
        case "cono":
          addCone(canvas, pointer.x, pointer.y);
          break;
        case "balon":
          addBall(canvas, pointer.x, pointer.y);
          break;
        case "monigote":
          addPlayer(canvas, pointer.x, pointer.y, playerNumber);
          break;
        case "porteria":
          addGoal(canvas, pointer.x, pointer.y);
          break;
      }
    } else {
      // Drag action - already added as tempObject
      canvas.renderAll();
    }

    if (activeTool === "freehand") {
      canvas.isDrawingMode = false;
    }
  };

  const addCone = (canvas: fabric.Canvas, x: number, y: number) => {
    const cone = new fabric.Triangle({
      left: x,
      top: y,
      width: 20,
      height: 20,
      fill: activeColor,
      selectable: true,
      evented: true,
    });
    canvas.add(cone);
    canvas.renderAll();
    addToast("Cono añadido", "success");
  };

  const addBall = (canvas: fabric.Canvas, x: number, y: number) => {
    const ball = new fabric.Circle({
      left: x - 8,
      top: y - 8,
      radius: 8,
      fill: activeColor,
      selectable: true,
      evented: true,
    });
    canvas.add(ball);
    canvas.renderAll();
    addToast("Balón añadido", "success");
  };

  const addPlayer = (canvas: fabric.Canvas, x: number, y: number, number: number) => {
    const circle = new fabric.Circle({
      left: x - 12,
      top: y - 12,
      radius: 12,
      fill: activeColor,
      selectable: true,
      evented: true,
    });

    const text = new fabric.Text(String(number), {
      left: x - 5,
      top: y - 7,
      fontSize: 14,
      fontWeight: "bold",
      fill: "#000",
      selectable: false,
      evented: false,
    });

    const group = new fabric.Group([circle, text], {
      left: x,
      top: y,
      selectable: true,
      evented: true,
    });

    canvas.add(group);
    canvas.renderAll();
    addToast(`Jugador #${number} añadido`, "success");
  };

  const addGoal = (canvas: fabric.Canvas, x: number, y: number) => {
    const width = 40;
    const height = 60;

    // Goal structure
    const goalRect = new fabric.Rect({
      left: x - width / 2,
      top: y - height / 2,
      width,
      height,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: 3,
      selectable: true,
      evented: true,
    });

    // Goal net (diagonal lines)
    const netLines = [];
    for (let i = 0; i < 5; i++) {
      const offset = (i / 4) * width;
      netLines.push(
        new fabric.Line(
          [
            x - width / 2 + offset,
            y - height / 2,
            x - width / 2 + offset,
            y + height / 2,
          ],
          {
            stroke: activeColor,
            strokeWidth: 1,
            opacity: 0.5,
            selectable: false,
            evented: false,
          }
        )
      );
    }

    canvas.add(goalRect);
    netLines.forEach((line) => canvas.add(line));
    canvas.renderAll();
    addToast("Portería añadida", "success");
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (!(obj as any).isCourtLine) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
    addToast("Pizarra limpiada", "success");
  };

  const saveExercise = async () => {
    if (!fabricCanvasRef.current) return;

    const name = prompt("Nombre del ejercicio:", `Ejercicio ${new Date().toLocaleTimeString()}`);
    if (!name) return;

    try {
      const json = JSON.stringify(fabricCanvasRef.current.toJSON());
      const key = `futsal_exercise_${Date.now()}`;
      localStorage.setItem(key, json);
      addToast(`Ejercicio "${name}" guardado`, "success");
    } catch (error) {
      addToast("Error al guardar ejercicio", "error");
    }
  };

  const downloadImage = () => {
    if (!fabricCanvasRef.current) return;
    const dataUrl = fabricCanvasRef.current.toDataURL({ format: "png" });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `futsal_tactical_${Date.now()}.png`;
    link.click();
    addToast("Imagen descargada", "success");
  };

  const drawField = (canvas: fabric.Canvas, type: PitchType, style: PitchStyle) => {
    // Clear existing field
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if ((obj as any).isCourtLine) {
        canvas.remove(obj);
      }
    });

    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const padding = 40;
    const fieldW = w - padding * 2;
    const fieldH = h - padding * 2;

    const bgColor =
      style === "parquet"
        ? "#a67c52"
        : style === "blue"
          ? "#1e3a8a"
          : style === "green"
            ? "#065f46"
            : "#e5e7eb";
    const lineColor = style === "white" ? "#1f2937" : "#ffffff";

    // Background
    const bg = new fabric.Rect({
      left: 0,
      top: 0,
      width: w,
      height: h,
      fill: bgColor,
      selectable: false,
      evented: false,
    });
    (bg as any).isCourtLine = true;
    canvas.add(bg);

    // Field border
    const border = new fabric.Rect({
      left: padding,
      top: padding,
      width: fieldW,
      height: fieldH,
      fill: "transparent",
      stroke: lineColor,
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });
    (border as any).isCourtLine = true;
    canvas.add(border);

    // Center line
    const centerLine = new fabric.Line(
      [w / 2, padding, w / 2, h - padding],
      {
        stroke: lineColor,
        strokeWidth: 2,
        selectable: false,
        evented: false,
      }
    );
    (centerLine as any).isCourtLine = true;
    canvas.add(centerLine);

    // Center circle
    const centerCircle = new fabric.Circle({
      left: w / 2 - 50,
      top: h / 2 - 50,
      radius: 50,
      fill: "transparent",
      stroke: lineColor,
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });
    (centerCircle as any).isCourtLine = true;
    canvas.add(centerCircle);

    // Center point
    const centerPoint = new fabric.Circle({
      left: w / 2 - 4,
      top: h / 2 - 4,
      radius: 4,
      fill: lineColor,
      selectable: false,
      evented: false,
    });
    (centerPoint as any).isCourtLine = true;
    canvas.add(centerPoint);

    // Penalty areas
    const goalW = fieldH * 0.25;
    const penaltyRadius = goalW * 1.3;

    // Left penalty area
    const leftPenaltyPath = `M ${padding} ${h / 2 - goalW / 2} ` +
      `L ${padding + penaltyRadius} ${h / 2 - goalW / 2} ` +
      `A ${penaltyRadius} ${penaltyRadius} 0 0 1 ${padding + penaltyRadius} ${h / 2 + goalW / 2} ` +
      `L ${padding} ${h / 2 + goalW / 2}`;

    const leftPenalty = new fabric.Path(leftPenaltyPath, {
      stroke: lineColor,
      strokeWidth: 2,
      fill: "transparent",
      selectable: false,
      evented: false,
    });
    (leftPenalty as any).isCourtLine = true;
    canvas.add(leftPenalty);

    // Right penalty area (mirrored)
    const rightPenaltyPath = `M ${w - padding} ${h / 2 - goalW / 2} ` +
      `L ${w - padding - penaltyRadius} ${h / 2 - goalW / 2} ` +
      `A ${penaltyRadius} ${penaltyRadius} 0 0 0 ${w - padding - penaltyRadius} ${h / 2 + goalW / 2} ` +
      `L ${w - padding} ${h / 2 + goalW / 2}`;

    const rightPenalty = new fabric.Path(rightPenaltyPath, {
      stroke: lineColor,
      strokeWidth: 2,
      fill: "transparent",
      selectable: false,
      evented: false,
    });
    (rightPenalty as any).isCourtLine = true;
    canvas.add(rightPenalty);

    canvas.renderAll();
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 space-y-3">
        {/* Row 1: Field Configuration */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-300">Tipo de campo:</label>
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
            <label className="text-sm font-medium text-gray-300">Superficie:</label>
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

        {/* Row 2: Color Palette */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-300 whitespace-nowrap">Colores:</label>
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`w-8 h-8 rounded border-2 transition ${
                  activeColor === color ? "border-white scale-110" : "border-gray-600 hover:border-gray-400"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Row 3: Tools Grid */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-gray-300 whitespace-nowrap">Herramientas:</label>
          <div className="flex gap-1 flex-wrap">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  activeTool === tool.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                title={tool.label}
              >
                {tool.icon} {tool.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Player Number */}
        {activeTool === "monigote" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-300">Número de jugador:</label>
            <input
              type="number"
              value={playerNumber}
              onChange={(e) => setPlayerNumber(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
              className="w-16 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
              min="1"
              max="99"
            />
          </div>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 bg-gray-950 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ cursor: activeTool === "select" ? "default" : "crosshair" }}
        />
      </div>

      {/* Footer Info */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-400 flex justify-between">
        <span>🖱️ Herramienta: <strong>{TOOLS.find(t => t.id === activeTool)?.label || "N/A"}</strong></span>
        <span>🎨 Color: <strong>{activeColor}</strong></span>
        <span>📐 Campo: <strong>{pitchType === "full" ? "Completo" : pitchType === "half" ? "Media" : "Tercio"}</strong></span>
      </div>
    </div>
  );
}
