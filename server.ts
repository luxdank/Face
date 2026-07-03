/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { HistoryStore } from "./src/db/historyStore";
import { AnalysisResult } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limit for base64 image uploads
app.use(express.json({ limit: "20mb" }));

// Lazy initializer for GoogleGenAI SDK to prevent startup crashes when API key is missing
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave de API GEMINI_API_KEY não foi encontrada. Configure-a no painel Configurações > Secrets do AI Studio.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Compute SHA-256 hash of base64 image to protect privacy
function computeImageHash(base64Data: string): string {
  return crypto.createHash("sha256").update(base64Data).digest("hex");
}

// RESTful API Endpoints

// GET /api/health - Health verification endpoint
app.get("/api/health", (req, res) => {
  const apiKeyPresent = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    api_key_configured: apiKeyPresent,
    version: "1.0.0",
  });
});

// GET /api/metrics - Get application metrics
app.get("/api/metrics", (req, res) => {
  try {
    const metrics = HistoryStore.getMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao calcular métricas: " + error.message });
  }
});

// GET /api/history - Retrieve historical estimates
app.get("/api/history", (req, res) => {
  try {
    const history = HistoryStore.getHistory();
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar histórico: " + error.message });
  }
});

// DELETE /api/history - Clear historical data
app.delete("/api/history", (req, res) => {
  try {
    HistoryStore.clearHistory();
    res.json({ message: "Histórico limpo com sucesso!" });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao limpar histórico: " + error.message });
  }
});

