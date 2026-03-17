import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Invoke LLM for Tutor
export const invokeLLM = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    // Check if user has access to tutor
    const allowedProfiles = ['Professor', 'Aluno Eleva'];
    const hasAccess = req.user.role === 'admin' || allowedProfiles.includes(req.user.subscription_type);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Acesso ao E-Tutory não permitido para seu plano' });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é o E-Tutory, um assistente especializado em TODAS as matérias de concursos públicos brasileiros. Seja didático, use exemplos práticos e responda de forma clara e objetiva em português brasileiro.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;

    res.json(response);
  } catch (error) {
    console.error('Invoke LLM error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'Cota da API OpenAI excedida' });
    }
    
    res.status(500).json({ error: 'Erro ao processar solicitação do tutor' });
  }
};

