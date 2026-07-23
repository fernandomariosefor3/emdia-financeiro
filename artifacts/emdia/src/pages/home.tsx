import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, MessageCircle, Zap, ShieldCheck, PiggyBank, TrendingDown, BellDot, BarChart2, Sparkles, FileDown } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const APP_URL = "/cadastro";
const LOGIN_URL = "/login";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.12 } } };

function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

const chartData = [
  { month: "Jan", receitas: 3200, despesas: 2400 },
  { month: "Fev", receitas: 3600, despesas: 2200 },
  { month: "Mar", receitas: 3100, despesas: 2700 },
  { month: "Abr", receitas: 4200, despesas: 2900 },
  { month: "Mai", receitas: 3800, despesas: 2500 },
  { month: "Jun", receitas: 4500, despesas: 2800 },
];

const pieData = [
  { name: "Receitas", value: 4500, color: "#1AC87E" },
  { name: "Despesas", value: 2800, color: "#FF6B6B" },
  { name: "Dívidas", value: 800, color: "#FFB347" },
];

const steps = [
  {
    num: "01",
    title: "Mande uma mensagem no WhatsApp",
    desc: "Cadastre-se uma vez no app e vincule ao WhatsApp. A partir daí, é só mandar uma mensagem. Sem abrir outro app, sem complicação.",
    tags: ["Cadastro único", "WhatsApp", "IA Lia"],
    mockup: [
      { label: "Você", value: "Quanto gastei em compras esse mês?", color: "text-blue-400", icon: "💬" },
      { label: "Lia", value: "Você gastou R$ 847 em compras. Sua média é R$ 620. Cuidado, tá acima do normal!", color: "text-[#1AC87E]", icon: "🤖" },
    ],
  },
  {
    num: "02",
    title: "Consulte sua situação em segundos",
    desc: "Pergunte qualquer coisa: quanto sobrou, quanto pode gastar, como está cada categoria. A Lia responde com os dados reais da sua conta.",
    tags: ["Consultas", "Tempo real", "Por categoria"],
    mockup: [
      { label: "Você", value: "Posso comprar um celular de R$ 2.000?", color: "text-blue-400", icon: "💬" },
      { label: "Lia", value: "Sim! Você tem R$ 3.200 disponíveis. Comprando agora, ainda sobram R$ 1.200.", color: "text-[#1AC87E]", icon: "🤖" },
    ],
  },
  {
    num: "03",
    title: "Planeje e seja alertado automaticamente",
    desc: "Todo início de mês, a Lia monta seu resumo planejado versus realizado. E avisa antes de você extrapolar — no WhatsApp, na hora.",
    tags: ["Planejamento mensal", "Alertas", "Proatividade"],
    mockup: [
      { label: "Lia", value: "📊 Resumo de Junho: Planejou R$ 1.500 em alimentação, gastou R$ 1.780. Cuidado!", color: "text-[#1AC87E]", icon: "🔔" },
      { label: "Lia", value: "💡 Dica: Tenta cozinhar mais em casa essa semana. Você pode economizar R$ 120.", color: "text-[#1AC87E]", icon: "🤖" },
    ],
  },
];

const features = [
  { Icon: MessageCircle, color: "#25D366", title: "Assessoria pelo WhatsApp", desc: "Consulte saldos, gastos por categoria e muito mais — respondendo mensagens como uma amiga que entende de dinheiro." },
  { Icon: Zap, color: "#1AC87E", title: "Respostas em segundos", desc: "A Lia busca seus dados em tempo real e responde na hora. Sem navegar em menus, sem abrir planilhas." },
  { Icon: PiggyBank, color: "#3B82F6", title: "Simule antes de comprar", desc: "Mande 'posso comprar X por R$ Y?' e a Lia calcula na hora se cabe no seu orçamento, considerando tudo que você já gastou." },
  { Icon: TrendingDown, color: "#EF4444", title: "Alertas proativos", desc: "A Lia te avisa antes de você extrapolar. Se suas despesas já superaram o planejado, você fica sabendo na mesma hora." },
  { Icon: BarChart2, color: "#8B5CF6", title: "Resumo planejado vs. realizado", desc: "Todo mês, compare o que você planejou com o que realmente aconteceu — com breakdown por categoria." },
  { Icon: ShieldCheck, color: "#10B981", title: "Dados seguros", desc: "Suas informações financeiras ficam criptografadas e nunca são compartilhadas. Segurança bancária no bolso." },
];

