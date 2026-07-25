import { demoEvaluations } from "./demo-data";
import type { CallEvaluation } from "./types";

export type EvaluationResult = { evaluations: CallEvaluation[]; mode: "live" | "demo"; error?: string };

export async function getEvaluations(): Promise<EvaluationResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !apiKey || url.includes("YOUR_PROJECT")) return { evaluations: demoEvaluations, mode: "demo" };

  try {
    const response = await fetch(`${url}/rest/v1/call_evaluations?select=*&order=started_at.desc&limit=500`, {
      headers: {
        apikey: apiKey,
        ...(apiKey.startsWith("sb_publishable_")
          ? {}
          : { Authorization: `Bearer ${apiKey}` }),
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
    return { evaluations: (await response.json()) as CallEvaluation[], mode: "live" };
  } catch (error) {
    return { evaluations: demoEvaluations, mode: "demo", error: error instanceof Error ? error.message : "Unable to load Supabase data" };
  }
}
