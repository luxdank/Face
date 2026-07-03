/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import CameraView from "./components/CameraView";
import FileUpload from "./components/FileUpload";
import ResultsView from "./components/ResultsView";
import MetricsDashboard from "./components/MetricsDashboard";
import HistoryList from "./components/HistoryList";
import { AnalysisResult, SystemMetrics } from "./types";
import {
  Camera,
  Upload,
  Sparkles,
  Sun,
  Moon,
  TrendingUp,
  History,
  ShieldCheck,
  Cpu,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function MainDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Stats / Database Sync State
  const [historyList, setHistoryList] = useState<AnalysisResult[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);

  // Load database state on mount
  useEffect(() => {
    fetchHistoryAndMetrics();
  }, []);

  const fetchHistoryAndMetrics = async () => {
    try {
      const historyRes = await fetch("/api/history");
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistoryList(historyData);
      }

      const metricsRes = await fetch("/api/metrics");
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setSystemMetrics(metricsData);
      }
    } catch (err) {
      console.error("Erro ao sincronizar dados do servidor:", err);
    }
  };

  const handleCaptureOrUpload = async (base64Image: string) => {
    setCapturedImage(base64Image);
    setApiError(null);
    setAnalysisResult(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao processar imagem biométrica.");
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);

      // Re-fetch database history and statistics dynamically
      await fetchHistoryAndMetrics();
    } catch (err: any) {
      console.error("Erro na requisição de análise:", err);
      setApiError(err.message || "Erro desconhecido ao contatar o servidor de IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setApiError(null);
  };

  const handleClearHistory = async () => {
    try {
      const response = await fetch("/api/history", {
        method: "DELETE",
      });
      if (response.ok) {
        setHistoryList([]);
        setSystemMetrics(null);
      }
    } catch (err) {
      console.error("Erro ao esvaziar banco de dados local:", err);
    }
  };

  const handleSelectHistoryItem = (item: AnalysisResult) => {
    // Load historical record back on display screen (retrieve mock or full trace)
    // Note: since we never store original high-res image files to preserve disk space and client privacy,
    // we display a beautiful placeholder or reconstruct the data cards elegantly.
    setAnalysisResult(item);
    setCapturedImage(null); // Clear active live canvas
    setApiError(null);

    // Scroll smoothly to results view
    const el = document.getElementById("results-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Upper Glassmorphic Apple-style Header */}
      <header className="sticky top-0 z-30 w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-150 dark:border-slate-900 px-4 md:px-8 py-3.5 flex justify-between items-center max-w-7xl mx-auto rounded-b-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight font-sans text-slate-800 dark:text-white leading-none">
              FaceAge AI
            </h1>
            <span className="text-[10px] font-mono font-medium text-slate-450 dark:text-slate-500 tracking-wider uppercase">
              Motor Biométrico v1.2
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Security Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacidade Criptografada
          </span>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-350 active:scale-95 shadow-sm"
            title="Alternar Tema"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Hero Intro Section */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-12">
        
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase border border-blue-500/15 mb-1 animate-pulse">
            <Sparkles className="w-3 h-3" /> Reconhecimento Facial Inteligente
          </div>
          <h2 className="text-3xl md:text-4.5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans leading-[1.1] max-w-xl">
            Estimativa de Idade por Visão Computacional
          </h2>
          <p className="text-sm md:text-base text-slate-550 dark:text-slate-400 leading-relaxed font-sans max-w-md">
            Capture sua imagem pela câmera ou faça upload de fotos para obter um mapeamento estendido da sua faixa etária, precisão e descritores biométricos em tempo real.
          </p>
        </div>

        {/* Input Terminal Tabs: Camera vs Upload */}
        <div className="w-full max-w-2xl mx-auto">
          
          {/* Tab buttons */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 mb-6 shadow-inner">
            <button
              onClick={() => {
                setActiveTab("camera");
                handleClear();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold font-sans transition-all ${
                activeTab === "camera"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Camera className="w-4 h-4" />
              Webcam em Tempo Real
            </button>
            <button
              onClick={() => {
                setActiveTab("upload");
                handleClear();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold font-sans transition-all ${
                activeTab === "upload"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload de Arquivo
            </button>
          </div>

          {/* Dynamic Tab panels */}
          <AnimatePresence mode="wait">
            {activeTab === "camera" ? (
              <motion.div
                key="camera-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <CameraView
                  onCapture={handleCaptureOrUpload}
                  isAnalyzing={isAnalyzing}
                  onClearResult={handleClear}
                />
              </motion.div>
            ) : (
              <motion.div
                key="upload-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <FileUpload
                  onImageSelected={handleCaptureOrUpload}
                  isAnalyzing={isAnalyzing}
                  onClearResult={handleClear}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Live / Persisted Analysis Results Section */}
        <div id="results-section" className="scroll-mt-24">
          <ResultsView
            result={analysisResult}
            selectedImage={capturedImage}
            error={apiError}
          />
        </div>

        {/* Divider */}
        <hr className="border-slate-200 dark:border-slate-850 max-w-4xl mx-auto w-full" />

        {/* Advanced Statistics Section */}
        <section className="max-w-4xl mx-auto w-full flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-sans tracking-tight">
              Estatísticas Gerais de Operação
            </h3>
          </div>
          <MetricsDashboard metrics={systemMetrics} />
        </section>

        {/* Divider */}
        <hr className="border-slate-200 dark:border-slate-850 max-w-4xl mx-auto w-full" />

        {/* History Section */}
        <section className="max-w-4xl mx-auto w-full">
          <HistoryList
            history={historyList}
            onClearHistory={handleClearHistory}
            onSelectHistoryItem={handleSelectHistoryItem}
          />
        </section>

        {/* Ethics & AI Compliance Note */}
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-850 text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-sans flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <strong>Nota de Isenção Ética:</strong> Este sistema foi projetado estritamente como um demonstrativo tecnológico de Inteligência Artificial e Biometria Facial. A idade informada é uma <strong>estimativa aproximada</strong> baseada no mapeamento de relevo e texturas e nunca deve ser considerada um dado oficial ou categórico de identificação pessoal. Para garantir total privacidade, as imagens capturadas são processadas em ambiente de execução volátil e suas informações de bitmap originais <strong>nunca são armazenadas em banco de dados</strong>, mantendo apenas a assinatura de segurança (Hash SHA-256) dos logs estatísticos locais.
          </div>
        </div>

      </main>

      {/* Modern minimal footer */}
      <footer className="max-w-5xl mx-auto border-t border-slate-200 dark:border-slate-850 py-8 text-center text-xs text-slate-400 font-mono mt-12 px-4">
        © 2026 FaceAge AI Corp. • Desenvolvido com padrões ISO 27001 e conformidade LGPD / GDPR.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainDashboard />
    </ThemeProvider>
  );
}
