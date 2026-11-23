import { useRef, useState } from 'react';
import { FileWarning, ImagePlus, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type) && !/\.(jpe?g|png)$/i.test(file.name)) {
    return 'Unsupported file type. Please upload a JPG, JPEG or PNG image.';
  }
  if (file.size > MAX_BYTES) {
    return 'Image is larger than 8 MB. Please upload a smaller file.';
  }
  return null;
}

export default function ImageDropzone({
  previewUrl,
  fileName,
  onSelect,
  onRemove,
  onError,
  disabled = false,
  compact = false,
  title = 'Drop inspection image',
  hint = 'JPG, JPEG or PNG · up to 8 MB',
}: {
  previewUrl: string | null;
  fileName?: string | null;
  onSelect: (file: File) => void;
  onRemove?: () => void;
  onError?: (message: string | null) => void;
  disabled?: boolean;
  compact?: boolean;
  title?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      onError?.(error);
      return;
    }
    onError?.(null);
    onSelect(file);
  };

  if (previewUrl) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#040810]">
          <div className="dot-grid flex max-h-[360px] min-h-[180px] items-center justify-center">
            <img
              src={previewUrl}
              alt={fileName ?? 'Selected inspection image'}
              className="max-h-[360px] w-full object-contain"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-[#02060d] via-[#02060d]/80 to-transparent px-3 pb-3 pt-8">
            <span className="truncate font-mono text-[11px] text-slate-400">{fileName}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
              >
                Replace
              </Button>
              {onRemove ? (
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => {
                    onRemove();
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  disabled={disabled}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          'group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed transition-all duration-200',
          compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-16',
          dragging
            ? 'border-aqua/60 bg-aqua/[0.06]'
            : 'border-white/15 bg-white/[0.02] hover:border-brand-400/50 hover:bg-brand-500/[0.04]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <span
          className={cn(
            'relative flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/20 to-aqua-500/10 text-aqua',
            compact ? 'h-10 w-10' : 'h-14 w-14',
          )}
        >
          <UploadCloud className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
          {dragging ? (
            <span className="absolute inset-0 animate-pulse-ring rounded-2xl border border-aqua/60" />
          ) : null}
        </span>
        <span className="relative text-center">
          <span className="block text-sm font-semibold text-white">
            {dragging ? 'Release to load image' : title}
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            Drag &amp; drop, or <span className="text-brand-300 underline decoration-dotted">browse files</span>
          </span>
        </span>
        <span className="relative font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">
          {hint}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600">
        <FileWarning className="h-3 w-3" />
        Images stay in this browser. Nothing is uploaded anywhere.
        <ImagePlus className="ml-auto h-3 w-3" />
      </div>
    </div>
  );
}
