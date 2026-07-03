import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">
        Plante introuvable
      </h1>
      <p className="text-sm text-foreground/60">
        Ce QR code ne correspond à aucune plante enregistrée. Vérifie qu&apos;il
        n&apos;a pas été mal scanné ou qu&apos;il n&apos;est pas périmé.
      </p>
      <Link
        href="/"
        className="mt-2 text-sm font-medium text-itroom hover:underline"
      >
        ← Retour au tableau de bord
      </Link>
    </div>
  );
}
