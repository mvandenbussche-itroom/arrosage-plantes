import { addDays, differenceInCalendarDays } from "date-fns";

// Le statut n'est jamais stocké en base : il se calcule à l'affichage à partir
// du dernier arrosage (ou de la date de création si la plante n'a jamais été
// arrosée) et de la fréquence d'arrosage.
//
//   nextDue = lastWatered + frequencyDays
//   now <  nextDue                        -> "à jour"    (vert)
//   now >= nextDue et retard < 1 jour     -> "à arroser" (orange)
//   now >= nextDue + 1 jour               -> "en retard" (rouge)

export type PlantStatus = "ok" | "due" | "late";

// Forme minimale attendue : compatible avec le modèle Prisma `Plant`
// incluant ses `waterings`, mais volontairement découplée du client généré.
export type PlantForStatus = {
  createdAt: Date;
  frequencyDays: number;
  waterings: { wateredAt: Date }[];
};

export type ComputedStatus = {
  status: PlantStatus;
  label: string;
  lastWatered: Date;
  nextDue: Date;
  // > 0 : nombre de jours restants ; < 0 : nombre de jours de retard ; 0 : aujourd'hui.
  daysUntilDue: number;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getStatus(
  plant: PlantForStatus,
  now: Date = new Date(),
): ComputedStatus {
  // Le dernier arrosage = le plus récent des Watering.
  // La date de création ne sert de point de départ QUE si la plante n'a jamais
  // été arrosée (sinon un ajout récent masquerait un vieux dernier arrosage).
  const lastWatered =
    plant.waterings.length > 0
      ? plant.waterings.reduce<Date>(
          (latest, w) => (w.wateredAt > latest ? w.wateredAt : latest),
          plant.waterings[0].wateredAt,
        )
      : plant.createdAt;

  const nextDue = addDays(lastWatered, plant.frequencyDays);

  let status: PlantStatus;
  if (now.getTime() < nextDue.getTime()) {
    status = "ok";
  } else if (now.getTime() - nextDue.getTime() < ONE_DAY_MS) {
    status = "due";
  } else {
    status = "late";
  }

  const label =
    status === "ok" ? "À jour" : status === "due" ? "À arroser" : "En retard";

  return {
    status,
    label,
    lastWatered,
    nextDue,
    daysUntilDue: differenceInCalendarDays(nextDue, now),
  };
}

// Petit helper d'affichage FR pour le délai (« dans 3 j », « aujourd'hui », « 2 j de retard »).
export function formatDueDelay(daysUntilDue: number): string {
  if (daysUntilDue === 0) return "aujourd'hui";
  if (daysUntilDue > 0) return `dans ${daysUntilDue} j`;
  return `${Math.abs(daysUntilDue)} j de retard`;
}
