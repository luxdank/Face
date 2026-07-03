/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AnalysisResult } from "../types";
import { History, Calendar, Trash2, Search, Sparkles, Hash, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HistoryListProps {
  history: AnalysisResult[];
  onClearHistory: () => void;
  onSelectHistoryItem?: (item: AnalysisResult) => void;
}

export default function HistoryList({ history, onClearHistory, onSelectHistoryItem }: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = history.filter((item) => {
    // Filter by date, age, or hash
    const dateStr = new Date(item.timestamp).toLocaleDateString("pt-BR");
    const ageStr = item.faces.map((f) => f.estimatedAge.toString()).join(" ");
    const hashStr = item.imageHash.toLowerCase();
    
    return (
      dateStr.includes(searchTerm) ||
      ageStr.includes(searchTerm) ||
      hashStr.includes(searchTerm.toLowerCase())
    );
  });

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div id="history-container" className="w-full flex flex-col gap-4">
      
      {/* Header and Clear button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-sans tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-slate-550" /> Histórico de Execuções Recentes
        </h3>
        
        {history.length > 0 && (
          <button
            id="btn-clear-history"
            onClick={onClearHistory}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-500 font-semibold font-sans py-2 px-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5 hover:bg-rose-50 dark:hover:bg-rose-950/15 transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar Registros
          </button>
        )}
      </div>

      {/* Search Bar */}
      {history.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por idade, data (DD/MM/AAAA) ou hash de segurança..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-sans text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 text-center flex flex-col items-center"
          >
            <History className="w-10 h-10 text-slate-350 dark:text-slate-650 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-sans mb-1">
              Nenhum registro encontrado no histórico.
            </p>
            <p className="text-xs text-slate-400 font-sans">
              As análises faciais bem-sucedidas aparecerão listadas aqui para auditoria local.
            </p>
          </motion.div>
        ) : filteredHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 text-center text-slate-500 text-xs font-sans"
          >
            Nenhum resultado corresponde à sua busca "{searchTerm}".
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {filteredHistory.map((item) => {
              // Primary face (first face or selected)
              const primaryFace = item.faces[0];
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectHistoryItem?.(item)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden"
                >
                  {/* Visual overlay indication */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors" />

                  {/* Header Row */}
                  <div className="flex justify-between items-start pl-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(item.timestamp)}
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-slate-50 dark:bg-slate-850 text-slate-500 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                      ~{(item.processingTimeMs / 1000).toFixed(2)}s
                    </span>
                  </div>

                  {/* Analysis content */}
                  <div className="flex justify-between items-end pl-1.5">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-sans text-slate-500 dark:text-slate-400">Idade Estimada:</span>
                        <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-sans">
                          {primaryFace.estimatedAge}a
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-450 dark:text-slate-500 font-sans mt-0.5">
                        Precisão: {primaryFace.confidence}% • Faixa: {primaryFace.ageGroup}
                      </div>
                    </div>

                    {item.faces.length > 1 && (
                      <span className="text-[10px] font-mono font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/25">
                        +{item.faces.length - 1} rostos
                      </span>
                    )}
                  </div>

                  {/* SHA-256 Hash protection footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-850 pl-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      {item.imageHash.substring(0, 16)}...
                    </span>
                    <span className="flex items-center gap-0.5 text-blue-500 font-sans font-bold group-hover:underline">
                      Carregar <Eye className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
