"use client";

import { useEffect, useRef } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { MapNode } from "@/lib/contracts/types";

// Isometric tile dimensions
const TILE_W = 80;
const TILE_H = 40;
const GRID_COLS = 9;
const GRID_ROWS = 6;

// Convert grid coords to isometric screen coords
function toIso(col: number, row: number, offsetX: number, offsetY: number) {
  return {
    x: offsetX + (col - row) * (TILE_W / 2),
    y: offsetY + (col + row) * (TILE_H / 2),
  };
}

// Get fill color per node type
function nodeColor(type: MapNode["type"]): number {
  switch (type) {
    case "HQ": return 0xf59e0b;               // Gold
    case "COMMUNITY_CENTER": return 0x3b82f6;  // Blue
    case "RESEARCH_LAB": return 0xa855f7;       // Purple
    case "MARKETING_BILLBOARD": return 0xf97316; // Orange
    case "PRODUCTION_FACILITY": return 0x22c55e; // Green
    default: return 0x1e293b;                   // Dark slate (empty)
  }
}

export default function DecisionHubCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<import("pixi.js").Application | null>(null);
  const mapNodes = useSimulationStore((state) => state.mapNodes);

  // Phase 1: Initialize PixiJS once
  useEffect(() => {
    if (!canvasRef.current) return;
    let mounted = true;

    (async () => {
      const { Application } = await import("pixi.js");
      if (!mounted || appRef.current) return;

      const app = new Application();
      await app.init({
        width: canvasRef.current!.clientWidth || 800,
        height: 340,
        backgroundColor: 0x0f172a,
        antialias: true,
      });

      if (!mounted) {
        app.destroy({ removeView: true });
        return;
      }

      canvasRef.current!.appendChild(app.canvas);
      appRef.current = app;
    })();

    return () => {
      mounted = false;
      if (appRef.current) {
        appRef.current.destroy({ removeView: true });
        appRef.current = null;
      }
    };
  }, []);

  // Phase 2: Re-render tiles whenever mapNodes changes
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    const { Graphics, Text, TextStyle } = require("pixi.js");

    app.stage.removeChildren();

    const offsetX = (app.screen.width / 2);
    const offsetY = 60;

    // Draw base isometric grid
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const { x, y } = toIso(col, row, offsetX, offsetY);

        // Find if there's a node at this grid position
        const node = mapNodes.find(n => Math.round(n.x) === col && Math.round(n.y) === row);
        const fillColor = node ? nodeColor(node.type) : 0x1e293b;
        const borderColor = node ? 0xffffff : 0x334155;
        const alpha = node ? 1 : 0.6;

        const tile = new Graphics();
        tile.poly([
          x, y,
          x + TILE_W / 2, y + TILE_H / 2,
          x, y + TILE_H,
          x - TILE_W / 2, y + TILE_H / 2,
        ]);
        tile.fill({ color: fillColor, alpha });
        tile.stroke({ color: borderColor, width: 1, alpha: 0.8 });

        // Draw top face for occupied nodes (3D effect)
        if (node && node.type !== "EMPTY") {
          const top = new Graphics();
          const h = 24; // building height
          top.poly([
            x, y - h,
            x + TILE_W / 2, y + TILE_H / 2 - h,
            x + TILE_W / 2, y + TILE_H / 2,
            x, y,
          ]);
          const faceColor = Math.max(0, fillColor - 0x222222);
          top.fill({ color: faceColor, alpha: 0.9 });
          top.stroke({ color: borderColor, width: 1 });
          app.stage.addChild(top);

          const right = new Graphics();
          right.poly([
            x, y - h,
            x - TILE_W / 2, y + TILE_H / 2 - h,
            x - TILE_W / 2, y + TILE_H / 2,
            x, y,
          ]);
          right.fill({ color: Math.max(0, fillColor - 0x444444), alpha: 0.9 });
          right.stroke({ color: borderColor, width: 1 });
          app.stage.addChild(right);

          // Label
          const label = new Text({
            text: node.type.replace(/_/g, "\n").substring(0, 8),
            style: new TextStyle({ fontSize: 7, fill: 0xffffff, align: "center", fontFamily: "monospace" }),
          });
          label.anchor.set(0.5);
          label.x = x;
          label.y = y - h - 10;
          app.stage.addChild(label);
        }

        app.stage.addChild(tile);
      }
    }

    // Legend
    const types: Array<{ type: MapNode["type"]; label: string }> = [
      { type: "HQ", label: "HQ" },
      { type: "COMMUNITY_CENTER", label: "Community" },
      { type: "RESEARCH_LAB", label: "R&D Lab" },
      { type: "MARKETING_BILLBOARD", label: "Marketing" },
      { type: "PRODUCTION_FACILITY", label: "Production" },
    ];

    types.forEach((item, i) => {
      const dot = new Graphics();
      dot.rect(12, 290 + i * 14, 10, 10);
      dot.fill({ color: nodeColor(item.type) });
      app.stage.addChild(dot);

      const lbl = new Text({
        text: item.label,
        style: new TextStyle({ fontSize: 9, fill: 0x94a3b8, fontFamily: "sans-serif" }),
      });
      lbl.x = 28;
      lbl.y = 290 + i * 14;
      app.stage.addChild(lbl);
    });

  }, [mapNodes]);

  return (
    <div
      ref={canvasRef}
      className="w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
      style={{ height: "340px" }}
    />
  );
}
