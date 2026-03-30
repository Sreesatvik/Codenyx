"use client";

import React from "react";

export interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface AvatarPos {
  x: number;
  y: number;
}

export interface AnimatedMapProps {
  nodes: Node[];
  avatarPos: AvatarPos;
}

export default function AnimatedMap({ nodes, avatarPos }: AnimatedMapProps) {
  const TILE_SIZE = 60;
  const GRID_OFFSET = 400; // Center offset for the 800x800 plane

  // Internal helper to convert grid coords to isometric pixel positions
  const getPos = (gridX: number, gridY: number) => {
    // We map grid coords (0-8) to a pixel space within our 800x800 plane
    // Each grid unit is ~80px
    const scale = 80;
    return {
      x: GRID_OFFSET + (gridX - 4) * scale,
      y: GRID_OFFSET + (gridY - 3) * scale
    };
  };

  const avatarPixelPos = getPos(avatarPos.x, avatarPos.y);

  return (
    <div className="relative w-full h-[400px] bg-[#0B1120] overflow-hidden flex items-center justify-center rounded-xl border border-slate-800 shadow-2xl">
      {/* 
        Main Isometric Canvas 
      */}
      <div 
        className="relative shadow-2xl rounded-sm"
        style={{
          width: '800px',
          height: '800px',
          transform: 'rotateX(60deg) rotateZ(-45deg) scale(0.8)',
          transformStyle: 'preserve-3d',
          backgroundColor: '#0f172a',
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          border: '1px solid rgba(51, 65, 85, 0.5)',
        }}
      >
        {/* Render Sequential Bridges (Visual Flow) */}
        {nodes.slice(1).map((node, i) => {
          const prev = nodes[i];
          const start = getPos(prev.x, prev.y);
          const end = getPos(node.x, node.y);
          
          const isXAxis = node.x !== prev.x;
          const length = 80; // Distance between grid centers
          
          return (
            <div
              key={`bridge-${node.id}`}
              className="absolute bg-gradient-to-r from-indigo-500/60 via-cyan-400/80 to-indigo-500/60 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
              style={{
                left: `${start.x}px`,
                top: `${start.y}px`,
                width: isXAxis ? `${length}px` : '6px',
                height: isXAxis ? '6px' : `${length}px`,
                transform: `translate(${isXAxis ? '0' : '-3px'}, ${isXAxis ? '-3px' : '0'}) translateZ(20px)`,
                transformStyle: 'preserve-3d',
              }}
            />
          );
        })}

        {/* Render Infrastructure Nodes */}
        {nodes.map((node) => {
          const { x, y } = getPos(node.x, node.y);
          return (
            <div
              key={node.id}
              className="absolute group"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                transform: 'translate(-50%, -50%)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Ground Shadow / Glow */}
              <div className="absolute inset-0 bg-indigo-500/20 rounded-lg blur-md" />

              {/* Top Face (Roof) */}
              <div 
                className="absolute inset-0 bg-indigo-600/90 border border-indigo-400 shadow-[inset_0_0_15px_rgba(255,255,255,0.2)] backdrop-blur-md"
                style={{ transform: 'translateZ(40px)' }}
              >
                <div className="absolute inset-2 bg-indigo-300/40 rounded-sm animate-pulse blur-[2px]" />
              </div>

              {/* Side Walls */}
              <div 
                className="absolute bottom-0 left-0 w-full bg-indigo-800 origin-bottom"
                style={{ height: '40px', transform: 'rotateX(-90deg)' }}
              />
              <div 
                className="absolute top-0 right-0 h-full bg-indigo-950 origin-right"
                style={{ width: '40px', transform: 'rotateY(-90deg)' }}
              />

              {/* Node Label */}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                style={{ transform: 'translateZ(90px) rotateZ(45deg) rotateX(-60deg)' }}
              >
                <div className="px-3 py-1 bg-slate-900/90 border border-indigo-500/50 rounded shadow-xl backdrop-blur-md">
                  <span className="text-[9px] font-bold tracking-widest text-indigo-100 uppercase whitespace-nowrap">
                    {node.name}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Animated Avatar */}
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: `${avatarPixelPos.x}px`,
            top: `${avatarPixelPos.y}px`,
            transform: 'translate(-50%, -50%) translateZ(41px)',
            transition: 'top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div 
            className="relative flex items-center justify-center animate-bounce shadow-2xl"
            style={{ transform: 'rotateZ(45deg) rotateX(-60deg) translateY(-14px)' }}
          >
            <div className="relative w-6 h-6 bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] border-2 border-yellow-600 rounded-sm overflow-hidden">
              <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-slate-900 rounded-full" />
              <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-slate-900 rounded-full" />
              <div className="absolute bottom-1.5 left-2 right-2 h-0.5 bg-yellow-700/50 rounded-sm" />
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 blur-sm rounded-full" style={{ transform: 'translateZ(-1px)' }} />
        </div>
      </div>
    </div>
  );
}
