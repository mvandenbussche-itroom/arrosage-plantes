import QRCode from "qrcode";

// URL de base publique encodée dans les QR codes.
// En démo locale, on passe par un tunnel https (ngrok) : mettre l'URL du tunnel
// dans BASE_URL (.env). Fallback localhost pour le dev pur.
export function getBaseUrl(): string {
  return (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

// URL de la fiche d'une plante (cible du QR collé sur le pot).
export function getPlantUrl(plantId: string): string {
  return `${getBaseUrl()}/plant/${plantId}`;
}

// QR généré à la volée (data URL PNG). Déterministe : même URL -> même image.
// Comme on ne stocke rien, changer BASE_URL (http->https, nouvelle URL tunnel)
// met TOUS les QR à jour automatiquement, sans régénération ni staleness.
export async function getPlantQrDataUrl(plantId: string): Promise<string> {
  return QRCode.toDataURL(getPlantUrl(plantId), { width: 320, margin: 2 });
}
