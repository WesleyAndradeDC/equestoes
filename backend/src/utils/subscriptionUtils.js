/**
 * subscriptionUtils.js
 * Utilitários compartilhados para controle de assinaturas.
 * Usado pelos controllers de order e subscription webhook.
 */

// ─── Mapeamento de produto → tipo de assinatura ────────────────────────────
// IDs exclusivos de cada plano — NÃO devem se sobrepor.
// Cada product_id deve pertencer a apenas um plano.
export const PRODUCT_MAPPING = {
  // Clube do Pedrão — acesso restrito a Língua Portuguesa
  'Aluno Clube do Pedrão':    [35416, 35418, 35413, 47507, 47485],
  // Clube dos Cascas — acesso completo a todas as disciplinas
  // Inclui PRF 2026 (47818) que concede o mesmo acesso do Cascas
  'Aluno Clube dos Cascas':   [19479, 4252, 28237, 28239, 28240, 45748, 47818],
  // Banco do Brasil — acesso completo igual ao Cascas (produto específico BB)
  'Aluno Banco do Brasil':    [47825],
};

// ─── Status que concedem acesso à plataforma ──────────────────────────────
// active        = assinatura ativa e em dia
// pending-cancel = cancelamento agendado, mas ainda vigente até o fim do período
export const ACTIVE_STATUSES = new Set(['active', 'pending-cancel']);

// ─── Mapeamento de status WooCommerce → status interno ───────────────────
export const WOO_STATUS_MAP = {
  active:           'active',
  'pending-cancel': 'pending-cancel',
  'on-hold':        'on-hold',
  cancelled:        'cancelled',
  expired:          'expired',
  pending:          'pending',
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Identifica o tipo de assinatura baseado nos product_ids dos line_items.
 * Prioridade: Cascas > BB > Pedrão (do acesso mais amplo para o mais restrito)
 */
export function identifySubscriptionType(lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return null;

  const ids = lineItems
    .map((item) => Number(item.product_id))
    .filter((id) => !isNaN(id) && id > 0);

  if (ids.length === 0) return null;

  // Clube dos Cascas — acesso total (inclui PRF 2026)
  if (ids.some((id) => PRODUCT_MAPPING['Aluno Clube dos Cascas'].includes(id))) {
    return 'Aluno Clube dos Cascas';
  }
  // Banco do Brasil — acesso total igual ao Cascas
  if (ids.some((id) => PRODUCT_MAPPING['Aluno Banco do Brasil'].includes(id))) {
    return 'Aluno Banco do Brasil';
  }
  // Clube do Pedrão — acesso restrito a Língua Portuguesa
  if (ids.some((id) => PRODUCT_MAPPING['Aluno Clube do Pedrão'].includes(id))) {
    return 'Aluno Clube do Pedrão';
  }

  return null;
}

/**
 * Converte uma string de data do WooCommerce em um objeto Date.
 * Retorna null para datas inválidas ou "zeroed" (0000-00-00).
 */
export function parseWooDate(dateString) {
  if (!dateString) return null;
  const s = String(dateString).trim();
  if (s === '' || s.startsWith('0000-00-00')) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Normaliza um status vindo do WooCommerce para nosso status interno.
 * Retorna 'inactive' para status desconhecidos.
 */
export function normalizeWooStatus(rawStatus) {
  const s = String(rawStatus ?? '').toLowerCase().trim();
  return WOO_STATUS_MAP[s] ?? 'inactive';
}

/**
 * Retorna true se o status concede acesso à plataforma.
 */
export function isSubscriptionActive(status) {
  return ACTIVE_STATUSES.has(status);
}

/**
 * Sincroniza o cache de subscription_status no registro do usuário.
 * Sempre reflete a assinatura mais relevante (ativa > mais recente).
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @returns {Promise<object|null>} - Assinatura ativa ou null
 */
export async function syncUserSubscriptionCache(prisma, userId) {
  // Busca a assinatura ativa mais recente
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      user_id: userId,
      status: { in: [...ACTIVE_STATUSES] },
    },
    orderBy: { updated_at: 'desc' },
  });

  if (activeSubscription) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscription_status: activeSubscription.status,
        subscription_active: true, // ← cache booleano para acesso rápido no middleware
        subscription_type:   activeSubscription.subscription_type ?? undefined,
      },
    });
    return activeSubscription;
  }

  // Sem assinatura ativa → pega o status da última (para exibir: cancelled, expired, etc.)
  const latestSubscription = await prisma.subscription.findFirst({
    where: { user_id: userId },
    orderBy: { updated_at: 'desc' },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscription_status: latestSubscription?.status ?? 'inactive',
      subscription_active: false, // ← sem assinatura ativa
    },
  });

  return null;
}
