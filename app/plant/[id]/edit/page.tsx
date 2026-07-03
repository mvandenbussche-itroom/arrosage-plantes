import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditPlantForm } from "./edit-plant-form";

export const dynamic = "force-dynamic";

export default async function EditPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireUser(`/plant/${id}/edit`);

  const plant = await prisma.plant.findUnique({ where: { id } });

  if (!plant) notFound();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Link
        href={`/plant/${id}`}
        className="-mx-1 inline-block w-fit px-1 py-2 text-sm font-medium text-foreground/50 hover:text-foreground/70"
      >
        ← Fiche plante
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Modifier {plant.name}
        </h1>
      </div>

      <EditPlantForm
        plantId={plant.id}
        name={plant.name}
        location={plant.location}
        frequencyDays={plant.frequencyDays}
        imageUrl={plant.imageUrl}
      />
    </div>
  );
}
