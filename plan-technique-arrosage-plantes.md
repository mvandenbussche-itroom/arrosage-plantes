# Plan technique — Suivi d'arrosage des plantes par QR code

> Hackathon — appli web responsive, Next.js full-stack. Objectif : vue temps réel de l'état d'arrosage du parc de plantes, geste = scanner un QR code sur le pot après arrosage.

---

## 1. Principe fonctionnel

Chaque plante a une fiche + un QR code imprimable collé sur le pot. Le QR encode simplement une URL dédiée (`/plant/<id>` ou `/scan/<id>`). Quand quelqu'un arrose, il scanne → la page s'ouvre → un tap sur « J'ai arrosé » enregistre un événement horodaté → le statut repasse à « à jour ». Un cron recalcule les statuts (à jour / à arroser / en retard) selon la fréquence de chaque plante. Un dashboard affiche l'état global.

Scan anonyme accepté : pas d'auth pour l'utilisateur qui arrose. Une petite protection admin (mot de passe unique) suffit pour créer/éditer les plantes.

---

## 2. Stack recommandée

| Couche | Choix | Pourquoi |
|--------|-------|----------|
| Framework | **Next.js 14/15 (App Router)** | Front + API dans un seul repo, Server Actions, rendu serveur, déploiement 1-clic |
| Langage | TypeScript | Typage des modèles Plante / Arrosage, moins de bugs en hackathon |
| UI | Tailwind CSS (+ shadcn/ui optionnel) | Mobile-first rapide, composants prêts |
| Base de données | **SQLite** via **Prisma** | Stockage léger, zéro serveur DB, fichier unique. Passer à Postgres/Neon si déploiement multi-instance |
| ORM | Prisma | Migrations + client typé en quelques minutes |
| Génération QR | **`qrcode`** (npm, côté serveur) | Génère un PNG/SVG par plante dans une route API |
| Scan | **Aucune lib requise** | Le QR contient une URL → l'appareil photo natif du téléphone ouvre le lien. Pas de scanner à coder |
| Dates | `date-fns` ou `dayjs` | Calcul « prochain arrosage », retards |
| Recalcul statut | Calculé à la volée + optionnel cron **Vercel Cron** | Pas besoin de stocker le statut, il se déduit de `lastWatered + frequency` |
| Déploiement | **Vercel** (ou Docker local sur le réseau agence) | Le plus rapide. Attention : SQLite sur Vercel n'est pas persistant → pour la démo, SQLite local ou Postgres Neon |

> ⚠️ Piège hackathon : si tu déploies sur Vercel, SQLite est éphémère (filesystem read-only/reset). Deux options : (a) démo en local `npm run dev` sur le réseau de l'agence, projeté sur mobile via l'IP locale ; (b) utiliser **Neon/Supabase Postgres** gratuit. Pour un hackathon, le local est souvent le plus simple.

---

## 3. Modèle de données

```prisma
model Plant {
  id            String    @id @default(cuid())
  name          String
  location      String    // ex: "2e étage - open space Nord"
  frequencyDays Int       // fréquence d'arrosage en jours
  createdAt     DateTime  @default(now())
  waterings     Watering[]
}

model Watering {
  id        String   @id @default(cuid())
  plantId   String
  plant     Plant    @relation(fields: [plantId], references: [id], onDelete: Cascade)
  wateredAt DateTime @default(now())
  // pas de user : scan anonyme
}
```

Le **statut** n'est pas stocké, il se calcule :

```
lastWatered = max(waterings.wateredAt)  // ou createdAt si jamais arrosée
nextDue     = lastWatered + frequencyDays
retard      = now - nextDue

status =
  now <  nextDue                       -> "à jour"      (vert)
  now >= nextDue et retard < 1 jour    -> "à arroser"   (orange)
  now >= nextDue + 1 jour              -> "en retard"   (rouge)
```

Avantage : pas de job de recalcul obligatoire, tout se déduit à l'affichage. Le cron sert seulement au bonus (notifs, double ration week-end).

---

## 4. Arborescence des routes

```
/                     → Dashboard global (état du parc, cartes couleur)
/plant/[id]           → Fiche plante + bouton "J'ai arrosé" (page ouverte par le scan)
/admin                → Liste + création/édition de plantes (protégée par mot de passe)
/admin/[id]/qr        → Aperçu + impression du QR

API / Server Actions
  POST /api/plants           → créer une plante
  POST /api/water/[id]       → enregistrer un arrosage (appelé par le bouton)
  GET  /api/plants/[id]/qr   → renvoie le PNG/SVG du QR code
  GET  /api/dashboard        → liste des plantes + statut calculé
```

En App Router tu peux remplacer la plupart des POST par des **Server Actions** (plus simple, moins de boilerplate).

---

## 5. Features — par priorité

