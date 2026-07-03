"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPlant, type CreatePlantState } from "./actions";

const initialState: CreatePlantState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-itroom";

export function CreatePlantForm() {
  const [state, formAction, isPending] = useActionState(
    createPlant,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Après un ajout réussi, on vide le formulaire pour enchaîner les saisies.
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <h2 className="font-semibold text-foreground">Ajouter une plante</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-foreground/60">
          Nom
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Monstera"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm text-foreground/60">
          Emplacement
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          placeholder="2e étage - open space Nord"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="frequencyDays" className="text-sm text-foreground/60">
          Fréquence d&apos;arrosage (jours)
        </label>
        <input
          id="frequencyDays"
          name="frequencyDays"
          type="number"
          min={1}
          required
          placeholder="7"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-itroom px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-itroom-dark disabled:opacity-60"
      >
        {isPending ? "Ajout…" : "Ajouter la plante"}
      </button>

      {state.status === "success" && (
        <p className="text-sm font-medium text-status-ok" role="status">
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p className="text-sm font-medium text-status-late" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
