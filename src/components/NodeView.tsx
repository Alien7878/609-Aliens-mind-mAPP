import React, { useState } from 'react';
import { useStore, NodeData, COLORS } from '../store/useStore';
import { Plus, Trash, Copy, Palette } from 'lucide-react';

interface NodeViewProps {
  node: NodeData;
}

export const NodeView: React.FC<NodeViewProps> = ({ node }) => {
  const { 
    projects, activeProjectId,
    moveNodeAndChildren, updateNode, deleteNode, selectNode, selectedNodeId, 
    addNode, duplicateNodeSubtree, addEdge
  } = useStore();
  
  const activeProject = projects.find(p => p.id === activeProjectId);
  const canvas = activeProject?.canvas || { x: 0, y: 0, scale: 1 };
  
  const isSelected = selectedNodeId === node.id;
  const [isEditing, setIsEditing] = useState(false);
  const [showColors, setShowColors] = useState(false);
  
  const isRoot = node.id === 'root';
  const width = node.width || (isRoot ? 192 : 160);
  const height = node.height || (isRoot ? 80 : 64);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    
    // Check if we are clicking a button
    if ((e.target as HTMLElement).closest('button')) return;

    e.stopPropagation();
    selectNode(node.id);
    setShowColors(false);
    
    let prevX = e.clientX;
    let prevY = e.clientY;
    let hasMoved = false;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      hasMoved = true;
      const dx = (moveEvent.clientX - prevX) / canvas.scale;
      const dy = (moveEvent.clientY - prevY) / canvas.scale;
      prevX = moveEvent.clientX;
      prevY = moveEvent.clientY;
      moveNodeAndChildren(node.id, dx, dy);
    };
    
    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Check auto-connect if it moved
      if (hasMoved && !isRoot) {
        const proj = useStore.getState().projects.find(p => p.id === activeProjectId);
        if (proj) {
          const cx = node.x + width / 2;
          const cy = node.y + height / 2;
          
          for (const n of proj.nodes) {
             if (n.id !== node.id) {
               const nx = n.x;
               const ny = n.y;
               const nw = n.width || 160;
               const nh = n.height || 64;
               
               // simple overlap
               if (cx >= nx && cx <= nx + nw && cy >= ny && cy <= ny + nh) {
                  // Connect n -> node
                  useStore.getState().addEdge(n.id, node.id);
                  break;
               }
             }
          }
        }
      }
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  
  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    addNode(node.x + width + 40, node.y, 'ایده جدید', node.id);
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = width;
    const startH = height;

    const handleMove = (moveEvent: PointerEvent) => {
        const dx = (moveEvent.clientX - startX) / canvas.scale;
        const dy = (moveEvent.clientY - startY) / canvas.scale;
        // The container is rtl, meaning dx grows to the left generally, but x is absolute.
        // Actually, CSS width/height don't care about RTL for dragging bottom-right corner
        updateNode(node.id, { width: Math.max(100, startW + dx), height: Math.max(40, startH + dy) });
    };

    const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const isLight = useStore(state => state.theme) === 'light';

  const rootClasses = `backdrop-blur-2xl border-2 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.2)] font-bold ${isLight ? 'bg-purple-500/10 border-purple-400/30 text-purple-900' : 'bg-purple-500/20 border-purple-400/50'}`;
  const childClasses = `backdrop-blur-md border rounded-2xl shadow-lg ${node.color || (isLight ? 'bg-black/5 border-black/20 text-gray-900' : 'bg-white/5 border-white/20 text-white')}`;

  const getSolidColor = (cls: string) => {
    if (cls.includes('blue')) return '#3b82f6';
    if (cls.includes('emerald')) return '#10b981';
    if (cls.includes('amber')) return '#f59e0b';
    if (cls.includes('rose')) return '#f43f5e';
    if (cls.includes('purple')) return '#a855f7';
    return '#ffffff';
  };

  // responsive text sizing
  let fontSize = Math.min(width / 8, height / 3);
  if (node.text.length > 15) fontSize = Math.min(width / 12, height / 4);
  if (node.text.length > 30) fontSize = Math.min(width / 16, height / 5);
  if (isRoot) fontSize *= 1.2;
  fontSize = Math.max(10, Math.min(fontSize, 36));

  return (
    <div 
      dir="rtl"
      className={`absolute transition-colors cursor-grab active:cursor-grabbing flex items-center justify-center p-3 text-center pointer-events-auto ${isRoot ? rootClasses : childClasses} ${isSelected ? 'ring-2 ring-white/80 z-20 shadow-white/20' : 'hover:border-white/40 z-10'}`}
      style={{ transform: `translate(${node.x}px, ${node.y}px)`, width: `${width}px`, height: `${height}px` }}
      onPointerDown={handlePointerDown}
      onClick={() => { if(!isSelected) selectNode(node.id) }}
      onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
    >
      {isEditing ? (
        <textarea 
          autoFocus
          className="w-full h-full bg-transparent border-none text-center resize-none outline-none focus:ring-0 placeholder:opacity-50 font-medium text-inherit flex items-center"
          value={node.text}
          onChange={e => updateNode(node.id, { text: e.target.value })}
          onBlur={() => setIsEditing(false)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setIsEditing(false); } }}
          style={{ lineHeight: 'normal', fontSize: `${fontSize}px` }}
        />
      ) : (
        <span 
          className="font-medium break-words select-none pointer-events-none drop-shadow-md text-inherit w-full"
          style={{ fontSize: `${fontSize}px` }}
        >
          {node.text}
        </span>
      )}

      {/* Resize Handle */}
      {isSelected && (
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end pointer-events-auto"
          onPointerDown={handleResizeDown}
        >
           <div className="w-2 h-2 bg-white/50 rounded-tl-sm mr-1 mb-1"></div>
        </div>
      )}
      
      {isSelected && !isEditing && (
        <div 
          className={`absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 backdrop-blur-xl border rounded-full p-1.5 shadow-xl pointer-events-auto ${isLight ? 'bg-white/80 border-black/10' : 'bg-white/10 border-white/20'}`} 
          onPointerDown={e => e.stopPropagation()}
        >
           <button onPointerDown={handleAddChild} className={`p-1.5 rounded-full transition-colors ${isLight ? 'text-emerald-500 hover:bg-black/5 hover:text-emerald-600' : 'text-emerald-400 hover:bg-white/10 hover:text-emerald-300'}`} title="افزودن فرزند">
             <Plus size={16} />
           </button>
           
           <div className="relative">
             <button onPointerDown={() => setShowColors(!showColors)} className={`p-1.5 rounded-full transition-colors ${isLight ? 'text-amber-500 hover:bg-black/5 hover:text-amber-600' : 'text-amber-400 hover:bg-white/10 hover:text-amber-300'}`} title="تغییر رنگ">
               <Palette size={16} />
             </button>
             
             {showColors && (
                <div className={`absolute top-10 left-1/2 -translate-x-1/2 flex gap-1 p-2 backdrop-blur-2xl border rounded-2xl shadow-2xl z-50 pointer-events-auto ${isLight ? 'bg-white/90 border-black/10' : 'bg-white/10 border-white/20'}`}>
                   {COLORS.map(c => (
                     <button
                       key={c}
                       onPointerDown={() => { updateNode(node.id, { color: c }); setShowColors(false); }}
                       className={`w-6 h-6 rounded-full border hover:scale-110 transition-transform ${isLight ? 'border-black/20' : 'border-white/40'}`}
                       style={{ backgroundColor: getSolidColor(c) }}
                     />
                   ))}
                </div>
             )}
           </div>

           {!isRoot && (
             <button onPointerDown={() => duplicateNodeSubtree(node.id)} className={`p-1.5 rounded-full transition-colors ${isLight ? 'text-blue-500 hover:bg-black/5 hover:text-blue-600' : 'text-blue-400 hover:bg-white/10 hover:text-blue-300'}`} title="کپی">
               <Copy size={16} />
             </button>
           )}

           {!isRoot && (
             <button onPointerDown={() => deleteNode(node.id)} className={`p-1.5 rounded-full transition-colors ${isLight ? 'text-rose-500 hover:bg-black/5 hover:text-rose-600' : 'text-rose-400 hover:bg-white/10 hover:text-rose-300'}`} title="حذف">
               <Trash size={16} />
             </button>
           )}
        </div>
      )}
    </div>
  );
}
