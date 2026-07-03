"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deletePlantImage, InvalidPlantImageError, savePlantImage } from "@/lib/plant-image";

// État renvoyé à useActionState côté client (bouton "J'ai arrosé").
export type WaterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

// État renvoyé à useActionState côté formulaire d'édition.
export type UpdatePlantState = {
  status: "idle" | "error";
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

/**
 * Détermine la nouvelle valeur d'imageUrl à partir du formulaire d'édition,
 * en supprimant l'ancienne photo du disque si elle est remplacée ou retirée.
 *
 * @param formData Données du formulaire d'édition.
 * @param currentImageUrl Photo actuellement enregistrée pour la plante.
 *
 * @return La nouvelle valeur d'imageUrl (null pour "aucune photo"), ou
 *         currentImageUrl si le formulaire ne modifie pas la photo.
 *
 * @throws InvalidPlantImageError Si le fichier fourni est invalide.
 */
async function resolveImageUrl(
  formData: FormData,
  currentImageUrl: string | null,
): Promise<string | null> {
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const newImageUrl = await savePlantImage(image);
    await deletePlantImage(currentImageUrl);
    return newImageUrl;
  }

  if (formData.get("removeImage") === "on") {
    await deletePlantImage(currentImageUrl);
    return null;
  }

  return currentImageUrl;
}

// Met à jour les informations d'une plante (nom, emplacement, fréquence,
// photo). Redirige vers la fiche plante en cas de succès.
export async function updatePlant(
  _prevState: UpdatePlantState,
  formData: FormData,
): Promise<UpdatePlantState> {
  const id = (formData.get("plantId") ?? "").toString();
  const name = (formData.get("name") ?? "").toString().trim();
  const location = (formData.get("location") ?? "").toString().trim();
  const frequencyDays = Number.parseInt(
    (formData.get("frequencyDays") ?? "").toString(),
    10,
  );

  if (!id) {
    return { status: "error", message: "Plante introuvable." };
  }
  if (!name || !location) {
    return { status: "error", message: "Nom et emplacement sont obligatoires." };
  }
  if (!Number.isInteger(frequencyDays) || frequencyDays < 1) {
    return {
      status: "error",
      message: "La fréquence doit être un nombre de jours ≥ 1.",
    };
  }

  const plant = await prisma.plant.findUnique({ where: { id } });
  if (!plant) {
    return { status: "error", message: "Plante introuvable." };
  }

  let imageUrl: string | null;
  try {
    imageUrl = await resolveImageUrl(formData, plant.imageUrl);
  } catch (err) {
    if (err instanceof InvalidPlantImageError) {
      return { status: "error", message: err.message };
    }
    throw err;
  }

  try {
    await prisma.plant.update({
      where: { id },
      data: { name, location, frequencyDays, imageUrl },
    });
  } catch (err) {
    console.error("updatePlant failed", err);
    return {
      status: "error",
      message: "Impossible de mettre à jour la plante. Réessaie.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/plant/${id}`);

  redirect(`/plant/${id}`);
}
