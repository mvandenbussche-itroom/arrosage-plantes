import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { waterPlant } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { formatDueDelay, getStatus, type PlantStatus } from "@/lib/status";
import { WaterButton } from "./water-button";

// Le statut se calcule à chaque affichage : rendu dynamique.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<
  PlantStatus,
  { badge: string; panel: string; dot: string }
> = {
  late: {
    badge: "bg-status-late-bg text-status-late",
    panel: "border-status-late/30 bg-status-late-bg",
    dot: "bg-status-late",
  },
  due: {
    badge: "bg-status-due-bg text-status-due",
    panel: "border-status-due/30 bg-status-due-bg",
    dot: "bg-status-due",
  },
  ok: {
    badge: "bg-status-ok-bg text-status-ok",
    panel: "border-status-ok/30 bg-status-ok-bg",
    dot: "bg-status-ok",
  },
};

export default async function PlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const plant = await prisma.plant.findUnique({
    where: { id },
    include: { waterings: { orderBy: { wateredAt: "desc" } } },
  });

  if (!plant) {
    notFound();
  }

  const computed = getStatus(plant);
  const styles = STATUS_STYLES[computed.status];
  const hasBeenWatered = plant.waterings.length > 0;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Link
        href="/"
        className="text-sm text-foreground/50 transition-colors hover:text-itroom"
      >
        ← Retour au tableau de bord
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {plant.name}
        </h1>
        <p className="mt-1 text-foreground/60">{plant.location}</p>
      </div>

      {/* Panneau de statut */}
      <div className={`rounded-xl border p-5 ${styles.panel}`}>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${styles.dot}`} />
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${styles.badge}`}
          >
            {computed.label}
          </span>
        </div>
        <p className="mt-3 text-sm text-foreground/70">
          Prochain arrosage prévu le{" "}
          <strong>{format(computed.nextDue, "d MMMM", { locale: fr })}</strong> (
          {formatDueDelay(computed.daysUntilDue)}).
        </p>
      </div>

      {/* Le bouton principal : 1 tap, sans friction */}
      <form action={waterPlant}>
        <input type="hidden" name="plantId" value={plant.id} />
        <WaterButton />
      </form>

      {/* Détails */}
      <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 text-sm">
        <div>
          <dt className="text-foreground/50">Fréquence</dt>
          <dd className="mt-1 font-medium text-foreground">
            tous les {plant.frequencyDays} jours
          </dd>
        </div>
        <div>
          <dt className="text-foreground/50">Dernier arrosage</dt>
          <dd className="mt-1 font-medium text-foreground">
            {hasBeenWatered
              ? format(computed.lastWatered, "d MMMM yyyy", { locale: fr })
              : "jamais arrosée"}
          </dd>
        </div>
      </dl>

      {/* Historique */}
      {hasBeenWatered && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-foreground/60">
            Historique des arrosages
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {plant.waterings.slice(0, 8).map((w) => (
              <li
                key={w.id}
                className="px-4 py-2.5 text-sm text-foreground/70"
              >
                {format(w.wateredAt, "EEEE d MMMM yyyy 'à' HH'h'mm", {
                  locale: fr,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
