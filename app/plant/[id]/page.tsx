import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDueDelay, getStatus, STATUS_STYLES } from "@/lib/status";
import { PlantAvatar } from "@/app/plant-avatar";
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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
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
    include: {
      waterings: { orderBy: { wateredAt: "desc" }, include: { user: true } },
    },
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
        // py-2 -mx-1 : agrandit la zone de tap sans changer le rendu visuel
        // (utile au pouce sur mobile, sans casser l'alignement avec la carte).
        className="-mx-1 inline-block w-fit px-1 py-2 text-sm font-medium text-foreground/50 hover:text-foreground/70"
      >
        ← Tableau de bord
      </Link>

      <div
        className={`flex flex-col gap-4 rounded-2xl border border-border border-l-4 bg-card p-6 ${styles.border}`}
      >
        <div className="flex items-start gap-4">
          <PlantAvatar imageUrl={plant.imageUrl} name={plant.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h1 className="min-w-0 break-words text-xl font-semibold text-foreground">
                {plant.name}
              </h1>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}
              >
                {computed.label}
              </span>
            </div>
            <p className="break-words text-sm text-foreground/60">
              {plant.location}
            </p>
            <Link
              href={`/plant/${plant.id}/edit`}
              className="mt-1 inline-block text-xs font-medium text-itroom hover:underline"
            >
              Modifier
            </Link>
          </div>
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

      <WateringHistory waterings={plant.waterings} />
    </div>
  );
}

function WateringHistory({
  waterings,
}: {
  waterings: { id: string; wateredAt: Date; user: { name: string } | null }[];
}) {
  if (waterings.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold text-foreground">
        Historique d&apos;arrosage
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {waterings.map((watering) => (
          <li
            key={watering.id}
            className="flex items-center justify-between gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0"
          >
            <span className="text-foreground/60">
              {formatDateTime(watering.wateredAt)}
            </span>
            <span className="font-medium text-foreground">
              {watering.user?.name ?? "Anonyme"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
