"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ───
type MetricsState = {
  socialImpact: number;
  financialSustainability: number;
  riskExposure: number;
  stakeholderTrust: number;
};

type MapNodeType = "HQ" | "FieldTent" | "TechLab" | "ResearchNode" | "GovLiaison" | "AdBillboard" | "CommunityCenter";

// ─── Node Grid Positions ───
const NODE_POSITIONS: Record<MapNodeType, { col: number; row: number }> = {
  HQ:              { col: 2, row: 2 },
  FieldTent:       { col: 0, row: 1 },
  TechLab:         { col: 4, row: 1 },
  ResearchNode:    { col: 1, row: 3 },
  GovLiaison:      { col: 3, row: 3 },
  AdBillboard:     { col: 4, row: 3 },
  CommunityCenter: { col: 0, row: 3 },
};

// ─── Node Colors ───
const NODE_COLORS: Record<MapNodeType, { top: string; left: string; right: string; accent: string }> = {
  HQ:              { top: "#f59e0b", left: "#d97706", right: "#b45309", accent: "#fbbf24" },
  FieldTent:       { top: "#22c55e", left: "#16a34a", right: "#15803d", accent: "#4ade80" },
  TechLab:         { top: "#a855f7", left: "#9333ea", right: "#7e22ce", accent: "#c084fc" },
  ResearchNode:    { top: "#3b82f6", left: "#2563eb", right: "#1d4ed8", accent: "#60a5fa" },
  GovLiaison:      { top: "#06b6d4", left: "#0891b2", right: "#0e7490", accent: "#22d3ee" },
  AdBillboard:     { top: "#f97316", left: "#ea580c", right: "#c2410c", accent: "#fb923c" },
  CommunityCenter: { top: "#ec4899", left: "#db2777", right: "#be185d", accent: "#f472b6" },
};

const NODE_LABELS: Record<MapNodeType, string> = {
  HQ: "HQ",
  FieldTent: "FIELD\nTENT",
  TechLab: "TECH\nLAB",
  ResearchNode: "RESEARCH",
  GovLiaison: "GOV\nLIAISON",
  AdBillboard: "AD\nBOARD",
  CommunityCenter: "COMMUNITY",
};

// ─── Isometric helpers ───
const TILE_W = 100;
const TILE_H = 50;
const GRID_COLS = 5;
const GRID_ROWS = 5;

function toIso(col: number, row: number, offsetX: number, offsetY: number) {
  return {
    x: offsetX + (col - row) * (TILE_W / 2),
    y: offsetY + (col + row) * (TILE_H / 2),
  };
}

// Format as Indian Rupees 
function formatINR(amount: number): string {
  const str = amount.toString();
  if (str.length <= 3) return "₹" + str;
  let lastThree = str.substring(str.length - 3);
  let rest = str.substring(0, str.length - 3);
  if (rest.length > 0) {
    lastThree = "," + lastThree;
  }
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return "₹" + formatted;
}

