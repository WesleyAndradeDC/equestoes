# 🔗 Configurar Repositório GitHub

## ⚠️ Repositório não encontrado

O repositório `https://github.com/WesleyAndradeDC/gconcursos` ainda não existe no GitHub.

## 📋 Passo a Passo para Criar e Conectar

### 1️⃣ Criar o Repositório no GitHub

1. Acesse: https://github.com/new
2. **Repository name:** `gconcursos`
3. **Description:** `G-Concursos Gramatique - Plataforma de questões para concursos públicos`
4. **Visibility:** Escolha **Public** ou **Private**
5. **NÃO marque** "Add a README file" (já temos um)
6. **NÃO marque** "Add .gitignore" (já temos um)
7. Clique em **"Create repository"**

### 2️⃣ Fazer Push do Código

Após criar o repositório, execute no terminal:

```bash
cd "C:\Users\wesle\OneDrive\Documentos\G-Concursos GRAMATIQUE"
git push -u origin main
```

Se pedir autenticação, você pode:

**Opção A: Personal Access Token (Recomendado)**
1. Vá em: https://github.com/settings/tokens
2. Clique em **"Generate new token (classic)"**
3. Dê um nome (ex: "gconcursos-local")
4. Selecione escopo: **repo** (marcar tudo)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (só aparece uma vez!)
7. Quando o Git pedir senha, use o token no lugar da senha

**Opção B: GitHub CLI**
```bash
# Instalar GitHub CLI (se não tiver)
# https://cli.github.com/

gh auth login
git push -u origin main
```

**Opção C: SSH Key**
1. Configure SSH key no GitHub
2. Altere o remote:
```bash
git remote set-url origin git@github.com:WesleyAndradeDC/gconcursos.git
git push -u origin main
```

### 3️⃣ Verificar

Após o push, acesse:
https://github.com/WesleyAndradeDC/gconcursos

Você deve ver todos os arquivos do projeto lá!

---

## 🚀 Comandos Rápidos

```bash
# Ver status
git status

# Adicionar mudanças
git add .

# Fazer commit
git commit -m "Descrição das mudanças"

# Fazer push
git push origin main

# Ver histórico
git log --oneline
```

---

## 📝 Estrutura do Repositório

Após o push, seu repositório terá:

```
gconcursos/
├── backend/          # Backend Express + Prisma
├── src/              # Frontend React
├── README.md
├── MIGRATION_STATUS.md
└── .gitignore
```

---

## ✅ Próximos Passos

Após conectar ao GitHub:

1. ✅ Código no GitHub
2. 🔄 Deploy no Render (conectar ao GitHub)
3. 🚀 Projeto no ar!

---

## 🆘 Problemas Comuns

### "Repository not found"
- Verifique se criou o repositório no GitHub
- Confirme o nome: `gconcursos`
- Confirme o usuário: `WesleyAndradeDC`

### "Authentication failed"
- Use Personal Access Token em vez de senha
- Ou configure SSH key

### "Permission denied"
- Verifique se tem acesso ao repositório
- Se for privado, precisa estar como colaborador

---

## 📞 Ajuda

- [GitHub Docs](https://docs.github.com/)
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)

