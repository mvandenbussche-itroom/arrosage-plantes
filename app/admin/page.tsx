import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDueDelay, getStatus, STATUS_STYLES } from "@/lib/status";
import { CreatePlantForm } from "./create-plant-form";

// La liste doit refléter les ajouts et arrosages en temps réel.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const plants = await prisma.plant.findMany({
    include: { waterings: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-itroom">
          Administration
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Gérer le parc de plantes · {plants.length} au total
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="lg:order-2">
          <CreatePlantForm />
        </div>

        <div className="lg:order-1">
          {plants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-foreground/60">
              Aucune plante. Ajoutez-en une avec le formulaire.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {plants.map((plant) => {
                const computed = getStatus(plant, now);
                const styles = STATUS_STYLES[computed.status];
                return (
                  <li
                    key={plant.id}
                    className={`flex items-center justify-between gap-4 rounded-xl border border-border border-l-4 bg-card p-4 ${styles.border}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate font-semibold text-foreground">
                          {plant.name}
                        </h2>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}
                        >
                          {computed.label}
                        </span>
                      </div>
                      <p className="truncate text-sm text-foreground/60">
                        {plant.location}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground/50">
                        tous les {plant.frequencyDays} j · prochain arrosage{" "}
                        {formatDueDelay(computed.daysUntilDue)}
                      </p>
                    </div>
                    <Link
                      href={`/plant/${plant.id}`}
                      className="shrink-0 text-sm font-medium text-itroom hover:underline"
                    >
                      Fiche →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
