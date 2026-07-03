"use client";

import { useFormStatus } from "react-dom";
import { generateQrCode } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-itroom px-3 py-1.5 text-sm font-medium text-itroom transition hover:bg-itroom-light disabled:opacity-60"
    >
      {pending ? "Génération…" : "Générer le QR"}
    </button>
  );
}

// N'est rendu que pour les plantes sans QR : le geste ne peut donc pas
// écraser un QR existant (double garde avec le check côté action).
export function GenerateQrButton({ plantId }: { plantId: string }) {
  return (
    <form action={generateQrCode}>
      <input type="hidden" name="plantId" value={plantId} />
      <SubmitButton />
    </form>
  );
}
