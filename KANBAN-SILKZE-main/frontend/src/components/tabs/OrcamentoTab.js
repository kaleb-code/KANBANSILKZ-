import { useCallback, useMemo } from 'react';
import { Plus, Trash, FilePdf } from '@phosphor-icons/react';
import { formatCurrency } from '@/constants';

let nextItemId = Date.now();

export default function OrcamentoTab({ form, onChange, onDownloadPdf }) {
  const orcamento = useMemo(() => form.orcamento || [], [form.orcamento]);
  const descontoPct = form.descontoPct || 0;
  const entradaValor = form.entradaValor || 0;

  const subtotal = orcamento.reduce((acc, item) => acc + (item.total || 0), 0);
  const descontoValor = subtotal * descontoPct / 100;
  const totalFinal = subtotal - descontoValor;
  const restante = totalFinal - entradaValor;

  const handleAddItem = useCallback(() => {
    nextItemId += 1;
    const newItem = { _uid: `item_${nextItemId}`, descricao: '', quantidade: 0, unitario: 0, total: 0 };
    onChange('orcamento', [...orcamento, newItem]);
  }, [orcamento, onChange]);

  const handleRemoveItem = useCallback(
    (uid) => {
      onChange('orcamento', orcamento.filter((item) => item._uid !== uid));
    },
    [orcamento, onChange]
  );

  const handleItemChange = useCallback(
    (uid, field, value) => {
      const newOrcamento = orcamento.map((item) => {
        if (item._uid !== uid) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantidade' || field === 'unitario') {
          updated.total = (updated.quantidade || 0) * (updated.unitario || 0);
        }
        return updated;
      });
      onChange('orcamento', newOrcamento);
    },
    [orcamento, onChange]
  );

  return (
    <div className="space-y-4" data-testid="orcamento-tab">
      <div className="space-y-3">
        {orcamento.map((item, index) => (
          <OrcamentoItem
            key={item._uid || `fallback_${index}`}
            item={item}
            index={index}
            onRemove={() => handleRemoveItem(item._uid)}
            onFieldChange={(field, value) => handleItemChange(item._uid, field, value)}
          />
        ))}
      </div>

      <button
        data-testid="add-orcamento-item"
        onClick={handleAddItem}
        className="w-full py-2.5 border-2 border-dashed border-[#EBE8E1] rounded-md text-sm font-heading font-semibold text-[#A39F97] hover:text-[#FF5C00] hover:border-[#FF5C00] transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} weight="bold" />
        Adicionar Item
      </button>

      <TotalsSection
        subtotal={subtotal}
        descontoPct={descontoPct}
        descontoValor={descontoValor}
        totalFinal={totalFinal}
        entradaValor={entradaValor}
        restante={restante}
        onChange={onChange}
      />

      <button
        data-testid="download-pdf-button"
        onClick={onDownloadPdf}
        className="w-full py-2.5 bg-[#FF5C00] hover:bg-[#E65300] text-white rounded-md text-sm font-heading font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <FilePdf size={18} />
        Gerar PDF do Orcamento
      </button>
    </div>
  );
}

function OrcamentoItem({ item, index, onRemove, onFieldChange }) {
  return (
    <div data-testid={`orcamento-item-${index}`} className="bg-white border border-[#EBE8E1] rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-heading font-semibold text-[#635F59]">Item {index + 1}</span>
        <button data-testid={`remove-orcamento-item-${index}`} onClick={onRemove} className="p-1 text-[#A39F97] hover:text-red-500 transition-colors">
          <Trash size={16} />
        </button>
      </div>
      <input
        data-testid={`orcamento-descricao-${index}`}
        type="text"
        value={item.descricao}
        onChange={(e) => onFieldChange('descricao', e.target.value)}
        placeholder="Descricao"
        className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#EBE8E1] rounded text-sm text-[#1A1714] font-body placeholder:text-[#A39F97] focus:outline-none focus:border-[#FF5C00] transition-colors"
      />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] uppercase text-[#A39F97] font-body">Qtd</label>
          <input
            data-testid={`orcamento-quantidade-${index}`}
            type="number"
            value={item.quantidade || ''}
            onChange={(e) => onFieldChange('quantidade', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1.5 bg-[#FDFBF7] border border-[#EBE8E1] rounded text-sm text-[#1A1714] font-body text-right focus:outline-none focus:border-[#FF5C00] transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-[#A39F97] font-body">Unitario</label>
          <input
            data-testid={`orcamento-unitario-${index}`}
            type="number"
            step="0.01"
            value={item.unitario || ''}
            onChange={(e) => onFieldChange('unitario', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1.5 bg-[#FDFBF7] border border-[#EBE8E1] rounded text-sm text-[#1A1714] font-body text-right focus:outline-none focus:border-[#FF5C00] transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-[#A39F97] font-body">Total</label>
          <div className="px-2 py-1.5 bg-[#F4F1EA] border border-[#EBE8E1] rounded text-sm text-[#1A1714] font-body font-medium text-right">
            {formatCurrency(item.total)}
          </div>
        </div>
      </div>
    </div>
  );
}

function TotalsSection({ subtotal, descontoPct, descontoValor, totalFinal, entradaValor, restante, onChange }) {
  return (
    <div className="bg-white border border-[#EBE8E1] rounded-md p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-body text-[#635F59]">Subtotal</span>
        <span className="text-sm font-heading font-semibold text-[#1A1714]">{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-body text-[#635F59] flex-shrink-0">Desconto</span>
        <input
          data-testid="desconto-pct"
          type="number"
          min="0"
          max="100"
          value={descontoPct || ''}
          onChange={(e) => onChange('descontoPct', parseFloat(e.target.value) || 0)}
          className="w-16 px-2 py-1 bg-[#FDFBF7] border border-[#EBE8E1] rounded text-sm text-[#1A1714] font-body text-right focus:outline-none focus:border-[#FF5C00] transition-colors"
        />
        <span className="text-sm font-body text-[#635F59]">%</span>
        <span className="ml-auto text-sm font-heading font-semibold text-red-500">-{formatCurrency(descontoValor)}</span>
      </div>
      <div className="border-t border-[#EBE8E1] pt-3 flex justify-between items-center">
        <span className="text-base font-heading font-bold text-[#1A1714]">Total</span>
        <span className="text-base font-heading font-bold text-[#FF5C00]">{formatCurrency(totalFinal)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-body text-[#635F59] flex-shrink-0">Entrada R$</span>
        <input
          data-testid="entrada-valor"
          type="number"
          step="0.01"
          min="0"
          value={entradaValor || ''}
          onChange={(e) => onChange('entradaValor', parseFloat(e.target.value) || 0)}
          className="w-24 px-2 py-1 bg-[#FDFBF7] border border-[#EBE8E1] rounded text-sm text-[#1A1714] font-body text-right focus:outline-none focus:border-[#FF5C00] transition-colors"
        />
        <span className="ml-auto text-sm font-heading font-semibold text-[#1A1714]">Restante: {formatCurrency(restante)}</span>
      </div>
    </div>
  );
}
