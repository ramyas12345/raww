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

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=PT+Sans:wght@700&display=swap');
  .hero-heading { font-family: 'PT Sans', sans-serif !important; }
  *, *::before, *::after { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  body { background: #EEF2F7; }

  @keyframes cardIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .card-in { animation: cardIn 0.2s ease forwards; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  .fu1 { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) 0.0s both; }
  .fu2 { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) 0.1s both; }
  .fu3 { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) 0.2s both; }
  .fu4 { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) 0.3s both; }
  .fu5 { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) 0.4s both; }

  .drag-over { border-color: #334EAC !important; background: rgba(51,78,172,0.03) !important; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #B0C4E4; border-radius: 99px; }

  select option { background-color: #716969 !important; color: #081F5C !important; }

  @keyframes pulse-border { 0%,100% { border-color: rgba(160,64,64,0.4); } 50% { border-color: rgba(160,64,64,0.1); } }
  .glow-cell { animation: pulse-border 2s infinite; }

  @keyframes col-drop-flash {
    0% { background: #C0392B; color: #716969; transform: scale(1); }
    30% { background: #ff6b6b; transform: scale(0.96); }
    60% { background: #C0392B; opacity: 0.5; }
    100% { background: #C0392B; opacity: 0; transform: scale(0.9); }
  }
  .col-drop-flash { animation: col-drop-flash 0.55s ease forwards; pointer-events: none; }

  @keyframes warn-slide-in { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
  .warn-in { animation: warn-slide-in 0.18s ease forwards; }

  .feature-card { transition: transform 0.15s, box-shadow 0.15s; }
  .feature-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(8,31,92,0.07); }
`;

const CHART_TYPES = [
  { id:'scatter', label:'Scatter Plot' }, { id:'bar', label:'Bar Chart' },
  { id:'line', label:'Line Graph' }, { id:'area', label:'Area Chart' },
  { id:'histogram', label:'Histogram' }, { id:'pie', label:'Pie Chart' },
  { id:'radar', label:'Radar Chart' }, { id:'donut', label:'Donut Chart' },
  { id:'stacked', label:'Stacked Bar' }, { id:'stepped', label:'Step Line' },
];

const COLORS = ['#334EAC','#E67E22','#27AE60','#E74C3C','#8E44AD','#16A085','#D35400','#2980B9','#C0392B','#1ABC9C'];
const ACCEPTED_TYPES = '.csv,.xlsx,.xls,.json,.tsv,.jpg,.jpeg,.png,.webp,.pdf';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const HeatmapCell = ({ value, dark }) => {
  const abs = Math.abs(value), isPos = value >= 0, isDiag = value === 1;
  const posRgb = dark ? '91,127,232' : '51,78,172';
  const negRgb = dark ? '224,100,100' : '160,64,64';
  const minOp = dark ? 0.22 : 0.12;
  const bg = isDiag ? (dark ? '#3A5CC8' : '#081F5C') : `rgba(${isPos ? posRgb : negRgb},${minOp + abs * 0.72})`;
  const textColor = isDiag ? '#716969' : dark ? (abs > 0.15 ? '#716969' : '#94acd0') : (abs > 0.35 ? '#716969' : '#081F5C');
  return (
    <div style={{ background: bg, color: textColor, borderRadius: 5, padding: '6px 3px', fontSize: 10, textAlign: 'center', fontWeight: 600, minWidth: 52, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: isDiag ? 'none' : (dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)') }}>
      {value.toFixed(2)}
    </div>
  );
};

const HelpCard = ({ onClose, title, sections, T }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <div className="absolute inset-0 backdrop-blur-sm" style={{background:'rgba(26,25,22,0.4)'}} onClick={onClose} />
    <div className="card-in relative z-10 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden" style={{background:T.surface, border:`1px solid ${T.border}`}}>
      <div className="flex items-center justify-between px-6 md:px-8 pt-6 pb-5" style={{borderBottom:`1px solid ${T.border}`}}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:T.surfaceAlt}}>
            <HelpCircle size={14} style={{color:T.accent}} />
          </div>
          <h2 style={{fontSize:'13px', fontWeight:600, color:T.textPrimary}}>{title}</h2>
        </div>
        <button onClick={onClose} style={{color:T.textMuted, background:'none', border:'none', cursor:'pointer'}} className="hover:opacity-70 transition-opacity"><X size={18} /></button>
      </div>
      <div className="px-6 md:px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
        {sections.map((sec, i) => (
          <div key={i}>
            <p style={{fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:'8px', color:T.textMuted}}>{sec.heading}</p>
            {(Array.isArray(sec.body) ? sec.body : [sec.body]).map((line, j) => (
              <p key={j} style={{fontSize:'13px', lineHeight:'1.65', color:T.textSecondary}}>{line}</p>
            ))}
          </div>
        ))}
      </div>
      <div className="px-6 md:px-8 pb-6 pt-2">
        <button onClick={onClose} style={{width:'100%', fontSize:'12px', fontWeight:500, padding:'10px', borderRadius:'10px', background:T.navy, color:'#716969', border:'none', cursor:'pointer'}}>Got it</button>
      </div>
    </div>
  </div>
);

const HelpBtn = ({ onClick, T }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg transition-all"
    style={{fontSize:'11px', fontWeight:500, color:T.textMuted, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer'}}
    onMouseEnter={e=>{e.currentTarget.style.color=T.textSecondary;e.currentTarget.style.borderColor=T.textMuted;}}
    onMouseLeave={e=>{e.currentTarget.style.color=T.textMuted;e.currentTarget.style.borderColor=T.border;}}>
    <HelpCircle size={12} /> <span className="hidden sm:inline">What is this?</span>
  </button>
);

const InlineConfirm = ({ message, confirmLabel='Confirm', confirmColor='#C0392B', onConfirm, onCancel, T }) => (
  <div style={{position:'fixed',top:0,right:0,bottom:0,left:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
    <div style={{position:'absolute',top:0,right:0,bottom:0,left:0,background:'rgba(26,25,22,0.35)',backdropFilter:'blur(4px)'}} onClick={onCancel} />
    <div style={{position:'relative',zIndex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'360px',boxShadow:'0 8px 40px rgba(26,25,22,0.12)'}}>
      <p style={{color:T.textPrimary,fontSize:'14px',fontWeight:600,marginBottom:'6px'}}>Confirm action</p>
      <p style={{color:T.textSecondary,fontSize:'12px',lineHeight:'1.6',marginBottom:'20px'}}>{message}</p>
      <div style={{display:'flex',gap:'10px'}}>
        <button onClick={onCancel} style={{flex:1,fontSize:'12px',fontWeight:500,color:T.textSecondary,border:`1px solid ${T.border}`,background:'transparent',padding:'10px',borderRadius:'10px',cursor:'pointer'}}>Cancel</button>
        <button onClick={onConfirm} style={{flex:1,fontSize:'12px',fontWeight:500,color:'white',background:confirmColor,border:'none',padding:'10px',borderRadius:'10px',cursor:'pointer'}}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

const CHART_EXPLANATIONS = {
  scatter:'A scatter plot places each row as a dot at (X, Y). Best for seeing correlations between two numeric variables.',
  bar:'A bar chart draws one vertical bar per data point. Best when X is categorical and you want to compare values side by side.',
  line:'A line chart connects points in sequence. Best for showing how a value changes over time or an ordered series.',
  area:'An area chart is a filled line chart. Emphasises the volume or magnitude of a metric over time.',
  histogram:'A histogram groups Y values into bins and counts how many fall into each. Reveals the shape of a distribution.',
  pie:'A pie chart shows proportions. Most effective with a small number of categories (under 6).',
  radar:'A radar chart plots multiple variables on radial axes — ideal for comparing a profile across many dimensions.',
  donut:'A donut chart is a pie chart with a hollow centre. Works best with 3–6 categories.',
  stacked:'A stacked bar chart shows the contribution of sub-series within each category bar.',
  stepped:'A step line chart shows values that change abruptly at intervals rather than gradually.',
};

const OVERVIEW_FEATURES = [
  { id:'missing', icon:<AlertTriangle size={16}/>, label:'Missing Values', desc:'See which columns have gaps and the severity of the missing data problem.' },
  { id:'correlation', icon:<GitBranch size={16}/>, label:'Correlation Matrix', desc:'Pearson r heatmap showing how every pair of numeric columns relate.' },
  { id:'rawdata', icon:<TableIcon size={16}/>, label:'Raw Data Table', desc:'Filterable, sortable, paginated and editable view of your entire dataset.' },
  { id:'distribution', icon:<BarChart2 size={16}/>, label:'Column Distribution', desc:'Key statistics (mean, median, min, max, std dev) for every numeric column.' },
];

function datasetOverview(summary) {
  if (!summary) return 'No dataset loaded yet.';
  const { total_rows, columns, types } = summary;
  const numCols = columns?.filter(c => types?.[c]==='Numeric') || [];
  const catCols = columns?.filter(c => types?.[c]==='Categorical') || [];
  return `Your dataset has ${total_rows} rows and ${columns?.length} columns — ${numCols.length} numeric (${numCols.join(', ')}) and ${catCols.length} categorical.`;
}
function datasetForRegression(summary, regX, regY) {
  if (!summary || !regX || !regY) return 'Select X and Y axes above to see dataset-specific context here.';
  return `You are regressing "${regY}" on "${regX}" using ordinary least squares across ${summary.total_rows} observations.`;
}
function datasetForViz(summary, vizX, vizY, selectedCharts) {
  if (!summary) return 'No dataset loaded yet.';
  if (!vizX || !vizY) return `Your dataset has ${summary.columns?.length} columns. Select X and Y axes to see chart-specific advice.`;
  const xType = summary.types?.[vizX] || 'unknown', yType = summary.types?.[vizY] || 'unknown';
  let advice = `"${vizX}" (${xType}) as X and "${vizY}" (${yType}) as Y. `;
  if (xType==='Numeric' && yType==='Numeric') advice += 'Both numeric — Scatter Plot and Line Graph reveal correlations most clearly.';
  else if (xType==='Categorical') advice += `"${vizX}" is categorical — Bar or Pie chart are best.`;
  else advice += 'Mixed types. Bar Chart and Pie Chart handle this best.';
  return advice;
}

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
  const [droppingCol, setDroppingCol]       = useState(null);
  const [savedMsg]                          = useState(null);
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem('raww_dark')==='1'; } catch { return false; } });
  const cleanMsgTimer = useRef(null);
  const dashboardRef  = useRef(null);

  const T = darkMode ? {
    bg:         '#0F1623',
    surface:    '#1A2236',
    surfaceAlt: '#222E45',
    border:     '#2A3A58',
    borderStrong:'#3A5080',
    textPrimary:'#E8EEFF',
    textSecondary:'#8BAAD4',
    textMuted:  '#4A6490',
    accent:     '#5B7FE8',
    accentDark: '#3A5CC8',
    navy:       '#3A5CC8',
    chip:       '#1E2D45',
  } : {
    bg:         '#7f8790',
    surface:    '#716969',
    surfaceAlt: '#70777f',
    border:     '#94acd0',
    borderStrong:'#7096D1',
    textPrimary:'#081F5C',
    textSecondary:'#334EAC',
    textMuted:  '#7096D1',
    accent:     '#334EAC',
    accentDark: '#1e326b',
    navy:       '#081F5C',
    chip:       '#D0E3FF',
  };

  const toggleDark = useCallback(() => {
    setDarkMode(d => {
      try { localStorage.setItem('raww_dark', d ? '0' : '1'); } catch {}
      return !d;
    });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('raww_profile');
      if (saved) { const { name, history } = JSON.parse(saved); if (name) setUserName(name); if (history?.length) setUploadHistory(history.map(e=>({...e,snapshot:e.snapshot||null}))); }
    } catch {}
  }, []);

  useEffect(() => {
    document.body.style.background = darkMode ? '#0F1623' : '#EEF2F7';
    document.body.style.color = darkMode ? '#E8EEFF' : '#081F5C';
  }, [darkMode]);

  const persistProfile = useCallback((name, history) => {
    try { localStorage.setItem('raww_profile', JSON.stringify({ name, history: history.slice(0,10).map(e=>({id:e.id,name:e.name,time:e.time,date:e.date,rows:e.rows,cols:e.cols,numericCols:e.numericCols,catCols:e.catCols,quickInsight:e.quickInsight,snapshot:e.snapshot})) })); } catch {}
  }, []);

  const PAGE_SIZE = 20;
  const openHelp  = (title, sections) => setHelpCard({ title, sections });
  const closeHelp = () => setHelpCard(null);
  const toggleChart = (id) => setSelectedCharts(prev => prev.includes(id) ? prev.filter(c=>c!==id) : [...prev, id]);

  const showCleanMsg = useCallback((msg, ms=4000) => {
    if (cleanMsgTimer.current) clearTimeout(cleanMsgTimer.current);
    setCleanMsg(msg);
    cleanMsgTimer.current = setTimeout(() => setCleanMsg(null), ms);
  }, []);

  const solveRegression = async (x, y) => {
    if (!x||!y) return;
    try {
      const url = new URL(`${BACKEND}/regression`);
      url.searchParams.set('x_col', x); url.searchParams.set('y_col', y);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error();
      setRegressionResult(await res.json());
    } catch { setRegressionResult({status:'error',message:'Backend Unreachable'}); }
  };

  const processFile = useCallback(async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Please upload files under 10MB.');
      return;
    }
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${BACKEND}/upload`, {method:'POST', body:formData});
      if (!res.ok) throw new Error();
      const result = await res.json();
      if (result?.status==='success') {
        setData(result); setLocalRows(null); setSelectedRows(new Set());
        const entry = { id:Date.now(), name:file.name, time:new Date().toLocaleTimeString(), date:new Date().toLocaleDateString(), rows:result.summary?.total_rows||0, cols:result.summary?.columns?.length||0, numericCols:result.summary?.columns?.filter(c=>result.summary.types?.[c]==='Numeric').length||0, catCols:result.summary?.columns?.filter(c=>result.summary.types?.[c]==='Categorical').length||0, quickInsight:result.summary?.insights?.slice(0,2).join(' · ')||'', snapshot:result };
        setUploadHistory(prev=>[entry,...prev]);
        setActiveTab('overview'); setActiveFeature('insights'); setIsWelcomed(true); setPage(0);
        persistProfile(userName,[entry]);
      } else { alert('Upload Error: '+(result.message||'Unknown error')); }
    } catch { alert('Could not connect to the backend.'); }
    finally { setIsProcessing(false); }
  }, [userName, persistProfile]);

  useEffect(() => {
    const onPaste = (e) => { const items = e.clipboardData?.items; if (!items) return; for (const item of items) { if (item.kind==='file') { const f=item.getAsFile(); if(f){processFile(f);break;} } } };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [processFile]);

  const handleFileUpload = async (e) => { for (const f of Array.from(e.target.files||[])) await processFile(f); };
  const handleDragOver  = useCallback((e) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleDrop      = useCallback((e) => { e.preventDefault(); setIsDragOver(false); Array.from(e.dataTransfer.files).forEach(f=>processFile(f)); }, [processFile]);

  const reloadEntry = (entry) => { setData(entry.snapshot); setLocalRows(null); setSelectedRows(new Set()); setActiveTab('overview'); setActiveFeature('insights'); setIsWelcomed(true); setPage(0); };
  const deleteEntry = (id) => setUploadHistory(prev=>prev.filter(e=>e.id!==id));
  const exportEntry = (entry) => {
    const rows=entry.snapshot?.preview||[]; if (!rows.length) return;
    const cols=Object.keys(rows[0]);
    const csv=[cols.join(','),...rows.map(r=>cols.map(c=>`"${r[c]??''}"`).join(','))].join('\n');
    Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:entry.name.replace(/[^a-z0-9]/gi,'_')+'_export.csv'}).click();
  };

  const cleanAction = async (action, column=null, fillValue=null) => {
    setCleanLoading(true); setCleanMsg(null);
    try {
      const params = new URLSearchParams({action});
      if (column) params.append('column',column);
      if (fillValue) params.append('fill_value',fillValue);
      const res = await fetch(`${BACKEND}/clean?${params}`,{method:'POST'});
      const result = await res.json();
      if (result.status==='success') {
        showCleanMsg({type:'success',text:result.message});
        setData(prev => {
          if (!prev) return prev;
          let updatedPreview = prev.preview||[];
          if (action==='drop_column'&&column) updatedPreview=updatedPreview.map(row=>{const{[column]:_,...rest}=row;return rest;});
          if (action==='fill_missing'&&column&&fillValue) updatedPreview=updatedPreview.map(row=>(row[column]===null||row[column]===undefined||row[column]==='')?{...row,[column]:fillValue}:row);
          return {...prev,preview:updatedPreview,summary:{...prev.summary,total_rows:result.rows??prev.summary.total_rows,duplicate_count:action==='remove_duplicates'?0:prev.summary.duplicate_count,columns:action==='drop_column'&&column?prev.summary.columns.filter(c=>c!==column):prev.summary.columns,missing_info:action==='fill_missing'&&column?Object.fromEntries(Object.entries(prev.summary.missing_info||{}).filter(([k])=>k!==column)):prev.summary.missing_info}};
        });
        if (localRows&&action==='drop_column'&&column) setLocalRows(prev=>prev.map(row=>{const{[column]:_,...rest}=row;return rest;}));
        if (localRows&&action==='fill_missing'&&column&&fillValue) setLocalRows(prev=>prev.map(row=>(row[column]===null||row[column]===undefined||row[column]==='')?{...row,[column]:fillValue}:row));
      } else { showCleanMsg({type:'error',text:result.message}); }
    } catch { showCleanMsg({type:'error',text:'Backend unreachable. The server may be waking up — try again in 30 seconds.'}); }
    finally { setCleanLoading(false); }
  };

  const exportReport = async () => {
    if (!data) return; setIsExporting(true);
    try {
      const s=data.summary,ins=s.insights||[],cs=s.col_stats||{},mi=s.missing_info||{},dup=s.duplicate_count||0;
      const numCols=s.columns?.filter(c=>s.types?.[c]==='Numeric')||[];
      const catCols=s.columns?.filter(c=>s.types?.[c]==='Categorical')||[];
      const totalMissing=Object.values(mi).reduce((a,v)=>a+(v.count||0),0);
      const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>RAWW Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;font-family:'DM Sans',sans-serif}
body{background:#EEF2F7;color:#081F5C}
.page{max-width:900px;margin:0 auto;padding:48px}
.cover{background:#1e326b;padding:48px;border-radius:0 0 20px 20px;margin-bottom:36px}
.logo{font-size:32px;font-weight:700;color:#716969;letter-spacing:-0.5px}
.sub{font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:3px;margin-top:4px}
.meta{font-size:12px;color:rgba(255,255,255,0.55);margin-top:16px}
.analyst{display:inline-block;background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:20px;font-size:11px;color:#716969;font-weight:500;margin-top:6px}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
.kpi{background:#716969;border:1px solid #94acd0;border-radius:10px;padding:18px}
.kpi-l{font-size:9px;color:#7096D1;text-transform:uppercase;font-weight:600;letter-spacing:2px;margin-bottom:4px}
.kpi-v{font-size:26px;font-weight:700;color:#081F5C;line-height:1}
.kpi-s{font-size:10px;color:#7096D1;margin-top:2px}
.sec{margin-bottom:36px}
.st{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#7096D1;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #94acd0}
.card{background:#716969;border:1px solid #94acd0;border-radius:10px;padding:14px;margin-bottom:10px}
.cl{font-size:9px;color:#7096D1;text-transform:uppercase;font-weight:600;letter-spacing:1px}
.cv{font-size:20px;font-weight:700;color:#081F5C;margin-top:3px}
.mono{font-family:monospace;font-size:13px;font-weight:600;color:#1e326b;margin-top:4px}
.ins{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #94acd0}
.in{font-size:10px;font-weight:600;color:#7096D1;min-width:24px}
.it{font-size:12px;color:#2D3E8A;line-height:1.6}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#1e326b;padding:9px 13px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.6);font-weight:600}
tr:nth-child(even) td{background:#EEF2F7}
td{padding:9px 13px;border-bottom:1px solid #94acd0;color:#2D3E8A}
.bn{background:#D0E3FF;color:#334EAC;padding:1px 7px;border-radius:3px;font-size:9px;font-weight:600}
.bc{background:#70777f;color:#334EAC;padding:1px 7px;border-radius:3px;font-size:9px;font-weight:600}
.foot{margin-top:48px;padding-top:16px;border-top:1px solid #94acd0;font-size:10px;color:#7096D1;display:flex;justify-content:space-between}
@media print{body{background:#716969}.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="page">
<div class="cover"><div class="logo">RAWW</div><div class="sub">Data Analysis Report</div><div class="meta">Generated ${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div><div class="analyst">Analyst: ${userName||'Anonymous'}</div></div>
<div class="kpi-row">
  <div class="kpi"><div class="kpi-l">Total Rows</div><div class="kpi-v">${s.total_rows?.toLocaleString()}</div><div class="kpi-s">observations</div></div>
  <div class="kpi"><div class="kpi-l">Columns</div><div class="kpi-v">${s.columns?.length}</div><div class="kpi-s">${numCols.length} numeric · ${catCols.length} categorical</div></div>
  <div class="kpi"><div class="kpi-l">Missing Values</div><div class="kpi-v">${totalMissing.toLocaleString()}</div><div class="kpi-s">across ${Object.keys(mi).length} columns</div></div>
  <div class="kpi"><div class="kpi-l">Duplicates</div><div class="kpi-v">${dup}</div><div class="kpi-s">${dup>0?'action recommended':'dataset is clean'}</div></div>
</div>
<div class="sec"><div class="st">Automated Insights</div>${ins.map((t,i)=>`<div class="ins"><span class="in">0${i+1}</span><span class="it">${t}</span></div>`).join('')}</div>
<div class="sec"><div class="st">Column Statistics</div>
<table><thead><tr><th>#</th><th>Column</th><th>Type</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std Dev</th><th>Missing</th></tr></thead>
<tbody>${s.columns?.map((col,idx)=>{const st=cs[col],miss=mi[col],type=s.types?.[col];return`<tr><td style="color:#7096D1;font-weight:600">${idx+1}</td><td><strong>${col}</strong></td><td><span class="${type==='Numeric'?'bn':'bc'}">${type}</span></td><td>${st?.mean??'—'}</td><td>${st?.median??'—'}</td><td>${st?.min??'—'}</td><td>${st?.max??'—'}</td><td>${st?.std??'—'}</td><td style="color:${miss?.pct>20?'#C0392B':'#334EAC'}">${miss?miss.pct+'%':'0%'}</td></tr>`;}).join('')}</tbody></table></div>
<div class="foot"><div><strong>RAWW</strong> — Your Data Interpreter</div><div>raww.site · ${new Date().toISOString().split('T')[0]}</div></div>
</div></body></html>`;
      const win=window.open(URL.createObjectURL(new Blob([html],{type:'text/html'})),'_blank');
      if(win) win.onload=()=>setTimeout(()=>win.print(),800);
    } finally { setIsExporting(false); }
  };

  const filteredRows = useMemo(() => {
    let result = data?.preview||[];
    if (searchQuery) result=result.filter(row=>Object.values(row||{}).some(v=>v!=null&&String(v).toLowerCase().includes(searchQuery.toLowerCase())));
    if (sortCol) result=[...result].sort((a,b)=>{const av=parseFloat(a[sortCol])||a[sortCol]||'',bv=parseFloat(b[sortCol])||b[sortCol]||'';return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});
    return result;
  }, [data, searchQuery, sortCol, sortDir]);

  const pagedRows  = useMemo(() => filteredRows.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE), [filteredRows, page]);
  const totalPages = Math.ceil(filteredRows.length/PAGE_SIZE);
  const handleSort = (col) => { if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortCol(col);setSortDir('asc');} setPage(0); };

  const dynamicStats = useMemo(() => {
    if (!data?.summary?.columns) return {};
    const stats={};
    data.summary.columns.forEach(col=>{
      const vals=filteredRows.map(r=>parseFloat(r[col])).filter(v=>!isNaN(v));
      if(vals.length>0){const s=[...vals].sort((a,b)=>a-b),mean=vals.reduce((a,b)=>a+b,0)/vals.length;stats[col]={mean,median:s[Math.floor(s.length/2)],min:Math.min(...vals),max:Math.max(...vals),std:Math.sqrt(vals.map(v=>Math.pow(v-mean,2)).reduce((a,b)=>a+b,0)/vals.length)};}
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
    const vals=data.preview.map(d=>parseFloat(d[vizY])).filter(v=>!isNaN(v));
    if (!vals.length) return [];
    const min=Math.min(...vals),max=Math.max(...vals),bins=10,size=(max-min)/bins;
    const b=Array.from({length:bins},(_,i)=>({range:`${(min+i*size).toFixed(1)}–${(min+(i+1)*size).toFixed(1)}`,count:0}));
    vals.forEach(v=>{const idx=Math.min(Math.floor((v-min)/size),bins-1);b[idx].count++;});
    return b;
  }, [vizY, data]);

  const pieData = useMemo(() => {
    if (!vizY||!data?.preview) return [];
    const isNum=data?.summary?.types?.[vizY]==='Numeric';
    if (isNum) return chartData.slice(0,8).map((d,i)=>({name:`Row ${i+1}`,value:Math.abs(d.y)}));
    const freq={};
    data.preview.forEach(d=>{const v=d[vizY];if(v)freq[v]=(freq[v]||0)+1;});
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({name,value}));
  }, [vizY, chartData, data]);

  const suggestedCharts = useMemo(() => {
    if (!vizX||!vizY||!data?.summary) return [];
    const xT=data.summary.types?.[vizX],yT=data.summary.types?.[vizY];
    if (xT==='Numeric'&&yT==='Numeric') return ['scatter','line','area'];
    if (xT==='Categorical') return ['bar','pie','donut'];
    return ['bar','line'];
  }, [vizX, vizY, data]);

  const tooltipStyle = {backgroundColor:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',fontSize:'11px',color:T.textPrimary};
  const gridColor    = T.border;
  const accentColor  = T.accent;

  const editRows = useMemo(() => localRows||data?.preview||[], [localRows, data?.preview]);
  const editCols = useMemo(() => data?.summary?.columns||[], [data?.summary?.columns]);

  const toggleRow     = useCallback((i)=>setSelectedRows(prev=>{const n=new Set(prev);n.has(i)?n.delete(i):n.add(i);return n;}),[]);
  const toggleAllRows = useCallback(()=>setSelectedRows(prev=>prev.size===editRows.length&&editRows.length>0?new Set():new Set(editRows.map((_,i)=>i))),[editRows]);
  const startEdit     = useCallback((ri,col)=>{setEditingCell({ri,col});setEditingValue(String(editRows[ri]?.[col]??''));},[editRows]);
  const commitEdit    = useCallback(()=>{if(!editingCell)return;const{ri,col}=editingCell;const updated=[...editRows];updated[ri]={...updated[ri],[col]:editingValue};setLocalRows(updated);setEditingCell(null);},[editingCell,editingValue,editRows]);

  const deleteSelectedRows = useCallback(()=>{setLocalRows(editRows.filter((_,i)=>!selectedRows.has(i)));setSelectedRows(new Set());setConfirmDropRows(false);},[editRows,selectedRows]);
  const duplicateSelectedRows = useCallback(()=>{const dupes=[...selectedRows].sort((a,b)=>a-b).map(i=>({...editRows[i]}));setLocalRows([...editRows,...dupes]);},[editRows,selectedRows]);
  const copySelectedToClipboard = useCallback(()=>{
    const sel=[...selectedRows].sort((a,b)=>a-b).map(i=>editRows[i]);if(!sel.length)return;
    const text=[editCols.join('\t'),...sel.map(r=>editCols.map(c=>r[c]??'').join('\t'))].join('\n');
    navigator.clipboard.writeText(text).then(()=>showCleanMsg({type:'success',text:'Copied to clipboard'})).catch(()=>showCleanMsg({type:'error',text:'Clipboard access denied'}));
  },[selectedRows,editRows,editCols,showCleanMsg]);

  const runCalc = useCallback(()=>{
    if(!calcCol)return;
    const vals=editRows.map(r=>parseFloat(r[calcCol])).filter(v=>!isNaN(v));let res;
    if(calcOp==='sum')res=vals.reduce((a,b)=>a+b,0);
    else if(calcOp==='avg')res=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
    else if(calcOp==='min')res=Math.min(...vals);
    else if(calcOp==='max')res=Math.max(...vals);
    else if(calcOp==='count')res=vals.length;
    else if(calcOp==='pct'){const sc=parseFloat(calcScalar)||0;res=vals.map(v=>((v/sc)*100).toFixed(2)+'%').join(', ');}
    else if(calcOp==='mul'){const sc=parseFloat(calcScalar)||1;res=vals.map(v=>(v*sc).toFixed(4)).join(', ');}
    else if(calcOp==='div'){const sc=parseFloat(calcScalar)||1;res=vals.map(v=>(v/sc).toFixed(4)).join(', ');}
    else if(calcOp==='sub'){const sc=parseFloat(calcScalar)||0;res=vals.map(v=>(v-sc).toFixed(4)).join(', ');}
    setCalcResult(res);
  },[calcCol,calcOp,calcScalar,editRows]);

  const applyCalcToCol = useCallback(()=>{
    if(!calcCol||!['mul','div','sub'].includes(calcOp))return;
    const sc=parseFloat(calcScalar)||1;
    const updated=editRows.map(r=>{const v=parseFloat(r[calcCol]);if(isNaN(v))return r;const nv=calcOp==='mul'?v*sc:calcOp==='div'?v/sc:v-sc;return{...r,[calcCol]:parseFloat(nv.toFixed(6))};});
    setLocalRows(updated);showCleanMsg({type:'success',text:`Applied ${calcOp} by ${sc} on "${calcCol}"`});
  },[calcCol,calcOp,calcScalar,editRows,showCleanMsg]);

  const regressionAnalysis = useMemo(()=>{
    if(!regressionResult||regressionResult.status!=='success')return null;
    const{r,r2,slope,intercept,equation,insight}=regressionResult;
    const absR=Math.abs(r),direction=r>0?'positive':'negative';
    const strength=absR>0.8?'very strong':absR>0.6?'strong':absR>0.4?'moderate':absR>0.2?'weak':'negligible';
    const pctExplained=(r2*100).toFixed(1),slopeDir=slope>0?'increases':'decreases',absSlope=Math.abs(slope).toFixed(4);
    return [
      `The regression model for ${regY} ~ ${regX} yields the equation ${equation}. This indicates a ${strength} ${direction} linear relationship.`,
      `Pearson r = ${r.toFixed(3)}. R² = ${r2.toFixed(3)}, meaning ${pctExplained}% of the variance in ${regY} is explained by ${regX} — ${r2>0.7?'a high explanatory power':r2>0.4?'a moderate fit':'a low fit suggesting other variables may be more influential'}.`,
      `For every one-unit increase in ${regX}, ${regY} ${slopeDir} by approximately ${absSlope} units. The y-intercept of ${intercept.toFixed(4)} represents the predicted value of ${regY} when ${regX} equals zero.`,
      insight?`Model insight: ${insight}`:null
    ].filter(Boolean);
  },[regressionResult,regX,regY]);

  const getVizWarning = useCallback((x,y,summary)=>{
    if(!x&&!y)return null;
    if(!x)return{type:'axis',msg:`Select an X axis to start plotting.`};
    if(!y)return{type:'axis',msg:`Select a Y axis to pair with "${x}".`};
    const xT=summary?.types?.[x],yT=summary?.types?.[y];
    if(xT==='Categorical'&&yT==='Categorical')return{type:'type',msg:`Both "${x}" and "${y}" are categorical. Consider using Bar or Pie chart.`};
    if(xT==='Numeric'&&yT==='Categorical')return{type:'type',msg:`"${y}" is categorical on the Y axis. Try swapping axes or selecting a numeric column.`};
    return null;
  },[]);

  const TAB_HEADINGS={overview:'Dashboard',regression:'Regression',visuals:'Visualise',clean:'Data Cleaning',history:'History'};
  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:'14px'};

  const renderChart = (type) => {
    const ci=CHART_TYPES.find(c=>c.id===type),noData=chartData.length===0;
    return (
      <div key={type} style={{...card,padding:'24px 28px'}}>
        <div className="flex items-center gap-3 mb-5">
          <div>
            <p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'2px',color:T.textMuted}}>Chart</p>
            <h3 style={{fontSize:'13px',fontWeight:600,color:T.textPrimary}}>{ci.label}</h3>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span style={{fontSize:'10px',fontFamily:'monospace',color:T.textMuted}} className="hidden sm:block">{vizX} / {vizY}</span>
            <button onClick={()=>openHelp(ci.label,[{heading:'What this chart shows',body:CHART_EXPLANATIONS[type]},{heading:'Your data',body:datasetForViz(data?.summary,vizX,vizY,selectedCharts)}])} style={{color:T.textMuted,background:'none',border:'none',cursor:'pointer'}} className="hover:opacity-60 transition-opacity"><HelpCircle size={13}/></button>
          </div>
        </div>
        {noData?(
          <div className="h-48 flex items-center justify-center rounded-xl" style={{border:`1.5px dashed ${T.border}`}}><p style={{fontSize:'12px',color:T.textMuted}}>No numeric data for selected axes</p></div>
        ):(
          <div style={{height:'280px'}}>
            <ResponsiveContainer width="100%" height="100%">
              {type==='scatter'?(<ScatterChart margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor}/><XAxis dataKey="x" type="number" stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}} label={{value:vizX,position:'insideBottom',offset:-15,fill:T.textSecondary,fontSize:10}}/><YAxis dataKey="y" type="number" stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}} label={{value:vizY,angle:-90,position:'insideLeft',fill:T.textPrimary,fontSize:10}}/><Tooltip contentStyle={tooltipStyle}/><Scatter data={chartData} fill={accentColor} fillOpacity={0.7}/></ScatterChart>)
              :type==='bar'?(<BarChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}} label={{value:vizX,position:'insideBottom',offset:-15,fill:T.textSecondary,fontSize:10}}/><YAxis stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="y" fill={accentColor} radius={[3,3,0,0]}/></BarChart>)
              :type==='line'?(<LineChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><YAxis stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><Tooltip contentStyle={tooltipStyle}/><Line type="monotone" dataKey="y" stroke={accentColor} strokeWidth={1.5} dot={false}/></LineChart>)
              :type==='area'?(<AreaChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={accentColor} stopOpacity={0.12}/><stop offset="95%" stopColor={accentColor} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><YAxis stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="y" stroke={accentColor} strokeWidth={1.5} fill="url(#aG)"/></AreaChart>)
              :type==='histogram'?(<BarChart data={histogramData} margin={{top:20,right:20,bottom:40,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="range" stroke={T.textMuted} fontSize={8} tick={{fill:T.textMuted}} angle={-30} textAnchor="end" interval={0}/><YAxis stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="count" fill={T.textMuted} radius={[3,3,0,0]}/></BarChart>)
              :type==='pie'?(<PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:T.border}}>{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:'10px',color:T.textMuted,paddingTop:'12px'}}/></PieChart>)
              :type==='radar'?(<RadarChart data={chartData.slice(0,10)} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={gridColor}/><PolarAngleAxis dataKey="x" tick={{fill:T.textMuted,fontSize:9}}/><PolarRadiusAxis tick={{fill:T.textMuted,fontSize:8}}/><Radar dataKey="y" stroke={accentColor} fill={accentColor} fillOpacity={0.2}/><Tooltip contentStyle={tooltipStyle}/></RadarChart>)
              :type==='donut'?(<PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:'10px',color:T.textMuted,paddingTop:'12px'}}/></PieChart>)
              :type==='stacked'?(<BarChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><YAxis stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="y" stackId="a" fill={accentColor}/><Bar dataKey="x" stackId="a" fill={T.textMuted} radius={[3,3,0,0]}/></BarChart>)
              :(<LineChart data={chartData} margin={{top:20,right:20,bottom:30,left:20}}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/><XAxis dataKey="x" stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><YAxis stroke={T.textMuted} fontSize={10} tick={{fill:T.textMuted}}/><Tooltip contentStyle={tooltipStyle}/><Line type="stepAfter" dataKey="y" stroke="#5F7A68" strokeWidth={1.5} dot={false}/></LineChart>)}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const UploadZone = () => (
    <label className={`group block w-full rounded-xl transition-all duration-200 cursor-pointer p-10 md:p-14 ${isDragOver?'drag-over':''}`}
      style={{border:`1.5px dashed ${isDragOver?T.accent:T.borderStrong}`,background:isDragOver?'rgba(51,78,172,0.02)':'transparent'}}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105" style={{background:T.navy}}>
          {isProcessing?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Upload size={17} style={{color:'#716969'}}/>}
        </div>
        <div>
          <p style={{fontWeight:500,fontSize:'13px',marginBottom:'4px',color:T.textPrimary}}>{isProcessing?'Processing…':isDragOver?'Drop files here':'Upload files or drag and drop'}</p>
          <p style={{fontSize:'11px',color:T.textMuted}}>CSV · Excel · JSON · TSV · JPG · PNG · WEBP · PDF</p>
          <p style={{fontSize:'10px',marginTop:'4px',color:T.textMuted}}>Max file size 10MB · Multiple files supported · Paste from clipboard (Ctrl+V)</p>
        </div>
      </div>
      <input type="file" className="hidden" onChange={handleFileUpload} accept={ACCEPTED_TYPES} multiple disabled={isProcessing}/>
    </label>
  );

  // ── LANDING PAGE ──────────────────────────────────────────────────────────
  if (!isWelcomed && introStage==='promo') return (
    <div className="min-h-screen flex flex-col" style={{background:T.bg,color:T.textPrimary,overflowX:'hidden'}}>
      <style>{globalStyles}</style>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 py-4" style={{background:darkMode?'rgba(15,22,35,0.95)':'rgba(238,242,247,0.95)',backdropFilter:'blur(12px)',borderBottom:`1px solid ${T.border}`}}>
        <div className="flex items-center gap-3"><span style={{fontSize:'16px',fontWeight:700,color:T.textPrimary,letterSpacing:'-0.3px'}}>RAWW</span></div>
        <div className="hidden md:flex items-center gap-8">
          {['Features','How it works','File formats'].map((l,i)=>(
            <span key={l} style={{fontSize:'13px',fontWeight:400,color:T.textSecondary,cursor:'pointer',transition:'color 0.15s'}} onClick={()=>document.getElementById(['features','how','formats'][i])?.scrollIntoView({behavior:'smooth'})} onMouseEnter={e=>e.currentTarget.style.color=T.textPrimary} onMouseLeave={e=>e.currentTarget.style.color=T.textSecondary}>{l}</span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDark} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{padding:'8px', borderRadius:'8px', border:`1px solid ${T.border}`, cursor:'pointer', background:'transparent', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {darkMode ? <circle cx="12" cy="12" r="5"/> : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
            </svg>
          </button>
          <button onClick={()=>setIntroStage('onboard')} style={{background:T.navy,color:'#716969',fontSize:'13px',fontWeight:500,padding:'8px 20px',borderRadius:'8px',border:'none',cursor:'pointer',transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.82'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative" style={{minHeight:'88vh',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-60px',right:'-100px',width:'480px',height:'480px',background:'radial-gradient(circle,rgba(51,78,172,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'-40px',left:'-60px',width:'360px',height:'360px',background:'radial-gradient(circle,rgba(112,150,209,0.05) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div className="relative flex flex-col justify-center px-6 md:px-16 pt-20 pb-20" style={{maxWidth:'960px',minHeight:'88vh'}}>

        <h1 className="fu1 hero-heading" style={{fontSize:'clamp(38px,6.5vw,76px)',fontWeight:700,letterSpacing:'-1.5px',lineHeight:1.08,color:T.textPrimary,maxWidth:'720px',marginBottom:'24px'}}>
          Turn raw data into clear answers.
        </h1>

        <p className="fu2" style={{fontSize:'15px',lineHeight:'1.7',marginBottom:'8px',maxWidth:'480px',color:T.textSecondary,fontWeight:400}}>
          Upload any dataset and get instant statistics, correlations, regression analysis, and visualisations — no code, no setup.
        </p>
        <p className="fu2" style={{fontSize:'13px',lineHeight:'1.6',marginBottom:'36px',maxWidth:'420px',color:T.textMuted}}>
          RAWW processes your files through a secure backend and returns professional-grade analysis in seconds.
        </p>

        <div className="fu3 flex flex-col sm:flex-row items-start gap-3 mb-14" style={{width:'100%'}}>
          <button onClick={()=>setIntroStage('onboard')} style={{display:'inline-flex',alignItems:'center',gap:'8px',fontWeight:500,fontSize:'13px',padding:'11px 28px',borderRadius:'10px',background:T.navy,color:'#716969',border:'none',cursor:'pointer',boxShadow:'0 2px 14px rgba(8,31,92,0.16)',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 5px 20px rgba(8,31,92,0.22)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 14px rgba(8,31,92,0.16)';}}>
            Start analysing — it's free <ArrowRight size={14}/>
          </button>
          <button onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})} style={{display:'inline-flex',alignItems:'center',gap:'8px',fontWeight:500,fontSize:'13px',padding:'11px 24px',borderRadius:'10px',background:T.surface,color:T.textSecondary,border:`1px solid ${T.border}`,cursor:'pointer',transition:'border-color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.textSecondary} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            See how it works
          </button>
        </div>

        <div className="fu4 flex flex-wrap justify-start gap-10 mb-4">
          {[['10+','Chart types'],['30','Column stats'],['Instant','Processing'],['0','Code needed']].map(([n,l])=>(
            <div key={l} className="text-center">
              <p style={{fontSize:'22px',fontWeight:700,color:T.textPrimary}}>{n}</p>
              <p style={{fontSize:'10px',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.1em',color:T.textMuted}}>{l}</p>
            </div>
          ))}
        </div>

        {uploadHistory.length>0 && (
          <div className="mt-8 flex items-center gap-3 flex-wrap justify-start">
            <span style={{fontSize:'10px',textTransform:'uppercase',fontWeight:600,letterSpacing:'0.1em',color:T.textMuted}}>Resume:</span>
            {uploadHistory.slice(0,3).map(e=>(
              <button key={e.id} onClick={()=>reloadEntry(e)} style={{fontSize:'11px',fontWeight:500,padding:'5px 12px',borderRadius:'7px',color:T.textSecondary,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',transition:'border-color 0.15s'}} onMouseEnter={ev=>ev.currentTarget.style.borderColor=T.textPrimary} onMouseLeave={ev=>ev.currentTarget.style.borderColor=T.border}>
                <FileText size={10}/> {e.name}
              </button>
            ))}
          </div>
        )}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{background:T.surface,borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,padding:'80px 24px'}}>
        <div style={{maxWidth:'960px',margin:'0 auto'}}>
          <div style={{marginBottom:'52px'}}>
            <p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.15em',color:T.textMuted,marginBottom:'10px'}}>What RAWW does</p>
            <h2 style={{fontSize:'clamp(20px,3.5vw,30px)',fontWeight:700,color:T.textPrimary,letterSpacing:'-0.3px',lineHeight:1.2,maxWidth:'480px',marginBottom:'10px'}}>Everything you need to understand your data</h2>
            <p style={{fontSize:'13px',color:T.textMuted,maxWidth:'440px',lineHeight:'1.6'}}>From raw upload to polished report — RAWW handles the analysis so you can focus on the insights.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {title:'Instant Insights',desc:'Auto-generated insight report the moment your file lands. Key stats, anomalies, and patterns surface immediately — no configuration.'},
              {title:'10 Chart Types',desc:'Scatter, bar, line, area, histogram, pie, donut, radar, stacked, and step charts. Smart suggestions based on your column types.'},
              {title:'Linear Regression',desc:'Full OLS regression with Pearson r, R², slope, intercept, scatter plot, and a plain-English written analysis of the results.'},
              {title:'Correlation Matrix',desc:'Pearson heatmap across all numeric columns. Identify relationships and dependencies between variables at a glance.'},
              {title:'Data Cleaning',desc:'Fill missing values, remove duplicates, drop columns, edit cells, delete rows, and run column calculations — all in-browser.'},
              {title:'PDF Export',desc:'One-click professional report with cover page, KPI summary, insight log, and full column statistics.'},
            ].map(f=>(
              <div key={f.title} className="feature-card p-5 rounded-xl" style={{background:T.bg,border:`1px solid ${T.border}`}}>
                <h3 style={{fontSize:'13px',fontWeight:600,marginBottom:'7px',color:T.textPrimary}}>{f.title}</h3>
                <p style={{fontSize:'12px',lineHeight:'1.65',color:T.textMuted}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{background:T.bg,padding:'80px 24px'}}>
        <div style={{maxWidth:'880px',margin:'0 auto'}}>
          <div style={{marginBottom:'52px'}}>
            <p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.15em',color:T.textMuted,marginBottom:'10px'}}>Process</p>
            <h2 style={{fontSize:'clamp(20px,3.5vw,30px)',fontWeight:700,color:T.textPrimary,letterSpacing:'-0.3px',lineHeight:1.2,maxWidth:'380px',marginBottom:'8px'}}>Up and running in seconds</h2>
            <p style={{fontSize:'13px',color:T.textMuted}}>No installs. No accounts. No waiting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {[{n:'01',title:'Upload',desc:'Drag and drop or paste any file — CSV, Excel, JSON, image, PDF, or TSV.'},{n:'02',title:'Process',desc:'RAWW sends your file to a secure backend that parses, validates, and analyses every column.'},{n:'03',title:'Explore',desc:'Browse insights, visualise with charts, run regression, and clean your data — all in one place.'},{n:'04',title:'Export',desc:'Download a comprehensive PDF report or export cleaned data as CSV.'}].map(s=>(
              <div key={s.n}>
                <p style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.15em',color:T.textMuted,marginBottom:'8px'}}>{s.n}</p>
                <h3 style={{fontSize:'14px',fontWeight:600,marginBottom:'6px',color:T.textPrimary}}>{s.title}</h3>
                <p style={{fontSize:'12px',lineHeight:'1.65',color:T.textMuted}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formats */}
      <section id="formats" style={{background:T.surface,borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,padding:'72px 24px'}}>
        <div style={{maxWidth:'860px',margin:'0 auto'}}>
          <div style={{marginBottom:'36px'}}>
            <p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.15em',color:T.textMuted,marginBottom:'10px'}}>Compatibility</p>
            <h2 style={{fontSize:'clamp(18px,3vw,26px)',fontWeight:700,color:T.textPrimary,letterSpacing:'-0.2px',lineHeight:1.2,maxWidth:'380px'}}>Works with every format you use</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {[{ext:'CSV',desc:'Comma-separated values'},{ext:'XLSX',desc:'Excel spreadsheets'},{ext:'JSON',desc:'Structured JSON data'},{ext:'TSV',desc:'Tab-separated values'},{ext:'PDF',desc:'PDF documents'},{ext:'PNG',desc:'Image files'},{ext:'JPG',desc:'JPEG images'},{ext:'WEBP',desc:'Modern image format'}].map(f=>(
              <div key={f.ext} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{background:T.bg,border:`1px solid ${T.border}`,minWidth:'160px'}}>
                <span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'4px',background:T.chip,color:T.textSecondary}}>{f.ext}</span>
                <span style={{fontSize:'12px',color:T.textMuted}}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{background:T.accentDark,padding:'80px 24px',textAlign:'center'}}>
        <div style={{maxWidth:'520px',margin:'0 auto'}}>
          <p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.15em',color:'rgba(255,255,255,0.3)',marginBottom:'14px'}}>Ready to start?</p>
          <h2 style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:700,color:'#716969',letterSpacing:'-0.5px',lineHeight:1.15,marginBottom:'14px'}}>Your data is waiting<br/>to tell you something.</h2>
          <p style={{fontSize:'13px',marginBottom:'28px',color:'rgba(255,255,255,0.45)'}}>Upload your first dataset in under 10 seconds. No signup, no credit card, no code.</p>
          <button onClick={()=>setIntroStage('onboard')} style={{display:'inline-flex',alignItems:'center',gap:'8px',fontWeight:500,fontSize:'13px',padding:'11px 30px',borderRadius:'10px',background:'#716969',color:'#081F5C',border:'none',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
            Analyse my data — it's free <ArrowRight size={14}/>
          </button>
          <p style={{color:'rgba(255,255,255,0.2)',fontSize:'11px',marginTop:'14px'}}>Works in Chrome, Firefox, Safari · No install required</p>
        </div>
      </section>

      <footer style={{background:'#0d1f4a',borderTop:'1px solid rgba(255,255,255,0.06)',padding:'22px 48px',display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap'}}>
        <div className="flex items-center gap-3"><span style={{fontSize:'13px',fontWeight:700,color:'rgba(255,255,255,0.45)',letterSpacing:'-0.2px'}}>RAWW</span><span style={{fontSize:'12px',fontWeight:400,color:'rgba(255,255,255,0.35)'}}>— Your Data Interpreter</span></div>
        <p style={{fontSize:'10px',color:'rgba(255,255,255,0.18)'}}>No data is stored. Files are processed in-session only.</p>
        <p style={{fontSize:'10px',color:'rgba(255,255,255,0.18)'}}>raww.site</p>
      </footer>
    </div>
  );

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  if (!isWelcomed && introStage==='onboard') return (
    <div className="min-h-screen flex flex-col" style={{background:T.bg,color:T.textPrimary}}>
      <style>{globalStyles}</style>
      <nav className="flex items-center justify-between px-6 md:px-14 py-5" style={{borderBottom:`1px solid ${T.border}`}}>
        <button onClick={()=>setIntroStage('promo')} style={{fontSize:'12px',fontWeight:400,color:T.textMuted,background:'none',border:'none',cursor:'pointer',transition:'color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.color=T.textPrimary} onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}>Back</button>
        <div className="flex items-center gap-2.5"><span style={{fontSize:'16px',fontWeight:700,color:T.textPrimary,letterSpacing:'-0.2px'}}>RAWW</span></div>
        <button onClick={toggleDark} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{padding:'8px', borderRadius:'8px', border:`1px solid ${T.border}`, cursor:'pointer', background:'transparent', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {darkMode ? <circle cx="12" cy="12" r="5"/> : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
          </svg>
        </button>
      </nav>
      <div className="flex-1 flex flex-col items-start justify-center px-6 pb-16 max-w-lg mx-auto w-full">
        <div className="fu1 mb-8">
          <p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:T.textMuted,marginBottom:'10px'}}>Step 1 of 2</p>
          <h2 style={{fontSize:'22px',fontWeight:700,letterSpacing:'-0.3px',marginBottom:'8px',color:T.textPrimary}}>Set up your session</h2>
          <p style={{fontSize:'13px',color:T.textMuted}}>Give yourself an ID to appear on your exported reports.</p>
        </div>
        <div className="fu2 w-full mb-7">
          <label style={{display:'block',fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'8px',color:T.textMuted}}>Your name or ID</label>
          <input type="text" placeholder="e.g. Analyst_01" value={userName} onChange={e=>setUserName(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-all" style={{background:T.surface,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:'13px'}} onFocus={e=>e.target.style.borderColor=T.textPrimary} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div className="fu3 w-full flex items-center gap-4 mb-7">
          <div className="flex-1 h-px" style={{background:T.border}}/><p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:T.textMuted,flexShrink:0}}>Step 2 — Upload your data</p><div className="flex-1 h-px" style={{background:T.border}}/>
        </div>
        {!userName.trim() && (
          <div className="fu3 w-full mb-3 px-4 py-3 rounded-xl flex items-center gap-2 warn-in" style={{background:T.chip,border:`1px solid ${T.borderStrong}`}}>
            <AlertTriangle size={13} style={{color:T.accent,flexShrink:0}}/>
            <p style={{fontSize:'11px',fontWeight:500,color:T.accentDark}}>Enter your name or ID above before uploading.</p>
          </div>
        )}
        <div className="fu4 w-full" style={{opacity:userName.trim()?1:0.45,pointerEvents:userName.trim()?'auto':'none',transition:'opacity 0.2s'}}><UploadZone/></div>
        <p className="fu5" style={{fontSize:'11px',marginTop:'16px',color:T.textMuted}}>{userName.trim()?'Dashboard stays empty until a file is uploaded':'Fill your name above to unlock upload'}</p>
        {uploadHistory.length>0 && (
          <div className="fu5 mt-8 w-full">
            <p style={{fontSize:'10px',textTransform:'uppercase',fontWeight:600,letterSpacing:'0.1em',marginBottom:'10px',color:T.textMuted}}>Or reload a previous session</p>
            <div className="space-y-2">
              {uploadHistory.slice(0,3).map(e=>(
                <button key={e.id} onClick={()=>reloadEntry(e)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all" style={{background:T.surface,border:`1px solid ${T.border}`,cursor:'pointer'}} onMouseEnter={ev=>ev.currentTarget.style.borderColor=T.textPrimary} onMouseLeave={ev=>ev.currentTarget.style.borderColor=T.border}>
                  <div className="flex items-center gap-3 truncate"><FileText size={12} style={{color:T.textMuted,flexShrink:0}}/><span style={{fontSize:'12px',fontWeight:500,color:T.textPrimary}}>{e.name}</span></div>
                  <span style={{fontSize:'11px',marginLeft:'8px',flexShrink:0,color:T.textMuted}}>{e.rows} rows</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── MAIN DASHBOARD ────────────────────────────────────────────────────────
  const numericCols = data?.summary?.columns?.filter(c=>data.summary?.types?.[c]==='Numeric')||[];

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row overflow-hidden" style={{background:T.bg,color:T.textPrimary}} ref={dashboardRef}>
      <style>{globalStyles}</style>

      {helpCard && <HelpCard onClose={closeHelp} title={helpCard.title} sections={helpCard.sections} T={T}/>}
      {confirmDrop && <InlineConfirm T={T} message={`Drop column "${confirmDrop.col}"? This removes it from the backend session. Re-upload to restore it.`} confirmLabel="Drop column" confirmColor="#C0392B" onConfirm={()=>{setDroppingCol(confirmDrop.col);setTimeout(()=>{cleanAction('drop_column',confirmDrop.col);setDroppingCol(null);},560);setConfirmDrop(null);}} onCancel={()=>setConfirmDrop(null)}/>}
      {confirmDropRows && <InlineConfirm T={T} message={`Delete ${selectedRows.size} selected row${selectedRows.size!==1?'s':''}? This affects your local view only.`} confirmLabel="Delete rows" confirmColor="#C0392B" onConfirm={deleteSelectedRows} onCancel={()=>setConfirmDropRows(false)}/>}

      {cleanMsg && (
        <div className="fixed top-4 right-4 z-[250] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-sm" style={{fontSize:'12px',fontWeight:500,background:cleanMsg.type==='success'?T.chip:'#FDE8E8',border:`1px solid ${cleanMsg.type==='success'?T.borderStrong:'#F4A0A0'}`,color:cleanMsg.type==='success'?T.textSecondary:'#C0392B'}}>
          {cleanMsg.type==='success'?<CheckCircle2 size={13}/>:<AlertTriangle size={13}/>}{cleanMsg.text}
        </div>
      )}
      {savedMsg && (
        <div className="fixed top-16 right-4 z-[250] warn-in flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-md max-w-xs" style={{background:T.accentDark,border:`1px solid ${T.accent}`,color:'#716969'}}>
          <CheckCircle2 size={13} style={{color:'#90CAF9',flexShrink:0}}/>
          <div><p style={{fontWeight:600,fontSize:'12px',marginBottom:'2px'}}>Saved to browser</p><p style={{color:'rgba(255,255,255,0.55)',fontWeight:400,fontSize:'11px'}}>{savedMsg}</p></div>
        </div>
      )}

      {/* Sidebar */}
      <nav className="w-full md:w-[58px] flex flex-row md:flex-col items-center justify-around md:justify-start py-3 md:py-7 md:gap-4 z-20 order-last md:order-first shrink-0" style={{background:T.surface,borderTop:`1px solid ${T.border}`}}>
        <div className="hidden md:flex mb-4 justify-center w-full"><span style={{fontSize:'13px',fontWeight:700,color:T.textPrimary,letterSpacing:'-0.2px'}}>RAWW</span></div>
        {[{id:'overview',icon:<LayoutGrid size={17}/>},{id:'regression',icon:<Microscope size={17}/>},{id:'visuals',icon:<Activity size={17}/>},{id:'clean',icon:<Eraser size={17}/>},{id:'history',icon:<History size={17}/>}].map(({id,icon})=>(
          <button key={id} onClick={()=>setActiveTab(id)} title={TAB_HEADINGS[id]} style={{padding:'10px',borderRadius:'8px',transition:'all 0.15s',border:'none',cursor:'pointer',background:activeTab===id?T.navy:'transparent',color:activeTab===id?'#716969':T.textMuted}} onMouseEnter={e=>{if(activeTab!==id)e.currentTarget.style.color=T.textSecondary;}} onMouseLeave={e=>{if(activeTab!==id)e.currentTarget.style.color=T.textMuted;}}>
            {icon}
          </button>
        ))}
        <div className="hidden md:flex mt-auto pt-4 justify-center w-full" style={{borderTop:`1px solid ${T.border}`}}>
          <button onClick={toggleDark} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{padding:'10px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center'}}
            onMouseEnter={e=>e.currentTarget.style.color=T.textSecondary} onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {darkMode ? <circle cx="12" cy="12" r="5"/> : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
            </svg>
          </button>
        </div>
        <button onClick={toggleDark} title="Toggle dark mode" className="md:hidden" style={{padding:'10px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:T.textMuted}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {darkMode ? <circle cx="12" cy="12" r="5"/> : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
          </svg>
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto" style={{borderLeft:`1px solid ${T.border}`}}>
        <header className="flex flex-col lg:flex-row justify-between items-start mb-7 gap-4 lg:gap-0" style={{paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
          <div>
            <p style={{fontSize:'11px',fontWeight:400,color:T.textMuted,marginBottom:'4px'}}>{userName||'Anonymous session'}</p>
            <h1 style={{fontSize:'19px',fontWeight:600,color:T.textPrimary,letterSpacing:'-0.2px'}}>{TAB_HEADINGS[activeTab]}</h1>
            {data?.summary?.file_type && <span style={{marginTop:'6px',display:'inline-block',fontSize:'10px',padding:'2px 8px',borderRadius:'4px',color:T.textMuted,border:`1px solid ${T.border}`,background:T.surfaceAlt}}>{data.summary.file_type} loaded</span>}
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <button onClick={exportReport} disabled={!data||isExporting} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all disabled:opacity-40" style={{fontWeight:500,fontSize:'12px',background:T.surface,border:`1px solid ${T.border}`,color:T.textSecondary,cursor:'pointer'}} onMouseEnter={e=>{if(!e.currentTarget.disabled){e.currentTarget.style.borderColor=T.textPrimary;e.currentTarget.style.color=T.textPrimary;}}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSecondary;}}>
              <Download size={13}/> {isExporting?'Preparing…':'Export Report'}
            </button>
            <label className="flex-1 lg:flex-none cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all" style={{fontWeight:500,fontSize:'12px',background:T.navy,color:'#716969'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              {isProcessing?'Uploading…':'Upload New'}<input type="file" className="hidden" onChange={handleFileUpload} accept={ACCEPTED_TYPES} multiple/>
            </label>
          </div>
        </header>

        {!data && activeTab!=='history' && <div className="max-w-lg mx-auto py-8"><UploadZone/></div>}

        {/* OVERVIEW */}
        {data && activeTab==='overview' && (
          <div className="space-y-6 pb-20">
            {(data.summary?.duplicate_count>0||Object.values(data.summary?.missing_info||{}).some(m=>m.pct>10)) && (
              <div className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-3" style={{background:T.chip,border:`1px solid ${T.borderStrong}`}}>
                <AlertTriangle size={13} style={{color:T.accent,flexShrink:0}}/>
                {data.summary.duplicate_count>0 && <span style={{fontSize:'12px',fontWeight:500,color:T.textPrimary}}>{data.summary.duplicate_count} duplicate rows — <button onClick={()=>setActiveTab('clean')} style={{textDecoration:'underline',background:'none',border:'none',cursor:'pointer',color:T.textPrimary,fontSize:'12px'}}>go to Data Cleaning</button></span>}
                {Object.entries(data.summary.missing_info||{}).filter(([,v])=>v.pct>10).map(([col,info])=><span key={col} style={{fontSize:'12px',fontWeight:500,color:T.textPrimary}}>{col}: {info.pct}% missing</span>)}
              </div>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 p-6 md:p-7" style={card}>
                <div className="flex items-center justify-between mb-5">
                  <h3 style={{fontSize:'13px',fontWeight:600,color:T.textPrimary,display:'flex',alignItems:'center',gap:'8px'}}><Zap size={14} style={{color:T.textMuted}}/> Insight Report</h3>
                  <HelpBtn T={T} onClick={()=>openHelp('Insight Report',[{heading:'What is the Insight Report?',body:'Auto-generated the moment you upload. RAWW scans every column and surfaces the most noteworthy findings.'},{heading:'About this dataset',body:datasetOverview(data?.summary)}])}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  {data.summary?.insights?.map((insight,idx)=>(
                    <div key={idx} className="flex gap-3 items-start py-2" style={{borderLeft:`2px solid ${T.border}`,paddingLeft:'12px'}}>
                      <span style={{fontWeight:600,fontSize:'10px',marginTop:'2px',flexShrink:0,color:T.textMuted}}>0{idx+1}</span>
                      <p style={{fontSize:'12px',lineHeight:'1.65',color:T.textSecondary}}>{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5" style={card}>
                <h3 style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'16px',color:T.textMuted,display:'flex',alignItems:'center',gap:'6px'}}><Share2 size={12}/> Column Relations</h3>
                <div className="space-y-4">
                  {data.summary?.system_relations?.map((rel,i)=>(
                    <div key={i} className="pb-3" style={{borderBottom:`1px solid ${T.surfaceAlt}`}}>
                      <p style={{fontSize:'11px',marginBottom:'2px',color:T.textMuted}} className="truncate">{rel.colA} + {rel.colB}</p>
                      <div className="flex justify-between items-end">
                        <span style={{fontSize:'11px',color:T.textMuted}}>{rel.strength>0?'Positive':'Negative'}</span>
                        <span style={{fontWeight:700,fontSize:'17px',color:T.textPrimary}}>{(rel.strength*100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div>
              <p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:T.textMuted,marginBottom:'12px'}}>Explore your data</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {OVERVIEW_FEATURES.map(f=>(
                  <button key={f.id} onClick={()=>setActiveFeature(activeFeature===f.id?null:f.id)} style={{textAlign:'left',padding:'18px 20px',borderRadius:'12px',cursor:'pointer',transition:'all 0.15s',border:'none',background:activeFeature===f.id?T.navy:T.surface,outline:`1px solid ${activeFeature===f.id?T.navy:T.border}`}} onMouseEnter={e=>{if(activeFeature!==f.id)e.currentTarget.style.outline=`1px solid ${T.borderStrong}`;}} onMouseLeave={e=>{if(activeFeature!==f.id)e.currentTarget.style.outline=`1px solid ${T.border}`;}}>
                    <div style={{marginBottom:'10px',opacity:activeFeature===f.id?0.6:1,color:activeFeature===f.id?'#716969':T.accent}}>{f.icon}</div>
                    <p style={{fontSize:'12px',fontWeight:600,marginBottom:'4px',color:activeFeature===f.id?'#716969':T.textPrimary}}>{f.label}</p>
                    <p style={{fontSize:'11px',lineHeight:'1.55',color:activeFeature===f.id?'rgba(255,255,255,0.65)':T.textMuted}}>{f.desc}</p>
                    <div style={{marginTop:'10px',fontSize:'10px',fontWeight:500,color:activeFeature===f.id?'rgba(255,255,255,0.55)':T.textMuted}}>{activeFeature===f.id?'Collapse':'Open'}</div>
                  </button>
                ))}
              </div>
            </div>

            {activeFeature==='missing' && data.summary?.missing_info && (
              <section className="p-6 rounded-xl card-in" style={card}>
                <div className="flex items-center justify-between mb-5">
                  <h3 style={{fontSize:'13px',fontWeight:600,color:T.textPrimary,display:'flex',alignItems:'center',gap:'8px'}}><AlertTriangle size={14} style={{color:T.accent}}/> Missing Values</h3>
                  <HelpBtn T={T} onClick={()=>openHelp('Missing Values',[{heading:'What are missing values?',body:'Cells where no data was recorded — from entry errors, sensor failures, or optional fields.'},{heading:'What can I do?',body:'Go to Data Cleaning to fill missing values or drop columns entirely.'}])}/>
                </div>
                {Object.keys(data.summary.missing_info).length===0?(
                  <div className="flex items-center gap-2.5"><CheckCircle2 size={13} style={{color:T.accent}}/><p style={{fontSize:'12px',fontWeight:500,color:T.accent}}>No missing values in this dataset.</p></div>
                ):(
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(data.summary.missing_info).map(([col,info])=>(
                      <div key={col} className="rounded-xl p-4" style={{background:T.navy}}>
                        <p style={{fontSize:'10px',fontWeight:500,marginBottom:'8px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textTransform:'uppercase',letterSpacing:'0.05em',color:'rgba(255,255,255,0.4)'}}>{col}</p>
                        <p style={{fontSize:'22px',fontWeight:700,color:info.pct>20?'#F4A0A0':info.pct>5?'#7096D1':'#90CAF9'}}>{info.pct}%</p>
                        <p style={{fontSize:'10px',marginTop:'4px',color:'rgba(255,255,255,0.3)'}}>{info.count} missing</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeFeature==='correlation' && data.summary?.corr_matrix && (
              <section className="rounded-xl card-in overflow-hidden" style={{background:T.surface,border:`1.5px solid ${T.textPrimary}`}}>
                <div className="px-6 py-4 flex items-center justify-between" style={{background:T.navy}}>
                  <h3 style={{fontSize:'13px',fontWeight:600,color:'#716969'}}>Correlation Matrix</h3>
                  <HelpBtn T={T} onClick={()=>openHelp('Correlation Matrix',[{heading:'What is a correlation matrix?',body:'Shows Pearson r between every pair of numeric columns. Ranges from −1 (perfect negative) to +1 (perfect positive).'}])}/>
                </div>
                <div className="p-6 overflow-x-auto">
                  <div style={{display:'inline-block',minWidth:'100%'}}>
                    <div style={{display:'grid',gridTemplateColumns:`90px repeat(${data.summary.corr_matrix.columns.length},1fr)`,gap:3}}>
                      <div/>
                      {data.summary.corr_matrix.columns.map(col=><div key={col} style={{fontSize:8,color:T.textSecondary,fontWeight:600,textAlign:'center',padding:'4px 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{col}</div>)}
                      {data.summary.corr_matrix.columns.map((rowCol,i)=>(
                        <React.Fragment key={rowCol}>
                          <div style={{fontSize:8,color:T.textSecondary,fontWeight:500,display:'flex',alignItems:'center',paddingRight:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{rowCol}</div>
                          {data.summary.corr_matrix.values[i].map((val,j)=><HeatmapCell key={j} value={val??0} dark={darkMode}/>)}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 px-6 pb-5">
                  {[['rgba(51,78,172,0.7)','Positive'],['rgba(160,64,64,0.7)','Negative'],[T.textPrimary,'Self (1.0)']].map(([bg,label])=>(
                    <div key={label} className="flex items-center gap-2"><div style={{width:10,height:10,background:bg,borderRadius:2}}/><span style={{fontSize:'10px',fontWeight:500,color:T.textSecondary}}>{label}</span></div>
                  ))}
                </div>
              </section>
            )}

            {activeFeature==='rawdata' && (
              <section className="space-y-3 card-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <h3 style={{fontSize:'13px',fontWeight:600,color:T.textPrimary,display:'flex',alignItems:'center',gap:'8px'}}><TableIcon size={14}/> Raw Data Table</h3>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex-1 md:flex-none flex items-center rounded-xl px-3 py-2" style={{background:T.surface,border:`1.5px solid ${T.textPrimary}`}}>
                      <input type="text" value={searchQuery} onChange={e=>{setSearchQuery(e.target.value);setPage(0);}} placeholder="Filter rows…" className="bg-transparent border-none outline-none w-full md:w-44" style={{fontSize:'12px',color:T.textPrimary}}/>
                    </div>
                    <button onClick={()=>setActiveTab('clean')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all" style={{fontSize:'11px',fontWeight:600,color:T.textPrimary,border:`1.5px solid ${T.textPrimary}`,background:'transparent',cursor:'pointer'}} onMouseEnter={e=>{e.currentTarget.style.background=T.textPrimary;e.currentTarget.style.color=T.surface;}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textPrimary;}}>
                      <Pencil size={11}/> <span className="hidden sm:inline">Edit</span>
                    </button>
                    <HelpBtn T={T} onClick={()=>openHelp('Raw Data Table',[{heading:'What is the Raw Data Table?',body:'A direct view of every row in your dataset.'},{heading:'Sorting and filtering',body:'Click any column header to sort. Use the filter box to search across all columns.'}])}/>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden" style={{background:T.surface,border:`1.5px solid ${T.textPrimary}`}}>
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10" style={{background:T.surfaceAlt,borderBottom:`1.5px solid ${T.textPrimary}`}}>
                        <tr>{data.summary?.columns?.map(col=>(
                          <th key={col} style={{padding:'10px 14px',whiteSpace:'nowrap',cursor:'pointer'}} onClick={()=>handleSort(col)} onMouseEnter={e=>e.currentTarget.style.background=T.chip} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <p style={{fontSize:'11px',fontWeight:600,color:T.textPrimary,marginBottom:'2px',display:'flex',alignItems:'center',gap:'4px'}}>{col}{sortCol===col&&<span style={{fontSize:'9px'}}>{sortDir==='asc'?'↑':'↓'}</span>}</p>
                            <span style={{fontSize:'9px',padding:'1px 6px',borderRadius:'3px',fontWeight:600,background:data.summary?.types?.[col]==='Numeric'?T.navy:T.accent,color:'#716969'}}>{data.summary?.types?.[col]||'FEATURE'}</span>
                          </th>
                        ))}</tr>
                      </thead>
                      <tbody style={{fontFamily:'monospace',fontSize:'11px'}}>{pagedRows.map((row,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${T.border}`}} onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          {data.summary?.columns?.map(col=><td key={col} style={{padding:'9px 14px',whiteSpace:'nowrap',color:T.textPrimary,fontWeight:400}}>{row[col]==null?<span style={{color:T.textMuted,fontStyle:'italic'}}>null</span>:String(row[col])}</td>)}
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 gap-2" style={{borderTop:`1px solid ${T.border}`,background:T.bg}}>
                    <p style={{fontSize:'11px',fontFamily:'monospace',color:T.textSecondary}}>{page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE,filteredRows.length)} of {filteredRows.length}</p>
                    <div className="flex gap-2">
                      <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{fontSize:'11px',fontWeight:500,padding:'5px 12px',borderRadius:'6px',border:`1.5px solid ${T.textPrimary}`,background:'transparent',color:T.textPrimary,cursor:'pointer',opacity:page===0?0.3:1}}>Prev</button>
                      <span style={{fontSize:'11px',padding:'5px 8px',color:T.textMuted}}>{page+1}/{totalPages}</span>
                      <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)} style={{fontSize:'11px',fontWeight:500,padding:'5px 12px',borderRadius:'6px',border:`1.5px solid ${T.textPrimary}`,background:'transparent',color:T.textPrimary,cursor:'pointer',opacity:page>=totalPages-1?0.3:1}}>Next</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeFeature==='distribution' && (
              <section className="space-y-3 card-in">
                <div className="flex items-center justify-between">
                  <h3 style={{fontSize:'13px',fontWeight:600,color:T.textPrimary,display:'flex',alignItems:'center',gap:'8px'}}><BarChart2 size={14} style={{color:T.accent}}/> Column Distribution</h3>
                  <HelpBtn T={T} onClick={()=>openHelp('Column Distribution',[{heading:'What is this?',body:'Key descriptive statistics for every numeric column.'},{heading:'Click to inspect',body:'Click any card for a full deep inspection modal.'}])}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(dynamicStats).map(colName=>(
                    <div key={colName} onClick={()=>setZoomedCol(colName)} className="p-5 rounded-xl transition-all cursor-zoom-in" style={{background:T.surface,border:`1px solid ${T.border}`}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.textPrimary} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                      <div className="flex justify-between items-start mb-3">
                        <p style={{fontSize:'12px',fontWeight:500,color:T.textSecondary,maxWidth:'80%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{colName}</p>
                        <Activity size={12} style={{color:T.textMuted,flexShrink:0}}/>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p style={{fontSize:'10px',marginBottom:'2px',color:T.textMuted}}>Mean</p><p style={{fontSize:'18px',fontWeight:600,color:T.textPrimary}}>{dynamicStats[colName].mean.toFixed(2)}</p></div>
                        <div><p style={{fontSize:'10px',marginBottom:'2px',color:T.textMuted}}>Max</p><p style={{fontSize:'18px',fontWeight:600,color:T.textPrimary}}>{dynamicStats[colName].max.toFixed(2)}</p></div>
                      </div>
                      {data.summary?.missing_info?.[colName]?.pct>0 && <p style={{marginTop:'8px',fontSize:'10px',color:T.accent}}>{data.summary.missing_info[colName].pct}% missing</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* VISUALS */}
        {data && activeTab==='visuals' && (
          <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-xl w-full md:w-auto" style={{background:T.surface,border:`1px solid ${T.border}`}}>
                {[{val:vizX,set:setVizX,placeholder:'X Axis'},{val:vizY,set:setVizY,placeholder:'Y Axis'}].map(({val,set,placeholder})=>(
                  <select key={placeholder} value={val} onChange={e=>set(e.target.value)} className="outline-none px-3 py-2 rounded-lg w-full sm:w-auto" style={{fontSize:'12px',fontWeight:500,background:T.bg,border:`1px solid ${T.border}`,color:val?T.textPrimary:T.textMuted,cursor:'pointer'}}>
                    <option value="">Select {placeholder}</option>
                    {data.summary?.columns?.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                ))}
              </div>
              <HelpBtn T={T} onClick={()=>openHelp('Visualise',[{heading:'What is Visualise?',body:'Create any combination of charts. Select X and Y axes then pick chart types.'},{heading:'Auto-suggestions',body:'RAWW analyses your column types and suggests the most appropriate charts.'}])}/>
            </div>

            {suggestedCharts.length>0 && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl" style={{background:T.bg,border:`1px solid ${T.border}`}}>
                <Sparkles size={12} style={{color:T.textMuted,flexShrink:0}}/>
                <p style={{fontSize:'11px',fontWeight:500,color:T.textMuted,marginRight:'4px'}}>Suggested:</p>
                {suggestedCharts.map(id=>{const c=CHART_TYPES.find(ct=>ct.id===id);return(<button key={id} onClick={()=>!selectedCharts.includes(id)&&toggleChart(id)} style={{fontSize:'11px',fontWeight:500,padding:'5px 12px',borderRadius:'6px',color:T.textMuted,border:`1px solid ${T.borderStrong}`,background:T.surface,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background=T.surface}>{c.label}</button>);})}
              </div>
            )}

            <div className="p-5 rounded-xl" style={card}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <p style={{fontSize:'12px',color:T.textMuted}}>{selectedCharts.length} chart type{selectedCharts.length!==1?'s':''} selected</p>
                <div className="flex gap-2">
                  <button onClick={()=>setSelectedCharts(CHART_TYPES.map(c=>c.id))} style={{fontSize:'11px',fontWeight:500,padding:'5px 12px',borderRadius:'6px',color:T.textSecondary,border:`1px solid ${T.border}`,background:'none',cursor:'pointer'}}>Select all</button>
                  <button onClick={()=>setSelectedCharts([])} style={{fontSize:'11px',fontWeight:500,padding:'5px 12px',borderRadius:'6px',color:T.textMuted,border:`1px solid ${T.border}`,background:'none',cursor:'pointer'}}>Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {CHART_TYPES.map(chart=>(
                  <button key={chart.id} onClick={()=>toggleChart(chart.id)} style={{padding:'10px 12px',borderRadius:'8px',textAlign:'left',cursor:'pointer',border:'none',transition:'all 0.15s',background:selectedCharts.includes(chart.id)?T.navy:T.bg,outline:`1px solid ${selectedCharts.includes(chart.id)?T.navy:T.border}`}}>
                    <p style={{fontSize:'11px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:selectedCharts.includes(chart.id)?'#716969':T.textSecondary}}>{chart.label}</p>
                    {suggestedCharts.includes(chart.id) && <div style={{fontSize:'9px',fontWeight:500,marginTop:'3px',color:selectedCharts.includes(chart.id)?'rgba(255,255,255,0.4)':T.textMuted}}>suggested</div>}
                  </button>
                ))}
              </div>
            </div>

            {selectedCharts.length===0 && <div style={{textAlign:'center',padding:'56px 0',borderRadius:'14px',border:`1.5px dashed ${T.border}`}}><p style={{fontSize:'12px',color:T.textMuted}}>Select chart types above to visualise your data</p></div>}

            {(()=>{const w=getVizWarning(vizX,vizY,data?.summary);if(!w||selectedCharts.length===0)return null;return(<div className="warn-in flex items-start gap-3 px-5 py-4 rounded-xl" style={{background:w.type==='type'?'#FDE8E8':T.chip,border:`1px solid ${w.type==='type'?'#F4A0A0':T.borderStrong}`}}><AlertTriangle size={14} style={{color:w.type==='type'?'#C0392B':T.accent,flexShrink:0,marginTop:1}}/><div><p style={{fontSize:'12px',fontWeight:600,marginBottom:'2px',color:w.type==='type'?'#C0392B':T.accentDark}}>{w.type==='type'?'Column type mismatch':'Axis required'}</p><p style={{fontSize:'12px',color:w.type==='type'?'#7a1c1c':T.textSecondary}}>{w.msg}</p></div></div>);})()}
            {(!vizX||!vizY)&&selectedCharts.length>0 && <div style={{textAlign:'center',padding:'40px 0',borderRadius:'14px',border:`1.5px dashed ${T.borderStrong}`}}><p style={{fontSize:'12px',color:T.textMuted}}>Select X and Y axes above to render charts</p></div>}
            {vizX&&vizY&&selectedCharts.length>0 && <div className="space-y-5">{selectedCharts.map(t=>renderChart(t))}</div>}
          </div>
        )}

        {/* REGRESSION */}
        {data && activeTab==='regression' && (
          <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-xl w-full md:w-auto" style={{background:T.surface,border:`1px solid ${T.border}`}}>
                {[{val:regX,onChange:e=>{const v=e.target.value;setRegX(v);if(regY&&v)solveRegression(v,regY);},placeholder:'X (Independent)'},{val:regY,onChange:e=>{const v=e.target.value;setRegY(v);if(regX&&v)solveRegression(regX,v);},placeholder:'Y (Dependent)'}].map(({val,onChange,placeholder})=>(
                  <select key={placeholder} value={val} onChange={onChange} className="outline-none px-3 py-2 rounded-lg w-full sm:w-auto" style={{fontSize:'12px',fontWeight:500,background:T.bg,border:`1px solid ${T.border}`,color:val?T.textPrimary:T.textMuted,cursor:'pointer'}}>
                    <option value="">Select {placeholder}</option>
                    {numericCols.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                ))}
              </div>
              <HelpBtn T={T} onClick={()=>openHelp('Regression',[{heading:'What is Linear Regression?',body:'Finds the best-fit line y = mx + b using Ordinary Least Squares.'},{heading:'Pearson r',body:'Ranges from −1 to +1. Near ±1 = strong linear relationship.'},{heading:'R²',body:'The percentage of variance in Y explained by X.'},{heading:'About this dataset',body:datasetForRegression(data?.summary,regX,regY)}])}/>
            </div>

            {regressionResult?.status==='success' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl" style={card}><p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'8px',color:T.textMuted}}>Equation</p><p style={{fontSize:'15px',fontFamily:'monospace',color:T.textPrimary}}>{regressionResult.equation}</p></div>
                <div className="p-5 rounded-xl" style={card}><p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'8px',color:T.textMuted}}>Pearson r · R²</p><p style={{fontSize:'15px',fontFamily:'monospace',color:T.textPrimary}}>{regressionResult.r?.toFixed(3)} · {regressionResult.r2?.toFixed(3)}</p></div>
                <div className="p-5 rounded-xl" style={{background:T.navy,borderRadius:'12px'}}><p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'8px',color:'rgba(255,255,255,0.4)'}}>Insight</p><p style={{fontSize:'12px',fontWeight:400,lineHeight:'1.6',color:'#716969'}}>{regressionResult.insight}</p></div>
              </div>
            )}
            {regressionResult?.status==='error' && <div className="p-5 rounded-xl" style={{background:'#FDE8E8',border:'1px solid #F4A0A0'}}><p style={{fontFamily:'monospace',fontSize:'12px',color:'#C0392B'}}>Error: {regressionResult.message}</p></div>}

            <div className="p-5 md:p-7 rounded-xl" style={{...card,height:'440px'}}>
              {!regX||!regY?(
                <div className="h-full flex flex-col items-center justify-center rounded-xl" style={{border:`1.5px dashed ${T.border}`}}>
                  <Microscope size={28} style={{color:T.border,marginBottom:'10px'}}/>
                  <p style={{fontSize:'12px',color:T.textMuted,textAlign:'center'}}>Select X and Y axes above to render the regression plot</p>
                </div>
              ):(
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{top:20,right:20,bottom:40,left:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                    <XAxis dataKey="x" type="number" stroke={T.border} fontSize={10} tick={{fill:T.textMuted}} tickFormatter={v=>v?.toFixed(1)} label={{value:regX,position:'insideBottom',offset:-20,fill:T.textSecondary,fontSize:10,fontWeight:'600'}}/>
                    <YAxis dataKey="y" type="number" stroke={T.border} fontSize={10} tick={{fill:T.textMuted}} tickFormatter={v=>v?.toFixed(1)} label={{value:regY,angle:-90,position:'insideLeft',fill:T.textPrimary,fontSize:10,fontWeight:'600'}}/>
                    <Tooltip contentStyle={tooltipStyle}/>
                    <Scatter data={regChartData} fill={accentColor} fillOpacity={0.55} r={3}/>
                    {regressionResult?.status==='success'&&(()=>{const xs=regChartData.map(d=>d.x).filter(v=>!isNaN(v));if(!xs.length)return null;const m=regressionResult.slope,b=regressionResult.intercept,mn=Math.min(...xs),mx=Math.max(...xs);return <line x1={mn} y1={m*mn+b} x2={mx} y2={m*mx+b} stroke={T.textMuted} strokeWidth={1.5} strokeDasharray="4 3"/>;})()}
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>

            {regressionAnalysis && (
              <div className="p-6 rounded-xl card-in" style={{background:T.surface,border:`1px solid ${T.border}`}}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:T.accentDark}}><FileText size={12} style={{color:'#716969'}}/></div>
                  <p style={{fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:T.accentDark}}>Written Analysis</p>
                  <span style={{fontSize:'9px',fontWeight:500,padding:'2px 8px',borderRadius:'99px',marginLeft:'4px',background:T.chip,color:T.textSecondary}}>Auto-generated</span>
                </div>
                <div className="space-y-3">
                  {regressionAnalysis.map((para,i)=><p key={i} style={{fontSize:'13px',lineHeight:'1.7',color:i===0?T.textPrimary:T.textSecondary,fontWeight:i===0?500:400}}>{para}</p>)}
                </div>
                <div className="mt-4 pt-4 flex flex-wrap gap-3" style={{borderTop:`1px solid ${T.border}`}}>
                  {[{label:'X Variable',val:regX},{label:'Y Variable',val:regY},{label:'Pearson r',val:regressionResult.r?.toFixed(4)},{label:'R²',val:regressionResult.r2?.toFixed(4)},{label:'Slope',val:regressionResult.slope?.toFixed(4)},{label:'Intercept',val:regressionResult.intercept?.toFixed(4)}].map(({label,val})=>(
                    <div key={label} className="px-3 py-2 rounded-lg" style={{background:T.bg,border:`1px solid ${T.border}`}}>
                      <p style={{fontSize:'9px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'2px',color:T.textMuted}}>{label}</p>
                      <p style={{fontSize:'12px',fontWeight:600,fontFamily:'monospace',color:T.textPrimary}}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DATA CLEANING */}
        {data && activeTab==='clean' && (
          <div className="space-y-5 pb-20">
            {selectedRows.size>0 && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl" style={{background:T.navy}}>
                <span style={{fontSize:'11px',fontWeight:500,color:'rgba(255,255,255,0.5)'}}>{selectedRows.size} row{selectedRows.size!==1?'s':''} selected</span>
                <div className="flex gap-2 ml-auto flex-wrap">
                  {[{fn:copySelectedToClipboard,icon:<Copy size={10}/>,label:'Copy'},{fn:duplicateSelectedRows,icon:<SquareStack size={10}/>,label:'Duplicate'}].map(({fn,icon,label})=>(
                    <button key={label} onClick={fn} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',fontWeight:500,padding:'6px 12px',borderRadius:'6px',color:'#716969',border:'1px solid rgba(255,255,255,0.18)',background:'rgba(255,255,255,0.08)',cursor:'pointer'}}>{icon}{label}</button>
                  ))}
                  <button onClick={()=>setConfirmDropRows(true)} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',fontWeight:500,padding:'6px 12px',borderRadius:'6px',color:'#F4A0A0',border:'1px solid rgba(244,160,160,0.3)',background:'rgba(160,64,64,0.25)',cursor:'pointer'}}><Trash2 size={10}/> Delete rows</button>
                </div>
              </div>
            )}

            <div className="rounded-xl overflow-hidden" style={{background:T.surface,border:`1.5px solid ${T.textPrimary}`}}>
              <div className="px-5 py-3.5 flex items-center gap-3" style={{background:T.navy}}>
                <Pencil size={12} style={{color:'rgba(255,255,255,0.45)'}}/><p style={{fontSize:'13px',fontWeight:600,color:'#716969'}}>Editable Data Table</p><span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginLeft:'4px'}}>— double-click any cell to edit</span>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse" style={{fontSize:'11px'}}>
                  <thead className="sticky top-0 z-10" style={{background:T.surfaceAlt,borderBottom:`1.5px solid ${T.borderStrong}`}}>
                    <tr>
                      <th style={{padding:'10px 12px',width:'32px'}}><input type="checkbox" checked={selectedRows.size===editRows.length&&editRows.length>0} onChange={toggleAllRows} style={{cursor:'pointer',accentColor:T.textPrimary}}/></th>
                      <th style={{padding:'10px 12px',fontSize:'10px',fontWeight:600,width:'40px',color:T.textMuted}}>#</th>
                      {editCols.map(col=>(
                        <th key={col} style={{padding:'10px 12px',whiteSpace:'nowrap'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                            <span style={{fontSize:'11px',fontWeight:600,color:T.textPrimary}}>{col}</span>
                            <span style={{fontSize:'9px',fontWeight:600,padding:'1px 5px',borderRadius:'3px',background:data.summary?.types?.[col]==='Numeric'?T.navy:T.accent,color:'#716969'}}>{data.summary?.types?.[col]==='Numeric'?'#':'A'}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{fontFamily:'monospace'}}>
                    {editRows.slice(0,50).map((row,ri)=>(
                      <tr key={ri} style={{borderBottom:`1px solid ${T.border}`,background:selectedRows.has(ri)?T.surfaceAlt:'transparent'}} onMouseEnter={e=>{if(!selectedRows.has(ri))e.currentTarget.style.background=T.bg;}} onMouseLeave={e=>{e.currentTarget.style.background=selectedRows.has(ri)?T.surfaceAlt:'transparent';}}>
                        <td style={{padding:'8px 12px'}}><input type="checkbox" checked={selectedRows.has(ri)} onChange={()=>toggleRow(ri)} style={{cursor:'pointer',accentColor:T.textPrimary}}/></td>
                        <td style={{padding:'8px 12px',fontSize:'10px',fontWeight:600,color:T.textMuted}}>{ri+1}</td>
                        {editCols.map(col=>(
                          <td key={col} style={{padding:'8px 12px',whiteSpace:'nowrap'}} onDoubleClick={()=>startEdit(ri,col)}>
                            {editingCell?.ri===ri&&editingCell?.col===col?(
                              <input autoFocus value={editingValue} onChange={e=>setEditingValue(e.target.value)} onBlur={commitEdit} onKeyDown={e=>{if(e.key==='Enter')commitEdit();if(e.key==='Escape')setEditingCell(null);}} style={{borderRadius:'4px',padding:'2px 8px',outline:'none',width:'100%',minWidth:'80px',fontSize:'11px',background:T.surface,border:`1.5px solid ${T.textPrimary}`,color:T.textPrimary}}/>
                            ):(
                              <span style={{fontSize:'11px',cursor:'text',userSelect:'text',color:row[col]==null?T.textMuted:T.textPrimary,fontStyle:row[col]==null?'italic':'normal'}}>{row[col]==null?'null':String(row[col])}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editRows.length>50 && <div style={{padding:'8px 20px',borderTop:`1px solid ${T.border}`,background:T.bg}}><p style={{fontSize:'11px',color:T.textSecondary}}>Showing 50 of {editRows.length} rows. Export CSV to get all rows.</p></div>}
            </div>

            {numericCols.length>0 && (
              <div className="rounded-xl overflow-hidden" style={{background:T.surface,border:`1.5px solid ${T.textPrimary}`}}>
                <div className="px-5 py-3.5 flex items-center gap-2" style={{background:T.navy}}><Calculator size={13} style={{color:'rgba(255,255,255,0.5)'}}/><p style={{fontSize:'13px',fontWeight:600,color:'#716969'}}>Column Calculations</p></div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <select value={calcCol} onChange={e=>{setCalcCol(e.target.value);setCalcResult(null);}} style={{fontSize:'12px',fontWeight:500,outline:'none',padding:'8px 12px',borderRadius:'8px',background:T.surfaceAlt,border:`1.5px solid ${T.textPrimary}`,color:calcCol?T.textPrimary:T.textMuted,cursor:'pointer'}}><option value="">Select column</option>{numericCols.map(c=><option key={c} value={c}>{c}</option>)}</select>
                    <select value={calcOp} onChange={e=>{setCalcOp(e.target.value);setCalcResult(null);}} style={{fontSize:'12px',fontWeight:500,outline:'none',padding:'8px 12px',borderRadius:'8px',background:T.surfaceAlt,border:`1.5px solid ${T.textPrimary}`,color:T.textPrimary,cursor:'pointer'}}>
                      <option value="sum">Sum</option><option value="avg">Average</option><option value="min">Min</option><option value="max">Max</option><option value="count">Count</option><option value="mul">Multiply by scalar</option><option value="div">Divide by scalar</option><option value="sub">Subtract scalar</option><option value="pct">Percentage of scalar</option>
                    </select>
                    {['mul','div','sub','pct'].includes(calcOp) && <input type="number" placeholder="Scalar value" value={calcScalar} onChange={e=>setCalcScalar(e.target.value)} style={{fontSize:'12px',fontWeight:500,outline:'none',padding:'8px 12px',borderRadius:'8px',width:'128px',background:T.surfaceAlt,border:`1.5px solid ${T.textPrimary}`,color:T.textPrimary}}/>}
                    <button onClick={runCalc} disabled={!calcCol} style={{fontSize:'12px',fontWeight:500,padding:'8px 20px',borderRadius:'8px',background:T.navy,color:'#716969',border:'none',cursor:'pointer',opacity:!calcCol?0.4:1}}>Calculate</button>
                    {['mul','div','sub'].includes(calcOp)&&calcCol&&calcScalar && <button onClick={applyCalcToCol} style={{fontSize:'12px',fontWeight:500,padding:'8px 16px',borderRadius:'8px',color:T.textPrimary,border:`1.5px solid ${T.textPrimary}`,background:'transparent',cursor:'pointer'}}>Apply to column</button>}
                  </div>
                  {calcResult!==null && <div style={{borderRadius:'10px',padding:'12px 16px',display:'flex',alignItems:'flex-start',gap:'12px',marginBottom:'16px',background:T.navy}}><span style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',flexShrink:0,marginTop:'2px',color:'rgba(255,255,255,0.35)'}}>Result</span><span style={{fontSize:'13px',fontWeight:600,wordBreak:'break-all',color:'#716969'}}>{typeof calcResult==='number'?calcResult.toLocaleString(undefined,{maximumFractionDigits:6}):calcResult}</span></div>}
                  {calcCol && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[{op:'sum',label:'Sum',icon:<Sigma size={11}/>},{op:'avg',label:'Avg',icon:<Hash size={11}/>},{op:'min',label:'Min',icon:<Minus size={11}/>},{op:'max',label:'Max',icon:<ArrowUpDown size={11}/>},{op:'count',label:'Count',icon:<Hash size={11}/>}].map(({op,label,icon})=>{
                        const vals=editRows.map(r=>parseFloat(r[calcCol])).filter(v=>!isNaN(v));if(!vals.length)return null;
                        let v;if(op==='sum')v=vals.reduce((a,b)=>a+b,0);else if(op==='avg')v=vals.reduce((a,b)=>a+b,0)/vals.length;else if(op==='min')v=Math.min(...vals);else if(op==='max')v=Math.max(...vals);else if(op==='count')v=vals.length;
                        return(<div key={op} style={{borderRadius:'10px',padding:'10px 12px',textAlign:'center',background:T.surfaceAlt,border:`1px solid ${T.borderStrong}`}}><div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',marginBottom:'4px',color:T.textSecondary}}>{icon}<span style={{fontSize:'10px',fontWeight:600}}>{label}</span></div><p style={{fontSize:'13px',fontWeight:600,color:T.textPrimary}}>{typeof v==='number'?v.toLocaleString(undefined,{maximumFractionDigits:4}):v}</p></div>);
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.summary?.duplicate_count>0 && (
              <div className="p-5 rounded-xl" style={{background:T.chip,border:`1px solid ${T.borderStrong}`}}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div><p style={{fontSize:'12px',fontWeight:500,marginBottom:'4px',color:T.textSecondary}}>Remove Duplicates</p><p style={{fontSize:'14px',fontWeight:600,color:T.textPrimary}}>{data.summary.duplicate_count} duplicate rows detected</p><p style={{fontSize:'11px',marginTop:'4px',color:T.textMuted}}>Permanently removes duplicates, keeping the first occurrence.</p></div>
                  <button onClick={()=>cleanAction('remove_duplicates')} disabled={cleanLoading} style={{fontSize:'12px',fontWeight:500,padding:'8px 20px',borderRadius:'8px',background:T.accent,color:'#716969',border:'none',cursor:'pointer',opacity:cleanLoading?0.5:1,whiteSpace:'nowrap'}}>Remove Duplicates</button>
                </div>
              </div>
            )}

            <div className="rounded-xl overflow-hidden" style={{background:T.surface,border:`1.5px solid ${T.textPrimary}`}}>
              <div style={{padding:'12px 20px',background:T.navy}}><p style={{fontSize:'13px',fontWeight:600,color:'#716969'}}>Fill Missing Values</p></div>
              <div className="p-4 space-y-2">
                {data.summary?.columns?.filter(col=>(data.summary.missing_info?.[col]?.count||0)>0).map(col=>{
                  const isNum=data.summary.types?.[col]==='Numeric';
                  return(<div key={col} className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl px-4 py-3 gap-3" style={{background:T.bg,border:`1px solid ${T.borderStrong}`}}>
                    <div><p style={{fontWeight:600,fontSize:'12px',color:T.textPrimary}}>{col}</p><p style={{fontSize:'11px',marginTop:'2px',fontWeight:500,color:T.textSecondary}}>{data.summary.missing_info[col].count} missing ({data.summary.missing_info[col].pct}%)</p></div>
                    <div className="flex gap-2">
                      {isNum?(<><button onClick={()=>cleanAction('fill_missing',col,'mean')} disabled={cleanLoading} style={{fontSize:'11px',fontWeight:500,padding:'6px 14px',borderRadius:'6px',color:T.textPrimary,border:`1.5px solid ${T.textPrimary}`,background:'transparent',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=T.textPrimary;e.currentTarget.style.color=T.surface;}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textPrimary;}}>Fill Mean</button><button onClick={()=>cleanAction('fill_missing',col,'median')} disabled={cleanLoading} style={{fontSize:'11px',fontWeight:500,padding:'6px 14px',borderRadius:'6px',color:T.textPrimary,border:`1.5px solid ${T.textPrimary}`,background:'transparent',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=T.textPrimary;e.currentTarget.style.color=T.surface;}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textPrimary;}}>Fill Median</button></>)
                      :(<button onClick={()=>cleanAction('fill_missing',col,'Unknown')} disabled={cleanLoading} style={{fontSize:'11px',fontWeight:500,padding:'6px 14px',borderRadius:'6px',color:T.textPrimary,border:`1.5px solid ${T.textPrimary}`,background:'transparent',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=T.textPrimary;e.currentTarget.style.color=T.surface;}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.textPrimary;}}>Fill "Unknown"</button>)}
                    </div>
                  </div>);
                })}
                {!data.summary?.columns?.some(col=>(data.summary.missing_info?.[col]?.count||0)>0) && <div className="flex items-center gap-2.5 py-1"><CheckCircle2 size={14} style={{color:T.accent}}/><p style={{fontSize:'12px',fontWeight:500,color:T.accent}}>No missing values detected.</p></div>}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{border:'1.5px solid #C0392B'}}>
              <div style={{padding:'12px 20px',background:'#C0392B',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}><p style={{fontSize:'13px',fontWeight:600,color:'#716969'}}>Drop Columns</p><p style={{fontSize:'11px',color:'rgba(255,255,255,0.55)'}}>Permanently removes from backend — re-upload to restore</p></div>
              <div style={{padding:'16px',background:T.surface}}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {data.summary?.columns?.map(col=>(
                    <button key={col} onClick={()=>setConfirmDrop({col})} disabled={cleanLoading} className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all${droppingCol===col?' col-drop-flash':''}`} style={{background:droppingCol===col?'#C0392B':T.bg,border:`1px solid ${droppingCol===col?'#C0392B':T.borderStrong}`,cursor:'pointer',opacity:cleanLoading?0.5:1}} onMouseEnter={e=>{if(droppingCol!==col){e.currentTarget.style.background='#C0392B';e.currentTarget.style.borderColor='#C0392B';}}} onMouseLeave={e=>{if(droppingCol!==col){e.currentTarget.style.background=T.bg;e.currentTarget.style.borderColor=T.borderStrong;}}}>
                      <span style={{fontSize:'12px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'80%',color:droppingCol===col?'#716969':T.textPrimary}}>{col}</span>
                      <Trash2 size={11} style={{color:droppingCol===col?'rgba(255,255,255,0.7)':T.textMuted,flexShrink:0,marginLeft:'4px'}}/>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{border:`1.5px solid ${T.accent}`}}>
              <div style={{padding:'12px 20px',background:T.accent,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><CheckCircle2 size={13} style={{color:'rgba(255,255,255,0.7)'}}/><p style={{fontSize:'13px',fontWeight:600,color:'#716969'}}>Live Dataset — Backend State</p></div><p style={{fontSize:'11px',color:'rgba(255,255,255,0.45)'}}>{data.summary?.columns?.length} columns · {data.summary?.total_rows?.toLocaleString()} rows</p></div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto" style={{background:T.surface}}>
                <table className="w-full text-left border-collapse" style={{fontSize:'11px'}}>
                  <thead className="sticky top-0 z-10" style={{background:T.surfaceAlt,borderBottom:`1.5px solid ${T.borderStrong}`}}>
                    <tr><th style={{padding:'8px 12px',fontSize:'10px',fontWeight:600,width:'40px',color:T.textMuted}}>#</th>{data.summary?.columns?.map(col=><th key={col} style={{padding:'8px 12px',whiteSpace:'nowrap'}}><span style={{fontSize:'11px',fontWeight:600,color:T.textPrimary}}>{col}</span></th>)}</tr>
                  </thead>
                  <tbody style={{fontFamily:'monospace'}}>
                    {(data.preview||[]).slice(0,30).map((row,ri)=>(
                      <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}} onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{padding:'8px 12px',fontSize:'10px',fontWeight:600,color:T.textMuted}}>{ri+1}</td>
                        {data.summary?.columns?.map(col=><td key={col} style={{padding:'8px 12px',whiteSpace:'nowrap',fontSize:'11px',color:row[col]==null?T.textMuted:T.textPrimary,fontStyle:row[col]==null?'italic':'normal'}}>{row[col]==null?'null':String(row[col])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{padding:'8px 20px',borderTop:`1px solid ${T.border}`,background:T.bg}}><p style={{fontSize:'11px',color:T.textSecondary}}>Showing up to 30 rows · Backend changes update this view automatically.</p></div>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {activeTab==='history' && (
          <div className="space-y-5 pb-20">
            <div className="flex items-center justify-between">
              <p style={{fontSize:'12px',color:T.textMuted}}>Every dataset uploaded this session is stored here.</p>
              <div className="flex items-center gap-3">
                <HelpBtn T={T} onClick={()=>openHelp('Upload History',[{heading:'What is Upload History?',body:'Records every file uploaded this session with a snapshot for instant reload.'},{heading:'Session persistence',body:'History clears on page refresh. Use Export Report to save your analysis.'}])}/>
                {uploadHistory.length>0 && <button onClick={()=>setUploadHistory([])} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',fontWeight:500,padding:'6px 12px',borderRadius:'6px',color:T.textMuted,border:`1px solid ${T.border}`,background:'none',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.color='#C0392B';e.currentTarget.style.borderColor='#F4A0A0';}} onMouseLeave={e=>{e.currentTarget.style.color=T.textMuted;e.currentTarget.style.borderColor=T.border;}}><Trash2 size={10}/> Clear all</button>}
              </div>
            </div>

            {uploadHistory.length===0 && <div style={{textAlign:'center',padding:'80px 0',borderRadius:'14px',border:`1.5px dashed ${T.border}`}}><p style={{fontSize:'12px',color:T.textMuted}}>No uploads yet this session</p></div>}

            {uploadHistory.map((entry,i)=>(
              <div key={entry.id} className="p-5 rounded-xl transition-all" style={{background:T.surface,border:`1px solid ${T.border}`}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderStrong} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:T.surfaceAlt}}><Clock size={14} style={{color:T.textMuted}}/></div>
                    <div className="min-w-0">
                      <p style={{fontWeight:600,fontSize:'13px',color:T.textPrimary,marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.name}</p>
                      <div className="flex items-center gap-2">
                        <span style={{fontSize:'11px',color:T.textMuted}}>{entry.date} at {entry.time}</span>
                        <span style={{fontSize:'9px',fontWeight:600,padding:'1px 6px',borderRadius:'4px',color:T.textSecondary,border:`1px solid ${T.border}`,background:T.surfaceAlt}}>Session #{uploadHistory.length-i}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto">
                    <button onClick={()=>reloadEntry(entry)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',fontWeight:500,fontSize:'12px',padding:'7px 16px',borderRadius:'8px',background:T.navy,color:'#716969',border:'none',cursor:'pointer'}}><RotateCcw size={10}/> Reload</button>
                    <button onClick={()=>exportEntry(entry)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',fontWeight:500,fontSize:'12px',padding:'7px 16px',borderRadius:'8px',color:T.textSecondary,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer'}}><Download size={10}/> CSV</button>
                    <button onClick={()=>deleteEntry(entry.id)} style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'7px 10px',borderRadius:'8px',color:T.textMuted,border:`1px solid ${T.border}`,background:'none',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.color='#C0392B';e.currentTarget.style.borderColor='#F4A0A0';}} onMouseLeave={e=>{e.currentTarget.style.color=T.textMuted;e.currentTarget.style.borderColor=T.border;}}><Trash2 size={12}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {[{label:'Rows',val:entry.rows?.toLocaleString()},{label:'Columns',val:entry.cols},{label:'Numeric',val:entry.numericCols},{label:'Categorical',val:entry.catCols}].map(({label,val})=>(
                    <div key={label} className="rounded-xl px-3 py-2.5" style={{background:T.bg,border:`1px solid ${T.border}`}}>
                      <p style={{fontSize:'10px',marginBottom:'2px',color:T.textMuted}}>{label}</p>
                      <p style={{fontSize:'17px',fontWeight:600,color:T.textPrimary}}>{val}</p>
                    </div>
                  ))}
                </div>
                {entry.quickInsight && <div style={{borderTop:`1px solid ${T.border}`,paddingTop:'12px'}}><p style={{fontSize:'10px',marginBottom:'4px',color:T.textMuted,display:'flex',alignItems:'center',gap:'4px'}}><Zap size={9}/> Quick Insight</p><p style={{fontSize:'12px',lineHeight:'1.65',color:T.textSecondary}}>{entry.quickInsight}</p></div>}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Deep Inspection Modal */}
      {zoomedCol && dynamicStats[zoomedCol] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{background:'rgba(26,25,22,0.35)'}} onClick={()=>setZoomedCol(null)}/>
          <div className="w-full max-w-lg p-7 md:p-10 rounded-2xl shadow-xl relative z-10 max-h-[90vh] overflow-y-auto" style={{background:T.surface,border:`1px solid ${T.border}`}}>
            <button onClick={()=>setZoomedCol(null)} style={{position:'absolute',top:'20px',right:'20px',color:T.textMuted,background:'none',border:'none',cursor:'pointer'}} className="hover:opacity-60"><X size={18}/></button>
            <p style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:T.textMuted,marginBottom:'4px'}}>Deep Inspection</p>
            <h2 style={{fontSize:'22px',fontWeight:700,letterSpacing:'-0.3px',marginBottom:'4px',color:T.textPrimary,wordBreak:'break-all'}}>{zoomedCol}</h2>
            {data.summary?.missing_info?.[zoomedCol] && <p style={{fontSize:'12px',fontWeight:500,marginBottom:'24px',color:T.textSecondary}}>{data.summary.missing_info[zoomedCol].pct}% missing ({data.summary.missing_info[zoomedCol].count} rows)</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-5">
              {[['Mean',dynamicStats[zoomedCol].mean],['Median',dynamicStats[zoomedCol].median],['Std Dev',dynamicStats[zoomedCol].std],['Min',dynamicStats[zoomedCol].min],['Max',dynamicStats[zoomedCol].max]].map(([label,val])=>(
                <div key={label}><p style={{fontSize:'10px',fontWeight:500,marginBottom:'4px',color:T.textMuted}}>{label}</p><p style={{fontSize:'22px',fontWeight:600,color:T.textPrimary}}>{val.toFixed(2)}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;