const testimonials = [
  { name: "Ana Paula Ferreira", role: "Professora", text: "Finalmente entendi pra onde ia meu dinheiro todo mês! O gráfico de pizza deixa tudo muito claro. Em 2 semanas já consegui guardar R$ 400 que antes sumiam sem eu perceber.", avatar: "AP" },
  { name: "Carlos Eduardo Santos", role: "Freelancer", text: "Como freelancer minha renda varia muito. O emdia me ajudou a controlar os meses ruins sem desespero. O plano anual valeu cada centavo.", avatar: "CE" },
  { name: "Mariana Costa", role: "Desenvolvedora", text: "Já tentei 4 apps de finanças antes. Esse é o único que não abandonei depois de uma semana. É simples, bonito e funciona de verdade no celular.", avatar: "MC" },
  { name: "Rafael Mendonça", role: "Estudante", text: "Uso o plano gratuito e já me ajudou muito. Quando me formar vou assinar o Pro sem pensar duas vezes. O gráfico de categorias é incrível!", avatar: "RM" },
  { name: "Juliana Rocha", role: "Empresária", text: "Separo as finanças pessoais das do negócio e agora consigo ver exatamente minha saúde financeira individual. A exportação CSV facilita muito.", avatar: "JR" },
  { name: "Tiago Alves", role: "Motorista", text: "Minha renda é diária e variada. Agora registro tudo pelo celular na hora e no fim do mês já sei exatamente quanto ganhei e gastei. Simples demais!", avatar: "TA" },
];

