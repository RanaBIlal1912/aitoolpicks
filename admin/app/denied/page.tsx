import Link from "next/link";

const TEXT: Record<string, string> = {
  forbidden: "Your role does not include this page.",
  account_disabled: "This account has been disabled. Ask an owner.",
  not_a_team_member: "This sign-in is not on the team.",
  email_not_confirmed: "Confirm your e-mail address first, then sign in again.",
  mfa_required: "Your role needs a second sign-in factor, and this session does not have one.",
};

export default async function Denied({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return (
    <main className="center">
      <div className="card narrow">
        <h1>Not allowed</h1>
        <p>{TEXT[reason ?? ""] ?? "You cannot open this page."}</p>
        <p><Link href="/">Back to the start</Link></p>
      </div>
    </main>
  );
}
