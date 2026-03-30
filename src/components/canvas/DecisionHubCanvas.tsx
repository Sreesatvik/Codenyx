"use client";

import { useEffect, useRef, useState } from "react";
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
  const pixiRef = useRef<typeof import("pixi.js") | null>(null);
  const [isReady, setIsReady] = useState(false);
  const mapNodes = useSimulationStore((state) => state.mapNodes);

  // Phase 1: Initialize PixiJS once
  useEffect(() => {
    if (!canvasRef.current) return;
    let mounted = true;

    (async () => {
      const PIXI = await import("pixi.js");
      if (!mounted || appRef.current) return;
      pixiRef.current = PIXI;

      const app = new PIXI.Application();
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
      setIsReady(true);
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
    if (!isReady || !appRef.current || !pixiRef.current) return;
    const app = appRef.current;
    const { Graphics, Text, TextStyle, Container } = pixiRef.current;

    const oldChildren = app.stage.removeChildren();
    for (const child of oldChildren) {
      child.destroy({ children: true });
    }

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

        // Always add the base tile to the stage
        app.stage.addChild(tile);

        // Draw 3D Building based on Type and Status
        if (node && node.type !== "EMPTY") {
          const buildingContainer = new Container();
          buildingContainer.eventMode = "static";
          buildingContainer.cursor = "pointer";

          let h = 24;
          if (node.type === "HQ") h = 36;
          else if (node.type === "MARKETING_BILLBOARD") h = 42;
          else if (node.type === "RESEARCH_LAB") h = 28;
          else if (node.type === "COMMUNITY_CENTER") h = 16;
          else if (node.type === "PRODUCTION_FACILITY") h = 20;

          // Status Visual Modifiers
          const isDamaged = node.status === "DAMAGED";
          const isUpgrading = node.status === "UPGRADING";
          const isInactive = node.status === "INACTIVE";

          const faceAlpha = isInactive ? 0.3 : (isUpgrading ? 0.6 : 0.9);
          const roofColor = isDamaged ? 0xff4444 : Math.min(0xffffff, fillColor + 0x222222);
          const rightFaceColor = Math.max(0, fillColor - 0x222222);
          const leftFaceColor = Math.max(0, fillColor - 0x444444);

          // Roof
          const roof = new Graphics();
          roof.poly([
            x, y - h,
            x + TILE_W / 2, y + TILE_H / 2 - h,
            x, y + TILE_H - h,
            x - TILE_W / 2, y + TILE_H / 2 - h,
          ]);
          roof.fill({ color: roofColor, alpha: faceAlpha });
          roof.stroke({ color: isDamaged ? 0xff0000 : borderColor, width: 1 });
          buildingContainer.addChild(roof);

          // Right Wall
          const rightWall = new Graphics();
          rightWall.poly([
            x, y + TILE_H - h,
            x + TILE_W / 2, y + TILE_H / 2 - h,
            x + TILE_W / 2, y + TILE_H / 2,
            x, y + TILE_H,
          ]);
          rightWall.fill({ color: rightFaceColor, alpha: faceAlpha });
          rightWall.stroke({ color: isDamaged ? 0xcc0000 : borderColor, width: 1 });
          buildingContainer.addChild(rightWall);

          // Left Wall
          const leftWall = new Graphics();
          leftWall.poly([
            x, y + TILE_H - h,
            x - TILE_W / 2, y + TILE_H / 2 - h,
            x - TILE_W / 2, y + TILE_H / 2,
            x, y + TILE_H,
          ]);
          leftWall.fill({ color: leftFaceColor, alpha: faceAlpha });
          leftWall.stroke({ color: isDamaged ? 0xaa0000 : borderColor, width: 1 });
          buildingContainer.addChild(leftWall);

          // Draw Scaffolding if UPGRADING
          if (isUpgrading) {
            const scaffold = new Graphics();
            scaffold.poly([x, y - h - 10, x + 5, y - h - 10, x + 5, y, x, y]);
            scaffold.fill({ color: 0xf59e0b, alpha: 0.8 }); 
            buildingContainer.addChild(scaffold);
          }

          // Label
          const labelText = isDamaged ? "DAMAGED" : (isUpgrading ? "BUILDING" : node.type.replace(/_/g, "\n").substring(0, 8));
          const label = new Text({
            text: labelText,
            style: new TextStyle({ fontSize: 7, fill: 0xffffff, align: "center", fontFamily: "monospace" }),
          });
          label.anchor.set(0.5);
          label.x = x;
          label.y = y - h - 12;
          buildingContainer.addChild(label);

          // Interaction animations
          let hoverY = 0;
          let isHovered = false;
          buildingContainer.on("pointerover", () => {
            isHovered = true;
            roof.fill({ color: Math.min(0xffffff, roofColor + 0x222222), alpha: 1 });
          });
          buildingContainer.on("pointerout", () => {
            isHovered = false;
            roof.fill({ color: roofColor, alpha: faceAlpha });
          });

          // Ticker for smooth hovering interaction
          const hoverTicker = () => {
            const targetY = isHovered ? -5 : 0;
            hoverY += (targetY - hoverY) * 0.15;
            buildingContainer.y = hoverY;
          };
          app.ticker.add(hoverTicker);
          buildingContainer.on("destroyed", () => app.ticker.remove(hoverTicker));

          app.stage.addChild(buildingContainer);
        }
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
