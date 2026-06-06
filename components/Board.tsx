"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";

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

  // Tactical Board States
  const [pitchType, setPitchType] = useState<'full' | 'half' | 'third'>("full");
  const [pitchStyle, setPitchStyle] = useState<'parquet' | 'blue' | 'green' | 'white'>("parquet");
  const [activeTool, setActiveTool] = useState<'select' | 'carrera' | 'pase' | 'conduccion' | 'tiro' | 'freehand'>("select");
  const [activeColor, setActiveColor] = useState<string>("#ffffff");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedPlayerNumber, setSelectedPlayerNumber] = useState<string>("1");
  const [activeTab, setActiveSidebarTab] = useState<'pista' | 'dibujo' | 'elementos'>("pista");

  // Save/Load States
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Refs to avoid stale closures in canvas event listeners
  const activeToolRef = useRef(activeTool);
  const activeColorRef = useRef(activeColor);
  const pitchTypeRef = useRef(pitchType);
  const pitchStyleRef = useRef(pitchStyle);

  useEffect(() => {
    activeToolRef.current = activeTool;
    activeColorRef.current = activeColor;
    pitchTypeRef.current = pitchType;
    pitchStyleRef.current = pitchStyle;
  }, [activeTool, activeColor, pitchType, pitchStyle]);

  // Load folders and exercises on mount
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

    // Draw initial pitch
    drawFutsalCourt(fbCanvas, canvasWidth, canvasHeight, pitchTypeRef.current, pitchStyleRef.current);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvasRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      fabricCanvasRef.current.setDimensions({ width: newWidth });
      drawFutsalCourt(fabricCanvasRef.current, newWidth, fabricCanvasRef.current.getHeight(), pitchTypeRef.current, pitchStyleRef.current);
    };

    window.addEventListener("resize", handleResize);

    // Setup interactive drawing event listeners
    let isDrawing = false;
    let activeLine: fabric.Line | fabric.Path | null = null;
    let startPoint = { x: 0, y: 0 };

    fbCanvas.on("mouse:down", (opt) => {
      const tool = activeToolRef.current;
      if (tool === "select" || tool === "freehand") return;

      const pointer = fbCanvas.getPointer(opt.e);
      isDrawing = true;
      startPoint = { x: pointer.x, y: pointer.y };

      const strokeSettings: any = {
        stroke: activeColorRef.current,
        strokeWidth: tool === "tiro" ? 5 : 3,
        fill: "transparent",
        selectable: false,
        evented: false,
      };

      if (tool === "pase") {
        strokeSettings.strokeDashArray = [10, 5];
        activeLine = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], strokeSettings);
      } else if (tool === "carrera") {
        activeLine = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], strokeSettings);
      } else if (tool === "tiro") {
        strokeSettings.stroke = activeColorRef.current === "#ffffff" ? "#ef4444" : activeColorRef.current;
        activeLine = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], strokeSettings);
      } else if (tool === "conduccion") {
        activeLine = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], strokeSettings);
      }

      if (activeLine) {
        fbCanvas.add(activeLine);
      }
    });

    fbCanvas.on("mouse:move", (opt) => {
      if (!isDrawing || !activeLine) return;
      const tool = activeToolRef.current;
      const pointer = fbCanvas.getPointer(opt.e);

      if (tool === "conduccion") {
        fbCanvas.remove(activeLine);
        const pathData = generateWavyPathData(startPoint.x, startPoint.y, pointer.x, pointer.y);
        activeLine = new fabric.Path(pathData, {
          stroke: activeColorRef.current,
          strokeWidth: 3,
          fill: "transparent",
          selectable: false,
          evented: false,
        });
        fbCanvas.add(activeLine);
      } else {
        const line = activeLine as fabric.Line;
        line.set({ x2: pointer.x, y2: pointer.y });
      }
      fbCanvas.renderAll();
    });

    fbCanvas.on("mouse:up", (opt) => {
      if (!isDrawing || !activeLine) return;
      isDrawing = false;
      const tool = activeToolRef.current;
      const pointer = fbCanvas.getPointer(opt.e);

      const dx = pointer.x - startPoint.x;
      const dy = pointer.y - startPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) {
        fbCanvas.remove(activeLine);
        activeLine = null;
        fbCanvas.renderAll();
        return;
      }

      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const arrowColor = tool === "tiro" && activeColorRef.current === "#ffffff" ? "#ef4444" : activeColorRef.current;
      const arrowSize = tool === "tiro" ? 18 : 12;

      const arrow = new fabric.Triangle({
        left: pointer.x,
        top: pointer.y,
        width: arrowSize,
        height: arrowSize * 1.25,
        fill: arrowColor,
        angle: angle + 90,
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
      });

      fbCanvas.remove(activeLine);
      
      const tacticalLineGroup = new fabric.Group([activeLine, arrow], {
        left: Math.min(startPoint.x, pointer.x),
        top: Math.min(startPoint.y, pointer.y),
        selectable: true,
        evented: true,
        hasControls: true,
      });

      (tacticalLineGroup as any).isTacticalLine = true;
      fbCanvas.add(tacticalLineGroup);
      activeLine = null;
      fbCanvas.renderAll();
    });

    // Selection listeners
    const handleSelection = () => {
      const active = fbCanvas.getActiveObject();
      if (active && (active as any).isPlayer) {
        setSelectedPlayer(active);
        setSelectedPlayerNumber((active as any).number || "1");
      } else {
        setSelectedPlayer(null);
      }
    };

    fbCanvas.on("selection:created", handleSelection);
    fbCanvas.on("selection:updated", handleSelection);
    fbCanvas.on("selection:cleared", () => setSelectedPlayer(null));

    return () => {
      window.removeEventListener("resize", handleResize);
      fbCanvas.dispose();
    };
  }, []);

  // Update court lines when type or style changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    drawFutsalCourt(canvas, canvas.getWidth(), canvas.getHeight(), pitchType, pitchStyle);
  }, [pitchType, pitchStyle]);

  // Handle active drawing tool configurations
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (activeTool === "select") {
      canvas.selection = true;
      canvas.isDrawingMode = false;
      canvas.forEachObject((obj: any) => {
        if (!obj.isCourtLine) {
          obj.selectable = true;
          obj.evented = true;
        }
      });
      canvas.defaultCursor = "default";
    } else if (activeTool === "freehand") {
      canvas.selection = false;
      canvas.isDrawingMode = true;
      canvas.forEachObject((obj: any) => {
        obj.selectable = false;
        obj.evented = false;
      });
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = activeColor;
        canvas.freeDrawingBrush.width = 4;
      }
      canvas.defaultCursor = "crosshair";
    } else {
      // Interactive line drawing
      canvas.selection = false;
      canvas.isDrawingMode = false;
      canvas.forEachObject((obj: any) => {
        obj.selectable = false;
        obj.evented = false;
      });
      canvas.defaultCursor = "crosshair";
    }
    canvas.renderAll();
  }, [activeTool, activeColor]);

  // Helper: Wavy path data generator
  const generateWavyPathData = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy);
    const theta = Math.atan2(dy, dx);
    const numWaves = Math.max(2, Math.floor(d / 12));

    let pathData = `M ${x1} ${y1}`;
    for (let i = 0; i <= numWaves; i++) {
      const t = i / numWaves;
      const cx = x1 + dx * t;
      const cy = y1 + dy * t;
      if (i > 0 && i < numWaves) {
        const waveHeight = 5;
        const perpX = -Math.sin(theta) * waveHeight * (i % 2 === 0 ? 1 : -1);
        const perpY = Math.cos(theta) * waveHeight * (i % 2 === 0 ? 1 : -1);
        pathData += ` Q ${cx + perpX} ${cy + perpY}, ${cx} ${cy}`;
      } else {
        pathData += ` L ${cx} ${cy}`;
      }
    }
    return pathData;
  };

  // Court Line Drawing Core Logic
  const drawFutsalCourt = (
    canvas: fabric.Canvas,
    w: number,
    h: number,
    type: 'full' | 'half' | 'third',
    style: 'parquet' | 'blue' | 'green' | 'white'
  ) => {
    // Clear only existing court lines
    const existing = canvas.getObjects().filter((obj: any) => obj.isCourtLine);
    existing.forEach((obj) => canvas.remove(obj));

    const paddingX = 40;
    const paddingY = 30;
    const pitchW = w - paddingX * 2;
    const pitchH = h - paddingY * 2;

    const lineColor = style === 'white' ? '#1f2937' : '#ffffff';
    const netColor = style === 'white' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.25)';

    const borderStyle = {
      fill: style === 'parquet' ? '#1e3a8a' : (style === 'blue' ? '#0f172a' : (style === 'green' ? '#064e3b' : '#e2e8f0')),
      selectable: false,
      evented: false,
      isCourtLine: true,
    };

    // Outer zones (runoff border)
    const topBorder = new fabric.Rect({ left: 0, top: 0, width: w, height: paddingY, ...borderStyle });
    const bottomBorder = new fabric.Rect({ left: 0, top: h - paddingY, width: w, height: paddingY, ...borderStyle });
    const leftBorder = new fabric.Rect({ left: 0, top: paddingY, width: paddingX, height: pitchH, ...borderStyle });
    const rightBorder = new fabric.Rect({ left: w - paddingX, top: paddingY, width: paddingX, height: pitchH, ...borderStyle });
    canvas.add(topBorder, bottomBorder, leftBorder, rightBorder);

    const lineStyle = {
      fill: "transparent",
      stroke: lineColor,
      strokeWidth: 3,
      selectable: false,
      evented: false,
      isCourtLine: true,
    };

    const goalW = pitchH * 0.22;
    const penaltyRadius = goalW * 1.5;

    if (type === 'full') {
      // Outer boundary line
      const outerRect = new fabric.Rect({
        left: paddingX,
        top: paddingY,
        width: pitchW,
        height: pitchH,
        ...lineStyle,
      });
      canvas.add(outerRect);

      // Center Line
      const centerLine = new fabric.Line([w / 2, paddingY, w / 2, h - paddingY], lineStyle);
      canvas.add(centerLine);

      // Center Circle
      const centerCircleRadius = pitchH * 0.18;
      const centerCircle = new fabric.Circle({
        left: w / 2 - centerCircleRadius,
        top: h / 2 - centerCircleRadius,
        radius: centerCircleRadius,
        ...lineStyle,
      });
      canvas.add(centerCircle);

      // Center Spot
      const centerSpot = new fabric.Circle({
        left: w / 2 - 4,
        top: h / 2 - 4,
        radius: 4,
        fill: lineColor,
        selectable: false,
        evented: false,
        isCourtLine: true,
      });
      canvas.add(centerSpot);

      // Left Penalty Area (Official D-Shape)
      const leftPenaltyPath = `M ${paddingX} ${h / 2 - goalW / 2 - penaltyRadius} ` +
        `A ${penaltyRadius} ${penaltyRadius} 0 0 1 ${paddingX + penaltyRadius} ${h / 2 - goalW / 2} ` +
        `L ${paddingX + penaltyRadius} ${h / 2 + goalW / 2} ` +
        `A ${penaltyRadius} ${penaltyRadius} 0 0 1 ${paddingX} ${h / 2 + goalW / 2 + penaltyRadius}`;
      const leftPenalty = new fabric.Path(leftPenaltyPath, lineStyle);
      canvas.add(leftPenalty);

      // Right Penalty Area (Official D-Shape)
      const rightPenaltyPath = `M ${w - paddingX} ${h / 2 - goalW / 2 - penaltyRadius} ` +
        `A ${penaltyRadius} ${penaltyRadius} 0 0 0 ${w - paddingX - penaltyRadius} ${h / 2 - goalW / 2} ` +
        `L ${w - paddingX - penaltyRadius} ${h / 2 + goalW / 2} ` +
        `A ${penaltyRadius} ${penaltyRadius} 0 0 0 ${w - paddingX} ${h / 2 + goalW / 2 + penaltyRadius}`;
      const rightPenalty = new fabric.Path(rightPenaltyPath, lineStyle);
      canvas.add(rightPenalty);

      // Goals
      drawGoalFrame(canvas, paddingX, h / 2, goalW, 20, 'left', lineStyle, netColor, lineColor);
      drawGoalFrame(canvas, w - paddingX, h / 2, goalW, 20, 'right', lineStyle, netColor, lineColor);

      // Penalty spots (6m and 10m)
      const left6mSpot = new fabric.Circle({ left: paddingX + penaltyRadius - 3, top: h / 2 - 3, radius: 3, fill: lineColor, selectable: false, evented: false, isCourtLine: true });
      const right6mSpot = new fabric.Circle({ left: w - paddingX - penaltyRadius - 3, top: h / 2 - 3, radius: 3, fill: lineColor, selectable: false, evented: false, isCourtLine: true });
      
      const doublePenaltyDist = penaltyRadius * 1.67; 
      const left10mSpot = new fabric.Circle({ left: paddingX + doublePenaltyDist - 3, top: h / 2 - 3, radius: 3, fill: lineColor, selectable: false, evented: false, isCourtLine: true });
      const right10mSpot = new fabric.Circle({ left: w - paddingX - doublePenaltyDist - 3, top: h / 2 - 3, radius: 3, fill: lineColor, selectable: false, evented: false, isCourtLine: true });
      canvas.add(left6mSpot, right6mSpot, left10mSpot, right10mSpot);

      // Corner Arcs and Substitution Zones
      drawCornerArcs(canvas, paddingX, paddingY, pitchW, pitchH, lineStyle);
      drawSubstitutionZones(canvas, paddingX, paddingY, pitchW, h, lineColor);

    } else if (type === 'half') {
      const outerRect = new fabric.Rect({
        left: paddingX,
        top: paddingY,
        width: pitchW,
        height: pitchH,
        ...lineStyle,
      });
      canvas.add(outerRect);

      // Center Circle Arc on the right border
      const centerCircleRadius = pitchH * 0.28;
      const centerCirclePath = `M ${w - paddingX} ${h / 2 - centerCircleRadius} ` +
        `A ${centerCircleRadius} ${centerCircleRadius} 0 0 0 ${w - paddingX} ${h / 2 + centerCircleRadius}`;
      const centerCircle = new fabric.Path(centerCirclePath, lineStyle);
      canvas.add(centerCircle);

      const centerSpot = new fabric.Circle({
        left: w - paddingX - 4,
        top: h / 2 - 4,
        radius: 4,
        fill: lineColor,
        selectable: false,
        evented: false,
        isCourtLine: true,
      });
      canvas.add(centerSpot);

      // Left Penalty Area
      const leftPenaltyPath = `M ${paddingX} ${h / 2 - goalW / 2 - penaltyRadius} ` +
        `A ${penaltyRadius} ${penaltyRadius} 0 0 1 ${paddingX + penaltyRadius} ${h / 2 - goalW / 2} ` +
        `L ${paddingX + penaltyRadius} ${h / 2 + goalW / 2} ` +
        `A ${penaltyRadius} ${penaltyRadius} 0 0 1 ${paddingX} ${h / 2 + goalW / 2 + penaltyRadius}`;
      const leftPenalty = new fabric.Path(leftPenaltyPath, lineStyle);
      canvas.add(leftPenalty);

      // Left Goal
      drawGoalFrame(canvas, paddingX, h / 2, goalW, 20, 'left', lineStyle, netColor, lineColor);

      // Spots (relative to half pitch length)
      const m6Spot = new fabric.Circle({ left: paddingX + pitchW * 0.3 - 3, top: h / 2 - 3, radius: 3, fill: lineColor, selectable: false, evented: false, isCourtLine: true });
      const m10Spot = new fabric.Circle({ left: paddingX + pitchW * 0.5 - 3, top: h / 2 - 3, radius: 3, fill: lineColor, selectable: false, evented: false, isCourtLine: true });
      canvas.add(m6Spot, m10Spot);

      // Corner Arcs (Left only)
      const cornerRadius = 15;
      const tlCorner = new fabric.Path(`M ${paddingX + cornerRadius} ${paddingY} A ${cornerRadius} ${cornerRadius} 0 0 1 ${paddingX} ${paddingY + cornerRadius}`, lineStyle);
      const blCorner = new fabric.Path(`M ${paddingX} ${h - paddingY - cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 1 ${paddingX + cornerRadius} ${h - paddingY}`, lineStyle);
      canvas.add(tlCorner, blCorner);

    } else if (type === 'third') {
      const outerRect = new fabric.Rect({
        left: paddingX,
        top: paddingY,
        width: pitchW,
        height: pitchH,
        ...lineStyle,
      });
      canvas.add(outerRect);

      // Zoomed Penalty Area
      const zoomedGoalW = pitchH * 0.28;
      const zoomedPenaltyRadius = zoomedGoalW * 1.5;

      const leftPenaltyPath = `M ${paddingX} ${h / 2 - zoomedGoalW / 2 - zoomedPenaltyRadius} ` +
        `A ${zoomedPenaltyRadius} ${zoomedPenaltyRadius} 0 0 1 ${paddingX + zoomedPenaltyRadius} ${h / 2 - zoomedGoalW / 2} ` +
        `L ${paddingX + zoomedPenaltyRadius} ${h / 2 + zoomedGoalW / 2} ` +
        `A ${zoomedPenaltyRadius} ${zoomedPenaltyRadius} 0 0 1 ${paddingX} ${h / 2 + zoomedGoalW / 2 + zoomedPenaltyRadius}`;
      const leftPenalty = new fabric.Path(leftPenaltyPath, lineStyle);
      canvas.add(leftPenalty);

      // Left Goal
      drawGoalFrame(canvas, paddingX, h / 2, zoomedGoalW, 25, 'left', lineStyle, netColor, lineColor);

      // Spots
      const m6Spot = new fabric.Circle({ left: paddingX + pitchW * 0.4 - 3, top: h / 2 - 3, radius: 3, fill: lineColor, selectable: false, evented: false, isCourtLine: true });
      const m10Spot = new fabric.Circle({ left: paddingX + pitchW * 0.66 - 3, top: h / 2 - 3, radius: 3, fill: lineColor, selectable: false, evented: false, isCourtLine: true });
      canvas.add(m6Spot, m10Spot);

      // Corner Arcs (Left only)
      const cornerRadius = 15;
      const tlCorner = new fabric.Path(`M ${paddingX + cornerRadius} ${paddingY} A ${cornerRadius} ${cornerRadius} 0 0 1 ${paddingX} ${paddingY + cornerRadius}`, lineStyle);
      const blCorner = new fabric.Path(`M ${paddingX} ${h - paddingY - cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 1 ${paddingX + cornerRadius} ${h - paddingY}`, lineStyle);
      canvas.add(tlCorner, blCorner);
    }

    canvas.renderAll();
  };

  const drawGoalFrame = (
    canvas: fabric.Canvas,
    goalLineX: number,
    centerY: number,
    goalW: number,
    goalDepth: number,
    side: 'left' | 'right',
    lineStyle: any,
    netColor: string,
    lineColor: string
  ) => {
    const isLeft = side === 'left';
    const direction = isLeft ? -1 : 1;
    const goalX = goalLineX + direction * goalDepth;

    const goalBack = new fabric.Line([goalX, centerY - goalW / 2, goalX, centerY + goalW / 2], lineStyle);
    const goalTop = new fabric.Line([goalLineX, centerY - goalW / 2, goalX, centerY - goalW / 2], lineStyle);
    const goalBottom = new fabric.Line([goalLineX, centerY + goalW / 2, goalX, centerY + goalW / 2], lineStyle);
    canvas.add(goalBack, goalTop, goalBottom);

    const netLines: fabric.Line[] = [];
    for (let offset = -goalW / 2; offset <= goalW / 2; offset += 10) {
      netLines.push(
        new fabric.Line([goalLineX, centerY + offset, goalX, centerY + offset + 5], {
          stroke: netColor,
          strokeWidth: 1,
          selectable: false,
          evented: false,
          isCourtLine: true,
        })
      );
      netLines.push(
        new fabric.Line([goalLineX, centerY + offset, goalX, centerY + offset - 5], {
          stroke: netColor,
          strokeWidth: 1,
          selectable: false,
          evented: false,
          isCourtLine: true,
        })
      );
    }
    canvas.add(...netLines);

    // Goalposts (white & red stripes)
    const postStyle = {
      radius: 4,
      fill: "#ffffff",
      stroke: "#ef4444",
      strokeWidth: 1.5,
      selectable: false,
      evented: false,
      isCourtLine: true,
      originX: 'center' as const,
      originY: 'center' as const,
    };

    const post1 = new fabric.Circle({ left: goalLineX, top: centerY - goalW / 2, ...postStyle });
    const post2 = new fabric.Circle({ left: goalLineX, top: centerY + goalW / 2, ...postStyle });
    canvas.add(post1, post2);
  };

  const drawCornerArcs = (
    canvas: fabric.Canvas,
    paddingX: number,
    paddingY: number,
    pitchW: number,
    pitchH: number,
    lineStyle: any
  ) => {
    const cornerRadius = 15;
    const w = paddingX * 2 + pitchW;
    const h = paddingY * 2 + pitchH;

    const tlCorner = new fabric.Path(`M ${paddingX + cornerRadius} ${paddingY} A ${cornerRadius} ${cornerRadius} 0 0 1 ${paddingX} ${paddingY + cornerRadius}`, lineStyle);
    const blCorner = new fabric.Path(`M ${paddingX} ${h - paddingY - cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 1 ${paddingX + cornerRadius} ${h - paddingY}`, lineStyle);
    const trCorner = new fabric.Path(`M ${w - paddingX} ${paddingY + cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 1 ${w - paddingX - cornerRadius} ${paddingY}`, lineStyle);
    const brCorner = new fabric.Path(`M ${w - paddingX - cornerRadius} ${h - paddingY} A ${cornerRadius} ${cornerRadius} 0 0 1 ${w - paddingX} ${h - paddingY - cornerRadius}`, lineStyle);
    canvas.add(tlCorner, blCorner, trCorner, brCorner);
  };

  const drawSubstitutionZones = (
    canvas: fabric.Canvas,
    paddingX: number,
    paddingY: number,
    pitchW: number,
    h: number,
    lineColor: string
  ) => {
    const tickLen = 6;
    const subZoneOffset1 = pitchW * 0.125;
    const subZoneOffset2 = pitchW * 0.25;
    const w = paddingX * 2 + pitchW;

    const ticks: [number, number, number, number][] = [
      [w / 2 - subZoneOffset2, h - paddingY - tickLen, w / 2 - subZoneOffset2, h - paddingY + tickLen],
      [w / 2 - subZoneOffset1, h - paddingY - tickLen, w / 2 - subZoneOffset1, h - paddingY + tickLen],
      [w / 2 + subZoneOffset1, h - paddingY - tickLen, w / 2 + subZoneOffset1, h - paddingY + tickLen],
      [w / 2 + subZoneOffset2, h - paddingY - tickLen, w / 2 + subZoneOffset2, h - paddingY + tickLen],
    ];

    ticks.forEach((t) => {
      const tickLine = new fabric.Line(t, {
        stroke: lineColor,
        strokeWidth: 2,
        selectable: false,
        evented: false,
        isCourtLine: true,
      });
      canvas.add(tickLine);
    });
  };

  // Add Elements Functions
  const addPlayer = (team: "A" | "B" | "neutral" | "gk", number: string) => {
    if (!fabricCanvasRef.current) return;
    
    let color = "#dc2626"; // Red (Team A)
    if (team === "B") color = "#2563eb"; // Blue (Team B)
    if (team === "neutral") color = "#eab308"; // Yellow (Comodín)
    if (team === "gk") color = "#16a34a"; // Green (Goalkeeper)

    const circle = new fabric.Circle({
      radius: 16,
      fill: color,
      stroke: "#ffffff",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
    });

    // Triangle facing notch (pointing UP by default)
    const notch = new fabric.Triangle({
      left: 0,
      top: -16,
      width: 8,
      height: 8,
      fill: "#ffffff",
      originX: "center",
      originY: "center",
    });

    const text = new fabric.Textbox(number, {
      fontSize: 14,
      fill: team === "neutral" ? "#000000" : "#ffffff",
      fontWeight: "bold",
      originX: "center",
      originY: "center",
      textAlign: "center",
    });

    const group = new fabric.Group([circle, notch, text], {
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
      hasControls: true,
      hasBorders: true,
      lockScalingX: true,
      lockScalingY: true,
    });

    (group as any).isPlayer = true;
    (group as any).team = team;
    (group as any).number = number;

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  };

  const addCone = (color: string = "#ea580c") => {
    if (!fabricCanvasRef.current) return;
    
    const base = new fabric.Rect({
      left: 0,
      top: 10,
      width: 24,
      height: 4,
      fill: color,
      originX: "center",
      originY: "center",
    });
    
    const body = new fabric.Triangle({
      left: 0,
      top: -3,
      width: 18,
      height: 22,
      fill: color,
      stroke: "#ffffff",
      strokeWidth: 1,
      originX: "center",
      originY: "center",
    });

    const group = new fabric.Group([base, body], {
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
    });
    (group as any).isEquipment = true;

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  };

  const addChino = (color: string = "#eab308") => {
    if (!fabricCanvasRef.current) return;
    
    const dome = new fabric.Ellipse({
      left: 0,
      top: 0,
      rx: 14,
      ry: 7,
      fill: color,
      stroke: "#ffffff",
      strokeWidth: 1,
      originX: "center",
      originY: "center",
    });

    const topCutout = new fabric.Ellipse({
      left: 0,
      top: -2,
      rx: 4,
      ry: 2,
      fill: "#1e3a8a",
      opacity: 0.7,
      originX: "center",
      originY: "center",
    });

    const group = new fabric.Group([dome, topCutout], {
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
    });
    (group as any).isEquipment = true;

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  };

  const addValla = (color: string = "#ca8a04") => {
    if (!fabricCanvasRef.current) return;

    const bar = new fabric.Rect({
      left: 0,
      top: 0,
      width: 50,
      height: 3,
      fill: color,
      originX: "center",
      originY: "center",
    });

    const leftLeg = new fabric.Rect({
      left: -24,
      top: 8,
      width: 3,
      height: 16,
      fill: color,
      originX: "center",
      originY: "center",
    });

    const rightLeg = new fabric.Rect({
      left: 24,
      top: 8,
      width: 3,
      height: 16,
      fill: color,
      originX: "center",
      originY: "center",
    });

    const group = new fabric.Group([bar, leftLeg, rightLeg], {
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
    });
    (group as any).isEquipment = true;

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  };

  const addEscalera = () => {
    if (!fabricCanvasRef.current) return;

    const objects: fabric.Object[] = [];
    const rungs = 6;
    const boxSize = 25;
    const ladderW = 35;
    const totalLength = (rungs - 1) * boxSize;

    objects.push(new fabric.Line([-ladderW/2, -totalLength/2, -ladderW/2, totalLength/2], { stroke: "#ca8a04", strokeWidth: 3 }));
    objects.push(new fabric.Line([ladderW/2, -totalLength/2, ladderW/2, totalLength/2], { stroke: "#ca8a04", strokeWidth: 3 }));

    for (let i = 0; i < rungs; i++) {
      const y = -totalLength/2 + i * boxSize;
      objects.push(new fabric.Line([-ladderW/2, y, ladderW/2, y], { stroke: "#ca8a04", strokeWidth: 2.5 }));
    }

    const group = new fabric.Group(objects, {
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
    });
    (group as any).isEquipment = true;

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  };

  const addAro = (color: string = "#ef4444") => {
    if (!fabricCanvasRef.current) return;

    const aro = new fabric.Circle({
      radius: 18,
      fill: "transparent",
      stroke: color,
      strokeWidth: 3,
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
    });
    (aro as any).isEquipment = true;

    fabricCanvasRef.current.add(aro);
    fabricCanvasRef.current.setActiveObject(aro);
    fabricCanvasRef.current.renderAll();
  };

  const addPica = (color: string = "#ca8a04") => {
    if (!fabricCanvasRef.current) return;

    const pica = new fabric.Line([0, -25, 0, 25], {
      stroke: color,
      strokeWidth: 5,
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
    });
    (pica as any).isEquipment = true;

    fabricCanvasRef.current.add(pica);
    fabricCanvasRef.current.setActiveObject(pica);
    fabricCanvasRef.current.renderAll();
  };

  const addDummy = () => {
    if (!fabricCanvasRef.current) return;

    const head = new fabric.Circle({
      radius: 6,
      fill: "#e2e8f0",
      stroke: "#475569",
      strokeWidth: 1.5,
      top: -16,
      originX: "center",
      originY: "center",
    });

    const torso = new fabric.Rect({
      width: 14,
      height: 20,
      fill: "#64748b",
      stroke: "#475569",
      strokeWidth: 1.5,
      top: -4,
      originX: "center",
      originY: "center",
    });

    const shoulders = new fabric.Rect({
      width: 20,
      height: 4,
      fill: "#475569",
      top: -12,
      originX: "center",
      originY: "center",
    });

    const baseStick = new fabric.Line([0, 10, 0, 24], {
      stroke: "#475569",
      strokeWidth: 3,
    });

    const group = new fabric.Group([torso, head, shoulders, baseStick], {
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
    });
    (group as any).isEquipment = true;

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  };

  const addBall = () => {
    if (!fabricCanvasRef.current) return;

    const base = new fabric.Circle({
      radius: 8,
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 1.5,
      originX: "center",
      originY: "center",
    });

    const path = new fabric.Path("M 0 -4 L 3 -1 L 2 3 L -2 3 L -3 -1 Z", {
      fill: "#1e293b",
      originX: "center",
      originY: "center",
    });

    const line1 = new fabric.Line([0, -4, 0, -8], { stroke: "#000000", strokeWidth: 1 });
    const line2 = new fabric.Line([3, -1, 7, -3], { stroke: "#000000", strokeWidth: 1 });
    const line3 = new fabric.Line([2, 3, 5, 6], { stroke: "#000000", strokeWidth: 1 });
    const line4 = new fabric.Line([-2, 3, -5, 6], { stroke: "#000000", strokeWidth: 1 });
    const line5 = new fabric.Line([-3, -1, -7, -3], { stroke: "#000000", strokeWidth: 1 });

    const group = new fabric.Group([base, path, line1, line2, line3, line4, line5], {
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
    });
    (group as any).isEquipment = true;

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  };

  const addMiniGoal = () => {
    if (!fabricCanvasRef.current) return;

    const frame = new fabric.Rect({
      width: 40,
      height: 18,
      fill: "transparent",
      stroke: "#ffffff",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
    });

    const backBar = new fabric.Line([-20, -9, 20, -9], {
      stroke: "#94a3b8",
      strokeWidth: 1.5,
    });

    const netLines: fabric.Line[] = [];
    for (let x = -15; x <= 15; x += 10) {
      netLines.push(new fabric.Line([x, -9, x, 9], { stroke: "rgba(255, 255, 255, 0.4)", strokeWidth: 0.8 }));
    }

    const group = new fabric.Group([frame, backBar, ...netLines], {
      left: 150 + Math.random() * 100,
      top: 150 + Math.random() * 100,
      originX: "center",
      originY: "center",
    });
    (group as any).isEquipment = true;

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  };

  const handlePlayerNumberChange = (num: string) => {
    setSelectedPlayerNumber(num);
    if (selectedPlayer) {
      const textObj = selectedPlayer.item(2) as fabric.Textbox;
      if (textObj) {
        textObj.set({ text: num });
        selectedPlayer.set("number", num);
        fabricCanvasRef.current?.renderAll();
      }
    }
  };

  const handlePlayerTeamChange = (team: "A" | "B" | "neutral" | "gk") => {
    if (selectedPlayer) {
      const circleObj = selectedPlayer.item(0) as fabric.Circle;
      const textObj = selectedPlayer.item(2) as fabric.Textbox;
      
      let color = "#dc2626";
      if (team === "B") color = "#2563eb";
      if (team === "neutral") color = "#eab308";
      if (team === "gk") color = "#16a34a";

      if (circleObj) {
        circleObj.set({ fill: color });
      }
      if (textObj) {
        textObj.set({ fill: team === "neutral" ? "#000000" : "#ffffff" });
      }
      selectedPlayer.set("team", team);
      fabricCanvasRef.current?.renderAll();
      setSelectedPlayer(selectedPlayer);
    }
  };

  // Canvas Actions
  const clearBoard = () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    canvas.clear();
    drawFutsalCourt(canvas, canvas.getWidth(), canvas.getHeight(), pitchType, pitchStyle);
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
        
        {/* Left Sidebar: Tool Palette (Camelot Style) */}
        <div className="w-full lg:w-80 bg-zinc-950 p-4 border border-zinc-800 rounded-xl shadow-2xl flex flex-col gap-4">
          
          {/* Tabs header */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveSidebarTab('pista')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'pista' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Pista
            </button>
            <button
              onClick={() => setActiveSidebarTab('dibujo')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'dibujo' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Dibujo
            </button>
            <button
              onClick={() => setActiveSidebarTab('elementos')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'elementos' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Materiales
            </button>
          </div>

          {/* Tab 1: Pista Settings */}
          {activeTab === 'pista' && (
            <div className="flex flex-col gap-4 py-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Tipo de Pista</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setPitchType('full')}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border text-left transition ${
                      pitchType === 'full' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    ⚽ Campo Completo
                  </button>
                  <button
                    onClick={() => setPitchType('half')}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border text-left transition ${
                      pitchType === 'half' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    🥅 Medio Campo
                  </button>
                  <button
                    onClick={() => setPitchType('third')}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border text-left transition ${
                      pitchType === 'third' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    🎯 Área de Portería
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Fondo / Textura</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPitchStyle('parquet')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      pitchStyle === 'parquet' ? 'bg-amber-950/40 border-amber-500 text-amber-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    🪵 Parquet Madera
                  </button>
                  <button
                    onClick={() => setPitchStyle('blue')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      pitchStyle === 'blue' ? 'bg-blue-950/40 border-blue-500 text-blue-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    🔵 LNFS Azul
                  </button>
                  <button
                    onClick={() => setPitchStyle('green')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      pitchStyle === 'green' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    🟢 Pista Verde
                  </button>
                  <button
                    onClick={() => setPitchStyle('white')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      pitchStyle === 'white' ? 'bg-zinc-100 border-zinc-300 text-zinc-900 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    ⚪ Blanco Alta Vis
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Herramientas de Dibujo */}
          {activeTab === 'dibujo' && (
            <div className="flex flex-col gap-4 py-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Trazo de Línea</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTool('select')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      activeTool === 'select' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    🖐️ Mover / Selecc.
                  </button>
                  <button
                    onClick={() => setActiveTool('carrera')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      activeTool === 'carrera' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    ➡️ Carrera (Sólida)
                  </button>
                  <button
                    onClick={() => setActiveTool('pase')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      activeTool === 'pase' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    --&gt; Pase (Discont.)
                  </button>
                  <button
                    onClick={() => setActiveTool('conduccion')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      activeTool === 'conduccion' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    〰️ Conducción (Ondul.)
                  </button>
                  <button
                    onClick={() => setActiveTool('tiro')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      activeTool === 'tiro' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    🔥 Tiro (Grueso/Rojo)
                  </button>
                  <button
                    onClick={() => setActiveTool('freehand')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition ${
                      activeTool === 'freehand' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    ✏️ Dibujo Libre
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Color de Dibujo</label>
                <div className="flex gap-2 justify-between">
                  {["#ffffff", "#000000", "#ef4444", "#3b82f6", "#eab308"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setActiveColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        activeColor === color ? 'border-emerald-400 scale-110 shadow-lg' : 'border-zinc-800 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Materiales / Elementos */}
          {activeTab === 'elementos' && (
            <div className="flex flex-col gap-4 py-2 overflow-y-auto max-h-[350px] pr-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">+ Añadir Jugador</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addPlayer("A", "1")}
                    className="py-1.5 px-2 bg-red-700 hover:bg-red-655 text-white text-xs font-bold rounded-lg transition"
                  >
                    🔴 Rojo (Local)
                  </button>
                  <button
                    onClick={() => addPlayer("B", "1")}
                    className="py-1.5 px-2 bg-blue-700 hover:bg-blue-655 text-white text-xs font-bold rounded-lg transition"
                  >
                    🔵 Azul (Visitante)
                  </button>
                  <button
                    onClick={() => addPlayer("neutral", "C")}
                    className="py-1.5 px-2 bg-yellow-555 hover:bg-yellow-500 text-zinc-950 text-xs font-bold rounded-lg transition"
                  >
                    🟡 Comodín
                  </button>
                  <button
                    onClick={() => addPlayer("gk", "1")}
                    className="py-1.5 px-2 bg-green-700 hover:bg-green-655 text-white text-xs font-bold rounded-lg transition"
                  >
                    🟢 Portero
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">+ Material de Entrenamiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addBall()}
                    className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition"
                  >
                    ⚽ Balón Oficial
                  </button>
                  <button
                    onClick={() => addCone("#ea580c")}
                    className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition"
                  >
                    🔶 Cono Naranja
                  </button>
                  <button
                    onClick={() => addChino("#eab308")}
                    className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition"
                  >
                    🥏 Chinito Amarillo
                  </button>
                  <button
                    onClick={() => addValla("#ca8a04")}
                    className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition"
                  >
                    🚧 Valla Agilidad
                  </button>
                  <button
                    onClick={() => addEscalera()}
                    className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition"
                  >
                    🪜 Escalera Coord.
                  </button>
                  <button
                    onClick={() => addAro("#ef4444")}
                    className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition"
                  >
                    ⭕ Aro Psicomot.
                  </button>
                  <button
                    onClick={() => addPica("#ca8a04")}
                    className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition"
                  >
                    📍 Pica Vertical
                  </button>
                  <button
                    onClick={() => addDummy()}
                    className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition"
                  >
                    👤 Barrera / Silueta
                  </button>
                  <button
                    onClick={() => addMiniGoal()}
                    className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition col-span-2"
                  >
                    🥅 Portería Pequeña (Mini-Goal)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Selection Properties Editor */}
          {selectedPlayer && (
            <div className="mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Editar Jugador Seleccionado</span>
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">Dorsal / Texto</label>
                <input
                  type="text"
                  maxLength={4}
                  value={selectedPlayerNumber}
                  onChange={(e) => handlePlayerNumberChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-1.5 text-xs outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">Color / Equipo</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePlayerTeamChange("A")}
                    className="flex-1 py-1 px-1.5 bg-red-700 rounded text-[10px] font-bold text-white hover:bg-red-600"
                  >
                    Rojo
                  </button>
                  <button
                    onClick={() => handlePlayerTeamChange("B")}
                    className="flex-1 py-1 px-1.5 bg-blue-700 rounded text-[10px] font-bold text-white hover:bg-blue-600"
                  >
                    Azul
                  </button>
                  <button
                    onClick={() => handlePlayerTeamChange("neutral")}
                    className="flex-1 py-1 px-1.5 bg-yellow-500 rounded text-[10px] font-bold text-zinc-950 hover:bg-yellow-400"
                  >
                    Comodín
                  </button>
                  <button
                    onClick={() => handlePlayerTeamChange("gk")}
                    className="flex-1 py-1 px-1.5 bg-green-700 rounded text-[10px] font-bold text-white hover:bg-green-600"
                  >
                    GK
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Center: Canvas Workspace Area */}
        <div className="flex-1 bg-zinc-950 p-4 border border-zinc-800 rounded-xl shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-bold text-zinc-100">Lienzo Táctico</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearBoard}
                className="px-3 py-1.5 text-xs font-semibold border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition"
              >
                Limpiar Todo
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1.5 text-xs font-semibold bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/60 transition"
              >
                Eliminar Selección
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative w-full rounded-lg overflow-hidden border border-zinc-700 mx-auto"
            style={
              pitchStyle === "parquet"
                ? {
                    backgroundImage: "url('/parquet.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
                : {
                    backgroundColor:
                      pitchStyle === "blue"
                        ? "#1b3a60"
                        : pitchStyle === "green"
                        ? "#155e37"
                        : "#ffffff",
                  }
            }
          >
            <canvas ref={canvasRef} className="block w-full" />
          </div>

          {/* Quick status bar showing the active tool */}
          <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-900 pt-2">
            <span>
              Pista: <strong className="text-zinc-300 capitalize">{pitchType} Court</strong> ({pitchStyle})
            </span>
            <span>
              Herramienta Activa:{" "}
              <strong className="text-emerald-400 uppercase tracking-wider">
                {activeTool === "select" ? "Mover Selección" : activeTool}
              </strong>
            </span>
          </div>
        </div>

        {/* Right Sidebar: saved exercises & active folders */}
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
                <p className="text-xs text-zinc-650 text-center my-auto">Sin ejercicios en esta carpeta.</p>
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
