# 📚 Documentação Completa da API - G-Concursos

Base URL: `http://localhost:5000/api` (desenvolvimento)

## 📋 Índice

- [Autenticação](#autenticação)
- [Questões](#questões)
- [Tentativas](#tentativas)
- [Cadernos](#cadernos)
- [Comentários](#comentários)
- [Usuários](#usuários)
- [Tutor](#tutor)

---

## 🔐 Autenticação

### POST `/auth/register`
Registrar novo usuário.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "full_name": "Nome Completo",
  "subscription_type": "Aluno Clube dos Cascas"
}
```

**Resposta (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "full_name": "Nome Completo",
    "role": "user",
    "subscription_type": "Aluno Clube dos Cascas",
    "study_streak": 0,
    "last_study_date": null,
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### POST `/auth/login`
Fazer login.

**Body:**
```json
{
  "email": "admin@gconcursos.com",
  "password": "admin123"
}
```

**Resposta (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@gconcursos.com",
    "full_name": "Administrador",
    "role": "admin",
    "subscription_type": "Professor"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### GET `/auth/me`
Obter dados do usuário logado.

**Headers:** `Authorization: Bearer {token}`

**Resposta (200):**
```json
{
  "id": "uuid",
  "email": "admin@gconcursos.com",
  "full_name": "Administrador",
  "role": "admin",
  "subscription_type": "Professor",
  "study_streak": 5,
  "last_study_date": "2025-01-10",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

### PUT `/auth/me`
Atualizar dados do usuário logado.

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "full_name": "Novo Nome",
  "study_streak": 10,
  "last_study_date": "2025-01-10"
}
```

### POST `/auth/logout`
Fazer logout (apenas confirmação, token removido no cliente).

**Headers:** `Authorization: Bearer {token}`

**Resposta (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

### POST `/auth/refresh`
Renovar access token.

**Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Resposta (200):**
```json
{
  "accessToken": "novo-jwt-token",
  "refreshToken": "novo-refresh-token"
}
```

---

## 📝 Questões

### GET `/questions`
Listar questões.

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `discipline` (opcional): Filtrar por disciplina
- `difficulty` (opcional): Filtrar por dificuldade (Fácil, Médio, Difícil)
- `question_type` (opcional): Filtrar por tipo
- `limit` (opcional): Limitar resultados
- `offset` (opcional): Paginação

**Exemplo:** `/questions?discipline=Língua Portuguesa&difficulty=Médio&limit=10`

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "code": "LP0001",
    "text": "Enunciado da questão...",
    "discipline": "Língua Portuguesa",
    "difficulty": "Médio",
    "exam_board": "CESPE",
    "year": 2024,
    "position": "Analista",
    "option_a": "Alternativa A",
    "option_b": "Alternativa B",
    "option_c": "Alternativa C",
    "option_d": "Alternativa D",
    "option_e": "Alternativa E",
    "correct_answer": "A",
    "explanation": "Explicação detalhada...",
    "question_type": "Múltipla Escolha",
    "subjects": ["Crase", "Regência"],
    "created_by": "professor@email.com",
    "created_date": "2025-01-01T00:00:00.000Z"
  }
]
```

### GET `/questions/:id`
Obter uma questão específica.

**Headers:** `Authorization: Bearer {token}`

### POST `/questions`
Criar questão (Professor/Admin apenas).

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "text": "Enunciado da questão...",
  "discipline": "Língua Portuguesa",
  "difficulty": "Médio",
  "exam_board": "CESPE",
  "year": 2024,
  "position": "Analista",
  "option_a": "Alternativa A",
  "option_b": "Alternativa B",
  "option_c": "Alternativa C",
  "option_d": "Alternativa D",
  "option_e": "Alternativa E",
  "correct_answer": "A",
  "explanation": "Explicação...",
  "question_type": "Múltipla Escolha",
  "subjects": ["Crase", "Regência"],
  "code": "LP0001"
}
```

### PUT `/questions/:id`
Atualizar questão (Professor/Admin apenas).

**Headers:** `Authorization: Bearer {token}`

**Body:** (todos os campos são opcionais)
```json
{
  "text": "Novo enunciado...",
  "difficulty": "Difícil"
}
```

### DELETE `/questions/:id`
Deletar questão (Professor/Admin apenas).

**Headers:** `Authorization: Bearer {token}`

---

## ✍️ Tentativas (Attempts)

### GET `/attempts`
Listar tentativas.

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `order`: Ordenação (padrão: `-created_date`)
- `limit`: Limitar resultados
- `question_id`: Filtrar por questão

**Exemplo:** `/attempts?order=-created_date&limit=1000`

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "question_id": "uuid-questao",
    "user_id": "uuid-usuario",
    "chosen_answer": "A",
    "is_correct": true,
    "answered_at": "2025-01-10T10:30:00.000Z",
    "created_date": "2025-01-10T10:30:00.000Z",
    "created_by": "usuario@email.com"
  }
]
```

### POST `/attempts`
Registrar tentativa de resposta.

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "question_id": "uuid-questao",
  "chosen_answer": "A",
  "is_correct": true,
  "answered_at": "2025-01-10T10:30:00.000Z"
}
```

### GET `/attempts/me`
Obter tentativas do usuário logado.

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `limit`, `offset`: Paginação

---

## 📓 Cadernos (Notebooks)

### GET `/notebooks`
Listar cadernos.

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `created_by`: Filtrar por criador (email)

**Exemplo:** `/notebooks?created_by=usuario@email.com`

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "name": "Questões de Sintaxe",
    "description": "Caderno com questões...",
    "color": "blue",
    "created_by": "usuario@email.com",
    "created_date": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-10T00:00:00.000Z",
    "question_ids": ["uuid1", "uuid2", "uuid3"]
  }
]
```

### GET `/notebooks/:id`
Obter caderno específico.

**Headers:** `Authorization: Bearer {token}`

### POST `/notebooks`
Criar caderno.

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "name": "Meu Caderno",
  "description": "Descrição opcional",
  "color": "blue",
  "question_ids": ["uuid1", "uuid2"]
}
```

### PUT `/notebooks/:id`
Atualizar caderno.

**Headers:** `Authorization: Bearer {token}`

**Body:** (todos os campos são opcionais)
```json
{
  "name": "Novo Nome",
  "color": "red",
  "question_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### DELETE `/notebooks/:id`
Deletar caderno.

**Headers:** `Authorization: Bearer {token}`

---

## 💬 Comentários

### GET `/comments`
Listar comentários.

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `question_id`: Filtrar por questão (obrigatório na prática)
- `order`: Ordenação (padrão: `-created_date`)

**Exemplo:** `/comments?question_id=uuid-questao&order=-created_date`

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "question_id": "uuid-questao",
    "user_id": "uuid-usuario",
    "text": "Excelente questão!",
    "author_name": "João Silva",
    "author_role": "Professor",
    "created_date": "2025-01-10T10:00:00.000Z"
  }
]
```

### POST `/comments`
Criar comentário.

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "question_id": "uuid-questao",
  "text": "Meu comentário aqui...",
  "author_name": "João Silva",
  "author_role": "Professor"
}
```

> **Nota:** `author_name` e `author_role` são opcionais. Se não fornecidos, usam dados do usuário logado.

### DELETE `/comments/:id`
Deletar comentário (apenas owner ou admin).

**Headers:** `Authorization: Bearer {token}`

---

## 👥 Usuários (Admin apenas)

### GET `/users`
Listar todos os usuários.

**Headers:** `Authorization: Bearer {token}` (Admin)

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "email": "usuario@email.com",
    "full_name": "Nome Completo",
    "role": "user",
    "subscription_type": "Aluno Clube dos Cascas",
    "study_streak": 5,
    "last_study_date": "2025-01-10",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

### GET `/users/:id`
Obter usuário específico.

**Headers:** `Authorization: Bearer {token}` (Admin)

### PUT `/users/:id`
Atualizar usuário.

**Headers:** `Authorization: Bearer {token}` (Admin)

**Body:**
```json
{
  "full_name": "Novo Nome",
  "role": "admin",
  "subscription_type": "Professor"
}
```

### DELETE `/users/:id`
Deletar usuário.

**Headers:** `Authorization: Bearer {token}` (Admin)

> **Nota:** Não é possível deletar o próprio usuário.

---

## 🤖 Tutor (LLM)

### POST `/tutor/invoke`
Invocar LLM para obter resposta do Tutor Gramatique.

**Headers:** `Authorization: Bearer {token}`

**Permissão:** Admin, Professor ou Aluno Clube dos Cascas

**Body:**
```json
{
  "prompt": "Quando usar crase antes de palavras femininas?"
}
```

**Resposta (200):**
```json
"A crase é usada antes de palavras femininas quando há a fusão da preposição 'a' com o artigo feminino 'a'. Por exemplo: 'Vou à escola' (vou a + a escola)..."
```

---

## 🚨 Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 429 | Muitas requisições (rate limit) |
| 500 | Erro do servidor |

## 🔑 Tipos de Subscription

- `Professor` - Pode criar e editar questões, acessar tutor
- `Aluno Clube dos Cascas` - Acesso completo, incluindo tutor
- `Aluno Clube do Pedrão` - Acesso restrito a Língua Portuguesa

## 🔒 Níveis de Permissão

- **Público:** Nenhum
- **Autenticado:** Questões, Tentativas, Cadernos, Comentários
- **Professor:** Criar/Editar Questões, Tutor
- **Admin:** Gerenciar Usuários, tudo mais

---

## 📌 Notas Importantes

1. **Todos os endpoints protegidos** requerem o header `Authorization: Bearer {token}`
2. **Tokens expiram** após 7 dias (access) ou 30 dias (refresh)
3. **O campo `created_by`** nos notebooks e questions é o email do usuário
4. **Arrays `question_ids` e `subjects`** são gerenciados pelo backend
5. **Filtros** são case-sensitive
6. **Ordenação** usa `-` para descendente (ex: `-created_date`)

## 🧪 Testando com cURL

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gconcursos.com","password":"admin123"}' \
  | jq -r '.accessToken')

# Listar questões
curl http://localhost:5000/api/questions \
  -H "Authorization: Bearer $TOKEN"

# Criar tentativa
curl -X POST http://localhost:5000/api/attempts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "uuid-da-questao",
    "chosen_answer": "A",
    "is_correct": true
  }'
```

