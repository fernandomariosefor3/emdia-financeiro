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
  const { signUp, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch {
      setError("Erro ao continuar com Google. Tente novamente.");
    } finally {
      setGoogleLoading(false);
    }
  }

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
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-[#0A0F1E] font-medium text-sm mb-4 shadow-sm"
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin text-gray-400" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
              )}
              Continuar com Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-gray-400 text-xs">ou</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

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
