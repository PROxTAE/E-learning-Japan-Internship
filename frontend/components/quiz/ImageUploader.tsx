"use client";

import { useRef, useState, useCallback } from "react";
import { ImagePlus, X, RefreshCw, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { BuilderT } from "@/lib/i18n/quizBuilderTranslations";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

interface ImageUploaderProps {
  t: BuilderT["builder"];
  imageUrl?: string;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
  /** compact = small inline button (used in choices); default = full drop zone */
  compact?: boolean;
  id?: string;
}

export function ImageUploader({
  t,
  imageUrl,
  onUpload,
  onRemove,
  compact = false,
  id,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(t.imageTypeError);
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(t.imageSizeError);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) onUpload(result);
      };
      reader.readAsDataURL(file);
    },
    [onUpload, t]
  );

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) processFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Compact mode — thumbnail + small buttons (for choices) ──────
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {imageUrl ? (
          <div className="flex items-center gap-1.5">
            {/* Thumbnail */}
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="w-8 h-8 rounded-md overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0 hover:opacity-80 transition-opacity"
              title="Preview image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="choice" className="w-full h-full object-cover" />
            </button>
            {/* Change */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-6 h-6 flex items-center justify-center rounded-md text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
              title={t.changeImage}
            >
              <RefreshCw size={11} />
            </button>
            {/* Remove */}
            <button
              type="button"
              onClick={onRemove}
              className="w-6 h-6 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title={t.removeImage}
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 hover:border-violet-400 hover:text-violet-500 dark:hover:text-violet-400 transition-all"
            title={t.addImage}
          >
            <ImagePlus size={11} />
            {t.addImage}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          id={id ? `${id}-input` : undefined}
        />
        <Lightbox open={lightbox} src={imageUrl} onClose={() => setLightbox(false)} />
      </div>
    );
  }

  // ── Full drop-zone mode (used on questions) ─────────────────────
  return (
    <div className="space-y-2">
      {/* Existing image preview */}
      <AnimatePresence>
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Question image"
              className="w-full max-h-56 object-cover"
            />
            {/* Overlay controls */}
            <div className="
              absolute inset-0 bg-black/0 group-hover:bg-black/40
              flex items-center justify-center gap-2
              opacity-0 group-hover:opacity-100
              transition-all duration-200
            ">
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="w-9 h-9 rounded-xl bg-white/90 text-slate-700 flex items-center justify-center hover:bg-white transition-colors shadow-md"
                title="Enlarge"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-9 h-9 rounded-xl bg-white/90 text-violet-600 flex items-center justify-center hover:bg-white transition-colors shadow-md"
                title={t.changeImage}
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="w-9 h-9 rounded-xl bg-white/90 text-red-500 flex items-center justify-center hover:bg-white transition-colors shadow-md"
                title={t.removeImage}
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone (hidden when image present) */}
      {!imageUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          id={id}
          className={`
            relative flex flex-col items-center justify-center gap-2 py-6
            rounded-xl border-2 border-dashed cursor-pointer
            transition-all duration-200 text-center
            ${isDragOver
              ? "border-violet-500 bg-violet-50/70 dark:bg-violet-900/20 scale-[1.01]"
              : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50/40 dark:hover:bg-violet-900/10"
            }
          `}
        >
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${isDragOver
              ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
              : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
            }
          `}>
            <ImagePlus size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.imageDrop}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {t.imageHint}
            </p>
          </div>
          {isDragOver && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-violet-500 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1"
          >
            <span className="w-3 h-3 rounded-full bg-red-100 dark:bg-red-900/30 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        id={id ? `${id}-input` : undefined}
      />

      <Lightbox open={lightbox} src={imageUrl} onClose={() => setLightbox(false)} />
    </div>
  );
}

// ── Lightbox modal ─────────────────────────────────────────────────
function Lightbox({
  open,
  src,
  onClose,
}: {
  open: boolean;
  src?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full cursor-default"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Full size preview"
              className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]"
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-lg hover:bg-slate-100 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
