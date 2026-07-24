import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();
const db = admin.firestore();

export const processarGastoComIA = functions
  .runWith({ secrets: ["OPENAI_API_KEY"] })
  .https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }

    const textoUsuario = data.texto;
    if (!textoUsuario || typeof textoUsuario !== "string" || textoUsuario.trim().length === 0 || textoUsuario.length > 500) {
      throw new functions.https.HttpsError("invalid-argument", "Texto inválido ou muito longo.");
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

      await db.collection("users").doc(uid).collection("transactions").add(transacaoPronta);

      return { mensagem: "Sucesso", dados: transacaoPronta };
    } catch (error) {
      console.error("Erro na IA:", error);
      throw new functions.https.HttpsError("internal", "Erro interno na IA.");
    }
});

export * from "./src/whatsapp";
export * from "./src/billing";
