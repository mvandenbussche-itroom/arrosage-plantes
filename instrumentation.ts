// Next.js appelle register() une fois au démarrage du serveur. On y planifie le
// cron qui vérifie les retards d'arrosage et envoie l'email (cf. lib/notify.ts).
//
// Doc : node_modules/next/dist/docs/01-app/02-guides/instrumentation.md

// Évite une double planification si register() est ré-évalué (hot reload dev).
declare global {
  // eslint-disable-next-line no-var
  var __overdueCronStarted: boolean | undefined;
}

export async function register() {
  // register() tourne aussi dans le runtime edge : le cron (Node, accès BDD)
  // ne doit s'exécuter que côté Node.js.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (globalThis.__overdueCronStarted) return;
  globalThis.__overdueCronStarted = true;

  const cron = (await import("node-cron")).default;
  const { notifyOverduePlants } = await import("./lib/notify");

  const run = () =>
    notifyOverduePlants().catch((e) =>
      console.error("[notify] échec de la vérification:", e),
    );

  // Tous les jours à 9h00 (heure du serveur).
  cron.schedule("0 9 * * *", run);
  console.log(
    "[cron] Vérification des retards d'arrosage planifiée : tous les jours à 9h.",
  );

  // Pour la démo : une vérification ~5 s après le démarrage, histoire de voir
  // l'email (mock) tout de suite sans attendre 9h. Désactivable avec
  // NOTIFY_ON_BOOT=false dans .env.
  if (process.env.NOTIFY_ON_BOOT !== "false") {
    setTimeout(run, 5000);
  }
}
