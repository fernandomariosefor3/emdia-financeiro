import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, TrendingUp, ArrowLeft } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { signIn } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    try {
      await signIn(data.email, data.password);
      navigate("/dashboard");
    } catch {
      setError("E-mail ou senha incorretos.");
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotStatus("loading");
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotStatus("sent");
    } catch {
      setForgotStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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

        <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {forgotMode ? (
              <motion.div key="forgot" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-extrabold text-[#0A0F1E]">Redefinir senha</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enviaremos um link para o seu e-mail
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {forgotStatus === "sent" ? (
                    <div className="py-6 text-center space-y-3">
                      <div className="w-14 h-14 rounded-full bg-[#1AC87E]/10 flex items-center justify-center mx-auto">
                        <span className="text-[#1AC87E] text-2xl">✓</span>
                      </div>
                      <p className="font-semibold text-[#0A0F1E]">E-mail enviado!</p>
                      <p className="text-gray-400 text-sm">Verifique sua caixa de entrada e siga as instruções.</p>
                      <button onClick={() => { setForgotMode(false); setForgotStatus("idle"); setForgotEmail(""); }}
                        className="mt-4 text-[#1AC87E] text-sm font-semibold hover:underline">
                        Voltar ao login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[#0A0F1E] font-medium">E-mail</Label>
                        <Input
                          type="email" required value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="border-gray-200 bg-white text-[#0A0F1E] placeholder:text-gray-300 focus:border-[#1AC87E] focus:ring-[#1AC87E]/20"
                        />
                      </div>
                      {forgotStatus === "error" && (
                        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <p className="text-red-500 text-sm text-center">E-mail não encontrado. Tente novamente.</p>
                        </div>
                      )}
                      <Button type="submit" disabled={forgotStatus === "loading"}
                        className="w-full bg-[#1AC87E] hover:bg-[#15a868] text-white font-semibold h-11 shadow-md shadow-[#1AC87E]/20">
                        {forgotStatus === "loading" ? <Loader2 size={18} className="animate-spin" /> : "Enviar link de redefinição"}
                      </Button>
                      <button type="button" onClick={() => { setForgotMode(false); setForgotStatus("idle"); }}
                        className="w-full flex items-center justify-center gap-1.5 text-gray-400 text-sm hover:text-gray-600 transition-colors">
                        <ArrowLeft size={14} /> Voltar ao login
                      </button>
                    </form>
                  )}
                </CardContent>
              </motion.div>
            ) : (
              <motion.div key="login" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.2 }}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-extrabold text-[#0A0F1E]">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-gray-400">
              Entre na sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Entrar"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-gray-400 text-xs hover:text-[#1AC87E] transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6">
              Não tem uma conta?{" "}
              <a href="/cadastro" className="text-[#1AC87E] hover:underline font-semibold">
                Cadastre-se grátis
              </a>
            </p>

            <p className="text-center mt-4">
              <a href="/" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
                ← Voltar ao início
              </a>
            </p>
          </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
