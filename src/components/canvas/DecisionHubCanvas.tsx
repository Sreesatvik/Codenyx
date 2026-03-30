"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { useSimulationStore } from "@/store/simulationStore";

export default function DecisionHubCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  // Re-render map when store coordinates/nodes update
  const mapNodes = useSimulationStore((state) => state.mapNodes);

  // Initialize Pixi application uniquely on mount
  useEffect(() => {
    if (!containerRef.current) return;
    
    let isMounted = true;
    const app = new PIXI.Application();

    const initCanvas = async () => {
      // Async initialization before attaching
      await app.init({
        resizeTo: containerRef.current!,
        backgroundColor: 0x0f172a, // slate-900
        antialias: true,
      });

      // Handle React StrictMode race condition 
      // where component unmounts before init finishes
      if (!isMounted) {
        app.destroy(true);
        return;
      }

      appRef.current = app;

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(app.canvas);
      }
    };

    initCanvas();

    return () => {
      isMounted = false;
      // Only fire destroy if the canvas was fully initialized and mounted
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, []);

  // Update canvas dynamically when Zustand changes
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    // Clear previous children without tearing down WebGL Context
    app.stage.removeChildren();

    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Inter, Arial',
      fontSize: 24,
      fill: 0x34d399, // emerald-400
    });

    // Demo representation showing integration works
    const initText = new PIXI.Text({ text: `PixiJS Active: Rendered ${mapNodes.length} Node(s)`, style: textStyle });
    initText.x = 20;
    initText.y = 20;
    app.stage.addChild(initText);
    
    console.log("Canvas received mapNodes from Zustand:", mapNodes);
  }, [mapNodes]);

  return (
    <div 
      className="w-full h-[600px] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl relative" 
      ref={containerRef}
    />
  );
}
