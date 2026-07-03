"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type QrScannerType from "qr-scanner";

// Bouton flottant présent sur toutes les pages : ouvre la caméra arrière,
// décode le QR collé sur le pot et redirige directement vers la fiche de la
// bonne plante. C'est le raccourci "je scanne depuis l'appli" en complément
// du scan natif (appareil photo du téléphone qui ouvre le lien du QR).
//
// Important : nécessite un contexte sécurisé (HTTPS, ou localhost en dev).
// navigator.mediaDevices n'est exposé par le navigateur que dans ces
// conditions — sur un simple http://<ip-locale>:3000, la caméra ne
// s'ouvrira pas (limitation navigateur, pas un bug de l'appli).
export function ScanFab() {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScannerType | null>(null);

  // Décodage : identité stable (useCallback) pour pouvoir être référencée par
  // l'effet ci-dessous sans le relancer à chaque rendu.
  const handleDecode = useCallback(
    (data: string) => {
      const path = extractPlantPath(data);
      if (!path) {
        setError("QR non reconnu, réessaie.");
        return;
      }
      setOpen(false);
      router.push(path);
    },
    [router],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function start() {
      // setState ici (dans le callback async, pas au niveau racine de l'effet)
      // pour éviter les rendus en cascade au montage de l'effet.
      setStarting(true);
      setError(null);

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError(
          "Caméra indisponible : il faut un navigateur récent et une connexion sécurisée (HTTPS ou localhost).",
        );
        setStarting(false);
        return;
      }

      // Import dynamique : la lib touche la caméra/le DOM, elle ne doit
      // jamais être évaluée côté serveur (SSR) — seulement dans le navigateur.
      // Le worker (décodage QR) est chargé automatiquement par Next/Turbopack
      // via son propre import() interne, pas besoin de le configurer.
      const { default: QrScanner } = await import("qr-scanner");

      if (cancelled || !videoRef.current) return;

      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleDecode(result.data),
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        },
      );
      scannerRef.current = scanner;

      try {
        await scanner.start();
      } catch {
        if (!cancelled) {
          setError(
            "Impossible d'accéder à la caméra. Vérifie l'autorisation dans les réglages du navigateur.",
          );
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [open, handleDecode]);

  // Ferme la modale avec Échap (accessibilité clavier).
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Scanner un QR code"
        // bottom/right calculés avec env(safe-area-inset-*) : sur téléphone,
        // un simple "bottom-6" tombe dans la zone du geste système (barre
        // d'accueil iPhone, geste retour Android) et les taps n'atteignent
        // jamais le bouton. Nécessite viewportFit: "cover" dans layout.tsx.
        className="fixed z-40 flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-itroom text-white shadow-lg transition active:scale-95"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
          right: "calc(env(safe-area-inset-right, 0px) + 1.5rem)",
        }}
      >
        <CameraIcon />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
          >
            <p id={titleId} className="text-sm font-medium text-white">
              Scanner le QR d&apos;une plante
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full text-xl text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          </div>

          <div
            className="px-4 pt-4 text-center"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          >
            {error ? (
              <p className="text-sm font-medium text-status-late">{error}</p>
            ) : (
              <p className="text-sm text-white/70">
                {starting
                  ? "Ouverture de la caméra…"
                  : "Vise le QR code collé sur le pot."}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Le QR encode l'URL complète de la fiche plante (ex. https://host/plant/xxx).
// On extrait juste le chemin pour rester robuste même si l'hôte scanné diffère
// (IP locale vs domaine de prod) — voir plan technique §8 sur BASE_URL.
function extractPlantPath(data: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(data).pathname;
  } catch {
    pathname = data;
  }
  return /^\/plant\/[^/]+\/?$/.test(pathname) ? pathname : null;
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
