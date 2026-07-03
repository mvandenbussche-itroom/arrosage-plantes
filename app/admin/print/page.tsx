import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlantQrDataUrl } from "@/lib/qr";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireUser("/admin/print");

  const { id } = await searchParams;

  // Toutes les plantes (ou une seule via `?id=`). Le QR est généré à la volée.
  const plants = await prisma.plant.findMany({
    where: id ? { id } : undefined,
    orderBy: { name: "asc" },
  });

  const labels = await Promise.all(
    plants.map(async (plant) => ({
      plant,
      qr: await getPlantQrDataUrl(plant.id),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-itroom">
            Impression des QR codes
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {plants.length} étiquette{plants.length > 1 ? "s" : ""} · à découper
            et coller sur les pots
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/admin"
            className="text-sm font-medium text-foreground/60 hover:text-itroom"
          >
            ← Admin
          </Link>
          {plants.length > 0 && <PrintButton />}
        </div>
      </div>

      {labels.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-foreground/60 print:hidden">
          Aucune plante à imprimer. Ajoutez-en depuis l&apos;espace admin.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {labels.map(({ plant, qr }) => (
            <div
              key={plant.id}
              className="flex break-inside-avoid flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 text-center"
            >
              <Image
                src={qr}
                alt={`QR code de ${plant.name}`}
                width={180}
                height={180}
                unoptimized
                className="h-auto w-full max-w-[180px]"
              />
              <div>
                <p className="font-semibold text-black">{plant.name}</p>
                <p className="text-xs text-gray-600">{plant.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
