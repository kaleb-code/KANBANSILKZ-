import { useState, useRef, useEffect, useCallback } from 'react';
import { UploadSimple, Trash, Image as ImageIcon } from '@phosphor-icons/react';
import { pedidosApi } from '@/api';
import api from '@/api';

export default function ImagemTab({ pedidoId, imagem, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!imagem) { setImageSrc(null); return; }
    let cancelled = false;
    const fetchImage = async () => {
      try {
        const res = await api.get(`/pedidos/${pedidoId}/image`, { responseType: 'blob' });
        if (!cancelled) setImageSrc(URL.createObjectURL(res.data));
      } catch {
        if (!cancelled) setImageSrc(null);
      }
    };
    fetchImage();
    return () => { cancelled = true; };
  }, [imagem, pedidoId]);

  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      const res = await pedidosApi.uploadImage(pedidoId, file);
      onChange('imagem', res.data.filename);
      setPreview(null);
    } catch {
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [pedidoId, onChange]);

  const handleDelete = useCallback(async () => {
    try {
      await pedidosApi.deleteImage(pedidoId);
      onChange('imagem', null);
      setPreview(null);
    } catch {
      // deletion failed silently
    }
  }, [pedidoId, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleUpload(file);
  }, [handleUpload]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        handleUpload(item.getAsFile());
        break;
      }
    }
  }, [handleUpload]);

  const displayImage = preview || imageSrc;

  return (
    <div className="space-y-4" data-testid="imagem-tab" onPaste={handlePaste}>
      {displayImage ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-[#EBE8E1] bg-white">
            <img src={displayImage} alt="Referencia do pedido" className="w-full h-auto max-h-[400px] object-contain" data-testid="pedido-image-preview" />
            {uploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white font-heading font-semibold text-sm">Enviando...</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button data-testid="change-image-button" onClick={() => fileInputRef.current?.click()} className="flex-1 py-2.5 bg-[#F4F1EA] hover:bg-[#EBE8E1] text-[#1A1714] rounded-md text-sm font-heading font-semibold transition-colors flex items-center justify-center gap-2">
              <UploadSimple size={16} />
              Trocar
            </button>
            <button data-testid="delete-image-button" onClick={handleDelete} className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm font-heading font-semibold transition-colors flex items-center justify-center gap-2">
              <Trash size={16} />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div
          data-testid="image-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-[#EBE8E1] rounded-lg p-10 text-center cursor-pointer hover:border-[#FF5C00] hover:bg-[#FFF0E5] transition-all"
        >
          <ImageIcon size={48} className="mx-auto text-[#A39F97] mb-3" />
          <p className="text-sm font-heading font-semibold text-[#635F59]">Clique ou arraste uma imagem</p>
          <p className="text-xs font-body text-[#A39F97] mt-1">JPG, PNG ou WebP (max 5MB)</p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}
