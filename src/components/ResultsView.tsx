/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { FaceAnalysis, AnalysisResult } from "../types";
import {
  Users,
  Eye,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Smile,
  Glasses,
  Activity,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ResultsViewProps {
  result: AnalysisResult | null;
  selectedImage: string | null;
  error: string | null;
}

export default function ResultsView({ result, selectedImage, error }: ResultsViewProps) {
  const [selectedFaceId, setSelectedFaceId] = useState<number>(1);

  // Auto-select first face when a new result arrives
  useEffect(() => {
    if (result && result.faces.length > 0) {
      setSelectedFaceId(result.faces[0].id);
    }
  }, [result]);

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 rounded-3xl border border-rose-100 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-semibold text-rose-800 dark:text-rose-400 mb-2 font-sans">
          Falha no Reconhecimento Facial
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md font-sans leading-relaxed mb-4">
          {error.includes("GEMINI_API_KEY") 
            ? "Por favor, configure sua chave de API do Gemini nas configurações do AI Studio (Secrets > GEMINI_API_KEY)."
            : error}
        </p>
      </div>
    );
  }

  if (!result) return null;

  const { faces, imageQualityOk, qualityIssues, processingTimeMs } = result;

  // Friendly empty state
  if (faces.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 rounded-3xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 flex flex-col items-center text-center">
        <Users className="w-12 h-12 text-amber-500 mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-450 mb-2 font-sans">
          Nenhum Rosto Detectado
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md font-sans leading-relaxed">
          Nossos algoritmos não conseguiram identificar rostos legíveis nesta imagem. Certifique-se de que a iluminação está adequada e o rosto está voltado de frente para a câmera.
        </p>
        {qualityIssues.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 text-left w-full text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            <p className="font-semibold mb-1 font-mono">ALERTAS DE CAPTURA:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {qualityIssues.map((issue, idx) => (
                <li key={idx} className="font-sans">{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Get current active face data
  const activeFace = faces.find((f) => f.id === selectedFaceId) || faces[0];

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start mt-8">
      
      {/* Dynamic Image Overlay Panel (12-col layout: 5 cols on desktop) */}
      <div className="md:col-span-5 flex flex-col gap-4">
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-xl aspect-square w-full">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Analisada"
              className="w-full h-full object-cover select-none"
            />
          )}

          {/* Render overlay bounding boxes for detected faces */}
          {faces.map((face) => {
            const { box, id } = face;
            const isSelected = id === selectedFaceId;
            return (
              <button
                key={id}
                onClick={() => setSelectedFaceId(id)}
                style={{
                  top: `${box.ymin}%`,
                  left: `${box.xmin}%`,
                  width: `${box.xmax - box.xmin}%`,
                  height: `${box.ymax - box.ymin}%`,
                }}
                className={`absolute rounded-xl border-2 cursor-pointer transition-all duration-300 pointer-events-auto ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20"
                    : "border-blue-400 bg-blue-500/5 hover:border-blue-300 hover:bg-blue-500/15 z-10"
                }`}
              >
                {/* ID badge overlay */}
                <span className={`absolute -top-3.5 -left-3.5 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold font-mono shadow-md border ${
                  isSelected
                    ? "bg-emerald-500 text-white border-emerald-400"
                    : "bg-blue-600 text-white border-blue-400"
                }`}>
                  {id}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-face Selector list */}
        {faces.length > 1 && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 font-mono uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Múltiplos Rostos Encontrados ({faces.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {faces.map((face) => {
                const isSelected = face.id === selectedFaceId;
                return (
                  <button
                    key={face.id}
                    onClick={() => setSelectedFaceId(face.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-sm"
                        : "bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-250 dark:border-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    Rosto {face.id} (~{face.estimatedAge}a)
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats and IA Analysis Details Panel (12-col layout: 7 cols on desktop) */}
      <div className="md:col-span-7 flex flex-col gap-6">
        
        {/* Core Analysis Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-md">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-blue-500 uppercase flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Biometria Estimada
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
                Análise do Rosto {faces.length > 1 ? selectedFaceId : ""}
              </h3>
            </div>
            
            {/* Speed Badge */}
            <span className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-850 text-slate-500 border border-slate-100 dark:border-slate-800">
              <Clock className="w-3.5 h-3.5" />
              {(processingTimeMs / 1000).toFixed(2)}s
            </span>
          </div>

          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            
            {/* Age display with explicit label */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/15">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-sans block mb-1">Idade Estimada</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-450 font-sans tracking-tight">
                  {activeFace.estimatedAge}
                </span>
                <span className="text-xs text-blue-500 font-medium">anos</span>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-sans mt-2 italic leading-tight">
                *Estimativa aproximada por IA.
              </p>
            </div>

            {/* Confidence Display */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/15">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-sans block mb-1">Precisão Estimada</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sans tracking-tight">
                  {activeFace.confidence}
                </span>
                <span className="text-xs text-emerald-500 font-medium">%</span>
              </div>
              {/* Simple horizontal progress bar */}
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div
                  style={{ width: `${activeFace.confidence}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>

          </div>

          {/* Age range display */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-sans">Faixa Etária Identificada</span>
                <span className="text-sm font-bold text-slate-850 dark:text-slate-100 font-mono">
                  {activeFace.ageGroup} anos
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20">
              GRUPO {activeFace.ageGroup}
            </span>
          </div>

          {/* Image Quality Checks */}
          <div className="border-t border-slate-150 dark:border-slate-800 pt-5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Parâmetros de Captura & Qualidade
            </h4>

            {/* Recapture advice if quality metrics fail */}
            {(!imageQualityOk || activeFace.quality.blurry || activeFace.quality.lowLight) && (
              <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-sans leading-relaxed">
                  <strong>Conselho de IA:</strong> Qualidade de imagem sub-ótima detectada. Recomendamos capturar uma nova foto em ambiente bem iluminado, mantendo a cabeça centralizada e imóvel.
                </p>
              </div>
            )}

            {/* Checklist items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Boa Iluminação", value: !activeFace.quality.lowLight, issue: "Pouca luz" },
                { label: "Alinhamento Facial", value: !activeFace.quality.tilted, issue: "Rosto inclinado" },
                { label: "Nitidez / Foco", value: !activeFace.quality.blurry, issue: "Imagem borrada" },
                { label: "Distância Ideal", value: !activeFace.quality.distant, issue: "Longe da câmera" },
                { label: "Face Desobstruída", value: !activeFace.quality.partiallyHidden, issue: "Ocultação parcial" },
              ].map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 text-xs"
                >
                  <span className="text-slate-650 dark:text-slate-350 font-sans">{metric.label}</span>
                  <div className="flex items-center gap-1.5 font-sans font-semibold">
                    {metric.value ? (
                      <span className="text-emerald-600 dark:text-emerald-450 flex items-center gap-1 font-sans">
                        <CheckCircle className="w-3.5 h-3.5" /> OK
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-450 flex items-center gap-1 font-sans font-bold">
                        <AlertCircle className="w-3.5 h-3.5" /> {metric.issue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quality detail string */}
            {activeFace.quality.details && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-3 italic">
                Nota técnica: {activeFace.quality.details}
              </p>
            )}
          </div>
        </div>

        {/* Future Capabilities Panel / Extensibilidade Inteligente */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white border border-slate-800 shadow-lg relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                Módulos de Próxima Geração (Beta)
              </span>
              <h4 className="text-base font-bold text-slate-100 font-sans">
                Extensibilidade Biométrica
              </h4>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold bg-emerald-500/20 text-emerald-350 rounded border border-emerald-500/30">
              ATIVO
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4 relative z-10">
            Mapeamento estendido de microexpressões e descritores. Projetado para integração futura com dashboards estatísticos de controle de fadiga e atenção de operadores.
          </p>

          {/* Extended Metrics Grid */}
          <div className="grid grid-cols-2 gap-3.5 relative z-10 text-xs">
            
            {/* Gender */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Award className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-450 block">Gênero Estimado</span>
                <span className="font-semibold text-slate-200">{activeFace.futureFeatures.gender}</span>
              </div>
            </div>

            {/* Emotion */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Smile className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-450 block">Humor / Emoção</span>
                <span className="font-semibold text-slate-200">{activeFace.futureFeatures.emotion}</span>
              </div>
            </div>

            {/* Smile */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-slate-450">Sorriso Detectado</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeFace.futureFeatures.smile 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/35" 
                  : "bg-white/10 text-slate-350"
              }`}>
                {activeFace.futureFeatures.smile ? "Sim" : "Não"}
              </span>
            </div>

            {/* Glasses */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-slate-450">Uso de Óculos</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeFace.futureFeatures.glasses 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/35" 
                  : "bg-white/10 text-slate-350"
              }`}>
                {activeFace.futureFeatures.glasses ? "Sim" : "Não"}
              </span>
            </div>

            {/* Fatigue */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-450 block">Fadiga Estimada</span>
                <span className="font-semibold text-slate-200">{activeFace.futureFeatures.fatigue}</span>
              </div>
            </div>

            {/* Attention */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-450 block">Status de Atenção</span>
                <span className="font-semibold text-slate-200">{activeFace.futureFeatures.attention}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
