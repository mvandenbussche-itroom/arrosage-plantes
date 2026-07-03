"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// État renvoyé à useActionState côté client (bouton "J'ai arrosé").
export type WaterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

// Enregistre un arrosage. Appelée depuis la fiche plante ouverte par le scan
// du QR code : aucune authentification (scan anonyme, cf. plan technique §8).
export async function waterPlant(
  _prevState: WaterState,
  formData: FormData,
): Promise<WaterState> {
  const plantId = formData.get("plantId");

  if (typeof plantId !== "string" || plantId.length === 0) {
    return { status: "error", message: "Plante introuvable." };
  }

  try {
    await prisma.watering.create({ data: { plantId } });
  } catch (err) {
    // Cas typique : id périmé (plante supprimée) -> la contrainte FK échoue.
    console.error("waterPlant failed", err);
    return {
      status: "error",
      message: "Impossible d'enregistrer l'arrosage. Réessaie.",
    };
  }

  // Rafraîchit le dashboard et cette fiche pour refléter le nouveau statut.
  revalidatePath("/");
  revalidatePath(`/plant/${plantId}`);

  return { status: "success" };
}
