import prisma from '../config/database.js';
import { syncUserSubscriptionCache } from '../utils/subscriptionUtils.js';

// Mapeamento de product_ids para tipos de assinatura.
// IMPORTANTE: cada ID deve aparecer em apenas UM plano.
const PRODUCT_MAPPING = {
  // Aluno Clube do Pedrão
  'Aluno Clube do Pedrão': [35416, 35418, 35413, 47507, 47485],
  // Aluno Clube dos Cascas
  'Aluno Clube dos Cascas': [19479, 4252, 28237, 28239, 28240, 45748],
};

/**
 * Identifica o tipo de assinatura baseado nos product_ids
 * @param {Array} lineItems - Array de line_items do WooCommerce
 * @returns {string|null} - Tipo de assinatura identificado ou null
 */
function identifySubscriptionType(lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return null;
  }

  // Extrair todos os product_ids do pedido
  const productIds = lineItems
    .map(item => item.product_id)
    .filter(id => id != null);

  if (productIds.length === 0) {
    return null;
  }

  console.log('🔍 Product IDs encontrados:', productIds);

  // Verificar se algum produto pertence ao "Aluno Clube dos Cascas"
  // (tem mais produtos, então verificar primeiro)
  const cascasProducts = PRODUCT_MAPPING['Aluno Clube dos Cascas'];
  const hasCascasProduct = productIds.some(id => cascasProducts.includes(id));

  if (hasCascasProduct) {
    console.log('✅ Tipo identificado: Aluno Clube dos Cascas');
    return 'Aluno Clube dos Cascas';
  }

  // Verificar se algum produto pertence ao "Aluno Clube do Pedrão"
  const pedraoProducts = PRODUCT_MAPPING['Aluno Clube do Pedrão'];
  const hasPedraoProduct = productIds.some(id => pedraoProducts.includes(id));

  if (hasPedraoProduct) {
    console.log('✅ Tipo identificado: Aluno Clube do Pedrão');
    return 'Aluno Clube do Pedrão';
  }

  console.log('⚠️ Nenhum product_id identificado');
  return null;
}

/**
 * Extrai dados do payload nativo do WooCommerce
 * @param {Object} payload - Payload do webhook
 * @returns {Object|null} - { email, full_name, subscription_type } ou null se inválido
 */
function extractWooCommerceData(payload) {
  // Verificar se é payload nativo do WooCommerce
  if (!payload.status || !payload.billing) {
    return null;
  }

  // Processar apenas pedidos completos
  if (payload.status !== 'completed') {
    console.log(`ℹ️ Pedido ${payload.id} ignorado - status: ${payload.status}`);
    return { skip: true, reason: `Status não é 'completed': ${payload.status}` };
  }

  // Extrair email
  const email = payload.billing?.email;
  if (!email) {
    console.error('❌ Email não encontrado no billing');
    return { error: true, message: 'Email não encontrado no billing' };
  }

  // Extrair nome completo
  const firstName = payload.billing?.first_name || '';
  const lastName = payload.billing?.last_name || '';
  const full_name = `${firstName} ${lastName}`.trim();

  if (!full_name) {
    console.error('❌ Nome completo não encontrado no billing');
    return { error: true, message: 'Nome completo não encontrado no billing' };
  }

  // Identificar tipo de assinatura
  const subscription_type = identifySubscriptionType(payload.line_items);

  return {
    email,
    full_name,
    subscription_type
  };
}

/**
 * Extrai dados do formato antigo (compatibilidade)
 * @param {Object} payload - Payload do webhook
 * @returns {Object|null} - { email, full_name, subscription_type } ou null se inválido
 */
function extractLegacyData(payload) {
  const { email, full_name, subscription_type } = payload;

  if (!email || !full_name) {
    return null;
  }

  return {
    email,
    full_name,
    subscription_type
  };
}

