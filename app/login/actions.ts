"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth";

export type LoginState = {
  status: "idle" | "error";
  message?: string;
};

/**
 * Chemin de retour après connexion : uniquement un chemin interne relatif,
 * jamais une URL absolue (évite un redirect open vers un site tiers via le
 * paramètre `next` de l'URL de login).
 *
 * @param next Valeur brute du paramètre `next` du formulaire.
 *
 * @return Un chemin sûr commençant par "/", ou "/admin" par défaut.
 */
function safeRedirectPath(next: FormDataEntryValue | null): string {
  const path = (next ?? "").toString();
  if (path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/admin";
}

// Connecte un utilisateur existant. Message d'erreur volontairement générique
// (email et mot de passe confondus) pour ne pas révéler quels comptes existent.
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const password = (formData.get("password") ?? "").toString();
  const next = safeRedirectPath(formData.get("next"));

  if (!email || !password) {
    return { status: "error", message: "Email et mot de passe sont obligatoires." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordValid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordValid) {
    return { status: "error", message: "Email ou mot de passe incorrect." };
  }

  await createSession(user.id);
  redirect(next);
}
