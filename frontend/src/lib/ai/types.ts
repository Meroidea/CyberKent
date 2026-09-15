/**
 * The shapes the AI Gateway returns.
 *
 * Mirrors `ai-service/app/schemas.py`, which is also the JSON schema the model
 * is constrained to — so what is typed here is exactly what can arrive.
 */

export type AiVerdict = "likely_scam" | "suspicious" | "likely_genuine" | "unclear";

export interface AiUsage {
  /** Which provider answered — `openai`, `gemini`, or whatever is configured. */
  provider: string;
  model: string;
  prompt_version: string;
  latency_ms: number;
  input_tokens?: number | null;
  output_tokens?: number | null;
}

export interface AiTactic {
  tactic: string;
  evidence: string;
  explanation: string;
}

export interface AiEmotion {
  emotion: "fear" | "urgency" | "greed" | "trust" | "sympathy" | "curiosity" | "guilt" | "excitement";
  intensity: number;
}

export interface AiTextAnalysis {
  verdict: AiVerdict;
  risk_score: number;
  confidence: number;
  scam_type: string;
  tactics: AiTactic[];
  sentiment: {
    overall: "negative" | "neutral" | "positive";
    pressure_level: "none" | "low" | "moderate" | "high";
    emotions: AiEmotion[];
  };
  explanation: string;
  genuine_signals: string[];
  recommended_actions: string[];
}

export interface AiImageAnalysis {
  image_type: string;
  description: string;
  visible_text_summary: string;
  brands_detected: { name: string; context: string }[];
  visual_red_flags: { flag: string; explanation: string }[];
  verdict: AiVerdict;
  risk_score: number;
  confidence: number;
  explanation: string;
  recommended_actions: string[];
}

export interface AiResult<T> {
  result: T;
  usage: AiUsage;
  /** How many sensitive numbers the gateway masked before sending. */
  redactions: number;
}

export interface AiStatus {
  available: boolean;
  provider: string;
  model: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  reply: string;
  blocked: boolean;
  model: string;
  redactions: number;
}
