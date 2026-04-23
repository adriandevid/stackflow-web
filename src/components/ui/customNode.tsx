import { Box, Database, Server, Share2, Zap } from "lucide-react";
import { useRef } from "react";
import StatusBadge from "./statusBadge";

export default function CustomNode({ node, isSelected, onClick, activeSelectNode, onDrag, onStartConnect, onEndConnect }: any) {
  const { id, type, data, position, status } = node;
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  
  const getIcon = () => {
    if (type === 'container') return <Box size={16} className="text-cyan-400" />;
    if (type === 'service') return <Server size={16} className="text-blue-600" />;

    switch (data.subType) {
      case 'redis': return <Zap size={16} className="text-red-500" />;
      case 'mq': return <Share2 size={16} className="text-purple-500" />;
      default: return <Database size={16} className="text-amber-600" />;
    }
  };

  const themes: any = {
    service: "border-blue-500 bg-white text-slate-800",
    container: "border-cyan-400 bg-slate-800 text-white",
    database: "border-amber-500 bg-amber-50 text-slate-800"
  };

  const handleMouseDown = (e: any) => {
    if (e.button !== 0) return;
    if (e.target.closest('.handle')) return; // Não arrasta se clicar no conector

    e.stopPropagation();
    isDragging.current = true;
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };

    if(activeSelectNode) {
      onClick(id);
    }

    const handleMouseMove = (moveEvent: any) => {
      if (!isDragging.current) return;
      const newX = moveEvent.clientX - startPos.current.x;
      const newY = moveEvent.clientY - startPos.current.y;
      onDrag(id, newX, newY);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={() => onEndConnect(id)}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
        cursor: activeSelectNode && !isSelected ? "default" : "move"
      }}
      className={`absolute cursor-move p-3 rounded-xl border-2 shadow-lg min-w-[180px] group select-none  ${themes[type]} ${isSelected && activeSelectNode ? 'ring-4 ring-cyan-500/30 z-20 scale-105' : 'hover:border-slate-400 z-10'}`}
    >
      <div className="flex items-center justify-between mb-2 pointer-events-none gap-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${type === 'container' ? 'bg-slate-700' : 'bg-white/80 shadow-sm'}`}>
            {getIcon()}
          </div>
          <span className="text-xs font-bold uppercase tracking-tight">{data.label}</span>
        </div>
        <StatusBadge active={status} />
      </div>

      <div className={`text-[10px] font-mono mt-2 p-1.5 rounded pointer-events-none ${type === 'container' ? 'bg-black/20 text-cyan-200' : 'bg-slate-100 text-slate-500'}`}>
        {type === 'container' ? `image: ${data.image}` : `port: ${data.port || 'default'}`}
      </div>

      {/* Handles de conexão */}
      <div
        onMouseDown={(e) => { e.stopPropagation(); onStartConnect(id, 'left'); }}
        className="handle absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-300 hover:border-cyan-500 cursor-crosshair z-30 flex items-center justify-center transition-colors"
      >
        <div className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-cyan-500"></div>
      </div>
      <div
        onMouseDown={(e) => { e.stopPropagation(); onStartConnect(id, 'right'); }}
        className="handle absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-300 hover:border-cyan-500 cursor-crosshair z-30 flex items-center justify-center transition-colors"
      >
        <div className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-cyan-500"></div>
      </div>
    </div>
  );
};