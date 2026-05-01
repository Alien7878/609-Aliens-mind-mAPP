import React from 'react';
import { useStore, EdgeData, NodeData } from '../store/useStore';
import { Unlink } from 'lucide-react';

interface EdgeViewProps {
  edge: EdgeData;
  nodes: NodeData[];
}

export const EdgeView: React.FC<EdgeViewProps> = ({ edge, nodes }) => {
  const { selectEdge, selectedEdgeId, deleteEdge } = useStore();
  const theme = useStore(state => state.theme);
  const isLight = theme === 'light';

  const source = nodes.find(n => n.id === edge.sourceId);
  const target = nodes.find(n => n.id === edge.targetId);

  if (!source || !target) return null;

  const isSelected = selectedEdgeId === edge.id;

  const getCX = (n: NodeData) => n.x + (n.width || 160) / 2;
  const getCY = (n: NodeData) => n.y + (n.height || 64) / 2;

  const sx = getCX(source);
  const sy = getCY(source);
  const tx = getCX(target);
  const ty = getCY(target);

  // Bezier curve logic for smooth aesthetic links
  const dx = Math.abs(tx - sx);
  const dy = Math.abs(ty - sy);
  
  // Decide orientation of curve based on delta
  const isHorizontal = dx > dy;
  const cpOffset = isHorizontal ? dx / 2 : dy / 2;
  
  const d = Math.abs(dx) > Math.abs(dy)
    ? `M ${sx} ${sy} C ${sx + cpOffset * (tx > sx ? 1 : -1)} ${sy}, ${tx - cpOffset * (tx > sx ? 1 : -1)} ${ty}, ${tx} ${ty}`
    : `M ${sx} ${sy} C ${sx} ${sy + cpOffset * (ty > sy ? 1 : -1)}, ${tx} ${ty - cpOffset * (ty > sy ? 1 : -1)}, ${tx} ${ty}`;

  const midX = sx + (tx - sx) / 2;
  const midY = sy + (ty - sy) / 2;

  return (
    <>
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer pointer-events-auto z-10"
        onPointerDown={(e) => {
          e.stopPropagation();
          selectEdge(edge.id);
        }}
      />
      <path
        d={d}
        fill="none"
        stroke={isSelected ? (isLight ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)") : (isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)")}
        strokeWidth={isSelected ? 4 : 3}
        className="transition-all duration-300 pointer-events-none"
      />
      {isSelected && (
        <foreignObject x={midX - 20} y={midY - 20} width={40} height={40} className="pointer-events-none z-20 overflow-visible">
          <button 
            className={`w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center border transition-all shadow-xl pointer-events-auto ${isLight ? 'bg-rose-100 hover:bg-rose-200 border-rose-200 text-rose-500' : 'bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/40 hover:text-rose-100'}`}
            onPointerDown={e => { e.stopPropagation(); deleteEdge(edge.id); }}
            title="حذف اتصال"
          >
            <Unlink size={16} />
          </button>
        </foreignObject>
      )}
    </>
  );
}
