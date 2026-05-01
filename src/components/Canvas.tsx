import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { NodeView } from './NodeView';
import { EdgeView } from './EdgeView';

export default function Canvas() {
  const { 
    projects, activeProjectId, 
    setCanvas, selectNode, addNode 
  } = useStore();
  
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const proj = projects.find(p => p.id === activeProjectId);
  if (!proj) return null;
  const { nodes, edges, canvas } = proj;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only pan on left or middle click directly on the canvas background
    if (e.target !== canvasRef.current) return;
    if (e.button !== 0 && e.button !== 1) return;
    
    selectNode(null); // deselect
    setIsPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const initialCanvasX = canvas.x;
    const initialCanvasY = canvas.y;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setCanvas(initialCanvasX + dx, initialCanvasY + dy, canvas.scale);
    };
    
    const handlePointerUp = () => {
      setIsPanning(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;
    
    // Convert to canvas coordinates
    const targetX = (pointerX - canvas.x) / canvas.scale;
    const targetY = (pointerY - canvas.y) / canvas.scale;
    
    addNode(targetX, targetY - 32, 'ایده جدید'); // creating disconnected node
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomSensitivity = 0.002;
      let newScale = canvas.scale - e.deltaY * zoomSensitivity;
      newScale = Math.min(Math.max(0.1, newScale), 5); // clamp scale
      
      // Calculate cursor position relative to the transform origin (top left)
      const rect = el.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      
      // Point under cursor before scale
      const targetX = (pointerX - canvas.x) / canvas.scale;
      const targetY = (pointerY - canvas.y) / canvas.scale;
      
      // Update store with new scale and adjusted position to zoom to pointer
      setCanvas(
        pointerX - targetX * newScale,
        pointerY - targetY * newScale,
        newScale
      );
    };
    
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [canvas, setCanvas]);

  return (
    <div 
      ref={canvasRef}
      id="canvas-root"
      className="absolute inset-0 w-full h-full overflow-hidden bg-transparent select-none cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: `${40 * canvas.scale}px ${40 * canvas.scale}px`,
        backgroundPosition: `${canvas.x}px ${canvas.y}px`,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
    >
      <div 
        className="w-full h-full will-change-transform origin-top-left pointer-events-none"
        style={{ transform: `translate(${canvas.x}px, ${canvas.y}px) scale(${canvas.scale})` }}
      >
        <svg className="absolute top-0 left-0 overflow-visible w-full h-full pointer-events-none">
          {edges.map(e => <EdgeView key={e.id} edge={e} nodes={nodes} />)}
        </svg>

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {nodes.map(n => <NodeView key={n.id} node={n} />)}
        </div>
      </div>
    </div>
  );
}
