/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FaceBox {
  ymin: number; // 0-100 representing percentage of height
  xmin: number; // 0-100 representing percentage of width
  ymax: number;
  xmax: number;
}

export interface FaceQuality {
  lowLight: boolean;
  tilted: boolean;
  blurry: boolean;
  distant: boolean;
  partiallyHidden: boolean;
  details: string;
}

export interface FutureFeatures {
  gender: string;      // e.g. "Masculino", "Feminino", "Indeterminado"
  emotion: string;     // e.g. "Feliz", "Neutro", "Surpreso", "Sério"
  smile: boolean;
  glasses: boolean;
  fatigue: "Baixa" | "Média" | "Alta";
  attention: "Focado" | "Distraído";
}

export interface FaceAnalysis {
  id: number;
  estimatedAge: number;
  ageGroup: "0-5" | "6-12" | "13-17" | "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+";
  confidence: number; // 0-100
  box: FaceBox;
  quality: FaceQuality;
  futureFeatures: FutureFeatures;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  imageHash: string;
  faces: FaceAnalysis[];
  imageQualityOk: boolean;
  qualityIssues: string[];
  processingTimeMs: number;
}

export interface HistoryLog {
  id: string;
  timestamp: string;
  imageHash: string;
  facesCount: number;
  primaryAge: number;
  primaryAgeGroup: string;
  primaryConfidence: number;
  processingTimeMs: number;
}

export interface SystemMetrics {
  totalAnalyzed: number;
  averageConfidence: number;
  averageProcessingTimeMs: number;
  ageGroupCounts: Record<string, number>;
  qualityIssuesCount: {
    lowLight: number;
    tilted: number;
    blurry: number;
    distant: number;
    partiallyHidden: number;
  };
}