// WooCommerce Webhook - Registrar novo aluno
export const woocommerceNewStudent = async (req, res) => {
  try {
    console.log('📦 Webhook WooCommerce recebido');
    console.log('📋 Payload (resumo):', {
      id: req.body.id,
      status: req.body.status,
      has_billing: !!req.body.billing,
      has_line_items: Array.isArray(req.body.line_items),
      line_items_count: req.body.line_items?.length || 0
    });

    let userData = null;

    // Tentar extrair dados do formato nativo do WooCommerce
    const wooCommerceData = extractWooCommerceData(req.body);
    
    if (wooCommerceData?.skip) {
      // Pedido não é "completed" - retornar 200 e encerrar (não é erro)
      console.log(`ℹ️ Webhook ignorado: ${wooCommerceData.reason}`);
      return res.status(200).json({
        message: 'Webhook recebido mas não processado',
        reason: wooCommerceData.reason
      });
    }

    if (wooCommerceData?.error) {
      // Erro na extração (email não encontrado)
      console.error('❌ Erro ao extrair dados:', wooCommerceData.message);
      return res.status(400).json({
        error: wooCommerceData.message
      });
    }

    if (wooCommerceData) {
      // Dados extraídos do formato nativo
      userData = wooCommerceData;
      
      // Se nenhum product_id foi identificado, retornar 200 e ignorar
      if (!userData.subscription_type) {
        console.log('ℹ️ Nenhum product_id identificado - webhook ignorado');
        return res.status(200).json({
          message: 'Webhook recebido mas nenhum product_id identificado',
          product_ids: req.body.line_items?.map(item => item.product_id) || []
        });
      }
    } else {
      // Tentar formato antigo (compatibilidade)
      userData = extractLegacyData(req.body);
      
      if (!userData) {
        console.error('❌ Webhook: Formato não reconhecido');
        return res.status(400).json({
          error: 'Formato de payload não reconhecido. Esperado: formato WooCommerce nativo ou formato legado { email, full_name, subscription_type }'
        });
      }
    }

    const { email, full_name, subscription_type } = userData;

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Webhook: Email inválido:', email);
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    console.log('📝 Dados extraídos:', {
      email,
      full_name,
      subscription_type
    });

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️ Webhook: Usuário já existe:', email);
      
      // Atualizar dados se necessário (nome ou subscription_type mudou)
      const updateData = {};
      if (full_name && full_name !== existingUser.full_name) {
        updateData.full_name = full_name;
      }
      if (subscription_type && subscription_type !== existingUser.subscription_type) {
        updateData.subscription_type = subscription_type;
      }

      // Se houver mudanças, atualizar
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await prisma.user.update({
          where: { email },
          data: updateData,
          select: {
            id: true,
            email: true,
            full_name: true,
            subscription_type: true,
            first_login: true,
            created_at: true
          }
        });
        
        console.log('✅ Webhook: Usuário atualizado:', updatedUser.email);
        return res.status(200).json({
          message: 'Usuário atualizado com sucesso',
          user: updatedUser,
          updated: true
        });
      }

      return res.status(200).json({
        message: 'Usuário já existe',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          full_name: existingUser.full_name,
          subscription_type: existingUser.subscription_type
        },
        updated: false
      });
    }

    // Criar novo usuário
    const newUser = await prisma.user.create({
      data: {
        email,
        full_name,
        subscription_type: subscription_type || 'Aluno Clube do Pedrão',
        role: 'user',
        first_login: true,
        password_hash: null // Será definido no primeiro acesso
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        subscription_type: true,
        first_login: true,
        created_at: true
      }
    });

    console.log('✅ Webhook: Novo usuário criado:', newUser.email);

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      user: newUser
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Prisma unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Email já cadastrado',
        field: error.meta?.target?.[0]
      });
    }

    res.status(500).json({ 
      error: 'Erro ao processar webhook',
      details: error.message 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// subscriptionWebhook
//
// Processa webhooks do WooCommerce Subscriptions (criada / atualizada / deletada).
//
// O que faz:
//   • Extrai id, status e email do payload
//   • Localiza o usuário pelo email (se não encontrado → 200 silencioso)
//   • Atualiza user.subscription_status e user.subscription_active
//   • Faz upsert na tabela subscriptions (mantém compatibilidade com o histórico)
//
// Configuração no WooCommerce:
//   Tópico : Subscription created | Subscription updated | Subscription deleted
//   URL    : POST /api/webhook/subscription
//   Segredo: WOO_WEBHOOK_SECRET (opcional, mas recomendado)
// ─────────────────────────────────────────────────────────────────────────────
export const subscriptionWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const topic   = req.headers['x-wc-webhook-topic'] ?? 'subscription.unknown';

    console.log('📋 Subscription Webhook recebido:', {
      id:     payload.id,
      status: payload.status,
      topic,
      email:  payload.billing?.email,
    });

    // Email obrigatório
    const email = payload.billing?.email?.toLowerCase().trim();
    if (!email) {
      console.warn('⚠️ Subscription Webhook: email não encontrado no payload');
      return res.status(200).json({ message: 'Webhook recebido — email ausente, ignorado' });
    }

    // Buscar usuário; se não existir, retornar 200 sem erro
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`ℹ️ Subscription Webhook: usuário ${email} não encontrado — ignorando`);
      return res.status(200).json({ message: 'Usuário não encontrado — webhook ignorado' });
    }

    // Normalizar status
    const VALID_STATUSES = new Set([
      'active', 'pending-cancel', 'on-hold', 'cancelled', 'expired', 'pending',
    ]);
    const status         = VALID_STATUSES.has(payload.status) ? payload.status : 'inactive';
    const isActive       = ['active', 'pending-cancel'].includes(status);
    const wooId          = payload.id ? String(payload.id) : null;

    // Atualizar cache do usuário
    await prisma.user.update({
      where: { email },
      data:  {
        subscription_status: status,
        subscription_active: isActive,
      },
    });

    // Upsert na tabela subscriptions (mantém compatibilidade com o histórico)
    if (wooId) {
      await prisma.subscription.upsert({
        where:  { woo_subscription_id: wooId },
        update: { status, updated_at: new Date() },
        create: {
          user_id:             user.id,
          woo_subscription_id: wooId,
          status,
          started_at:          new Date(),
        },
      });
    }

    console.log(`✅ Subscription Webhook: ${email} → status=${status} ativo=${isActive}`);

    return res.status(200).json({
      message:             'Subscription processada com sucesso',
      email,
      status,
      subscription_active: isActive,
    });

  } catch (error) {
    console.error('❌ Subscription Webhook error:', error);
    if (error.code === 'P2002') {
      return res.status(200).json({ message: 'Subscription já processada (idempotente)' });
    }
    res.status(500).json({ error: 'Erro ao processar subscription webhook' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// _planNameToSubscriptionType
// Converte o nome do plano WC Memberships para o subscription_type interno.
// ─────────────────────────────────────────────────────────────────────────────
function _planNameToSubscriptionType(planName) {
  if (!planName) return 'Aluno Clube do Pedrão';
  const lower = planName.toLowerCase();
  if (lower.includes('cascas'))                          return 'Aluno Clube dos Cascas';
  if (lower.includes('pedrão') || lower.includes('pedrao')) return 'Aluno Clube do Pedrão';
  return 'Aluno Clube do Pedrão'; // padrão
}

// ─────────────────────────────────────────────────────────────────────────────
// membershipWebhook
//
// Processa webhooks do WooCommerce Memberships (associação criada / atualizada / deletada).
//
// O que faz:
//   • Extrai email, status, plan.name e end_date do payload
//   • Localiza o usuário pelo email (se não encontrado → 200 silencioso)
//   • Atualiza os campos membership_* no modelo User
//   • Evento "deleted" → força membership_active = false
//
// Configuração no WooCommerce:
//   Tópico : User Membership created | User Membership updated | User Membership deleted
//   URL    : POST /api/webhook/membership
//   Segredo: WOO_MEMBERSHIP_WEBHOOK_SECRET (opcional, mas recomendado)
//
// Campos atualizados no User:
//   membership_status     → status bruto do WC Memberships
//   membership_active     → true apenas quando status === "active"
//   membership_expires_at → data de expiração (null = sem prazo)
//   membership_plan       → nome do plano (ex.: "Clube dos Cascas")
// ─────────────────────────────────────────────────────────────────────────────
export const membershipWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const topic   = req.headers['x-wc-webhook-topic'] ?? '';

    // ── Estrutura real do payload WooCommerce Memberships ──────────────────
    // Campos relevantes confirmados nos logs:
    //   id, customer_id, plan_id, plan_name, status, order_id, product_id,
    //   start_date, start_date_gmt, end_date, end_date_gmt,
    //   cancelled_date, cancelled_date_gmt
    // IMPORTANTE: NÃO há campo de email — precisamos buscar pelo order_id.
    console.log('🎫 Membership Webhook recebido:', {
      id:          payload?.id,
      customer_id: payload?.customer_id,
      order_id:    payload?.order_id,
      plan_name:   payload?.plan_name,
      status:      payload?.status,
      end_date:    payload?.end_date,
      topic,
    });

    const isDeleted =
      topic.toLowerCase().includes('deleted') ||
      payload?.status === 'deleted';

    // ── Localizar usuário pelo order_id (via tabela subscriptions) ─────────
    // O WC Memberships NÃO envia email no payload.
    // Estratégia: buscar a subscription gerada pelo order webhook (order_id
    // corresponde ao woo_order_id registrado quando o pedido foi completado).
    let user = null;
    const orderId = payload?.order_id ? String(payload.order_id) : null;

    if (orderId) {
      const sub = await prisma.subscription.findFirst({
        where:   { woo_order_id: orderId },
        include: { user: true },
      });
      if (sub?.user) {
        user = sub.user;
        console.log(`✅ Usuário encontrado via order_id ${orderId}: ${user.email}`);
      }
    }

    // ── Fallback: WooCommerce REST API ────────────────────────────────────
    // Ativado quando o usuário não é encontrado pelo order_id.
    // Usa WC REST API para buscar email + nome pelo customer_id.
    // Se o usuário não existir no banco → CRIA automaticamente.
    //
    // Requer no .env do Render:
    //   WOO_SITE_URL        = https://gramatiquecursos.com
    //   WOO_CONSUMER_KEY    = ck_xxxxxxxxxxxxxxxx
    //   WOO_CONSUMER_SECRET = cs_xxxxxxxxxxxxxxxx
    if (!user && payload?.customer_id) {
      if (process.env.WOO_CONSUMER_KEY && process.env.WOO_CONSUMER_SECRET) {
        try {
          const site   = (process.env.WOO_SITE_URL ?? 'https://gramatiquecursos.com').replace(/\/$/, '');
          const apiUrl = `${site}/wp-json/wc/v3/customers/${payload.customer_id}`;
          const auth   = Buffer.from(
            `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_CONSUMER_SECRET}`
          ).toString('base64');

          console.log(`🔍 Consultando WC API para customer_id=${payload.customer_id}...`);

          const response = await fetch(apiUrl, {
            headers: { Authorization: `Basic ${auth}` },
            signal:  AbortSignal.timeout(8000), // timeout de 8s
          });

          if (response.ok) {
            const customer      = await response.json();
            const custEmail     = customer.email?.toLowerCase().trim();
            const custFirstName = customer.first_name ?? '';
            const custLastName  = customer.last_name  ?? '';
            const custFullName  = `${custFirstName} ${custLastName}`.trim();

            if (custEmail) {
              // 1. Tentar encontrar usuário já existente
              user = await prisma.user.findUnique({ where: { email: custEmail } });

              if (user) {
                console.log(`✅ Usuário encontrado via WC API: ${custEmail}`);

              } else if (custFullName) {
                // 2. Criar automaticamente — o membership chegou antes do order.completed
                const subscriptionType = _planNameToSubscriptionType(payload.plan_name);
                user = await prisma.user.create({
                  data: {
                    email:               custEmail,
                    full_name:           custFullName,
                    subscription_type:   subscriptionType,
                    subscription_status: 'pending', // será atualizado após processar membership
                    role:                'user',
                    first_login:         true,
                    password_hash:       null,
                  },
                });
                console.log(`✅ Usuário CRIADO via WC API (chegou antes do order.completed): ${custEmail}`);
              } else {
                console.warn(`⚠️ WC API: email ${custEmail} encontrado mas sem nome — não é possível criar usuário`);
              }
            }
          } else {
            console.warn(`⚠️ WC API respondeu ${response.status} para customer_id=${payload.customer_id}`);
          }
        } catch (apiError) {
          console.warn('⚠️ Falha ao consultar WooCommerce API:', apiError.message);
        }
      } else {
        console.warn(
          '⚠️ WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET não configurados no .env — fallback WC API desabilitado.',
        );
      }
    }

    if (!user) {
      console.warn(
        `⚠️ Membership Webhook: usuário não encontrado e não foi possível criar — ` +
        `order_id=${orderId}, customer_id=${payload?.customer_id}`,
      );
      return res.status(200).json({ message: 'Usuário não encontrado — webhook ignorado' });
    }

    // ── Evento de exclusão / remoção da membership ────────────────────────
    if (isDeleted) {
      await prisma.user.update({
        where: { id: user.id },
        data:  { membership_active: false, membership_status: 'deleted' },
      });
      console.log(`✅ Membership Webhook: membership removida para ${user.email}`);
      return res.status(200).json({ message: 'Membership removida com sucesso', email: user.email });
    }

    // ── Extrair dados do payload (campos reais confirmados nos logs) ───────
    const status   = payload?.status ?? 'inactive';
    const isActive = status === 'active';

    // plan_name vem como campo direto (não como plan.name)
    const planName = payload?.plan_name ?? null;

    // Datas: preferir _gmt para ter o UTC correto
    const rawEndDate   = payload?.end_date_gmt   ?? payload?.end_date   ?? null;
    const rawStartDate = payload?.start_date_gmt ?? payload?.start_date ?? null;

    const endDate   = rawEndDate   ? new Date(rawEndDate)   : null;
    const startDate = rawStartDate ? new Date(rawStartDate) : null;

    const validEndDate   = endDate   && !isNaN(endDate.getTime())   ? endDate   : null;
    const validStartDate = startDate && !isNaN(startDate.getTime()) ? startDate : null;

    // ── Atualizar campos de membership no usuário ─────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data:  {
        membership_status:     status,
        membership_active:     isActive,
        membership_expires_at: validEndDate,
        ...(planName && { membership_plan: planName }),
      },
    });

    // ── Atualizar subscription com as datas de expiração ──────────────────
    // Garante que expires_at e started_at sejam preenchidos na tabela subscriptions
    if (orderId) {
      const existingSub = await prisma.subscription.findFirst({
        where: { woo_order_id: orderId },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data:  {
            status,
            expires_at:  validEndDate,
            started_at:  validStartDate ?? existingSub.started_at,
            updated_at:  new Date(),
          },
        });
        console.log(`✅ Subscription ${existingSub.id} atualizada com expires_at=${validEndDate?.toISOString() ?? 'null'}`);
      } else {
        // Subscription ainda não existe (membership chegou antes do order) — criar
        await prisma.subscription.create({
          data: {
            user_id:          user.id,
            woo_order_id:     orderId,
            status,
            subscription_type: planName ?? user.subscription_type ?? 'Aluno Clube do Pedrão',
            started_at:        validStartDate ?? new Date(),
            expires_at:        validEndDate,
          },
        });
        console.log(`✅ Subscription criada via membership webhook (order_id: ${orderId})`);
      }
    }

    // ── Sincronizar cache subscription_status + subscription_active ────────
    await syncUserSubscriptionCache(prisma, user.id);

    console.log(
      `✅ Membership Webhook: ${user.email} → status=${status} ativo=${isActive} ` +
      `plano="${planName}" expira=${validEndDate?.toISOString() ?? 'sem prazo'}`,
    );

    return res.status(200).json({
      message:               'Membership processada com sucesso',
      email:                 user.email,
      status,
      membership_active:     isActive,
      membership_plan:       planName,
      membership_expires_at: validEndDate?.toISOString() ?? null,
    });

  } catch (error) {
    console.error('❌ Membership Webhook error:', error);
    res.status(500).json({ error: 'Erro ao processar membership webhook' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// testWebhook
// ─────────────────────────────────────────────────────────────────────────────
// Webhook de teste
export const testWebhook = async (req, res) => {
  res.json({
    message: 'Webhook está funcionando!',
    timestamp: new Date().toISOString(),
    body: req.body
  });
};

