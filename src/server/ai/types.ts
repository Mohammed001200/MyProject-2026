import type { DocumentAnalysisResult } from "@/server/ai/analysis-schema";

export type AnalyzeDocumentInput = {
  bytes: Uint8Array;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  extension: "pdf" | "jpg" | "jpeg" | "png";
};

export type AnalysisEnvelope = {
  result: DocumentAnalysisResult;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

export interface DocumentAnalysisProvider {
  analyze(input: AnalyzeDocumentInput): Promise<AnalysisEnvelope>;
}
