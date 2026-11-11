// A production build (Vercel previews included) has the demo login only when it opts in explicitly
// for the portfolio exhibition (NEXT_PUBLIC_DEMO_AUTH=enabled). Without the flag it has no demo
// login and no demo session, whatever cookie the browser sends. Local development keeps it on, so
// `npm run dev` works with no setup. Both values are inlined at build time, so the login form (client)
// and the session rule (server) read the same answer from this module.
export function isDemoAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_AUTH === "enabled" || process.env.NODE_ENV !== "production";
}
