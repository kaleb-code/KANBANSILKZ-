import { Plus, ArrowsDownUp } from '@phosphor-icons/react';
import { PRIORIDADES } from '@/constants';
import { useState } from 'react';

function PriorityDot({ prioridade }) {
  const p = PRIORIDADES.find((pr) => pr.value === prioridade) || PRIORIDADES[1];
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />;
}

function KanbanCard({ pedido, onOpen, onDragStart, onDragEnd, allColumns, onMoveToColumn }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  return (
    <div
      data-testid={`kanban-card-${pedido.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, pedido.id)}
      onDragEnd={onDragEnd}
      className="bg-white border border-[#EBE8E1] rounded-md p-3 cursor-pointer hover:-translate-y-[1px] hover:shadow-md transition-all duration-200 group relative"
      style={{ borderLeftWidth: '3px', borderLeftColor: allColumns?.find(c => c.id === pedido.status)?.color || '#8B8884' }}
    >
      <div onClick={() => onOpen(pedido)}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-heading font-semibold text-[#FF5C00]">#{pedido.numero}</span>
          <PriorityDot prioridade={pedido.prioridade} />
        </div>
        <p className="text-sm font-body font-medium text-[#1A1714] truncate">
          {pedido.cliente || 'Sem cliente'}
        </p>
        <p className="text-xs font-body text-[#635F59] truncate mt-0.5">
          {pedido.material || 'Sem material'}
        </p>
        {pedido.data && (
          <p className="text-xs font-body text-[#A39F97] mt-1">{pedido.data}</p>
        )}
      </div>

      {/* Mobile move button */}
      <button
        data-testid={`move-card-${pedido.id}`}
        onClick={(e) => {
          e.stopPropagation();
          setShowMoveMenu(!showMoveMenu);
        }}
        className="absolute top-2 right-2 p-1 rounded text-[#A39F97] hover:text-[#FF5C00] hover:bg-[#FFF0E5] opacity-0 group-hover:opacity-100 transition-opacity sm:hidden active:opacity-100"
      >
        <ArrowsDownUp size={16} />
      </button>

      {showMoveMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMoveMenu(false)} />
          <div
            className="absolute top-8 right-0 z-50 bg-white border border-[#EBE8E1] rounded-md shadow-lg py-1 w-40 max-h-60 overflow-y-auto"
            data-testid={`move-menu-${pedido.id}`}
          >
            {allColumns?.filter(c => c.id !== pedido.status).map((col) => (
              <button
                key={col.id}
                data-testid={`move-to-${col.label}-${pedido.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToColumn(pedido.id, col.id);
                  setShowMoveMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-body hover:bg-[#FFF0E5] transition-colors flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                {col.id}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function KanbanColumn({
  column,
  pedidos,
  onOpenPedido,
  onCreatePedido,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  isDragOver,
  allColumns,
  onMoveToColumn,
}) {
  return (
    <div
      data-testid={`kanban-column-${column.label}`}
      className={`kanban-column flex flex-col w-[280px] sm:w-[260px] flex-shrink-0 rounded-lg bg-[#F4F1EA] transition-all duration-200 ${
        isDragOver ? 'drag-over' : ''
      }`}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
          <h3 className="font-heading text-xs font-semibold tracking-[0.1em] uppercase text-[#1A1714]">
            {column.id}
          </h3>
          <span
            data-testid={`column-count-${column.label}`}
            className="text-[10px] font-heading font-semibold bg-white text-[#635F59] px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
          >
            {pedidos.length}
          </span>
        </div>
        <button
          data-testid={`add-pedido-${column.label}`}
          onClick={onCreatePedido}
          className="p-1 text-[#A39F97] hover:text-[#FF5C00] hover:bg-[#FFF0E5] rounded transition-colors"
        >
          <Plus size={16} weight="bold" />
        </button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-0">
        {pedidos.map((pedido) => (
          <KanbanCard
            key={pedido.id}
            pedido={pedido}
            onOpen={onOpenPedido}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            allColumns={allColumns}
            onMoveToColumn={onMoveToColumn}
          />
        ))}
      </div>
    </div>
  );
}
