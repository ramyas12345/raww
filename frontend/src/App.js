import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  LayoutGrid, History, Zap, Fingerprint, Activity, Microscope, X, Table as TableIcon,
  Download, Share2, Clock, CheckCircle, Target, ArrowRight, RotateCcw, Trash2,
  FileText, HelpCircle, Upload
} from 'lucide-react';

const glowKeyframes = `
  @keyframes pulse-red {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.5); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 0.2); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 0.5); }
  }
  .glow-cell { animation: pulse-red 2s infinite; }
  select option { background-color: #111 !important; color: white !important; }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .card-in { animation: cardIn 0.3s ease forwards; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fu1 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.0s  both; }
  .fu2 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.18s both; }
  .fu3 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.34s both; }
  .fu4 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.5s  both; }
  .fu5 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.65s both; }

  /* ── drifting dot grid ── */
  @keyframes gridDrift {
    0%   { transform: translate(0px, 0px); }
    100% { transform: translate(40px, 40px); }
  }
  .intro-grid {
    position: absolute; inset: -60px; pointer-events: none;
    background-image: radial-gradient(circle, rgba(59,130,246,0.18) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridDrift 14s linear infinite;
  }

  /* ── floating orbs ── */
  @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.15} 50%{transform:translate(40px,-32px) scale(1.08);opacity:.25} }
  @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.10} 50%{transform:translate(-30px,40px) scale(1.05);opacity:.18} }
  @keyframes orb3 { 0%,100%{transform:translate(0,0);opacity:.07} 50%{transform:translate(20px,24px);opacity:.14} }
  .orb1 { animation: orb1 12s ease-in-out infinite; }
  .orb2 { animation: orb2 16s ease-in-out infinite; }
  .orb3 { animation: orb3  9s ease-in-out infinite; }

  /* ── horizontal scan line ── */
  @keyframes scan {
    0%   { top:-2px; opacity:.6; }
    100% { top:108%; opacity:0; }
  }
  .scan-line {
    position:absolute; left:0; right:0; height:2px; pointer-events:none;
    background: linear-gradient(90deg, transparent 0%, rgba(59,130,246,.7) 40%, rgba(139,92,246,.7) 60%, transparent 100%);
    animation: scan 5s linear infinite;
  }

  /* ── blink dot ── */
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .blink { animation: blink 1.1s step-end infinite; }

  /* ── subtle noise on dark bg ── */
  .noise-overlay {
    position:absolute; inset:0; pointer-events:none; z-index:1;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 256px 256px;
  }

  /* ── promo title shimmer ── */
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .title-shimmer {
    background: linear-gradient(90deg, #fff 30%, #3b82f6 50%, #fff 70%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 6s linear infinite;
  }

  /* ── onboard upload pulse ring ── */
  @keyframes ringPulse {
    0%   { transform: scale(1);   opacity: .35; }
    100% { transform: scale(1.55); opacity: 0;  }
  }
  .ring-pulse::before, .ring-pulse::after {
    content:''; position:absolute; inset:-12px;
    border-radius: 50%; border: 1px solid rgba(59,130,246,.4);
    animation: ringPulse 2.4s ease-out infinite;
  }
  .ring-pulse::after { animation-delay: 1.2s; }

  /* ── counter tick ── */
  @keyframes countUp {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .count-in { animation: countUp 0.4s ease both; }
`;

const CHART_TYPES = [
  { id: 'scatter',   label: 'Scatter Plot',   emoji: '⚡' },
  { id: 'bar',       label: 'Bar Chart',      emoji: '📊' },
  { id: 'line',      label: 'Line Graph',     emoji: '📈' },
  { id: 'area',      label: 'Area Chart',     emoji: '🌊' },
  { id: 'histogram', label: 'Histogram',      emoji: '🔢' },
  { id: 'pie',       label: 'Pie Chart',      emoji: '🥧' },
  { id: 'radar',     label: 'Radar Chart',    emoji: '🕸️' },
  { id: 'donut',     label: 'Donut Chart',    emoji: '🍩' },
  { id: 'stacked',   label: 'Stacked Bar',    emoji: '🗂️' },
  { id: 'stepped',   label: 'Step Line',      emoji: '🪜' },
];

const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#6366f1'];

