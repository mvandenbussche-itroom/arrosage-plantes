// Abstraction d'envoi d'email. Implémentation actuelle : MOCK (on logge le mail
// dans la console au lieu de l'envoyer). L'interface est volontairement stable
// pour brancher un vrai provider (Resend / SMTP nodemailer) plus tard sans
// toucher au code appelant : il suffira de remplacer le corps de sendMail().

export type Mail = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMail(mail: Mail): Promise<void> {
  console.log("\n📧 ───────── MAIL (mock, non envoyé) ─────────");
  console.log(`À     : ${mail.to}`);
  console.log(`Objet : ${mail.subject}`);
  console.log("");
  console.log(mail.text);
  console.log("─────────────────────────────────────────────\n");
}
