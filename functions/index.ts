import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Esse é o endpoint (webhook) que o WhatsApp ou Bot vai chamar!
export const processarGastoComIA = functions.https.onRequest(async (req, res) => {
  // 1. Pega a mensagem de texto e o usuário que enviou
  const textoUsuario = req.body.texto;
  const userId = req.body.userId;

  if (!textoUsuario || !userId) {
    res.status(400).send("Faltou o texto ou o ID do usuário!");
    return;
  }

  try {
    // 2. AQUI ENTRARÁ A OPENAI NO FUTURO (Por enquanto vamos simular)
    // Simulando que a IA leu "Gastei 50 com Uber" e extraiu os dados:
    const despesaEstruturada = {
      amount: 50.00,
      category: "Transporte",
      description: "Lançado via Assistente: " + textoUsuario,
      type: "expense",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // 3. Salva direto no banco de dados do usuário (Firestore)
    await db.collection("users").doc(userId).collection("transactions").add(despesaEstruturada);

    // 4. Responde com sucesso
    res.status(200).json({ 
      mensagem: "Sucesso! IA cadastrou a despesa automaticamente.", 
      dados: despesaEstruturada 
    });

  } catch (error) {
    console.error("Erro no processamento:", error);
    res.status(500).send("Erro interno ao processar a despesa.");
  }
});
