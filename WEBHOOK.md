# Configuração de Webhook — E-Questões × WooCommerce

## URL base da API
```
https://e-questoes-api.onrender.com
```

---

## Visão geral

O E-Questões usa **1 webhook** do WooCommerce. Quando um pedido é concluído, o sistema cria automaticamente o usuário com acesso liberado. Não há renovação automática, membership plugin nem subscription plugin.

```
Cliente compra no WooCommerce
        │
        ▼
Pedido muda para "completed"
        │
        ▼
WooCommerce dispara webhook
POST /api/webhook/woocommerce
        │
        ▼
Sistema cria o usuário (subscription_active = true)
        │
        ▼
Usuário acessa app.equestoes.com.br
Define a senha no primeiro acesso → plataforma liberada
```

---

## Configuração no WooCommerce

**Caminho:** `WooCommerce > Configurações > Avançado > Webhooks > Adicionar Webhook`

| Campo | Valor |
|---|---|
| Nome | E-Questões — Pedido concluído |
| Status | **Ativo** |
| Tópico | **Order updated** |
| URL de entrega | `https://e-questoes-api.onrender.com/api/webhook/woocommerce` |
| Segredo | *(mesmo valor de `WOO_WEBHOOK_SECRET` configurado no Render)* |
| Versão da API | WP REST API Integration v3 |

> O tópico **Order updated** cobre tanto pedidos novos (`created`) quanto atualizações. O sistema filtra automaticamente e processa apenas pedidos com `status = completed`.

---

## Variável de ambiente (Render)

| Variável | Descrição |
|---|---|
| `WOO_WEBHOOK_SECRET` | Segredo gerado pelo WooCommerce. Cole o mesmo valor aqui e no campo "Segredo" do webhook. |

**Onde configurar:** `Render > seu serviço de API > Environment > Add Environment Variable`

---

## Product IDs mapeados

Todos os produtos abaixo concedem acesso como **Aluno Eleva**:

```
1084, 1093, 1101, 1191, 1602, 1635, 1638, 1783,
2098, 2357, 2359, 2361, 2363, 2365, 2372, 2377,
2382, 2387, 2452
```

Para adicionar um novo produto, edite o array em:
```
backend/src/utils/subscriptionUtils.js  →  PRODUCT_MAPPING['Aluno Eleva']
```

---

## O que o sistema faz ao receber o webhook

### Usuário novo (primeira compra)
- Cria o usuário com `first_login = true` e `subscription_active = true`
- A senha **não é definida** — o usuário a define no primeiro acesso à plataforma
- Registra o pedido na tabela `subscriptions` para histórico

### Usuário já existente (recompra)
- Reativa o acesso (`subscription_active = true`)
- Atualiza nome e tipo de assinatura se houver mudança

### Pedido ignorado
- Status diferente de `completed` → retorna 200 sem fazer nada
- Product IDs não reconhecidos → retorna 200 com log dos IDs recebidos

---

## Teste do endpoint

```bash
# Health check — verifica se o servidor está respondendo
curl https://e-questoes-api.onrender.com/api/webhook/test

# Simular um pedido (para testes manuais — sem verificação de assinatura)
curl -X POST https://e-questoes-api.onrender.com/api/webhook/woocommerce \
  -H "Content-Type: application/json" \
  -d '{
    "id": 9999,
    "status": "completed",
    "billing": {
      "email": "teste@email.com",
      "first_name": "Aluno",
      "last_name": "Teste"
    },
    "line_items": [
      { "product_id": 1084 }
    ]
  }'
```

---

## Resposta esperada do webhook

**Novo usuário criado:**
```json
{
  "message": "Pedido processado com sucesso",
  "email": "aluno@email.com",
  "subscription_type": "Aluno Eleva",
  "action": "created"
}
```

**Usuário já existente (acesso reativado):**
```json
{
  "message": "Pedido processado com sucesso",
  "email": "aluno@email.com",
  "subscription_type": "Aluno Eleva",
  "action": "updated"
}
```

**Pedido ignorado (status diferente de completed):**
```json
{
  "message": "Webhook recebido mas ignorado",
  "reason": "Status \"processing\" não é \"completed\""
}
```
