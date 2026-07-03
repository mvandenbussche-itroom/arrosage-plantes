"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Enregistre un arrosage. Volontairement SANS authentification : le scan du QR
// est anonyme et doit marcher en 1 tap, sans login (cf. plan §5/§8).
export async function waterPlant(formData: FormData) {
  const plantId = formData.get("plantId");
  if (typeof plantId !== "string" || plantId.length === 0) {
    throw new Error("plantId manquant");
  }

  // On vérifie que la plante existe pour éviter d'insérer un Watering orphelin
  // via un POST direct forgé.
  const plant = await prisma.plant.findUnique({ where: { id: plantId } });
  if (!plant) {
    throw new Error("Plante introuvable");
  }

  await prisma.watering.create({ data: { plantId } });

  // Rafraîchit le dashboard et la page de la plante (statut recalculé).
  revalidatePath("/");
  revalidatePath(`/plant/${plantId}`);
}
