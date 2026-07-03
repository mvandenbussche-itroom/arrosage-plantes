"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-itroom";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-foreground/60">
          Nom
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Jeanne Dupont"
          className={inputClass}
        />
      </div>

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
          minLength={8}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-itroom px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-itroom-dark disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer mon compte"}
      </button>

      {state.status === "error" && (
        <p className="text-sm font-medium text-status-late" role="alert">
          {state.message}
        </p>
      )}

      <p className="text-center text-sm text-foreground/60">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-itroom hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
