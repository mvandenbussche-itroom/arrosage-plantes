import { subDays } from "date-fns";
import { prisma } from "../lib/prisma";

// Statut (rappel, non stocké — calculé à l'affichage) :
//   now <  nextDue                     -> "à jour"    (vert)
//   now >= nextDue et retard < 1 jour  -> "à arroser" (orange)
//   now >= nextDue + 1 jour            -> "en retard" (rouge)
//   nextDue = dernier arrosage (ou createdAt) + frequencyDays
//
// On force ci-dessous une date de dernier arrosage pour couvrir les 3 couleurs.
const now = new Date();

const plants = [
  {
    name: "Monstera",
    location: "2e étage - open space Nord",
    frequencyDays: 7,
    // arrosée il y a 2 jours -> prochaine échéance dans 5 jours -> VERT (à jour)
    lastWateredDaysAgo: 2,
  },
  {
    name: "Ficus Lyrata",
    location: "1er étage - accueil",
    frequencyDays: 5,
    // arrosée il y a 5 jours -> échéance aujourd'hui -> ORANGE (à arroser)
    lastWateredDaysAgo: 5,
  },
  {
    name: "Pothos",
    location: "3e étage - cuisine",
    frequencyDays: 4,
    // arrosée il y a 8 jours -> 4 jours de retard -> ROUGE (en retard)
    lastWateredDaysAgo: 8,
  },
  {
    name: "Cactus",
    location: "2e étage - salle de réunion Sud",
    frequencyDays: 14,
    // jamais arrosée : pas de Watering, on s'appuie sur createdAt (VERT)
    lastWateredDaysAgo: null,
  },
];

async function main() {
  // Repartir propre à chaque exécution (Watering supprimé en cascade).
  await prisma.plant.deleteMany();

  for (const p of plants) {
    const plant = await prisma.plant.create({
      data: {
        name: p.name,
        location: p.location,
        frequencyDays: p.frequencyDays,
      },
    });

    if (p.lastWateredDaysAgo !== null) {
      await prisma.watering.create({
        data: {
          plantId: plant.id,
          wateredAt: subDays(now, p.lastWateredDaysAgo),
        },
      });
    }

    console.log(`  ✓ ${p.name} (${p.location})`);
  }
}

main()
  .then(() => console.log(`\n🌱 Seed terminé : ${plants.length} plantes.`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
