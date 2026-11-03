import LoginForm from "./form.tsx";
import { isDevProvider } from "../../lib/deps.ts";
import { DEV_PASSWORD } from "../../../src/server/auth/dev-provider.ts";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="center">
      <div className="card narrow">
        <h1>AI Tool Picks team</h1>
        <p className="muted">Sign in with your team account. There is no public registration.</p>
        {isDevProvider() && (
          <p className="notice" role="note">
            Development sign-in is on (local database only). Use any team e-mail address with the password <code>{DEV_PASSWORD}</code>.
          </p>
        )}
        <LoginForm next={next} />
      </div>
    </main>
  );
}
