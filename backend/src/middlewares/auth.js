/**
 * auth.js - Middlewares de autenticacao e autorizacao
 *
 * Exporta:
 *   authenticate              - Valida JWT e carrega req.user
 *   requireAdmin              - Bloqueia se nao for admin
 *   requireProfessor          - Bloqueia se nao for professor ou admin
 *   requireActiveSubscription - Bloqueia se assinatura nao estiver ativa
 */

import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { ACTIVE_STATUSES } from '../utils/subscriptionUtils.js';

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
        id:                  true,
        email:               true,
        full_name:           true,
        role:                true,
        subscription_type:   true,
        subscription_status: true,
        study_streak:        true,
        last_study_date:     true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario nao encontrado' });
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
// Regras:
//   - Admin                   -> acesso irrestrito
//   - active | pending-cancel -> acesso permitido
//   - qualquer outro status   -> 403 com mensagem descritiva
// Uso (apos authenticate):
//   router.get('/rota', authenticate, requireActiveSubscription, handler)
export const requireActiveSubscription = (req, res, next) => {
  const { role, subscription_status } = req.user;

  if (role === 'admin') return next();

  if (ACTIVE_STATUSES.has(subscription_status)) return next();

  const statusMessages = {
    cancelled:          'Sua assinatura foi cancelada. Renove para continuar acessando.',
    expired:            'Sua assinatura expirou. Renove para continuar acessando.',
    'on-hold':          'Sua assinatura esta pausada por pendencia de pagamento.',
    pending:            'Aguardando confirmacao do pagamento.',
    'pending-cancel':   'Sua assinatura esta ativa ate o fim do periodo.',
    inactive:           'Voce nao possui uma assinatura ativa.',
  };

  const message = statusMessages[subscription_status] ?? 'Acesso negado: assinatura nao ativa.';

  return res.status(403).json({
    error:               'Assinatura inativa',
    message,
    subscription_status,
    action:              'subscribe',
  });
};