// POST /api/analyze - Intelligent age and facial characteristics analysis
app.post("/api/analyze", async (req, res) => {
  const startTime = Date.now();
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Nenhuma imagem fornecida no corpo da requisição." });
    }

    // Parse base64 parts
    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    // Validate size (limit to 15MB base64)
    if (base64Data.length * 0.75 > 15 * 1024 * 1024) {
      return res.status(400).json({ error: "O tamanho do arquivo excede o limite permitido de 15MB." });
    }

    // Compute cryptographic SHA-256 fingerprint of image (never store image itself for privacy)
    const imageHash = computeImageHash(base64Data);

    // Initialize Gemini SDK
    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const promptString = `Análise facial para estimativa de idade.
Analise a imagem fornecida, detecte todos os rostos presentes e estime suas idades e atributos detalhados.
Siga as seguintes diretrizes estritas:
1. Identifique todos os rostos detectáveis na imagem. Forneça uma moldura (bounding box) com as coordenadas normalizadas de 0 a 100 representativas da porcentagem da imagem (ymin, xmin, ymax, xmax).
2. Estime a idade e a faixa etária correspondente de forma ética, ressaltando se tratar de uma estimativa baseada em Inteligência Artificial.
3. Verifique a qualidade de cada rosto (iluminação baixa, inclinação/rotação excessiva, desfoque/blur, distância excessiva, oclusão parcial). Forneça detalhes de qualidade no campo correspondente em português.
4. Forneça estimativas de gênero (Masculino, Feminino, Indeterminado), emoção predominante (Feliz, Neutro, Surpreso, Triste, Bravo, Sério), sorriso (smile), presença de óculos (glasses), fadiga estimada (Baixa, Média, Alta) e foco de atenção (Focado, Distraído).
Retorne estritamente no esquema JSON solicitado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, promptString],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faces: {
              type: Type.ARRAY,
              description: "Lista de rostos detectados na imagem. Retorne array vazio caso nenhum rosto seja encontrado.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER, description: "Índice sequencial do rosto iniciando em 1" },
                  estimatedAge: { type: Type.INTEGER, description: "Idade estimada para o rosto detectado" },
                  ageGroup: {
                    type: Type.STRING,
                    description: "Faixa etária correspondente",
                    enum: ["0-5", "6-12", "13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
                  },
                  confidence: { type: Type.INTEGER, description: "Nível de confiança da estimativa de 0 a 100" },
                  box: {
                    type: Type.OBJECT,
                    description: "Coordenadas normalizadas da moldura facial em percentual de 0 a 100.",
                    properties: {
                      ymin: { type: Type.INTEGER, description: "Borda superior em % (0-100)" },
                      xmin: { type: Type.INTEGER, description: "Borda esquerda em % (0-100)" },
                      ymax: { type: Type.INTEGER, description: "Borda inferior em % (0-100)" },
                      xmax: { type: Type.INTEGER, description: "Borda direita em % (0-100)" },
                    },
                    required: ["ymin", "xmin", "ymax", "xmax"]
                  },
                  quality: {
                    type: Type.OBJECT,
                    description: "Avaliação da qualidade de captura do rosto",
                    properties: {
                      lowLight: { type: Type.BOOLEAN, description: "Se há pouca iluminação" },
                      tilted: { type: Type.BOOLEAN, description: "Se o rosto está inclinado ou não-frontal" },
                      blurry: { type: Type.BOOLEAN, description: "Se a imagem está desfocada ou borrada" },
                      distant: { type: Type.BOOLEAN, description: "Se a pessoa está muito distante da câmera" },
                      partiallyHidden: { type: Type.BOOLEAN, description: "Se o rosto está parcialmente coberto/oculto" },
                      details: { type: Type.STRING, description: "Detalhes explicativos sobre a qualidade em português" }
                    },
                    required: ["lowLight", "tilted", "blurry", "distant", "partiallyHidden", "details"]
                  },
                  futureFeatures: {
                    type: Type.OBJECT,
                    description: "Recursos de extensão inteligente de biometria facial",
                    properties: {
                      gender: { type: Type.STRING, description: "Gênero estimado em português (Masculino, Feminino, Indeterminado)" },
                      emotion: { type: Type.STRING, description: "Emoção estimada em português (Neutro, Feliz, Surpreso, Bravo, Triste, Sério)" },
                      smile: { type: Type.BOOLEAN, description: "Se a pessoa está sorrindo" },
                      glasses: { type: Type.BOOLEAN, description: "Se a pessoa está usando óculos" },
                      fatigue: { type: Type.STRING, description: "Nível de fadiga estimado em português (Baixa, Média, Alta)" },
                      attention: { type: Type.STRING, description: "Status de atenção do rosto em português (Focado, Distraído)" }
                    },
                    required: ["gender", "emotion", "smile", "glasses", "fatigue", "attention"]
                  }
                },
                required: ["id", "estimatedAge", "ageGroup", "confidence", "box", "quality", "futureFeatures"]
              }
            },
            imageQualityOk: { type: Type.BOOLEAN, description: "Indica se a imagem possui qualidade mínima aceitável de captura" },
            qualityIssues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Problemas de captura identificados na imagem de forma geral em português"
            }
          },
          required: ["faces", "imageQualityOk", "qualityIssues"]
        },
        systemInstruction: "Você é um motor de visão computacional biométrica avançado de alta precisão. Analise os rostos de forma imparcial e científica, seguindo as diretrizes estruturadas."
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("Resposta vazia retornada pelo modelo Gemini.");
    }

    const parsedResult = JSON.parse(textResult.trim());
    const processingTimeMs = Date.now() - startTime;

    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      imageHash,
      faces: parsedResult.faces || [],
      imageQualityOk: parsedResult.imageQualityOk !== undefined ? parsedResult.imageQualityOk : true,
      qualityIssues: parsedResult.qualityIssues || [],
      processingTimeMs,
    };

    // Save success logs to database file (only if faces are found and authorized implicitly via form flow)
    if (result.faces.length > 0) {
      HistoryStore.saveHistory(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error("Erro na análise da imagem:", error);
    res.status(500).json({
      error: error.message || "Erro interno no servidor ao processar imagem.",
      details: error.stack,
    });
  }
});

// Configure Vite middleware or serve static builds
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configurando middleware do Vite para desenvolvimento...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Servindo arquivos estáticos de produção...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Erro ao inicializar o servidor Express:", err);
});
