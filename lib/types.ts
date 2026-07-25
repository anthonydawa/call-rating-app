export type RubricScores = {
  opening: number;
  discovery: number;
  communication: number;
  objection_handling: number;
  closing: number;
};

export type CallEvaluation = {
  id: string;
  external_call_id: string;
  agent_id: string | null;
  agent_name: string;
  contact_name: string;
  contact_phone: string | null;
  direction: "inbound" | "outbound";
  started_at: string;
  duration_seconds: number;
  overall_score: number;
  outcome: "won" | "follow_up" | "lost" | "neutral";
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  strengths: string[];
  improvements: string[];
  rubric_scores: RubricScores;
  transcript: string;
  recording_url: string | null;
  ai_model: string;
  raw_payload?: Record<string, unknown> | null;
  created_at: string;
};
