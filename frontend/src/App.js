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

// ─── Design tokens ───────────────────────────────────────────────────────────
// Background: #EEF2F7 (warm off-white parchment)
// Surface: #FFFFFF
// Surface alt: #EDF1F6
// Border: #C8D8F0
// Text primary: #081F5C
// Text secondary: #334EAC
// Text muted: #7096D1
// Accent: #334EAC (dusty slate-blue) — used sparingly
// Accent warm: #7096D1 (dusty tan/brown)
// Danger: #C0392B (muted red)
// Success: #334EAC (muted green)
// Warning: #334EAC (muted amber)
// ─────────────────────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { font-family: 'Inter', sans-serif !important; box-sizing: border-box; }

  body { background: #EEF2F7; }

  @keyframes cardIn {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .card-in { animation: cardIn 0.22s ease forwards; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .fu1 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.0s  both; }
  .fu2 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s  both; }
  .fu3 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.2s  both; }
  .fu4 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.3s  both; }
  .fu5 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.4s  both; }

  .drag-over {
    border-color: #334EAC !important;
    background: rgba(51,78,172,0.05) !important;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #B0C4E4; border-radius: 99px; }

  select option { background-color: #fff !important; color: #081F5C !important; }

  @keyframes pulse-border {
    0%,100% { border-color: rgba(160,64,64,0.4); }
    50%      { border-color: rgba(160,64,64,0.1); }
  }
  .glow-cell { animation: pulse-border 2s infinite; }

  @keyframes col-drop-flash {
    0%   { background: #C0392B; color: #fff; transform: scale(1); }
    30%  { background: #ff6b6b; transform: scale(0.96); }
    60%  { background: #C0392B; opacity: 0.5; }
    100% { background: #C0392B; opacity: 0; transform: scale(0.9); }
  }
  .col-drop-flash { animation: col-drop-flash 0.55s ease forwards; pointer-events: none; }

  @keyframes warn-slide-in {
    from { opacity:0; transform: translateY(-8px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .warn-in { animation: warn-slide-in 0.2s ease forwards; }

  @keyframes save-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(51,78,172,0.35); }
    50%      { box-shadow: 0 0 0 6px rgba(51,78,172,0); }
  }
  .save-pulse { animation: save-pulse 1.4s ease-in-out 2; }
`;

const CHART_TYPES = [
  { id:'scatter',   label:'Scatter Plot' },
  { id:'bar',       label:'Bar Chart' },
  { id:'line',      label:'Line Graph' },
  { id:'area',      label:'Area Chart' },
  { id:'histogram', label:'Histogram' },
  { id:'pie',       label:'Pie Chart' },
  { id:'radar',     label:'Radar Chart' },
  { id:'donut',     label:'Donut Chart' },
  { id:'stacked',   label:'Stacked Bar' },
  { id:'stepped',   label:'Step Line' },
];

const COLORS = ['#334EAC','#E67E22','#27AE60','#E74C3C','#8E44AD','#16A085','#D35400','#2980B9','#C0392B','#1ABC9C'];
const ACCEPTED_TYPES = '.csv,.xlsx,.xls,.json,.tsv,.jpg,.jpeg,.png,.webp,.pdf';
/* RAWW Logo — minimal, monochrome */
const RawwMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="12" fill="#081F5C"/>
    <path d="M22 22 H55 Q72 22 72 40 Q72 52 60 56 L74 78 H60 L47 57 H34 V78 H22 Z M34 34 V46 H53 Q60 46 60 40 Q60 34 53 34 Z" fill="white"/>
  </svg>
);

/* Heatmap Cell — high contrast */
const HeatmapCell = ({ value }) => {
  const abs = Math.abs(value);
  const isPos = value >= 0;
  const isDiag = value === 1;
  const bg = isDiag
    ? '#081F5C'
    : isPos
      ? `rgba(51,78,172,${0.12 + abs * 0.78})`
      : `rgba(160,64,64,${0.12 + abs * 0.78})`;
  const textColor = isDiag ? '#fff' : abs > 0.35 ? '#fff' : '#081F5C';
  return (
    <div style={{
      background: bg, color: textColor,
      borderRadius: 5, padding: '6px 3px',
      fontSize: 10, textAlign: 'center', fontWeight: 700,
      minWidth: 52, minHeight: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: isDiag ? 'none' : '1px solid rgba(0,0,0,0.06)',
    }}>
      {value.toFixed(2)}
    </div>
  );
};

/* Help Card */
const HelpCard = ({ onClose, title, sections, T }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <div className="absolute inset-0 backdrop-blur-sm" style={{background:'rgba(26,25,22,0.4)'}} onClick={onClose} />
    <div className="card-in relative z-10 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden"
         style={{background:T.surface, border:`1px solid ${T.border}`}}>
      <div className="flex items-center justify-between px-6 md:px-8 pt-6 pb-5"
           style={{borderBottom:'1px solid #C8D8F0'}}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:T.surfaceAlt}}>
            <HelpCircle size={14} style={{color:'#334EAC'}} />
          </div>
          <h2 className="text-sm font-semibold" style={{color:'#081F5C'}}>{title}</h2>
        </div>
        <button onClick={onClose} style={{color:'#7096D1'}} className="hover:opacity-70 transition-opacity">
          <X size={18} />
        </button>
      </div>
      <div className="px-6 md:px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
        {sections.map((sec, i) => (
          <div key={i}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color:'#7096D1'}}>{sec.heading}</p>
            <div className="space-y-1.5">
              {(Array.isArray(sec.body) ? sec.body : [sec.body]).map((line, j) => (
                <p key={j} className="text-sm leading-relaxed" style={{color:'#2D3E8A'}}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 md:px-8 pb-6 pt-2">
        <button onClick={onClose}
          className="w-full text-xs font-semibold py-2.5 rounded-xl transition-all"
          style={{background:'#081F5C', color:'#fff'}}>
          Got it
        </button>
      </div>
    </div>
  </div>
);

const HelpBtn = ({ onClick }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 text-[10px] font-medium transition-all shrink-0 px-3 py-2 rounded-lg"
    style={{color:'#7096D1', border:'1px solid #C8D8F0', background:'transparent'}}
    onMouseEnter={e=>{e.currentTarget.style.color='#2D3E8A';e.currentTarget.style.borderColor='#7096D1';}}
    onMouseLeave={e=>{e.currentTarget.style.color='#7096D1';e.currentTarget.style.borderColor='#C8D8F0';}}>
    <HelpCircle size={12} /> <span className="hidden sm:inline">What is this?</span>
  </button>
);

const InlineConfirm = ({ message, confirmLabel = 'Confirm', confirmColor = '#C0392B', onConfirm, onCancel }) => (
  <div style={{ position:'fixed', top:0, right:0, bottom:0, left:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
    <div style={{ position:'absolute', top:0, right:0, bottom:0, left:0, background:'rgba(26,25,22,0.35)', backdropFilter:'blur(4px)' }} onClick={onCancel} />
    <div style={{ position:'relative', zIndex:1, background:'#fff', border:'1px solid #C8D8F0', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'360px', boxShadow:'0 8px 40px rgba(26,25,22,0.12)' }}>
      <p style={{ color:'#081F5C', fontSize:'14px', fontWeight:600, marginBottom:'6px' }}>Confirm action</p>
      <p style={{ color:'#334EAC', fontSize:'12px', lineHeight:'1.6', marginBottom:'20px' }}>{message}</p>
      <div style={{ display:'flex', gap:'10px' }}>
        <button onClick={onCancel} style={{ flex:1, fontSize:'12px', fontWeight:600, color:'#334EAC', border:'1px solid #C8D8F0', background:'transparent', padding:'10px', borderRadius:'10px', cursor:'pointer' }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex:1, fontSize:'12px', fontWeight:600, color:'white', background:confirmColor, border:'none', padding:'10px', borderRadius:'10px', cursor:'pointer' }}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

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
  scatter: 'A scatter plot places each row as a dot at (X, Y). Best for seeing correlations between two numeric variables.',
  bar:     'A bar chart draws one vertical bar per data point. Best when X is categorical and you want to compare values side by side.',
  line:    'A line chart connects points in sequence. Best for showing how a value changes over time or an ordered series.',
  area:    'An area chart is a filled line chart. Emphasises the volume or magnitude of a metric over time.',
  histogram: 'A histogram groups Y values into bins and counts how many data points fall into each. Reveals the shape of a distribution.',
  pie:     'A pie chart shows proportions. Most effective with a small number of categories (under 6).',
  radar:   'A radar chart plots multiple variables on radial axes — ideal for comparing a profile across many dimensions.',
  donut:   'A donut chart is a pie chart with a hollow centre. Easier to read arc lengths than angles. Works best with 3–6 categories.',
  stacked: 'A stacked bar chart shows the contribution of sub-series within each category bar.',
  stepped: 'A step line chart shows values that change abruptly at intervals rather than gradually.',
};

const OVERVIEW_FEATURES = [
  { id:'missing',      icon: <AlertTriangle size={18} style={{color:'#334EAC'}}/>,   label:'Missing Values',     desc:'See which columns have gaps and the severity of the missing data problem.' },
  { id:'correlation',  icon: <GitBranch size={18} style={{color:'#334EAC'}}/>,       label:'Correlation Matrix', desc:'Pearson r heatmap showing how every pair of numeric columns relate.' },
  { id:'rawdata',      icon: <TableIcon size={18} style={{color:'#334EAC'}}/>,       label:'Raw Data Table',     desc:'Filterable, sortable, paginated & editable view of your entire dataset.' },
  { id:'distribution', icon: <BarChart2 size={18} style={{color:'#334EAC'}}/>,       label:'Column Distribution', desc:'Key statistics (mean, median, min, max, std dev) for every numeric column.' },
];

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
  const [droppingCol, setDroppingCol]       = useState(null);
  const [savedMsg, setSavedMsg]             = useState(null);
  const [vizWarning, setVizWarning]         = useState(null);
  const [darkMode, setDarkMode]             = useState(() => { try { return localStorage.getItem('raww_dark')==='1'; } catch { return false; } });

  // ── localStorage persistence ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('raww_profile');
      if (saved) {
        const { name, history } = JSON.parse(saved);
        if (name)    setUserName(name);
        if (history && history.length) {
          // restore snapshots without file blobs
          setUploadHistory(history.map(e => ({ ...e, snapshot: e.snapshot || null })));
        }
      }
    } catch {}
  }, []);

  // Apply dark bg to body so no white flash on scroll overscroll
  useEffect(() => {
    document.body.style.background = darkMode ? '#0F1623' : '#EEF2F7';
    document.body.style.color = darkMode ? '#E8EEFF' : '#081F5C';
  }, [darkMode]);

  const toggleDark = useCallback(() => {
    setDarkMode(d => {
      try { localStorage.setItem('raww_dark', d ? '0' : '1'); } catch {}
      return !d;
    });
  }, []);

  const persistProfile = useCallback((name, history) => {
    try {
      localStorage.setItem('raww_profile', JSON.stringify({
        name,
        history: history.slice(0, 10).map(e => ({
          id: e.id, name: e.name, time: e.time, date: e.date,
          rows: e.rows, cols: e.cols, numericCols: e.numericCols,
          catCols: e.catCols, quickInsight: e.quickInsight, snapshot: e.snapshot
        }))
      }));
    } catch {}
  }, []);
  const PAGE_SIZE = 20;

  const openHelp    = (title, sections) => setHelpCard({ title, sections });
  const closeHelp   = () => setHelpCard(null);
  const toggleChart = (id) => setSelectedCharts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const showCleanMsg = useCallback((msg, ms = 4000) => {
    if (cleanMsgTimer.current) clearTimeout(cleanMsgTimer.current);
    setCleanMsg(msg);
    cleanMsgTimer.current = setTimeout(() => setCleanMsg(null), ms);
  }, []);

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
        persistProfile(userName, [{
          id: Date.now(), name: file.name,
          time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString(),
          rows: result.summary?.total_rows || 0, cols: result.summary?.columns?.length || 0,
          numericCols: result.summary?.columns?.filter(c => result.summary.types?.[c]==='Numeric').length || 0,
          catCols: result.summary?.columns?.filter(c => result.summary.types?.[c]==='Categorical').length || 0,
          quickInsight: result.summary?.insights?.slice(0,2).join(' · ') || '',
          snapshot: result,
        }]);
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
          let updatedPreview = prev.preview || [];
          if (action === 'drop_column' && column) {
            updatedPreview = updatedPreview.map(row => { const { [column]: _omit, ...rest } = row; return rest; });
          }
          if (action === 'fill_missing' && column && fillValue) {
            updatedPreview = updatedPreview.map(row =>
              (row[column] === null || row[column] === undefined || row[column] === '')
                ? { ...row, [column]: fillValue } : row
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
      const numCols=s.columns?.filter(c=>s.types?.[c]==='Numeric')||[];
      const catCols=s.columns?.filter(c=>s.types?.[c]==='Categorical')||[];
      const totalMissing=Object.values(mi).reduce((a,v)=>a+(v.count||0),0);
      const regSection = regressionResult?.status==='success' ? `
        <div class="sec"><div class="st">Regression Analysis</div>
        <div class="grid2">
          <div class="card"><div class="cl">Equation</div><div class="mono">${regressionResult.equation}</div></div>
          <div class="card"><div class="cl">Pearson r</div><div class="cv">${regressionResult.r?.toFixed(4)}</div></div>
          <div class="card"><div class="cl">R²</div><div class="cv">${regressionResult.r2?.toFixed(4)}</div></div>
          <div class="card"><div class="cl">Slope</div><div class="cv">${regressionResult.slope?.toFixed(4)}</div></div>
        </div>
        ${regressionAnalysis ? regressionAnalysis.map(p=>`<p class="para">${p}</p>`).join('') : ''}
        </div>` : '';
      const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>RAWW Report — ${s.file_type||'Dataset'}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;font-family:'Inter',sans-serif}
body{background:#EEF2F7;color:#081F5C;padding:0}
.page{max-width:900px;margin:0 auto;padding:48px}
.cover{background:#1e326b;padding:56px 48px;border-radius:0 0 32px 32px;margin-bottom:40px}
.logo{font-size:52px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1}
.sub{font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:4px;margin-top:6px}
.meta-line{font-size:12px;color:rgba(255,255,255,0.7);margin-top:20px}
.analyst{display:inline-block;background:rgba(255,255,255,0.12);padding:6px 14px;border-radius:20px;font-size:11px;color:#fff;font-weight:600;margin-top:8px}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:0 0 32px}
.kpi{background:#fff;border:1px solid #C8D8F0;border-radius:12px;padding:20px}
.kpi-l{font-size:9px;color:#7096D1;text-transform:uppercase;font-weight:700;letter-spacing:2px;margin-bottom:6px}
.kpi-v{font-size:32px;font-weight:900;color:#081F5C;line-height:1}
.kpi-s{font-size:10px;color:#7096D1;margin-top:2px}
.sec{margin-bottom:40px}
.st{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:4px;color:#7096D1;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #C8D8F0;display:flex;align-items:center;gap:8px}
.st::before{content:'';display:inline-block;width:3px;height:14px;background:#1e326b;border-radius:2px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px}
.card{background:#fff;border:1px solid #C8D8F0;border-radius:10px;padding:16px}
.cl{font-size:9px;color:#7096D1;text-transform:uppercase;font-weight:700;letter-spacing:1px}
.cv{font-size:24px;font-weight:800;color:#081F5C;margin-top:4px}
.mono{font-family:monospace;font-size:13px;font-weight:700;color:#1e326b;margin-top:6px}
.ins{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid #C8D8F0;align-items:flex-start}
.in{font-size:10px;font-weight:800;color:#7096D1;min-width:28px;padding-top:1px}
.it{font-size:13px;color:#2D3E8A;line-height:1.65;font-weight:400}
.para{font-size:13px;color:#2D3E8A;line-height:1.7;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:11.5px}
thead{position:sticky;top:0}
th{background:#1e326b;padding:10px 14px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.7);font-weight:700}
th:first-child{border-radius:6px 0 0 6px}th:last-child{border-radius:0 6px 6px 0}
tr:nth-child(even) td{background:#EEF2F7}
td{padding:10px 14px;border-bottom:1px solid #C8D8F0;color:#2D3E8A;vertical-align:middle}
.b{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:0.5px}
.bn{background:#D0E3FF;color:#334EAC}
.bc{background:#EDF1F6;color:#334EAC}
.bw{background:#FDE8E8;color:#C0392B}
.bg{background:#D0E3FF;color:#1e326b}
.miss-high{color:#C0392B;font-weight:700}
.miss-ok{color:#334EAC}
.miss-bar{display:inline-block;height:4px;border-radius:2px;margin-left:6px;vertical-align:middle}
.corr-pos{color:#1e326b;font-weight:700}
.corr-neg{color:#C0392B;font-weight:700}
.foot{margin-top:56px;padding-top:20px;border-top:2px solid #C8D8F0;font-size:10px;color:#7096D1;display:flex;justify-content:space-between;align-items:center}
.foot-logo{font-size:18px;font-weight:900;color:#1e326b}
@media print{body{background:#fff}.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="page">
<div class="cover">
  <div class="logo">RAWW</div>
  <div class="sub">Data Analysis Report</div>
  <div class="meta-line">Generated ${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
  <div class="analyst">Analyst: ${userName||'Anonymous'}</div>
</div>

<div class="kpi-row">
  <div class="kpi"><div class="kpi-l">Total Rows</div><div class="kpi-v">${s.total_rows?.toLocaleString()}</div><div class="kpi-s">observations</div></div>
  <div class="kpi"><div class="kpi-l">Columns</div><div class="kpi-v">${s.columns?.length}</div><div class="kpi-s">${numCols.length} numeric · ${catCols.length} categorical</div></div>
  <div class="kpi"><div class="kpi-l">Missing Values</div><div class="kpi-v">${totalMissing.toLocaleString()}</div><div class="kpi-s">across ${Object.keys(mi).length} columns</div></div>
  <div class="kpi"><div class="kpi-l">Duplicates</div><div class="kpi-v">${dup}</div><div class="kpi-s">${dup>0?'action recommended':'dataset is clean'}</div></div>
</div>

<div class="sec"><div class="st">Automated Insights</div>${ins.map((t,i)=>`<div class="ins"><span class="in">0${i+1}</span><span class="it">${t}</span></div>`).join('')}</div>

${regSection}

<div class="sec"><div class="st">Column Statistics</div>
<table><thead><tr><th>#</th><th>Column</th><th>Type</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std Dev</th><th>Missing</th></tr></thead>
<tbody>${s.columns?.map((col,idx)=>{
  const st=cs[col],miss=mi[col],type=s.types?.[col];
  const missColor=miss?.pct>20?'miss-high':'miss-ok';
  const barW=miss?Math.min(miss.pct*2,100):0;
  return`<tr><td style="color:#7096D1;font-weight:700">${idx+1}</td><td><strong>${col}</strong></td><td><span class="b ${type==='Numeric'?'bn':'bc'}">${type}</span></td><td>${st?.mean??'—'}</td><td>${st?.median??'—'}</td><td>${st?.min??'—'}</td><td>${st?.max??'—'}</td><td>${st?.std??'—'}</td><td class="${missColor}">${miss?miss.pct+'%':'0%'}<span class="miss-bar" style="width:${barW}px;background:${miss?.pct>20?'#C0392B':'#334EAC'}"></span></td></tr>`;
}).join('')}</tbody></table></div>

<div class="sec"><div class="st">Missing Value Detail</div>
${Object.keys(mi).length===0?'<p class="para">No missing values detected in this dataset.</p>':
`<div class="grid">${Object.entries(mi).map(([col,info])=>`<div class="card"><div class="cl">${col}</div><div class="cv" style="color:${info.pct>20?'#C0392B':'#334EAC'}">${info.pct}%</div><div class="kpi-s">${info.count} missing rows</div></div>`).join('')}</div>`}
</div>

<div class="foot"><div><div class="foot-logo">RAWW</div><div style="margin-top:2px">Your Data Interpreter</div></div><div style="text-align:right"><div>raww121.vercel.app</div><div style="margin-top:2px">Report generated ${new Date().toISOString().split('T')[0]}</div></div></div>
</div>
</body></html>`;
      const win=window.open(URL.createObjectURL(new Blob([html],{type:'text/html'})),'_blank');
      if(win) win.onload=()=>setTimeout(()=>win.print(),800);
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

  const regChartData = useMemo(() => {
    if (!regX||!regY||!data?.preview) return [];
    return data.preview.map(d=>({x:parseFloat(d[regX]),y:parseFloat(d[regY])})).filter(d=>!isNaN(d.x)&&!isNaN(d.y)).slice(0,200);
  }, [regX, regY, data]);

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

  // Chart styling for light theme
  const tooltipStyle = { backgroundColor:T.tooltipBg, border:`1px solid ${T.border}`, borderRadius:'8px', fontSize:'11px', color:T.textPrimary };
  const axisStyle    = { stroke:'#C8D8F0', fontSize:10, fill:'#7096D1' };
  const gridColor    = T.gridColor;
  const accentColor  = T.accent;

  const editRows = useMemo(() => localRows || data?.preview || [], [localRows, data?.preview]);
  const editCols = useMemo(() => data?.summary?.columns || [], [data?.summary?.columns]);

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

  const copySelectedToClipboard = useCallback(() => {
    const sel = [...selectedRows].sort((a,b)=>a-b).map(i=>editRows[i]);
    if (!sel.length) return;
    const text = [editCols.join('\t'), ...sel.map(r => editCols.map(c => r[c]??'').join('\t'))].join('\n');
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

  const saveToLocalStorage = useCallback(() => {
    persistProfile(userName, uploadHistory);
    setSavedMsg('Session saved — name & history will persist on refresh.');
    setTimeout(() => setSavedMsg(null), 4000);
  }, [userName, uploadHistory, persistProfile]);

  // Regression written analysis
  const regressionAnalysis = useMemo(() => {
    if (!regressionResult || regressionResult.status !== 'success') return null;
    const { r, r2, slope, intercept, equation, insight } = regressionResult;
    const absR = Math.abs(r);
    const direction = r > 0 ? 'positive' : 'negative';
    const strength = absR > 0.8 ? 'very strong' : absR > 0.6 ? 'strong' : absR > 0.4 ? 'moderate' : absR > 0.2 ? 'weak' : 'negligible';
    const pctExplained = (r2 * 100).toFixed(1);
    const slopeDir = slope > 0 ? 'increases' : 'decreases';
    const absSlope = Math.abs(slope).toFixed(4);
    return [
      `The regression model for ${regY} ~ ${regX} yields the equation ${equation}. This indicates a ${strength} ${direction} linear relationship between the two variables.`,
      `The Pearson correlation coefficient r = ${r.toFixed(3)} confirms the ${direction} association. The coefficient of determination R² = ${r2.toFixed(3)} tells us that ${pctExplained}% of the variance in ${regY} is explained by ${regX} — ${r2 > 0.7 ? 'a high explanatory power suggesting a meaningful linear dependency' : r2 > 0.4 ? 'a moderate fit indicating some predictive value' : 'a low fit suggesting other variables may be more influential'}.`,
      `For every one-unit increase in ${regX}, ${regY} ${slopeDir} by approximately ${absSlope} units (slope = ${slope.toFixed(4)}). The y-intercept of ${intercept.toFixed(4)} represents the predicted value of ${regY} when ${regX} equals zero.`,
      insight ? `Model insight: ${insight}` : null
    ].filter(Boolean);
  }, [regressionResult, regX, regY]);

  // Viz axis warning
  const getVizWarning = useCallback((x, y, summary) => {
    if (!x && !y) return null;
    if (!x) return { type: 'axis', msg: `Select an X axis to start plotting. Your dataset has ${summary?.columns?.length || 0} available columns.` };
    if (!y) return { type: 'axis', msg: `Select a Y axis to pair with "${x}".` };
    const xT = summary?.types?.[x], yT = summary?.types?.[y];
    if (xT === 'Categorical' && yT === 'Categorical') return { type: 'type', msg: `Both "${x}" and "${y}" are categorical. Consider using a Bar or Pie chart, or switch one axis to a numeric column for richer analysis.` };
    if (xT === 'Numeric' && yT === 'Categorical') return { type: 'type', msg: `"${y}" is categorical on the Y axis — this may produce unexpected results. Try swapping axes or selecting a numeric Y column.` };
    return null;
  }, []);

  // ── Theme tokens (light / dark) ─────────────────────────────────────────
  const T = darkMode ? {
    bg:        '#0F1623',
    surface:   '#1A2236',
    surfaceAlt:'#222E45',
    border:    '#2A3A58',
    borderStrong:'#3A5080',
    textPrimary:'#E8EEFF',
    textSecondary:'#8BAAD4',
    textMuted:  '#4A6490',
    accent:     '#5B7FE8',
    accentDark: '#3A5CC8',
    navy:       '#3A5CC8',
    navyText:   '#fff',
    danger:     '#E05555',
    success:    '#4A9E6F',
    warn:       '#C8A832',
    gridColor:  '#1E2D45',
    tooltipBg:  '#1A2236',
    chip:       '#1E2D45',
  } : {
    bg:         '#EEF2F7',
    surface:    '#FFFFFF',
    surfaceAlt: '#EDF1F6',
    border:     '#C8D8F0',
    borderStrong:'#7096D1',
    textPrimary:'#081F5C',
    textSecondary:'#334EAC',
    textMuted:  '#7096D1',
    accent:     '#334EAC',
    accentDark: '#1e326b',
    navy:       '#1e326b',
    navyText:   '#fff',
    danger:     '#C0392B',
    success:    '#2E7D32',
    warn:       '#8B6914',
    gridColor:  '#C8D8F0',
    tooltipBg:  '#fff',
    chip:       '#EDF1F6',
  };

  const TAB_HEADINGS = { overview:'Dashboard', regression:'Regression', visuals:'Visualise', clean:'Data Cleaning', history:'History' };

  // Shared card style
  const card = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:'16px' };
  const cardAlt = { background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:'16px' };

  const renderChart = (type) => {
    const ci=CHART_TYPES.find(c=>c.id===type), noData=chartData.length===0;
    return (
      <div key={type} style={{...card, padding:'24px 28px'}}>
        <div className="flex items-center gap-3 mb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{color:'#7096D1'}}>Chart</p>
            <h3 className="text-sm font-semibold" style={{color:'#081F5C'}}>{ci.label}</h3>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[9px] font-mono hidden sm:block" style={{color:'#7096D1'}}>{vizX} → {vizY}</span>
            <button onClick={()=>openHelp(ci.label,[{heading:'What this chart shows',body:CHART_EXPLANATIONS[type]},{heading:'Your current data',body:datasetForViz(data?.summary,vizX,vizY,selectedCharts)}])}
              style={{color:'#7096D1'}} className="hover:opacity-60 transition-opacity"><HelpCircle size={13}/></button>
          </div>
        </div>
        {noData ? (
          <div className="h-48 flex items-center justify-center rounded-xl" style={{border:'2px dashed #C8D8F0'}}>
            <p className="text-xs text-center px-4" style={{color:'#7096D1'}}>No numeric data for selected axes</p>
          </div>
        ) : (
          <div style={{height:'280px'}}>
            <ResponsiveContainer width="100%" height="100%">
              {type==='scatter'?(
                <ScatterChart margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor}/><XAxis dataKey="x" type="number" stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}} label={{value:vizX,position:'insideBottom',offset:-15,fill:'#334EAC',fontSize:10}}/><YAxis dataKey="y" type="number" stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}} label={{value:vizY,angle:-90,position:'insideLeft',fill:'#081F5C',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Scatter data={chartData} fill={accentColor} fillOpacity={0.7}/></ScatterChart>
              ):type==='bar'?(
                <BarChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}} label={{value:vizX,position:'insideBottom',offset:-15,fill:'#334EAC',fontSize:10}}/><YAxis stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}} label={{value:vizY,angle:-90,position:'insideLeft',fill:'#081F5C',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="y" fill={accentColor} radius={[3,3,0,0]}/></BarChart>
              ):type==='line'?(
                <LineChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}} label={{value:vizX,position:'insideBottom',offset:-15,fill:'#334EAC',fontSize:10}}/><YAxis stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}} label={{value:vizY,angle:-90,position:'insideLeft',fill:'#081F5C',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Line type="monotone" dataKey="y" stroke={accentColor} strokeWidth={1.5} dot={false}/></LineChart>
              ):type==='area'?(
                <AreaChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={accentColor} stopOpacity={0.2}/><stop offset="95%" stopColor={accentColor} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}}/><YAxis stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}}/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="y" stroke={accentColor} strokeWidth={1.5} fill="url(#aG)"/></AreaChart>
              ):type==='histogram'?(
                <BarChart data={histogramData} margin={{top:20,right:20,bottom:40,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="range" stroke="#7096D1" fontSize={8} tick={{fill:'#7096D1'}} angle={-30} textAnchor="end" interval={0}/><YAxis stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}} label={{value:'Frequency',angle:-90,position:'insideLeft',fill:'#081F5C',fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="count" fill="#7096D1" radius={[3,3,0,0]}/></BarChart>
              ):type==='pie'?(
                <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:'#C8D8F0'}}>{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:'10px',color:'#7096D1',paddingTop:'12px'}}/></PieChart>
              ):type==='radar'?(
                <RadarChart data={chartData.slice(0,10)} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={gridColor}/><PolarAngleAxis dataKey="x" tick={{fill:'#7096D1',fontSize:9}}/><PolarRadiusAxis tick={{fill:'#7096D1',fontSize:8}}/><Radar dataKey="y" stroke={accentColor} fill={accentColor} fillOpacity={0.2}/><Tooltip contentStyle={tooltipStyle}/></RadarChart>
              ):type==='donut'?(
                <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:'10px',color:'#7096D1',paddingTop:'12px'}}/></PieChart>
              ):type==='stacked'?(
                <BarChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}}/><YAxis stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="y" stackId="a" fill={accentColor} radius={[0,0,0,0]}/><Bar dataKey="x" stackId="a" fill="#7096D1" radius={[3,3,0,0]}/></BarChart>
              ):(
                <LineChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}}/><YAxis stroke="#7096D1" fontSize={10} tick={{fill:'#7096D1'}}/><Tooltip contentStyle={tooltipStyle}/><Line type="stepAfter" dataKey="y" stroke="#5F7A68" strokeWidth={1.5} dot={false}/></LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const UploadZone = () => (
    <label
      className={`group block w-full rounded-2xl transition-all duration-200 cursor-pointer p-10 md:p-14 ${isDragOver?'drag-over':''}`}
      style={{ border:`2px dashed ${isDragOver?'#334EAC':'#B0C4E4'}`, background: isDragOver ? 'rgba(51,78,172,0.03)' : 'transparent' }}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
             style={{background:'#081F5C'}}>
          {isProcessing
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            : <Upload size={20} style={{color:'#fff'}}/>}
        </div>
        <div>
          <p className="font-semibold text-sm mb-1" style={{color:'#081F5C'}}>
            {isProcessing ? 'Processing…' : isDragOver ? 'Drop files here' : 'Upload files or drag & drop'}
          </p>
          <p className="text-xs" style={{color:'#7096D1'}}>CSV · Excel · JSON · TSV · JPG · PNG · PDF · and more</p>
          <p className="text-[10px] mt-1" style={{color:'#7096D1'}}>Multiple files supported · Paste from clipboard (Ctrl+V)</p>
        </div>
      </div>
      <input type="file" className="hidden" onChange={handleFileUpload} accept={ACCEPTED_TYPES} multiple disabled={isProcessing}/>
    </label>
  );

  /* ── LANDING PAGE ─────────────────────────────────────────────────────── */
  if (!isWelcomed && introStage==='promo') return (
    <div className="min-h-screen flex flex-col" style={{background:'#EEF2F7', color:'#081F5C', overflowX:'hidden'}}>
      <style>{globalStyles}{`
        .landing-nav-link { font-size:12px; font-weight:500; color:#334EAC; cursor:pointer; transition:color 0.15s; padding:4px 0; border-bottom:1px solid transparent; }
        .landing-nav-link:hover { color:#081F5C; border-bottom-color:#081F5C; }
        .feature-card { transition: transform 0.18s, box-shadow 0.18s; }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(8,31,92,0.10); }
        .step-line::after { content:''; position:absolute; left:19px; top:40px; bottom:-28px; width:1px; background: linear-gradient(#C8D8F0, transparent); }
        @keyframes hero-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .hero-float { animation: hero-float 5s ease-in-out infinite; }
      `}</style>

      {/* ── Sticky Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 py-4"
           style={{background:'rgba(238,242,247,0.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid #C8D8F0'}}>
        <div className="flex items-center gap-3">
          <RawwMark size={30}/>
          <span className="text-sm font-black tracking-tight" style={{color:'#081F5C'}}>RAWW</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <span className="landing-nav-link" onClick={()=>document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>Features</span>
          <span className="landing-nav-link" onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>How it works</span>
          <span className="landing-nav-link" onClick={()=>document.getElementById('formats')?.scrollIntoView({behavior:'smooth'})}>File formats</span>
        </div>
        <button onClick={()=>setIntroStage('onboard')}
          className="text-xs font-bold px-5 py-2.5 rounded-lg transition-all"
          style={{background:'#081F5C', color:'#fff'}}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.82'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
          Get started →
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden" style={{minHeight:'92vh'}}>
        {/* background blobs */}
        <div style={{position:'absolute',top:'-80px',right:'-120px',width:'500px',height:'500px',background:'radial-gradient(circle,rgba(51,78,172,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'-60px',left:'-80px',width:'400px',height:'400px',background:'radial-gradient(circle,rgba(112,150,209,0.07) 0%,transparent 70%)',pointerEvents:'none'}}/>

        <div className="fu1 mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-full"
             style={{background:'#fff', border:'1px solid #C8D8F0', boxShadow:'0 2px 12px rgba(8,31,92,0.06)'}}>
          <div className="w-1.5 h-1.5 rounded-full" style={{background:T.accent}}/>
          <span className="text-[10px] font-bold uppercase tracking-[3px]" style={{color:'#334EAC'}}>Your Data Interpreter</span>
        </div>

        <h1 className="fu2 font-black tracking-tight mb-6 leading-none"
            style={{fontSize:'clamp(52px,10vw,96px)', color:'#081F5C', maxWidth:'800px'}}>
          Turn raw data into<br/>
          <span style={{color:'#334EAC'}}>clear answers.</span>
        </h1>

        <p className="fu3 text-base md:text-lg leading-relaxed mb-4 max-w-xl" style={{color:'#334EAC'}}>
          Upload any dataset and get instant statistics, correlations, regression analysis, and beautiful visualisations — no code, no setup.
        </p>
        <p className="fu3 text-sm leading-relaxed mb-10 max-w-md" style={{color:'#7096D1'}}>
          RAWW processes your files through a secure backend and returns professional-grade analysis in seconds.
        </p>

        <div className="fu4 flex flex-col sm:flex-row items-center gap-3 mb-12">
          <button onClick={()=>setIntroStage('onboard')}
            className="inline-flex items-center gap-2 font-bold text-sm px-8 py-4 rounded-xl transition-all"
            style={{background:'#081F5C', color:'#fff', boxShadow:'0 4px 20px rgba(8,31,92,0.25)'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(8,31,92,0.3)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 20px rgba(8,31,92,0.25)';}}>
            Start analysing free <ArrowRight size={16}/>
          </button>
          <button onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}
            className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-4 rounded-xl transition-all"
            style={{background:'#fff', color:'#334EAC', border:'1px solid #C8D8F0'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#334EAC'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#C8D8F0'}>
            See how it works
          </button>
        </div>

        {/* mini stats bar */}
        <div className="fu5 flex flex-wrap justify-center gap-6 mb-10">
          {[['10+','Chart types'],['30','Column stats'],['Instant','Processing'],['0','Code needed']].map(([n,l])=>(
            <div key={l} className="text-center">
              <p className="text-2xl font-black" style={{color:'#081F5C'}}>{n}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{color:'#7096D1'}}>{l}</p>
            </div>
          ))}
        </div>

        {/* mock dashboard preview */}
        <div className="fu5 hero-float w-full max-w-2xl mx-auto rounded-2xl overflow-hidden"
             style={{background:'#fff', border:'1px solid #C8D8F0', boxShadow:'0 24px 80px rgba(8,31,92,0.12)'}}>
          <div className="flex items-center gap-1.5 px-4 py-3" style={{background:T.accentDark}}>
            {['#F4A0A0','#F5D87A','#90CAF9'].map(c=><div key={c} style={{width:9,height:9,borderRadius:'50%',background:c}}/>)}
            <span className="text-[10px] font-mono ml-2" style={{color:'rgba(255,255,255,0.4)'}}>raww.site — Dashboard</span>
          </div>
          <div className="p-5 grid grid-cols-3 gap-3">
            {[['3,000','Total Rows'],['30','Columns'],['17','Numeric']].map(([v,l])=>(
              <div key={l} className="rounded-xl p-4" style={{background:'#EEF2F7', border:'1px solid #C8D8F0'}}>
                <p className="text-[10px] font-semibold mb-1" style={{color:'#7096D1'}}>{l}</p>
                <p className="text-2xl font-black" style={{color:'#081F5C'}}>{v}</p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <div className="rounded-xl p-4" style={{background:'#EEF2F7', border:'1px solid #C8D8F0'}}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{color:'#7096D1'}}>⚡ Insight Report</p>
              {['Dataset contains 3,000 rows and 30 columns (17 numeric, 13 categorical).','High missing values detected in Alliance_A (32.8%) and Alliance_B (33.1%).','Duration_Days — mean 1003.7, median 999.0, range [2.0–1999.0]'].map((t,i)=>(
                <div key={i} className="flex gap-3 py-2" style={{borderBottom:i<2?'1px solid #C8D8F0':'none'}}>
                  <span className="text-[10px] font-bold shrink-0" style={{color:'#7096D1'}}>0{i+1}</span>
                  <p className="text-[11px] leading-relaxed" style={{color:'#334EAC'}}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {uploadHistory.length>0 && (
          <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
            <span className="text-[10px] uppercase font-bold tracking-widest" style={{color:'#7096D1'}}>Resume:</span>
            {uploadHistory.slice(0,3).map(e=>(
              <button key={e.id} onClick={()=>reloadEntry(e)}
                className="text-[10px] font-semibold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5"
                style={{color:'#334EAC', border:'1px solid #C8D8F0', background:'#fff'}}
                onMouseEnter={ev=>{ev.currentTarget.style.borderColor='#081F5C';ev.currentTarget.style.color='#081F5C';}}
                onMouseLeave={ev=>{ev.currentTarget.style.borderColor='#C8D8F0';ev.currentTarget.style.color='#334EAC';}}>
                <FileText size={10}/> {e.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-6 md:px-16 py-24" style={{background:'#fff', borderTop:'1px solid #C8D8F0', borderBottom:'1px solid #C8D8F0'}}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{color:'#7096D1'}}>What RAWW does</p>
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{color:'#081F5C'}}>Everything you need to<br/>understand your data</h2>
            <p className="text-sm max-w-lg mx-auto" style={{color:'#7096D1'}}>From raw upload to polished report — RAWW handles the analysis so you can focus on the insights.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {icon:'⚡', title:'Instant Insights', desc:'Auto-generated insight report the moment your file lands. Key stats, anomalies, and patterns surface immediately — no configuration.'},
              {icon:'📊', title:'10 Chart Types', desc:'Scatter, bar, line, area, histogram, pie, donut, radar, stacked, and step charts. Smart suggestions based on your column types.'},
              {icon:'📈', title:'Linear Regression', desc:'Full OLS regression with Pearson r, R², slope, intercept, scatter plot, and a plain-English written analysis of the results.'},
              {icon:'🔗', title:'Correlation Matrix', desc:'Pearson heatmap across all numeric columns. Identify relationships and dependencies between variables at a glance.'},
              {icon:'🧹', title:'Data Cleaning', desc:'Fill missing values, remove duplicates, drop columns, edit cells, delete rows, and run column calculations — all in-browser.'},
              {icon:'📄', title:'PDF Export', desc:'One-click professional report with cover page, KPI summary, insight log, regression analysis, and full column statistics.'},
            ].map(f=>(
              <div key={f.title} className="feature-card p-6 rounded-2xl" style={{background:'#EEF2F7', border:'1px solid #C8D8F0'}}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-sm font-bold mb-2" style={{color:'#081F5C'}}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{color:'#7096D1'}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="px-6 md:px-16 py-24" style={{background:'#EEF2F7'}}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{color:'#7096D1'}}>Process</p>
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{color:'#081F5C'}}>Up and running in seconds</h2>
            <p className="text-sm" style={{color:'#7096D1'}}>No installs. No accounts. No waiting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
            {[
              {n:'01', title:'Upload', desc:'Drag & drop or paste any file — CSV, Excel, JSON, image, PDF, or TSV.', icon:'📁'},
              {n:'02', title:'Process', desc:'RAWW sends your file to a secure backend that parses, validates, and analyses every column.', icon:'⚙️'},
              {n:'03', title:'Explore', desc:'Browse insights, visualise with charts, run regression, clean your data — all in one place.', icon:'🔍'},
              {n:'04', title:'Export', desc:'Download a comprehensive PDF report or export cleaned data as CSV.', icon:'📤'},
            ].map((s,i)=>(
              <div key={s.n} className="relative text-center md:text-left">
                {i<3 && <div className="hidden md:block absolute top-5 left-full w-full h-px" style={{background:'linear-gradient(to right, #C8D8F0, transparent)', zIndex:0}}/>}
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 text-xl relative z-10"
                     style={{background:T.accentDark}}>
                  <span>{s.icon}</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{color:'#7096D1'}}>{s.n}</p>
                <h3 className="text-base font-black mb-2" style={{color:'#081F5C'}}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{color:'#7096D1'}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── File formats ── */}
      <section id="formats" className="px-6 md:px-16 py-20" style={{background:'#fff', borderTop:'1px solid #C8D8F0', borderBottom:'1px solid #C8D8F0'}}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{color:'#7096D1'}}>Compatibility</p>
            <h2 className="text-2xl md:text-3xl font-black mb-3" style={{color:'#081F5C'}}>Works with every format you use</h2>
            <p className="text-sm" style={{color:'#7096D1'}}>RAWW accepts structured data, images, and documents.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              {ext:'CSV',   desc:'Comma-separated values',    bg:'#D0E3FF', color:'#081F5C'},
              {ext:'XLSX',  desc:'Excel spreadsheets',        bg:'#D0E3FF', color:'#081F5C'},
              {ext:'JSON',  desc:'Structured JSON data',      bg:'#D0E3FF', color:'#081F5C'},
              {ext:'TSV',   desc:'Tab-separated values',      bg:'#D0E3FF', color:'#081F5C'},
              {ext:'PDF',   desc:'PDF documents',             bg:'#FDE8E8', color:'#C0392B'},
              {ext:'PNG',   desc:'Image files',               bg:'#EDF5E8', color:'#2E7D32'},
              {ext:'JPG',   desc:'JPEG images',               bg:'#EDF5E8', color:'#2E7D32'},
              {ext:'WEBP',  desc:'Modern image format',       bg:'#EDF5E8', color:'#2E7D32'},
            ].map(f=>(
              <div key={f.ext} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                   style={{background:'#EEF2F7', border:'1px solid #C8D8F0', minWidth:'160px'}}>
                <span className="text-xs font-black px-2 py-1 rounded" style={{background:f.bg, color:f.color}}>{f.ext}</span>
                <span className="text-xs" style={{color:'#7096D1'}}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 md:px-16 py-24 text-center" style={{background:T.accentDark}}>
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-4" style={{color:'rgba(255,255,255,0.4)'}}>Ready to start?</p>
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{color:'#fff'}}>Your data is waiting<br/>to tell you something.</h2>
          <p className="text-sm mb-10" style={{color:'rgba(255,255,255,0.55)'}}>Upload your first dataset in under 10 seconds. No signup, no credit card, no code.</p>
          <button onClick={()=>setIntroStage('onboard')}
            className="inline-flex items-center gap-2 font-bold text-sm px-10 py-4 rounded-xl transition-all mb-4"
            style={{background:'#fff', color:'#081F5C'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.2)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
            Analyse my data — it's free <ArrowRight size={16}/>
          </button>
          <p style={{color:'rgba(255,255,255,0.3)', fontSize:'11px'}}>Works in Chrome, Firefox, Safari · No install</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-16 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
              style={{background:'#0d1f4a', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div className="flex items-center gap-3">
          <RawwMark size={24}/>
          <span className="text-xs font-bold" style={{color:'rgba(255,255,255,0.5)'}}>RAWW — Your Data Interpreter</span>
        </div>
        <p className="text-[10px]" style={{color:'rgba(255,255,255,0.25)'}}>No data is stored. Files are processed in-session only.</p>
        <p className="text-[10px]" style={{color:'rgba(255,255,255,0.25)'}}>raww121.vercel.app</p>
      </footer>
    </div>
  );

  /* ── ONBOARDING PAGE ──────────────────────────────────────────────────── */
  if (!isWelcomed && introStage==='onboard') return (
    <div className="min-h-screen flex flex-col" style={{background:'#EEF2F7', color:'#081F5C'}}>
      <style>{globalStyles}</style>
      <nav className="flex items-center justify-between px-6 md:px-14 py-5" style={{borderBottom:'1px solid #C8D8F0'}}>
        <button onClick={()=>setIntroStage('promo')}
          className="text-xs font-medium transition-colors flex items-center gap-1"
          style={{color:'#7096D1'}}
          onMouseEnter={e=>e.currentTarget.style.color='#081F5C'}
          onMouseLeave={e=>e.currentTarget.style.color='#7096D1'}>
          ← Back
        </button>
        <div className="flex items-center gap-2.5">
          <RawwMark size={28}/>
          <span className="text-sm font-bold" style={{color:'#081F5C'}}>RAWW</span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 max-w-lg mx-auto w-full">
        <div className="fu1 mb-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{color:'#7096D1'}}>Step 1 of 2</p>
          <h2 className="text-3xl font-bold tracking-tight mb-2" style={{color:'#081F5C'}}>Set up your session</h2>
          <p className="text-sm" style={{color:'#7096D1'}}>Give yourself an ID for your exported reports (optional).</p>
        </div>

        <div className="fu2 w-full mb-7">
          <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color:'#7096D1'}}>Your name or ID</label>
          <input type="text" placeholder="e.g. Analyst_01" value={userName}
            onChange={e=>setUserName(e.target.value)}
            className="w-full rounded-xl p-3.5 text-center outline-none text-sm transition-all"
            style={{background:'#fff', border:'1px solid #C8D8F0', color:'#081F5C'}}
            onFocus={e=>e.target.style.borderColor='#081F5C'}
            onBlur={e=>e.target.style.borderColor='#C8D8F0'}/>
        </div>

        <div className="fu3 w-full flex items-center gap-4 mb-7">
          <div className="flex-1 h-px" style={{background:'#C8D8F0'}}/>
          <p className="text-[10px] font-semibold uppercase tracking-widest shrink-0" style={{color:'#7096D1'}}>Step 2 · Upload your data</p>
          <div className="flex-1 h-px" style={{background:'#C8D8F0'}}/>
        </div>

        {!userName.trim() && (
          <div className="fu3 w-full mb-3 px-4 py-3 rounded-xl flex items-center gap-2 warn-in"
               style={{background:T.chip, border:`1px solid ${T.borderStrong}`}}>
            <AlertTriangle size={13} style={{color:'#334EAC', flexShrink:0}}/>
            <p className="text-[11px] font-semibold" style={{color:'#1e326b'}}>Enter your name or ID above before uploading.</p>
          </div>
        )}
        <div className="fu4 w-full" style={{opacity: userName.trim() ? 1 : 0.45, pointerEvents: userName.trim() ? 'auto' : 'none', transition:'opacity 0.2s'}}>
          <UploadZone/>
        </div>
        <p className="fu5 text-[10px] mt-5 text-center" style={{color:'#7096D1'}}>
          {userName.trim() ? 'Dashboard stays empty until a file is uploaded' : 'Fill your name above to unlock upload'}
        </p>

        {uploadHistory.length>0 && (
          <div className="fu5 mt-8 w-full">
            <p className="text-[10px] uppercase font-semibold tracking-widest mb-3" style={{color:'#7096D1'}}>Or reload a previous session</p>
            <div className="space-y-2">
              {uploadHistory.slice(0,3).map(e=>(
                <button key={e.id} onClick={()=>reloadEntry(e)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                  style={{background:'#fff', border:'1px solid #C8D8F0'}}
                  onMouseEnter={ev=>ev.currentTarget.style.borderColor='#081F5C'}
                  onMouseLeave={ev=>ev.currentTarget.style.borderColor='#C8D8F0'}>
                  <div className="flex items-center gap-3 truncate">
                    <FileText size={12} style={{color:'#7096D1', flexShrink:0}}/>
                    <span className="text-xs font-medium truncate" style={{color:'#081F5C'}}>{e.name}</span>
                  </div>
                  <span className="text-[10px] ml-2 shrink-0" style={{color:'#7096D1'}}>{e.rows} rows</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── MAIN DASHBOARD ───────────────────────────────────────────────────── */
  const numericCols = data?.summary?.columns?.filter(c => data.summary?.types?.[c]==='Numeric') || [];

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row overflow-hidden" style={{background:T.bg, color:T.textPrimary}} ref={dashboardRef}>
      <style>{globalStyles}</style>

      {helpCard && <HelpCard onClose={closeHelp} title={helpCard.title} sections={helpCard.sections} T={T}/>}
      {confirmDrop && (
        <InlineConfirm
          message={`Drop column "${confirmDrop.col}"? This removes it from the backend session. Re-upload to restore it.`}
          confirmLabel="Drop column"
          confirmColor="#C0392B"
          onConfirm={() => {
            setDroppingCol(confirmDrop.col);
            setTimeout(() => {
              cleanAction('drop_column', confirmDrop.col);
              setDroppingCol(null);
            }, 560);
            setConfirmDrop(null);
          }}
          onCancel={() => setConfirmDrop(null)}
        />
      )}
      {confirmDropRows && (
        <InlineConfirm
          message={`Delete ${selectedRows.size} selected row${selectedRows.size!==1?'s':''}? This affects your local view only.`}
          confirmLabel="Delete rows"
          confirmColor="#C0392B"
          onConfirm={deleteSelectedRows}
          onCancel={() => setConfirmDropRows(false)}
        />
      )}

      {/* Toast notification */}
      {cleanMsg && (
        <div className="fixed top-4 right-4 z-[250] flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold shadow-sm"
          style={{
            background: cleanMsg.type==='success' ? '#D0E3FF' : '#FDE8E8',
            border: `1px solid ${cleanMsg.type==='success' ? T.textMuted : '#F4A0A0'}`,
            color: cleanMsg.type==='success' ? T.textSecondary : '#C0392B'
          }}>
          {cleanMsg.type==='success' ? <CheckCircle2 size={13}/> : <AlertTriangle size={13}/>}
          {cleanMsg.text}
        </div>
      )}

      {/* Save toast */}
      {savedMsg && (
        <div className="fixed top-16 right-4 z-[250] warn-in flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold shadow-md max-w-xs"
          style={{background:T.accentDark, border:'1px solid #334EAC', color:'#fff'}}>
          <CheckCircle2 size={13} style={{color:'#90CAF9', flexShrink:0}}/>
          <div>
            <p className="font-bold mb-0.5">Saved to browser</p>
            <p style={{color:'rgba(255,255,255,0.6)', fontWeight:400}}>{savedMsg}</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <nav className="w-full md:w-[64px] flex flex-row md:flex-col items-center justify-around md:justify-start py-3 md:py-7 md:gap-4 z-20 order-last md:order-first shrink-0"
           style={{background:T.surface, borderTop:`1px solid ${T.border}`, borderRight:'none'}}
           data-md-style="border-top:none; border-right:1px solid #C8D8F0">
        <div className="hidden md:flex mb-4 justify-center w-full">
          <RawwMark size={32}/>
        </div>
        {[
          {id:'overview',  icon:<LayoutGrid size={18}/>},
          {id:'regression',icon:<Microscope size={18}/>},
          {id:'visuals',   icon:<Activity size={18}/>},
          {id:'clean',     icon:<Eraser size={18}/>},
          {id:'history',   icon:<History size={18}/>}
        ].map(({id,icon})=>(
          <button key={id} onClick={()=>setActiveTab(id)} title={TAB_HEADINGS[id]}
            className="p-2.5 rounded-lg transition-all"
            style={{
              background: activeTab===id ? T.textPrimary : 'transparent',
              color: activeTab===id ? T.surface : T.textMuted
            }}
            onMouseEnter={e=>{ if(activeTab!==id) e.currentTarget.style.color=T.textSecondary; }}
            onMouseLeave={e=>{ if(activeTab!==id) e.currentTarget.style.color=T.textMuted; }}>
            {icon}
          </button>
        ))}
        <div className="hidden md:flex mt-auto pt-4 justify-center w-full" style={{borderTop:`1px solid ${T.border}`}}>
          <button onClick={toggleDark} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2.5 rounded-lg transition-all w-10 h-10 flex items-center justify-center text-base"
            style={{background:T.surfaceAlt, color:T.textMuted}}
            onMouseEnter={e=>{e.currentTarget.style.color=T.textSecondary;}}
            onMouseLeave={e=>{e.currentTarget.style.color=T.textMuted;}}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        {/* Mobile dark toggle */}
        <button onClick={toggleDark} title="Toggle dark mode"
          className="md:hidden p-2.5 rounded-lg text-base"
          style={{color:T.textMuted}}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto" style={{borderLeft:`1px solid ${T.border}`}}>

        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start mb-7 gap-4 lg:gap-0"
                style={{paddingBottom:'20px', borderBottom:`1px solid ${T.border}`}}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{color:T.textMuted}}>
              {userName || 'Anonymous session'}
            </p>
            <h1 className="text-2xl font-bold" style={{color:T.textPrimary}}>{TAB_HEADINGS[activeTab]}</h1>
            {data?.summary?.file_type && (
              <span className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded"
                    style={{color:T.textMuted, border:`1px solid ${T.border}`, background:T.surfaceAlt}}>
                {data.summary.file_type} loaded
              </span>
            )}
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <button onClick={exportReport} disabled={!data||isExporting}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-40"
              style={{background:T.surface, border:`1px solid ${T.border}`, color:T.textSecondary}}
              onMouseEnter={e=>{ if(!e.currentTarget.disabled){e.currentTarget.style.borderColor=T.textPrimary;e.currentTarget.style.color=T.textPrimary;} }}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color='#2D3E8A';}}>
              <Download size={13}/> {isExporting ? 'Preparing…' : 'Export Report'}
            </button>
            <label className="flex-1 lg:flex-none cursor-pointer flex items-center justify-center gap-2 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all"
              style={{background:T.textPrimary, color:'#fff'}}
              onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              {isProcessing ? 'Uploading…' : 'Upload New'}
              <input type="file" className="hidden" onChange={handleFileUpload} accept={ACCEPTED_TYPES} multiple/>
            </label>
          </div>
        </header>

        {!data && activeTab!=='history' && <div className="max-w-lg mx-auto py-8"><UploadZone/></div>}

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {data && activeTab==='overview' && (
          <div className="space-y-6 pb-20">

            {/* Warning banner */}
            {(data.summary?.duplicate_count>0 || Object.values(data.summary?.missing_info||{}).some(m=>m.pct>10)) && (
              <div className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
                   style={{background:T.chip, border:`1px solid ${T.borderStrong}`}}>
                <AlertTriangle size={13} style={{color:T.textSecondary, flexShrink:0}}/>
                {data.summary.duplicate_count>0 && (
                  <span className="text-xs font-medium" style={{color:T.textPrimary}}>
                    {data.summary.duplicate_count} duplicate rows —{' '}
                    <button onClick={()=>setActiveTab('clean')} className="underline">go to Data Cleaning</button>
                  </span>
                )}
                {Object.entries(data.summary.missing_info||{}).filter(([,v])=>v.pct>10).map(([col,info])=>(
                  <span key={col} className="text-xs font-medium" style={{color:T.textPrimary}}>{col}: {info.pct}% missing</span>
                ))}
              </div>
            )}

            {/* Insight report + relations */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 p-6 md:p-7" style={card}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2" style={{color:T.textPrimary}}>
                    <Zap size={14} style={{color:T.textMuted}}/> Insight Report
                  </h3>
                  <HelpBtn onClick={()=>openHelp('Insight Report',[
                    {heading:'What is the Insight Report?',body:'Auto-generated the moment you upload your dataset. RAWW scans every column and surfaces the most noteworthy findings.'},
                    {heading:'About this dataset',body:datasetOverview(data?.summary)},
                  ])}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  {data.summary?.insights?.map((insight,idx)=>(
                    <div key={idx} className="flex gap-3 items-start py-2" style={{borderLeft:`2px solid ${T.border}`, paddingLeft:'12px'}}>
                      <span className="font-semibold text-[10px] mt-0.5 shrink-0" style={{color:T.textMuted}}>0{idx+1}</span>
                      <p className="text-xs leading-relaxed" style={{color:T.textSecondary}}>{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5" style={card}>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{color:T.textMuted}}>
                  <Share2 size={12}/> Column Relations
                </h3>
                <div className="space-y-4">
                  {data.summary?.system_relations?.map((rel,i)=>(
                    <div key={i} className="pb-3" style={{borderBottom:`1px solid ${T.border}`}}>
                      <p className="text-[10px] mb-0.5 truncate" style={{color:T.textMuted}}>{rel.colA} + {rel.colB}</p>
                      <div className="flex justify-between items-end">
                        <span className="text-[10px]" style={{color:T.textMuted}}>{rel.strength>0?'Positive':'Negative'}</span>
                        <span className="font-bold text-lg leading-none" style={{color:T.textPrimary}}>{(rel.strength*100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Feature cards */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{color:T.textMuted}}>Explore your data</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {OVERVIEW_FEATURES.map(f=>(
                  <button key={f.id} onClick={()=>setActiveFeature(activeFeature===f.id?null:f.id)}
                    className="text-left p-5 rounded-2xl transition-all"
                    style={{
                      background: activeFeature===f.id ? T.textPrimary : T.surface,
                      border: `1px solid ${activeFeature===f.id ? T.textPrimary : T.border}`,
                    }}
                    onMouseEnter={e=>{ if(activeFeature!==f.id) e.currentTarget.style.borderColor=T.textMuted; }}
                    onMouseLeave={e=>{ if(activeFeature!==f.id) e.currentTarget.style.borderColor=T.border; }}>
                    <div className="mb-3" style={{opacity: activeFeature===f.id ? 0.6 : 1}}>{f.icon}</div>
                    <p className="text-xs font-semibold mb-1" style={{color: activeFeature===f.id ? T.surface : T.textPrimary}}>{f.label}</p>
                    <p className="text-[11px] leading-relaxed" style={{color: activeFeature===f.id ? 'rgba(255,255,255,0.5)' : T.textMuted}}>{f.desc}</p>
                    <div className="mt-3 text-[10px] font-medium" style={{color: activeFeature===f.id ? 'rgba(255,255,255,0.5)' : T.textMuted}}>
                      {activeFeature===f.id ? 'Collapse' : 'Open'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Missing values */}
            {activeFeature==='missing' && data.summary?.missing_info && (
              <section className="p-6 rounded-2xl card-in" style={card}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2" style={{color:T.textPrimary}}>
                    <AlertTriangle size={14} style={{color:T.textSecondary}}/> Missing Values
                  </h3>
                  <HelpBtn onClick={()=>openHelp('Missing Values',[
                    {heading:'What are missing values?',body:'Missing values are cells where no data was recorded — from data entry errors, sensor failures, or optional fields.'},
                    {heading:'What can I do?',body:'Go to the Data Cleaning tab to fill missing values with the column mean, median, or "Unknown", or to drop the column entirely.'},
                  ])}/>
                </div>
                {Object.keys(data.summary.missing_info).length===0 ? (
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={13} style={{color:T.textSecondary}}/>
                    <p className="text-xs font-medium" style={{color:T.textSecondary}}>No missing values in this dataset.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(data.summary.missing_info).map(([col,info])=>(
                      <div key={col} className="rounded-xl p-4" style={{background:T.textPrimary, border:'1px solid #081F5C'}}>
                        <p className="text-[10px] font-semibold mb-2 truncate uppercase tracking-wider" style={{color:'rgba(255,255,255,0.45)'}}>{col}</p>
                        <p className="text-2xl font-black" style={{color: info.pct>20 ? '#F4A0A0' : info.pct>5 ? T.textMuted : '#90CAF9'}}>{info.pct}%</p>
                        <p className="text-[10px] mt-1 font-medium" style={{color:'rgba(255,255,255,0.35)'}}>{info.count} missing</p>
                        <div className="h-0.5 rounded-full mt-2.5" style={{background:'rgba(255,255,255,0.1)'}}>
                          <div className="h-0.5 rounded-full" style={{width:`${Math.min(info.pct,100)}%`, background: info.pct>20 ? '#F4A0A0' : info.pct>5 ? T.textMuted : '#90CAF9'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Correlation matrix */}
            {activeFeature==='correlation' && data.summary?.corr_matrix && (
              <section className="rounded-2xl card-in overflow-hidden" style={{background:T.surface, border:'2px solid #081F5C'}}>
                <div className="px-6 py-4 flex items-center justify-between" style={{background:T.textPrimary}}>
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{color:'#fff'}}>
                    Correlation Matrix
                  </h3>
                  <HelpBtn onClick={()=>openHelp('Correlation Matrix',[
                    {heading:'What is a correlation matrix?',body:'Shows the Pearson r coefficient between every pair of numeric columns. Ranges from −1 (perfect negative) to +1 (perfect positive).'},
                  ])}/>
                </div>
                <div className="p-6 overflow-x-auto pb-2">
                  <div style={{display:'inline-block',minWidth:'100%'}}>
                    <div style={{display:'grid',gridTemplateColumns:`90px repeat(${data.summary.corr_matrix.columns.length},1fr)`,gap:3}}>
                      <div/>
                      {data.summary.corr_matrix.columns.map(col=>(
                        <div key={col} style={{fontSize:8,color:T.textMuted,fontWeight:600,textAlign:'center',padding:'4px 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{col}</div>
                      ))}
                      {data.summary.corr_matrix.columns.map((rowCol,i)=>(
                        <React.Fragment key={rowCol}>
                          <div style={{fontSize:8,color:T.textMuted,fontWeight:500,display:'flex',alignItems:'center',paddingRight:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{rowCol}</div>
                          {data.summary.corr_matrix.values[i].map((val,j)=><HeatmapCell key={j} value={val??0}/>)}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 mt-4 px-6 pb-6">
                  <div className="flex items-center gap-2"><div style={{width:10,height:10,background:'rgba(51,78,172,0.7)',borderRadius:2}}/><span className="text-[10px] font-medium" style={{color:T.textSecondary}}>Positive</span></div>
                  <div className="flex items-center gap-2"><div style={{width:10,height:10,background:'rgba(160,64,64,0.7)',borderRadius:2}}/><span className="text-[10px] font-medium" style={{color:T.textSecondary}}>Negative</span></div>
                  <div className="flex items-center gap-2"><div style={{width:10,height:10,background:T.textPrimary,borderRadius:2}}/><span className="text-[10px] font-medium" style={{color:T.textSecondary}}>Self (1.0)</span></div>
                </div>
              </section>
            )}

            {/* Raw Data Table */}
            {activeFeature==='rawdata' && (
              <section className="space-y-3 card-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{color:T.textPrimary}}>
                    <TableIcon size={14} style={{color:T.textPrimary}}/> Raw Data Table
                  </h3>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex-1 md:flex-none flex items-center rounded-xl px-3 py-2"
                         style={{background:T.surface, border:'2px solid #081F5C'}}>
                      <span className="font-mono text-[10px] mr-2 font-bold" style={{color:T.textMuted}}>$</span>
                      <input type="text" value={searchQuery} onChange={e=>{setSearchQuery(e.target.value);setPage(0);}}
                        placeholder="Filter rows…"
                        className="bg-transparent border-none outline-none text-xs w-full md:w-44 font-medium"
                        style={{color:T.textPrimary}}/>
                    </div>
                    <button onClick={() => setActiveTab('clean')} title="Edit table"
                      className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-xl transition-all"
                      style={{color:T.textPrimary, border:'2px solid #081F5C', background:'transparent'}}
                      onMouseEnter={e=>{e.currentTarget.style.background=T.textPrimary;e.currentTarget.style.color=T.surface;}}
                      onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textPrimary;}}>
                      <Pencil size={11}/> <span className="hidden sm:inline">Edit</span>
                    </button>
                    <HelpBtn onClick={()=>openHelp('Raw Data Table',[
                      {heading:'What is the Raw Data Table?',body:'A direct, unprocessed view of every row in your dataset as parsed by the backend.'},
                      {heading:'Edit Table',body:'Click the Edit button to go to Data Cleaning — where you can edit cells, delete/duplicate rows, copy data, and run numeric calculations.'},
                      {heading:'Sorting & filtering',body:'Click any column header to sort. Use the filter box to search across all columns simultaneously.'},
                    ])}/>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{background:T.surface, border:'2px solid #081F5C'}}>
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10" style={{background:T.surfaceAlt, borderBottom:'2px solid #081F5C'}}>
                        <tr>{data.summary?.columns?.map(col=>(
                          <th key={col} className="px-4 py-3 whitespace-nowrap cursor-pointer"
                              onClick={()=>handleSort(col)}
                              onMouseEnter={e=>e.currentTarget.style.background='#E8E6E0'}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <p className="text-[10px] font-bold flex items-center gap-1 mb-0.5" style={{color:T.textPrimary}}>
                              {col}{sortCol===col&&<span>{sortDir==='asc'?'↑':'↓'}</span>}
                            </p>
                            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                                  style={{background: data.summary?.types?.[col]==='Numeric' ? T.textPrimary : T.textSecondary, color:'#fff'}}>
                              {data.summary?.types?.[col]||'FEATURE'}
                            </span>
                          </th>
                        ))}</tr>
                      </thead>
                      <tbody className="font-mono text-xs">{pagedRows.map((row,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #C8D8F0'}}
                            onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          {data.summary?.columns?.map(col=>{
                            const isCrit=data.summary?.thresholds?.[col]&&parseFloat(row[col])>data.summary.thresholds[col].critical_high;
                            return <td key={col} className={`px-4 py-3 whitespace-nowrap ${isCrit?'glow-cell':''}`}
                                       style={{color: isCrit ? '#C0392B' : T.textPrimary, background: isCrit ? '#FDE8E8' : 'transparent', fontWeight: 500}}>
                              {row[col]==null?<span style={{color:T.textMuted,fontStyle:'italic'}}>null</span>:String(row[col])}
                            </td>;
                          })}
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 gap-2" style={{borderTop:`1px solid ${T.border}`, background:T.bg}}>
                    <p className="text-[10px] font-bold font-mono" style={{color:T.textSecondary}}>
                      Showing {page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE,filteredRows.length)} of {filteredRows.length}
                    </p>
                    <div className="flex gap-2">
                      <button disabled={page===0} onClick={()=>setPage(p=>p-1)}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-30 transition-all"
                        style={{color:T.textPrimary, border:'2px solid #081F5C', background:'transparent'}}>← Prev</button>
                      <span className="text-[10px] font-bold px-3 py-1.5" style={{color:T.textMuted}}>{page+1}/{totalPages}</span>
                      <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-30 transition-all"
                        style={{color:T.textPrimary, border:'2px solid #081F5C', background:'transparent'}}>Next →</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Distribution */}
            {activeFeature==='distribution' && (
              <section className="space-y-3 card-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2" style={{color:T.textPrimary}}>
                    <BarChart2 size={14} style={{color:T.textSecondary}}/> Column Distribution
                  </h3>
                  <HelpBtn onClick={()=>openHelp('Column Distribution',[
                    {heading:'What is Column Distribution?',body:'Key descriptive statistics for every numeric column — mean, median, min, max, and std dev.'},
                    {heading:'Click to inspect',body:'Click any card for a full Deep Inspection modal with all five statistics.'},
                  ])}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(dynamicStats).map(colName=>(
                    <div key={colName} onClick={()=>setZoomedCol(colName)}
                      className="p-5 rounded-2xl transition-all cursor-zoom-in group"
                      style={{background:T.surface, border:'1px solid #C8D8F0'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=T.textPrimary}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs font-semibold truncate max-w-[80%]" style={{color:T.textSecondary}}>{colName}</p>
                        <Activity size={12} style={{color:T.textMuted, flexShrink:0}}/>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-[10px] mb-0.5" style={{color:T.textMuted}}>Mean</p><p className="text-lg font-bold" style={{color:T.textPrimary}}>{dynamicStats[colName].mean.toFixed(2)}</p></div>
                        <div><p className="text-[10px] mb-0.5" style={{color:T.textMuted}}>Max</p><p className="text-lg font-bold" style={{color:T.textPrimary}}>{dynamicStats[colName].max.toFixed(2)}</p></div>
                      </div>
                      {data.summary?.missing_info?.[colName]?.pct>0 && (
                        <p className="mt-2 text-[10px]" style={{color:T.textSecondary}}>{data.summary.missing_info[colName].pct}% missing</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── VISUALS TAB ──────────────────────────────────────────────── */}
        {data && activeTab==='visuals' && (
          <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-xl w-full md:w-auto" style={{background:T.surface, border:`1px solid ${T.border}`}}>
                {[{val:vizX, set:setVizX, placeholder:'X Axis'},{val:vizY, set:setVizY, placeholder:'Y Axis'}].map(({val,set,placeholder})=>(
                  <select key={placeholder} value={val} onChange={e=>set(e.target.value)}
                    className="text-xs font-medium outline-none px-3 py-2 rounded-lg w-full sm:w-auto"
                    style={{background:T.bg, border:'1px solid #C8D8F0', color: val ? T.textPrimary : T.textMuted}}>
                    <option value="">Select {placeholder}</option>
                    {data.summary?.columns?.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                ))}
              </div>
              <HelpBtn onClick={()=>openHelp('Visualise',[
                {heading:'What is Visualise?',body:'Create any combination of charts. Select X and Y axes then pick one or more chart types.'},
                {heading:'Auto-suggestions',body:'RAWW analyses your column types and suggests the most appropriate chart types.'},
              ])}/>
            </div>

            {suggestedCharts.length>0 && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl"
                   style={{background:T.bg, border:'1px solid #C8D8F0'}}>
                <Sparkles size={12} style={{color:T.textMuted, flexShrink:0}}/>
                <p className="text-[10px] font-semibold mr-1" style={{color:T.textMuted}}>Suggested:</p>
                {suggestedCharts.map(id=>{const c=CHART_TYPES.find(ct=>ct.id===id);return(
                  <button key={id} onClick={()=>!selectedCharts.includes(id)&&toggleChart(id)}
                    className="text-[10px] font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{color:T.textMuted, border:'1px solid #D4C4A8', background:T.surface}}
                    onMouseEnter={e=>{e.currentTarget.style.background='#F5F0E8';}}
                    onMouseLeave={e=>{e.currentTarget.style.background=T.surface;}}>
                    {c.label}
                  </button>
                );})}
              </div>
            )}

            <div className="p-5 rounded-2xl" style={card}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <p className="text-xs font-medium" style={{color:T.textMuted}}>{selectedCharts.length} chart type{selectedCharts.length!==1?'s':''} selected</p>
                <div className="flex gap-2">
                  <button onClick={()=>setSelectedCharts(CHART_TYPES.map(c=>c.id))}
                    className="text-[10px] font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{color:T.textSecondary, border:'1px solid #C8D0D8'}}>Select all</button>
                  <button onClick={()=>setSelectedCharts([])}
                    className="text-[10px] font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{color:T.textMuted, border:'1px solid #C8D8F0'}}>Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {CHART_TYPES.map(chart=>(
                  <button key={chart.id} onClick={()=>toggleChart(chart.id)}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: selectedCharts.includes(chart.id) ? T.textPrimary : T.bg,
                      border: `1px solid ${selectedCharts.includes(chart.id) ? T.textPrimary : T.border}`,
                    }}>
                    <p className="text-[10px] font-semibold truncate" style={{color: selectedCharts.includes(chart.id) ? T.surface : T.textSecondary}}>{chart.label}</p>
                    {suggestedCharts.includes(chart.id) && (
                      <div className="text-[8px] font-medium mt-1" style={{color: selectedCharts.includes(chart.id) ? 'rgba(255,255,255,0.5)' : T.textMuted}}>suggested</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedCharts.length===0 && (
              <div className="text-center py-14 rounded-2xl" style={{border:'2px dashed #C8D8F0'}}>
                <p className="text-xs" style={{color:T.textMuted}}>Select chart types above to visualise your data</p>
              </div>
            )}

            {/* Axis / type warning card */}
            {(() => {
              const w = getVizWarning(vizX, vizY, data?.summary);
              if (!w || selectedCharts.length === 0) return null;
              return (
                <div className="warn-in flex items-start gap-3 px-5 py-4 rounded-xl"
                     style={{background: w.type==='type' ? '#FDE8E8' : '#D0E3FF',
                             border: `1px solid ${w.type==='type' ? '#F4A0A0' : T.textMuted}`}}>
                  <AlertTriangle size={15} style={{color: w.type==='type' ? '#C0392B' : T.textSecondary, flexShrink:0, marginTop:1}}/>
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{color: w.type==='type' ? '#C0392B' : T.accentDark}}>
                      {w.type==='type' ? 'Column type mismatch' : 'Axis required'}
                    </p>
                    <p className="text-xs" style={{color: w.type==='type' ? '#7a1c1c' : T.textSecondary}}>{w.msg}</p>
                  </div>
                </div>
              );
            })()}

            {(!vizX||!vizY)&&selectedCharts.length>0 && (
              <div className="text-center py-10 rounded-2xl" style={{border:'2px dashed #7096D1'}}>
                <p className="text-xs" style={{color:T.textMuted}}>Select X and Y axes above to render charts</p>
              </div>
            )}
            {vizX&&vizY&&selectedCharts.length>0 && (
              <div className="space-y-5">{selectedCharts.map(t=>renderChart(t))}</div>
            )}
          </div>
        )}

        {/* ── REGRESSION TAB ───────────────────────────────────────────── */}
        {data && activeTab==='regression' && (
          <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-xl w-full md:w-auto" style={{background:T.surface, border:`1px solid ${T.border}`}}>
                {[
                  {val:regX, onChange:e=>{const v=e.target.value;setRegX(v);if(regY&&v)solveRegression(v,regY);}, placeholder:'X (Independent)'},
                  {val:regY, onChange:e=>{const v=e.target.value;setRegY(v);if(regX&&v)solveRegression(regX,v);}, placeholder:'Y (Dependent)'}
                ].map(({val,onChange,placeholder})=>(
                  <select key={placeholder} value={val} onChange={onChange}
                    className="text-xs font-medium outline-none px-3 py-2 rounded-lg w-full sm:w-auto"
                    style={{background:T.bg, border:'1px solid #C8D8F0', color: val ? T.textPrimary : T.textMuted}}>
                    <option value="">Select {placeholder}</option>
                    {numericCols.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                ))}
              </div>
              <HelpBtn onClick={()=>openHelp('Regression',[
                {heading:'What is Linear Regression?',body:'Finds the best-fit line y = mx + b through your data using Ordinary Least Squares.'},
                {heading:'What is Pearson r?',body:'Ranges from −1 to +1. Near ±1 = strong linear relationship. Near 0 = weak or none.'},
                {heading:'What is R²?',body:'The percentage of variance in Y explained by X. R² = 0.81 means X explains 81% of variation in Y.'},
                {heading:'About this dataset',body:datasetForRegression(data?.summary,regX,regY)},
              ])}/>
            </div>

            {regressionResult?.status==='success' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl" style={card}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color:T.textMuted}}>Equation</p>
                  <p className="text-lg font-mono" style={{color:T.textPrimary}}>{regressionResult.equation}</p>
                </div>
                <div className="p-5 rounded-2xl" style={card}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color:T.textMuted}}>Pearson r · R²</p>
                  <p className="text-lg font-mono" style={{color:T.textPrimary}}>{regressionResult.r?.toFixed(3)} · {regressionResult.r2?.toFixed(3)}</p>
                </div>
                <div className="p-5 rounded-2xl" style={{background:T.textPrimary, borderRadius:'16px'}}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color:'rgba(255,255,255,0.4)'}}>Insight</p>
                  <p className="text-sm font-medium leading-snug" style={{color:'#fff'}}>{regressionResult.insight}</p>
                </div>
              </div>
            )}
            {regressionResult?.status==='error' && (
              <div className="p-5 rounded-2xl" style={{background: darkMode?'rgba(192,57,43,0.15)':'#FDE8E8', border:`1px solid ${T.danger}`}}>
                <p className="font-mono text-xs" style={{color:'#C0392B'}}>Error: {regressionResult.message}</p>
              </div>
            )}

            <div className="p-5 md:p-7 rounded-2xl" style={{...card, height:'440px'}}>
              {!regX||!regY ? (
                <div className="h-full flex flex-col items-center justify-center rounded-xl" style={{border:'2px dashed #C8D8F0'}}>
                  <Microscope size={32} style={{color:T.border, marginBottom:'12px'}}/>
                  <p className="text-xs text-center" style={{color:T.textMuted}}>Select X and Y axes above to render the regression plot</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{top:20,right:20,bottom:40,left:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                    <XAxis dataKey="x" type="number" stroke={T.border} fontSize={10} tick={{fill:T.textMuted}} tickFormatter={v=>v?.toFixed(1)} label={{value:regX,position:'insideBottom',offset:-20,fill:T.textSecondary,fontSize:10,fontWeight:'bold'}}/>
<YAxis dataKey="y" type="number" stroke={T.border} fontSize={10} tick={{fill:T.textMuted}} tickFormatter={v=>v?.toFixed(1)} label={{value:regY,angle:-90,position:'insideLeft',fill:T.textPrimary,fontSize:10,fontWeight:'bold'}}/>
                    <Scatter data={regChartData} fill={accentColor} fillOpacity={0.55} r={3}/>
                    {regressionResult?.status==='success' && (() => {
                      const xs=regChartData.map(d=>d.x).filter(v=>!isNaN(v));
                      if(!xs.length) return null;
                      const m=regressionResult.slope, b=regressionResult.intercept;
                      const mn=Math.min(...xs), mx=Math.max(...xs);
                     return <line x1={mn} y1={m*mn+b} x2={mx} y2={m*mx+b} stroke={T.textMuted} strokeWidth={1.5} strokeDasharray="4 3"/>;
                    })()}
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          
          {/* Regression written analysis */}
          {regressionAnalysis && (
            <div className="p-6 rounded-2xl card-in" style={{background:T.surface, border:`1px solid ${T.border}`}}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:T.accentDark}}>
                  <FileText size={12} style={{color:'#fff'}}/>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{color:T.accentDark}}>Written Analysis</p>
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full ml-1" style={{background:T.chip, color:T.textSecondary}}>Auto-generated</span>
              </div>
              <div className="space-y-3">
                {regressionAnalysis.map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{color: i===0 ? T.textPrimary : T.textSecondary, fontWeight: i===0 ? 600 : 400}}>
                    {para}
                  </p>
                ))}
              </div>
              <div className="mt-4 pt-4 flex flex-wrap gap-4" style={{borderTop:'1px solid #C8D8F0'}}>
                {[
                  {label:'X Variable', val:regX},
                  {label:'Y Variable', val:regY},
                  {label:'Pearson r', val:regressionResult.r?.toFixed(4)},
                  {label:'R²', val:regressionResult.r2?.toFixed(4)},
                  {label:'Slope', val:regressionResult.slope?.toFixed(4)},
                  {label:'Intercept', val:regressionResult.intercept?.toFixed(4)},
                ].map(({label, val}) => (
                  <div key={label} className="px-3 py-2 rounded-lg" style={{background:T.surfaceAlt, border:`1px solid ${T.border}`}}>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{color:T.textMuted}}>{label}</p>
                    <p className="text-xs font-black font-mono" style={{color:T.textPrimary}}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* ── DATA CLEANING TAB ────────────────────────────────────────── */}
        {data && activeTab==='clean' && (
          <div className="space-y-5 pb-20">

            {/* Row selection toolbar */}
            {selectedRows.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl"
                   style={{background:T.textPrimary, border:'1px solid #081F5C'}}>
                <span className="text-[10px] font-bold" style={{color:'rgba(255,255,255,0.55)'}}>{selectedRows.size} row{selectedRows.size!==1?'s':''} selected</span>
                <div className="flex gap-2 ml-auto flex-wrap">
                  <button onClick={copySelectedToClipboard}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{color:'#fff', border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.08)'}}>
                    <Copy size={10}/> Copy
                  </button>
                  <button onClick={duplicateSelectedRows}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{color:'#fff', border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.08)'}}>
                    <SquareStack size={10}/> Duplicate
                  </button>
                  <button onClick={() => setConfirmDropRows(true)}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{color:'#F4A0A0', border:'1px solid rgba(244,160,160,0.3)', background:'rgba(160,64,64,0.25)'}}>
                    <Trash2 size={10}/> Delete rows
                  </button>
                </div>
              </div>
            )}

            {/* Editable table */}
            <div className="rounded-2xl overflow-hidden" style={{background:T.surface, border:'2px solid #081F5C'}}>
              <div className="px-5 py-3.5 flex items-center gap-3" style={{background:T.textPrimary}}>
                <Pencil size={12} style={{color:'rgba(255,255,255,0.45)'}}/>
                <p className="text-xs font-bold" style={{color:'#fff'}}>Editable Data Table</p>
                <span className="text-[10px] ml-1" style={{color:'rgba(255,255,255,0.35)'}}>— double-click any cell to edit</span>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10" style={{background:T.surfaceAlt, borderBottom:`2px solid ${T.border}`}}>
                    <tr>
                      <th className="px-3 py-3 w-8">
                        <input type="checkbox"
                          checked={selectedRows.size===editRows.length && editRows.length>0}
                          onChange={toggleAllRows}
                          className="cursor-pointer" style={{accentColor:T.textPrimary}}/>
                      </th>
                      <th className="px-3 py-3 text-[10px] font-bold w-10" style={{color:T.textMuted}}>#</th>
                      {editCols.map(col=>(
                        <th key={col} className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold" style={{color:T.textPrimary}}>{col}</span>
                            <span className="text-[8px] font-bold px-1 py-0.5 rounded"
                                  style={{background: data.summary?.types?.[col]==='Numeric' ? T.textPrimary : T.textSecondary, color:'#fff'}}>
                              {data.summary?.types?.[col]==='Numeric'?'#':'A'}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {editRows.slice(0, 50).map((row, ri) => (
                      <tr key={ri} style={{borderBottom:'1px solid #C8D8F0', background: selectedRows.has(ri) ? '#EEF0F3' : 'transparent'}}
                          onMouseEnter={e=>{ if(!selectedRows.has(ri)) e.currentTarget.style.background=T.bg; }}
                          onMouseLeave={e=>{ e.currentTarget.style.background = selectedRows.has(ri) ? '#EEF0F3' : 'transparent'; }}>
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={selectedRows.has(ri)} onChange={() => toggleRow(ri)}
                            className="cursor-pointer" style={{accentColor:T.textPrimary}}/>
                        </td>
                        <td className="px-3 py-2.5 text-[10px] font-bold" style={{color:T.textMuted}}>{ri+1}</td>
                        {editCols.map(col => (
                          <td key={col} className="px-3 py-2.5 whitespace-nowrap" onDoubleClick={() => startEdit(ri, col)}>
                            {editingCell?.ri===ri && editingCell?.col===col ? (
                              <input autoFocus value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={e => { if(e.key==='Enter') commitEdit(); if(e.key==='Escape') setEditingCell(null); }}
                                className="rounded px-2 py-0.5 outline-none w-full min-w-[80px] text-[10px]"
                                style={{background:T.surface, border:'2px solid #081F5C', color:T.textPrimary}}/>
                            ) : (
                              <span className="text-[11px] cursor-text select-text"
                                    style={{color: row[col]==null ? T.textMuted : T.textPrimary, fontStyle: row[col]==null ? 'italic' : 'normal'}}>
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
                <div className="px-4 py-2.5" style={{borderTop:`1px solid ${T.border}`, background:T.bg}}>
                  <p className="text-[10px] font-medium" style={{color:T.textSecondary}}>Showing 50 of {editRows.length} rows. Export CSV to get all rows.</p>
                </div>
              )}
            </div>

            {/* Column calculations */}
            {numericCols.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{background:T.surface, border:'2px solid #081F5C'}}>
                <div className="px-5 py-3.5 flex items-center gap-2" style={{background:T.textPrimary}}>
                  <Calculator size={13} style={{color:'rgba(255,255,255,0.5)'}}/>
                  <p className="text-sm font-bold" style={{color:'#fff'}}>Column Calculations</p>
                </div>
                <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    {elem: <select value={calcCol} onChange={e => { setCalcCol(e.target.value); setCalcResult(null); }}
                       className="text-xs font-bold outline-none px-3 py-2.5 rounded-lg"
                       style={{background:T.surfaceAlt, border:'2px solid #081F5C', color: calcCol ? T.textPrimary : T.textMuted}}>
                       <option value="">Select column</option>
                       {numericCols.map(c=><option key={c} value={c}>{c}</option>)}
                     </select>},
                    {elem: <select value={calcOp} onChange={e => { setCalcOp(e.target.value); setCalcResult(null); }}
                       className="text-xs font-bold outline-none px-3 py-2.5 rounded-lg"
                       style={{background:T.surfaceAlt, border:'2px solid #081F5C', color:T.textPrimary}}>
                       <option value="sum">Σ Sum</option>
                       <option value="avg">∅ Average</option>
                       <option value="min">↓ Min</option>
                       <option value="max">↑ Max</option>
                       <option value="count"># Count</option>
                       <option value="mul">× Multiply by scalar</option>
                       <option value="div">÷ Divide by scalar</option>
                       <option value="sub">− Subtract scalar</option>
                       <option value="pct">% Percentage of scalar</option>
                     </select>}
                  ].map(({elem},i)=><React.Fragment key={i}>{elem}</React.Fragment>)}

                  {['mul','div','sub','pct'].includes(calcOp) && (
                    <input type="number" placeholder="Scalar value" value={calcScalar}
                      onChange={e => setCalcScalar(e.target.value)}
                      className="text-xs font-bold outline-none px-3 py-2.5 rounded-lg w-32"
                      style={{background:T.surfaceAlt, border:'2px solid #081F5C', color:T.textPrimary}}/>
                  )}
                  <button onClick={runCalc} disabled={!calcCol}
                    className="text-xs font-bold px-5 py-2.5 rounded-lg transition-all disabled:opacity-40"
                    style={{background:T.textPrimary, color:'#fff'}}>
                    Calculate
                  </button>
                  {['mul','div','sub'].includes(calcOp) && calcCol && calcScalar && (
                    <button onClick={applyCalcToCol}
                      className="text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
                      style={{color:T.textPrimary, border:'2px solid #081F5C', background:'transparent'}}>
                      Apply to column
                    </button>
                  )}
                </div>

                {calcResult !== null && (
                  <div className="rounded-xl px-4 py-3.5 flex items-start gap-3 mb-4" style={{background:T.textPrimary}}>
                    <span className="text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5" style={{color:'rgba(255,255,255,0.35)'}}>Result</span>
                    <span className="text-sm font-black break-all" style={{color:'#fff'}}>
                      {typeof calcResult==='number' ? calcResult.toLocaleString(undefined,{maximumFractionDigits:6}) : calcResult}
                    </span>
                  </div>
                )}

                {calcCol && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      {op:'sum',   label:'Sum',   icon:<Sigma size={11}/>},
                      {op:'avg',   label:'Avg',   icon:<Hash size={11}/>},
                      {op:'min',   label:'Min',   icon:<Minus size={11}/>},
                      {op:'max',   label:'Max',   icon:<ArrowUpDown size={11}/>},
                      {op:'count', label:'Count', icon:<Hash size={11}/>},
                    ].map(({op, label, icon}) => {
                      const vals = editRows.map(r=>parseFloat(r[calcCol])).filter(v=>!isNaN(v));
                      if (!vals.length) return null;
                      let v;
                      if      (op==='sum')   v = vals.reduce((a,b)=>a+b,0);
                      else if (op==='avg')   v = vals.reduce((a,b)=>a+b,0)/vals.length;
                      else if (op==='min')   v = Math.min(...vals);
                      else if (op==='max')   v = Math.max(...vals);
                      else if (op==='count') v = vals.length;
                      return (
                        <div key={op} className="rounded-xl px-3 py-3 text-center" style={{background:T.surfaceAlt, border:`1px solid ${T.border}`}}>
                          <div className="flex items-center justify-center gap-1 mb-1.5" style={{color:T.textSecondary}}>
                            {icon}<span className="text-[10px] font-bold">{label}</span>
                          </div>
                          <p className="text-sm font-black" style={{color:T.textPrimary}}>
                            {typeof v==='number' ? v.toLocaleString(undefined,{maximumFractionDigits:4}) : v}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            )}

            {/* Remove duplicates */}
            {data.summary?.duplicate_count > 0 && (
              <div className="p-5 rounded-2xl" style={{background:T.chip, border:`1px solid ${T.borderStrong}`}}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{color:T.textSecondary}}>Remove Duplicates</p>
                    <p className="font-semibold text-sm" style={{color:T.textPrimary}}>{data.summary.duplicate_count} duplicate rows detected</p>
                    <p className="text-xs mt-1" style={{color:T.textMuted}}>Permanently removes duplicates from the backend session, keeping the first occurrence.</p>
                  </div>
                  <button onClick={() => cleanAction('remove_duplicates')} disabled={cleanLoading}
                    className="w-full md:w-auto font-semibold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    style={{background:T.textSecondary, color:'#fff'}}>
                    Remove Duplicates
                  </button>
                </div>
              </div>
            )}

            {/* Fill missing values */}
            <div className="rounded-2xl overflow-hidden" style={{background:T.surface, border:'2px solid #081F5C'}}>
              <div className="px-5 py-3.5" style={{background:T.textPrimary}}>
                <p className="text-sm font-bold" style={{color:'#fff'}}>Fill Missing Values</p>
              </div>
              <div className="p-4 space-y-2">
                {data.summary?.columns?.filter(col => (data.summary.missing_info?.[col]?.count||0) > 0).map(col => {
                  const isNum = data.summary.types?.[col]==='Numeric';
                  return (
                    <div key={col} className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl px-4 py-3.5 gap-3"
                         style={{background:T.bg, border:`1px solid ${T.border}`}}>
                      <div>
                        <p className="font-bold text-xs truncate max-w-[200px]" style={{color:T.textPrimary}}>{col}</p>
                        <p className="text-[10px] mt-0.5 font-semibold" style={{color:T.textSecondary}}>{data.summary.missing_info[col].count} missing ({data.summary.missing_info[col].pct}%)</p>
                      </div>
                      <div className="flex gap-2">
                        {isNum ? (
                          <>
                            <button onClick={() => cleanAction('fill_missing', col, 'mean')} disabled={cleanLoading}
                              className="text-[10px] font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50"
                              style={{color:T.textPrimary, border:'2px solid #081F5C', background:'transparent'}}
                              onMouseEnter={e=>{e.currentTarget.style.background=T.textPrimary;e.currentTarget.style.color=T.surface;}}
                              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textPrimary;}}>Fill Mean</button>
                            <button onClick={() => cleanAction('fill_missing', col, 'median')} disabled={cleanLoading}
                              className="text-[10px] font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50"
                              style={{color:T.textPrimary, border:'2px solid #081F5C', background:'transparent'}}
                              onMouseEnter={e=>{e.currentTarget.style.background=T.textPrimary;e.currentTarget.style.color=T.surface;}}
                              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textPrimary;}}>Fill Median</button>
                          </>
                        ) : (
                          <button onClick={() => cleanAction('fill_missing', col, 'Unknown')} disabled={cleanLoading}
                            className="text-[10px] font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50"
                            style={{color:T.textPrimary, border:'2px solid #081F5C', background:'transparent'}}
                            onMouseEnter={e=>{e.currentTarget.style.background=T.textPrimary;e.currentTarget.style.color=T.surface;}}
                            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textPrimary;}}>Fill "Unknown"</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!data.summary?.columns?.some(col => (data.summary.missing_info?.[col]?.count||0) > 0) && (
                  <div className="flex items-center gap-2.5 py-1">
                    <CheckCircle2 size={14} style={{color:T.textSecondary}}/>
                    <p className="text-xs font-bold" style={{color:T.textSecondary}}>No missing values detected.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Drop columns */}
            <div className="rounded-2xl overflow-hidden" style={{border:'2px solid #C0392B'}}>
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{background:T.danger}}>
                <p className="text-sm font-bold" style={{color:'#fff'}}>Drop Columns</p>
                <p className="text-[10px] font-medium" style={{color:'rgba(255,255,255,0.6)'}}>Permanently removes from backend · re-upload to restore</p>
              </div>
              <div className="p-4" style={{background:T.surface}}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {data.summary?.columns?.map(col => (
                    <button key={col} onClick={() => setConfirmDrop({col})} disabled={cleanLoading}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all disabled:opacity-50${droppingCol===col?' col-drop-flash':''}`}
                      style={{background: droppingCol===col ? '#C0392B' : T.bg, border:`1px solid ${droppingCol===col?'#C0392B':'#B0C4E4'}`}}
                      onMouseEnter={e=>{ if(droppingCol!==col){e.currentTarget.style.background='#C0392B'; e.currentTarget.style.borderColor='#C0392B';} }}
                      onMouseLeave={e=>{ if(droppingCol!==col){e.currentTarget.style.background=T.bg; e.currentTarget.style.borderColor='#B0C4E4';} }}>
                      <span className="text-xs font-bold truncate max-w-[80%]" style={{color: droppingCol===col ? T.surface : T.textPrimary}}>{col}</span>
                      <Trash2 size={11} style={{color: droppingCol===col ? 'rgba(255,255,255,0.7)' : T.textMuted, flexShrink:0, marginLeft:'4px'}}/>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live backend view */}
            <div className="rounded-2xl overflow-hidden" style={{border:'2px solid #334EAC'}}>
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{background:T.accent}}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} style={{color:'rgba(255,255,255,0.7)'}}/>
                  <p className="text-sm font-bold" style={{color:'#fff'}}>Live Dataset — Backend State</p>
                </div>
                <p className="text-[10px] font-semibold" style={{color:'rgba(255,255,255,0.5)'}}>{data.summary?.columns?.length} columns · {data.summary?.total_rows?.toLocaleString()} rows</p>
              </div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto" style={{background:T.surface}}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10" style={{background:T.surfaceAlt, borderBottom:`2px solid ${T.border}`}}>
                    <tr>
                      <th className="px-3 py-2.5 text-[10px] font-bold w-10" style={{color:T.textMuted}}>#</th>
                      {data.summary?.columns?.map(col=>(
                        <th key={col} className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-[10px] font-bold" style={{color:T.textPrimary}}>{col}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {(data.preview||[]).slice(0,30).map((row,ri)=>(
                      <tr key={ri} style={{borderBottom:'1px solid #C8D8F0'}}
                          onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td className="px-3 py-2.5 text-[10px] font-bold" style={{color:T.textMuted}}>{ri+1}</td>
                        {data.summary?.columns?.map(col=>(
                          <td key={col} className="px-3 py-2.5 whitespace-nowrap text-[11px]" style={{color: row[col]==null ? T.textMuted : T.textPrimary, fontStyle: row[col]==null ? 'italic' : 'normal'}}>
                            {row[col]==null ? 'null' : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {(!data.preview||data.preview.length===0) && (
                      <tr><td colSpan={(data.summary?.columns?.length||0)+1} className="px-3 py-8 text-center text-xs" style={{color:T.textMuted}}>No preview data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-2.5" style={{borderTop:`1px solid ${T.border}`, background:T.bg}}>
                <p className="text-[10px] font-medium" style={{color:T.textSecondary}}>Showing up to 30 rows · Backend changes update this view automatically.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ──────────────────────────────────────────────── */}
        {activeTab==='history' && (
          <div className="space-y-5 pb-20">
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{color:T.textMuted}}>Every dataset uploaded this session is stored here.</p>
              <div className="flex items-center gap-3">
                <HelpBtn onClick={()=>openHelp('Upload History',[
                  {heading:'What is Upload History?',body:'Records every file uploaded this browser session with a snapshot for instant reload.'},
                  {heading:'Session persistence',body:'History is cleared on page refresh. Use Export Report to save your analysis.'},
                ])}/>
                {uploadHistory.length>0 && (
                  <button onClick={()=>setUploadHistory([])}
                    className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-2 rounded-lg transition-all"
                    style={{color:T.textMuted, border:'1px solid #C8D8F0'}}
                    onMouseEnter={e=>{e.currentTarget.style.color='#C0392B';e.currentTarget.style.borderColor='#F4A0A0';}}
                    onMouseLeave={e=>{e.currentTarget.style.color=T.textMuted;e.currentTarget.style.borderColor=T.border;}}>
                    <Trash2 size={10}/> Clear all
                  </button>
                )}
              </div>
            </div>

            {uploadHistory.length===0 && (
              <div className="text-center py-20 rounded-2xl" style={{border:'2px dashed #C8D8F0'}}>
                <p className="text-xs" style={{color:T.textMuted}}>No uploads yet this session</p>
              </div>
            )}

            {uploadHistory.map((entry,i)=>(
              <div key={entry.id} className="p-5 rounded-2xl transition-all"
                   style={{background:T.surface, border:`1px solid ${T.border}`}}
                   onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderStrong}
                   onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:T.surfaceAlt}}>
                      <Clock size={15} style={{color:T.textMuted}}/>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate mb-0.5" style={{color:T.textPrimary}}>{entry.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{color:T.textMuted}}>{entry.date} at {entry.time}</span>
                        <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded"
                              style={{color:T.textSecondary, border:'1px solid #C8D8F0', background:T.surfaceAlt}}>
                          Session #{uploadHistory.length-i}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto">
                    <button onClick={()=>reloadEntry(entry)}
                      className="flex-1 md:flex-none justify-center flex items-center gap-1.5 font-semibold text-xs px-4 py-2 rounded-lg transition-all"
                      style={{background:T.textPrimary, color:'#fff'}}>
                      <RotateCcw size={10}/> Reload
                    </button>
                    <button onClick={()=>exportEntry(entry)}
                      className="flex-1 md:flex-none justify-center flex items-center gap-1.5 font-semibold text-xs px-4 py-2 rounded-lg transition-all"
                      style={{color:'#2D3E8A', border:'1px solid #C8D8F0', background:T.surface}}>
                      <Download size={10}/> CSV
                    </button>
                    <button onClick={()=>deleteEntry(entry.id)}
                      className="flex items-center justify-center px-3 py-2 rounded-lg transition-all"
                      style={{color:T.textMuted, border:'1px solid #C8D8F0'}}
                      onMouseEnter={e=>{e.currentTarget.style.color='#C0392B';e.currentTarget.style.borderColor='#F4A0A0';}}
                      onMouseLeave={e=>{e.currentTarget.style.color=T.textMuted;e.currentTarget.style.borderColor=T.border;}}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {[
                    {label:'Rows',       val:entry.rows?.toLocaleString()},
                    {label:'Columns',    val:entry.cols},
                    {label:'Numeric',    val:entry.numericCols},
                    {label:'Categorical',val:entry.catCols}
                  ].map(({label,val})=>(
                    <div key={label} className="rounded-xl px-3 py-2.5" style={{background:T.bg, border:'1px solid #C8D8F0'}}>
                      <p className="text-[10px] mb-0.5" style={{color:T.textMuted}}>{label}</p>
                      <p className="text-lg font-bold" style={{color:T.textPrimary}}>{val}</p>
                    </div>
                  ))}
                </div>

                {entry.quickInsight && (
                  <div style={{borderTop:'1px solid #C8D8F0', paddingTop:'12px'}}>
                    <p className="text-[10px] mb-1 flex items-center gap-1" style={{color:T.textMuted}}>
                      <Zap size={9} style={{color:T.textMuted}}/> Quick Insight
                    </p>
                    <p className="text-xs leading-relaxed" style={{color:T.textSecondary}}>{entry.quickInsight}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Deep Inspection Modal */}
      {zoomedCol && dynamicStats[zoomedCol] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{background:'rgba(26,25,22,0.35)'}} onClick={()=>setZoomedCol(null)}/>
          <div className="w-full max-w-lg p-7 md:p-10 rounded-2xl shadow-xl relative z-10 max-h-[90vh] overflow-y-auto"
               style={{background:T.surface, border:`1px solid ${T.border}`}}>
            <button onClick={()=>setZoomedCol(null)} className="absolute top-5 right-5 transition-opacity hover:opacity-60" style={{color:T.textMuted}}>
              <X size={18}/>
            </button>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{color:T.textMuted}}>Deep Inspection</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-1 break-all" style={{color:T.textPrimary}}>{zoomedCol}</h2>
            {data.summary?.missing_info?.[zoomedCol] && (
              <p className="text-xs font-medium mb-6" style={{color:T.textSecondary}}>
                {data.summary.missing_info[zoomedCol].pct}% missing ({data.summary.missing_info[zoomedCol].count} rows)
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-5">
              {[
                ['Mean',   dynamicStats[zoomedCol].mean],
                ['Median', dynamicStats[zoomedCol].median],
                ['Std Dev',dynamicStats[zoomedCol].std],
                ['Min',    dynamicStats[zoomedCol].min],
                ['Max',    dynamicStats[zoomedCol].max]
              ].map(([label,val])=>(
                <div key={label}>
                  <p className="text-[10px] font-medium mb-1" style={{color:T.textMuted}}>{label}</p>
                  <p className="text-2xl font-bold" style={{color:T.textPrimary}}>{val.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;