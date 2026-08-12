/** Acesso ao módulo Cronogramas — liberado para todos os usuários autenticados */
export function hasCronogramasAccess(user) {
  return !!user;
}
