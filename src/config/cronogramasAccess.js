/** Beta temporário — liberar Cronogramas só pra estes emails */
export const CRONOGRAMAS_BETA_EMAILS = [
  'wesleyandrade.adm@gmail.com',
  'luan@elevacursos.com.br',
];

export function hasCronogramasAccess(user) {
  if (!user?.email) return false;
  return CRONOGRAMAS_BETA_EMAILS.includes(user.email.toLowerCase());
}
