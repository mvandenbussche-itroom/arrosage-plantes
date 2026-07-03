import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

// Stockage local sous public/ : servi directement par Next, aucune
// dépendance externe. Nécessite un volume persistant en déploiement pour
// survivre aux redéploiements.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "plants");
const PUBLIC_PREFIX = "/uploads/plants/";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class InvalidPlantImageError extends Error {}

/**
 * Valide et enregistre la photo de profil d'une plante sur le disque.
 *
 * @param file Fichier image reçu depuis un formulaire (FormData).
 *
 * @return Le chemin public de l'image (à stocker dans Plant.imageUrl).
 *
 * @throws InvalidPlantImageError Si le format ou la taille du fichier n'est pas autorisé.
 */
export async function savePlantImage(file: File): Promise<string> {
  const extension = ALLOWED_MIME_EXTENSIONS[file.type];
  if (!extension) {
    throw new InvalidPlantImageError(
      "Format d'image non supporté (JPEG, PNG ou WebP uniquement).",
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new InvalidPlantImageError("L'image dépasse la taille maximale de 5 Mo.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `${PUBLIC_PREFIX}${filename}`;
}

/**
 * Supprime une photo de profil précédemment enregistrée par savePlantImage.
 * Ignore silencieusement les URLs hors de ce dossier (ex: photos ajoutées
 * manuellement dans public/plants/) ou déjà absentes du disque.
 *
 * @param imageUrl Chemin public de l'image à supprimer.
 */
export async function deletePlantImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith(PUBLIC_PREFIX)) {
    return;
  }

  // basename() neutralise tout `..` ou séparateur de chemin injecté.
  const filename = path.basename(imageUrl);
  const filePath = path.join(UPLOAD_DIR, filename);

  await unlink(filePath).catch(() => {});
}
