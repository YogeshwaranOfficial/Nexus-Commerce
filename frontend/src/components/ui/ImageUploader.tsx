import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  publicId?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

interface ImageUploaderProps {
  onUpload: (files: UploadedFile[]) => void;
  uploadFn?: (file: File) => Promise<{ url: string; publicId: string }>;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
  existingImages?: { url: string; publicId: string }[];
  onRemoveExisting?: (publicId: string) => void;
}

export function ImageUploader({
  onUpload,
  uploadFn,
  maxFiles = 10,
  maxSizeMB = 5,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  className,
  existingImages = [],
  onRemoveExisting,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (newFiles: File[]) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const totalSlots = maxFiles - existingImages.length - files.length;
    const toProcess = newFiles.slice(0, Math.max(0, totalSlots));

    const uploaded: UploadedFile[] = toProcess.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      status: file.size > maxSizeBytes ? 'error' : 'pending',
      progress: 0,
      error: file.size > maxSizeBytes ? `File too large (max ${maxSizeMB}MB)` : undefined,
    }));

    setFiles((prev) => [...prev, ...uploaded]);

    if (uploadFn) {
      for (const item of uploaded) {
        if (item.status === 'error') continue;
        setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'uploading', progress: 20 } : f));
        try {
          const result = await uploadFn(item.file);
          setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'done', progress: 100, url: result.url, publicId: result.publicId } : f));
        } catch (err: any) {
          setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'error', error: err.message || 'Upload failed' } : f));
        }
      }
    }

    const allDone = uploaded.map((f) => ({ ...f, status: uploadFn ? f.status : 'done' as const }));
    onUpload(allDone);
  }, [maxFiles, maxSizeMB, existingImages.length, files.length, uploadFn, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (dropped.length) processFiles(dropped);
  }, [processFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) processFiles(selected);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const totalImages = existingImages.length + files.length;
  const canAdd = totalImages < maxFiles;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
            dragging
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 scale-[1.01]'
              : 'border-surface-border dark:border-surface-border-dark hover:border-brand-300 dark:hover:border-brand-700 hover:bg-surface-card dark:hover:bg-surface-card-dark',
          )}
        >
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors', dragging ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-500' : 'bg-surface-card dark:bg-surface-card-dark text-ink-muted dark:text-ink-muted-dark')}>
            <Upload size={22} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink dark:text-ink-dark">
              {dragging ? 'Drop images here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
              JPEG, PNG, WebP — max {maxSizeMB}MB each · {totalImages}/{maxFiles} uploaded
            </p>
          </div>
          <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={handleFileInput} />
        </div>
      )}

      {/* Preview grid */}
      {(existingImages.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {/* Existing images */}
          {existingImages.map((img, i) => (
            <div key={img.publicId} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 badge bg-brand-500 text-white text-2xs">Cover</span>
              )}
              {onRemoveExisting && (
                <button
                  onClick={() => onRemoveExisting(img.publicId)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}

          {/* New files */}
          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-xl overflow-hidden group bg-surface-card dark:bg-surface-card-dark"
              >
                <img src={file.preview} alt="" className="w-full h-full object-cover" />

                {/* Status overlay */}
                {file.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                )}
                {file.status === 'done' && (
                  <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle size={12} className="text-white fill-white" />
                  </div>
                )}
                {file.status === 'error' && (
                  <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center p-1">
                    <AlertCircle size={16} className="text-red-300" />
                    <p className="text-2xs text-red-200 text-center mt-0.5 leading-tight">{file.error}</p>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X size={11} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
