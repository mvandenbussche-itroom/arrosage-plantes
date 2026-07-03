import { sendMail } from "./mailer";
import { prisma } from "./prisma";
import { formatDueDelay, getStatus } from "./status";

// Destinataire des alertes de retard d'arrosage.
const NOTIFY_TO = "mvandenbussche@itroom.fr";

// Vérifie l'état du parc et, s'il y a des plantes EN RETARD, envoie un récap
// par email. Le statut n'est pas stocké : on le recalcule ici (source de vérité
// unique = lib/status.ts). Appelée par le cron quotidien (cf. instrumentation.ts).
export async function notifyOverduePlants(): Promise<{
  overdue: number;
  sent: boolean;
}> {
  const plants = await prisma.plant.findMany({ include: { waterings: true } });
  const now = new Date();

  const overdue = plants
    .map((plant) => ({ plant, computed: getStatus(plant, now) }))
    .filter(({ computed }) => computed.status === "late")
    // Les plus en retard d'abord.
    .sort((a, b) => a.computed.daysUntilDue - b.computed.daysUntilDue);

  if (overdue.length === 0) {
    console.log("[notify] Aucune plante en retard, pas d'email.");
    return { overdue: 0, sent: false };
  }

  const lines = overdue.map(
    ({ plant, computed }) =>
      `• ${plant.name} — ${plant.location} (${formatDueDelay(computed.daysUntilDue)})`,
  );

  const plural = overdue.length > 1;
  const subject = `🌵 ${overdue.length} plante${plural ? "s" : ""} en retard d'arrosage`;
  const text = [
    "Bonjour,",
    "",
    `${overdue.length} plante${plural ? "s ont" : " a"} besoin d'être arrosée${plural ? "s" : ""} :`,
    "",
    ...lines,
    "",
    "Ouvre le tableau de bord pour agir : arrose et scanne 💧",
    "",
    "— Arrosage des plantes itroom",
  ].join("\n");

  await sendMail({ to: NOTIFY_TO, subject, text });
  console.log(`[notify] Email envoyé (${overdue.length} plante(s) en retard).`);
  return { overdue: overdue.length, sent: true };
}
