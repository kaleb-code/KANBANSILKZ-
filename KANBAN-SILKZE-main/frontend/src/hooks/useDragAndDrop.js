import { useState, useCallback } from 'react';

/**
 * Custom hook to manage drag-and-drop state for the Kanban board.
 */
export function useDragAndDrop(pedidos, onUpdatePedido) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = useCallback((e, pedidoId) => {
    setDraggedId(pedidoId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pedidoId);
    e.target.classList.add('dragging');
  }, []);

  const handleDragEnd = useCallback((e) => {
    setDraggedId(null);
    setDragOverCol(null);
    e.target.classList.remove('dragging');
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((colId) => {
    setDragOverCol(colId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const isChecklistComplete = useCallback((pedido) => {
    const cl = pedido.checklist || {};
    return cl.layout && cl.grade && cl.fotolito && cl.nota && cl.entregue;
  }, []);

  const handleDrop = useCallback(
    (e, targetStatus) => {
      e.preventDefault();
      setDragOverCol(null);
      if (!draggedId) return;

      const pedido = pedidos.find((p) => p.id === draggedId);
      if (!pedido || pedido.status === targetStatus) return;

      if (targetStatus === 'Finalizado' && !isChecklistComplete(pedido)) {
        window.alert('Complete todos os itens do checklist antes de finalizar!');
        return;
      }

      onUpdatePedido(draggedId, { status: targetStatus });
      setDraggedId(null);
    },
    [draggedId, pedidos, onUpdatePedido, isChecklistComplete]
  );

  const handleMoveToColumn = useCallback(
    (pedidoId, targetStatus) => {
      const pedido = pedidos.find((p) => p.id === pedidoId);
      if (!pedido || pedido.status === targetStatus) return;

      if (targetStatus === 'Finalizado' && !isChecklistComplete(pedido)) {
        window.alert('Complete todos os itens do checklist antes de finalizar!');
        return;
      }

      onUpdatePedido(pedidoId, { status: targetStatus });
    },
    [pedidos, onUpdatePedido, isChecklistComplete]
  );

  return {
    dragOverCol,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleMoveToColumn,
  };
}