// ─── HELP FLASHCARD ───────────────────────────────────────────────────────────
const HelpCard = ({ onClose, title, sections }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
    <div className="card-in relative z-10 w-full max-w-xl bg-[#0d0d0d] border border-white/15 rounded-[40px] shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/15 rounded-xl flex items-center justify-center">
            <HelpCircle size={16} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-black text-white uppercase italic tracking-tight">What is this?</h2>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={22} /></button>
      </div>
      <div className="px-10 py-8 space-y-8 max-h-[65vh] overflow-y-auto">
        {sections.map((sec, i) => (
          <div key={i}>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-3">{sec.heading}</p>
            <div className="space-y-2">
              {(Array.isArray(sec.body) ? sec.body : [sec.body]).map((line, j) => (
                <p key={j} className="text-slate-400 text-sm leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-10 pb-8 pt-2">
        <button onClick={onClose} className="w-full bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-500 text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-2xl transition-all">
          Got it
        </button>
      </div>
    </div>
  </div>
);

const HelpBtn = ({ onClick }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-blue-400 transition-all border border-white/5 hover:border-blue-500/30 px-3 py-2 rounded-xl">
    <HelpCircle size={13} /> What is this?
  </button>
);

// ─── DATASET CONTEXT HELPERS ──────────────────────────────────────────────────
function datasetOverview(summary) {
  if (!summary) return 'No dataset loaded yet.';
  const { total_rows, columns, types } = summary;
  const numCols = columns?.filter(c => types?.[c] === 'Numeric') || [];
  const catCols = columns?.filter(c => types?.[c] === 'Categorical') || [];
  return `Your dataset has ${total_rows} rows and ${columns?.length} columns — ${numCols.length} numeric (${numCols.join(', ')}) and ${catCols.length} categorical (${catCols.length > 0 ? catCols.join(', ') : 'none'}).`;
}

function datasetForRegression(summary, regX, regY) {
  if (!summary || !regX || !regY) return 'Select X and Y axes above to see dataset-specific context here.';
  return `You are regressing "${regY}" (dependent) on "${regX}" (independent). The model will compute a slope and intercept to describe how "${regX}" linearly predicts "${regY}" across your ${summary.total_rows} observations. Check the Pearson r value — anything above 0.7 or below −0.7 indicates a meaningful linear relationship worth trusting.`;
}

function datasetForViz(summary, vizX, vizY, selectedCharts) {
  if (!summary) return 'No dataset loaded yet.';
  if (!vizX || !vizY) return `Your dataset has ${summary.columns?.length} columns. Select X and Y axes to see chart-specific advice.`;
  const xType = summary.types?.[vizX] || 'unknown';
  const yType = summary.types?.[vizY] || 'unknown';
  let advice = `You have selected "${vizX}" (${xType}) as X and "${vizY}" (${yType}) as Y. `;
  if (xType === 'Numeric' && yType === 'Numeric') {
    advice += 'Both axes are numeric — Scatter Plot and Line Graph will be most meaningful here.';
  } else if (xType === 'Categorical') {
    advice += `"${vizX}" is categorical — Bar Chart or Pie Chart are your best options.`;
  } else {
    advice += 'Mixed axis types detected. Bar Chart and Pie Chart handle this combination best.';
  }
  if (selectedCharts.length > 0) advice += ` You currently have ${selectedCharts.length} chart type(s) selected.`;
  return advice;
}

const CHART_EXPLANATIONS = {
  scatter:   'Shows individual data points plotted by X and Y values. Best for spotting correlations, clusters, and outliers between two numeric variables.',
  bar:       'Compares values across categories using rectangular bars. Best when X is categorical or when you want to rank values side by side.',
  line:      'Connects data points with a continuous line. Best for showing trends over a sequence — time series, ordered data, or gradual change.',
  area:      'Like a line chart but with the area below filled in. Emphasises volume and cumulative magnitude over a sequence.',
  histogram: 'Groups Y values into bins and counts how many fall in each range. Best for understanding the distribution and spread of a single variable.',
  pie:       'Shows proportional share of a whole. Best when you have a small number of categories and want to highlight relative sizes.',
  radar:     'Plots multiple variables on radial axes from a centre. Best for comparing profiles across many dimensions.',
  donut:     'A pie chart with the centre removed. Slightly easier to read proportions and can display a summary stat in the middle.',
  stacked:   'Stacks multiple series on top of each other per category. Best for showing part-to-whole relationships across groups.',
  stepped:   'A line that moves in discrete horizontal steps. Best for data that changes abruptly at intervals.',
};

// ─── ANIMATED BG (shared across intro screens) ───────────────────────────────
const AnimatedBg = () => (
  <>
    <div className="noise-overlay" />
    <div className="intro-grid" />
    <div className="orb1 pointer-events-none absolute w-[520px] h-[520px] rounded-full bg-blue-600/20 blur-[120px] top-[-120px] left-[-100px]" />
    <div className="orb2 pointer-events-none absolute w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[110px] bottom-[-100px] right-[-80px]" />
    <div className="orb3 pointer-events-none absolute w-[300px] h-[300px] rounded-full bg-cyan-400/10 blur-[90px] top-[50%] right-[20%]" />
  </>
);

// ─── APP ──────────────────────────────────────────────────────────────────────
const App = () => {
  // introStage: 'promo' → 'onboard' → (isWelcomed = true shows dashboard)
  const [introStage, setIntroStage]       = useState('promo');
  const [userName, setUserName]           = useState('');
  const [isWelcomed, setIsWelcomed]       = useState(false);
  const [data, setData]                   = useState(null);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [activeTab, setActiveTab]         = useState('overview');
  const [searchQuery, setSearchQuery]     = useState('');
  const [zoomedCol, setZoomedCol]         = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [regX, setRegX]                   = useState('');
  const [regY, setRegY]                   = useState('');
  const [regressionResult, setRegressionResult] = useState(null);
  const [vizX, setVizX]                   = useState('');
  const [vizY, setVizY]                   = useState('');
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [helpCard, setHelpCard]           = useState(null);

  const openHelp  = (title, sections) => setHelpCard({ title, sections });
  const closeHelp = () => setHelpCard(null);

  const toggleChart = (id) => {
    setSelectedCharts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const solveRegression = async (x, y) => {
    if (!x || !y) return;
    try {
      const url = new URL('http://localhost:8000/regression');
      url.searchParams.set('x_col', x);
      url.searchParams.set('y_col', y);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Backend error: " + res.status);
      setRegressionResult(await res.json());
    } catch (err) {
      setRegressionResult({ status: "error", message: "Backend Unreachable" });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8000/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error("Connection Refused");
      const result = await res.json();
      if (result && result.status === "success") {
        setData(result);
        setUploadHistory(prev => [{
          id: Date.now(),
          name: file.name,
          time: new Date().toLocaleTimeString(),
          date: new Date().toLocaleDateString(),
          rows: result.summary?.total_rows || 0,
          cols: result.summary?.columns?.length || 0,
          numericCols: result.summary?.columns?.filter(c => result.summary.types?.[c] === 'Numeric').length || 0,
          catCols: result.summary?.columns?.filter(c => result.summary.types?.[c] === 'Categorical').length || 0,
          quickInsight: result.summary?.insights?.slice(0, 2).join(' · ') || '',
          snapshot: result,
        }, ...prev]);
        setActiveTab('overview');
        setIsWelcomed(true);
      } else {
        alert("Upload Error: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      alert("SYSTEM ERROR: Could not connect to the Python backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reloadEntry = (entry) => { setData(entry.snapshot); setActiveTab('overview'); setIsWelcomed(true); };
  const deleteEntry = (id)    => setUploadHistory(prev => prev.filter(e => e.id !== id));
  const exportEntry = (entry) => {
    const rows = entry.snapshot?.preview || [];
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv  = [cols.join(','), ...rows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','))].join('\n');
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: entry.name.replace(/[^a-z0-9]/gi, '_') + '_export.csv',
    }).click();
  };

  const filteredRows = useMemo(() => {
    const rows = data?.preview || [];
    if (!searchQuery) return rows;
    return rows.filter(row =>
      Object.values(row || {}).some(val =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  const dynamicStats = useMemo(() => {
    if (!data?.summary?.columns) return {};
    const stats = {};
    data.summary.columns.forEach(col => {
      const values = filteredRows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const mean   = values.reduce((a, b) => a + b, 0) / values.length;
        stats[col]   = {
          mean, median: sorted[Math.floor(sorted.length / 2)],
          min: Math.min(...values), max: Math.max(...values),
          std: Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length)
        };
      }
    });
    return stats;
  }, [filteredRows, data]);

  const chartData = useMemo(() => {
    if (!vizX || !vizY || !data?.preview) return [];
    return data.preview
      .map(d => ({ x: parseFloat(d[vizX]), y: parseFloat(d[vizY]), name: String(d[vizX]) }))
      .filter(d => !isNaN(d.x) && !isNaN(d.y)).slice(0, 50);
  }, [vizX, vizY, data]);

  const histogramData = useMemo(() => {
    if (!vizY || !data?.preview) return [];
    const vals = data.preview.map(d => parseFloat(d[vizY])).filter(v => !isNaN(v));
    if (!vals.length) return [];
    const min = Math.min(...vals), max = Math.max(...vals), bins = 10, size = (max - min) / bins;
    const buckets = Array.from({ length: bins }, (_, i) => ({
      range: `${(min + i * size).toFixed(1)}–${(min + (i + 1) * size).toFixed(1)}`, count: 0
    }));
    vals.forEach(v => { const idx = Math.min(Math.floor((v - min) / size), bins - 1); buckets[idx].count++; });
    return buckets;
  }, [vizY, data]);

  const pieData = useMemo(() => {
    if (!vizY || !data?.preview) return [];
    const isNum = data?.summary?.types?.[vizY] === 'Numeric';
    if (isNum) return chartData.slice(0, 8).map((d, i) => ({ name: `Row ${i + 1}`, value: Math.abs(d.y) }));
    const freq = {};
    data.preview.forEach(d => { const v = d[vizY]; if (v) freq[v] = (freq[v] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [vizY, chartData, data]);

  const tooltipStyle = { backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' };
  const axisStyle    = { stroke: '#444', fontSize: 10 };

  const renderChart = (type) => {
    const chartInfo = CHART_TYPES.find(c => c.id === type);
    const noData    = chartData.length === 0;
    return (
      <div key={type} className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[32px] shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{chartInfo.emoji}</span>
          <div>
            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Chart Type</p>
            <h3 className="text-xl font-black text-white uppercase italic">{chartInfo.label}</h3>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-[9px] font-mono text-slate-600 uppercase">{vizX} → {vizY}</div>
            <button onClick={() => openHelp(chartInfo.label, [
              { heading: chartInfo.label, body: CHART_EXPLANATIONS[type] },
              { heading: 'About this data', body: datasetForViz(data?.summary, vizX, vizY, selectedCharts) },
            ])} className="text-slate-700 hover:text-blue-400 transition-colors">
              <HelpCircle size={15} />
            </button>
          </div>
        </div>
        {noData ? (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-slate-600 text-xs font-mono uppercase">No numeric data for selected axes</p>
          </div>
        ) : (
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {type === 'scatter' ? (
                <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="x" type="number" {...axisStyle} label={{ value: vizX, position: 'insideBottom', offset: -15, fill: '#3b82f6', fontSize: 10 }} />
                  <YAxis dataKey="y" type="number" {...axisStyle} label={{ value: vizY, angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Scatter data={chartData} fill="#3b82f6" fillOpacity={0.7} />
                </ScatterChart>
              ) : type === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="x" {...axisStyle} label={{ value: vizX, position: 'insideBottom', offset: -15, fill: '#3b82f6', fontSize: 10 }} />
                  <YAxis {...axisStyle} label={{ value: vizY, angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="y" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : type === 'line' ? (
                <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="x" {...axisStyle} label={{ value: vizX, position: 'insideBottom', offset: -15, fill: '#3b82f6', fontSize: 10 }} />
                  <YAxis {...axisStyle} label={{ value: vizY, angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              ) : type === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="x" {...axisStyle} label={{ value: vizX, position: 'insideBottom', offset: -15, fill: '#3b82f6', fontSize: 10 }} />
                  <YAxis {...axisStyle} label={{ value: vizY, angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
              ) : type === 'histogram' ? (
                <BarChart data={histogramData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="range" {...axisStyle} angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 8, fill: '#555' }} />
                  <YAxis {...axisStyle} label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : type === 'pie' ? (
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#444' }}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#888' }} />
                </PieChart>
              ) : type === 'radar' ? (
                <RadarChart data={chartData.slice(0, 10)} cx="50%" cy="50%" outerRadius={120}>
                  <PolarGrid stroke="#1a1a1a" />
                  <PolarAngleAxis dataKey="x" tick={{ fill: '#555', fontSize: 9 }} />
                  <PolarRadiusAxis tick={{ fill: '#555', fontSize: 8 }} />
                  <Radar dataKey="y" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              ) : type === 'donut' ? (
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={120} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#888' }} />
                </PieChart>
              ) : type === 'stacked' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="x" {...axisStyle} /><YAxis {...axisStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="y" stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
                  <Bar dataKey="x" stackId="a" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="x" {...axisStyle} label={{ value: vizX, position: 'insideBottom', offset: -15, fill: '#3b82f6', fontSize: 10 }} />
                  <YAxis {...axisStyle} label={{ value: vizY, angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="stepAfter" dataKey="y" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 1 — PROMO LANDING
  // ══════════════════════════════════════════════════════════════════════════
  if (!isWelcomed && introStage === 'promo') return (
    <div className="min-h-screen bg-[#030303] text-white font-sans flex flex-col items-center justify-center overflow-hidden relative">
      <style>{glowKeyframes}</style>
      <AnimatedBg />

      {/* logo top-left */}
      <div className="absolute top-8 left-10 flex items-center gap-3 fu1 z-10">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black italic text-base shadow-lg shadow-blue-500/30">R</div>
        <span className="text-[10px] font-black uppercase tracking-[0.45em] text-slate-500">RAW</span>
      </div>

      {/* centre content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl w-full">

        {/* eyebrow pill */}
        <div className="fu1 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-5 py-2 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 blink" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Structured Data Analysis</span>
        </div>

        {/* big RAW title with scan line */}
        <div className="fu2 relative overflow-hidden mb-6 select-none" style={{ lineHeight: 1 }}>
          <h1 className="text-[clamp(5.5rem,16vw,10rem)] font-black italic uppercase tracking-tighter title-shimmer">RAW</h1>
          <div className="scan-line" />
        </div>

        <p className="fu3 text-slate-400 text-sm max-w-sm leading-relaxed mb-10">
          Upload any CSV. Get instant statistics, correlations,
          regression, and visual breakdowns — no code needed.
        </p>

        {/* feature pills */}
        <div className="fu4 flex flex-wrap justify-center gap-2 mb-12">
          {['📊 Stats','🔗 Correlation','📈 Regression','🌊 10 Chart Types','⚡ Insights'].map(t => (
            <span key={t} className="text-[9px] font-black uppercase tracking-widest text-slate-500 border border-white/8 px-4 py-1.5 rounded-full bg-white/[0.02]">{t}</span>
          ))}
        </div>

        {/* CTA */}
        <div className="fu5">
          <button
            onClick={() => setIntroStage('onboard')}
            className="group inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full font-black text-sm uppercase tracking-[0.3em] hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-2xl shadow-white/10 hover:shadow-blue-500/30"
          >
            Get Started
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <p className="text-slate-700 text-[9px] font-mono uppercase tracking-widest mt-4">No account · Works locally</p>
        </div>
      </div>

      {/* recent sessions bar at bottom */}
      {uploadHistory.length > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          <span className="text-[9px] text-slate-700 uppercase font-black tracking-widest">Recent:</span>
          {uploadHistory.slice(0, 3).map(e => (
            <button key={e.id} onClick={() => reloadEntry(e)}
              className="text-[9px] text-slate-500 hover:text-blue-400 border border-white/5 hover:border-blue-500/30 px-3 py-1.5 rounded-lg font-mono uppercase transition-all">
              {e.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 2 — ONBOARD (optional username + centred upload)
  // ══════════════════════════════════════════════════════════════════════════
  if (!isWelcomed && introStage === 'onboard') return (
    <div className="min-h-screen bg-[#030303] text-white font-sans flex flex-col items-center justify-center overflow-hidden relative">
      <style>{glowKeyframes}</style>
      <AnimatedBg />

      {/* back */}
      <button onClick={() => setIntroStage('promo')} className="absolute top-8 left-10 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-all z-10">
        ← Back
      </button>

      {/* logo top-right */}
      <div className="absolute top-8 right-10 flex items-center gap-3 z-10">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black italic text-base shadow-lg shadow-blue-500/30">R</div>
        <span className="text-[10px] font-black uppercase tracking-[0.45em] text-slate-500">RAW</span>
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center text-center">

        {/* heading */}
        <div className="fu1 mb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-600 mb-3">Step 01 of 02</p>
          <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">Set up your session</h2>
        </div>

        {/* optional username */}
        <div className="fu2 w-full mb-6">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 mb-3 text-left">Operator ID <span className="text-slate-700 normal-case font-normal not-italic">(optional)</span></p>
          <input
            type="text"
            placeholder="e.g. ANALYST_01"
            className="w-full bg-[#0d0d0d] border border-white/10 focus:border-blue-500/60 rounded-2xl p-4 text-center outline-none font-black uppercase text-white tracking-[0.2em] text-sm placeholder:text-slate-700 transition-all"
            onChange={e => setUserName(e.target.value)}
            value={userName}
          />
        </div>

        {/* divider */}
        <div className="fu3 w-full flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-white/5" />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Step 02 · Upload</p>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* centred upload zone — always enabled */}
        <div className="fu4 w-full">
          <label className="group block w-full border-2 border-dashed border-blue-500/25 hover:border-blue-500/60 hover:bg-blue-500/[0.03] rounded-[32px] p-12 transition-all duration-300 cursor-pointer relative overflow-hidden">
            {/* subtle inner glow on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-radial-gradient pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />

            <div className="flex flex-col items-center gap-5 relative z-10">
              {/* upload icon with pulse rings */}
              <div className="relative ring-pulse">
                <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                  {isProcessing
                    ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Upload size={28} className="text-white" />
                  }
                </div>
              </div>

              <div>
                <p className="text-white font-black uppercase tracking-widest text-base mb-1">
                  {isProcessing ? 'Processing...' : 'Upload CSV File'}
                </p>
                <p className="text-slate-500 text-[11px] font-mono">
                  {isProcessing ? 'Parsing your dataset...' : 'Click to browse · Any CSV · Any size'}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {['.csv', 'instant analysis', 'no signup'].map(t => (
                  <span key={t} className="text-[9px] font-black uppercase tracking-widest text-slate-600 border border-white/5 px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>

            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".csv"
              disabled={isProcessing}
            />
          </label>
        </div>

        {/* skip hint */}
        <p className="fu5 text-[9px] text-slate-700 uppercase font-mono tracking-widest mt-6">
          Dashboard stays empty until a file is uploaded
        </p>

        {/* recent sessions */}
        {uploadHistory.length > 0 && (
          <div className="fu5 mt-10 w-full">
            <p className="text-[9px] text-slate-700 uppercase font-black tracking-widest mb-3">Or reload a previous session</p>
            <div className="space-y-2">
              {uploadHistory.slice(0, 3).map(e => (
                <button key={e.id} onClick={() => reloadEntry(e)}
                  className="w-full flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-blue-500/30 px-5 py-3 rounded-2xl transition-all">
                  <div className="flex items-center gap-3">
                    <FileText size={13} className="text-blue-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">{e.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono">{e.rows} rows</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN APP DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen bg-[#050505] text-slate-300 flex overflow-hidden font-sans">
      <style>{glowKeyframes}</style>
      {helpCard && <HelpCard onClose={closeHelp} title={helpCard.title} sections={helpCard.sections} />}

      <nav className="w-24 bg-[#080808] border-r border-white/5 flex flex-col items-center py-10 gap-8 z-20">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-500/20">R</div>
        <button onClick={() => setActiveTab('overview')}   className={`p-4 rounded-2xl transition-all ${activeTab==='overview'   ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:text-white'}`}><LayoutGrid size={24}/></button>
        <button onClick={() => setActiveTab('regression')} className={`p-4 rounded-2xl transition-all ${activeTab==='regression' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:text-white'}`}><Microscope size={24}/></button>
        <button onClick={() => setActiveTab('visuals')}    className={`p-4 rounded-2xl transition-all ${activeTab==='visuals'    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:text-white'}`}><Activity size={24}/></button>
        <button onClick={() => setActiveTab('history')}    className={`p-4 rounded-2xl transition-all ${activeTab==='history'    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:text-white'}`}><History size={24}/></button>
      </nav>

      <main className="flex-1 p-12 overflow-y-auto relative">
        <header className="flex justify-between items-start mb-16">
          <div className="flex flex-col">
            <h1 className="text-6xl font-normal text-white uppercase tracking-widest leading-none">RAWW</h1>
            <p className="text-blue-500 font-bold text-xs mt-3 uppercase tracking-[0.4em]">Node: {userName || 'ANONYMOUS'}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase hover:bg-blue-500 transition-all flex items-center gap-2"><Download size={16}/> EXTRACT</button>
            <label className="cursor-pointer bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-blue-500 hover:text-white transition-all shadow-lg flex items-center gap-2">
              {isProcessing ? 'INJECTING...' : 'RE-INJECT'} <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv"/>
            </label>
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {data && activeTab === 'overview' && (
          <div className="space-y-12 pb-20">
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 p-10 rounded-[40px] shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white uppercase italic flex items-center gap-3"><Zap className="text-blue-500"/> Insight Report</h3>
                  <HelpBtn onClick={() => openHelp('Insight Report', [
                    { heading: 'What is the Insight Report?', body: ['The Insight Report is an auto-generated summary of your dataset. It scans every numeric column and highlights the most statistically significant patterns.'] },
                    { heading: 'About this data', body: datasetOverview(data?.summary) },
                  ])}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {data.summary?.insights?.map((insight, idx) => (
                    <div key={idx} className="flex gap-4 items-start border-l-2 border-blue-500/20 pl-4 py-1">
                      <span className="text-blue-500 font-black text-[10px] mt-1">0{idx + 1}</span>
                      <p className="text-slate-400 text-sm font-medium italic leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-600 p-1 rounded-[40px] shadow-2xl shadow-blue-500/20">
                <div className="bg-black w-full h-full rounded-[38px] p-8">
                  <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Share2 size={14}/> System_Relations</h3>
                  <div className="space-y-6">
                    {data.summary?.system_relations?.map((rel, i) => (
                      <div key={i} className="border-b border-white/5 pb-4 last:border-0">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{rel.colA} + {rel.colB}</p>
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-mono text-white tracking-widest">{rel.strength > 0 ? 'SYNCED_POS' : 'SYNCED_NEG'}</span>
                          <span className="text-blue-500 font-black text-xl leading-none">{(rel.strength * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-end">
                <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3"><TableIcon className="text-blue-500"/> Raw Data Stream</h3>
                <div className="flex items-center gap-4">
                  <HelpBtn onClick={() => openHelp('Raw Data Stream', [
                    { heading: 'What is the Raw Data Stream?', body: ['This is a live, filterable view of your uploaded CSV data. Cells in red are statistical anomalies — values exceeding 2 standard deviations from the mean.'] },
                    { heading: 'About this data', body: datasetOverview(data?.summary) },
                  ])}/>
                  <div className="relative flex items-center bg-black rounded-xl border border-white/10 px-4 py-2">
                    <span className="text-blue-500 font-mono text-xs mr-3">RAWW_USR:~$</span>
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="FILTER_STREAM..." className="bg-transparent border-none outline-none text-xs font-mono text-white w-64 uppercase placeholder:text-slate-700"/>
                  </div>
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden shadow-xl">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0a0a0a] z-10 border-b border-white/10">
                      <tr className="bg-white/5">
                        {data.summary?.columns?.map(col => (
                          <th key={col} className="px-6 py-5 whitespace-nowrap">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{col}</p>
                            <span className="text-[8px] px-2 py-0.5 bg-blue-500/10 rounded text-blue-300 font-bold border border-blue-500/20">{data.summary?.types?.[col] || "FEATURE"}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                      {filteredRows.slice(0, 100).map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          {data.summary?.columns?.map(col => {
                            const isCrit = data.summary?.thresholds?.[col] && parseFloat(row[col]) > data.summary.thresholds[col].critical_high;
                            return <td key={col} className={`px-6 py-4 whitespace-nowrap ${isCrit ? 'text-red-500 bg-red-500/5 glow-cell' : 'text-slate-400'}`}>{row[col]}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-normal text-white uppercase tracking-widest flex items-center gap-3"><Microscope className="text-blue-500"/> Neural Distribution</h3>
                <HelpBtn onClick={() => openHelp('Neural Distribution', [
                  { heading: 'What is Neural Distribution?', body: ['Each card represents one numeric column. Mean, Median, Std Dev, Min, Max are the five core descriptive statistics. Click any card for a deeper view.'] },
                  { heading: 'About this data', body: datasetOverview(data?.summary) },
                ])}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(dynamicStats).map(colName => (
                  <div key={colName} onClick={() => setZoomedCol(colName)} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[32px] hover:border-blue-500/30 transition-all cursor-zoom-in active:scale-95 shadow-lg group">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{colName}</p>
                      <Activity size={14} className="text-slate-700 group-hover:text-blue-500"/>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-[9px] text-slate-500 uppercase font-black">Mean <p className="text-xl text-white mt-1">{dynamicStats[colName].mean.toFixed(2)}</p></div>
                      <div className="text-[9px] text-slate-500 uppercase font-black">Max  <p className="text-xl text-white mt-1">{dynamicStats[colName].max.toFixed(2)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VISUALS TAB */}
        {data && activeTab === 'visuals' && (
          <div className="space-y-10 pb-20">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">Phase 4 // Visual Studio</p>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4"><Activity className="text-blue-500"/> SYSTEM_VISUALIZER</h2>
              </div>
              <div className="flex items-center gap-4">
                <HelpBtn onClick={() => openHelp('System Visualizer', [
                  { heading: 'What is the System Visualizer?', body: ['Select X and Y axes, pick chart types, and all selected charts render at once. 10 chart types available.'] },
                  { heading: 'About this data', body: datasetForViz(data?.summary, vizX, vizY, selectedCharts) },
                ])}/>
                <div className="flex gap-4 bg-black p-2 rounded-2xl border border-white/10 shadow-2xl">
                  <select value={vizX} onChange={e => setVizX(e.target.value)} className="bg-[#111] text-xs font-black text-blue-500 uppercase outline-none px-4 py-2 border border-white/5 rounded-xl">
                    <option value="">SELECT X AXIS</option>
                    {data.summary?.columns?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={vizY} onChange={e => setVizY(e.target.value)} className="bg-[#111] text-xs font-black text-white uppercase outline-none px-4 py-2 border border-white/5 rounded-xl">
                    <option value="">SELECT Y AXIS</option>
                    {data.summary?.columns?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[32px]">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Select Chart Types ({selectedCharts.length} selected)</p>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedCharts(CHART_TYPES.map(c => c.id))} className="text-[10px] font-black text-blue-400 uppercase hover:text-white transition-all border border-blue-500/20 px-3 py-1 rounded-lg">Select All</button>
                  <button onClick={() => setSelectedCharts([])} className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-all border border-white/10 px-3 py-1 rounded-lg">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {CHART_TYPES.map(chart => (
                  <button key={chart.id} onClick={() => toggleChart(chart.id)}
                    className={`p-4 rounded-2xl border transition-all text-left ${selectedCharts.includes(chart.id) ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-black border-white/5 text-slate-500 hover:border-white/20 hover:text-white'}`}>
                    <div className="text-2xl mb-2">{chart.emoji}</div>
                    <p className="text-[10px] font-black uppercase tracking-wide">{chart.label}</p>
                    {selectedCharts.includes(chart.id) && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"/>}
                  </button>
                ))}
              </div>
            </div>
            {selectedCharts.length === 0 && <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[40px]"><p className="text-slate-600 font-mono text-xs uppercase tracking-widest">Select chart types above to visualize your data</p></div>}
            {(!vizX || !vizY) && selectedCharts.length > 0 && <div className="text-center py-10 border-2 border-dashed border-blue-500/20 rounded-[32px]"><p className="text-blue-500/60 font-mono text-xs uppercase tracking-widest">Select X and Y axes above to render charts</p></div>}
            {vizX && vizY && selectedCharts.length > 0 && <div className="space-y-8">{selectedCharts.map(type => renderChart(type))}</div>}
          </div>
        )}

        {/* NEURAL LAB TAB */}
        {data && activeTab === 'regression' && (
          <div className="space-y-10 pb-20">
            <div className="flex justify-between items-end relative z-50">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4"><Target className="text-blue-500"/> Neural Lab</h2>
              <div className="flex items-center gap-4">
                <HelpBtn onClick={() => openHelp('Neural Lab — Linear Regression', [
                  { heading: 'What is Linear Regression?', body: ['Linear regression finds the best straight line through your data points. The result is y = mx + b. Pearson r near 1 or −1 means a strong relationship.'] },
                  { heading: 'About this data', body: datasetForRegression(data?.summary, regX, regY) },
                ])}/>
                <div className="flex gap-4 bg-black p-2 rounded-2xl border border-white/10 shadow-2xl">
                  <select value={regX} onChange={e => { const val = e.target.value; setRegX(val); if (regY && val) solveRegression(val, regY); }} className="bg-[#111] text-xs font-black text-blue-500 uppercase outline-none px-4 py-2 cursor-pointer border border-white/5 rounded-xl hover:border-blue-500/50">
                    <option value="">SELECT X AXIS</option>
                    {data.summary?.columns?.filter(c => data.summary.types[c] === 'Numeric').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={regY} onChange={e => { const val = e.target.value; setRegY(val); if (regX && val) solveRegression(regX, val); }} className="bg-[#111] text-xs font-black text-white uppercase outline-none px-4 py-2 cursor-pointer border border-white/5 rounded-xl hover:border-white/20">
                    <option value="">SELECT Y AXIS</option>
                    {data.summary?.columns?.filter(c => data.summary.types[c] === 'Numeric').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {regressionResult && regressionResult.status === "success" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl"><p className="text-[10px] text-blue-500 font-black uppercase mb-1">Live Equation</p><p className="text-2xl font-mono text-white italic">{regressionResult.equation}</p></div>
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl"><p className="text-[10px] text-blue-500 font-black uppercase mb-1">Pearson Correlation (r)</p><p className="text-2xl font-mono text-white italic">{regressionResult.r?.toFixed(3)}</p></div>
                <div className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-500/20"><p className="text-[10px] text-white/60 font-black uppercase mb-1">Neural Insight</p><p className="text-xl font-black text-white italic uppercase tracking-tighter">{regressionResult.insight}</p></div>
              </div>
            )}
            {regressionResult && regressionResult.status === "error" && (
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl"><p className="text-red-400 font-mono text-xs uppercase">ERROR: {regressionResult.message}</p></div>
            )}
            <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[40px] relative overflow-hidden shadow-2xl z-0" style={{ height: '500px' }}>
              {!regX || !regY ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[30px]">
                  <Microscope size={48} className="text-slate-800 mb-4"/>
                  <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-xs text-center">Waiting for Neural Variable Injection...<br/><span className="opacity-50 font-mono mt-2 block italic text-[10px]">SELECT X AND Y AXIS ABOVE</span></p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false}/>
                    <XAxis dataKey="x" type="number" stroke="#444" fontSize={10} tickFormatter={v => v?.toFixed(1)} label={{ value: regX, position: 'insideBottom', offset: -20, fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' }}/>
                    <YAxis dataKey="y" type="number" stroke="#444" fontSize={10} tickFormatter={v => v?.toFixed(1)} label={{ value: regY, angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}/>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}/>
                    <Scatter name="Data Points" data={(regressionResult?.points || []).map(p => ({ x: Number(p.x), y: Number(p.y) }))} fill="#3b82f6" fillOpacity={0.6}/>
                    {regressionResult?.line && <Scatter name="Regression Line" data={regressionResult.line.map(p => ({ x: Number(p.x), y: Number(p.y) }))} line={{ stroke: '#fff', strokeWidth: 2, strokeDasharray: '5 5' }} shape={() => null} legendType="none"/>}
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-8 pb-20">
            <div className="flex items-end justify-between">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Neural Access Log</h2>
              <div className="flex items-center gap-3">
                <HelpBtn onClick={() => openHelp('Neural Access Log', [
                  { heading: 'What is the Neural Access Log?', body: ['Every dataset uploaded this session is stored here. Reload to bring any previous dataset back. Export downloads it as clean CSV.'] },
                  { heading: 'Current session', body: uploadHistory.length > 0 ? `You have ${uploadHistory.length} session(s) logged.` : 'No sessions yet. Upload a CSV to begin.' },
                ])}/>
                {uploadHistory.length > 0 && (
                  <button onClick={() => setUploadHistory([])} className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black hover:text-red-400 transition-all border border-white/10 px-4 py-2 rounded-xl">
                    <Trash2 size={12}/> Clear All
                  </button>
                )}
              </div>
            </div>
            {uploadHistory.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[40px]">
                <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">Awaiting first system injection...</p>
              </div>
            )}
            {uploadHistory.map((entry, i) => (
              <div key={entry.id} className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 hover:border-blue-500/20 transition-all">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0"><Clock size={22} className="text-blue-500"/></div>
                    <div>
                      <p className="text-white font-black uppercase tracking-widest text-sm mb-1">{entry.name}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">{entry.date} at {entry.time}</span>
                        <span className="text-[9px] text-blue-500 font-black uppercase border border-blue-500/20 px-2 py-0.5 rounded-lg">Session #{uploadHistory.length - i}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-shrink-0">
                    <button onClick={() => reloadEntry(entry)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"><RotateCcw size={12}/> Reload</button>
                    <button onClick={() => exportEntry(entry)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all border border-white/10"><Download size={12}/> Export</button>
                    <button onClick={() => deleteEntry(entry.id)} className="flex items-center gap-2 text-slate-600 hover:text-red-400 text-[10px] font-black uppercase px-3 py-2.5 rounded-xl transition-all border border-white/5 hover:border-red-500/20"><Trash2 size={12}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  {[{ label: 'Rows', val: entry.rows?.toLocaleString(), color: 'text-white' }, { label: 'Columns', val: entry.cols, color: 'text-white' }, { label: 'Numeric', val: entry.numericCols, color: 'text-blue-400' }, { label: 'Categorical', val: entry.catCols, color: 'text-purple-400' }].map(({ label, val, color }) => (
                    <div key={label} className="bg-black/50 rounded-2xl px-4 py-3"><p className="text-[9px] text-slate-500 uppercase font-black mb-1">{label}</p><p className={`text-xl font-black ${color}`}>{val}</p></div>
                  ))}
                </div>
                {entry.quickInsight && (
                  <div className="border-t border-white/5 pt-5">
                    <p className="text-[9px] text-slate-600 uppercase font-black mb-2 flex items-center gap-1"><Zap size={9} className="text-blue-500"/> Quick Insight</p>
                    <p className="text-slate-400 text-xs italic leading-relaxed">{entry.quickInsight}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DEEP INSPECTION MODAL */}
      {zoomedCol && dynamicStats[zoomedCol] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setZoomedCol(null)}/>
          <div className="w-full max-w-2xl bg-[#0d0d0d] border border-white/20 p-12 rounded-[50px] shadow-2xl relative z-10">
            <button onClick={() => setZoomedCol(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={32}/></button>
            <header className="mb-12">
              <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.5em] mb-2">Deep Inspection</p>
              <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">{zoomedCol}</h2>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
              <div><p className="text-[9px] text-slate-500 uppercase font-black mb-1">Mean</p>   <p className="text-3xl font-black text-white">{dynamicStats[zoomedCol].mean.toFixed(2)}</p></div>
              <div><p className="text-[9px] text-slate-500 uppercase font-black mb-1">Median</p> <p className="text-3xl font-black text-white">{dynamicStats[zoomedCol].median.toFixed(2)}</p></div>
              <div><p className="text-[9px] text-slate-500 uppercase font-black mb-1">Std Dev</p><p className="text-3xl font-black text-white">{dynamicStats[zoomedCol].std.toFixed(2)}</p></div>
              <div><p className="text-[9px] text-slate-500 uppercase font-black mb-1">Min</p>    <p className="text-3xl font-black text-white">{dynamicStats[zoomedCol].min.toFixed(2)}</p></div>
              <div><p className="text-[9px] text-slate-500 uppercase font-black mb-1">Max</p>    <p className="text-3xl font-black text-white">{dynamicStats[zoomedCol].max.toFixed(2)}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;