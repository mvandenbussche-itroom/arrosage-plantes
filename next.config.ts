import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Origines autorisées à joindre le serveur de dev (téléphones sur le LAN +
  // tunnel https ngrok utilisé pour la démo). Les wildcards sont supportés.
  allowedDevOrigins: [
    "192.168.2.159",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.app",
  ],

  experimental: {
    serverActions: {
      // Sans ça, le bouton "J'ai arrosé" (Server Action) est rejeté quand la
      // page est ouverte via le domaine ngrok : Next compare l'Origin au Host.
      // ngrok gratuit utilise aujourd'hui le suffixe *.ngrok-free.dev.
      allowedOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.app"],
    },
  },
};

export default nextConfig;
