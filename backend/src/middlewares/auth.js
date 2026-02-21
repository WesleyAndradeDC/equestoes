/**
 * auth.js - Middlewares de autenticacao e autorizacao
 *
 * Exporta:
 *   authenticate              - Valida JWT e carrega req.user
 *   requireAdmin              - Bloqueia se nao for admin
 *   requireProfessor          - Bloqueia se nao for professor ou admin
 *   requireActiveSubscription - Bloqueia se assinatura nao estiver ativa
 *
 * NOTA SOBRE MIGRACAO:
 *   O campo subscription_status soh e selecionado do banco SE a coluna
 *   ja existir (apos SQL_SUBSCRIPTION_MIGRATION.sql ser executado).
 *   Enquanto isso, requireActiveSubscription libera todos os usuarios
 *   autenticados (comportamento identico ao sistema anterior).
 */

import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Status que concedem acesso a plataforma
const ACTIVE_STATUSES = new Set(['active', 'pending-cancel']);

// authenticate
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticacao nao fornecido' });
    }

    const token   = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where:  { id: decoded.userId },
      select: {
        id:                true,
        email:             true,
        full_name:         true,
        role:              true,
        subscription_type: true,
        study_streak:      true,
        last_study_date:   true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario nao encontrado' });
    }

    // Tenta buscar subscription_status se a coluna ja existir no banco.
    // Apos rodar SQL_SUBSCRIPTION_MIGRATION.sql, isto sempre funciona.
    try {
      const userWithStatus = await prisma.user.findUnique({
        where:  { id: decoded.userId },
        select: { subscription_status: true },
      });
      user.subscription_status = userWithStatus?.subscription_status ?? null;
    } catch {
      // Coluna ainda nao existe (pre-migracao): subscription_status = null
      // requireActiveSubscription trata null como "liberar acesso"
      user.subscription_status = null;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Erro ao verificar token' });
  }
};

// requireAdmin
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Requer permissoes de administrador.' });
  }
  next();
};

// requireProfessor
export const requireProfessor = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.subscription_type !== 'Professor') {
    return res.status(403).json({ error: 'Acesso negado. Requer permissoes de professor.' });
  }
  next();
};

// requireActiveSubscription
// Verifica assinatura ativa antes de acessar conteudo protegido.
//
// Comportamento:
//   - Admin                          -> acesso irrestrito
//   - subscription_status = null     -> acesso permitido (pre-migracao)
//   - active | pending-cancel        -> acesso permitido
//   - cancelled, expired, on-hold... -> 403 com mensagem descritiva
//
// Uso (apos authenticate):
//   router.get('/rota', authenticate, requireActiveSubscription, handler)
export const requireActiveSubscription = (req, res, next) => {
  const { role, subscription_status } = req.user;

  // Admins sempre tem acesso
  if (role === 'admin') return next();

  // Pre-migracao ou campo nao disponivel: libera acesso (nao quebra o sistema)
  if (subscription_status === undefined || subscription_status === null) {
    return next();
  }

  // Assinatura ativa -> permitir
  if (ACTIVE_STATUSES.has(subscription_status)) return next();

  const statusMessages = {
    cancelled:        'Sua assinatura foi cancelada. Renove para continuar acessando.',
    expired:          'Sua assinatura expirou. Renove para continuar acessando.',
    'on-hold':        'Sua assinatura esta pausada por pendencia de pagamento.',
    pending:          'Aguardando confirmacao do pagamento.',
    'pending-cancel': 'Sua assinatura esta ativa ate o fim do periodo.',
    inactive:         'Voce nao possui uma assinatura ativa.',
  };

  const message = statusMessages[subscription_status] ?? 'Acesso negado: assinatura nao ativa.';

  return res.status(403).json({
    error:               'Assinatura inativa',
    message,
    subscription_status,
    action:              'subscribe',
  });
};
