/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { AnalysisResult, HistoryLog, SystemMetrics } from "../types";

const HISTORY_FILE_PATH = path.join(process.cwd(), "src", "db", "history.json");

// Helper to ensure db directory exists and file exists
function ensureFileExists() {
  const dir = path.dirname(HISTORY_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE_PATH)) {
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

export class HistoryStore {
  static getHistory(): AnalysisResult[] {
    try {
      ensureFileExists();
      const content = fs.readFileSync(HISTORY_FILE_PATH, "utf-8");
      return JSON.parse(content) as AnalysisResult[];
    } catch (error) {
      console.error("Erro ao ler histórico:", error);
      return [];
    }
  }

  static saveHistory(item: AnalysisResult): void {
    try {
      ensureFileExists();
      const history = this.getHistory();
      // Keep only the last 100 entries to prevent memory / storage issues
      history.unshift(item);
      if (history.length > 100) {
        history.pop();
      }
      fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(history, null, 2), "utf-8");
    } catch (error) {
      console.error("Erro ao salvar histórico:", error);
    }
  }

  static clearHistory(): void {
    try {
      ensureFileExists();
      fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
    }
  }

  static getMetrics(): SystemMetrics {
    const history = this.getHistory();
    const totalAnalyzed = history.length;

    let totalConfidence = 0;
    let totalTime = 0;
    let analyzedFacesCount = 0;

    const ageGroupCounts: Record<string, number> = {
      "0-5": 0,
      "6-12": 0,
      "13-17": 0,
      "18-24": 0,
      "25-34": 0,
      "35-44": 0,
      "45-54": 0,
      "55-64": 0,
      "65+": 0,
    };

    const qualityIssuesCount = {
      lowLight: 0,
      tilted: 0,
      blurry: 0,
      distant: 0,
      partiallyHidden: 0,
    };

    history.forEach((run) => {
      totalTime += run.processingTimeMs;
      run.faces.forEach((face) => {
        analyzedFacesCount++;
        totalConfidence += face.confidence;
        if (ageGroupCounts[face.ageGroup] !== undefined) {
          ageGroupCounts[face.ageGroup]++;
        } else {
          ageGroupCounts[face.ageGroup] = 1;
        }

        if (face.quality.lowLight) qualityIssuesCount.lowLight++;
        if (face.quality.tilted) qualityIssuesCount.tilted++;
        if (face.quality.blurry) qualityIssuesCount.blurry++;
        if (face.quality.distant) qualityIssuesCount.distant++;
        if (face.quality.partiallyHidden) qualityIssuesCount.partiallyHidden++;
      });
    });

    const averageConfidence = analyzedFacesCount > 0 ? Math.round(totalConfidence / analyzedFacesCount) : 0;
    const averageProcessingTimeMs = totalAnalyzed > 0 ? Math.round(totalTime / totalAnalyzed) : 0;

    return {
      totalAnalyzed,
      averageConfidence,
      averageProcessingTimeMs,
      ageGroupCounts,
      qualityIssuesCount,
    };
  }
}
