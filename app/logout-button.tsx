import { logout } from "./auth-actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-foreground/60 hover:text-itroom"
      >
        Déconnexion
      </button>
    </form>
  );
}
