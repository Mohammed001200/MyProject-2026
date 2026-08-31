import type { DocumentAnalysisResult } from "@/server/ai/analysis-schema";

export const MIN_TRUSTED_ANALYSIS_CONFIDENCE = 0.8;
export const MIN_TRUSTED_ACTION_CONFIDENCE = 0.8;

const lowAnalysisConfidenceWarning =
  "The overall analysis confidence is too low for automatic actions.";
const withheldActionWarning =
  "One or more suggested actions were withheld because their evidence or confidence was insufficient.";

export function applyAnalysisSafetyPolicy(result: DocumentAnalysisResult) {
  const warnings = [...result.warnings];
  const analysisIsTrusted =
    warnings.length === 0 &&
    result.confidence >= MIN_TRUSTED_ANALYSIS_CONFIDENCE;

  if (result.confidence < MIN_TRUSTED_ANALYSIS_CONFIDENCE) {
    warnings.push(lowAnalysisConfidenceWarning);
  }

  const actions = analysisIsTrusted
    ? result.actions.filter(
        (action) =>
          action.confidence >= MIN_TRUSTED_ACTION_CONFIDENCE &&
          Boolean(action.sourceText?.trim()),
      )
    : [];

  if (actions.length !== result.actions.length) {
    warnings.push(withheldActionWarning);
  }

  return {
    actions,
    warnings: [...new Set(warnings)].slice(0, 12),
    needsReview: warnings.length > 0,
  };
}
