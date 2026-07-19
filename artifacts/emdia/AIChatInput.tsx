import { useState } from "react";
import { Mic, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
}

export function AIChatInput({ onSendMessage }: ChatInputProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    if (!text.trim()) return;
    
    setIsLoading(true);
    try {
      await onSendMessage(text);
      setText(""); // Limpa o input após o envio
    } catch (error) {
      console.error("Erro ao enviar mensagem", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-2 flex items-end gap-2 relative mt-8">
      {/* Decoração sutil para IA */}
      <div className="absolute -top-3 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
        <Sparkles size={10} /> Assistente de Bolso
      </div>

      {/* Botão de Áudio */}
      <button 
        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
        title="Enviar áudio (Em breve)"
      >
        <Mic size={20} />
      </button>

      {/* Área de Texto */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Ex: Comprei 15 reais de pão na padaria agora"
        className="flex-1 max-h-32 min-h-[44px] resize-none outline-none py-3 text-sm text-[#0A0F1E] bg-transparent"
        rows={1}
      />

      {/* Botão de Enviar */}
      <Button 
        onClick={handleSend} 
        disabled={!text.trim() || isLoading}
        className={`h-11 w-11 rounded-xl p-0 shrink-0 transition-all ${
          text.trim() && !isLoading 
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" 
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
      </Button>
    </div>
  );
}
