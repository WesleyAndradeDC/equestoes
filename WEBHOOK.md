# Configuração de Webhooks — E-Questões × WooCommerce

## URL base da API
```
https://e-questoes-api.onrender.com
```

---

## Visão geral

O E-Questões utiliza **3 webhooks** do WooCommerce para automatizar o cadastro e controle de acesso dos alunos. Cada webhook cumpre um papel distinto:

| Webhook | Plugin WooCommerce | O que faz |
|---|---|---|
| Order | WooCommerce (nativo) | Cria o usuário quando um pedido é concluído |
| Subscription | WooCommerce Subscriptions | Controla se o pagamento está em dia |
| Membership | WooCommerce Memberships | Controla se o acesso ao plano está ativo |

---

## Webhook 1 — Order (Pedido)

> Cria ou atualiza o usuário na primeira compra. Serve como fallback quando o Subscriptions não está configurado.

**Caminho:** `WooCommerce > Configurações > Avançado > Webhooks > Adicionar Webhook`

| Campo | Valor |
|---|---|
| Nome | E-Questões — Pedido concluído |
| Status | Ativo |
| Tópico | **Order updated** |
| URL de entrega | `https://e-questoes-api.onrender.com/api/webhook/woocommerce` |
| Segredo | *(valor da variável `WOO_WEBHOOK_SECRET` no Render)* |
| Versão da API | WP REST API Integration v3 |

**O que acontece:**
1. WooCommerce envia o payload quando um pedido muda de status
2. O sistema ignora pedidos que não estejam com status `completed`
3. Identifica o `subscription_type` pelos `product_id` dos itens do pedido
4. Se o usuário não existir → **cria** com `first_login = true` (sem senha)
5. Se o usuário já existir → **atualiza** nome e tipo de assinatura se necessário
6. Registra a subscription na tabela `subscriptions`

---

## Webhook 2 — Subscription (Assinatura)

> Fonte da verdade para controle de pagamento. Dispara a cada renovação, cancelamento ou expiração.

**Caminho:** `WooCommerce Subscriptions > Configurações > Webhooks`

| Campo | Valor |
|---|---|
| Nome | E-Questões — Assinatura (todos os eventos) |
| Status | Ativo |
| Tópico | **Subscription updated** *(cobre created + updated + cancelled + expired)* |
| URL de entrega | `https://e-questoes-api.onrender.com/api/webhook/subscription` |
| Segredo | *(valor da variável `WOO_WEBHOOK_SECRET` no Render)* |
| Versão da API | WP REST API Integration v3 |

**O que acontece:**
1. Recebe o novo status da assinatura (`active`, `cancelled`, `expired`, etc.)
2. Normaliza e salva em `users.subscription_status`
3. Atualiza `users.subscription_active` (true apenas para `active` e `pending-cancel`)
4. Faz upsert na tabela `subscriptions` com histórico de mudanças
5. Sincroniza o cache do usuário (`syncUserSubscriptionCache`)

**Status reconhecidos:**

| Status WooCommerce | Acesso liberado? |
|---|---|
| `active` | ✅ Sim |
| `pending-cancel` | ✅ Sim (ainda vigente) |
| `on-hold` | ❌ Não (falha de pagamento) |
| `cancelled` | ❌ Não |
| `expired` | ❌ Não |
| `pending` | ❌ Não |

---

## Webhook 3 — Membership (Associação)

> Controla se o acesso ao plano está ativo. Dispara ao criar, atualizar ou excluir uma associação.

**Caminho:** `WooCommerce Memberships > Configurações > Webhooks`

| Campo | Valor |
|---|---|
| Nome | E-Questões — Membership criada |
| Status | Ativo |
| Tópico | **User Membership created** |
| URL de entrega | `https://e-questoes-api.onrender.com/api/webhook/membership` |
| Segredo | *(valor da variável `WOO_MEMBERSHIP_WEBHOOK_SECRET` no Render)* |

Repita para os tópicos **User Membership updated** e **User Membership deleted** com a mesma URL.

**O que acontece:**
1. Recebe o payload (sem email — usa `order_id` para localizar o usuário)
2. Fallback: consulta a WC REST API pelo `customer_id` se o usuário não for encontrado
3. Atualiza `membership_status`, `membership_active` e `membership_expires_at`
4. Atualiza `expires_at` na tabela `subscriptions`

> **Nota:** O payload do WooCommerce Memberships **não contém email**. Por isso o sistema cruza o `order_id` com a tabela `subscriptions`. Para o fallback via REST API funcionar, configure as variáveis `WOO_CONSUMER_KEY` e `WOO_CONSUMER_SECRET` no Render.

---

## Variáveis de ambiente (Render)

Configure em: **Render > seu serviço de API > Environment**

| Variável | Descrição | Obrigatória |
|---|---|---|
| `WOO_WEBHOOK_SECRET` | Segredo dos webhooks de Order e Subscription | Recomendado |
| `WOO_MEMBERSHIP_WEBHOOK_SECRET` | Segredo do webhook de Membership | Recomendado |
| `WOO_SITE_URL` | URL do site WooCommerce (ex: `https://equestoes.com.br`) | Para fallback |
| `WOO_CONSUMER_KEY` | Chave da WC REST API (ex: `ck_xxx`) | Para fallback |
| `WOO_CONSUMER_SECRET` | Segredo da WC REST API (ex: `cs_xxx`) | Para fallback |

**Como gerar a WC REST API Key:**
`WordPress > WooCommerce > Configurações > Avançado > REST API > Adicionar chave`
- Usuário: seu usuário admin
- Permissões: **Leitura**

---

## Product IDs mapeados

Todos os produtos abaixo concedem o plano **Aluno Eleva**:

```
35416, 35418, 35413, 47507, 47485,
19479, 4252, 28237, 28239, 28240, 45748, 47818,
47825
```

Para adicionar um novo produto, edite o array em:
`backend/src/utils/subscriptionUtils.js` → `PRODUCT_MAPPING['Aluno Eleva']`

---

## Fluxo completo de uma nova venda

```
Aluno compra no WooCommerce
        │
        ▼
[Order webhook] → POST /api/webhook/woocommerce
  • Cria usuário com first_login=true
  • Cria registro na tabela subscriptions
        │
        ▼
[Subscription webhook] → POST /api/webhook/subscription
  • Atualiza subscription_status = "active"
  • Atualiza subscription_active = true
        │
        ▼
[Membership webhook] → POST /api/webhook/membership
  • Atualiza membership_active = true
  • Define membership_expires_at
        │
        ▼
Aluno acessa https://app.equestoes.com.br
  • Informa o e-mail → recebe link de primeiro acesso
  • Define a senha → acesso liberado
```

---

## Teste dos endpoints

```bash
# Health check
curl https://e-questoes-api.onrender.com/api/webhook/test

# Simular order webhook (payload legado para testes)
curl -X POST https://e-questoes-api.onrender.com/api/webhook/woocommerce \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","full_name":"Aluno Teste","subscription_type":"Aluno Eleva","status":"completed"}'
```
