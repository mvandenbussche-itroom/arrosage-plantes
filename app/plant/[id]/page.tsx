import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDueDelay, getStatus, STATUS_STYLES } from "@/lib/status";
import { WaterButton } from "./water-button";

// Page ouverte par le scan du QR code collé sur le pot : le statut doit
// toujours être frais, jamais une version mise en cache.
export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function PlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const plant = await prisma.plant.findUnique({
    where: { id },
    include: { waterings: true },
  });

  // QR périmé ou id invalide -> 404 plutôt qu'une page cassée.
  if (!plant) notFound();

  const now = new Date();
  const computed = getStatus(plant, now);
  const styles = STATUS_STYLES[computed.status];
  const neverWatered = plant.waterings.length === 0;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Link
        href="/"
        className="text-sm font-medium text-foreground/50 hover:text-foreground/70"
      >
        ← Tableau de bord
      </Link>

      <div
        className={`flex flex-col gap-4 rounded-2xl border border-border border-l-4 bg-card p-6 ${styles.border}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {plant.name}
            </h1>
            <p className="text-sm text-foreground/60">{plant.location}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}
          >
            {computed.label}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
          <div>
            <dt className="text-foreground/50">Dernier arrosage</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {neverWatered ? "Jamais arrosée" : formatDate(computed.lastWatered)}
            </dd>
          </div>
          <div>
            <dt className="text-foreground/50">Prochain arrosage</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {formatDueDelay(computed.daysUntilDue)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-foreground/50">Fréquence</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              tous les {plant.frequencyDays} jour
              {plant.frequencyDays > 1 ? "s" : ""}
            </dd>
          </div>
        </dl>
      </div>

      <WaterButton plantId={plant.id} />
    </div>
  );
}
