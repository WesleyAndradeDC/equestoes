# 🔐 Resolver Autenticação GitHub

## ⚠️ Erro: "Repository not found"

Com repositório **privado**, você precisa autenticar corretamente.

## 🔧 Soluções

### ✅ SOLUÇÃO 1: Personal Access Token (Recomendado)

#### 1. Criar Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome: `gconcursos-local`
4. Selecione expiração: **90 days** (ou No expiration)
5. **Marque os escopos:**
   - ✅ `repo` (todos os sub-itens)
     - ✅ `repo:status`
     - ✅ `repo_deployment`
     - ✅ `public_repo`
     - ✅ `repo:invite`
     - ✅ `security_events`
6. Clique em **"Generate token"**
7. **⚠️ COPIE O TOKEN AGORA!** (só aparece uma vez)
   - Exemplo: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 2. Usar o Token no Git

Quando executar `git push`, o Git pedirá:
- **Username:** `WesleyAndradeDC`
- **Password:** Cole o token (não sua senha do GitHub!)

Ou configure diretamente:

```bash
# Windows PowerShell
cd "C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE"

# Configurar credenciais
git config --global credential.helper wincred

# Tentar push (vai pedir username e password)
git push -u origin main
# Username: WesleyAndradeDC
# Password: ghp_seu_token_aqui
```

---

### ✅ SOLUÇÃO 2: Usar SSH (Mais Seguro)

#### 1. Gerar SSH Key

```bash
# Verificar se já tem SSH key
ls ~/.ssh

# Se não tiver, gerar nova
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
# Pressione Enter para aceitar local padrão
# Digite uma senha (ou deixe vazio)
```

#### 2. Adicionar SSH Key no GitHub

1. Copie a chave pública:
```bash
# Windows PowerShell
cat ~/.ssh/id_ed25519.pub
# Ou
type C:\Users\wesle\.ssh\id_ed25519.pub
```

2. No GitHub:
   - Vá em: https://github.com/settings/keys
   - Clique em **"New SSH key"**
   - **Title:** `Meu PC - G-Concursos`
   - **Key:** Cole o conteúdo copiado
   - Clique em **"Add SSH key"**

#### 3. Alterar Remote para SSH

```bash
cd "C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE"

# Alterar remote de HTTPS para SSH
git remote set-url origin git@github.com:WesleyAndradeDC/gconcursos.git

# Verificar
git remote -v

# Tentar push
git push -u origin main
```

---

### ✅ SOLUÇÃO 3: GitHub CLI (Mais Fácil)

#### 1. Instalar GitHub CLI

Baixe em: https://cli.github.com/

Ou via winget:
```bash
winget install --id GitHub.cli
```

#### 2. Fazer Login

```bash
gh auth login
# Escolha: GitHub.com
# Escolha: HTTPS
# Autentique no navegador
```

#### 3. Fazer Push

```bash
cd "C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE"
git push -u origin main
```

---

### ✅ SOLUÇÃO 4: Verificar Nome do Repositório

Confirme que o nome está exatamente igual:

1. Acesse: https://github.com/WesleyAndradeDC?tab=repositories
2. Verifique o nome exato do repositório
3. Se for diferente, atualize:

```bash
# Se o nome for diferente (ex: g-concursos)
git remote set-url origin https://github.com/WesleyAndradeDC/NOME-EXATO.git
```

---

## 🧪 Testar Conexão

### Com HTTPS + Token:
```bash
# Testar acesso
curl -H "Authorization: token SEU_TOKEN" https://api.github.com/user/repos
```

### Com SSH:
```bash
# Testar conexão SSH
ssh -T git@github.com
# Deve retornar: Hi WesleyAndradeDC! You've successfully authenticated...
```

---

## 📝 Comandos Rápidos

```bash
# Ver remote atual
git remote -v

# Alterar para HTTPS
git remote set-url origin https://github.com/WesleyAndradeDC/gconcursos.git

# Alterar para SSH
git remote set-url origin git@github.com:WesleyAndradeDC/gconcursos.git

# Limpar credenciais salvas (Windows)
git credential-manager-core erase
# Ou
cmdkey /list
cmdkey /delete:git:https://github.com

# Tentar push novamente
git push -u origin main
```

---

## ✅ Checklist

- [ ] Token criado no GitHub (com escopo `repo`)
- [ ] Remote configurado corretamente
- [ ] Credenciais configuradas (token ou SSH)
- [ ] Nome do repositório verificado
- [ ] Push executado com sucesso

---

## 🆘 Ainda com Problema?

1. **Verifique se o repositório existe:**
   - https://github.com/WesleyAndradeDC/gconcursos

2. **Verifique se você tem acesso:**
   - Repositório privado precisa de permissão

3. **Tente criar repositório público temporariamente:**
   - Para testar se é problema de autenticação
   - Depois pode mudar para privado

4. **Use GitHub Desktop:**
   - Mais fácil para autenticação
   - https://desktop.github.com/

---

## 💡 Recomendação

Para repositório privado, use **SSH** ou **GitHub CLI** - são mais seguros e fáceis de configurar.



