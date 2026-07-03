import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";

// Prisma 7 : le client utilise le query compiler + un driver adapter.
// Pour du SQLite local, on branche better-sqlite3 sur le fichier DATABASE_URL.
const url = process.env.DATABASE_URL ?? "file:./dev.db";

// Singleton : évite d'ouvrir une nouvelle connexion à chaque hot-reload en dev.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
