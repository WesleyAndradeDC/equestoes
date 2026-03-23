import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

// Valores válidos para subscription_type e role
const VALID_SUBSCRIPTION_TYPES = [
  'Aluno Eleva',
  'Professor',
];
const VALID_ROLES = ['user', 'admin'];

// Create user (admin only)
export const createUser = async (req, res) => {
  try {
    const { email, full_name, subscription_type, role } = req.body;

    // Validar campos obrigatórios
    if (!email || !full_name) {
      return res.status(400).json({ error: 'Email e nome completo são obrigatórios' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Validar subscription_type
    const finalSubscriptionType = subscription_type || 'Aluno Eleva';
    if (!VALID_SUBSCRIPTION_TYPES.includes(finalSubscriptionType)) {
      return res.status(400).json({
        error: 'Tipo de assinatura inválido',
        valid: VALID_SUBSCRIPTION_TYPES
      });
    }

    // Validar role
    const finalRole = role || 'user';
    if (!VALID_ROLES.includes(finalRole)) {
      return res.status(400).json({
        error: 'Role inválido',
        valid: VALID_ROLES
      });
    }

    // Verificar se email já existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Criar usuário sem senha (primeiro acesso via login)
    const user = await prisma.user.create({
      data: {
        email,
        full_name,
        subscription_type: finalSubscriptionType,
        role: finalRole,
        first_login: true,
        password_hash: null
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

    res.status(201).json({
      message: 'Usuário criado com sucesso. Ele definirá a senha no primeiro acesso.',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

// List all users (admin only)
export const listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        subscription_type: true,
        study_streak: true,
        last_study_date: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

// Get single user
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        subscription_type: true,
        study_streak: true,
        last_study_date: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, subscription_type } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (subscription_type !== undefined) updateData.subscription_type = subscription_type;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        subscription_type: true,
        study_streak: true,
        last_study_date: true,
        created_at: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

// Reset password (admin only) — zera senha e força primeiro acesso
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não é possível resetar sua própria senha por aqui' });
    }

    await prisma.user.update({
      where: { id },
      data: {
        password_hash: null,
        first_login: true,
      },
    });

    res.json({ message: `Senha de ${user.full_name} resetada. No próximo acesso ele definirá uma nova senha.` });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
};

