import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-itroom">
          Créer un compte
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Réservé aux adresses @itroom.fr
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
