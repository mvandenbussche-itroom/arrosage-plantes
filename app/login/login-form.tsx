"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-itroom";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-foreground/60">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="prenom.nom@itroom.fr"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-foreground/60">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-itroom px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-itroom-dark disabled:opacity-60"
      >
        {isPending ? "Connexion…" : "Se connecter"}
      </button>

      {state.status === "error" && (
        <p className="text-sm font-medium text-status-late" role="alert">
          {state.message}
        </p>
      )}

      <p className="text-center text-sm text-foreground/60">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-itroom hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
