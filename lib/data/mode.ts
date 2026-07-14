export type DataMode = "local" | "supabase";

// Default is "local": the demo must run without a live Supabase project
// (free-tier Supabase pauses after ~7 days idle — see BRIEF.md §3).
export function getDataMode(): DataMode {
  return process.env.DATA_SOURCE_MODE === "supabase" ? "supabase" : "local";
}