// ─── Main Component ───
export default function VidyaSimulation() {
  const [iteration, setIteration] = useState(1);
  const [budget, setBudget] = useState(800000);
  const [metrics, setMetrics] = useState<MetricsState>({
    socialImpact: 50,
    financialSustainability: 50,
    riskExposure: 50,
    stakeholderTrust: 50,
  });
  const [mapNodes, setMapNodes] = useState<MapNodeType[]>(["HQ"]);
  const [choice1, setChoice1] = useState<"A" | "B" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [newNode, setNewNode] = useState<MapNodeType | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clamp = (val: number) => Math.min(100, Math.max(0, val));

  const applyDecision = (
    cost: number,
    shifts: Partial<MetricsState>,
    node: MapNodeType,
    firstChoice?: "A" | "B"
  ) => {
    setIsTransitioning(true);
    setNewNode(node);
    setTimeout(() => {
      setBudget(prev => prev - cost);
      setMetrics(prev => ({
        socialImpact: clamp(prev.socialImpact + (shifts.socialImpact || 0)),
        financialSustainability: clamp(prev.financialSustainability + (shifts.financialSustainability || 0)),
        riskExposure: clamp(prev.riskExposure + (shifts.riskExposure || 0)),
        stakeholderTrust: clamp(prev.stakeholderTrust + (shifts.stakeholderTrust || 0)),
      }));
      setMapNodes(prev => [...prev, node]);
      if (firstChoice) setChoice1(firstChoice);
      setIteration(prev => prev + 1);
      setIsTransitioning(false);
      setNewNode(null);
    }, 600);
  };

  // ─── Canvas Rendering ───
  useEffect(() => {
    if (iteration >= 4) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    // HiDPI scaling
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false; // Pixel art look

    const offsetX = w / 2;
    const offsetY = 40;

    // Draw base grid
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const { x, y } = toIso(col, row, offsetX, offsetY);
        drawIsoDiamond(ctx, x, y, TILE_W, TILE_H, "#1e293b", "#334155", 0.5);
      }
    }

    // Draw nodes
    mapNodes.forEach(nodeType => {
      const pos = NODE_POSITIONS[nodeType];
      if (!pos) return;
      const { x, y } = toIso(pos.col, pos.row, offsetX, offsetY);
      const colors = NODE_COLORS[nodeType];
      const label = NODE_LABELS[nodeType];
      const bh = nodeType === "HQ" ? 40 : nodeType === "TechLab" ? 35 : 25;

      // Base tile highlight
      drawIsoDiamond(ctx, x, y, TILE_W, TILE_H, colors.top, colors.accent, 0.3);

      // Left wall
      ctx.beginPath();
      ctx.moveTo(x, y + TILE_H - bh);
      ctx.lineTo(x - TILE_W / 2, y + TILE_H / 2 - bh);
      ctx.lineTo(x - TILE_W / 2, y + TILE_H / 2);
      ctx.lineTo(x, y + TILE_H);
      ctx.closePath();
      ctx.fillStyle = colors.left;
      ctx.fill();
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Right wall
      ctx.beginPath();
      ctx.moveTo(x, y + TILE_H - bh);
      ctx.lineTo(x + TILE_W / 2, y + TILE_H / 2 - bh);
      ctx.lineTo(x + TILE_W / 2, y + TILE_H / 2);
      ctx.lineTo(x, y + TILE_H);
      ctx.closePath();
      ctx.fillStyle = colors.right;
      ctx.fill();
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Roof
      ctx.beginPath();
      ctx.moveTo(x, y - bh);
      ctx.lineTo(x + TILE_W / 2, y + TILE_H / 2 - bh);
      ctx.lineTo(x, y + TILE_H - bh);
      ctx.lineTo(x - TILE_W / 2, y + TILE_H / 2 - bh);
      ctx.closePath();
      ctx.fillStyle = colors.top;
      ctx.fill();
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Window details (pixel stripes)
      const stripeY = y + TILE_H / 2 - bh / 2;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      for (let s = 0; s < 3; s++) {
        ctx.fillRect(x - 8 + s * 6, stripeY - 2, 4, 4);
      }

      // Label
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      const lines = label.split("\n");
      lines.forEach((line, li) => {
        ctx.fillText(line, x, y - bh - 6 + li * 9);
      });
    });

    // Draw incoming node with glow
    if (newNode && isTransitioning) {
      const pos = NODE_POSITIONS[newNode];
      if (pos) {
        const { x, y } = toIso(pos.col, pos.row, offsetX, offsetY);
        ctx.save();
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 100) * 0.3;
        ctx.shadowColor = NODE_COLORS[newNode].accent;
        ctx.shadowBlur = 20;
        drawIsoDiamond(ctx, x, y, TILE_W, TILE_H, NODE_COLORS[newNode].top, NODE_COLORS[newNode].accent, 0.8);
        ctx.restore();
      }
    }
  }, [mapNodes, iteration, isTransitioning, newNode]);

  function drawIsoDiamond(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    fill: string, stroke: string, alpha: number
  ) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // ─── Iteration Data ───
  const getIterationData = () => {
    if (iteration === 1) {
      return {
        advisor: "You have ₹8,00,000 seed funding but zero ground presence. Decide whether to build a scalable product first or establish deep community ties.",
        optionA: {
          label: "Recruit Field Coordinators",
          cost: 150000,
          action: () => applyDecision(150000, { socialImpact: 15, stakeholderTrust: 20, financialSustainability: -10, riskExposure: -5 }, "FieldTent", "A"),
        },
        optionB: {
          label: "Build Digital Tech Lab",
          cost: 250000,
          action: () => applyDecision(250000, { socialImpact: 10, stakeholderTrust: -5, financialSustainability: -20, riskExposure: 15 }, "TechLab", "B"),
        },
      };
    }
    if (iteration === 2) {
      const advisorText = choice1 === "A"
        ? "The community trusts you, but you lack a scalable product. Consider technology."
        : "You have the tech, but the community is skeptical. You need to bridge the gap.";
      return {
        advisor: advisorText,
        optionA: {
          label: "Launch Baseline Pilot Program",
          cost: 100000,
          action: () => applyDecision(100000, { socialImpact: 10, stakeholderTrust: 10, financialSustainability: -10, riskExposure: -10 }, "ResearchNode"),
        },
        optionB: {
          label: "Pitch Local Government Partnership",
          cost: 50000,
          action: () => applyDecision(50000, { socialImpact: 5, stakeholderTrust: 20, financialSustainability: 15, riskExposure: 20 }, "GovLiaison"),
        },
      };
    }
    if (iteration === 3) {
      return {
        advisor: "⚠️ CRISIS ALERT: A rival NGO just launched a free, low-quality app in your target district. Stakeholders are confused and trust is dropping.",
        optionA: {
          label: "Aggressive Marketing Campaign",
          cost: 200000,
          action: () => applyDecision(200000, { socialImpact: 5, stakeholderTrust: -10, financialSustainability: -25, riskExposure: 15 }, "AdBillboard"),
        },
        optionB: {
          label: "Community Townhall & Transparency",
          cost: 20000,
          action: () => applyDecision(20000, { socialImpact: 0, stakeholderTrust: 25, financialSustainability: -5, riskExposure: -15 }, "CommunityCenter"),
        },
      };
    }
    return null;
  };

  const data = getIterationData();

  // ─── End Screen (Iteration 4) ───
  if (iteration >= 4) {
    const debrief = metrics.stakeholderTrust > metrics.financialSustainability
      ? "You favored relationship-building and community trust over aggressive financial scaling. This created a highly resilient but financially fragile venture."
      : "You prioritized rapid scaling and infrastructure over ground-level trust. You have assets, but your community adoption is at risk.";

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
              Simulation Complete
            </h1>
            <p className="text-slate-400 text-sm">Vidya Connect · Final Assessment</p>
          </div>

          {/* Final Budget */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Remaining Capital</p>
            <p className="text-4xl font-mono font-bold text-emerald-400">{formatINR(budget)}</p>
          </div>

          {/* Final Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <FinalMetric label="Social Impact" value={metrics.socialImpact} color="text-blue-400" barColor="bg-blue-500" />
            <FinalMetric label="Financial Sustainability" value={metrics.financialSustainability} color="text-emerald-400" barColor="bg-emerald-500" />
            <FinalMetric label="Risk Exposure" value={metrics.riskExposure} color="text-red-400" barColor="bg-red-500" />
            <FinalMetric label="Stakeholder Trust" value={metrics.stakeholderTrust} color="text-amber-400" barColor="bg-amber-500" />
          </div>

          {/* Infrastructure Built */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Infrastructure Deployed</p>
            <div className="flex flex-wrap gap-2">
              {mapNodes.map((node, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{
                  backgroundColor: NODE_COLORS[node].right + "30",
                  borderColor: NODE_COLORS[node].accent,
                  color: NODE_COLORS[node].accent,
                }}>
                  {node}
                </span>
              ))}
            </div>
          </div>

          {/* Debrief */}
          <div className="bg-slate-900 border border-cyan-800/40 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-3">📋 Strategic Debrief</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{debrief}</p>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setIteration(1);
              setBudget(800000);
              setMetrics({ socialImpact: 50, financialSustainability: 50, riskExposure: 50, stakeholderTrust: 50 });
              setMapNodes(["HQ"]);
              setChoice1(null);
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl border border-slate-700 transition-colors text-sm"
          >
            Restart Simulation
          </button>
        </div>
      </div>
    );
  }

  // ─── Active Simulation UI ───
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-8 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Vidya Connect Simulation <span className="text-slate-500 font-normal">| Phase {iteration} of 3</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Available Capital</p>
          <p className="text-3xl font-mono font-bold text-emerald-400">{formatINR(budget)}</p>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0">

        {/* Left: Advisor + Metrics */}
        <aside className="w-full lg:w-80 flex-shrink-0 bg-slate-900/60 border-r border-slate-800 p-5 flex flex-col gap-5">

          {/* AI Advisor */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-cyan-900/60 flex items-center justify-center text-cyan-400 text-sm">💡</span>
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Strategic Advisor</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{data?.advisor}</p>
          </div>

          {/* Metrics */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Core Metrics</h2>
            <div className="space-y-4">
              <MetricBar label="Social Impact" value={metrics.socialImpact} color="bg-blue-500" glow="shadow-blue-500/30" />
              <MetricBar label="Financial Sustainability" value={metrics.financialSustainability} color="bg-emerald-500" glow="shadow-emerald-500/30" />
              <MetricBar label="Risk Exposure" value={metrics.riskExposure} color="bg-red-500" glow="shadow-red-500/30" />
              <MetricBar label="Stakeholder Trust" value={metrics.stakeholderTrust} color="bg-amber-500" glow="shadow-amber-500/30" />
            </div>
          </div>

          {/* Built Nodes */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Infrastructure</h2>
            <div className="flex flex-wrap gap-1.5">
              {mapNodes.map((node, i) => (
                <span key={i} className="px-2 py-1 rounded text-xs font-medium border" style={{
                  backgroundColor: NODE_COLORS[node].right + "20",
                  borderColor: NODE_COLORS[node].accent + "60",
                  color: NODE_COLORS[node].accent,
                }}>
                  {node}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Map + Decisions */}
        <main className="flex-1 flex flex-col p-5 gap-5">

          {/* Isometric Venture Map */}
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden relative" style={{ minHeight: 340 }}>
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
              width={800}
              height={340}
            />
            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1">
              {mapNodes.map((node, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: NODE_COLORS[node].top }} />
                  <span className="text-xs text-slate-500">{node}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Panel */}
          {data && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-4 font-semibold">Strategic Decision — Phase {iteration}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DecisionButton
                  label={data.optionA.label}
                  cost={data.optionA.cost}
                  onClick={data.optionA.action}
                  disabled={isTransitioning}
                  colorFrom="from-blue-600"
                  colorTo="to-blue-800"
                  borderColor="border-blue-500/40"
                />
                <DecisionButton
                  label={data.optionB.label}
                  cost={data.optionB.cost}
                  onClick={data.optionB.action}
                  disabled={isTransitioning}
                  colorFrom="from-purple-600"
                  colorTo="to-purple-800"
                  borderColor="border-purple-500/40"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function MetricBar({ label, value, color, glow }: { label: string; value: number; color: string; glow: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className="text-xs font-mono text-slate-400">{value}/100</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${color} shadow-sm ${glow} transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FinalMetric({ label, value, color, barColor }: { label: string; value: number; color: string; barColor: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-2xl font-mono font-bold ${color}`}>{value}</span>
        <span className="text-xs text-slate-600 mb-1">/100</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function DecisionButton({ label, cost, onClick, disabled, colorFrom, colorTo, borderColor }: {
  label: string; cost: number; onClick: () => void; disabled: boolean;
  colorFrom: string; colorTo: string; borderColor: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200
        bg-gradient-to-b ${colorFrom} ${colorTo} ${borderColor}
        hover:scale-[1.03] hover:shadow-lg hover:shadow-slate-900/50
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        active:scale-95
      `}
    >
      <span className="text-base font-semibold text-white text-center">{label}</span>
      <span className="text-sm text-white/70 font-mono">{formatINR(cost)}</span>
    </button>
  );
}
