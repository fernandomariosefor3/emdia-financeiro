import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "As senhas não coincidem",
  path: ["confirm"],
});

type FormData = z.infer<typeof schema>;

export default function Cadastro() {
  const { signUp } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    try {
      await signUp(data.name, data.email, data.password);
      navigate("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("email-already-in-use")) {
        setError("Este e-mail já está cadastrado.");
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#1AC87E] flex items-center justify-center shadow-md shadow-[#1AC87E]/30">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-[#0A0F1E] text-xl font-extrabold">emdia</span>
        </div>

        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-extrabold text-[#0A0F1E]">Criar conta grátis</CardTitle>
            <CardDescription className="text-gray-400">
              Comece a controlar suas finanças hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[#0A0F1E] font-medium">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  className="border-gray-200 bg-white text-[#0A0F1E] placeholder:text-gray-300 focus:border-[#1AC87E] focus:ring-[#1AC87E]/20"
                  {...register("name")}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[#0A0F1E] font-medium">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="border-gray-200 bg-white text-[#0A0F1E] placeholder:text-gray-300 focus:border-[#1AC87E] focus:ring-[#1AC87E]/20"
                  {...register("email")}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[#0A0F1E] font-medium">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="border-gray-200 bg-white text-[#0A0F1E] placeholder:text-gray-300 focus:border-[#1AC87E] focus:ring-[#1AC87E]/20"
                  {...register("password")}
                />
                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-[#0A0F1E] font-medium">Confirmar senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  className="border-gray-200 bg-white text-[#0A0F1E] placeholder:text-gray-300 focus:border-[#1AC87E] focus:ring-[#1AC87E]/20"
                  {...register("confirm")}
                />
                {errors.confirm && <p className="text-red-500 text-xs">{errors.confirm.message}</p>}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <p className="text-red-500 text-sm text-center">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1AC87E] hover:bg-[#15a868] text-white font-semibold h-11 shadow-md shadow-[#1AC87E]/20"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Criar conta"}
              </Button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6">
              Já tem uma conta?{" "}
              <a href="/login" className="text-[#1AC87E] hover:underline font-semibold">
                Entrar
              </a>
            </p>

            <p className="text-center mt-4">
              <a href="/" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
                ← Voltar ao início
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
