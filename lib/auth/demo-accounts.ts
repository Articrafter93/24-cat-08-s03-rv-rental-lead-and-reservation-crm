export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  // Sandbox-only demo credential, intentionally visible to the client — this is
  // a portfolio demo login, not a real auth system. See BRIEF.md §"Login mock".
  password: string;
  destination: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "owner-sarah",
    name: "Sarah Johnson",
    email: "sarah@rvcorp.com",
    role: "Sales Manager",
    password: "Demo2026!",
    destination: "/dashboard",
  },
  {
    id: "owner-mike",
    name: "Mike Torres",
    email: "mike@rvcorp.com",
    role: "Support Lead",
    password: "Demo2026!",
    destination: "/dashboard",
  },
];

export function findDemoAccount(id: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.id === id);
}
