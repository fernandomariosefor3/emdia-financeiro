import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();
const db = admin.firestore();

// Inicializa a OpenAI (Em produção, a chave da API fica oculta nas variáveis de ambiente do Firebase)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "COLOQUE_SUA_CHAVE_AQUI_PARA_TESTES_LOCAIS",
});

export const processarGastoComIA = functions.https.onRequest(async (req, res) => {
  const textoUsuario = req.body.texto;
  const userId = req.body.userId;

  if (!textoUsuario || !userId) {
    res.status(400).json({ error: "Faltou o texto ou o ID do usuário." });
    return;
  }

  try {
    // 1. O PROMPT MÁGICO: Ensinando a IA a ser um assistente financeiro
    const promptSistema = `
      Você é um assistente financeiro brasileiro. 
      O usuário vai te mandar uma mensagem sobre um gasto ou ganho.
      Sua tarefa é extrair as informações e responder APENAS num formato JSON válido.
      
      Regras:
      1. Extraia o "amount" como um número (ex: 50.00).
      2. Defina o "type" como "expense" (saída) ou "income" (entrada).
      3. Defina a "category" APENAS com uma destas opções válidas: 
         Para expense: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Compras, Outros (saída).
         Para income: Salário, Freelance, Investimentos, Outros (entrada).
      4. Crie uma "description" curta e clara sobre o que foi.
      
      Mensagem do usuário: "${textoUsuario}"
    `;

    // 2. Chama a Inteligência Artificial (ChatGPT)
    const respostaIA = await openai.chat.completions.create({
      model: "gpt-4-turbo", // ou gpt-3.5-turbo para economizar
      messages: [{ role: "system", content: promptSistema }],
      temperature: 0,
      response_format: { type: "json_object" } // Força a IA a cuspir um JSON!
    });

    const conteudo = respostaIA.choices[0].message.content;
    
    if (!conteudo) {
      throw new Error("IA não retornou resposta");
    }

    // 3. Converte a resposta da IA em um objeto do Javascript
    const dadosExtraidos = JSON.parse(conteudo);

    // 4. Monta o objeto final para o nosso banco de dados
    const transacaoPronta = {
      amount: dadosExtraidos.amount,
      category: dadosExtraidos.category,
      description: dadosExtraidos.description + " 🤖", // Um emoji para saber que foi IA
      type: dadosExtraidos.type,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // 5. Salva a transação mágica no banco de dados do usuário
    await db.collection("users").doc(userId).collection("transactions").add(transacaoPronta);

    // 6. Retorna sucesso para o Front-end ou WhatsApp
    res.status(200).json({ 
      mensagem: "Inteligência Artificial processou com sucesso!", 
      dados: transacaoPronta 
    });

  } catch (error) {
    console.error("Erro na OpenAI ou Banco:", error);
    res.status(500).json({ error: "Erro interno ao processar a despesa com IA." });
  }
});
