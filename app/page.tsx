import Dashboard from "./dashboard";
import { getEvaluations } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await getEvaluations();
  return <Dashboard initialData={result.evaluations} mode={result.mode} />;
}
