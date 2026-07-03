/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemMetrics } from "../types";
import { TrendingUp, Clock, AlertTriangle, Users, Award, ShieldAlert } from "lucide-react";

interface MetricsDashboardProps {
  metrics: SystemMetrics | null;
}

export default function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  if (!metrics || metrics.totalAnalyzed === 0) {
    return (
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
          Nenhuma métrica agregada disponível ainda. Realize a primeira análise facial para ativar os relatórios em tempo real.
        </p>
      </div>
    );
  }

  // Find most common age group
  const maxGroupEntry = Object.entries(metrics.ageGroupCounts).reduce(
    (max, current) => (current[1] > max[1] ? current : max),
    ["Nenhum", 0]
  );

  const maxAgeGroup = maxGroupEntry[1] > 0 ? maxGroupEntry[0] : "N/A";

  // Calculate highest quality issue
  const highestIssueEntry = Object.entries(metrics.qualityIssuesCount).reduce(
    (max, current) => (current[1] > max[1] ? current : max),
    ["Nenhum", 0]
  );
  
  const issueTranslation: Record<string, string> = {
    lowLight: "Iluminação baixa",
    tilted: "Rosto inclinado",
    blurry: "Imagem desfocada",
    distant: "Muito distante",
    partiallyHidden: "Rosto ocultado",
    Nenhum: "Nenhum",
  };

  const mainQualityIssue = highestIssueEntry[1] > 0 ? issueTranslation[highestIssueEntry[0]] : "Nenhum";

  return (
    <div id="metrics-dashboard" className="w-full flex flex-col gap-6">
      
      {/* Cards Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Analyzed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block mb-1">Total Analisado</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              {metrics.totalAnalyzed}
            </span>
            <span className="text-xs text-slate-400 font-medium">rostos</span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans mt-2 flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-500" /> Registro local auditado
          </p>
        </div>

        {/* Avg Confidence */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block mb-1">Confiança Média</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              {metrics.averageConfidence}
            </span>
            <span className="text-xs text-emerald-500 font-bold">%</span>
          </div>
          <p className="text-[10px] text-slate-450 font-sans mt-2 flex items-center gap-1">
            <Award className="w-3 h-3 text-emerald-500" /> Precisão biométrica
          </p>
        </div>

        {/* Avg Processing Time */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block mb-1">Latência Média</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              {metrics.averageProcessingTimeMs}
            </span>
            <span className="text-xs text-slate-400 font-medium">ms</span>
          </div>
          <p className="text-[10px] text-slate-450 font-sans mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-500" /> Processamento em nuvem
          </p>
        </div>

        {/* Top Demographics */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block mb-1">Grupo Principal</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              {maxAgeGroup}
            </span>
            <span className="text-xs text-slate-450 font-medium">anos</span>
          </div>
          <p className="text-[10px] text-slate-450 font-sans mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-500" /> Pico demográfico
          </p>
        </div>

      </div>

      {/* Charts Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Age Group Distribution Chart (Custom CSS SVGs) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase mb-5">
            Distribuição Demográfica de Faixas Etárias
          </h4>

          <div className="space-y-3">
            {Object.entries(metrics.ageGroupCounts).map(([group, count]) => {
              const percentage = metrics.totalAnalyzed > 0 ? (count / metrics.totalAnalyzed) * 100 : 0;
              return (
                <div key={group} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-mono font-semibold text-slate-600 dark:text-slate-450 text-right">{group}</span>
                  <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    />
                  </div>
                  <span className="w-10 font-mono text-slate-500 text-right">
                    {count} ({Math.round(percentage)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Capture Quality Issue Analytics */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase mb-5 flex items-center gap-1 text-rose-500">
              <ShieldAlert className="w-3.5 h-3.5" /> Métricas de Desvio de Captura (Alertas)
            </h4>

            <div className="space-y-3.5">
              {[
                { key: "lowLight", label: "Iluminação insuficiente" },
                { key: "tilted", label: "Rosto com inclinação crítica" },
                { key: "blurry", label: "Desfoque / Ausência de foco" },
                { key: "distant", label: "Objeto excessivamente distante" },
                { key: "partiallyHidden", label: "Oclusão parcial da face" },
              ].map((item) => {
                const count = (metrics.qualityIssuesCount as any)[item.key] || 0;
                const percentage = metrics.totalAnalyzed > 0 ? (count / metrics.totalAnalyzed) * 100 : 0;
                return (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-650 dark:text-slate-350 font-sans">{item.label}</span>
                    <div className="flex items-center gap-3 flex-1 max-w-xs justify-end">
                      <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        />
                      </div>
                      <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-sans">
            <strong>Indicador Crítico:</strong> O principal desvio de qualidade observado é <strong>{mainQualityIssue}</strong>. Considere calibrar as lentes e a intensidade de luz do terminal para aprimorar as estimativas.
          </div>
        </div>

      </div>

    </div>
  );
}