const faqs = [
  { q: "Como a Lia responde no WhatsApp?", a: "Após o cadastro no app, vincule seu número ao WhatsApp. A partir daí, é só mandar uma mensagem e a Lia responde com base nos seus dados financeiros reais." },
  { q: "Que tipo de pergunta posso fazer?", a: "Você pode perguntar de tudo: 'quanto gastei em alimentação?', 'posso comprar isso?', 'como está meu saldo?', 'estou no vermelho?'. A Lia interpreta e busca a resposta com seus dados reais." },
  { q: "Preciso instalar o app ou o WhatsApp Business?", a: "Você precisa do app emdia para cadastrar suas transações e vincular ao WhatsApp. Depois disso, toda interação acontece direto no WhatsApp — sem precisar abrir o app." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem burocracia. Se você assinar o plano mensal, pode cancelar quando quiser e continua com acesso até o fim do período pago. No plano anual, oferecemos 7 dias de garantia total." },
  { q: "Meus dados financeiros ficam seguros?", a: "Com certeza. Os dados são criptografados, ficam salvos na nuvem de forma segura e nunca são compartilhados com terceiros." },
  { q: "A Lia funciona offline?", a: "A Lia precisa estar online para consultar seus dados em tempo real. Mas você pode registrar transações offline pelo app, e a Lia as considera quando responder sua próxima mensagem." },
  { q: "Como funciona o resumo mensal?", a: "Todo início de mês, a Lia monta um relatório comparing o que você planejou com o que realmente aconteceu — enviado automaticamente no WhatsApp. Você vê onde acertou e onde pode melhorar." },
  { q: "Como a Lia sabe quanto eu posso gastar?", a: "A Lia analisa todas as suas receitas e despesas já registradas. Com base nisso, calcula quanto você tem disponível no mês, quanto já gastou por categoria e quanto ainda cabe no orçamento." },
];

/* ─── NAVBAR ──────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Home", href: "#" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Planos", href: "#planos" },
    { label: "FAQ", href: "#faq" },
    { label: "Contato", href: "#contato" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#1AC87E] flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className={`font-bold text-xl ${scrolled ? "text-[#0A0F1E]" : "text-white"}`}>emdia</span>
        </a>

        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a key={l.label} href={l.href}
              className={`text-sm font-medium transition-colors hover:text-[#1AC87E] ${scrolled ? "text-gray-600" : "text-white/90"}`}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href={LOGIN_URL} className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${scrolled ? "text-gray-700 hover:text-[#1AC87E]" : "text-white hover:text-[#1AC87E]"}`}>Entrar</a>
          <a href={APP_URL} className="text-sm font-bold px-5 py-2.5 rounded-xl bg-[#1AC87E] text-white hover:bg-[#15a368] transition-colors shadow-lg shadow-[#1AC87E]/30">Acessar App</a>
        </div>

        <button className={`md:hidden p-2 ${scrolled ? "text-gray-700" : "text-white"}`} onClick={() => setOpen(!open)}>
          <div className="w-5 h-0.5 bg-current mb-1.5" />
          <div className="w-5 h-0.5 bg-current mb-1.5" />
          <div className="w-5 h-0.5 bg-current" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 px-4 py-4">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)}
                className="block py-3 text-gray-700 font-medium border-b border-gray-50 hover:text-[#1AC87E]">{l.label}</a>
            ))}
            <a href={APP_URL} className="mt-4 block text-center py-3 rounded-xl bg-[#1AC87E] text-white font-bold">Acessar App →</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ─── HERO ────────────────────────────────────────────────────────── */
function Hero() {
  const statsRef = useRef(null);
  const inView = useInView(statsRef, { once: true });
  const users = useCountUp(10000, 2000, inView);
  const money = useCountUp(5, 1800, inView);
  const satisfaction = useCountUp(99, 1500, inView);

  return (
    <section className="relative min-h-screen flex flex-col bg-[#0A0F1E] overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F1E] via-[#0d1630] to-[#071a0e]" />
      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      {/* Green ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#1AC87E]/6 blur-3xl pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          SUA ASSESSORA FINANCEIRA NO WHATSAPP
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight max-w-3xl">
          Finanças sem<br />
          <span className="text-[#1AC87E]">planilha —</span> só no<br />
          WhatsApp
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg text-white/75 max-w-xl leading-relaxed">
          A Lia é sua assessora financeira pessoal. Ela responde no WhatsApp,
          mostra seu saldo real, alerta antes de você extrapolar — e cabe no bolso.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href={APP_URL}
            className="px-8 py-4 rounded-full bg-[#1AC87E] text-white font-bold text-base hover:bg-[#15a368] transition-all shadow-xl shadow-[#1AC87E]/30 flex items-center gap-2">
            💬 Começar no WhatsApp
          </a>
          <a href="#como-funciona"
            className="px-8 py-4 rounded-full bg-white/10 text-white font-bold text-base hover:bg-white/20 transition-all border border-white/25">
            Como funciona
          </a>
        </motion.div>

        {/* WhatsApp chat mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-14 relative w-full max-w-sm mx-auto"
        >
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-black/50 text-left">
            {/* WhatsApp header */}
            <div className="bg-[#0A0F1E] px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1AC87E] flex items-center justify-center">
                <span className="text-white font-black text-sm">L</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Lia — emdia</div>
                <div className="text-white/40 text-xs">online</div>
              </div>
            </div>
            {/* Chat body */}
            <div className="bg-[#ECE5DD] p-4 space-y-3 min-h-[200px]">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%] shadow-sm">
                  <div className="text-[#0A0F1E] text-xs font-medium">Posso comprar um tênis de R$ 450?</div>
                </div>
              </div>
              {/* Lia response */}
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%] shadow-sm">
                  <div className="text-[#0A0F1E] text-xs leading-relaxed">
                    Sim! 💳 Você tem <span className="font-bold text-[#1AC87E]">R$ 1.840 disponíveis</span> esse mês.
                    Comprando o tênis, ainda sobram R$ 1.390. Pode comprar, sim! 👟
                  </div>
                </div>
              </div>
              {/* User message 2 */}
              <div className="flex justify-end">
                <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%] shadow-sm">
                  <div className="text-[#0A0F1E] text-xs font-medium">E quanto gastei em alimentação?</div>
                </div>
              </div>
              {/* Lia response 2 */}
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%] shadow-sm">
                  <div className="text-[#0A0F1E] text-xs leading-relaxed">
                    Em Junho, você gastou <span className="font-bold text-red-400">R$ 780 em alimentação</span> — R$ 220 acima do planejado (R$ 560). ⚠️
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="absolute -top-4 -right-4 bg-[#25D366] rounded-2xl shadow-2xl px-3 py-2 flex items-center gap-2"
          >
            <span className="text-base">💬</span>
            <span className="text-white text-xs font-bold whitespace-nowrap">Resposta instantânea</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <div ref={statsRef} className="relative bg-white py-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          {[
            { value: `${users >= 10000 ? "10k" : users}+`, label: "Usuários assessorados" },
            { value: `R$ ${money}M+`, label: "Gerenciados via WhatsApp" },
            { value: `${satisfaction}%`, label: "Satisfação" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0A0F1E]">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ────────────────────────────────────────────────── */
