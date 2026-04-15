// Kanban column definitions
export const COLUMNS = [
  { id: 'Orçamento', label: 'Orcamento', color: '#8B8884' },
  { id: 'Aguardando', label: 'Aguardando', color: '#F5A623' },
  { id: 'Aprovado', label: 'Aprovado', color: '#7ED321' },
  { id: 'Malha', label: 'Malha', color: '#4A90E2' },
  { id: 'Corte', label: 'Corte', color: '#9013FE' },
  { id: 'Silk', label: 'Silk', color: '#FF5C00' },
  { id: 'Costura', label: 'Costura', color: '#D0021B' },
  { id: 'Conferência', label: 'Conferencia', color: '#F8E71C' },
  { id: 'Expedição', label: 'Expedicao', color: '#50E3C2' },
  { id: 'Finalizado', label: 'Finalizado', color: '#417505' },
  { id: 'Erros', label: 'Erros', color: '#E3000F' },
  { id: 'Arquivado', label: 'Arquivado', color: '#4A4A4A' },
];

export const PRIORIDADES = [
  { value: 'alta', label: 'Alta', color: '#D0021B' },
  { value: 'media', label: 'Media', color: '#F5A623' },
  { value: 'baixa', label: 'Baixa', color: '#7ED321' },
];

export const TAMANHOS_ADULTO = ['pp', 'p', 'm', 'g', 'gg', 'xg', 'xxg', 'xxxg'];
export const TAMANHOS_INFANTIL = ['t1', 't2', 't4', 't6', 't8', 't10', 't12', 't14', 't16'];

export const CHECKLIST_ITEMS = [
  { key: 'layout', label: 'Layout' },
  { key: 'grade', label: 'Grade' },
  { key: 'fotolito', label: 'Fotolito' },
  { key: 'nota', label: 'Nota' },
  { key: 'entregue', label: 'Entregue' },
];

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
};
