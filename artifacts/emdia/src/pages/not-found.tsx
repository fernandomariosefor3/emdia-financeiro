import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { TrendingUp, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#1AC87E] flex items-center justify-center shadow-md shadow-[#1AC87E]/30">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-[#0A0F1E] text-xl font-extrabold">emdia</span>
        </div>

        {/* 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[7rem] font-black leading-none text-[#0A0F1E] mb-2"
        >
          4<span className="text-[#1AC87E]">0</span>4
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-xl font-bold text-[#0A0F1E] mb-2"
        >
          Página não encontrada
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-gray-400 text-sm mb-8 leading-relaxed"
        >
          O endereço que você acessou não existe ou foi movido.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            className="bg-[#1AC87E] hover:bg-[#15a868] text-white gap-2 shadow-md shadow-[#1AC87E]/20"
            onClick={() => navigate("/dashboard")}
          >
            <Home size={15} />
            Ir ao Dashboard
          </Button>
          <Button
            variant="outline"
            className="border-gray-200 text-gray-500 hover:text-[#0A0F1E] gap-2"
            onClick={() => history.back()}
          >
            <ArrowLeft size={15} />
            Voltar
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