function HowItWorks() {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="como-funciona" ref={ref} className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Como funciona</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Assessoria financeira sem complicação</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Cadastre-se uma vez, use para sempre. A Lia vive no seu WhatsApp — pronta para te ajudar sempre que você precisar.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Steps list */}
          <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="space-y-4">
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp}
                onClick={() => setActive(i)}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${
                  active === i
                    ? "border-[#1AC87E]/40 bg-[#f0fdf8] shadow-md"
                    : "border-gray-100 bg-gray-50 hover:border-[#1AC87E]/20"
                }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-colors ${
                    active === i ? "bg-[#1AC87E] text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {step.num}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-2 transition-colors ${active === i ? "text-[#0A0F1E]" : "text-gray-500"}`}>
                      {step.title}
                    </h3>
                    <AnimatePresence>
                      {active === i && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <p className="text-gray-500 text-sm leading-relaxed mb-3">{step.desc}</p>
                          <div className="flex flex-wrap gap-2">
                            {step.tags.map((tag) => (
                              <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold text-[#1AC87E] bg-[#1AC87E]/10">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Mockup panel */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.3 }}>
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-[#0A0F1E] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1AC87E] to-[#0fa85f] flex items-center justify-center">
                    <span className="text-white font-black text-xs">e</span>
                  </div>
                  <span className="text-white font-semibold text-sm">emdia</span>
                </div>
                <span className="text-white/40 text-xs">Passo {steps[active].num}</span>
              </div>
              <div className="p-6">
                <div className="text-sm font-semibold text-[#0A0F1E] mb-1">{steps[active].title}</div>
                <div className="text-xs text-gray-400 mb-5">Junho 2025</div>
                <div className="space-y-3">
                  {steps[active].mockup.map((item, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium text-[#0A0F1E]">{item.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ────────────────────────────────────────────────────── */
function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section id="funcionalidades" ref={ref} className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Recursos</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Assessoria completa, sem complicação</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">Tudo que uma boa assessora financeira faz — no WhatsApp, ao seu alcance.</motion.p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp}
              className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-[#1AC87E]/25 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
                style={{ backgroundColor: `${f.color}14` }}>
                <f.Icon size={22} style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-lg text-[#0A0F1E] mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── DEMO CHART ──────────────────────────────────────────────────── */
function DemoChart() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className="py-24 bg-[#0A0F1E]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
            <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Assessoria proativa</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              A Lia te avisa <span className="text-[#1AC87E]">antes</span> de você extrapolar
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-white/60 text-lg leading-relaxed">
              Não precisa ficar abrindo o app para verificar. A Lia acompanha suas finanças e te manda um alerta no WhatsApp quando algo precisa de atenção.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: "Receitas", value: "R$ 4.500", color: "#1AC87E" },
                { label: "Despesas", value: "R$ 2.800", color: "#FF6B6B" },
                { label: "Dívidas", value: "R$ 800", color: "#FFB347" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                  <div className="text-xs font-medium mb-1" style={{ color: item.color }}>{item.label}</div>
                  <div className="text-white font-bold text-sm">{item.value}</div>
                </div>
              ))}
            </motion.div>
            <motion.a variants={fadeUp} href={APP_URL}
              className="mt-8 inline-block px-6 py-3 rounded-xl bg-[#1AC87E] text-white font-bold hover:bg-[#15a368] transition-colors">
              Ver meu painel →
            </motion.a>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.7 }}>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="text-white/60 text-sm font-medium mb-1">Distribuição — Junho 2025</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#141929", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12 }}
                    formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-white/60 text-xs font-medium mb-3">Histórico — Jan a Jun 2025</div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1AC87E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1AC87E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "#141929", border: "none", borderRadius: 8, color: "white", fontSize: 11 }} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
                  <Area type="monotone" dataKey="receitas" stroke="#1AC87E" strokeWidth={2} fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ─────────────────────────────────────────────────────── */
function Pricing() {
  const [annual, setAnnual] = useState(true);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const plans = [
    {
      tier: "GRÁTIS",
      name: "R$ 0",
      sub: "Para sempre gratuito",
      popular: false,
      features: ["Até 15 transações/mês", "Gráfico básico de pizza", "Histórico de 30 dias", "Acesso via navegador", "Suporte por e-mail"],
      cta: "Começar grátis",
      ctaStyle: "border border-[#1AC87E] text-[#1AC87E] hover:bg-[#1AC87E]/5",
    },
    {
      tier: "PRO",
      name: annual ? "R$ 78,99" : "R$ 9,99",
      period: annual ? "/ano" : "/mês",
      sub: annual ? `Equivale a R$ 6,58/mês — você economiza R$ 40,89!` : "cobrado mensalmente",
      popular: true,
      features: ["Transações ilimitadas", "Histórico financeiro completo", "Exportação CSV", "IA Financeira — Lia", "Alertas de vencimento", "Suporte prioritário", "7 dias de garantia"],
      cta: annual ? "Assinar Plano Anual" : "Assinar Mensal",
      ctaStyle: "bg-[#1AC87E] text-white hover:bg-[#15a368] shadow-lg shadow-[#1AC87E]/30",
    },
    {
      tier: "EMPRESAS",
      name: "Custom",
      sub: "Preço sob consulta",
      popular: false,
      features: ["Tudo do Pro", "Múltiplos usuários", "Dashboard corporativo", "Integração contábil", "SLA garantido", "Gerente dedicado"],
      cta: "Falar com a equipe",
      ctaStyle: "border border-gray-300 text-gray-700 hover:border-[#1AC87E] hover:text-[#1AC87E]",
    },
  ];

  return (
    <section id="planos" ref={ref} className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-12">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Planos & Preços</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Simples assim. Sem surpresas.</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg">Comece grátis e faça upgrade quando quiser ter controle total das suas finanças.</motion.p>

          <motion.div variants={fadeUp} className="mt-8 inline-flex items-center gap-1 p-1 bg-gray-100 rounded-2xl">
            <button onClick={() => setAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${!annual ? "bg-white text-[#0A0F1E] shadow" : "text-gray-500"}`}>
              Mensal
            </button>
            <button onClick={() => setAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${annual ? "bg-[#0A0F1E] text-white shadow" : "text-gray-500"}`}>
              Anual
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${annual ? "bg-[#1AC87E] text-white" : "bg-[#1AC87E]/15 text-[#1AC87E]"}`}>-34%</span>
            </button>
          </motion.div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid md:grid-cols-3 gap-6 items-center">
          {plans.map((plan, i) => (
            <motion.div key={i} variants={fadeUp}
              className={`rounded-3xl p-7 relative transition-all ${
                plan.popular
                  ? "bg-[#0A0F1E] text-white shadow-2xl scale-105"
                  : "bg-white border border-gray-200 shadow-sm"
              }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#1AC87E] text-white text-xs font-bold rounded-full shadow-lg">
                  MAIS POPULAR
                </div>
              )}
              <div className={`text-xs font-bold tracking-widest mb-3 ${plan.popular ? "text-[#1AC87E]" : "text-gray-400"}`}>{plan.tier}</div>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-4xl font-black ${plan.popular ? "text-white" : "text-[#0A0F1E]"}`}>{plan.name}</span>
                {plan.period && <span className={`text-sm mb-1.5 ${plan.popular ? "text-white/50" : "text-gray-400"}`}>{plan.period}</span>}
              </div>
              <p className={`text-xs mb-6 ${plan.popular ? "text-[#1AC87E]" : "text-gray-400"}`}>{plan.sub}</p>

              <ul className={`space-y-3 mb-7 text-sm ${plan.popular ? "text-white/75" : "text-gray-600"}`}>
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5">
                    <span className="text-[#1AC87E] font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a href={plan.tier === "EMPRESAS" ? "#contato" : APP_URL}
                className={`block text-center py-3.5 rounded-2xl font-bold text-sm transition-all ${plan.ctaStyle}`}>
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ────────────────────────────────────────────────── */
function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const colors = ["#1AC87E", "#4F8EF7", "#FF6B6B", "#FFB347", "#A78BFA", "#34D399"];

  return (
    <section ref={ref} className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Depoimentos</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">O que dizem nossos usuários</motion.h2>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp}
              className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => <span key={j} className="text-yellow-400 text-sm">★</span>)}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: colors[i % colors.length] }}>{t.avatar}</div>
                <div>
                  <div className="font-bold text-sm text-[#0A0F1E]">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FAQ ─────────────────────────────────────────────────────────── */
function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" ref={ref} className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">FAQ</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Dúvidas frequentes</motion.h2>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeUp} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-[#0A0F1E] text-sm pr-4">{faq.q}</span>
                <span className={`text-[#1AC87E] font-bold text-xl transition-transform duration-300 flex-shrink-0 ${openIdx === i ? "rotate-45" : ""}`}>+</span>
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <p className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CONTACT ─────────────────────────────────────────────────────── */
function Contact() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await addDoc(collection(db, "contact_messages"), {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        created_at: new Date().toISOString(),
      });
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const contactInfo = [
    { icon: "✉️", label: "E-MAIL", value: "emdiacontrolefinanceiro@gmail.com", href: "mailto:emdiacontrolefinanceiro@gmail.com" },
    { icon: "💬", label: "WHATSAPP", value: "(85) 98743-6263", href: "https://wa.me/5585987436263" },
    { icon: "📍", label: "LOCALIZAÇÃO", value: "Fortaleza, CE — Brasil", href: null },
  ];

  return (
    <section id="contato" ref={ref} className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Contato</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Vamos conversar</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg max-w-lg mx-auto">
            Tem alguma dúvida, sugestão ou quer saber mais sobre o emdia? Estamos aqui para ajudar.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact info */}
          <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="space-y-4">
            {contactInfo.map((c, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-[#1AC87E]/10 flex items-center justify-center text-xl flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 tracking-widest mb-0.5">{c.label}</div>
                  {c.href ? (
                    <a href={c.href} className="text-[#0A0F1E] font-semibold text-sm hover:text-[#1AC87E] transition-colors">{c.value}</a>
                  ) : (
                    <span className="text-[#0A0F1E] font-semibold text-sm">{c.value}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact form */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }}>
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Nome Completo</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#0A0F1E] focus:outline-none focus:border-[#1AC87E] focus:ring-2 focus:ring-[#1AC87E]/10 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">E-mail</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required type="email"
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#0A0F1E] focus:outline-none focus:border-[#1AC87E] focus:ring-2 focus:ring-[#1AC87E]/10 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Assunto</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#0A0F1E] focus:outline-none focus:border-[#1AC87E] focus:ring-2 focus:ring-[#1AC87E]/10 transition-all bg-white">
                  <option value="">Selecione um assunto</option>
                  <option value="duvida">Dúvida sobre o produto</option>
                  <option value="suporte">Suporte técnico</option>
                  <option value="planos">Planos e preços</option>
                  <option value="parceria">Parceria</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Mensagem</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required
                  rows={5} maxLength={500} placeholder="Escreva sua mensagem..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#0A0F1E] focus:outline-none focus:border-[#1AC87E] focus:ring-2 focus:ring-[#1AC87E]/10 transition-all resize-none" />
                <div className="text-right text-xs text-gray-400 mt-1">{form.message.length}/500</div>
              </div>

              {status === "success" && (
                <div className="p-4 rounded-xl bg-[#1AC87E]/10 border border-[#1AC87E]/20 text-[#1AC87E] text-sm font-semibold text-center">
                  ✓ Mensagem enviada! Entraremos em contato em breve.
                </div>
              )}
              {status === "error" && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm text-center">
                  Erro ao enviar. Tente novamente ou entre em contato pelo e-mail.
                </div>
              )}

              <button type="submit" disabled={status === "loading"}
                className="w-full py-4 rounded-2xl bg-[#1AC87E] text-white font-bold text-sm hover:bg-[#15a368] transition-all disabled:opacity-60 shadow-lg shadow-[#1AC87E]/20">
                {status === "loading" ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────────────────── */
function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className="py-24 bg-[#0A0F1E]">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            Sua assessora no WhatsApp, sempre disponível
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-6xl font-extrabold text-white leading-tight">
            Converse com suas<br />
            <span className="text-[#1AC87E]">finanças agora</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 text-white/60 text-lg max-w-xl mx-auto">
            Cadastro gratuito. Sem compromisso. A Lia te espera no WhatsApp.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10">
            <a href={APP_URL}
              className="inline-block px-10 py-4 rounded-2xl bg-[#1AC87E] text-white font-bold text-lg hover:bg-[#15a368] transition-all shadow-2xl shadow-[#1AC87E]/40 hover:-translate-y-0.5">
              💬 Falar com a Lia
            </a>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-4 text-white/30 text-sm">Sem cartão de crédito • Cancele quando quiser</motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#0A0F1E] border-t border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#1AC87E] flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <span className="font-bold text-xl text-white">emdia</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">Controle financeiro pessoal simples, inteligente e seguro.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Produto</h4>
            <ul className="space-y-2">
              {[["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Planos", "#planos"], ["FAQ", "#faq"]].map(([l, h]) => (
                <li key={l}><a href={h} className="text-white/40 text-sm hover:text-[#1AC87E] transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Empresa</h4>
            <ul className="space-y-2">
              {["Sobre nós", "Blog", "Privacidade", "Termos"].map((l) => (
                <li key={l}><a href="#" className="text-white/40 text-sm hover:text-[#1AC87E] transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contato</h4>
            <a href="mailto:emdiacontrolefinanceiro@gmail.com" className="text-white/40 text-sm hover:text-[#1AC87E] transition-colors block">
              emdiacontrolefinanceiro@gmail.com
            </a>
            <a href="https://wa.me/5585987436263" className="text-white/40 text-sm hover:text-[#1AC87E] transition-colors block mt-1">
              (85) 98743-6263
            </a>
            <div className="mt-4">
              <a href={APP_URL} className="inline-block px-4 py-2.5 rounded-xl bg-[#1AC87E] text-white font-bold text-sm hover:bg-[#15a368] transition-colors">
                Acessar App →
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">© 2025 emdia. Todos os direitos reservados.</p>
          <p className="text-white/20 text-xs">Fortaleza, CE — Brasil</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── PAGE ────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <DemoChart />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Contact />
      <CTA />
      <Footer />
    </div>
  );
}
