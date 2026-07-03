import Image from "next/image";

const SIZE_CLASSES = {
  sm: "h-11 w-11 text-base",
  // Plus petit par défaut : sur un écran étroit, un avatar 96px laisse trop
  // peu de place au nom de la plante à côté (cf. fiche plante).
  lg: "h-16 w-16 text-xl sm:h-24 sm:w-24 sm:text-3xl",
} as const;

type PlantAvatarSize = keyof typeof SIZE_CLASSES;

/**
 * Photo de profil d'une plante. Sans photo, affiche un rond avec l'initiale
 * du nom plutôt qu'une icône générique : ça reste identifiable au coup d'œil
 * dans une liste.
 */
export function PlantAvatar({
  imageUrl,
  name,
  size = "sm",
}: {
  imageUrl: string | null;
  name: string;
  size?: PlantAvatarSize;
}) {
  const sizeClass = SIZE_CLASSES[size];

  if (!imageUrl) {
    return (
      <div
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-full bg-itroom-light font-semibold text-itroom ${sizeClass}`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  const pixelSize = size === "lg" ? 96 : 44;

  return (
    <Image
      src={imageUrl}
      alt={`Photo de ${name}`}
      width={pixelSize}
      height={pixelSize}
      className={`shrink-0 rounded-full object-cover ${sizeClass}`}
    />
  );
}
