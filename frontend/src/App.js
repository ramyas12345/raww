import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  LayoutGrid, History, Zap, Activity, Microscope, X, Table as TableIcon,
  Download, Share2, Clock, ArrowRight, RotateCcw, Trash2,
  FileText, HelpCircle, Upload, AlertTriangle, CheckCircle2, Sparkles, Eraser,
  BarChart2, GitBranch, Pencil, Copy, Calculator, Sigma, Minus, Hash, ArrowUpDown, SquareStack
} from 'lucide-react';

const BACKEND = 'https://raww-backend.onrender.com';

const glowKeyframes = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { font-family: 'Inter', sans-serif !important; }

  @keyframes pulse-red {
    0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); border-color: rgba(239,68,68,0.5); }
    70%  { box-shadow: 0 0 0 10px rgba(239,68,68,0); border-color: rgba(239,68,68,0.2); }
    100% { box-shadow: 0 0 0 0 rgba(239,68,68,0);  border-color: rgba(239,68,68,0.5); }
  }
  .glow-cell { animation: pulse-red 2s infinite; }
  select option { background-color: #0E0E1A !important; color: white !important; }

  @keyframes cardIn {
    from { opacity:0; transform:translateY(16px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  .card-in { animation: cardIn 0.28s ease forwards; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .fu1 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.0s  both; }
  .fu2 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.12s both; }
  .fu3 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.22s both; }
  .fu4 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.32s both; }
  .fu5 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.42s both; }

  .drag-over {
    border-color: rgba(124,58,237,0.8) !important;
    background: rgba(124,58,237,0.06) !important;
    transform: scale(1.01);
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2D2D4E; border-radius: 99px; }
`;

const CHART_TYPES = [
  { id:'scatter',   label:'Scatter Plot' },
  { id:'bar',       label:'Bar Chart'    },
  { id:'line',      label:'Line Graph'   },
  { id:'area',      label:'Area Chart'   },
  { id:'histogram', label:'Histogram'    },
  { id:'pie',       label:'Pie Chart'    },
  { id:'radar',     label:'Radar Chart'  },
  { id:'donut',     label:'Donut Chart'  },
  { id:'stacked',   label:'Stacked Bar'  },
  { id:'stepped',   label:'Step Line'    },
];
const COLORS = ['#7C3AED','#A78BFA','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#6366f1'];
const ACCEPTED_TYPES = '.csv,.xlsx,.xls,.json,.tsv,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.heic,.pdf';

/* ── RAWW Logo ──────────────────────────────────────────────────── */
const RawwMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="18" fill="#7C3AED"/>
    <path d="M22 22 H55 Q72 22 72 40 Q72 52 60 56 L74 78 H60 L47 57 H34 V78 H22 Z M34 34 V46 H53 Q60 46 60 40 Q60 34 53 34 Z" fill="white" strokeLinejoin="round"/>
    <path d="M60 62 L68 78" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

/* ── Heatmap Cell ───────────────────────────────────────────────── */
const HeatmapCell = ({ value }) => {
  const abs = Math.abs(value);
  const isPos = value >= 0;
  const bg = value === 1
    ? 'rgba(124,58,237,0.15)'
    : isPos ? `rgba(124,58,237,${abs * 0.7})` : `rgba(239,68,68,${abs * 0.7})`;
  const textColor = abs > 0.5 ? '#fff' : abs > 0.2 ? '#ccc' : '#555';
  return (
    <div style={{ background:bg, color:textColor, borderRadius:6, padding:'6px 4px', fontSize:10, textAlign:'center', fontWeight:700, minWidth:48, minHeight:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {value.toFixed(2)}
    </div>
  );
};

/* ── Help Card ──────────────────────────────────────────────────── */
const HelpCard = ({ onClose, title, sections }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
    <div className="card-in relative z-10 w-full max-w-2xl bg-[#0E0E1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 md:px-8 pt-7 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-500/15 rounded-xl flex items-center justify-center">
            <HelpCircle size={15} className="text-violet-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
      </div>
      <div className="px-6 md:px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto">
        {sections.map((sec, i) => (
          <div key={i}>
            <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-2">{sec.heading}</p>
            <div className="space-y-2">
              {(Array.isArray(sec.body) ? sec.body : [sec.body]).map((line, j) => (
                <p key={j} className="text-slate-300 text-sm leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 md:px-8 pb-6 pt-2">
        <button onClick={onClose} className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-3 rounded-xl transition-all">Got it</button>
      </div>
    </div>
  </div>
);

const HelpBtn = ({ onClick }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 hover:text-violet-400 transition-all border border-white/5 hover:border-violet-500/30 px-3 py-2 rounded-lg shrink-0">
    <HelpCircle size={13} /> <span className="hidden sm:inline">What is this?</span>
  </button>
);

/* ── FIX 1: InlineConfirm — explicit top/right/bottom/left, no inset shorthand ── */
const InlineConfirm = ({ message, confirmLabel = 'Confirm', confirmColor = '#dc2626', onConfirm, onCancel }) => (
  <div style={{ position:'fixed', top:0, right:0, bottom:0, left:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
    <div style={{ position:'absolute', top:0, right:0, bottom:0, left:0, background:'rgba(0,0,0,0.72)' }} onClick={onCancel} />
    <div style={{ position:'relative', zIndex:1, background:'#13131F', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'360px', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
      <p style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'6px' }}>Confirm action</p>
      <p style={{ color:'#94a3b8', fontSize:'12px', lineHeight:'1.6', marginBottom:'20px' }}>{message}</p>
      <div style={{ display:'flex', gap:'10px' }}>
        <button onClick={onCancel}  style={{ flex:1, fontSize:'12px', fontWeight:600, color:'#94a3b8', border:'1px solid rgba(255,255,255,0.1)', background:'transparent', padding:'10px', borderRadius:'10px', cursor:'pointer' }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex:1, fontSize:'12px', fontWeight:600, color:'white', background:confirmColor, border:'none', padding:'10px', borderRadius:'10px', cursor:'pointer' }}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

/* ── Dataset helpers ────────────────────────────────────────────── */
function datasetOverview(summary) {
  if (!summary) return 'No dataset loaded yet.';
  const { total_rows, columns, types } = summary;
  const numCols = columns?.filter(c => types?.[c] === 'Numeric') || [];
  const catCols = columns?.filter(c => types?.[c] === 'Categorical') || [];
  return `Your dataset has ${total_rows} rows and ${columns?.length} columns — ${numCols.length} numeric (${numCols.join(', ')}) and ${catCols.length} categorical (${catCols.length > 0 ? catCols.join(', ') : 'none'}).`;
}
function datasetForRegression(summary, regX, regY) {
  if (!summary || !regX || !regY) return 'Select X and Y axes above to see dataset-specific context here.';
  return `You are regressing "${regY}" (dependent variable) on "${regX}" (independent variable). The model fits the equation y = mx + b using ordinary least squares, minimising the sum of squared residuals across your ${summary.total_rows} observations.`;
}
function datasetForViz(summary, vizX, vizY, selectedCharts) {
  if (!summary) return 'No dataset loaded yet.';
  if (!vizX || !vizY) return `Your dataset has ${summary.columns?.length} columns. Select X and Y axes to see chart-specific advice.`;
  const xType = summary.types?.[vizX] || 'unknown';
  const yType = summary.types?.[vizY] || 'unknown';
  let advice = `You have selected "${vizX}" (${xType}) as X and "${vizY}" (${yType}) as Y. `;
  if (xType === 'Numeric' && yType === 'Numeric') advice += 'Both axes are numeric — Scatter Plot and Line Graph reveal correlations most clearly.';
  else if (xType === 'Categorical') advice += `"${vizX}" is categorical — Bar Chart or Pie Chart are best.`;
  else advice += 'Mixed axis types detected. Bar Chart and Pie Chart handle this combination best.';
  if (selectedCharts.length > 0) advice += ` You have ${selectedCharts.length} chart type(s) selected.`;
  return advice;
}

const CHART_EXPLANATIONS = {
  scatter:   'A scatter plot places each row as a dot at (X, Y). Best for seeing correlations between two numeric variables.',
  bar:       'A bar chart draws one vertical bar per data point. Best when X is categorical and you want to compare values side by side.',
  line:      'A line chart connects points in sequence. Best for showing how a value changes over time or an ordered series.',
  area:      'An area chart is a filled line chart. Emphasises the volume or magnitude of a metric over time.',
  histogram: 'A histogram groups Y values into bins and counts how many data points fall into each. Reveals the shape of a distribution.',
  pie:       'A pie chart shows proportions. Most effective with a small number of categories (under 6).',
  radar:     'A radar chart plots multiple variables on radial axes — ideal for comparing a profile across many dimensions.',
  donut:     'A donut chart is a pie chart with a hollow centre. Easier to read arc lengths than angles. Works best with 3–6 categories.',
  stacked:   'A stacked bar chart shows the contribution of sub-series within each category bar.',
  stepped:   'A step line chart shows values that change abruptly at intervals rather than gradually.',
};

/* ── Overview feature cards ─────────────────────────────────────── */
const OVERVIEW_FEATURES = [
  { id:'missing',      icon: <AlertTriangle size={22} className="text-amber-400"/>,   label:'Missing Values',    desc:'See which columns have gaps and how severe the missing data problem is.',                        preloaded:false },
  { id:'correlation',  icon: <GitBranch size={22} className="text-violet-400"/>,      label:'Correlation Matrix', desc:'Pearson r heatmap showing how every pair of numeric columns relate to each other.',             preloaded:false },
  { id:'rawdata',      icon: <TableIcon size={22} className="text-violet-400"/>,      label:'Raw Data Table',    desc:'Filterable, sortable, paginated & editable view of your entire dataset.',                       preloaded:false },
  { id:'distribution', icon: <BarChart2 size={22} className="text-violet-400"/>,      label:'Column Distribution', desc:'Key statistics (mean, median, min, max, std dev) for every numeric column.',                preloaded:false },
];

/* ════════════════════════════════════════════════════════════════ */
const App = () => {
  const [introStage, setIntroStage]         = useState('promo');
  const [userName, setUserName]             = useState('');
  const [isWelcomed, setIsWelcomed]         = useState(false);
  const [data, setData]                     = useState(null);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [activeTab, setActiveTab]           = useState('overview');
  const [activeFeature, setActiveFeature]   = useState('insights');
  const [searchQuery, setSearchQuery]       = useState('');
  const [zoomedCol, setZoomedCol]           = useState(null);
  const [uploadHistory, setUploadHistory]   = useState([]);
  const [regX, setRegX]                     = useState('');
  const [regY, setRegY]                     = useState('');
  const [regressionResult, setRegressionResult] = useState(null);
  const [vizX, setVizX]                     = useState('');
  const [vizY, setVizY]                     = useState('');
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [helpCard, setHelpCard]             = useState(null);
  const [isDragOver, setIsDragOver]         = useState(false);
  const [cleanMsg, setCleanMsg]             = useState(null);
  const [sortCol, setSortCol]               = useState(null);
  const [sortDir, setSortDir]               = useState('asc');
  const [page, setPage]                     = useState(0);
  const [isExporting, setIsExporting]       = useState(false);
  const [confirmDrop, setConfirmDrop]       = useState(null);
  const [cleanLoading, setCleanLoading]     = useState(false);
  /* FIX 2: Table editor state — all at top-level so they survive re-renders */
  const [selectedRows, setSelectedRows]     = useState(new Set());
  const [editingCell, setEditingCell]       = useState(null);
  const [editingValue, setEditingValue]     = useState('');
  const [calcCol, setCalcCol]               = useState('');
  const [calcOp, setCalcOp]                 = useState('sum');
  const [calcResult, setCalcResult]         = useState(null);
  const [calcScalar, setCalcScalar]         = useState('');
  const [confirmDropRows, setConfirmDropRows] = useState(false);
  const [localRows, setLocalRows]           = useState(null);
  const cleanMsgTimer                       = useRef(null);
  const dashboardRef                        = useRef(null);
  const PAGE_SIZE = 20;

  const openHelp    = (title, sections) => setHelpCard({ title, sections });
  const closeHelp   = () => setHelpCard(null);
  const toggleChart = (id) => setSelectedCharts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  /* FIX 3: cleanMsg helper — clears any in-flight timer before setting a new one */
  const showCleanMsg = useCallback((msg, ms = 4000) => {
    if (cleanMsgTimer.current) clearTimeout(cleanMsgTimer.current);
    setCleanMsg(msg);
    cleanMsgTimer.current = setTimeout(() => setCleanMsg(null), ms);
  }, []);

  /* Paste support */
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === 'file') { const f = item.getAsFile(); if (f) { processFile(f); break; } }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const solveRegression = async (x, y) => {
    if (!x || !y) return;
    try {
      const url = new URL(`${BACKEND}/regression`);
      url.searchParams.set('x_col', x); url.searchParams.set('y_col', y);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error();
      setRegressionResult(await res.json());
    } catch { setRegressionResult({ status:'error', message:'Backend Unreachable' }); }
  };

  const processFile = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res    = await fetch(`${BACKEND}/upload`, { method:'POST', body:formData });
      if (!res.ok) throw new Error();
      const result = await res.json();
      if (result?.status === 'success') {
        setData(result);
        setLocalRows(null);
        setSelectedRows(new Set());
        setUploadHistory(prev => [{
          id: Date.now(), name: file.name,
          time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString(),
          rows: result.summary?.total_rows || 0, cols: result.summary?.columns?.length || 0,
          numericCols: result.summary?.columns?.filter(c => result.summary.types?.[c]==='Numeric').length || 0,
          catCols: result.summary?.columns?.filter(c => result.summary.types?.[c]==='Categorical').length || 0,
          quickInsight: result.summary?.insights?.slice(0,2).join(' · ') || '',
          snapshot: result,
        }, ...prev]);
        setActiveTab('overview'); setActiveFeature('insights'); setIsWelcomed(true); setPage(0);
      } else { alert('Upload Error: ' + (result.message || 'Unknown error')); }
    } catch { alert('Could not connect to the backend.'); }
    finally { setIsProcessing(false); }
  };

  const handleFileUpload = async (e) => { const files = Array.from(e.target.files||[]); for (const f of files) await processFile(f); };
  const handleDragOver   = useCallback((e) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave  = useCallback(() => setIsDragOver(false), []);
  const handleDrop       = useCallback((e) => { e.preventDefault(); setIsDragOver(false); Array.from(e.dataTransfer.files).forEach(f => processFile(f)); }, []);

  const reloadEntry = (entry) => { setData(entry.snapshot); setLocalRows(null); setSelectedRows(new Set()); setActiveTab('overview'); setActiveFeature('insights'); setIsWelcomed(true); setPage(0); };
  const deleteEntry = (id)    => setUploadHistory(prev => prev.filter(e => e.id !== id));

  const exportEntry = (entry) => {
    const rows = entry.snapshot?.preview || []; if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv  = [cols.join(','), ...rows.map(r => cols.map(c => `"${r[c]??''}"`).join(','))].join('\n');
    Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:entry.name.replace(/[^a-z0-9]/gi,'_')+'_export.csv' }).click();
  };

  /* FIX 4: cleanAction — removed unreliable /preview refetch, using local state fallback only */
  const cleanAction = async (action, column = null, fillValue = null) => {
    setCleanLoading(true);
    setCleanMsg(null);
    try {
      const params = new URLSearchParams({ action });
      if (column)    params.append('column', column);
      if (fillValue) params.append('fill_value', fillValue);
      const res    = await fetch(`${BACKEND}/clean?${params}`, { method:'POST' });
      const result = await res.json();
      if (result.status === 'success') {
        showCleanMsg({ type:'success', text: result.message });
        setData(prev => {
          if (!prev) return prev;
          // Derive updated preview locally since backend may not resend it
          let updatedPreview = prev.preview || [];
          if (action === 'drop_column' && column) {
            updatedPreview = updatedPreview.map(row => {
              const { [column]: _omit, ...rest } = row;
              return rest;
            });
          }
          if (action === 'fill_missing' && column && fillValue) {
            updatedPreview = updatedPreview.map(row =>
              (row[column] === null || row[column] === undefined || row[column] === '')
                ? { ...row, [column]: fillValue }
                : row
            );
          }
          return {
            ...prev,
            preview: updatedPreview,
            summary: {
              ...prev.summary,
              total_rows:       result.rows         ?? prev.summary.total_rows,
              duplicate_count:  action === 'remove_duplicates' ? 0 : prev.summary.duplicate_count,
              columns:          action === 'drop_column' && column
                                  ? prev.summary.columns.filter(c => c !== column)
                                  : prev.summary.columns,
              missing_info:     action === 'fill_missing' && column
                                  ? Object.fromEntries(Object.entries(prev.summary.missing_info||{}).filter(([k]) => k !== column))
                                  : prev.summary.missing_info,
            },
          };
        });
        // Also update localRows if they exist
        if (localRows && action === 'drop_column' && column) {
          setLocalRows(prev => prev.map(row => { const { [column]: _omit, ...rest } = row; return rest; }));
        }
        if (localRows && action === 'fill_missing' && column && fillValue) {
          setLocalRows(prev => prev.map(row =>
            (row[column] === null || row[column] === undefined || row[column] === '')
              ? { ...row, [column]: fillValue } : row
          ));
        }
      } else {
        showCleanMsg({ type:'error', text: result.message });
      }
    } catch {
      showCleanMsg({ type:'error', text:'Backend unreachable. If this is your first request, the server may be waking up — try again in 30 seconds.' });
    } finally {
      setCleanLoading(false);
    }
  };

  const exportReport = async () => {
    if (!data) return; setIsExporting(true);
    try {
      const s=data.summary, ins=s.insights||[], cs=s.col_stats||{}, mi=s.missing_info||{}, dup=s.duplicate_count||0;
      const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>RAWW Report</title>
<style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}body{background:#fff;color:#111;padding:48px}.logo{font-size:48px;font-weight:900;color:#7C3AED}.sub{font-size:12px;color:#999;text-transform:uppercase;letter-spacing:4px;margin-top:4px}.meta{font-size:11px;color:#666;margin-top:12px;border-bottom:3px solid #7C3AED;padding-bottom:24px;margin-bottom:36px}.sec{margin-bottom:36px}.st{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#7C3AED;margin-bottom:16px;border-left:3px solid #7C3AED;padding-left:12px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px}.cl{font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700}.cv{font-size:28px;font-weight:900;color:#0f172a;margin-top:4px}.ins{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9}.in{font-size:10px;font-weight:900;color:#7C3AED;min-width:24px}.it{font-size:13px;color:#334155;line-height:1.6;font-style:italic}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;border-bottom:2px solid #e2e8f0}td{padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#334155}.b{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase}.bn{background:#ede9fe;color:#6d28d9}.bc{background:#f3e8ff;color:#7c3aed}.bw{background:#fef3c7;color:#d97706}.bg{background:#dcfce7;color:#15803d}.foot{margin-top:48px;padding-top:24px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}</style></head><body>
<div class="meta"><div class="logo">RAWW</div><div class="sub">Your Data Interpreter — Analysis Report</div><div style="font-size:11px;color:#666;margin-top:12px">Generated ${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · Operator: ${userName||'Anonymous'}</div></div>
<div class="sec"><div class="st">Dataset Overview</div><div class="grid"><div class="card"><div class="cl">Total Rows</div><div class="cv">${s.total_rows?.toLocaleString()}</div></div><div class="card"><div class="cl">Columns</div><div class="cv">${s.columns?.length}</div></div><div class="card"><div class="cl">Numeric</div><div class="cv" style="color:#7C3AED">${s.columns?.filter(c=>s.types?.[c]==='Numeric').length}</div></div><div class="card"><div class="cl">Duplicates</div><div class="cv" style="color:${dup>0?'#ef4444':'#10b981'}">${dup}</div></div></div></div>
<div class="sec"><div class="st">Automated Insights</div>${ins.map((t,i)=>`<div class="ins"><span class="in">0${i+1}</span><span class="it">${t}</span></div>`).join('')}</div>
<div class="sec"><div class="st">Column Statistics</div><table><thead><tr><th>Column</th><th>Type</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std Dev</th><th>Missing</th></tr></thead><tbody>${s.columns?.map(col=>{const st=cs[col],miss=mi[col],type=s.types?.[col];return`<tr><td><strong>${col}</strong></td><td><span class="b ${type==='Numeric'?'bn':'bc'}">${type}</span></td><td>${st?st.mean:'—'}</td><td>${st?st.median:'—'}</td><td>${st?st.min:'—'}</td><td>${st?st.max:'—'}</td><td>${st?st.std:'—'}</td><td><span class="b ${miss?.pct>10?'bw':'bg'}">${miss?miss.pct+'%':'0%'}</span></td></tr>`;}).join('')}</tbody></table></div>
<div class="foot"><span>RAWW — Your Data Interpreter</span><span>raww121.vercel.app</span></div>
</body></html>`;
      const win=window.open(URL.createObjectURL(new Blob([html],{type:'text/html'})),'_blank');
      if(win) win.onload=()=>setTimeout(()=>win.print(),500);
    } finally { setIsExporting(false); }
  };

  const filteredRows = useMemo(() => {
    let result = data?.preview || [];
    if (searchQuery) result = result.filter(row => Object.values(row||{}).some(v => v!=null && String(v).toLowerCase().includes(searchQuery.toLowerCase())));
    if (sortCol) result = [...result].sort((a,b) => { const av=parseFloat(a[sortCol])||a[sortCol]||'', bv=parseFloat(b[sortCol])||b[sortCol]||''; return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1); });
    return result;
  }, [data, searchQuery, sortCol, sortDir]);

  const pagedRows  = useMemo(() => filteredRows.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE), [filteredRows, page]);
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const handleSort = (col) => { if (sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortCol(col); setSortDir('asc'); } setPage(0); };

  const dynamicStats = useMemo(() => {
    if (!data?.summary?.columns) return {};
    const stats = {};
    data.summary.columns.forEach(col => {
      const vals = filteredRows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      if (vals.length > 0) {
        const s = [...vals].sort((a,b)=>a-b), mean = vals.reduce((a,b)=>a+b,0)/vals.length;
        stats[col] = { mean, median:s[Math.floor(s.length/2)], min:Math.min(...vals), max:Math.max(...vals), std:Math.sqrt(vals.map(v=>Math.pow(v-mean,2)).reduce((a,b)=>a+b,0)/vals.length) };
      }
    });
    return stats;
  }, [filteredRows, data]);

  const chartData = useMemo(() => {
    if (!vizX||!vizY||!data?.preview) return [];
    return data.preview.map(d=>({x:parseFloat(d[vizX]),y:parseFloat(d[vizY]),name:String(d[vizX])})).filter(d=>!isNaN(d.x)&&!isNaN(d.y)).slice(0,50);
  }, [vizX, vizY, data]);

  const histogramData = useMemo(() => {
    if (!vizY||!data?.preview) return [];
    const vals = data.preview.map(d=>parseFloat(d[vizY])).filter(v=>!isNaN(v));
    if (!vals.length) return [];
    const min=Math.min(...vals), max=Math.max(...vals), bins=10, size=(max-min)/bins;
    const b = Array.from({length:bins},(_,i)=>({range:`${(min+i*size).toFixed(1)}–${(min+(i+1)*size).toFixed(1)}`,count:0}));
    vals.forEach(v=>{ const idx=Math.min(Math.floor((v-min)/size),bins-1); b[idx].count++; });
    return b;
  }, [vizY, data]);

  const pieData = useMemo(() => {
    if (!vizY||!data?.preview) return [];
    const isNum = data?.summary?.types?.[vizY]==='Numeric';
    if (isNum) return chartData.slice(0,8).map((d,i)=>({name:`Row ${i+1}`,value:Math.abs(d.y)}));
    const freq = {};
    data.preview.forEach(d=>{ const v=d[vizY]; if(v) freq[v]=(freq[v]||0)+1; });
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({name,value}));
  }, [vizY, chartData, data]);

  const suggestedCharts = useMemo(() => {
    if (!vizX||!vizY||!data?.summary) return [];
    const xT=data.summary.types?.[vizX], yT=data.summary.types?.[vizY];
    if (xT==='Numeric'&&yT==='Numeric') return ['scatter','line','area'];
    if (xT==='Categorical') return ['bar','pie','donut'];
    return ['bar','line'];
  }, [vizX, vizY, data]);

  const tooltipStyle = { backgroundColor:'#0E0E1A', border:'1px solid #2D2D4E', borderRadius:'10px', fontSize:'10px' };
  const axisStyle    = { stroke:'#2D2D4E', fontSize:10 };

  const renderChart = (type) => {
    const ci=CHART_TYPES.find(c=>c.id===type), noData=chartData.length===0;
    return (
      <div key={type} className="bg-[#0E0E1A] border border-white/8 p-5 md:p-7 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{ci.emoji}</span>
          <div>
            <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider mb-0.5">Chart</p>
            <h3 className="text-base font-bold text-white">{ci.label}</h3>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[9px] font-mono text-slate-600 hidden sm:block">{vizX} → {vizY}</span>
            <button onClick={()=>openHelp(ci.label,[{heading:'What this chart shows',body:CHART_EXPLANATIONS[type]},{heading:'Your current data',body:datasetForViz(data?.summary,vizX,vizY,selectedCharts)}])} className="text-slate-600 hover:text-violet-400 transition-colors"><HelpCircle size={14}/></button>
          </div>
        </div>
        {noData ? (
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
            <p className="text-slate-600 text-xs text-center px-4">No numeric data for selected axes</p>
          </div>
        ) : (
          <div style={{height:'290px'}}>
            <ResponsiveContainer width="100%" height="100%">
              {type==='scatter'?(
                <ScatterChart margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e"/><XAxis dataKey="x" type="number" {...axisStyle} label={{value:vizX,position:'insideBottom',offset:-15,fill:'#7C3AED',fontSize:10}}/><YAxis dataKey="y" type="number" {...axisStyle} label={{value:vizY,angle:-90,position:'insideLeft',fill:'#fff',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Scatter data={chartData} fill="#7C3AED" fillOpacity={0.7}/></ScatterChart>
              ):type==='bar'?(
                <BarChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false}/><XAxis dataKey="x" {...axisStyle} label={{value:vizX,position:'insideBottom',offset:-15,fill:'#7C3AED',fontSize:10}}/><YAxis {...axisStyle} label={{value:vizY,angle:-90,position:'insideLeft',fill:'#fff',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="y" fill="#7C3AED" radius={[4,4,0,0]}/></BarChart>
              ):type==='line'?(
                <LineChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false}/><XAxis dataKey="x" {...axisStyle} label={{value:vizX,position:'insideBottom',offset:-15,fill:'#7C3AED',fontSize:10}}/><YAxis {...axisStyle} label={{value:vizY,angle:-90,position:'insideLeft',fill:'#fff',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Line type="monotone" dataKey="y" stroke="#7C3AED" strokeWidth={2} dot={false}/></LineChart>
              ):type==='area'?(
                <AreaChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/><stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false}/><XAxis dataKey="x" {...axisStyle} label={{value:vizX,position:'insideBottom',offset:-15,fill:'#7C3AED',fontSize:10}}/><YAxis {...axisStyle} label={{value:vizY,angle:-90,position:'insideLeft',fill:'#fff',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="y" stroke="#7C3AED" strokeWidth={2} fill="url(#aG)"/></AreaChart>
              ):type==='histogram'?(
                <BarChart data={histogramData} margin={{top:20,right:20,bottom:40,left:20}}><CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false}/><XAxis dataKey="range" {...axisStyle} angle={-30} textAnchor="end" interval={0} tick={{fontSize:8,fill:'#444'}}/><YAxis {...axisStyle} label={{value:'Frequency',angle:-90,position:'insideLeft',fill:'#fff',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="count" fill="#A78BFA" radius={[4,4,0,0]}/></BarChart>
              ):type==='pie'?(
                <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:'#2D2D4E'}}>{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:'10px',color:'#666',paddingTop:'16px'}}/></PieChart>
              ):type==='radar'?(
                <RadarChart data={chartData.slice(0,10)} cx="50%" cy="50%" outerRadius={90}><PolarGrid stroke="#1a1a2e"/><PolarAngleAxis dataKey="x" tick={{fill:'#444',fontSize:9}}/><PolarRadiusAxis tick={{fill:'#444',fontSize:8}}/><Radar dataKey="y" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.3}/><Tooltip contentStyle={tooltipStyle}/></RadarChart>
              ):type==='donut'?(
                <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:'10px',color:'#666',paddingTop:'16px'}}/></PieChart>
              ):type==='stacked'?(
                <BarChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false}/><XAxis dataKey="x" {...axisStyle}/><YAxis {...axisStyle}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="y" stackId="a" fill="#7C3AED" radius={[0,0,0,0]}/><Bar dataKey="x" stackId="a" fill="#A78BFA" radius={[4,4,0,0]}/></BarChart>
              ):(
                <LineChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false}/><XAxis dataKey="x" {...axisStyle} label={{value:vizX,position:'insideBottom',offset:-15,fill:'#7C3AED',fontSize:10}}/><YAxis {...axisStyle} label={{value:vizY,angle:-90,position:'insideLeft',fill:'#fff',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Line type="stepAfter" dataKey="y" stroke="#06b6d4" strokeWidth={2} dot={false}/></LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const UploadZone = () => (
    <label className={`group block w-full border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer p-10 md:p-14 ${isDragOver?'drag-over':'border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/[0.03]'}`}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-105">
          {isProcessing ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Upload size={22} className="text-white"/>}
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-1">{isProcessing?'Processing…':isDragOver?'Drop files here':'Upload files or drag & drop'}</p>
          <p className="text-slate-500 text-xs">CSV · Excel · JSON · TSV · JPG · PNG · PDF · and more</p>
          <p className="text-slate-600 text-[10px] mt-1">Multiple files supported · Paste from clipboard (Ctrl+V)</p>
        </div>
      </div>
      <input type="file" className="hidden" onChange={handleFileUpload} accept={ACCEPTED_TYPES} multiple disabled={isProcessing}/>
    </label>
  );

  /* ── Table Editor helpers (stable references via useCallback) ─── */
  const editRows = localRows || data?.preview || [];
  const editCols = data?.summary?.columns || [];

  const toggleRow      = useCallback((i) => setSelectedRows(prev => { const n=new Set(prev); n.has(i)?n.delete(i):n.add(i); return n; }), []);
  const toggleAllRows  = useCallback(() => setSelectedRows(prev => prev.size===editRows.length&&editRows.length>0 ? new Set() : new Set(editRows.map((_,i)=>i))), [editRows]);
  const startEdit      = useCallback((ri, col) => { setEditingCell({ri,col}); setEditingValue(String(editRows[ri]?.[col]??'')); }, [editRows]);
  const commitEdit     = useCallback(() => {
    if (!editingCell) return;
    const {ri,col} = editingCell;
    const updated = [...editRows]; updated[ri]={...updated[ri],[col]:editingValue};
    setLocalRows(updated); setEditingCell(null);
  }, [editingCell, editingValue, editRows]);

  const deleteSelectedRows = useCallback(() => {
    setLocalRows(editRows.filter((_,i)=>!selectedRows.has(i)));
    setSelectedRows(new Set());
    setConfirmDropRows(false);
  }, [editRows, selectedRows]);

  const duplicateSelectedRows = useCallback(() => {
    const dupes = [...selectedRows].sort((a,b)=>a-b).map(i=>({...editRows[i]}));
    setLocalRows([...editRows, ...dupes]);
  }, [editRows, selectedRows]);

  /* FIX 5: copySelectedToClipboard — explicit '\t' and '\n' instead of embedded literal chars */
  const copySelectedToClipboard = useCallback(() => {
    const sel = [...selectedRows].sort((a,b)=>a-b).map(i=>editRows[i]);
    if (!sel.length) return;
    const text = [
      editCols.join('\t'),
      ...sel.map(r => editCols.map(c => r[c]??'').join('\t'))
    ].join('\n');
    navigator.clipboard.writeText(text)
      .then(() => showCleanMsg({type:'success', text:'Copied to clipboard — paste into Excel or Sheets'}))
      .catch(() => showCleanMsg({type:'error', text:'Clipboard access denied by browser'}));
  }, [selectedRows, editRows, editCols, showCleanMsg]);

  const runCalc = useCallback(() => {
    if (!calcCol) return;
    const vals = editRows.map(r=>parseFloat(r[calcCol])).filter(v=>!isNaN(v));
    let res;
    if      (calcOp==='sum')   res = vals.reduce((a,b)=>a+b, 0);
    else if (calcOp==='avg')   res = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
    else if (calcOp==='min')   res = Math.min(...vals);
    else if (calcOp==='max')   res = Math.max(...vals);
    else if (calcOp==='count') res = vals.length;
    else if (calcOp==='pct')  { const sc=parseFloat(calcScalar)||0; res = vals.map(v=>((v/sc)*100).toFixed(2)+'%').join(', '); }
    else if (calcOp==='mul')  { const sc=parseFloat(calcScalar)||1; res = vals.map(v=>(v*sc).toFixed(4)).join(', '); }
    else if (calcOp==='div')  { const sc=parseFloat(calcScalar)||1; res = vals.map(v=>(v/sc).toFixed(4)).join(', '); }
    else if (calcOp==='sub')  { const sc=parseFloat(calcScalar)||0; res = vals.map(v=>(v-sc).toFixed(4)).join(', '); }
    setCalcResult(res);
  }, [calcCol, calcOp, calcScalar, editRows]);

  const applyCalcToCol = useCallback(() => {
    if (!calcCol || !['mul','div','sub'].includes(calcOp)) return;
    const sc = parseFloat(calcScalar) || 1;
    const updated = editRows.map(r => {
      const v = parseFloat(r[calcCol]);
      if (isNaN(v)) return r;
      const nv = calcOp==='mul' ? v*sc : calcOp==='div' ? v/sc : v-sc;
      return { ...r, [calcCol]: parseFloat(nv.toFixed(6)) };
    });
    setLocalRows(updated);
    showCleanMsg({type:'success', text:`Applied ${calcOp} by ${sc} on column "${calcCol}"`});
  }, [calcCol, calcOp, calcScalar, editRows, showCleanMsg]);

  const TAB_HEADINGS = { overview:'Dashboard', regression:'Regression Analysis', visuals:'Visual Studio', clean:'Data Cleaning', history:'Upload History' };

  /* ════════ PROMO ════════════════════════════════════════════════ */
  if (!isWelcomed && introStage==='promo') return (
    <div className="min-h-screen bg-[#06060F] text-white flex flex-col overflow-hidden">
      <style>{glowKeyframes}</style>
      <div className="pointer-events-none absolute inset-0"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-violet-900/20 blur-[140px]"/></div>
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 fu1">
        <div className="flex items-center gap-3"><RawwMark size={36}/><span className="text-base font-bold text-white tracking-tight">RAWW</span></div>
        <button onClick={()=>setIntroStage('onboard')} className="text-xs font-semibold text-slate-400 hover:text-white border border-white/10 px-4 py-2 rounded-lg transition-all">Get Started →</button>
      </nav>
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-14 md:pt-20 pb-20 max-w-3xl mx-auto flex-1">
        <div className="fu1 inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400"/>
          <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest">Your Data Interpreter</span>
        </div>
        <h1 className="fu2 text-5xl md:text-7xl font-black text-white leading-none tracking-tight mb-2">RAWW</h1>
        <p className="fu2 text-lg md:text-xl text-violet-300 font-light mb-6 tracking-wide">Your Data Interpreter</p>
        <p className="fu3 text-slate-400 text-base max-w-xl leading-relaxed mb-3">Upload any dataset — CSV, Excel, JSON, images, or TSV — and get instant statistics, correlations, regression analysis, and beautiful visualisations.</p>
        <p className="fu3 text-slate-500 text-sm max-w-md leading-relaxed mb-10">RAWW processes your files through a secure backend and returns professional-grade analysis in seconds. No code, no setup, no account needed.</p>
        <div className="fu4 flex flex-wrap justify-center gap-2 mb-12">
          {['📊 Auto Statistics','🔗 Correlation Matrix','📈 Linear Regression','🌊 10 Chart Types','⚡ AI Insights','🧹 Data Cleaning','📁 CSV · XLS · JSON · Images'].map(t=>(
            <span key={t} className="text-[10px] font-medium text-slate-500 border border-white/8 px-3 py-1.5 rounded-full bg-white/[0.02]">{t}</span>
          ))}
        </div>
        <div className="fu5 flex flex-col items-center gap-3">
          <button onClick={()=>setIntroStage('onboard')} className="group inline-flex items-center gap-3 bg-violet-600 hover:bg-violet-500 text-white px-10 py-4 rounded-full font-semibold text-sm transition-all shadow-xl shadow-violet-500/25">
            Get Started <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform"/>
          </button>
          <p className="text-slate-600 text-[10px]">No account required · Works in any browser</p>
        </div>
        {uploadHistory.length>0 && (
          <div className="fu5 mt-10 flex items-center gap-3 flex-wrap justify-center">
            <span className="text-[10px] text-slate-600 uppercase font-semibold tracking-widest">Recent:</span>
            {uploadHistory.slice(0,3).map(e=>(
              <button key={e.id} onClick={()=>reloadEntry(e)} className="text-[10px] text-slate-500 hover:text-violet-400 border border-white/5 hover:border-violet-500/30 px-3 py-1.5 rounded-lg transition-all truncate max-w-[120px]">{e.name}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ════════ ONBOARD ══════════════════════════════════════════════ */
  if (!isWelcomed && introStage==='onboard') return (
    <div className="min-h-screen bg-[#06060F] text-white flex flex-col overflow-hidden">
      <style>{glowKeyframes}</style>
      <div className="pointer-events-none absolute inset-0"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-violet-900/15 blur-[130px]"/></div>
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <button onClick={()=>setIntroStage('promo')} className="text-xs font-medium text-slate-500 hover:text-white flex items-center gap-1 transition-colors">← Back</button>
        <div className="flex items-center gap-3"><RawwMark size={32}/><span className="text-sm font-bold text-white">RAWW</span></div>
      </nav>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16 max-w-xl mx-auto w-full">
        <div className="fu1 mb-7 text-center">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Step 1 of 2</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Set up your session</h2>
          <p className="text-slate-500 text-sm mt-2">Give yourself an ID for your exported reports (optional).</p>
        </div>
        <div className="fu2 w-full mb-6">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Your name or ID</label>
          <input type="text" placeholder="e.g. Analyst_01" value={userName} onChange={e=>setUserName(e.target.value)}
            className="w-full bg-[#0E0E1A] border border-white/8 focus:border-violet-500/60 rounded-xl p-3.5 text-center outline-none font-medium text-white placeholder:text-slate-700 transition-all text-sm"/>
        </div>
        <div className="fu3 w-full flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/5"/>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest shrink-0">Step 2 · Upload your data</p>
          <div className="flex-1 h-px bg-white/5"/>
        </div>
        <div className="fu4 w-full"><UploadZone/></div>
        <p className="fu5 text-[10px] text-slate-700 mt-5 text-center">Dashboard stays empty until a file is uploaded</p>
        {uploadHistory.length>0 && (
          <div className="fu5 mt-8 w-full">
            <p className="text-[10px] text-slate-600 uppercase font-semibold tracking-widest mb-3">Or reload a previous session</p>
            <div className="space-y-2">
              {uploadHistory.slice(0,3).map(e=>(
                <button key={e.id} onClick={()=>reloadEntry(e)} className="w-full flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-violet-500/30 px-4 py-3 rounded-xl transition-all">
                  <div className="flex items-center gap-3 truncate"><FileText size={13} className="text-violet-500 shrink-0"/><span className="text-xs font-semibold text-white truncate">{e.name}</span></div>
                  <span className="text-[10px] text-slate-600 ml-2 shrink-0">{e.rows} rows</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════ MAIN DASHBOARD ═══════════════════════════════════════ */
  const numericCols = data?.summary?.columns?.filter(c => data.summary?.types?.[c]==='Numeric') || [];

  return (
    <div className="h-[100dvh] bg-[#06060F] text-slate-300 flex flex-col md:flex-row overflow-hidden" ref={dashboardRef}>
      <style>{glowKeyframes}</style>

      {helpCard && <HelpCard onClose={closeHelp} title={helpCard.title} sections={helpCard.sections}/>}

      {/* FIX: InlineConfirm for drop column — sits at root level, above everything */}
      {confirmDrop && (
        <InlineConfirm
          message={`Drop column "${confirmDrop.col}"? This removes it from the backend session. Re-upload to restore it.`}
          confirmLabel="Drop column"
          confirmColor="#dc2626"
          onConfirm={() => { cleanAction('drop_column', confirmDrop.col); setConfirmDrop(null); }}
          onCancel={() => setConfirmDrop(null)}
        />
      )}

      {/* InlineConfirm for delete rows */}
      {confirmDropRows && (
        <InlineConfirm
          message={`Delete ${selectedRows.size} selected row${selectedRows.size!==1?'s':''}? This affects your local view only — reset edits to undo.`}
          confirmLabel="Delete rows"
          confirmColor="#dc2626"
          onConfirm={deleteSelectedRows}
          onCancel={() => setConfirmDropRows(false)}
        />
      )}

      {cleanMsg && (
        <div className={`fixed top-4 right-4 z-[250] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold
          ${cleanMsg.type==='success'?'bg-green-500/10 border-green-500/30 text-green-400':'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {cleanMsg.type==='success'?<CheckCircle2 size={14}/>:<AlertTriangle size={14}/>} {cleanMsg.text}
        </div>
      )}

      {/* Sidebar */}
      <nav className="w-full md:w-[72px] bg-[#0A0A15] border-t md:border-t-0 md:border-r border-white/5 flex flex-row md:flex-col items-center justify-around md:justify-start py-3 md:py-8 md:gap-5 z-20 order-last md:order-first shrink-0">
        <div className="hidden md:flex mb-3"><RawwMark size={38}/></div>
        {[{id:'overview',icon:<LayoutGrid size={20}/>},{id:'regression',icon:<Microscope size={20}/>},{id:'visuals',icon:<Activity size={20}/>},{id:'clean',icon:<Eraser size={20}/>},{id:'history',icon:<History size={20}/>}].map(({id,icon})=>(
          <button key={id} onClick={()=>setActiveTab(id)} title={TAB_HEADINGS[id]}
            className={`p-3 rounded-xl transition-all ${activeTab===id?'bg-violet-600 text-white shadow-lg shadow-violet-500/20':'text-slate-600 hover:text-slate-300'}`}>
            {icon}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-5 md:p-9 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start mb-7 gap-4 lg:gap-0">
          <div>
            <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-1">{userName||'Anonymous session'}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{TAB_HEADINGS[activeTab]}</h1>
            {data?.summary?.file_type && <span className="mt-1 inline-block text-[10px] text-slate-500 border border-white/5 px-2 py-0.5 rounded-md">{data.summary.file_type} loaded</span>}
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <button onClick={exportReport} disabled={!data||isExporting}
              className="flex-1 lg:flex-none bg-[#0E0E1A] border border-white/8 text-white px-4 py-2.5 rounded-xl font-semibold text-xs hover:bg-violet-600 hover:border-violet-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
              <Download size={14}/> {isExporting?'Preparing…':'Export Report'}
            </button>
            <label className="flex-1 lg:flex-none cursor-pointer bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              {isProcessing?'Uploading…':'Upload New'}
              <input type="file" className="hidden" onChange={handleFileUpload} accept={ACCEPTED_TYPES} multiple/>
            </label>
          </div>
        </header>

        {!data && activeTab!=='history' && <div className="max-w-lg mx-auto py-8"><UploadZone/></div>}

        {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
        {data && activeTab==='overview' && (
          <div className="space-y-6 pb-20">
            {(data.summary?.duplicate_count>0||Object.values(data.summary?.missing_info||{}).some(m=>m.pct>10)) && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
                <AlertTriangle size={14} className="text-amber-400 shrink-0"/>
                {data.summary.duplicate_count>0&&<span className="text-amber-300 text-xs font-medium">{data.summary.duplicate_count} duplicate rows — <button onClick={()=>setActiveTab('clean')} className="underline hover:text-white transition-colors">go to Data Cleaning</button></span>}
                {Object.entries(data.summary.missing_info||{}).filter(([,v])=>v.pct>10).map(([col,info])=>(
                  <span key={col} className="text-amber-300 text-xs font-medium">{col}: {info.pct}% missing</span>
                ))}
              </div>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-[#0E0E1A] border border-white/8 p-6 md:p-8 rounded-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Zap className="text-violet-400" size={15}/> Insight Report</h3>
                  <HelpBtn onClick={()=>openHelp('Insight Report',[
                    {heading:'What is the Insight Report?',body:'The Insight Report is automatically generated the moment you upload your dataset. RAWW scans every column and surfaces the most noteworthy findings as plain-English observations.'},
                    {heading:'About this dataset',body:datasetOverview(data?.summary)},
                  ])}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {data.summary?.insights?.map((insight,idx)=>(
                    <div key={idx} className="flex gap-3 items-start border-l-2 border-violet-500/25 pl-3 py-1">
                      <span className="text-violet-500 font-bold text-[10px] mt-0.5 shrink-0">0{idx+1}</span>
                      <p className="text-slate-400 text-xs leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0E0E1A] border border-violet-500/20 p-6 rounded-2xl">
                <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Share2 size={13}/> Column Relations</h3>
                <div className="space-y-4">
                  {data.summary?.system_relations?.map((rel,i)=>(
                    <div key={i} className="border-b border-white/5 pb-3 last:border-0">
                      <p className="text-[10px] text-slate-500 mb-0.5 truncate">{rel.colA} + {rel.colB}</p>
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-slate-400">{rel.strength>0?'Positive':'Negative'}</span>
                        <span className="text-violet-400 font-bold text-lg leading-none">{(rel.strength*100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Feature cards */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-4">Explore your data</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {OVERVIEW_FEATURES.map(f=>(
                  <button key={f.id} onClick={()=>setActiveFeature(activeFeature===f.id?null:f.id)}
                    className={`text-left p-5 rounded-2xl border transition-all ${activeFeature===f.id?'bg-violet-600/15 border-violet-500/60':'bg-[#0E0E1A] border-white/5 hover:border-violet-500/30'}`}>
                    <div className="mb-3">{f.icon}</div>
                    <p className="text-sm font-semibold text-white mb-1">{f.label}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
                    <div className={`mt-3 text-[10px] font-semibold transition-colors ${activeFeature===f.id?'text-violet-400':'text-slate-600'}`}>{activeFeature===f.id?'▲ Collapse':'▼ Open'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Missing values */}
            {activeFeature==='missing' && data.summary?.missing_info && (
              <section className="bg-[#0E0E1A] border border-white/8 p-6 rounded-2xl card-in">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><AlertTriangle className="text-amber-400" size={15}/> Missing Values</h3>
                  <HelpBtn onClick={()=>openHelp('Missing Values',[
                    {heading:'What are missing values?',body:'Missing values are cells where no data was recorded — from data entry errors, sensor failures, or optional fields.'},
                    {heading:'What can I do?',body:'Go to the Data Cleaning tab to fill missing values with the column mean, median, or "Unknown", or to drop the column entirely.'},
                  ])}/>
                </div>
                {Object.keys(data.summary.missing_info).length===0 ? (
                  <div className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-green-400"/><p className="text-green-400 text-xs font-medium">No missing values in this dataset.</p></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(data.summary.missing_info).map(([col,info])=>(
                      <div key={col} className="bg-black/30 rounded-xl p-4">
                        <p className="text-[10px] text-slate-500 font-medium mb-1 truncate">{col}</p>
                        <p className={`text-xl font-bold ${info.pct>20?'text-red-400':info.pct>5?'text-amber-400':'text-green-400'}`}>{info.pct}%</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{info.count} missing</p>
                        <div className="h-1 bg-white/5 rounded-full mt-2"><div className="h-1 rounded-full" style={{width:`${Math.min(info.pct,100)}%`,background:info.pct>20?'#ef4444':info.pct>5?'#f59e0b':'#10b981'}}/></div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Correlation matrix */}
            {activeFeature==='correlation' && data.summary?.corr_matrix && (
              <section className="bg-[#0E0E1A] border border-white/8 p-6 rounded-2xl card-in">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Sparkles className="text-violet-400" size={15}/> Correlation Matrix</h3>
                  <HelpBtn onClick={()=>openHelp('Correlation Matrix',[
                    {heading:'What is a correlation matrix?',body:'A correlation matrix shows the Pearson r coefficient between every pair of numeric columns. Ranges from −1 (perfect negative) to +1 (perfect positive).'},
                  ])}/>
                </div>
                <div className="overflow-x-auto pb-2">
                  <div style={{display:'inline-block',minWidth:'100%'}}>
                    <div style={{display:'grid',gridTemplateColumns:`90px repeat(${data.summary.corr_matrix.columns.length},1fr)`,gap:4}}>
                      <div/>
                      {data.summary.corr_matrix.columns.map(col=>(
                        <div key={col} style={{fontSize:8,color:'#7C3AED',fontWeight:700,textAlign:'center',padding:'4px 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{col}</div>
                      ))}
                      {data.summary.corr_matrix.columns.map((rowCol,i)=>(
                        <React.Fragment key={rowCol}>
                          <div style={{fontSize:8,color:'#64748b',fontWeight:600,display:'flex',alignItems:'center',paddingRight:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{rowCol}</div>
                          {data.summary.corr_matrix.values[i].map((val,j)=><HeatmapCell key={j} value={val??0}/>)}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 mt-4">
                  <div className="flex items-center gap-2"><div style={{width:12,height:12,background:'rgba(124,58,237,0.7)',borderRadius:3}}/><span className="text-[10px] text-slate-500">Positive</span></div>
                  <div className="flex items-center gap-2"><div style={{width:12,height:12,background:'rgba(239,68,68,0.7)',borderRadius:3}}/><span className="text-[10px] text-slate-500">Negative</span></div>
                  <div className="flex items-center gap-2"><div style={{width:12,height:12,background:'rgba(124,58,237,0.15)',borderRadius:3}}/><span className="text-[10px] text-slate-500">Self (1.0)</span></div>
                </div>
              </section>
            )}

            {/* Raw Data Table */}
            {activeFeature==='rawdata' && (
              <section className="space-y-3 card-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><TableIcon className="text-violet-400" size={15}/> Raw Data Table</h3>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex-1 md:flex-none flex items-center bg-[#0E0E1A] rounded-xl border border-white/8 px-3 py-2">
                      <span className="text-violet-500 font-mono text-[10px] mr-2">$</span>
                      <input type="text" value={searchQuery} onChange={e=>{setSearchQuery(e.target.value);setPage(0);}} placeholder="Filter rows…" className="bg-transparent border-none outline-none text-xs text-white w-full md:w-44 placeholder:text-slate-700"/>
                    </div>
                    {/* Pencil → navigate to Data Cleaning editor */}
                    <button
                      onClick={() => setActiveTab('clean')}
                      title="Edit & format table"
                      className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-violet-300 border border-white/8 hover:border-violet-500/40 bg-[#0E0E1A] hover:bg-violet-500/8 px-3 py-2 rounded-xl transition-all"
                    >
                      <Pencil size={12}/> <span className="hidden sm:inline">Edit Table</span>
                    </button>
                    <HelpBtn onClick={()=>openHelp('Raw Data Table',[
                      {heading:'What is the Raw Data Table?',body:'A direct, unprocessed view of every row in your dataset as parsed by the backend.'},
                      {heading:'Edit Table (pencil icon)',body:'Click the pencil icon to go to Data Cleaning — where you can select rows, edit cells, delete/duplicate rows, copy data, and run numeric calculations like sum, average, multiply, and more.'},
                      {heading:'Sorting & filtering',body:'Click any column header to sort. Use the filter box to search across all columns simultaneously.'},
                    ])}/>
                  </div>
                </div>
                <div className="bg-[#0E0E1A] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-[#0E0E1A] z-10 border-b border-white/8">
                        <tr>{data.summary?.columns?.map(col=>(
                          <th key={col} className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-white/3" onClick={()=>handleSort(col)}>
                            <p className="text-[10px] font-semibold text-violet-400 flex items-center gap-1 mb-0.5">{col}{sortCol===col&&<span>{sortDir==='asc'?'↑':'↓'}</span>}</p>
                            <span className="text-[8px] px-1.5 py-0.5 bg-violet-500/10 rounded text-violet-300 border border-violet-500/15">{data.summary?.types?.[col]||'FEATURE'}</span>
                          </th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-white/4 font-mono text-xs">
                        {pagedRows.map((row,i)=>(
                          <tr key={i} className="hover:bg-white/[0.015]">
                            {data.summary?.columns?.map(col=>{
                              const isCrit=data.summary?.thresholds?.[col]&&parseFloat(row[col])>data.summary.thresholds[col].critical_high;
                              return <td key={col} className={`px-4 py-3 whitespace-nowrap ${isCrit?'text-red-400 bg-red-500/5 glow-cell':'text-slate-400'}`}>{row[col]==null?<span className="text-slate-700 italic">null</span>:String(row[col])}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-white/5 gap-2">
                    <p className="text-[10px] text-slate-600 font-mono">Showing {page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE,filteredRows.length)} of {filteredRows.length}</p>
                    <div className="flex gap-2">
                      <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="text-[10px] text-slate-500 hover:text-white disabled:opacity-30 border border-white/5 px-3 py-1.5 rounded-lg transition-all">← Prev</button>
                      <span className="text-[10px] text-slate-600 px-3 py-1.5">{page+1}/{totalPages}</span>
                      <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)} className="text-[10px] text-slate-500 hover:text-white disabled:opacity-30 border border-white/5 px-3 py-1.5 rounded-lg transition-all">Next →</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Distribution */}
            {activeFeature==='distribution' && (
              <section className="space-y-3 card-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><BarChart2 className="text-violet-400" size={15}/> Column Distribution</h3>
                  <HelpBtn onClick={()=>openHelp('Column Distribution',[
                    {heading:'What is Column Distribution?',body:'Key descriptive statistics for every numeric column — mean, median, min, max, and std dev.'},
                    {heading:'Click to inspect',body:'Click any card for a full Deep Inspection modal with all five statistics.'},
                  ])}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(dynamicStats).map(colName=>(
                    <div key={colName} onClick={()=>setZoomedCol(colName)} className="bg-[#0E0E1A] border border-white/5 p-5 rounded-2xl hover:border-violet-500/30 transition-all cursor-zoom-in group">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs font-semibold text-violet-400 truncate max-w-[80%]">{colName}</p>
                        <Activity size={13} className="text-slate-700 group-hover:text-violet-500 shrink-0"/>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-[10px] text-slate-600 mb-0.5">Mean</p><p className="text-lg font-bold text-white">{dynamicStats[colName].mean.toFixed(2)}</p></div>
                        <div><p className="text-[10px] text-slate-600 mb-0.5">Max</p><p className="text-lg font-bold text-white">{dynamicStats[colName].max.toFixed(2)}</p></div>
                      </div>
                      {data.summary?.missing_info?.[colName]?.pct>0&&<p className="mt-2 text-[10px] text-amber-400">{data.summary.missing_info[colName].pct}% missing</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── VISUALS TAB ──────────────────────────────────────────── */}
        {data && activeTab==='visuals' && (
          <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3 bg-[#0E0E1A] p-2 rounded-xl border border-white/8 w-full md:w-auto">
                <select value={vizX} onChange={e=>setVizX(e.target.value)} className="bg-[#0A0A15] text-xs font-medium text-violet-400 outline-none px-3 py-2.5 border border-white/5 rounded-lg w-full sm:w-auto">
                  <option value="">Select X Axis</option>
                  {data.summary?.columns?.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={vizY} onChange={e=>setVizY(e.target.value)} className="bg-[#0A0A15] text-xs font-medium text-white outline-none px-3 py-2.5 border border-white/5 rounded-lg w-full sm:w-auto">
                  <option value="">Select Y Axis</option>
                  {data.summary?.columns?.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <HelpBtn onClick={()=>openHelp('Visual Studio',[
                {heading:'What is the Visual Studio?',body:'Create any combination of charts. Select X and Y axes then pick one or more chart types.'},
                {heading:'Auto-suggestions',body:'RAWW analyses your column types and suggests the most appropriate chart types.'},
              ])}/>
            </div>
            {suggestedCharts.length>0&&(
              <div className="flex flex-wrap items-center gap-2.5 bg-violet-500/5 border border-violet-500/15 rounded-xl px-4 py-3">
                <Sparkles size={13} className="text-violet-400 shrink-0"/>
                <p className="text-[10px] font-semibold text-violet-400 mr-1">Suggested:</p>
                {suggestedCharts.map(id=>{const c=CHART_TYPES.find(ct=>ct.id===id);return(
                  <button key={id} onClick={()=>!selectedCharts.includes(id)&&toggleChart(id)} className="text-[10px] font-medium text-violet-300 border border-violet-500/25 px-3 py-1.5 rounded-lg hover:bg-violet-500/15 transition-all">{c.emoji} {c.label}</button>
                );})}
              </div>
            )}
            <div className="bg-[#0E0E1A] border border-white/8 p-5 rounded-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <p className="text-xs font-semibold text-slate-400">{selectedCharts.length} chart type{selectedCharts.length!==1?'s':''} selected</p>
                <div className="flex gap-2">
                  <button onClick={()=>setSelectedCharts(CHART_TYPES.map(c=>c.id))} className="text-[10px] font-medium text-violet-400 hover:text-white border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all">Select all</button>
                  <button onClick={()=>setSelectedCharts([])} className="text-[10px] font-medium text-slate-500 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition-all">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                {CHART_TYPES.map(chart=>(
                  <button key={chart.id} onClick={()=>toggleChart(chart.id)}
                    className={`p-3 rounded-xl border transition-all text-left ${selectedCharts.includes(chart.id)?'bg-violet-500/10 border-violet-500 text-white':'bg-black/20 border-white/5 text-slate-500 hover:border-white/15 hover:text-white'}`}>
                    <div className="text-xl mb-1.5">{chart.emoji}</div>
                    <p className="text-[10px] font-semibold truncate">{chart.label}</p>
                    {suggestedCharts.includes(chart.id)&&<div className="text-[8px] text-violet-400 font-medium mt-1">✦ suggested</div>}
                  </button>
                ))}
              </div>
            </div>
            {selectedCharts.length===0&&<div className="text-center py-16 border-2 border-dashed border-white/5 rounded-2xl"><p className="text-slate-600 text-xs">Select chart types above to visualise your data</p></div>}
            {(!vizX||!vizY)&&selectedCharts.length>0&&<div className="text-center py-10 border-2 border-dashed border-violet-500/15 rounded-2xl"><p className="text-violet-500/60 text-xs">Select X and Y axes above to render charts</p></div>}
            {vizX&&vizY&&selectedCharts.length>0&&<div className="space-y-5">{selectedCharts.map(t=>renderChart(t))}</div>}
          </div>
        )}

        {/* ── REGRESSION TAB ───────────────────────────────────────── */}
        {data && activeTab==='regression' && (
          <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3 bg-[#0E0E1A] p-2 rounded-xl border border-white/8 w-full md:w-auto">
                <select value={regX} onChange={e=>{const v=e.target.value;setRegX(v);if(regY&&v)solveRegression(v,regY);}} className="bg-[#0A0A15] text-xs font-medium text-violet-400 outline-none px-3 py-2.5 border border-white/5 rounded-lg w-full sm:w-auto">
                  <option value="">Select X (Independent)</option>
                  {numericCols.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={regY} onChange={e=>{const v=e.target.value;setRegY(v);if(regX&&v)solveRegression(regX,v);}} className="bg-[#0A0A15] text-xs font-medium text-white outline-none px-3 py-2.5 border border-white/5 rounded-lg w-full sm:w-auto">
                  <option value="">Select Y (Dependent)</option>
                  {numericCols.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <HelpBtn onClick={()=>openHelp('Linear Regression',[
                {heading:'What is Linear Regression?',body:'Finds the best-fit line y = mx + b through your data using Ordinary Least Squares.'},
                {heading:'What is Pearson r?',body:'Ranges from −1 to +1. Near ±1 = strong linear relationship. Near 0 = weak or none.'},
                {heading:'What is R²?',body:'The percentage of variance in Y explained by X. R² = 0.81 means X explains 81% of variation in Y.'},
                {heading:'About this dataset',body:datasetForRegression(data?.summary,regX,regY)},
              ])}/>
            </div>
            {regressionResult?.status==='success'&&(
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0E0E1A] border border-white/8 p-5 rounded-2xl"><p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider mb-2">Equation</p><p className="text-xl font-mono text-white">{regressionResult.equation}</p></div>
                <div className="bg-[#0E0E1A] border border-white/8 p-5 rounded-2xl"><p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider mb-2">Pearson r · R²</p><p className="text-xl font-mono text-white">{regressionResult.r?.toFixed(3)} · {regressionResult.r2?.toFixed(3)}</p></div>
                <div className="bg-violet-700 p-5 rounded-2xl shadow-lg shadow-violet-500/20"><p className="text-[10px] text-violet-200 font-semibold uppercase tracking-wider mb-2">Insight</p><p className="text-base font-bold text-white leading-snug">{regressionResult.insight}</p></div>
              </div>
            )}
            {regressionResult?.status==='error'&&<div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl"><p className="text-red-400 font-mono text-xs">Error: {regressionResult.message}</p></div>}
            <div className="bg-[#0E0E1A] border border-white/8 p-5 md:p-8 rounded-2xl" style={{height:'440px'}}>
              {!regX||!regY?(
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                  <Microscope size={36} className="text-slate-800 mb-3"/>
                  <p className="text-slate-600 text-xs text-center">Select X and Y axes above to render the regression plot</p>
                </div>
              ):(
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{top:20,right:20,bottom:40,left:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false}/>
                    <XAxis dataKey="x" type="number" stroke="#2D2D4E" fontSize={10} tickFormatter={v=>v?.toFixed(1)} label={{value:regX,position:'insideBottom',offset:-20,fill:'#7C3AED',fontSize:10,fontWeight:'bold'}}/>
                    <YAxis dataKey="y" type="number" stroke="#2D2D4E" fontSize={10} tickFormatter={v=>v?.toFixed(1)} label={{value:regY,angle:-90,position:'insideLeft',fill:'#fff',fontSize:10,fontWeight:'bold'}}/>
                    <Tooltip cursor={{strokeDasharray:'3 3'}} contentStyle={{backgroundColor:'#0E0E1A',border:'1px solid #2D2D4E',borderRadius:'10px',fontSize:'10px'}}/>
                    <Scatter name="Data Points" data={(regressionResult?.points||[]).map(p=>({x:Number(p.x),y:Number(p.y)}))} fill="#7C3AED" fillOpacity={0.6}/>
                    {regressionResult?.line&&<Scatter name="Regression Line" data={regressionResult.line.map(p=>({x:Number(p.x),y:Number(p.y)}))} line={{stroke:'#fff',strokeWidth:2,strokeDasharray:'5 5'}} shape={()=>null} legendType="none"/>}
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ── CLEAN TAB ────────────────────────────────────────────── */}
        {data && activeTab==='clean' && (
          <div className="space-y-5 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Edit, clean, and format your data. Local edits export to CSV; backend actions update the server session.</p>
                {localRows && <span className="text-[10px] text-violet-400 font-medium mt-1 block">✦ Unsaved local edits active</span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {localRows && (
                  <button onClick={() => { setLocalRows(null); setSelectedRows(new Set()); setEditingCell(null); }}
                    className="text-[10px] font-medium text-slate-500 hover:text-amber-400 border border-white/8 px-3 py-2 rounded-lg transition-all">
                    Reset edits
                  </button>
                )}
                <button onClick={() => {
                  const r = localRows || data.preview || [];
                  const c = data.summary?.columns || [];
                  const csv = [c.join(','), ...r.map(row => c.map(col => `"${row[col]??''}"`).join(','))].join('\n');
                  Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:'raww_edited.csv' }).click();
                }} className="text-[10px] font-medium text-violet-400 border border-violet-500/25 px-3 py-2 rounded-lg hover:bg-violet-500/10 transition-all flex items-center gap-1.5">
                  <Download size={11}/> Export edits
                </button>
                <HelpBtn onClick={() => openHelp('Data Cleaning & Editor',[
                  {heading:'Overview', body:'Combines backend cleaning (remove duplicates, fill nulls, drop columns) with a client-side table editor where you can select rows, edit cells, delete/duplicate rows, copy data, and run numeric calculations.'},
                  {heading:'Row selection', body:'Click the checkbox next to any row to select it. Use the header checkbox to select all. Selected rows are highlighted in violet.'},
                  {heading:'Editing cells', body:'Double-click any cell to enter edit mode. Press Enter or click away to save. Changes are local until you export as CSV.'},
                  {heading:'Column calculations', body:'Sum, Average, Min, Max, Count work on the whole column. Multiply/Divide/Subtract apply a scalar you type — preview the result or click "Apply to column" to rewrite values permanently in the local view.'},
                  {heading:'Backend actions', body:'Remove Duplicates, Fill Missing Values, and Drop Columns send requests to the backend. These persist in the server session. Re-upload your file to undo them.'},
                  {heading:'Backend cold start', body:'If the server is sleeping (Render free tier), the first request may take 30–60 seconds. The loading spinner confirms the request is in flight — please wait.'},
                ])}/>
              </div>
            </div>

            {cleanLoading && (
              <div className="flex items-center gap-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"/>
                <span className="text-violet-400 text-xs font-medium">Sending request to backend — if the server is sleeping this may take up to 60 seconds…</span>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0E0E1A] border border-white/8 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-500 mb-1">Rows (local)</p>
                <p className="text-xl font-bold text-white">{editRows.length.toLocaleString()}</p>
              </div>
              <div className={`bg-[#0E0E1A] border p-4 rounded-2xl ${data.summary?.duplicate_count>0?'border-amber-500/30':'border-white/8'}`}>
                <p className="text-[10px] text-slate-500 mb-1">Duplicates</p>
                <p className={`text-xl font-bold ${data.summary?.duplicate_count>0?'text-amber-400':'text-green-400'}`}>{data.summary?.duplicate_count}</p>
              </div>
              <div className="bg-[#0E0E1A] border border-white/8 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-500 mb-1">Selected</p>
                <p className="text-xl font-bold text-violet-400">{selectedRows.size}</p>
              </div>
            </div>

            {/* Row action toolbar */}
            {selectedRows.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-violet-500/8 border border-violet-500/20 rounded-xl px-4 py-3">
                <span className="text-[10px] font-semibold text-violet-400">{selectedRows.size} row{selectedRows.size!==1?'s':''} selected</span>
                <div className="flex gap-2 ml-auto flex-wrap">
                  <button onClick={copySelectedToClipboard} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"><Copy size={11}/> Copy</button>
                  <button onClick={duplicateSelectedRows} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"><SquareStack size={11}/> Duplicate</button>
                  <button onClick={() => setConfirmDropRows(true)} className="flex items-center gap-1.5 text-[10px] font-semibold text-red-400 border border-red-500/25 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"><Trash2 size={11}/> Delete rows</button>
                </div>
              </div>
            )}

            {/* Editable table */}
            <div className="bg-[#0E0E1A] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <Pencil size={13} className="text-violet-400"/>
                <p className="text-xs font-semibold text-white">Editable Data Table</p>
                <span className="text-[10px] text-slate-600 ml-1">— double-click any cell to edit</span>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#0E0E1A] z-10 border-b border-white/8">
                    <tr>
                      <th className="px-3 py-2.5 w-8">
                        <input type="checkbox"
                          checked={selectedRows.size===editRows.length && editRows.length>0}
                          onChange={toggleAllRows}
                          className="accent-violet-500 cursor-pointer"/>
                      </th>
                      <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-600 w-10">#</th>
                      {editCols.map(col=>(
                        <th key={col} className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-violet-400">{col}</span>
                            <span className="text-[8px] text-slate-700 font-medium">{data.summary?.types?.[col]==='Numeric'?'#':'A'}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 font-mono">
                    {editRows.slice(0, 50).map((row, ri) => (
                      <tr key={ri} className={`transition-colors ${selectedRows.has(ri)?'bg-violet-500/8':'hover:bg-white/[0.012]'}`}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={selectedRows.has(ri)} onChange={() => toggleRow(ri)} className="accent-violet-500 cursor-pointer"/>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-slate-700">{ri+1}</td>
                        {editCols.map(col => (
                          <td key={col} className="px-3 py-2 whitespace-nowrap" onDoubleClick={() => startEdit(ri, col)}>
                            {editingCell?.ri===ri && editingCell?.col===col ? (
                              <input autoFocus value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={e => { if(e.key==='Enter') commitEdit(); if(e.key==='Escape') setEditingCell(null); }}
                                className="bg-[#1a1a2e] border border-violet-500/60 rounded px-2 py-0.5 text-white outline-none w-full min-w-[80px] text-[10px]"/>
                            ) : (
                              <span className={`text-[10px] cursor-text select-text ${row[col]==null?'text-slate-700 italic':'text-slate-400 hover:text-white'}`}>
                                {row[col]==null ? 'null' : String(row[col])}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editRows.length > 50 && (
                <div className="px-4 py-2 border-t border-white/5">
                  <p className="text-[10px] text-slate-600">Showing 50 of {editRows.length} rows. Export CSV to get all rows.</p>
                </div>
              )}
            </div>

            {/* Numeric calculations */}
            {numericCols.length > 0 && (
              <div className="bg-[#0E0E1A] border border-white/8 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator size={14} className="text-violet-400"/>
                  <p className="text-xs font-semibold text-white">Column Calculations</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <select value={calcCol} onChange={e => { setCalcCol(e.target.value); setCalcResult(null); }}
                    className="bg-[#0A0A15] text-xs font-medium text-violet-400 outline-none px-3 py-2 border border-white/5 rounded-lg">
                    <option value="">Select column</option>
                    {numericCols.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={calcOp} onChange={e => { setCalcOp(e.target.value); setCalcResult(null); }}
                    className="bg-[#0A0A15] text-xs font-medium text-white outline-none px-3 py-2 border border-white/5 rounded-lg">
                    <option value="sum">Σ  Sum</option>
                    <option value="avg">∅  Average</option>
                    <option value="min">↓  Min</option>
                    <option value="max">↑  Max</option>
                    <option value="count">#  Count</option>
                    <option value="mul">×  Multiply by scalar</option>
                    <option value="div">÷  Divide by scalar</option>
                    <option value="sub">−  Subtract scalar</option>
                    <option value="pct">%  Percentage of scalar</option>
                  </select>
                  {['mul','div','sub','pct'].includes(calcOp) && (
                    <input type="number" placeholder="Scalar value" value={calcScalar} onChange={e => setCalcScalar(e.target.value)}
                      className="bg-[#0A0A15] text-xs text-white outline-none px-3 py-2 border border-white/5 rounded-lg w-32 placeholder:text-slate-700"/>
                  )}
                  <button onClick={runCalc} disabled={!calcCol}
                    className="text-[10px] font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 rounded-lg transition-all">
                    Calculate
                  </button>
                  {['mul','div','sub'].includes(calcOp) && calcCol && calcScalar && (
                    <button onClick={applyCalcToCol}
                      className="text-[10px] font-semibold text-violet-400 border border-violet-500/25 hover:bg-violet-500/10 px-4 py-2 rounded-lg transition-all">
                      Apply to column
                    </button>
                  )}
                </div>
                {calcResult !== null && (
                  <div className="bg-black/30 rounded-xl px-4 py-3 flex items-start gap-3 mb-4">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider shrink-0 mt-0.5">Result</span>
                    <span className="text-sm font-bold text-violet-300 break-all">
                      {typeof calcResult==='number' ? calcResult.toLocaleString(undefined,{maximumFractionDigits:6}) : calcResult}
                    </span>
                  </div>
                )}
                {/* Quick stats row — always visible when column is selected */}
                {calcCol && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      {op:'sum',   label:'Sum',   icon:<Sigma size={11}/>},
                      {op:'avg',   label:'Avg',   icon:<Hash size={11}/>},
                      {op:'min',   label:'Min',   icon:<Minus size={11}/>},
                      {op:'max',   label:'Max',   icon:<ArrowUpDown size={11}/>},
                      {op:'count', label:'Count', icon:<Hash size={11}/>},
                    ].map(({op, label, icon}) => {
                      const vals = editRows.map(r => parseFloat(r[calcCol])).filter(v => !isNaN(v));
                      if (!vals.length) return null;
                      let v;
                      if      (op==='sum')   v = vals.reduce((a,b)=>a+b,0);
                      else if (op==='avg')   v = vals.reduce((a,b)=>a+b,0)/vals.length;
                      else if (op==='min')   v = Math.min(...vals);
                      else if (op==='max')   v = Math.max(...vals);
                      else if (op==='count') v = vals.length;
                      return (
                        <div key={op} className="bg-black/30 rounded-xl px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">{icon}<span className="text-[9px] font-medium">{label}</span></div>
                          <p className="text-sm font-bold text-white">{typeof v==='number'?v.toLocaleString(undefined,{maximumFractionDigits:4}):v}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Backend: Remove duplicates */}
            {data.summary?.duplicate_count > 0 && (
              <div className="bg-[#0E0E1A] border border-amber-500/20 p-5 rounded-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-amber-400 mb-1">Backend — Remove Duplicates</p>
                    <p className="text-white font-semibold text-sm">{data.summary.duplicate_count} duplicate rows detected</p>
                    <p className="text-slate-500 text-xs mt-1">Permanently removes duplicates from the backend session, keeping the first occurrence of each unique row.</p>
                  </div>
                  <button onClick={() => cleanAction('remove_duplicates')} disabled={cleanLoading}
                    className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-xs px-5 py-2.5 rounded-xl transition-all">
                    Remove Duplicates
                  </button>
                </div>
              </div>
            )}

            {/* Backend: Fill missing */}
            <div className="bg-[#0E0E1A] border border-white/8 p-5 rounded-2xl">
              <p className="text-xs font-semibold text-violet-400 mb-4">Backend — Fill Missing Values</p>
              <div className="space-y-3">
                {data.summary?.columns?.filter(col => (data.summary.missing_info?.[col]?.count||0) > 0).map(col => {
                  const isNum = data.summary.types?.[col]==='Numeric';
                  return (
                    <div key={col} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-black/30 rounded-xl px-4 py-3 gap-3">
                      <div>
                        <p className="text-white font-semibold text-xs truncate max-w-[200px]">{col}</p>
                        <p className="text-[10px] text-amber-400 mt-0.5">{data.summary.missing_info[col].count} missing ({data.summary.missing_info[col].pct}%)</p>
                      </div>
                      <div className="flex gap-2">
                        {isNum ? (
                          <>
                            <button onClick={() => cleanAction('fill_missing', col, 'mean')} disabled={cleanLoading} className="text-[10px] font-semibold text-violet-400 border border-violet-500/25 px-3 py-1.5 rounded-lg hover:bg-violet-500/10 disabled:opacity-50 transition-all">Fill Mean</button>
                            <button onClick={() => cleanAction('fill_missing', col, 'median')} disabled={cleanLoading} className="text-[10px] font-semibold text-purple-400 border border-purple-500/25 px-3 py-1.5 rounded-lg hover:bg-purple-500/10 disabled:opacity-50 transition-all">Fill Median</button>
                          </>
                        ) : (
                          <button onClick={() => cleanAction('fill_missing', col, 'Unknown')} disabled={cleanLoading} className="text-[10px] font-semibold text-slate-400 border border-white/8 px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50 transition-all">Fill "Unknown"</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!data.summary?.columns?.some(col => (data.summary.missing_info?.[col]?.count||0) > 0) && (
                  <div className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-green-400"/><p className="text-green-400 text-xs font-medium">No missing values detected.</p></div>
                )}
              </div>
            </div>

            {/* Backend: Drop columns */}
            <div className="bg-[#0E0E1A] border border-white/8 p-5 rounded-2xl">
              <p className="text-xs font-semibold text-red-400 mb-1">Backend — Drop Columns</p>
              <p className="text-[10px] text-slate-600 mb-4">Permanently removes the column from the backend session. Re-upload to restore.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {data.summary?.columns?.map(col => (
                  <button key={col} onClick={() => setConfirmDrop({col})} disabled={cleanLoading}
                    className="flex items-center justify-between bg-black/20 hover:bg-red-500/10 border border-white/5 hover:border-red-500/25 px-3 py-2.5 rounded-xl transition-all group disabled:opacity-50">
                    <span className="text-xs font-medium text-slate-400 group-hover:text-red-400 truncate max-w-[80%]">{col}</span>
                    <Trash2 size={11} className="text-slate-700 group-hover:text-red-400 shrink-0 ml-1"/>
                  </button>
                ))}
              </div>
            </div>

            {/* Live backend view */}
            <div className="bg-[#0E0E1A] border border-violet-500/15 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-violet-400"/>
                  <p className="text-xs font-semibold text-white">Live Dataset — Backend State</p>
                </div>
                <p className="text-[10px] text-slate-500">{data.summary?.columns?.length} columns · {data.summary?.total_rows?.toLocaleString()} rows</p>
              </div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#0E0E1A] z-10 border-b border-white/8">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-semibold text-slate-600 w-10">#</th>
                      {data.summary?.columns?.map(col=>(
                        <th key={col} className="px-3 py-2 whitespace-nowrap">
                          <span className="text-[10px] font-semibold text-violet-400">{col}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 font-mono">
                    {(data.preview||[]).slice(0,30).map((row,ri)=>(
                      <tr key={ri} className="hover:bg-white/[0.012]">
                        <td className="px-3 py-2 text-[10px] text-slate-700">{ri+1}</td>
                        {data.summary?.columns?.map(col=>(
                          <td key={col} className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-400">
                            {row[col]==null ? <span className="text-slate-700 italic">null</span> : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {(!data.preview||data.preview.length===0)&&(
                      <tr><td colSpan={(data.summary?.columns?.length||0)+1} className="px-3 py-8 text-center text-slate-600 text-xs">No preview data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-2.5 border-t border-white/5">
                <p className="text-[10px] text-slate-600">Showing up to 30 rows. Backend changes (fill, drop, de-dupe) update this view automatically.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ──────────────────────────────────────────── */}
        {activeTab==='history' && (
          <div className="space-y-5 pb-20">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Every dataset uploaded this session is stored here.</p>
              <div className="flex items-center gap-3">
                <HelpBtn onClick={()=>openHelp('Upload History',[
                  {heading:'What is Upload History?',body:'Records every file uploaded this browser session with a snapshot for instant reload.'},
                  {heading:'Session persistence',body:'History is cleared on page refresh. Use Export Report to save your analysis.'},
                ])}/>
                {uploadHistory.length>0 && <button onClick={()=>setUploadHistory([])} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 hover:text-red-400 border border-white/8 px-3 py-2 rounded-lg transition-all"><Trash2 size={11}/> Clear all</button>}
              </div>
            </div>
            {uploadHistory.length===0 && <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl"><p className="text-slate-600 text-xs">No uploads yet this session</p></div>}
            {uploadHistory.map((entry,i)=>(
              <div key={entry.id} className="bg-[#0E0E1A] border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-11 h-11 bg-violet-500/10 rounded-xl flex items-center justify-center shrink-0"><Clock size={17} className="text-violet-500"/></div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate mb-0.5">{entry.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{entry.date} at {entry.time}</span>
                        <span className="text-[8px] text-violet-500 font-semibold border border-violet-500/20 px-1.5 py-0.5 rounded">Session #{uploadHistory.length-i}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto">
                    <button onClick={()=>reloadEntry(entry)} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"><RotateCcw size={11}/> Reload</button>
                    <button onClick={()=>exportEntry(entry)} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white text-xs font-semibold px-4 py-2 rounded-lg border border-white/8 transition-all"><Download size={11}/> CSV</button>
                    <button onClick={()=>deleteEntry(entry.id)} className="flex items-center justify-center text-slate-600 hover:text-red-400 px-3 py-2 rounded-lg border border-white/5 hover:border-red-500/20 transition-all"><Trash2 size={13}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {[{label:'Rows',val:entry.rows?.toLocaleString(),color:'text-white'},{label:'Columns',val:entry.cols,color:'text-white'},{label:'Numeric',val:entry.numericCols,color:'text-violet-400'},{label:'Categorical',val:entry.catCols,color:'text-purple-400'}].map(({label,val,color})=>(
                    <div key={label} className="bg-black/30 rounded-xl px-3 py-2.5"><p className="text-[10px] text-slate-500 mb-0.5">{label}</p><p className={`text-lg font-bold ${color}`}>{val}</p></div>
                  ))}
                </div>
                {entry.quickInsight && <div className="border-t border-white/5 pt-3"><p className="text-[10px] text-slate-600 mb-1 flex items-center gap-1"><Zap size={9} className="text-violet-500"/> Quick Insight</p><p className="text-slate-400 text-xs leading-relaxed">{entry.quickInsight}</p></div>}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Deep Inspection Modal */}
      {zoomedCol && dynamicStats[zoomedCol] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={()=>setZoomedCol(null)}/>
          <div className="w-full max-w-lg bg-[#0E0E1A] border border-white/15 p-7 md:p-10 rounded-2xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <button onClick={()=>setZoomedCol(null)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-1">Deep Inspection</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 break-all">{zoomedCol}</h2>
            {data.summary?.missing_info?.[zoomedCol] && <p className="text-amber-400 text-xs font-medium mb-6">{data.summary.missing_info[zoomedCol].pct}% missing ({data.summary.missing_info[zoomedCol].count} rows)</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-5">
              {[['Mean',dynamicStats[zoomedCol].mean],['Median',dynamicStats[zoomedCol].median],['Std Dev',dynamicStats[zoomedCol].std],['Min',dynamicStats[zoomedCol].min],['Max',dynamicStats[zoomedCol].max]].map(([label,val])=>(
                <div key={label}><p className="text-[10px] text-slate-500 font-medium mb-1">{label}</p><p className="text-2xl font-bold text-white">{val.toFixed(2)}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;