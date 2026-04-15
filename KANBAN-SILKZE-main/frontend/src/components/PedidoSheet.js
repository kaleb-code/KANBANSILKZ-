import { useState, useCallback } from 'react';
import { X, Trash, FloppyDisk, CaretDown } from '@phosphor-icons/react';
import { COLUMNS, PRIORIDADES, CHECKLIST_ITEMS } from '@/constants';
import { usePedidoForm } from '@/hooks/usePedidoForm';
import api from '@/api';
import { pedidosApi } from '@/api';
import GradeTab from './tabs/GradeTab';
import OrcamentoTab from './tabs/OrcamentoTab';
import ImagemTab from './tabs/ImagemTab';

const TABS = [
  { id: 'info', label: 'Informações' },
  { id: 'orcamento', label: 'Orçar' },
  { id: 'grade', label: 'Tamanhos' },
  { id: 'checklist', label: 'Verificar' },
  { id: 'imagem', label: 'Imagem' },
  { id: 'layout', label: 'Layout' },
];

export default function PedidoSheet({ pedido, onClose, onUpdate, onDelete, allColumns }) {
  const [activeTab, setActiveTab] = useState('info');
  const { form, saving, handleChange, handleSave } = usePedidoForm(pedido, onUpdate);

  const handleStatusChange = useCallback(
    (newStatus) => {
      if (newStatus === 'Finalizado') {
        const cl = form.checklist || {};
        if (!cl.layout || !cl.grade || !cl.fotolito || !cl.nota || !cl.entregue) {
          window.alert('Complete todos os itens do checklist antes de finalizar!');
          return;
        }
      }
      handleChange('status', newStatus);
    },
    [form.checklist, handleChange]
  );

  const handleChecklistChange = useCallback(
    (key, value) => {
      handleChange('checklist', { ...form.checklist, [key]: value });
    },
    [form.checklist, handleChange]
  );

  const handleDownloadPdf = useCallback(async () => {
    try {
      const res = await api.get(`/pedidos/${pedido.id}/pdf`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `orcamento_${form.numero || pedido.id}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // PDF generation failed silently
    }
  }, [pedido.id, form.numero]);

  const handleCloseAndSave = useCallback(() => {
    handleSave();
    onClose();
  }, [handleSave, onClose]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={handleCloseAndSave}
        data-testid="sheet-overlay"
      />

      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-[#FDFBF7] shadow-2xl animate-slide-in-right flex flex-col"
        data-testid="pedido-sheet"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#EBE8E1] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg font-bold text-[#FF5C00]">#{form.numero}</span>
            <div className="relative">
              <select
                data-testid="status-select"
                value={form.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs font-heading font-semibold tracking-[0.1em] uppercase px-2 py-1 rounded-full border border-[#EBE8E1] bg-white text-[#1A1714] focus:outline-none focus:border-[#FF5C00] appearance-none pr-6 cursor-pointer"
                style={{
                  borderColor: allColumns.find((c) => c.id === form.status)?.color,
                  color: allColumns.find((c) => c.id === form.status)?.color,
                }}
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>{col.id}</option>
                ))}
              </select>
              <CaretDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#A39F97]" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            {saving && <span className="text-xs text-[#A39F97] font-body mr-2">Salvando...</span>}
            <button data-testid="save-pedido-button" onClick={handleSave} className="p-2 text-[#FF5C00] hover:bg-[#FFF0E5] rounded-md transition-colors" title="Salvar">
              <FloppyDisk size={20} />
            </button>
            <button
              data-testid="delete-pedido-button"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
                  onDelete(pedido.id);
                }
              }}
              className="p-2 text-[#A39F97] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Excluir"
            >
              <Trash size={20} />
            </button>
            <button data-testid="close-sheet-button" onClick={handleCloseAndSave} className="p-2 text-[#635F59] hover:bg-[#F4F1EA] rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-2 py-2 bg-white border-b border-[#EBE8E1] overflow-x-auto">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id ? 'bg-[#FF5C00] text-white' : 'text-[#635F59] hover:bg-[#F4F1EA]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'info' && <InfoTab form={form} onChange={handleChange} />}
          {activeTab === 'orcamento' && <OrcamentoTab form={form} onChange={handleChange} onDownloadPdf={handleDownloadPdf} />}
          {activeTab === 'grade' && <GradeTab form={form} onChange={handleChange} pedidoId={pedido.id} />}
          {activeTab === 'checklist' && <ChecklistTab form={form} onChecklistChange={handleChecklistChange} />}
          {activeTab === 'imagem' && <ImagemTab pedidoId={pedido.id} imagem={form.imagem} onChange={handleChange} />}
          {activeTab === 'layout' && <LayoutTab form={form} onChange={handleChange} />}
        </div>
      </div>
    </>
  );
}

function InfoTab({ form, onChange }) {
  return (
    <div className="space-y-4" data-testid="info-tab">
      <FormField label="Cliente" field="cliente" value={form.cliente} onChange={onChange} />
      <FormField label="Razao Social" field="razaoSocial" value={form.razaoSocial} onChange={onChange} />
      <FormField label="CNPJ/CPF" field="cnpjCpf" value={form.cnpjCpf} onChange={onChange} />
      <FormField label="Material" field="material" value={form.material} onChange={onChange} />
      <FormField label="Detalhes" field="detalhes" value={form.detalhes} onChange={onChange} multiline />
      <FormField label="Contato" field="contato" value={form.contato} onChange={onChange} />
      <FormField label="Data de Entrega" field="data" value={form.data} onChange={onChange} type="date" />
      <div>
        <label className="text-xs tracking-[0.15em] uppercase text-[#635F59] font-body block mb-1.5">Prioridade</label>
        <div className="flex gap-2" data-testid="priority-selector">
          {PRIORIDADES.map((p) => (
            <button
              key={p.value}
              data-testid={`priority-${p.value}`}
              onClick={() => onChange('prioridade', p.value)}
              className={`flex-1 py-2 rounded-md text-xs font-heading font-semibold border transition-all ${
                form.prioridade === p.value ? 'text-white shadow-sm' : 'text-[#635F59] border-[#EBE8E1] bg-white hover:bg-[#F4F1EA]'
              }`}
              style={form.prioridade === p.value ? { backgroundColor: p.color, borderColor: p.color } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, field, value, onChange, multiline = false, type = 'text' }) {
  const cls = "w-full px-3 py-2.5 bg-white border border-[#EBE8E1] rounded-md text-sm text-[#1A1714] font-body placeholder:text-[#A39F97] focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] transition-colors";
  return (
    <div>
      <label className="text-xs tracking-[0.15em] uppercase text-[#635F59] font-body block mb-1.5">{label}</label>
      {multiline ? (
        <textarea data-testid={`field-${field}`} value={value || ''} onChange={(e) => onChange(field, e.target.value)} rows={3} className={`${cls} resize-none`} />
      ) : (
        <input data-testid={`field-${field}`} type={type} value={value || ''} onChange={(e) => onChange(field, e.target.value)} className={cls} />
      )}
    </div>
  );
}

function ChecklistTab({ form, onChecklistChange }) {
  const checklist = form.checklist || {};
  const completedCount = CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;
  const progress = (completedCount / CHECKLIST_ITEMS.length) * 100;

  return (
    <div className="space-y-4" data-testid="checklist-tab">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs tracking-[0.15em] uppercase text-[#635F59] font-body">Progresso</span>
          <span className="text-xs font-heading font-semibold text-[#1A1714]">{completedCount}/{CHECKLIST_ITEMS.length}</span>
        </div>
        <div className="w-full h-2 bg-[#EBE8E1] rounded-full overflow-hidden">
          <div className="h-full bg-[#FF5C00] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} data-testid="checklist-progress" />
        </div>
      </div>
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <label
            key={item.key}
            data-testid={`checklist-${item.key}`}
            className={`flex items-center gap-3 p-3 bg-white border border-[#EBE8E1] rounded-md cursor-pointer transition-all hover:border-[#FF5C00] ${checklist[item.key] ? 'border-green-300 bg-green-50/50' : ''}`}
          >
            <input type="checkbox" checked={checklist[item.key] || false} onChange={(e) => onChecklistChange(item.key, e.target.checked)} className="w-5 h-5 rounded border-[#EBE8E1] text-[#FF5C00] focus:ring-[#FF5C00] cursor-pointer accent-[#FF5C00]" />
            <span className={`text-sm font-body ${checklist[item.key] ? 'text-[#A39F97] line-through' : 'text-[#1A1714]'}`}>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function LayoutTab({ form, onChange }) {
  return (
    <div className="space-y-4" data-testid="layout-tab">
      <label className="text-xs tracking-[0.15em] uppercase text-[#635F59] font-body block mb-1.5">Observacoes / Alteracoes de Layout</label>
      <textarea
        data-testid="layout-notes"
        value={form.layout || ''}
        onChange={(e) => onChange('layout', e.target.value)}
        rows={12}
        placeholder="Anote aqui as observacoes sobre o layout, alteracoes solicitadas pelo cliente..."
        className="w-full px-3 py-2.5 bg-white border border-[#EBE8E1] rounded-md text-sm text-[#1A1714] font-body placeholder:text-[#A39F97] focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] transition-colors resize-none"
      />
    </div>
  );
}
