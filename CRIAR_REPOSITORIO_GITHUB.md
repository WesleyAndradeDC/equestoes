# 📋 Passo a Passo: Criar Repositório GitHub Corretamente

## 🎯 Objetivo
Criar o repositório `gconcursos` no GitHub e fazer push do código local.

---

## 📝 PASSO 1: Criar Repositório no GitHub

### 1.1 Acessar GitHub
1. Abra o navegador e acesse: **https://github.com**
2. Faça login na sua conta: `WesleyAndradeDC`

### 1.2 Criar Novo Repositório
1. Clique no **"+"** no canto superior direito
2. Selecione **"New repository"**

### 1.3 Configurar Repositório

**Preencha os campos:**

- **Repository name:** `gconcursos`
  - ✅ Use exatamente este nome (minúsculas, sem espaços)
  
- **Description (opcional):** 
  ```
  G-Concursos Gramatique - Plataforma de questões para concursos públicos
  ```

- **Visibility:**
  - ⚪ **Public** (qualquer um pode ver)
  - ⚫ **Private** (apenas você e colaboradores)
  - 💡 Escolha **Private** se quiser manter privado

### 1.4 ⚠️ IMPORTANTE: Deixar VAZIO

**NÃO marque nenhuma opção:**
- ❌ **Add a README file** - NÃO marcar (já temos README)
- ❌ **Add .gitignore** - NÃO marcar (já temos .gitignore)
- ❌ **Choose a license** - NÃO selecionar nada

**Deixe tudo desmarcado!**

### 1.5 Criar
1. Clique no botão verde **"Create repository"**

---

## 🔐 PASSO 2: Configurar Autenticação

### Opção A: Personal Access Token (Mais Rápido)

#### 2.1 Criar Token
1. Acesse: **https://github.com/settings/tokens**
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. **Note:** Digite `gconcursos-push`
4. **Expiration:** Escolha `90 days` (ou `No expiration`)
5. **Select scopes:** Marque apenas:
   - ✅ **repo** (isso marca todos os sub-itens automaticamente)
6. Role até o final e clique em **"Generate token"**
7. **⚠️ COPIE O TOKEN AGORA!** 
   - Exemplo: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ Você não verá mais este token depois!

#### 2.2 Configurar Git no Windows
Abra o **PowerShell** ou **Git Bash** e execute:

```powershell
# Navegar para o projeto
cd "C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE"

# Configurar helper de credenciais
git config --global credential.helper wincred
```

---

## 🚀 PASSO 3: Fazer Push do Código

### 3.1 Verificar Remote
```powershell
cd "C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE"
git remote -v
```

**Deve mostrar:**
```
origin  https://github.com/WesleyAndradeDC/gconcursos.git (fetch)
origin  https://github.com/WesleyAndradeDC/gconcursos.git (push)
```

### 3.2 Fazer Push
```powershell
git push -u origin main
```

### 3.3 Autenticar
Quando pedir credenciais:

- **Username:** `WesleyAndradeDC`
- **Password:** Cole o **Personal Access Token** (não sua senha do GitHub!)

**Exemplo:**
```
Username for 'https://github.com': WesleyAndradeDC
Password for 'https://WesleyAndradeDC@github.com': ghp_xxxxxxxxxxxxxxxxxxxx
```

### 3.4 Aguardar Upload
O Git vai fazer upload de todos os arquivos. Isso pode levar alguns minutos.

**Você verá algo como:**
```
Enumerating objects: 112, done.
Counting objects: 100% (112/112), done.
Delta compression using up to 8 threads
Compressing objects: 100% (95/95), done.
Writing objects: 100% (112/112), 2.5 MiB | 1.2 MiB/s, done.
Total 112 (delta 15), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (15/15), done.
To https://github.com/WesleyAndradeDC/gconcursos.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## ✅ PASSO 4: Verificar

### 4.1 Acessar Repositório
Abra no navegador:
**https://github.com/WesleyAndradeDC/gconcursos**

### 4.2 Verificar Arquivos
Você deve ver:
- ✅ Pasta `backend/`
- ✅ Pasta `src/`
- ✅ Arquivos `README.md`, `.gitignore`, etc.
- ✅ Total de arquivos: ~112

---

## 🎉 Pronto!

Seu código está no GitHub! 🚀

---

## 🆘 Problemas Comuns

### ❌ "Repository not found"
**Solução:**
- Verifique se criou o repositório com o nome exato: `gconcursos`
- Confirme que está logado na conta correta: `WesleyAndradeDC`
- Verifique a URL: https://github.com/WesleyAndradeDC/gconcursos

### ❌ "Authentication failed"
**Solução:**
- Use o **Personal Access Token** (não sua senha)
- Verifique se o token tem escopo `repo`
- Tente criar um novo token

### ❌ "Permission denied"
**Solução:**
- Verifique se o repositório é seu
- Se for privado, confirme que você tem acesso
- Tente fazer logout/login no GitHub

### ❌ "Remote origin already exists"
**Solução:**
```powershell
# Remover remote antigo
git remote remove origin

# Adicionar novo
git remote add origin https://github.com/WesleyAndradeDC/gconcursos.git

# Tentar push novamente
git push -u origin main
```

---

## 📋 Checklist Final

Antes de fazer push, confirme:

- [ ] Repositório criado no GitHub com nome: `gconcursos`
- [ ] Nenhuma opção marcada (README, .gitignore, license)
- [ ] Personal Access Token criado com escopo `repo`
- [ ] Token copiado e guardado em local seguro
- [ ] Git configurado localmente
- [ ] Remote apontando para: `https://github.com/WesleyAndradeDC/gconcursos.git`
- [ ] Código commitado localmente (`git status` deve mostrar "nothing to commit")

---

## 🚀 Próximos Passos

Após o push bem-sucedido:

1. ✅ Código no GitHub
2. 🔄 Conectar GitHub ao Render (para deploy automático)
3. 🎯 Deploy do backend no Render
4. 🎨 Adaptar frontend para nova API
5. 🚀 Deploy do frontend

---

## 💡 Dica Extra

**Para facilitar futuros pushes:**

Crie um arquivo `.gitconfig` ou configure:

```powershell
git config --global user.name "Wesley Andrade"
git config --global user.email "seu-email@exemplo.com"
```

Isso ajuda a identificar seus commits no GitHub.

---

## 📞 Ajuda

Se ainda tiver problemas:
- Verifique: https://docs.github.com/en/get-started
- Ou me avise qual erro específico está aparecendo!




