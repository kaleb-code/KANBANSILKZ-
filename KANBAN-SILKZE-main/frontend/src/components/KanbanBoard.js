import { useState, useRef, useCallback } from 'react';
import { MagnifyingGlass, Plus, DownloadSimple, UploadSimple, SignOut } from '@phosphor-icons/react';
import { COLUMNS } from '@/constants';
import { pedidosApi } from '@/api';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import KanbanColumn from './KanbanColumn';
import PedidoSheet from './PedidoSheet';

export default function KanbanBoard({ pedidos, setPedidos, onRefresh, onLogout }) {
  const [busca, setBusca] = useState('');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpdatePedido = useCallback(async (id, data) => {
    try {
      await pedidosApi.update(id, data);
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
      setSelectedPedido((prev) => (prev?.id === id ? { ...prev, ...data } : prev));
    } catch {
      // handled by interceptor
    }
  }, [setPedidos]);

  const {
    dragOverCol,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleMoveToColumn,
  } = useDragAndDrop(pedidos, handleUpdatePedido);

  const filteredPedidos = pedidos.filter((p) => {
    if (!busca) return true;
    const s = busca.toLowerCase();
    return (
      (p.cliente || '').toLowerCase().includes(s) ||
      (p.material || '').toLowerCase().includes(s) ||
      (p.detalhes || '').toLowerCase().includes(s) ||
      (p.razaoSocial || '').toLowerCase().includes(s)
    );
  });

  const getPedidosByStatus = (status) =>
    filteredPedidos.filter((p) => p.status === status);

  const handleCreatePedido = useCallback(async (status = 'Orçamento') => {
    try {
      const res = await pedidosApi.create({ status, cliente: '', material: '' });
      setPedidos((prev) => [res.data, ...prev]);
      setSelectedPedido(res.data);
      setSheetOpen(true);
    } catch {
      // handled by interceptor
    }
  }, [setPedidos]);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    setSelectedPedido(null);
  }, []);

  const handleOpenPedido = useCallback((pedido) => {
    setSelectedPedido(pedido);
    setSheetOpen(true);
  }, []);

  const handleDeletePedido = useCallback(async (id) => {
    try {
      await pedidosApi.delete(id);
      setPedidos((prev) => prev.filter((p) => p.id !== id));
      setSheetOpen(false);
      setSelectedPedido(null);
    } catch {
      // handled by interceptor
    }
  }, [setPedidos]);

  const handleBackup = useCallback(async () => {
    try {
      const res = await pedidosApi.backup();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `silkze-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // handled by interceptor
    }
  }, []);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.pedidos) {
        window.alert('Arquivo de backup invalido!');
        return;
      }
      if (window.confirm(`Restaurar ${data.pedidos.length} pedidos? Dados atuais serao substituidos.`)) {
        await pedidosApi.restore(data);
        onRefresh();
      }
    } catch {
      window.alert('Erro ao ler arquivo de backup');
    }
    e.target.value = '';
  }, [onRefresh]);

  return (
    <div className="h-screen flex flex-col bg-[#FDFBF7]" data-testid="kanban-board">
      <Header
        busca={busca}
        onBuscaChange={setBusca}
        onCreatePedido={() => handleCreatePedido()}
        onBackup={handleBackup}
        onRestore={() => fileInputRef.current?.click()}
        onLogout={onLogout}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex-1 overflow-x-auto overflow-y-hidden kanban-board" data-testid="kanban-columns-container">
        <div className="flex h-full p-3 gap-3 min-w-max">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              pedidos={getPedidosByStatus(col.id)}
              onOpenPedido={handleOpenPedido}
              onCreatePedido={() => handleCreatePedido(col.id)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              isDragOver={dragOverCol === col.id}
              allColumns={COLUMNS}
              onMoveToColumn={handleMoveToColumn}
            />
          ))}
        </div>
      </div>

      {sheetOpen && selectedPedido && (
        <PedidoSheet
          pedido={selectedPedido}
          onClose={handleCloseSheet}
          onUpdate={handleUpdatePedido}
          onDelete={handleDeletePedido}
          allColumns={COLUMNS}
        />
      )}
    </div>
  );
}

function Header({ busca, onBuscaChange, onCreatePedido, onBackup, onRestore, onLogout }) {
  return (
    <header className="flex-shrink-0 bg-white border-b border-[#EBE8E1] px-4 py-3" data-testid="kanban-header">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-lg sm:text-xl font-bold text-[#1A1714] tracking-tight whitespace-nowrap">
          SilkZe
        </h1>
        <div className="flex-1 max-w-md relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A39F97]" size={18} />
          <input
            data-testid="search-input"
            type="text"
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            placeholder="Buscar pedidos..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F1EA] border border-[#EBE8E1] rounded-md text-sm text-[#1A1714] font-body placeholder:text-[#A39F97] focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            data-testid="new-pedido-button"
            onClick={onCreatePedido}
            className="flex items-center gap-1 px-3 py-2 bg-[#FF5C00] hover:bg-[#E65300] text-white rounded-md text-sm font-heading font-semibold transition-all active:scale-95"
          >
            <Plus size={18} weight="bold" />
            <span className="hidden sm:inline">Novo</span>
          </button>
          <button data-testid="backup-button" onClick={onBackup} className="p-2 text-[#635F59] hover:text-[#FF5C00] hover:bg-[#FFF0E5] rounded-md transition-colors" title="Exportar backup">
            <DownloadSimple size={20} />
          </button>
          <button data-testid="restore-button" onClick={onRestore} className="p-2 text-[#635F59] hover:text-[#FF5C00] hover:bg-[#FFF0E5] rounded-md transition-colors" title="Importar backup">
            <UploadSimple size={20} />
          </button>
          <button data-testid="logout-button" onClick={onLogout} className="p-2 text-[#635F59] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Sair">
            <SignOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
