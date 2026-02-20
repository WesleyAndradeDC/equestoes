# Correção: Erros 404 após login e "Not Found" no Mobile

## Bugs Encontrados e Corrigidos

---

### Bug 1 — `GraduationCap` não importado em `Login.jsx`

**Sintoma**: A tela de "email não cadastrado" (Etapa 3 do login) crashava silenciosamente.

**Causa**: O componente `GraduationCap` era usado no JSX mas não estava importado:
```jsx
// Antes — INCORRETO (linha 10 de Login.jsx)
import { Loader2, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';

// Depois — CORRETO
import { Loader2, AlertCircle, ExternalLink, CheckCircle, GraduationCap } from 'lucide-react';
```

**Regra para projetos futuros**: Sempre importar todos os ícones antes de usá-los no JSX.

---

### Bug 2 — Dupla navegação `window.location.href` causando `login:1 404`

**Sintoma**:
- Console: `login:1 Failed to load resource: 404`
- Mobile: página não abre / exibe "Not Found"

**Causa (diagrama do fluxo com bug)**:
```
1. Token expira → apiClient.request() recebe 401
2. apiClient tenta refreshToken() → falha
3. apiClient → window.location.href = '/login'  ← NAVEGA 1ª VEZ (hard reload)
4. apiClient → throw new Error('Sessão expirada')
5. checkAuth() catch → authService.logout()
6. logout() → window.location.href = '/login'   ← NAVEGA 2ª VEZ (outro hard reload)
```

Dois `window.location.href` em sequência causam um loop de recarregamento. 
Em mobile (conexão lenta) o browser não consegue processar a segunda navegação e retorna 404.

**Fix aplicado**:

Em `src/lib/apiClient.js` — remover o `window.location.href` do apiClient:
```js
// Antes — INCORRETO
this.removeToken();
window.location.href = '/login'; // ← causava dupla navegação
throw new Error('Sessão expirada. Faça login novamente.');

// Depois — CORRETO
// Apenas remove os tokens. O ProtectedRoute redireciona via React Router (sem hard reload)
this.removeToken();
throw new Error('Sessão expirada. Faça login novamente.');
```

Em `src/services/authService.js` — adicionar `clearAuth()` sem navegação:
```js
// Novo método: limpa tokens sem forçar window.location
clearAuth() {
  apiClient.removeToken();
}

// logout() continua existindo para o botão "Sair" do usuário
logout() {
  apiClient.removeToken();
  window.location.href = '/login';
}
```

Em `src/contexts/AuthContext.jsx` — usar `clearAuth()` em vez de `logout()`:
```js
// Antes — INCORRETO
catch (error) {
  authService.logout(); // causava segunda navegação
}

// Depois — CORRETO
catch (error) {
  authService.clearAuth(); // apenas limpa tokens, sem navegar
  // O ProtectedRoute faz o redirect via React Router (sem 404)
}
```

**Como o ProtectedRoute resolve sem hard reload**:
```jsx
// ProtectedRoute.jsx — quando user === null, usa <Navigate> do React Router
if (!user) {
  return <Navigate to="/login" replace />; // SPA routing, sem reload de página
}
```

---

### Bug 3 — `checkAuth()` deslogava usuário em qualquer erro de rede

**Sintoma**:
- Usuário era deslogado ao atualizar a página quando a API estava em cold start (Render free tier)
- Toda falha de rede causava logout desnecessário

**Causa**: O `catch` do `checkAuth()` chamava `logout()` para QUALQUER erro, incluindo erros de rede.

**Fix aplicado** em `src/contexts/AuthContext.jsx`:
```js
catch (error) {
  const isAuthError =
    error.message?.includes('Sessão expirada') ||
    error.message?.includes('Token') ||
    error.message?.includes('401') ||
    error.message?.includes('Unauthorized');

  if (isAuthError) {
    authService.clearAuth(); // token definitivamente inválido
  } else {
    // Erro de rede: não desloga — API pode estar apenas em cold start
    console.warn('Não foi possível verificar autenticação. Sessão local mantida.');
  }
}
```

**Regra**: Só deslogue o usuário quando houver certeza que o token é inválido (401).
Erros de rede/timeout devem ser tratados de forma diferente.

---

### Bug 4 — `favicon.ico:1 404`

**Sintoma**: Console exibia `favicon.ico:1 Failed to load resource: 404 ()`

**Causa**: 
- O `index.html` apontava o favicon para uma URL externa
- Navegadores sempre fazem uma requisição adicional para `/favicon.ico` como fallback
- Não havia nenhum arquivo em `public/` para atender essa requisição

**Fix aplicado**:

Criado `public/favicon.svg` com o ícone "G" roxo do Gramatique.

Em `index.html`:
```html
<!-- Antes — INCORRETO -->
<link rel="icon" type="image/svg+xml" href="https://gramatiquecursos.com/..." />

<!-- Depois — CORRETO (ícone local) -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="shortcut icon" href="/favicon.svg" />
```

**Regra para projetos futuros**:
- Sempre colocar o favicon em `public/` (Vite copia para `dist/` no build)
- Usar `/favicon.svg` ou `/favicon.ico` (caminhos absolutos)
- Nunca depender de URL externa para o favicon

---

## Resumo dos Arquivos Alterados

| Arquivo | Tipo de correção |
|---|---|
| `src/pages/Login.jsx` | Import de `GraduationCap` faltando |
| `src/lib/apiClient.js` | Removido `window.location.href` duplicado |
| `src/services/authService.js` | Adicionado método `clearAuth()` |
| `src/contexts/AuthContext.jsx` | checkAuth usa `clearAuth()`, diferencia erro de rede de erro de auth |
| `index.html` | Favicon apontado para arquivo local |
| `public/favicon.svg` | Arquivo de favicon criado |

---

## Como Aplicar em Projetos Futuros com o Mesmo Erro

### Checklist de diagnóstico para `404` em SPA

1. **Verificar imports**: Todos os componentes usados no JSX estão importados?
2. **Verificar navegação**: Há uso de `window.location.href` em serviços fora do React? Preferir `navigate()` do React Router ou eventos customizados.
3. **Verificar redirect do servidor**: O servidor está configurado para servir `index.html` para todas as rotas?
   - Netlify: `public/_redirects` com `/* /index.html 200`
   - Vercel: `vercel.json` com `rewrites`
   - Render: `render.yaml` com `routes`
4. **Verificar favicon**: Existe `public/favicon.ico` ou `public/favicon.svg`?
5. **Não confundir erros de rede com erros de autenticação**: Só limpar sessão em erro 401.

### Padrão correto para autenticação em SPA React + API externa

```
window.location.href  → NUNCA usar em serviços/apiClient para redirecionar
React Router navigate → usar SEMPRE que possível
<Navigate> component  → usar no ProtectedRoute quando user === null
```

### Por que `window.location.href` causa 404?

```
window.location.href = '/login'
  ↓
Navegador faz requisição HTTP GET /login para o servidor
  ↓
Se o servidor não tem redirect configurado → 404
  ↓
O app React nunca chega a carregar para processar a rota
```

```
<Navigate to="/login" replace />
  ↓
React Router atualiza apenas a URL no histórico do navegador
  ↓
Nenhuma requisição HTTP ao servidor
  ↓
O app React já está carregado e processa a rota /login
```
