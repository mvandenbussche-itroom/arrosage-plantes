"use client";

import { useActionState } from "react";
import { waterPlant, type WaterState } from "./actions";

const initialState: WaterState = { status: "idle" };

// Gros bouton pouce-friendly : c'est le geste central du produit (scan -> tap
// -> statut à jour), donc pas de friction, pas de login, feedback immédiat.
export function WaterButton({ plantId }: { plantId: string }) {
  const [state, formAction, isPending] = useActionState(
    waterPlant,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col items-center gap-3">
      <input type="hidden" name="plantId" value={plantId} />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-itroom px-6 py-6 text-lg font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "💧 J'ai arrosé"}
      </button>

      {state.status === "success" && (
        <p className="text-sm font-medium text-status-ok" role="status">
          Merci, c&apos;est enregistré !
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
