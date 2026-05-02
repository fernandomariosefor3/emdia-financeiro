import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "../lib/supabase";

const APP_URL = "https://app.emdiafinanceiro.com.br";
const HERO_BG = "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1920&q=80&auto=format&fit=crop";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

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
    title: "Registre suas finanças",
    desc: "Adicione suas receitas, despesas e dívidas em poucos segundos. Escolha a categoria, valor e data — simples assim, sem complicação.",
    tags: ["Receitas", "Despesas", "Dívidas"],
    mockup: [
      { label: "Salário", value: "+ R$ 3.500", color: "text-[#1AC87E]", icon: "↑" },
      { label: "Aluguel", value: "- R$ 900", color: "text-red-400", icon: "↓" },
      { label: "Cartão", value: "- R$ 450", color: "text-orange-400", icon: "💳" },
    ],
  },
  {
    num: "02",
    title: "Veja o gráfico em tempo real",
    desc: "O app gera automaticamente gráficos da sua situação financeira do mês, sempre atualizados. Visualize receitas, despesas e dívidas de forma clara.",
    tags: ["Gráficos", "Tempo real", "Categorias"],
    mockup: [
      { label: "Receitas", value: "R$ 3.500", color: "text-[#1AC87E]", icon: "📈" },
      { label: "Despesas", value: "R$ 1.350", color: "text-red-400", icon: "📉" },
      { label: "Saldo", value: "+ R$ 2.150", color: "text-blue-400", icon: "💰" },
    ],
  },
  {
    num: "03",
    title: "Tome decisões inteligentes",
    desc: "Com histórico completo, alertas automáticos e a IA Lia ao seu lado, você tem tudo para controlar suas finanças com clareza total.",
    tags: ["IA Lia", "Alertas", "Histórico"],
    mockup: [
      { label: "Meta do mês", value: "87% atingida", color: "text-[#1AC87E]", icon: "🎯" },
      { label: "Alerta", value: "Cartão vence em 3d", color: "text-orange-400", icon: "🔔" },
      { label: "Sugestão IA", value: "Economize R$ 200", color: "text-blue-400", icon: "🤖" },
    ],
  },
];

