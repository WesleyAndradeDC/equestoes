# 🔐 Solução Definitiva: Autenticação GitHub

## ⚠️ Erro: "Repository not found"

Mesmo com o repositório criado, o erro persiste porque **você precisa autenticar**.

---

## ✅ SOLUÇÃO: Personal Access Token

### PASSO 1: Criar Token (2 minutos)

1. **Acesse:** https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. **Note:** `gconcursos-2025`
4. **Expiration:** `90 days` ou `No expiration`
5. **Select scopes:** 
   - ✅ Marque **`repo`** (isso marca automaticamente todos os sub-itens necessários)
6. Role até o final e clique em **"Generate token"**
7. **⚠️ COPIE O TOKEN AGORA!** 
   - Exemplo: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ Você não verá mais este token!

---

### PASSO 2: Limpar Credenciais Antigas

Execute no PowerShell:

```powershell
# Ver credenciais salvas
cmdkey /list | Select-String "git"

# Se aparecer algo com "git:https://github.com", remova:
cmdkey /delete:git:https://github.com
```

---

### PASSO 3: Fazer Push com Token

```powershell
cd "C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE"

# Configurar helper
git config --global credential.helper wincred

# Fazer push
git push -u origin main
```

**Quando pedir credenciais:**

```
Username for 'https://github.com': WesleyAndradeDC
Password for 'https://WesleyAndradeDC@github.com': [COLE O TOKEN AQUI]
```

⚠️ **IMPORTANTE:**
- **Username:** `WesleyAndradeDC`
- **Password:** Cole o **token completo** (não sua senha do GitHub!)
- O token começa com `ghp_`

---

## 🔄 Alternativa: Usar URL com Token

Se ainda não funcionar, use o token diretamente na URL:

```powershell
cd "C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE"

# Substituir SEU_TOKEN pelo token que você copiou
git remote set-url origin https://SEU_TOKEN@github.com/WesleyAndradeDC/gconcursos.git

# Fazer push (não vai pedir credenciais)
git push -u origin main
```

**Depois, remova o token da URL por segurança:**

```powershell
git remote set-url origin https://github.com/WesleyAndradeDC/gconcursos.git
```

---

## 🧪 Verificar se Repositório Existe

Execute para confirmar:

```powershell
# Testar acesso
$uri = "https://github.com/WesleyAndradeDC/gconcursos"
try {
    $response = Invoke-WebRequest -Uri $uri -Method Head -ErrorAction Stop
    Write-Host "✅ Repositório EXISTE! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique se está logado no GitHub no navegador" -ForegroundColor Yellow
}
```

---

## 📋 Checklist

Antes de tentar push novamente:

- [ ] Criei Personal Access Token no GitHub
- [ ] Token tem escopo `repo` marcado
- [ ] Copiei o token completo (começa com `ghp_`)
- [ ] Limpei credenciais antigas do Windows
- [ ] Estou no diretório raiz do projeto (não em `backend/`)
- [ ] Remote está correto: `https://github.com/WesleyAndradeDC/gconcursos.git`

---

## 🆘 Se Ainda Não Funcionar

### Opção 1: Verificar Nome do Repositório

Acesse: https://github.com/WesleyAndradeDC?tab=repositories

Confirme que o nome é exatamente: `gconcursos` (sem espaços, sem hífen)

### Opção 2: Usar GitHub Desktop

1. Baixe: https://desktop.github.com/
2. Faça login
3. File → Add Local Repository
4. Selecione: `C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE`
5. Clique em "Publish repository"

### Opção 3: Verificar Permissões

- O repositório é seu? (WesleyAndradeDC)
- Se for privado, você tem acesso?
- Tente criar como público temporariamente para testar

---

## 💡 Dica Final

Depois do primeiro push bem-sucedido, o Windows salvará suas credenciais e você não precisará digitar o token novamente!

---

## 🎯 Comandos Rápidos (Copiar Tudo)

```powershell
# 1. Ir para raiz
cd "C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE"

# 2. Limpar credenciais antigas
cmdkey /delete:git:https://github.com

# 3. Configurar
git config --global credential.helper wincred

# 4. Verificar remote
git remote -v

# 5. Fazer push (vai pedir token)
git push -u origin main
```

**Quando pedir:**
- Username: `WesleyAndradeDC`
- Password: `ghp_seu_token_aqui`

---

## ✅ Sucesso Esperado

Após push bem-sucedido, você verá:

```
Enumerating objects: 112, done.
Counting objects: 100% (112/112), done.
Writing objects: 100% (112/112), done.
To https://github.com/WesleyAndradeDC/gconcursos.git
 * [new branch]      main -> main
```

E poderá acessar: https://github.com/WesleyAndradeDC/gconcursos


