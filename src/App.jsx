import { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

// --- [保留] 原本的所有圖示 ---
const Icons = {
    Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
    Trash2: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
    Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
    ImageIcon: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
    Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
    Layers: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    Compass: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
    CheckSquare: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    FileText: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    MoveUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>,
    MoveDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>,
    Ruler: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.3 15.3l-9.3-9.3c-.4-.4-1-.4-1.4 0L2.7 13.9c-.4.4-.4 1 0 1.4l9.3 9.3c.4.4 1 .4 1.4 0l7.9-7.9c.4-.4.4-1 0-1.4z"/></svg>,
    Loader: () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
};

const ITEM_QUICK_SELECT = ["欄杆", "玻璃欄杆", "立面格柵", "水平格柵", "包板", "門"];
const CHECK_OPTIONS = ["錯誤", "須修改", "預埋件"];
const FLOOR_OPTIONS = [];
for(let i=1; i<=20; i++) FLOOR_OPTIONS.push(`${i}F`);
['R1', 'R2', 'R3', 'PRF'].forEach(f => FLOOR_OPTIONS.push(f));

const getROCDate = () => {
    const date = new Date();
    return `${date.getFullYear() - 1911}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const compressImage = (file, maxWidth = 1280, quality = 0.7) => { 
    return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            let width = img.width, height = img.height;
            if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = objectUrl;
    });
};

const EntryEditor = ({ entry, index, total, onMove, onRemove, onChange, onImageUpload, onRemoveImage }) => {
    const DirectionBtn = ({ dir, label }) => (
        <button onClick={() => onChange(entry.id, 'direction', dir)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all ${entry.direction === dir ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
            {label}
        </button>
    );
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
            <div className="flex justify-between items-start mb-4 font-sans">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
                <div className="flex gap-1">
                    <button onClick={() => onMove(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded"><Icons.MoveUp /></button>
                    <button onClick={() => onMove(index, 'down')} disabled={index === total - 1} className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded"><Icons.MoveDown /></button>
                    <button onClick={() => onRemove(entry.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded ml-2"><Icons.Trash2 /></button>
                </div>
            </div>
            <div className="space-y-4">
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">現場照片 ({entry.images?.length || 0}/2)</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {entry.images?.map((img, idx) => (
                            <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden group">
                                <img src={img.preview} className="w-full h-full object-cover" />
                                <button onClick={() => onRemoveImage(entry.id, idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"><Icons.X /></button>
                            </div>
                        ))}
                    </div>
                    {(!entry.images || entry.images.length < 2) && (
                        <div className="relative group h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 transition-colors cursor-pointer">
                            <input type="file" accept="image/*" multiple onChange={(e) => onImageUpload(entry.id, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <Icons.Plus /> <span className="text-xs text-gray-500">點擊上傳</span>
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Icons.Calendar /> 日期</label><input type="text" value={entry.date} onChange={(e) => onChange(entry.id, 'date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none shadow-sm" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Icons.Layers /> 樓層</label><select value={entry.floor} onChange={(e) => onChange(entry.id, 'floor', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white shadow-sm font-sans"><option value="">選擇樓層...</option>{FLOOR_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">方位</label><div className="grid grid-cols-3 gap-1 w-fit border p-2 rounded-lg bg-gray-50 shadow-inner"><div className="col-start-2"><DirectionBtn dir="北" label="北" /></div><div className="col-start-1"><DirectionBtn dir="西" label="西" /></div><div className="col-start-2 flex justify-center items-center"><div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div></div><div className="col-start-3"><DirectionBtn dir="東" label="東" /></div><div className="col-start-2"><DirectionBtn dir="南" label="南" /></div></div></div>
                    <div><div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Icons.CheckSquare /> 項目</label><select className="text-xs border rounded p-1 bg-gray-50" onChange={(e) => {if(e.target.value) onChange(entry.id, 'item', e.target.value); e.target.value='';}}><option value="">快速選擇...</option>{ITEM_QUICK_SELECT.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div><textarea value={entry.item} onChange={(e) => onChange(entry.id, 'item', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm outline-none resize-none shadow-sm" /></div>
                    <div><div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Icons.FileText /> 查驗內容</label><select className="text-xs border rounded p-1 bg-gray-50" onChange={(e) => {if(e.target.value) onChange(entry.id, 'content', e.target.value); e.target.value='';}}><option value="">快速選擇...</option>{CHECK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div><textarea value={entry.content} onChange={(e) => onChange(entry.id, 'content', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm outline-none resize-none shadow-sm" /></div>
                </div>
            </div>
        </div>
    );
};

const MeasurementRecorder = ({ defaultTitle, mode = 'full' }) => {
    const isFull = mode === 'full';
    const [tableData, setTableData] = useState([]);
    const [dimTitle, setDimTitle] = useState(defaultTitle);
    const [form, setForm] = useState({ direction: '北', floor: '1F', length: '', width: '', thickness: '8' });
    const [lMode, setLMode] = useState('兩側粉刷');
    const [wMode, setWMode] = useState('兩側粉刷');
    const [isGenerating, setIsGenerating] = useState(false);
    const lengthInputRef = useRef();
    const widthInputRef = useRef();
    const pdfRef = useRef();

    const calcFinal = (base, mode) => {
        const val = parseFloat(base) || 0;
        const thick = parseFloat(form.thickness) || 0;
        if (mode === '兩側磁磚') return val + (thick * 2);
        if (mode === '單邊磁磚') return val + thick;
        return val;
    };

    const addRow = () => {
        if (isFull && (!form.length || !form.width)) return alert("請輸入長度與寬度！汪！");
        if (!isFull && !form.width) return alert("請輸入寬度！汪！");
        const finalW = calcFinal(form.width, wMode);
        const statusStr = isFull ? `長:${lMode} 寬:${wMode}` : `寬:${wMode}`;
        const newEntry = { id: Date.now(), direction: form.direction, floor: form.floor, type: statusStr, measureW: form.width, finalW: finalW };
        if (isFull) { newEntry.measureL = form.length; newEntry.finalL = calcFinal(form.length, lMode); }
        setTableData([...tableData, newEntry]);
        setForm({...form, length: '', width: ''});
        if (isFull) lengthInputRef.current?.focus();
        else widthInputRef.current?.focus();
    };

    const clearTable = () => { if(confirm(`確定要重置「${dimTitle}」表嗎？汪！`)) setTableData([]); };

    const exportExcel = () => {
        if(tableData.length === 0) return alert("沒數據！");
        const headers = isFull ? ["#", "方位", "樓層", "狀態設定", "量測-長", "量測-寬", "最終-長", "最終-寬"] : ["#", "方位", "樓層", "狀態設定", "量測-寬", "最終-寬"];
        const rows = tableData.map((r, i) => isFull ? [i+1, r.direction, r.floor, r.type, r.measureL, r.measureW, r.finalL, r.finalW] : [i+1, r.direction, r.floor, r.type, r.measureW, r.finalW]);
        const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${dimTitle}_${getROCDate()}.csv`;
        link.click();
    };

    const generatePDF = () => {
        if(tableData.length === 0) return alert("沒數據！");
        setIsGenerating(true);
        const opt = { margin: 10, filename: `${dimTitle}_${getROCDate()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: isFull ? 'landscape' : 'portrait' } };
        html2pdf().set(opt).from(pdfRef.current).save().then(() => setIsGenerating(false));
    };

    const TripleToggle = ({ current, setter, colorClass }) => (
        <div className="flex flex-col gap-2 w-full">
            {['兩側粉刷', '兩側磁磚', '單邊磁磚'].map(label => (
                <button key={label} onClick={() => setter(label)} className={`py-3.5 px-2 rounded-xl text-base font-black border-2 transition-all active:scale-95 shadow-sm ${current === label ? `${colorClass} text-white border-transparent ring-2 ring-offset-1` : 'bg-white text-gray-500 border-gray-200'}`}>{label}</button>
            ))}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 bg-white rounded-xl shadow-lg min-h-[80vh] font-sans animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <input type="text" value={dimTitle} onChange={(e) => setDimTitle(e.target.value)} className="text-xl font-bold text-blue-800 border-2 border-blue-600 rounded px-3 py-1 outline-none shadow-sm" />
                <div className="flex gap-4 items-center">
                    <button onClick={clearTable} className="text-sm text-red-500 font-bold border border-red-500 px-3 py-1 rounded hover:bg-red-50 transition-colors">重置表格</button>
                    <button onClick={generatePDF} disabled={isGenerating} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-black transition-all shadow-md">{isGenerating ? '生成中...' : '生成 PDF'}</button>
                    <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-700 transition-all shadow-md">生成 Excel</button>
                </div>
            </div>
            <div className="border-2 border-black rounded overflow-hidden mb-6 shadow-sm">
                <table className="w-full text-center border-collapse text-sm">
                    <thead className="bg-gray-100 border-b-2 border-black font-bold divide-x-2 divide-black text-gray-700">
                        <tr>
                            <th className="py-2 w-10">#</th><th className="py-2 w-16">方位</th><th className="py-2 w-20">樓層</th><th className="py-2">磁/粉狀態</th>
                            {isFull && <th className="py-2">量測-長</th>}<th className="py-2">量測-寬</th>
                            {isFull && <th className="py-2 bg-blue-50 text-blue-800 font-black">長</th>}
                            <th className="py-2 bg-blue-50 text-blue-800 font-black">寬</th><th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-bold text-gray-800 text-base text-center">
                        {tableData.map((r, i) => (
                            <tr key={r.id} className="divide-x divide-black transition-colors hover:bg-gray-50">
                                <td>{i + 1}</td><td>{r.direction}</td><td>{r.floor}</td><td className="text-[10px] text-gray-500 font-normal leading-tight">{r.type}</td>
                                {isFull && <td>{r.measureL}</td>}<td>{r.measureW}</td>
                                {isFull && <td className="bg-blue-50/30 text-blue-600 font-black">{r.finalL}</td>}
                                <td className="bg-blue-50/30 text-blue-600 font-black">{r.finalW}</td>
                                <td><button onClick={()=>setTableData(tableData.filter(x=>x.id!==r.id))} className="text-red-500 font-bold hover:scale-125 px-1">×</button></td>
                            </tr>
                        ))}
                        {tableData.length === 0 && <tr><td colSpan={isFull ? 9 : 7} className="py-8 text-gray-400 italic">尚未輸入「{dimTitle}」數據...汪！</td></tr>}
                    </tbody>
                </table>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-3xl border shadow-inner">
                <div className="flex flex-col items-center justify-center space-y-6 lg:border-r lg:pr-6">
                    <div className="grid grid-cols-3 gap-3">
                        {['北', '西', '東', '南'].map((d) => (
                            <div key={d} className={`${d==='北'?'col-start-2':d==='西'?'col-start-1 row-start-2':d==='東'?'col-start-3 row-start-2':'col-start-2 row-start-3'}`}>
                                <button onClick={()=>setForm({...form, direction:d})} className={`w-14 h-14 rounded-full border-4 font-black transition-all active:scale-90 ${form.direction===d?'bg-blue-600 text-white border-blue-800 shadow-lg':'bg-white text-gray-300 border-gray-200'}`}>{d}</button>
                            </div>
                        ))}
                        <div className="col-start-2 row-start-2 flex items-center justify-center"><div className="w-3 h-3 bg-black rounded-full ring-4 ring-white shadow-sm"></div></div>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-gray-200 shadow-sm"><span className="text-xs font-black text-gray-500">磁磚厚度:</span><input type="text" value={form.thickness} onChange={e=>setForm({...form, thickness:e.target.value})} className="w-12 text-center font-black text-blue-600 text-lg outline-none" /></div>
                </div>
                <div className="flex flex-col items-center justify-center space-y-4 lg:border-r lg:pr-6">
                    <div className={`grid ${isFull ? 'grid-cols-2' : 'grid-cols-1'} gap-4 w-full h-full items-center`}>
                        {isFull && (<div className="space-y-2 flex flex-col items-center"><span className="text-xs font-black text-blue-600 underline uppercase tracking-tighter">量測長度設定</span><TripleToggle current={lMode} setter={setLMode} colorClass="bg-blue-600 shadow-blue-200" /></div>)}
                        <div className="space-y-2 flex flex-col items-center"><span className="text-xs font-black text-green-600 underline uppercase tracking-tighter">量測寬度設定</span><TripleToggle current={wMode} setter={setWMode} colorClass="bg-green-600 shadow-green-200" /></div>
                    </div>
                </div>
                <div className="space-y-4 flex flex-col justify-center">
                    <select value={form.floor} onChange={e=>setForm({...form, floor:e.target.value})} className="w-full border-2 border-gray-300 rounded-2xl p-4 font-black bg-white focus:border-blue-500 shadow-sm text-lg outline-none">{FLOOR_OPTIONS.map(f=><option key={f} value={f}>{f}</option>)}</select>
                    <div className="space-y-3">
                        {isFull && (<input ref={lengthInputRef} type="number" placeholder="量測-長 (mm)" value={form.length} onChange={e=>setForm({...form, length:e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter') widthInputRef.current?.focus(); }} className="w-full border-2 border-gray-300 rounded-2xl p-4 text-center text-2xl font-black focus:border-blue-500 shadow-sm outline-none" />)}
                        <input ref={widthInputRef} type="number" placeholder="量測-寬 (mm)" value={form.width} onChange={e=>setForm({...form, width:e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter') addRow(); }} className="w-full border-2 border-gray-300 rounded-2xl p-4 text-center text-2xl font-black focus:border-blue-500 shadow-sm outline-none" />
                    </div>
                    <button onClick={addRow} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-2xl hover:bg-blue-700 shadow-xl active:scale-95 transition-all">登入下一筆</button>
                </div>
            </div>
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <div ref={pdfRef} style={{ padding: '20mm', backgroundColor: 'white', color: 'black', width: isFull ? '277mm' : '210mm', minHeight: '297mm' }}>
                    <h1 style={{ textAlign: 'center', fontSize: '26pt', marginBottom: '30px', fontWeight: 'bold' }}>{dimTitle}表 (單位: mm)</h1>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '2px solid black', padding: '10px' }}>#</th><th style={{ border: '2px solid black', padding: '10px' }}>方位</th><th style={{ border: '2px solid black', padding: '10px' }}>樓層</th><th style={{ border: '2px solid black', padding: '10px' }}>狀態設定</th>
                                {isFull && <th style={{ border: '2px solid black', padding: '10px' }}>量測-長</th>}<th style={{ border: '2px solid black', padding: '10px' }}>量測-寬</th>
                                {isFull && <th style={{ border: '2px solid black', padding: '10px' }}>最終長</th>}<th style={{ border: '2px solid black', padding: '10px' }}>最終寬</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((r, i) => (
                                <tr key={r.id}>
                                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{i + 1}</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{r.direction}</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{r.floor}</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontSize: '10px' }}>{r.type}</td>
                                    {isFull && <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{r.measureL}</td>}
                                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{r.measureW}</td>
                                    {isFull && <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{r.finalL}</td>}
                                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{r.finalW}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- [修正重點] 移除產生 PDF 時可能導致多一頁的外部樣式 (mx-auto, shadow-sm) ---
const PreviewPage = ({ pageItems, pageIndex, totalPages, reportTitle }) => (
    <div className="page-container origin-top font-kai bg-white p-[15mm] overflow-hidden" style={{ width: '210mm', height: '297mm', margin: 0 }}>
        <div className="absolute top-6 right-8 text-sm font-kai text-gray-600">第 {pageIndex + 1} / {totalPages} 頁</div>
        {pageIndex === 0 && <div className="text-center mb-6"><h1 className="text-[24pt] font-bold text-black tracking-widest font-kai border-b-2 border-black pb-2 inline-block">{reportTitle}</h1></div>}
        <table className="w-full border-collapse border border-black table-fixed font-kai">
            <thead><tr className="bg-[#dce6f1] text-center"><th className="border border-black py-2 w-[35%] font-kai text-lg">說 明</th><th className="border border-black py-2 w-[65%] font-kai text-lg">現 況 照 片</th></tr></thead>
            <tbody>
                {pageItems.map((entry) => (
                    <tr key={entry.id} style={{ height: '80mm' }}>
                        <td className="border border-black p-4 align-top text-left text-base font-kai leading-relaxed">
                            <div className="mb-2"><span className="font-bold">日期:</span> {entry.date}</div>
                            <div className="mb-2 flex gap-4"><span><span className="font-bold">樓層:</span> {entry.floor}</span><span><span className="font-bold">方位:</span> {entry.direction}</span></div>
                            <div className="mb-2"><span className="font-bold">項目:</span> {entry.item}</div>
                            <div className="whitespace-pre-wrap"><span className="font-bold">查驗內容:</span> {entry.content}</div>
                        </td>
                        <td className="border border-black p-1 align-middle text-center bg-white">
                            <div className="w-full h-full flex gap-1 items-center justify-center" style={{ height: '78mm' }}>
                                {entry.images?.slice(0, 2).map((img, i) => <img key={i} src={img.preview} className="w-1/2 h-full object-contain" style={{ maxHeight: '100%' }} />)}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default function App() {
    const [view, setView] = useState('photo'); 
    const [entries, setEntries] = useState(() => {
        const saved = localStorage.getItem('site_report_data');
        return saved ? JSON.parse(saved).map(e => ({...e, images: e.images || []})) : [{ id: Date.now(), date: getROCDate(), floor: '', direction: '', item: '', content: '', images: [] }];
    });
    const [reportTitle, setReportTitle] = useState(() => localStorage.getItem('site_report_title') || '施工照片');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const reportRef = useRef(null);

    useEffect(() => {
        document.title = "PRO-WORK";
    }, []);

    useEffect(() => {
        localStorage.setItem('site_report_data', JSON.stringify(entries));
        localStorage.setItem('site_report_title', reportTitle);
    }, [entries, reportTitle]);

    const handleImageUpload = async (id, e) => {
        const files = Array.from(e.target.files); if (!files.length) return;
        setIsProcessing(true);
        const processed = [];
        for(let file of files.slice(0, 2)) {
            const preview = await compressImage(file);
            processed.push({ preview });
        }
        setEntries(prev => prev.map(ent => ent.id === id ? { ...ent, images: [...ent.images, ...processed].slice(0,2) } : ent));
        setIsProcessing(false);
        e.target.value = '';
    };

    const generatePDF = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const opt = { margin: 0, filename: `${reportTitle}_${getROCDate()}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
            html2pdf().set(opt).from(reportRef.current).save().then(() => setIsGenerating(false));
        }, 800);
    };

    const chunkedEntries = [];
    for (let i = 0; i < entries.length; i += 3) chunkedEntries.push(entries.slice(i, i + 3));
    if (chunkedEntries.length === 0) chunkedEntries.push([]);

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold flex items-center gap-2">🏗️ PRO事一堆</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-200 p-1 rounded-lg shadow-inner">
                            <button onClick={()=>setView('photo')} className={`px-4 py-1 text-xs rounded-md transition-all ${view==='photo'?'bg-white shadow text-blue-600 font-bold':'text-gray-500 hover:text-gray-700'}`}>照片黏貼</button>
                            <button onClick={()=>setView('dimension')} className={`px-4 py-1 text-xs rounded-md transition-all ${view==='dimension'?'bg-white shadow text-blue-600 font-bold':'text-gray-500 hover:text-gray-700'}`}>四周量測</button>
                            <button onClick={()=>setView('twoSide')} className={`px-4 py-1 text-xs rounded-md transition-all ${view==='twoSide'?'bg-white shadow text-blue-600 font-bold':'text-gray-500 hover:text-gray-700'}`}>兩側量測</button>
                        </div>
                        {view === 'photo' && <div className="flex items-center gap-2 border-b border-gray-400 pb-0.5"><label className="text-xs font-bold text-gray-500 italic">標題:</label><input type="text" value={reportTitle} onChange={e=>setReportTitle(e.target.value)} className="bg-transparent font-bold outline-none w-32 border-none focus:ring-0" /></div>}
                    </div>
                </div>
                {view === 'photo' && (
                    <div className="flex gap-2">
                        <button onClick={() => {if(confirm("確定重置？")) { localStorage.clear(); window.location.reload(); }}} className="text-xs text-red-400 hover:text-red-600 underline px-2">重置表格</button>
                        <button onClick={() => setEntries([...entries, {id: Date.now(), date: getROCDate(), floor:'', direction:'', item:'', content:'', images:[] }])} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold shadow hover:bg-gray-50 transition-all">+ 新增單筆</button>
                        <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow hover:bg-blue-700 transition-all">下載 PDF <Icons.Download /></button>
                    </div>
                )}
            </div>

            {view === 'photo' ? (
                <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in">
                    {entries.map((entry, idx) => (
                        <EntryEditor key={entry.id} entry={entry} index={idx} total={entries.length} onMove={(i,d)=>{const n=[...entries]; const t=d==='up'?i-1:i+1; [n[i],n[t]]=[n[t],n[i]]; setEntries(n);}} onRemove={id=>setEntries(entries.filter(e=>e.id!==id))} onChange={(id,f,v)=>setEntries(entries.map(e=>e.id===id?{...e,[f]:v}:e))} onImageUpload={handleImageUpload} onRemoveImage={(id,idx)=>setEntries(entries.map(e=>e.id===id?{...e,images:e.images.filter((_,i)=>i!==idx)}:e))} />
                    ))}
                    <button onClick={() => setEntries([...entries, {id: Date.now(), date: getROCDate(), floor:'', direction:'', item:'', content:'', images:[] }])} className="w-full py-5 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold bg-white hover:bg-gray-50 transition-all">+ 新增照片項目</button>
                    
                    {/* --- [修正重點] 確保隱藏容器無邊距，解決多一頁問題 --- */}
                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                        <div ref={reportRef} style={{ margin: 0, padding: 0 }}>
                            {chunkedEntries.map((items, i) => <PreviewPage key={i} pageItems={items} pageIndex={i} totalPages={chunkedEntries.length} reportTitle={reportTitle} />)}
                        </div>
                    </div>
                </div>
            ) : view === 'dimension' ? (
                <MeasurementRecorder key="horiz" defaultTitle="四周量測尺寸" mode="full" />
            ) : (
                <MeasurementRecorder key="twoSide" defaultTitle="兩側量測尺寸" mode="widthOnly" />
            )}
            
            {(isProcessing || isGenerating) && <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center font-bold text-white backdrop-blur-sm shadow-2xl"><Icons.Loader />汪！處理中，請稍候...</div>}
        </div>
    );
}