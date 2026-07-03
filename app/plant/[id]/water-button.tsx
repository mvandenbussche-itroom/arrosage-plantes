"use client";

import { useFormStatus } from "react-dom";

// Bouton de soumission : affiche un état "en cours" pendant l'exécution de la
// Server Action. Doit vivre à l'intérieur du <form> pour lire useFormStatus.
export function WaterButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-itroom px-6 text-lg font-semibold text-white transition-colors hover:bg-itroom-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enregistrement…" : "💧 J'ai arrosé"}
    </button>
  );
}
