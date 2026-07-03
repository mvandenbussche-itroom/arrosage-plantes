import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatDueDelay,
  getStatus,
  STATUS_ORDER,
  STATUS_STYLES,
  type ComputedStatus,
  type PlantStatus,
} from "@/lib/status";

// Le dashboard doit refléter les arrosages en temps réel : rendu à chaque requête.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const plants = await prisma.plant.findMany({
    include: { waterings: true },
  });

  const now = new Date();
  const withStatus = plants
    .map((plant) => ({ plant, computed: getStatus(plant, now) }))
    .sort((a, b) => {
      const byStatus =
        STATUS_ORDER[a.computed.status] - STATUS_ORDER[b.computed.status];
      if (byStatus !== 0) return byStatus;
      return a.computed.daysUntilDue - b.computed.daysUntilDue;
    });

  const counts = {
    late: withStatus.filter((p) => p.computed.status === "late").length,
    due: withStatus.filter((p) => p.computed.status === "due").length,
    ok: withStatus.filter((p) => p.computed.status === "ok").length,
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-itroom">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          {plants.length} plante{plants.length > 1 ? "s" : ""} suivie
          {plants.length > 1 ? "s" : ""} · état du parc en temps réel
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <CounterTile status="late" label="En retard" value={counts.late} />
        <CounterTile status="due" label="À arroser" value={counts.due} />
        <CounterTile status="ok" label="À jour" value={counts.ok} />
      </div>

      {withStatus.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withStatus.map(({ plant, computed }) => (
            <PlantCard
              key={plant.id}
              id={plant.id}
              name={plant.name}
              location={plant.location}
              computed={computed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CounterTile({
  status,
  label,
  value,
}: {
  status: PlantStatus;
  label: string;
  value: number;
}) {
  const styles = STATUS_STYLES[status];
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
        <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">
          {label}
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PlantCard({
  id,
  name,
  location,
  computed,
}: {
  id: string;
  name: string;
  location: string;
  computed: ComputedStatus;
}) {
  const styles = STATUS_STYLES[computed.status];
  return (
    <Link
      href={`/plant/${id}`}
      className={`flex flex-col gap-3 rounded-xl border border-border border-l-4 bg-card p-5 transition-shadow hover:shadow-md ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-foreground">{name}</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${styles.badge}`}
        >
          {computed.label}
        </span>
      </div>
      <p className="text-sm text-foreground/60">{location}</p>
      <p className="mt-auto text-xs text-foreground/50">
        Prochain arrosage {formatDueDelay(computed.daysUntilDue)}
      </p>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <p className="text-foreground/60">
        Aucune plante pour l&apos;instant. Ajoutez-en depuis l&apos;espace admin.
      </p>
    </div>
  );
}
