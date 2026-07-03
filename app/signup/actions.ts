"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, isAllowedSignupEmail } from "@/lib/auth";

export type SignupState = {
  status: "idle" | "error";
  message?: string;
};

const MIN_PASSWORD_LENGTH = 8;

// Crée un compte et connecte immédiatement l'utilisateur. Réservé aux emails
// @itroom.fr (outil interne) — cf. discussion produit sur l'accès aux comptes.
export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = (formData.get("name") ?? "").toString().trim();
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const password = (formData.get("password") ?? "").toString();

  if (!name || !email || !password) {
    return { status: "error", message: "Tous les champs sont obligatoires." };
  }
  if (!isAllowedSignupEmail(email)) {
    return { status: "error", message: "L'inscription est réservée aux emails @itroom.fr." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      status: "error",
      message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { status: "error", message: "Un compte existe déjà avec cet email." };
  }

  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    userId = user.id;
  } catch (err) {
    // Course entre deux inscriptions concurrentes sur le même email : la
    // contrainte unique en base rattrape ce que le check ci-dessus a manqué.
    console.error("signup failed", err);
    return { status: "error", message: "Un compte existe déjà avec cet email." };
  }

  await createSession(userId);
  redirect("/admin");
}
