import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage the pedido edit form with auto-save.
 */
export function usePedidoForm(pedido, onUpdate) {
  const [form, setForm] = useState({ ...pedido });
  const [saving, setSaving] = useState(false);
  const autoSaveRef = useRef(null);
  const formRef = useRef(form);

  useEffect(() => {
    setForm({ ...pedido });
  }, [pedido]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const doSave = useCallback(async () => {
    setSaving(true);
    const { id, numero, createdAt, ...data } = formRef.current;
    await onUpdate(pedido.id, data);
    setSaving(false);
  }, [pedido.id, onUpdate]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(doSave, 2000);
  }, [doSave]);

  useEffect(() => {
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  const handleSave = useCallback(async () => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    await doSave();
  }, [doSave]);

  return { form, saving, handleChange, handleSave };
}
