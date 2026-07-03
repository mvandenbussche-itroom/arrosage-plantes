"use client";

// Déclenche la boîte d'impression du navigateur. La CSS `@media print`
// (classes print:hidden) masque tout le superflu à l'impression.
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-itroom px-4 py-2 text-sm font-semibold text-white transition hover:bg-itroom-dark"
    >
      🖨️ Imprimer
    </button>
  );
}
