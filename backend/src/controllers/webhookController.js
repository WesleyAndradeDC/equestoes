import prisma from '../config/database.js';

// WooCommerce Webhook - Registrar novo aluno
export const woocommerceNewStudent = async (req, res) => {
  try {
    console.log('📦 Webhook WooCommerce recebido:', JSON.stringify(req.body, null, 2));

    const { email, full_name, subscription_type } = req.body;

    // Validar campos obrigatórios
    if (!email || !full_name) {
      console.error('❌ Webhook: Campos obrigatórios faltando');
      return res.status(400).json({ 
        error: 'Email e nome completo são obrigatórios',
        received: { email, full_name, subscription_type }
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Webhook: Email inválido:', email);
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️ Webhook: Usuário já existe:', email);
      
      // Atualizar dados se necessário (nome ou subscription_type mudou)
      const updateData = {};
      if (full_name && full_name !== existingUser.full_name) {
        updateData.full_name = full_name;
      }
      if (subscription_type && subscription_type !== existingUser.subscription_type) {
        updateData.subscription_type = subscription_type;
      }

      // Se houver mudanças, atualizar
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await prisma.user.update({
          where: { email },
          data: updateData,
          select: {
            id: true,
            email: true,
            full_name: true,
            subscription_type: true,
            first_login: true,
            created_at: true
          }
        });
        
        console.log('✅ Webhook: Usuário atualizado:', updatedUser.email);
        return res.status(200).json({
          message: 'Usuário atualizado com sucesso',
          user: updatedUser,
          updated: true
        });
      }

      return res.status(200).json({
        message: 'Usuário já existe',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          full_name: existingUser.full_name,
          subscription_type: existingUser.subscription_type
        },
        updated: false
      });
    }

    // Criar novo usuário
    const newUser = await prisma.user.create({
      data: {
        email,
        full_name,
        subscription_type: subscription_type || 'Aluno Clube do Pedrão',
        role: 'user',
        first_login: true,
        password_hash: null // Será definido no primeiro acesso
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

    console.log('✅ Webhook: Novo usuário criado:', newUser.email);

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      user: newUser
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // Prisma unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Email já cadastrado',
        field: error.meta?.target?.[0]
      });
    }

    res.status(500).json({ 
      error: 'Erro ao processar webhook',
      details: error.message 
    });
  }
};

// Webhook de teste
export const testWebhook = async (req, res) => {
  res.json({
    message: 'Webhook está funcionando!',
    timestamp: new Date().toISOString(),
    body: req.body
  });
};

