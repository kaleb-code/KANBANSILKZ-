import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash, Printer } from '@phosphor-icons/react';
import { TAMANHOS_ADULTO, TAMANHOS_INFANTIL } from '@/constants';
import api from '@/api';

let nextRowId = Date.now();

export default function GradeTab({ form, onChange, pedidoId }) {
  const [activeGrade, setActiveGrade] = useState('adulto');

  return (
    <div className="space-y-4" data-testid="grade-tab">
      <div className="flex gap-1 bg-[#F4F1EA] rounded-md p-1" data-testid="grade-toggle">
        <button
          data-testid="grade-adulto-tab"
          onClick={() => setActiveGrade('adulto')}
          className={`flex-1 py-2 rounded text-xs font-heading font-semibold transition-all ${
            activeGrade === 'adulto' ? 'bg-[#FF5C00] text-white' : 'text-[#635F59] hover:bg-white'
          }`}
        >
          Adulto
        </button>
        <button
          data-testid="grade-infantil-tab"
          onClick={() => setActiveGrade('infantil')}
          className={`flex-1 py-2 rounded text-xs font-heading font-semibold transition-all ${
            activeGrade === 'infantil' ? 'bg-[#FF5C00] text-white' : 'text-[#635F59] hover:bg-white'
          }`}
        >
          Infantil
        </button>
      </div>

      {activeGrade === 'adulto' ? (
        <GradeTable gradeKey="grade" tamanhos={TAMANHOS_ADULTO} data={form.grade || []} onChange={onChange} />
      ) : (
        <GradeTable gradeKey="gradeInfantil" tamanhos={TAMANHOS_INFANTIL} data={form.gradeInfantil || []} onChange={onChange} />
      )}

      {/* Print Grade + Image Button */}
      <PrintGradeButton
        form={form}
        activeGrade={activeGrade}
        pedidoId={pedidoId}
      />
    </div>
  );
}

