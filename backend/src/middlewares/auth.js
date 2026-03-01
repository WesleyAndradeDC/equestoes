/**
 * auth.js — Middlewares de autenticação e autorização
 *
 * Exporta:
 *   authenticate              → Valida JWT e carrega req.user
 *   requireAdmin              → Bloqueia se não for admin
 *   requireProfessor          → Bloqueia se não for professor ou admin
 *   requireActiveSubscription → Bloqueia se assinatura (subscription_status) não estiver ativa
 *   requireActiveAccess       → Bloqueia se subscription_active OU membership_active for false
 *                               (modelo dual: WooCommerce Subscriptions + WooCommerce Memberships)
 */

import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { ACTIVE_STATUSES } from '../utils/subscriptionUtils.js';

// -----------------------------------------------------------------------------
// authenticate
// Valida o token JWT e carrega o usuário completo em req.user
// -----------------------------------------------------------------------------
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const token   = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where:  { id: decoded.userId },
      select: {
        id:                  true,
        email:               true,
        full_name:           true,
        role:                true,
        subscription_type:   true,
        subscription_status: true,  // Para requireActiveSubscription (status detalhado)
        subscription_active: true,  // Para requireActiveAccess (booleano rapido)
        membership_active:   true,  // Para requireActiveAccess (WC Memberships)
        membership_plan:     true,  // Plano do membership (util para UI)
        study_streak:        true,
        last_study_date:     true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Erro ao verificar token' });
  }
};

// -----------------------------------------------------------------------------
// requireAdmin
// Deve ser usado APOS authenticate
// -----------------------------------------------------------------------------
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Requer permissões de administrador.',
    });
  }
  next();
};

// -----------------------------------------------------------------------------
// requireProfessor
// Permite admin ou professor
// Deve ser usado APOS authenticate
// -----------------------------------------------------------------------------
export const requireProfessor = (req, res, next) => {
  if (
    req.user.role !== 'admin' &&
    req.user.subscription_type !== 'Professor'
  ) {
    return res.status(403).json({
      error: 'Acesso negado. Requer permissões de professor.',
    });
  }
  next();
};

// -----------------------------------------------------------------------------
// requireActiveSubscription
//
// Verifica se o usuário possui uma assinatura ativa (subscription_status).
// Uso: router.get('/rota', authenticate, requireActiveSubscription, handler)
// -----------------------------------------------------------------------------
export const requireActiveSubscription = (req, res, next) => {
  const { role, subscription_status } = req.user;

  if (role === 'admin') return next();
  if (ACTIVE_STATUSES.has(subscription_status)) return next();

  const statusMessages = {
    cancelled:        'Sua assinatura foi cancelada. Renove para continuar acessando.',
    expired:          'Sua assinatura expirou. Renove para continuar acessando.',
    'on-hold':        'Sua assinatura está pausada por pendência de pagamento.',
    pending:          'Aguardando confirmação do pagamento.',
    'pending-cancel': 'Sua assinatura está ativa até o fim do período.',
    inactive:         'Você não possui uma assinatura ativa.',
  };

  const message =
    statusMessages[subscription_status] ??
    'Acesso negado: assinatura não ativa.';

  return res.status(403).json({
    error:               'Assinatura inativa',
    message,
    subscription_status,
    action:              'subscribe',
  });
};

// -----------------------------------------------------------------------------
// requireActiveAccess
//
// Modelo DUAL — verifica subscription_active E membership_active.
// Use este middleware quando o projeto usar TANTO WC Subscriptions
// quanto WC Memberships. Se usar apenas Subscriptions, prefira
// requireActiveSubscription.
//
// Regras:
//   Admin                                  → acesso irrestrito
//   subscription_active && membership_active → acesso liberado
//   Qualquer flag false                    → 403 com motivo especifico
//
// Uso: router.get('/rota', authenticate, requireActiveAccess, handler)
// -----------------------------------------------------------------------------
export const requireActiveAccess = (req, res, next) => {
  const { role, subscription_active, membership_active } = req.user;

  if (role === 'admin') return next();
  if (subscription_active && membership_active) return next();

  let message;
  if (!subscription_active && !membership_active) {
    message = 'Acesso bloqueado: assinatura e associação inativas.';
  } else if (!subscription_active) {
    message = 'Acesso bloqueado: assinatura inativa. Renove sua assinatura para continuar.';
  } else {
    message = 'Acesso bloqueado: associação inativa. Sua membership precisa estar ativa.';
  }

  return res.status(403).json({
    error:               'Acesso bloqueado',
    message,
    subscription_active: subscription_active ?? false,
    membership_active:   membership_active   ?? false,
    action:              'subscribe',
  });
};
