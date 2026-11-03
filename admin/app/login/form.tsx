"use client";
import { useActionState } from "react";
import { signIn, type LoginState } from "./actions.ts";

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next ?? "/"} />
      <label>
        E-mail address
        <input name="email" type="email" autoComplete="username" required maxLength={254} />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required maxLength={1000} />
      </label>
      {state.error && <p role="alert" className="error">{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
