/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { Upload, FileImage, AlertTriangle, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FileUploadProps {
  onImageSelected: (base64Image: string) => void;
  isAnalyzing: boolean;
  onClearResult: () => void;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE_MB = 10;

export default function FileUpload({ onImageSelected, isAnalyzing, onClearResult }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage("Formato não suportado. Use apenas JPG, JPEG, PNG ou WEBP.");
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
        setSelectedFileName(file.name);
        onImageSelected(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Erro ao ler o arquivo de imagem.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setSelectedFileName(null);
    setErrorMessage(null);
    onClearResult();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div id="fileupload-section" className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/png,image/jpeg,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!previewUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`relative w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all cursor-pointer ${
              isDragActive
                ? "border-blue-500 bg-blue-50/10 dark:bg-blue-950/10 scale-[0.99]"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/40 dark:bg-slate-900/30"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
          >
            <div className="p-4 rounded-full bg-white dark:bg-slate-850 shadow-md text-slate-500 dark:text-slate-400 mb-4 border border-slate-100 dark:border-slate-800 transition-transform hover:scale-105">
              <Upload className="w-8 h-8 animate-pulse text-blue-500" />
            </div>
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 font-sans mb-1 tracking-tight">
              Arraste e solte sua foto aqui
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs font-sans mb-4">
              Ou clique para procurar nas pastas locais. Suporta JPG, PNG ou WEBP de até {MAX_FILE_SIZE_MB}MB.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-850 flex items-center justify-center group shadow-xl"
          >
            {/* Selected Image Preview */}
            <img
              src={previewUrl}
              alt="Análise Facial"
              className="w-full h-full object-cover"
            />

            {/* Dark glass backdrop layout for controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-100 flex flex-col justify-between p-4 md:p-6">
              
              {/* Top Details */}
              <div className="flex justify-between items-center z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10 max-w-xs truncate">
                  <FileImage className="w-3.5 h-3.5 shrink-0" />
                  {selectedFileName}
                </span>

                <button
                  id="btn-remove-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-2.5 rounded-full bg-rose-650/80 hover:bg-rose-600 text-white backdrop-blur-md transition-all border border-rose-500/20 shadow-md active:scale-95"
                  title="Remover Imagem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Instructions */}
              <div className="flex flex-col items-center justify-center gap-3 text-center z-10">
                <p className="text-xs text-slate-350 dark:text-slate-300 font-sans max-w-sm drop-shadow-md">
                  Para analisar esta foto, clique no botão de inteligência facial abaixo.
                </p>
              </div>
            </div>

            {/* Scanning line indicator if analyzing */}
            {isAnalyzing && (
              <div className="absolute inset-0 z-20 pointer-events-none bg-blue-500/5">
                <motion.div
                  initial={{ y: "0%" }}
                  animate={{ y: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                  className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_#3b82f6] opacity-90"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_center,rgba(59,130,246,0.1),transparent)]" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 text-sm w-full shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-sans font-medium">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
