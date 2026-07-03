import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { ScanFab } from "./scan-fab";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arrosage des plantes — itroom",
  description:
    "Suivi de l'arrosage des plantes du bureau. Scannez, arrosez, c'est à jour.",
};

// Le viewport (width=device-width...) est déjà défini par défaut par Next.js.
// On ajoute la couleur de la barre du navigateur mobile (charte itroom),
// color-scheme pour éviter un rendu sombre inattendu des champs/scrollbars
// (le design est volontairement clair uniquement), et viewportFit: "cover"
// qui active les variables env(safe-area-inset-*) sur iOS — indispensable
// pour que le bouton de scan (fixed, en bas de l'écran) ne se retrouve pas
// sous la zone du geste système (barre d'accueil iPhone / geste Android).
export const viewport: Viewport = {
  themeColor: "#145a8e",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-itroom-bleu.png"
                alt="itroom"
                width={132}
                height={44}
                priority
                className="h-8 w-auto"
              />
              <span className="hidden text-sm font-medium text-foreground/50 sm:inline">
                / Arrosage des plantes
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/" className="text-foreground/60 hover:text-itroom">
                Tableau de bord
              </Link>
              <Link href="/admin" className="text-foreground/60 hover:text-itroom">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
          {children}
        </main>
        <ScanFab />
      </body>
    </html>
  );
}
