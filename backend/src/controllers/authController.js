import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, full_name, subscription_type } = req.body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, senha e nome completo são obrigatórios' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        full_name,
        subscription_type: subscription_type || 'Aluno Eleva',
        role: 'user'
      },
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

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    // Proteção contra timing attack: sempre executa bcrypt mesmo se user não existir
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuuabcdefghij';
    const hashToCompare = user?.password_hash || dummyHash;
    const isValidPassword = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValidPassword || !user.password_hash) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Return user without password
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

// Get current user (me)
export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
    console.error('Me error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

// Update current user
export const updateMe = async (req, res) => {
  try {
    const { full_name, study_streak, last_study_date } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (study_streak !== undefined) updateData.study_streak = study_streak;
    if (last_study_date !== undefined) updateData.last_study_date = last_study_date;

    const user = await prisma.user.update({
      where: { id: req.user.id },
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
    console.error('Update me error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

// Check if email exists and if it's first login
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        full_name: true,
        first_login: true,
        subscription_type: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Email não encontrado',
        message: 'A plataforma E-Questões é exclusiva para alunos cadastrados.',
        action: 'join',
        joinUrl: 'https://equestoes.com.br/'
      });
    }

    res.json({
      exists: true,
      first_login: user.first_login,
      full_name: user.full_name,
      email: user.email
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Erro ao verificar email' });
  }
};

// Set password for first login
export const setPassword = async (req, res) => {
  try {
    const { email, password, password_confirm } = req.body;

    // Validate required fields
    if (!email || !password || !password_confirm) {
      return res.status(400).json({ error: 'Email, senha e confirmação são obrigatórios' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Check if passwords match
    if (password !== password_confirm) {
      return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Check if it's not first login anymore
    if (!user.first_login) {
      return res.status(400).json({ error: 'Senha já foi definida anteriormente' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password_hash,
        first_login: false
      },
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

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(updatedUser.id);

    res.json({
      message: 'Senha definida com sucesso',
      user: updatedUser,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Erro ao definir senha' });
  }
};

// Logout (client-side only, just return success)
export const logout = async (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const tokens = generateTokens(user.id);

    res.json(tokens);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
};