function PrintGradeButton({ form, activeGrade, pedidoId }) {
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (!form.imagem || !pedidoId) { setImageSrc(null); return; }
    let cancelled = false;
    const fetchImg = async () => {
      try {
        const res = await api.get(`/pedidos/${pedidoId}/image`, { responseType: 'blob' });
        if (!cancelled) setImageSrc(URL.createObjectURL(res.data));
      } catch {
        if (!cancelled) setImageSrc(null);
      }
    };
    fetchImg();
    return () => { cancelled = true; };
  }, [form.imagem, pedidoId]);

  const buildTableHtml = useCallback((label, tamanhos, gradeData) => {
    const totals = {};
    tamanhos.forEach((t) => {
      totals[t] = gradeData.reduce((sum, row) => sum + (parseInt(row[t]) || 0), 0);
    });
    const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

    if (gradeData.length === 0 && grandTotal === 0) return '';

    const thStyle = 'border:1px solid #333;padding:5px 8px;text-align:center;font-size:11px;background:#1A1714;color:#fff;text-transform:uppercase;font-weight:600;';
    const thLeftStyle = 'border:1px solid #333;padding:5px 8px;text-align:left;font-size:11px;background:#1A1714;color:#fff;text-transform:uppercase;font-weight:600;';

    const sizeHeaders = tamanhos.map((t) => `<th style="${thStyle}">${t}</th>`).join('');

    const rows = gradeData.map((row) => {
      const sizeCells = tamanhos.map((t) => `<td style="border:1px solid #ccc;padding:4px 6px;text-align:center;font-size:12px;">${row[t] || ''}</td>`).join('');
      return `<tr>
        <td style="border:1px solid #ccc;padding:4px 6px;font-size:12px;">${row.cor || ''}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;font-size:12px;">${row.molde || ''}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;font-size:12px;">${row.malha || ''}</td>
        ${sizeCells}
      </tr>`;
    }).join('');

    const totalCells = tamanhos.map((t) => `<td style="border:1px solid #ccc;padding:4px 6px;text-align:center;font-weight:bold;font-size:12px;background:#FFF0E5;">${totals[t] || ''}</td>`).join('');

    return `
      <h3 style="font-family:'Work Sans',sans-serif;font-size:15px;color:#1A1714;margin:20px 0 8px 0;font-weight:600;">${label}</h3>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr>
            <th style="${thLeftStyle}">Cor</th>
            <th style="${thLeftStyle}">Molde</th>
            <th style="${thLeftStyle}">Malha</th>
            ${sizeHeaders}
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td colspan="3" style="border:1px solid #ccc;padding:4px 6px;text-align:right;font-weight:bold;font-size:12px;background:#FFF0E5;color:#FF5C00;">Total: ${grandTotal}</td>
            ${totalCells}
          </tr>
        </tbody>
      </table>
    `;
  }, []);

  const handlePrint = useCallback(() => {
    const adultoData = form.grade || [];
    const infantilData = form.gradeInfantil || [];

    const adultoHtml = buildTableHtml('Tamanhos Adulto', TAMANHOS_ADULTO, adultoData);
    const infantilHtml = buildTableHtml('Tamanhos Infantil', TAMANHOS_INFANTIL, infantilData);

    const imageHtml = imageSrc
      ? `<div style="margin:20px 0;text-align:center;"><img src="${imageSrc}" style="max-width:100%;max-height:300px;border:1px solid #ccc;border-radius:8px;" /></div>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tamanhos - Pedido #${form.numero}</title>
        <style>
          body { font-family: 'IBM Plex Sans', Arial, sans-serif; padding: 20px; color: #1A1714; }
          h2 { font-family: 'Work Sans', sans-serif; color: #FF5C00; margin-bottom: 4px; }
          .info { color: #635F59; font-size: 13px; margin-bottom: 8px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h2>Pedido #${form.numero} - Tamanhos</h2>
        <div class="info">
          <strong>Cliente:</strong> ${form.cliente || '\u2014'} &nbsp;|&nbsp;
          <strong>Material:</strong> ${form.material || '\u2014'}
        </div>
        ${imageHtml}
        ${adultoHtml}
        ${infantilHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    }
  }, [form, imageSrc, buildTableHtml]);

  return (
    <button
      data-testid="print-grade-button"
      onClick={handlePrint}
      className="w-full py-2.5 bg-[#FF5C00] hover:bg-[#E65300] text-white rounded-md text-sm font-heading font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
    >
      <Printer size={18} />
      Imprimir Tamanhos com Imagem
    </button>
  );
}

function GradeTable({ gradeKey, tamanhos, data, onChange }) {
  const handleAddRow = useCallback(() => {
    nextRowId += 1;
    const newRow = { _uid: `row_${nextRowId}`, cor: '', molde: '', malha: '' };
    tamanhos.forEach((t) => { newRow[t] = 0; });
    onChange(gradeKey, [...data, newRow]);
  }, [data, gradeKey, onChange, tamanhos]);

  const handleRemoveRow = useCallback(
    (uid) => {
      onChange(gradeKey, data.filter((row) => row._uid !== uid));
    },
    [data, gradeKey, onChange]
  );

  const handleCellChange = useCallback(
    (uid, field, value) => {
      const newData = data.map((row) => (row._uid === uid ? { ...row, [field]: value } : row));
      onChange(gradeKey, newData);
    },
    [data, gradeKey, onChange]
  );

  const totals = {};
  tamanhos.forEach((t) => {
    totals[t] = data.reduce((sum, row) => sum + (parseInt(row[t]) || 0), 0);
  });
  const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);

  return (
    <div data-testid={`grade-table-${gradeKey}`}>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-[#F4F1EA]">
              <th className="text-[10px] uppercase font-heading font-semibold text-[#635F59] px-1.5 py-2 text-left border border-[#EBE8E1]">Cor</th>
              <th className="text-[10px] uppercase font-heading font-semibold text-[#635F59] px-1.5 py-2 text-left border border-[#EBE8E1]">Molde</th>
              <th className="text-[10px] uppercase font-heading font-semibold text-[#635F59] px-1.5 py-2 text-left border border-[#EBE8E1]">Malha</th>
              {tamanhos.map((t) => (
                <th key={t} className="text-[10px] uppercase font-heading font-semibold text-[#635F59] px-1 py-2 text-center border border-[#EBE8E1] w-10">{t.toUpperCase()}</th>
              ))}
              <th className="w-8 border border-[#EBE8E1]" />
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row._uid || `fallback_${index}`} className="bg-white hover:bg-[#FDFBF7]">
                <td className="border border-[#EBE8E1] p-0">
                  <input data-testid={`grade-cor-${index}`} value={row.cor || ''} onChange={(e) => handleCellChange(row._uid, 'cor', e.target.value)} className="w-full px-1.5 py-1.5 text-xs font-body text-[#1A1714] bg-transparent focus:outline-none focus:bg-[#FFF0E5]" />
                </td>
                <td className="border border-[#EBE8E1] p-0">
                  <input data-testid={`grade-molde-${index}`} value={row.molde || ''} onChange={(e) => handleCellChange(row._uid, 'molde', e.target.value)} className="w-full px-1.5 py-1.5 text-xs font-body text-[#1A1714] bg-transparent focus:outline-none focus:bg-[#FFF0E5]" />
                </td>
                <td className="border border-[#EBE8E1] p-0">
                  <input data-testid={`grade-malha-${index}`} value={row.malha || ''} onChange={(e) => handleCellChange(row._uid, 'malha', e.target.value)} className="w-full px-1.5 py-1.5 text-xs font-body text-[#1A1714] bg-transparent focus:outline-none focus:bg-[#FFF0E5]" />
                </td>
                {tamanhos.map((t) => (
                  <td key={t} className="border border-[#EBE8E1] p-0">
                    <input data-testid={`grade-${t}-${index}`} type="number" min="0" value={row[t] || ''} onChange={(e) => handleCellChange(row._uid, t, parseInt(e.target.value) || 0)} className="w-full px-1 py-1.5 text-xs font-body text-[#1A1714] text-center bg-transparent focus:outline-none focus:bg-[#FFF0E5]" />
                  </td>
                ))}
                <td className="border border-[#EBE8E1] p-0 text-center">
                  <button data-testid={`remove-grade-row-${index}`} onClick={() => handleRemoveRow(row._uid)} className="p-1 text-[#A39F97] hover:text-red-500 transition-colors">
                    <Trash size={14} />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bg-[#FFF0E5] font-semibold">
              <td colSpan={3} className="text-xs font-heading font-semibold text-[#FF5C00] px-1.5 py-2 border border-[#EBE8E1] text-right">Total: {grandTotal}</td>
              {tamanhos.map((t) => (
                <td key={t} className="text-xs font-heading font-semibold text-[#1A1714] text-center border border-[#EBE8E1] py-2">{totals[t] || ''}</td>
              ))}
              <td className="border border-[#EBE8E1]" />
            </tr>
          </tbody>
        </table>
      </div>
      <button
        data-testid={`add-grade-row-${gradeKey}`}
        onClick={handleAddRow}
        className="w-full mt-3 py-2.5 border-2 border-dashed border-[#EBE8E1] rounded-md text-sm font-heading font-semibold text-[#A39F97] hover:text-[#FF5C00] hover:border-[#FF5C00] transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} weight="bold" />
        Adicionar Linha
      </button>
    </div>
  );
}
