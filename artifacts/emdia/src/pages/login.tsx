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
  const { signIn, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch {
      setError("Erro ao entrar com Google. Tente novamente.");
    } finally {
      setGoogleLoading(false);
    }
  }

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
            <button
              type="button"
              onClick={handleGoogleSignIn}
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
              Entrar com Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-gray-400 text-xs">ou</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

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
