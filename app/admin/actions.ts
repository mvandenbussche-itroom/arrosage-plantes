"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// État renvoyé à useActionState côté formulaire de création.
export type CreatePlantState = {
  status: "idle" | "success" | "error";
  message?: string;
};

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

  try {
    await prisma.plant.create({ data: { name, location, frequencyDays } });
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
