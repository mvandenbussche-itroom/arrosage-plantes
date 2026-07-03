"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { InvalidPlantImageError, savePlantImage } from "@/lib/plant-image";

// État renvoyé à useActionState côté formulaire de création.
export type CreatePlantState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Enregistre la photo de profil envoyée avec le formulaire, si elle est
 * présente. Un input file vide arrive comme un File de taille 0 : on le
 * traite comme "pas de photo" plutôt que comme une erreur de format.
 *
 * @param formData Données du formulaire de création/édition.
 *
 * @return Le chemin public de l'image, ou null si aucune photo n'a été fournie.
 *
 * @throws InvalidPlantImageError Si le fichier fourni est invalide.
 */
async function extractImageUrl(formData: FormData): Promise<string | null> {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return savePlantImage(image);
}

// Ajoute une plante au parc. Utilisé dans l'espace admin (création + impression
// des QR par ailleurs). Valide les entrées avant insertion.
export async function createPlant(
  _prevState: CreatePlantState,
  formData: FormData,
): Promise<CreatePlantState> {
  const name = (formData.get("name") ?? "").toString().trim();
  const location = (formData.get("location") ?? "").toString().trim();
  const frequencyDays = Number.parseInt(
    (formData.get("frequencyDays") ?? "").toString(),
    10,
  );

  if (!name || !location) {
    return { status: "error", message: "Nom et emplacement sont obligatoires." };
  }
  if (!Number.isInteger(frequencyDays) || frequencyDays < 1) {
    return {
      status: "error",
      message: "La fréquence doit être un nombre de jours ≥ 1.",
    };
  }

  let imageUrl: string | null;
  try {
    imageUrl = await extractImageUrl(formData);
  } catch (err) {
    if (err instanceof InvalidPlantImageError) {
      return { status: "error", message: err.message };
    }
    throw err;
  }

  try {
    await prisma.plant.create({
      data: { name, location, frequencyDays, imageUrl },
    });
  } catch (err) {
    console.error("createPlant failed", err);
    return {
      status: "error",
      message: "Impossible d'ajouter la plante. Réessaie.",
    };
  }

  // Le dashboard et la liste admin doivent montrer la nouvelle plante.
  revalidatePath("/");
  revalidatePath("/admin");

  return { status: "success", message: `« ${name} » a été ajoutée.` };
}
