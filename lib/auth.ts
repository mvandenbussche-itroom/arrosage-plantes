import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_KEY_LENGTH = 64;
const ALLOWED_EMAIL_DOMAIN = "@itroom.fr";

// Hash "à blanc" utilisé quand l'email n'existe pas, pour que verifyPassword
// prenne le même temps que pour un email existant (évite l'énumération de
// comptes par timing sur le formulaire de connexion).
export const DUMMY_PASSWORD_HASH = `${"0".repeat(32)}:${scryptSync("dummy", "0".repeat(32), PASSWORD_KEY_LENGTH).toString("hex")}`;

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Vérifie que l'email appartient au domaine autorisé pour l'inscription.
 *
 * @param email Adresse email saisie par l'utilisateur.
 *
 * @return true si l'email se termine par @itroom.fr (insensible à la casse).
 */
export function isAllowedSignupEmail(email: string): boolean {
  return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}

/**
 * Dérive un hash de mot de passe salé (scrypt). Format stocké : "salt:hash".
 *
 * @param password Mot de passe en clair.
 *
 * @return Le hash à stocker en base.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Vérifie un mot de passe en clair contre un hash stocké, en temps constant.
 *
 * @param password Mot de passe saisi.
 * @param storedHash Hash enregistré en base (format "salt:hash").
 *
 * @return true si le mot de passe correspond.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  const storedBuffer = Buffer.from(hash, "hex");

  return storedBuffer.length === derivedKey.length && timingSafeEqual(storedBuffer, derivedKey);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Crée une session en base pour l'utilisateur et pose le cookie httpOnly
 * correspondant. Le cookie contient le token brut, seul son hash est stocké
 * en base (une fuite de la base ne permet pas de rejouer les sessions).
 *
 * @param userId Identifiant de l'utilisateur qui vient de s'authentifier.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Supprime la session courante : en base et côté cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

// Mémoïsé par requête (React cache) : plusieurs pages/composants peuvent
// appeler getCurrentUser() sans multiplier les lectures en base.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return { id: session.user.id, name: session.user.name, email: session.user.email };
});

/**
 * Garde d'accès pour les pages qui nécessitent d'être connecté (création et
 * édition de plantes). Redirige vers /login en conservant l'URL demandée.
 *
 * @param next Chemin vers lequel revenir après connexion.
 *
 * @return L'utilisateur courant, jamais null (redirige sinon).
 */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return user;
}