const features = [
  { icon: "💰", title: "Controle de Receitas", desc: "Registre todas as suas entradas e acompanhe o crescimento da sua renda mês a mês." },
  { icon: "📉", title: "Gestão de Despesas", desc: "Categorize gastos automaticamente e descubra onde seu dinheiro está indo." },
  { icon: "🔔", title: "Controle de Dívidas", desc: "Alertas automáticos para vencimentos. Nunca mais pague juros por esquecimento." },
  { icon: "📊", title: "Relatórios Visuais", desc: "Gráficos em tempo real que mostram sua saúde financeira de forma clara e intuitiva." },
  { icon: "🤖", title: "IA Financeira — Lia", desc: "Sua assistente pessoal de finanças que aprende com seu perfil e dá sugestões inteligentes." },
  { icon: "📤", title: "Exportação de Dados", desc: "Exporte todo o histórico em CSV para análise em planilhas. Disponível no plano Pro." },
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
  { q: "O plano gratuito tem limite de uso?", a: "Sim. No plano gratuito você pode registrar até 15 transações por mês e visualizar os últimos 30 dias de histórico." },
  { q: "Como funciona o gráfico de pizza?", a: "Assim que você registrar suas receitas, despesas e dívidas, o app gera automaticamente um gráfico mostrando sua situação financeira do mês em tempo real." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem burocracia. Se você assinar o plano mensal, pode cancelar quando quiser e continua com acesso até o fim do período pago. No plano anual, oferecemos 7 dias de garantia total." },
  { q: "Preciso instalar alguma coisa?", a: "Não! O emdia roda direto no navegador do seu celular ou computador. Não ocupa espaço no seu dispositivo e está sempre atualizado." },
  { q: "Meus dados financeiros ficam seguros?", a: "Com certeza. Os dados são criptografados, ficam salvos na nuvem de forma segura e nunca são compartilhados com terceiros." },
  { q: "Como é feito o pagamento?", a: "Aceitamos cartão de crédito, débito e Pix. O pagamento é processado de forma segura pelo Stripe." },
  { q: "O emdia funciona no celular?", a: "Sim! O emdia é totalmente responsivo e funciona perfeitamente em qualquer dispositivo — celular, tablet ou computador — sem precisar instalar nada." },
  { q: "O emdia ajuda no controle de dívidas?", a: "Sim! O emdia possui um módulo completo de gestão de dívidas com alertas automáticos para vencimentos, ajudando você a evitar juros." },
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
          <img src="/logo.jpg" alt="emdia" className="w-9 h-9 rounded-lg object-cover" />
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
          <a href={APP_URL} className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${scrolled ? "text-gray-700 hover:text-[#1AC87E]" : "text-white hover:text-[#1AC87E]"}`}>Entrar</a>
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
    <section className="relative min-h-screen flex flex-col">
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      />
      <div className="absolute inset-0 bg-[#0A0F1E]/60" />

      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1AC87E]/15 border border-[#1AC87E]/30 text-[#1AC87E] text-sm font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-[#1AC87E] animate-pulse" />
          CONTROLE FINANCEIRO INTELIGENTE
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight max-w-3xl">
          Seu dinheiro,{" "}
          <span className="text-[#1AC87E]">sob controle</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg text-white/75 max-w-xl leading-relaxed">
          O emdia é a plataforma definitiva para gerenciar suas finanças pessoais
          com simplicidade, inteligência e clareza — tudo em um só lugar.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href={APP_URL}
            className="px-8 py-4 rounded-full bg-[#1AC87E] text-white font-bold text-base hover:bg-[#15a368] transition-all shadow-xl shadow-[#1AC87E]/30 flex items-center gap-2">
            🔒 Começar grátis
          </a>
          <a href="#como-funciona"
            className="px-8 py-4 rounded-full bg-white/10 text-white font-bold text-base hover:bg-white/20 transition-all border border-white/25">
            Como funciona
          </a>
        </motion.div>

        {/* Floating logo */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 animate-bounce">
          <img src="/logo.jpg" alt="emdia" className="w-full h-full object-cover" />
        </motion.div>
      </div>

      {/* Stats bar */}
      <div ref={statsRef} className="relative bg-white py-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          {[
            { value: `${users >= 10000 ? "10k" : users}+`, label: "Usuários ativos" },
            { value: `R$ ${money}M+`, label: "Gerenciados" },
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
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Do caos financeiro à clareza total</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Em menos de 2 minutos você já tem uma visão completa das suas finanças. Sem planilha, sem complicação.
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
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Funcionalidades</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Tudo que você precisa</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">Ferramentas poderosas em uma interface simples e bonita.</motion.p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp}
              className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-[#1AC87E]/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="text-3xl mb-4">{f.icon}</div>
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
            <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Visualização em tempo real</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Veja sua situação financeira <span className="text-[#1AC87E]">de verdade</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-white/60 text-lg leading-relaxed">
              Gráficos automáticos que mostram receitas, despesas e dívidas em uma visão clara e intuitiva. Sem planilhas complicadas.
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
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.from("contact_messages").insert([{
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
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
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1AC87E]/10 border border-[#1AC87E]/20 text-[#1AC87E] text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-[#1AC87E] animate-pulse" />
            Mais de 10.000 usuários ativos
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-6xl font-extrabold text-white leading-tight">
            Comece a controlar suas<br />
            <span className="text-[#1AC87E]">finanças hoje mesmo</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 text-white/60 text-lg max-w-xl mx-auto">
            É grátis para sempre. Upgrade apenas quando precisar de mais.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10">
            <a href={APP_URL}
              className="inline-block px-10 py-4 rounded-2xl bg-[#1AC87E] text-white font-bold text-lg hover:bg-[#15a368] transition-all shadow-2xl shadow-[#1AC87E]/40 hover:-translate-y-0.5">
              🔒 Criar conta grátis
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
              <img src="/logo.jpg" alt="emdia" className="w-8 h-8 rounded-lg object-cover" />
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
