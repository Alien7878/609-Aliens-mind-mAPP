import React, { useState } from 'react';
import Canvas from './components/Canvas';
import { useStore } from './store/useStore';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Camera, Download, BrainCircuit, RefreshCw, Plus, Minus, Trash, Save, FolderOpen, Pencil, Copy, Trash2, Menu, X, Sun, Moon, Undo2, Redo2 } from 'lucide-react';

export default function App() {
  const { 
    clearMap, setCanvas, projects, activeProjectId, 
    createProject, deleteProject, setActiveProject, duplicateProject, updateProjectName,
    theme, toggleTheme,
    undo, redo, undoHistory, redoHistory
  } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  
  const activeProject = projects.find(p => p.id === activeProjectId);
  const nodes = activeProject?.nodes || [];
  const canvas = activeProject?.canvas || { x: 0, y: 0, scale: 1 };

  const isLight = theme === 'light';

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const resetView = () => {
    if (nodes.length === 0) return;
    
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + (n.width || 160)));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + (n.height || 64)));
    
    const width = maxX - minX + 200;
    const height = maxY - minY + 200;
    
    const scaleX = window.innerWidth / width;
    const scaleY = window.innerHeight / height;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    
    setCanvas(
      window.innerWidth / 2 - cx * newScale,
      window.innerHeight / 2 - cy * newScale,
      newScale
    );
  };

  const handleZoom = (delta: number) => {
    let newScale = canvas.scale + delta;
    newScale = Math.min(Math.max(0.1, newScale), 5); // clamp scale
    
    // Zoom towards center of screen
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    
    const targetX = (cx - canvas.x) / canvas.scale;
    const targetY = (cy - canvas.y) / canvas.scale;
    
    setCanvas(
      cx - targetX * newScale,
      cy - targetY * newScale,
      newScale
    );
  };

  const exportImage = async () => {
    setIsExporting(true);
    try {
      const node = document.getElementById('canvas-root');
      if (!node) return;
      
      const dataUrl = await htmlToImage.toPng(node, { 
        quality: 1,
        pixelRatio: 2,
        backgroundColor: isLight ? '#fafafa' : '#0a0c10', // frosted glass theme bg
      });
      const link = document.createElement('a');
      link.download = `${activeProject?.name || '609_mindmap'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const node = document.getElementById('canvas-root');
      if (!node) return;
      const dataUrl = await htmlToImage.toPng(node, { 
        quality: 1,
        pixelRatio: 2,
        backgroundColor: isLight ? '#fafafa' : '#0a0c10',
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [window.innerWidth, window.innerHeight]
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, window.innerWidth, window.innerHeight);
      pdf.save(`${activeProject?.name || '609_mindmap'}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden font-sans select-none transition-colors duration-500 ${isLight ? 'bg-zinc-50 text-gray-900' : 'bg-[#0a0c10] text-gray-100'}`}>
      {/* Background Mesh Gradient */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ${isLight ? 'opacity-30' : 'opacity-40'}`}>
        <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] ${isLight ? 'bg-slate-400/40' : 'bg-purple-600/30'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] ${isLight ? 'bg-gray-400/40' : 'bg-blue-600/20'}`}></div>
      </div>

      <Canvas />
      
      {/* App Header / Toolbar */}
      <header dir="rtl" className={`absolute top-4 left-4 right-4 h-14 backdrop-blur-xl border rounded-2xl z-50 flex items-center justify-between px-6 shadow-2xl pointer-events-none transition-colors duration-500 ${isLight ? 'bg-white/60 border-black/10' : 'bg-white/5 border-white/10'}`}>
        <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl transition-all border active:scale-95 ${isLight ? 'bg-black/5 hover:bg-black/10 border-black/5' : 'bg-white/10 hover:bg-white/20 border-white/5 text-gray-200'}`}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          
          <div className="text-xl font-black bg-gradient-to-l from-purple-400 to-blue-400 bg-clip-text text-transparent tracking-tighter flex items-center gap-2">
            <BrainCircuit size={22} className="text-purple-400" />
            <span className="font-sans tracking-tight">609</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button 
            onClick={resetView}
            className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-2 transition-all active:scale-95 ${isLight ? 'bg-black/5 hover:bg-black/10 border-black/5' : 'bg-white/10 hover:bg-white/20 border-white/5'}`}
            title="نمایش کل نقشه"
          >
            <RefreshCw size={16} />
          </button>
          
          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className={`hidden sm:flex px-3 py-1.5 rounded-lg text-sm border items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${isLight ? 'bg-black/5 hover:bg-black/10 border-black/5' : 'bg-white/10 hover:bg-white/20 border-white/5'}`}
          >
            <Download size={16} />
            خروجی PDF
          </button>
          <button 
            onClick={exportImage}
            disabled={isExporting}
            className="flex px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-purple-500/20 items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Camera size={16} />
            <span className="hidden sm:block">عکس PNG</span>
          </button>
        </div>
      </header>

      {/* Sidebar (Projects) */}
      <aside dir="rtl" className={`absolute top-24 right-4 bottom-20 w-72 backdrop-blur-xl border rounded-2xl z-40 p-4 shadow-xl flex flex-col pointer-events-auto overflow-hidden transition-all duration-300 ease-in-out origin-right ${isLight ? 'bg-white/60 border-black/10' : 'bg-white/5 border-white/10'} ${isSidebarOpen ? 'translate-x-[0%] opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}>
        <div className="flex items-center justify-between mb-4 pr-2">
          <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
             <FolderOpen size={16} /> پروژههای اخیر
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg transition-colors border ${isLight ? 'bg-black/5 hover:bg-black/10 border-black/5 text-amber-600' : 'bg-white/10 hover:bg-white/20 border-white/5 text-blue-300'}`}
              title="تغییر تم"
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button 
              onClick={() => createProject(`پروژه ${projects.length + 1}`)}
              className={`p-1.5 rounded-lg transition-colors border ${isLight ? 'bg-black/5 hover:bg-black/10 border-black/5' : 'bg-white/10 hover:bg-white/20 border-white/5'}`}
              title="پروژه جدید"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {projects.map(p => {
             const isActive = p.id === activeProjectId;
             return (
               <div 
                 key={p.id} 
                 onClick={() => setActiveProject(p.id)}
                 className={`group p-3 rounded-xl text-sm cursor-pointer border transition-all flex items-center justify-between ${isActive ? (isLight ? 'bg-black/5 border-black/10 shadow-sm font-semibold' : 'bg-white/10 border-white/20 shadow-md') : (isLight ? 'hover:bg-black/5 border-transparent text-gray-600' : 'hover:bg-white/5 border-transparent text-gray-400')}`}
               >
                 {editingProjectId === p.id ? (
                   <input
                     autoFocus
                     value={editingName}
                     onChange={(e) => setEditingName(e.target.value)}
                     onBlur={() => {
                        if (editingName.trim()) updateProjectName(p.id, editingName);
                        setEditingProjectId(null);
                     }}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editingName.trim()) updateProjectName(p.id, editingName);
                          setEditingProjectId(null);
                        }
                     }}
                     className={`w-full border rounded px-2 py-1 outline-none ${isLight ? 'bg-white/80 border-black/20 text-gray-900' : 'bg-black/30 border-white/20 text-white'}`}
                   />
                 ) : (
                    <span className="truncate flex-1 ml-2">{p.name || 'بدون نام'}</span>
                 )}
                 
                 {!editingProjectId && (
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                     <button 
                       onClick={(e) => { e.stopPropagation(); setEditingName(p.name); setEditingProjectId(p.id); }}
                       className={`p-1 rounded ${isLight ? 'hover:bg-black/10 text-gray-600' : 'hover:bg-white/20 text-gray-300'}`}
                     >
                       <Pencil size={14} />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); duplicateProject(p.id); }}
                       className={`p-1 rounded ${isLight ? 'hover:bg-black/10 text-blue-600' : 'hover:bg-white/20 text-blue-300'}`}
                     >
                       <Copy size={14} />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                       className={`p-1 rounded ${isLight ? 'hover:bg-rose-500/20 text-rose-600' : 'hover:bg-rose-500/30 text-rose-400'}`}
                     >
                       <Trash2 size={14} />
                     </button>
                   </div>
                 )}
               </div>
             );
          })}
        </div>
        
      </aside>

      {/* Interactive Controls (Floaters) */}
      <div dir="rtl" className="absolute bottom-8 left-8 flex gap-3 z-50 pointer-events-auto">
        <div className={`backdrop-blur-xl border rounded-xl p-1.5 flex gap-1.5 shadow-xl ${isLight ? 'bg-white/60 border-black/10' : 'bg-white/5 border-white/10'}`}>
          <button onClick={() => undo()} disabled={undoHistory.length === 0} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border disabled:opacity-30 ${isLight ? 'hover:bg-black/5 border-transparent hover:border-black/5' : 'hover:bg-white/10 border-transparent hover:border-white/5'}`} title="بازگردانی">
             <Undo2 size={16} />
          </button>
          <button onClick={() => redo()} disabled={redoHistory.length === 0} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border disabled:opacity-30 ${isLight ? 'hover:bg-black/5 border-transparent hover:border-black/5' : 'hover:bg-white/10 border-transparent hover:border-white/5'}`} title="انجام دوباره">
             <Redo2 size={16} />
          </button>
        </div>
        <div className={`backdrop-blur-xl border rounded-xl p-1.5 flex gap-1.5 shadow-xl ${isLight ? 'bg-white/60 border-black/10' : 'bg-white/5 border-white/10'}`}>
          <button onClick={() => handleZoom(0.2)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border ${isLight ? 'hover:bg-black/5 border-transparent hover:border-black/5' : 'hover:bg-white/10 border-transparent hover:border-white/5'}`}>
             <Plus size={16} />
          </button>
          <button onClick={() => handleZoom(-0.2)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border ${isLight ? 'hover:bg-black/5 border-transparent hover:border-black/5' : 'hover:bg-white/10 border-transparent hover:border-white/5'}`}>
             <Minus size={16} />
          </button>
        </div>
        <div className={`backdrop-blur-xl border rounded-xl p-1.5 flex gap-1.5 shadow-xl ${isLight ? 'bg-white/60 border-black/10' : 'bg-white/5 border-white/10'}`}>
          <button 
            onClick={() => setShowConfirmClear(true)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border ${isLight ? 'hover:bg-rose-100 text-rose-500 border-transparent hover:border-rose-200' : 'hover:bg-rose-500/20 text-rose-400 border-transparent hover:border-rose-500/30'}`}
            title="پاکسازی تمام گره‌ها"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
      
      {/* Bottom Info Bar */}
      <footer dir="rtl" className={`absolute bottom-0 left-0 right-0 h-10 backdrop-blur-md border-t px-6 flex items-center justify-between text-[11px] z-40 pointer-events-none hidden md:flex transition-colors duration-500 ${isLight ? 'bg-white/60 border-black/10 text-gray-500' : 'bg-black/60 border-white/5 text-gray-400'}`}>
        <div className="flex gap-4">
          <span>پروژه: <strong className={isLight ? 'text-gray-900' : 'text-gray-200'}>{activeProject?.name || '...'}</strong></span>
          <span>تعداد نودها: {nodes.length}</span>
          <span>وضعیت: ذخیره شده در حافظه</span>
        </div>
        <div>
          راهنما: دابل‌کلیک روی صفحه خالی (گره جدید) | دابل‌کلیک روی گره (ویرایش)
        </div>
      </footer>

      {/* Watermark */}
      <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase font-mono tracking-[0.2em] pointer-events-none z-[60] opacity-60 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
        Developed by Alien7878
      </div>
      
      {/* Custom Confirmation Modal */}
      {showConfirmClear && (
        <div dir="rtl" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto p-4 select-none">
           <div className={`border p-6 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col gap-4 ${isLight ? 'bg-white border-black/10 text-gray-900' : 'bg-[#0a0c10] border-white/10 text-white'}`}>
              <div className="flex items-center gap-3 text-rose-500 mb-2">
                 <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-500">
                    <Trash2 size={24} />
                 </div>
                 <h3 className="text-xl font-bold">پاکسازی گره‌ها</h3>
              </div>
              <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                 آیا مطمئنید که می‌خواهید تمام گره‌های این پروژه را پاک کنید؟ این عملیات غیرقابل بازگشت است.
              </p>
              <div className="flex gap-3 justify-end mt-2">
                 <button 
                   onClick={() => setShowConfirmClear(false)}
                   className={`px-5 py-2.5 border rounded-xl transition-colors text-sm font-semibold ${isLight ? 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'}`}
                 >
                   انصراف
                 </button>
                 <button 
                   onClick={() => {
                     clearMap();
                     setShowConfirmClear(false);
                   }}
                   className={`px-5 py-2.5 border rounded-xl transition-colors text-sm font-semibold ${isLight ? 'bg-rose-100 hover:bg-rose-200 border-rose-200 text-rose-600' : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/30 text-rose-400'}`}
                 >
                   بله، پاک شود
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
