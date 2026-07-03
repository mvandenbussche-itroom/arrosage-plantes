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
import { PlantAvatar } from "@/app/plant-avatar";

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

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <CounterTile
          status="late"
          label="En retard"
          value={counts.late}
          total={withStatus.length}
        />
        <CounterTile
          status="due"
          label="À arroser"
          value={counts.due}
          total={withStatus.length}
        />
        <CounterTile
          status="ok"
          label="À jour"
          value={counts.ok}
          total={withStatus.length}
        />
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
              imageUrl={plant.imageUrl}
              computed={computed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Couleur du statut lue depuis les variables CSS de la charte (globals.css) —
// on ne peut pas utiliser les classes Tailwind bg-*/text-* sur un attribut
// SVG `stroke`, donc on référence directement les custom properties.
const STATUS_RING_COLOR: Record<PlantStatus, string> = {
  late: "var(--status-late)",
  due: "var(--status-due)",
  ok: "var(--status-ok)",
};

function CounterTile({
  status,
  label,
  value,
  total,
}: {
  status: PlantStatus;
  label: string;
  value: number;
  total: number;
}) {
  // Part de ce statut dans l'ensemble des plantes suivies -> remplissage de
  // l'anneau. 0/0 (aucune plante) donne un anneau vide plutôt qu'une erreur.
  const fraction = total > 0 ? value / total : 0;

  return (
    <div className="flex flex-col items-center gap-2 p-3 sm:p-5">
      <ProgressRing status={status} value={value} fraction={fraction} />
      <span className="text-center text-[11px] font-medium uppercase tracking-wide text-foreground/60 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function ProgressRing({
  status,
  value,
  fraction,
}: {
  status: PlantStatus;
  value: number;
  fraction: number;
}) {
  const size = 72;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const offset = circumference * (1 - clamped);

  const percent = Math.round(clamped * 100);

  return (
    <div
      role="img"
      aria-label={`${value} plante${value > 1 ? "s" : ""} (${percent}% du parc)`}
      className="relative h-16 w-16 shrink-0 sm:h-[72px] sm:w-[72px]"
    >
      {/* -rotate-90 : l'anneau démarre à midi plutôt qu'à 3h. */}
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          style={{ stroke: "var(--border)" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            stroke: STATUS_RING_COLOR[status],
            transition: "stroke-dashoffset 0.4s ease",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-foreground sm:text-xl">
          {value}
        </span>
      </div>
    </div>
  );
}

function PlantCard({
  id,
  name,
  location,
  imageUrl,
  computed,
}: {
  id: string;
  name: string;
  location: string;
  imageUrl: string | null;
  computed: ComputedStatus;
}) {
  const styles = STATUS_STYLES[computed.status];
  return (
    <Link
      href={`/plant/${id}`}
      className={`flex flex-col gap-3 rounded-xl border border-border border-l-4 bg-card p-5 transition-shadow hover:shadow-md ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PlantAvatar imageUrl={imageUrl} name={name} />
          <h2 className="truncate font-semibold text-foreground">{name}</h2>
        </div>
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
