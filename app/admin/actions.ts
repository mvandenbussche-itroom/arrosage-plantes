"use server";

import QRCode from "qrcode";
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

// Génère (une seule fois) le QR code d'une plante. Le QR encode l'URL de la
// fiche, à scanner sur le pot. S'il existe déjà, on ne le refait pas : le QR
// est stable et un regénération inutile ferait juste réécrire la même image.
export async function generateQrCode(formData: FormData) {
  const plantId = formData.get("plantId");
  if (typeof plantId !== "string" || plantId.length === 0) return;

  const plant = await prisma.plant.findUnique({ where: { id: plantId } });
  if (!plant) return;

  // Garde d'idempotence : déjà généré -> on ne touche à rien.
  if (plant.qrCode) return;

  const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const target = `${baseUrl}/plant/${plantId}`;
  const dataUrl = await QRCode.toDataURL(target, { width: 320, margin: 2 });

  await prisma.plant.update({
    where: { id: plantId },
    data: { qrCode: dataUrl },
  });

  revalidatePath("/admin");
}
