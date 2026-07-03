import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

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
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-5 py-4">
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
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
