import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();
const db = admin.firestore();

export const processarGastoComIA = functions
  .runWith({ secrets: ["OPENAI_API_KEY"] })
  .https.onRequest(async (req, res) => {
    
    // Evita erro de segurança do navegador (CORS)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    const textoUsuario = req.body.texto;
    const userId = req.body.userId;

    if (!textoUsuario || !userId) {
      res.status(400).json({ error: "Faltou o texto ou o ID do usuário." });
      return;
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const promptSistema = `
        Você é um assistente financeiro brasileiro. 
        Extraia as informações da mensagem do usuário e responda APENAS num formato JSON válido.
        
        Regras:
        1. "amount": número (ex: 50.00).
        2. "type": "expense" ou "income".
        3. "category": Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Compras, Outros (saída), Salário, Freelance, Investimentos, Outros (entrada).
        4. "description": descrição curta.
        
        Mensagem do usuário: "${textoUsuario}"
      `;

      const respostaIA = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: promptSistema }],
        temperature: 0,
      });

      const conteudo = respostaIA.choices[0].message?.content;
      if (!conteudo) throw new Error("IA não respondeu");

      const dadosExtraidos = JSON.parse(conteudo);

      const transacaoPronta = {
        amount: dadosExtraidos.amount,
        category: dadosExtraidos.category,
        description: dadosExtraidos.description + " 🤖",
        type: dadosExtraidos.type,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await db.collection("users").doc(userId).collection("transactions").add(transacaoPronta);

      res.status(200).json({ mensagem: "Sucesso", dados: transacaoPronta });

    } catch (error) {
      console.error("Erro:", error);
      res.status(500).json({ error: "Erro interno na IA." });
    }
});

export * from "./src/whatsapp";
export * from "./src/billing";
