"use client";

import { useActionState, useState } from "react";
import { updatePlant, type UpdatePlantState } from "../actions";
import { PlantAvatar } from "@/app/plant-avatar";

const initialState: UpdatePlantState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-itroom";

export function EditPlantForm({
  plantId,
  name,
  location,
  frequencyDays,
  imageUrl,
}: {
  plantId: string;
  name: string;
  location: string;
  frequencyDays: number;
  imageUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updatePlant,
    initialState,
  );
  // Coche "supprimer la photo" désactivée dès qu'on choisit un nouveau
  // fichier : les deux actions n'ont pas de sens combinées.
  const [removeImage, setRemoveImage] = useState(false);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <input type="hidden" name="plantId" value={plantId} />

      <div className="flex items-center gap-4">
        <PlantAvatar imageUrl={removeImage ? null : imageUrl} name={name} size="lg" />
        {imageUrl && (
          <label className="flex items-center gap-2 text-sm text-foreground/60">
            <input
              type="checkbox"
              name="removeImage"
              checked={removeImage}
              onChange={(e) => setRemoveImage(e.target.checked)}
            />
            Supprimer la photo
          </label>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-foreground/60">
          Nom
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={name}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm text-foreground/60">
          Emplacement
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          defaultValue={location}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="frequencyDays" className="text-sm text-foreground/60">
          Fréquence d&apos;arrosage (jours)
        </label>
        <input
          id="frequencyDays"
          name="frequencyDays"
          type="number"
          min={1}
          required
          defaultValue={frequencyDays}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="image" className="text-sm text-foreground/60">
          {imageUrl ? "Remplacer la photo" : "Photo (optionnel)"}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files?.length) setRemoveImage(false);
          }}
          className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-itroom-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-itroom`}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-itroom px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-itroom-dark disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>

      {state.status === "error" && (
        <p className="text-sm font-medium text-status-late" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