### MVP (à finir en premier — c'est le cœur du sujet)
1. **CRUD plante** : nom, localisation, fréquence (jours). Page `/admin`.
2. **Génération QR** : une route renvoie le QR encodant `https://<host>/plant/<id>`. Bouton « Imprimer » (une page A4 avec nom + QR).
3. **Page plante `/plant/[id]`** : affiche nom, localisation, dernier arrosage, statut, gros bouton **« J'ai arrosé 💧 »**.
4. **Enregistrement arrosage** : le bouton crée un `Watering` horodaté → feedback visuel (« Merci, arrosée ! ») → statut repasse vert.
5. **Dashboard `/`** : grille de cartes triées par urgence (en retard en haut), pastille couleur, compteurs globaux (X à jour / Y à arroser / Z en retard).

### Confort (si le MVP est bouclé)
- Filtre par localisation / étage sur le dashboard.
- Tri par urgence, recherche par nom.
- Auto-refresh du dashboard (revalidation Next ou polling léger).
- Impression en lot de tous les QR (planche A4).

### Bonus (hors périmètre — seulement si temps)
- **Double ration week-end/jours fériés** : si `nextDue` tombe un vendredi et fréquence longue, avancer l'alerte / signaler « prévoir double ration ». Utiliser une lib de jours fériés FR (`date-holidays`) + un cron Vercel.
- Notifications (Slack webhook agence : « 3 plantes en retard ce matin »).
- Mini-historique par plante (liste des derniers arrosages — déjà en base, juste à afficher).

---

## 6. Détails d'implémentation clés

**Le scan ne demande AUCUN code.** Le QR contient une URL. L'appareil photo iOS/Android reconnaît le QR et propose d'ouvrir le lien. Tu génères juste l'URL et le QR. (Ne code pas de scanner caméra sauf si tu veux un scan « in-app » — inutile ici.)

**Génération du QR (route API) :**
```ts
// app/api/plants/[id]/qr/route.ts
import QRCode from "qrcode";
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const url = `${process.env.BASE_URL}/plant/${params.id}`;
  const png = await QRCode.toBuffer(url, { width: 512, margin: 2 });
  return new Response(png, { headers: { "Content-Type": "image/png" } });
}
```

**Enregistrer un arrosage (Server Action) :**
```ts
"use server";
export async function water(plantId: string) {
  await prisma.watering.create({ data: { plantId } });
  revalidatePath("/");            // rafraîchit le dashboard
  revalidatePath(`/plant/${plantId}`);
}
```

**Calcul du statut (util partagé) :**
```ts
export function getStatus(lastWatered: Date, frequencyDays: number) {
  const nextDue = addDays(lastWatered, frequencyDays);
  const now = new Date();
  if (now < nextDue) return "up_to_date";
  if (differenceInDays(now, nextDue) < 1) return "due";
  return "overdue";
}
```

**Protection admin minimale :** une variable d'env `ADMIN_PASSWORD` + un cookie, ou un simple middleware sur `/admin`. Suffisant pour un hackathon.

**Mobile-first :** la page `/plant/[id]` doit avoir un bouton énorme, pouce-friendly, chargement rapide. C'est la page la plus utilisée.

---

## 7. Plan de démarrage (ordre concret)

```bash
npx create-next-app@latest arrosage --typescript --tailwind --app
cd arrosage
npm i prisma @prisma/client qrcode date-fns
npm i -D @types/qrcode
npx prisma init --datasource-provider sqlite
# coller le schema.prisma ci-dessus
npx prisma migrate dev --name init
```

Puis, dans l'ordre :
1. Schéma Prisma + migration + un script de seed (3-4 plantes de test).
2. Util `getStatus()` + page `/plant/[id]` avec bouton arroser (Server Action). ← teste le cœur d'abord.
3. Route QR + page `/admin` (liste + création + lien impression).
4. Dashboard `/` avec cartes couleur et compteurs.
5. Polish mobile + impression QR.
6. Si temps → bonus double ration / Slack.

**Répartition si vous êtes plusieurs :** une personne sur le modèle + CRUD/admin + QR, une sur la page plante + dashboard + UI mobile. Le point de contact = le schéma Prisma et `getStatus()`, à figer tôt.

---

## 8. Pièges à éviter

- **`BASE_URL`** doit pointer vers une URL joignable par les téléphones (IP réseau local `http://192.168.x.x:3000`, pas `localhost`) — sinon les QR scannés ne s'ouvrent pas.
- **SQLite non persistant sur Vercel** (voir §2) — démo locale ou Postgres managé.
- Ne stocke pas le statut en base (source de bugs de désync) — calcule-le.
- Garde le scan **sans friction** : le bouton « J'ai arrosé » doit marcher sans login, en 1 tap.
- Pense à un cas « plante jamais arrosée » (utilise `createdAt` comme point de départ).

---

## 9. Démo (pitch de fin)

1. Montrer le dashboard avec des plantes vertes/oranges/rouges.
2. Scanner en live un QR sur un vrai pot avec le téléphone.
3. Taper « J'ai arrosé » → montrer la carte qui repasse verte en temps réel sur le dashboard projeté.
4. Mentionner l'archi légère (SQLite, zéro friction, scan anonyme) et le bonus si implémenté.
