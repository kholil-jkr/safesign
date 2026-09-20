// SafeSign — shared types
// Brief §4.1, §6.1: structured analysis result; §4.3: chat state is session-only.

export type LangCode =
  | "en"
  | "id"
  | "ar"
  | "tl"
  | "hi"
  | "bn"
  | "ne"
  | "ur"
  | "es"
  | "am";

export type RiskLevel = "low" | "medium" | "high";

export interface RedFlag {
  clause: string;
  explanation: string;
}

/** Exact JSON structure required by the Contract Analysis System Prompt (Brief §6.1). */
export interface AnalysisResult {
  risk_level: RiskLevel;
  risk_reason: string;
  summary: string;
  red_flags: RedFlag[];
  next_steps: string;
  disclaimer: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnalyzeApiResponse {
  ok: boolean;
  analysis?: AnalysisResult;
  error?: string;
}

export interface ChatApiResponse {
  ok: boolean;
  reply?: string;
  error?: string;
}
