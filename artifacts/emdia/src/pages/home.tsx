import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const APP_URL = "https://emdiafinanceiro.com.br/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

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

const features = [
  {
    icon: "💰",
    title: "Controle de Receitas",
    desc: "Registre todas as suas entradas e acompanhe o crescimento da sua renda mês a mês.",
  },
  {
    icon: "📉",
    title: "Gestão de Despesas",
    desc: "Categorize gastos automaticamente e descubra onde seu dinheiro está indo.",
  },
  {
    icon: "🔔",
    title: "Controle de Dívidas",
    desc: "Alertas automáticos para vencimentos. Nunca mais pague juros por esquecimento.",
  },
  {
    icon: "📊",
    title: "Relatórios Visuais",
    desc: "Gráficos em tempo real que mostram sua saúde financeira de forma clara e intuitiva.",
  },
  {
    icon: "🤖",
    title: "IA Financeira — Lia",
    desc: "Sua assistente pessoal de finanças que aprende com seu perfil e dá sugestões inteligentes.",
  },
  {
    icon: "📤",
    title: "Exportação de Dados",
    desc: "Exporte todo o histórico em CSV para análise em planilhas. Disponível no plano Pro.",
  },
];

const steps = [
  {
    num: "01",
    title: "Registre suas finanças",
    desc: "Toque em + e registre qualquer movimentação com facilidade. Receitas, despesas e dívidas em segundos.",
    icon: "✏️",
  },
  {
    num: "02",
    title: "Veja o gráfico em tempo real",
    desc: "O app gera automaticamente gráficos da sua situação financeira do mês, sempre atualizados.",
    icon: "📈",
  },
  {
    num: "03",
    title: "Tome decisões inteligentes",
    desc: "Com histórico completo e alertas automáticos, você tem tudo para controlar suas finanças.",
    icon: "🧠",
  },
];

const plans = [
  {
    name: "Gratuito",
    price: { monthly: "R$ 0", annual: "R$ 0" },
    period: "para sempre",
    desc: "Ideal para começar",
    features: [
      "Até 15 transações por mês",
      "Gráfico básico de pizza",
      "Histórico de 30 dias",
      "Acesso via navegador",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: "R$ 9,99", annual: "R$ 6,58" },
    period: "/mês",
    desc: "Para quem quer o controle total",
    annualNote: "cobrado como R$ 78,99/ano",
    features: [
      "Transações ilimitadas",
      "Histórico financeiro completo",
      "Exportação CSV",
      "IA Financeira — Lia",
      "Alertas de vencimento",
      "Suporte prioritário",
      "7 dias de garantia",
    ],
    cta: "Assinar Pro",
    popular: true,
  },
];

const testimonials = [
  {
    name: "Ana Paula Ferreira",
    role: "Professora",
    text: "Finalmente entendi pra onde ia meu dinheiro todo mês! O gráfico de pizza deixa tudo muito claro. Em 2 semanas já consegui guardar R$ 400 que antes sumiam sem eu perceber.",
    avatar: "AP",
  },
  {
    name: "Carlos Eduardo Santos",
    role: "Freelancer",
    text: "Como freelancer minha renda varia muito. O emdia me ajudou a controlar os meses ruins sem desespero. O plano anual valeu cada centavo.",
    avatar: "CE",
  },
  {
    name: "Mariana Costa",
    role: "Desenvolvedora",
    text: "Já tentei 4 apps de finanças antes. Esse é o único que não abandonei depois de uma semana. É simples, bonito e funciona de verdade no celular.",
    avatar: "MC",
  },
  {
    name: "Rafael Mendonça",
    role: "Estudante",
    text: "Uso o plano gratuito e já me ajudou muito. Quando me formar vou assinar o Pro sem pensar duas vezes. O gráfico de categorias é incrível!",
    avatar: "RM",
  },
  {
    name: "Juliana Rocha",
    role: "Empresária",
    text: "Separo as finanças pessoais das do negócio e agora consigo ver exatamente minha saúde financeira individual. A exportação CSV facilita muito.",
    avatar: "JR",
  },
  {
    name: "Tiago Alves",
    role: "Motorista",
    text: "Minha renda é diária e variada. Agora registro tudo pelo celular na hora e no fim do mês já sei exatamente quanto ganhei e gastei. Simples demais!",
    avatar: "TA",
  },
];

const faqs = [
  {
    q: "O plano gratuito tem limite de uso?",
    a: "Sim. No plano gratuito você pode registrar até 15 transações por mês e visualizar os últimos 30 dias de histórico.",
  },
  {
    q: "Como funciona o gráfico de pizza?",
    a: "Assim que você registrar suas receitas, despesas e dívidas, o app gera automaticamente um gráfico mostrando sua situação financeira do mês em tempo real.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim, sem burocracia. Se você assinar o plano mensal, pode cancelar quando quiser e continua com acesso até o fim do período pago. No plano anual, oferecemos 7 dias de garantia total.",
  },
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não! O emdia roda direto no navegador do seu celular ou computador. Não ocupa espaço no seu dispositivo e está sempre atualizado.",
  },
  {
    q: "Meus dados financeiros ficam seguros?",
    a: "Com certeza. Os dados são criptografados, ficam salvos na nuvem de forma segura e nunca são compartilhados com terceiros.",
  },
  {
    q: "Como é feito o pagamento?",
    a: "Aceitamos cartão de crédito, débito e Pix. O pagamento é processado de forma segura pelo Stripe.",
  },
  {
    q: "O emdia funciona no celular?",
    a: "Sim! O emdia é totalmente responsivo e funciona perfeitamente em qualquer dispositivo — celular, tablet ou computador — sem precisar instalar nada.",
  },
  {
    q: "O emdia ajuda no controle de dívidas?",
    a: "Sim! O emdia possui um módulo completo de gestão de dívidas com alertas automáticos para vencimentos, ajudando você a evitar juros.",
  },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Planos", href: "#planos" },
    { label: "FAQ", href: "#faq" },
    { label: "Contato", href: "#contato" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1AC87E] to-[#0fa85f] flex items-center justify-center text-white font-black text-sm">
            e
          </div>
          <span className={`font-bold text-xl ${scrolled ? "text-[#0A0F1E]" : "text-white"}`}>emdia</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-[#1AC87E] ${
                scrolled ? "text-gray-600" : "text-white/80"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href={APP_URL}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              scrolled ? "text-gray-700 hover:text-[#1AC87E]" : "text-white hover:text-[#1AC87E]"
            }`}
          >
            Entrar
          </a>
          <a
            href={APP_URL}
            className="text-sm font-bold px-5 py-2.5 rounded-xl bg-[#1AC87E] text-white hover:bg-[#15a368] transition-colors shadow-lg shadow-[#1AC87E]/30"
          >
            Acessar App
          </a>
        </div>

        <button
          className={`md:hidden p-2 ${scrolled ? "text-gray-700" : "text-white"}`}
          onClick={() => setOpen(!open)}
        >
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 px-4 py-4"
          >
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-gray-700 font-medium border-b border-gray-50 hover:text-[#1AC87E]"
              >
                {l.label}
              </a>
            ))}
            <a
              href={APP_URL}
              className="mt-4 block text-center py-3 rounded-xl bg-[#1AC87E] text-white font-bold"
            >
              Acessar App
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Hero() {
  const statsRef = useRef(null);
  const inView = useInView(statsRef, { once: true });
  const users = useCountUp(10000, 2000, inView);
  const money = useCountUp(5, 1800, inView);
  const satisfaction = useCountUp(99, 1500, inView);

  return (
    <section className="hero-bg min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1AC87E]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1AC87E]/10 border border-[#1AC87E]/20 text-[#1AC87E] text-sm font-semibold mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#1AC87E] pulse-green" />
          CONTROLE FINANCEIRO INTELIGENTE
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight max-w-4xl"
        >
          Seu dinheiro,{" "}
          <span className="gradient-text">sob controle</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed"
        >
          O emdia é a plataforma definitiva para gerenciar suas finanças pessoais
          com simplicidade, inteligência e clareza — tudo em um só lugar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href={APP_URL}
            className="px-8 py-4 rounded-2xl bg-[#1AC87E] text-white font-bold text-base hover:bg-[#15a368] transition-all shadow-2xl shadow-[#1AC87E]/40 hover:shadow-[#1AC87E]/60 hover:-translate-y-0.5 active:translate-y-0"
          >
            🔒 Começar grátis
          </a>
          <a
            href="#como-funciona"
            className="px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-base hover:bg-white/20 transition-all border border-white/20"
          >
            Como funciona
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 w-full max-w-2xl float-anim"
        >
          <div className="glass-card rounded-2xl p-4 mx-auto">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-white/60 text-xs font-medium">Painel financeiro — Jun 2025</span>
              <span className="text-[#1AC87E] text-xs font-bold">▲ +18% vs mês anterior</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1AC87E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1AC87E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="red" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#141929", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12 }}
                  formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                />
                <Area type="monotone" dataKey="receitas" stroke="#1AC87E" strokeWidth={2} fill="url(#green)" />
                <Area type="monotone" dataKey="despesas" stroke="#FF6B6B" strokeWidth={2} fill="url(#red)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-2 px-1">
              <span className="flex items-center gap-1.5 text-white/60 text-xs"><span className="w-2 h-2 rounded-full bg-[#1AC87E]" />Receitas</span>
              <span className="flex items-center gap-1.5 text-white/60 text-xs"><span className="w-2 h-2 rounded-full bg-[#FF6B6B]" />Despesas</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div ref={statsRef} className="bg-white py-12">
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

function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section id="como-funciona" ref={ref} className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Como funciona</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Simples como deve ser</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">Três passos para ter controle total das suas finanças pessoais.</motion.p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div key={i} variants={fadeUp} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#1AC87E]/40 to-transparent" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-[#1AC87E]/10 border border-[#1AC87E]/20 flex items-center justify-center text-3xl mx-auto mb-4">
                {step.icon}
              </div>
              <div className="text-[#1AC87E] font-black text-sm mb-2">{step.num}</div>
              <h3 className="font-bold text-xl text-[#0A0F1E] mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section id="funcionalidades" ref={ref} className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Funcionalidades</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Tudo que você precisa</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">Ferramentas poderosas em uma interface simples e bonita.</motion.p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="card-hover p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-[#1AC87E]/30 hover:shadow-[#1AC87E]/10"
            >
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
              Veja sua situação financeira <span className="gradient-text">de verdade</span>
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
                <div key={item.label} className="glass-card rounded-xl p-3 text-center">
                  <div className="text-xs font-medium mb-1" style={{ color: item.color }}>{item.label}</div>
                  <div className="text-white font-bold text-sm">{item.value}</div>
                </div>
              ))}
            </motion.div>
            <motion.a variants={fadeUp} href={APP_URL} className="mt-8 inline-block px-6 py-3 rounded-xl bg-[#1AC87E] text-white font-bold hover:bg-[#15a368] transition-colors">
              Ver meu painel →
            </motion.a>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.7 }}>
            <div className="glass-card rounded-2xl p-6">
              <div className="text-white/60 text-sm font-medium mb-4">Distribuição — Junho 2025</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="planos" ref={ref} className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-12">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Planos</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Escolha seu plano</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg">Comece grátis. Upgrade quando quiser.</motion.p>

          <motion.div variants={fadeUp} className="mt-8 inline-flex items-center gap-1 p-1 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${!annual ? "bg-[#1AC87E] text-white shadow" : "text-gray-500"}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${annual ? "bg-[#1AC87E] text-white shadow" : "text-gray-500"}`}
            >
              Anual
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${annual ? "bg-white/20 text-white" : "bg-[#1AC87E]/10 text-[#1AC87E]"}`}>-34%</span>
            </button>
          </motion.div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={i} variants={fadeUp} className={`rounded-3xl p-8 relative ${plan.popular ? "pricing-popular text-white" : "bg-white border border-gray-200 shadow-sm"}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1AC87E] text-white text-xs font-bold rounded-full shadow">
                  MAIS POPULAR
                </div>
              )}
              <div className={`text-sm font-bold mb-1 ${plan.popular ? "text-[#1AC87E]" : "text-[#1AC87E]"}`}>{plan.name}</div>
              <div className={`text-sm mb-4 ${plan.popular ? "text-white/60" : "text-gray-400"}`}>{plan.desc}</div>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-4xl font-black ${plan.popular ? "text-white" : "text-[#0A0F1E]"}`}>
                  {annual ? plan.price.annual : plan.price.monthly}
                </span>
                <span className={`text-sm mb-1.5 ${plan.popular ? "text-white/60" : "text-gray-400"}`}>{plan.period}</span>
              </div>
              {plan.popular && annual && (
                <p className="text-white/50 text-xs mb-6">{plan.annualNote}</p>
              )}
              <ul className={`space-y-3 mt-6 mb-8 text-sm ${plan.popular ? "text-white/80" : "text-gray-600"}`}>
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <span className="text-[#1AC87E] font-bold text-base">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={APP_URL}
                className={`block text-center py-3.5 rounded-2xl font-bold text-sm transition-all ${
                  plan.popular
                    ? "bg-[#1AC87E] text-white hover:bg-[#15a368] shadow-lg shadow-[#1AC87E]/30"
                    : "bg-[#0A0F1E] text-white hover:bg-gray-800"
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const colors = ["#1AC87E", "#4F8EF7", "#FF6B6B", "#FFB347", "#A78BFA", "#34D399"];

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">Depoimentos</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">O que dizem nossos usuários</motion.h2>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp} className="card-hover p-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: colors[i % colors.length] }}
                >
                  {t.avatar}
                </div>
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

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" ref={ref} className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#1AC87E] font-bold text-sm uppercase tracking-widest mb-3">FAQ</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-[#0A0F1E]">Dúvidas frequentes</motion.h2>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-[#0A0F1E] text-sm pr-4">{faq.q}</span>
                <span className={`text-[#1AC87E] font-bold text-lg transition-transform duration-300 flex-shrink-0 ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
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

function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className="py-24 bg-[#0A0F1E]">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1AC87E]/10 border border-[#1AC87E]/20 text-[#1AC87E] text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-[#1AC87E] pulse-green" />
            Mais de 10.000 usuários ativos
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-6xl font-extrabold text-white leading-tight">
            Comece a controlar suas<br />
            <span className="gradient-text">finanças hoje mesmo</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 text-white/60 text-lg max-w-xl mx-auto">
            É grátis para sempre. Upgrade apenas quando precisar de mais.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={APP_URL}
              className="px-10 py-4 rounded-2xl bg-[#1AC87E] text-white font-bold text-lg hover:bg-[#15a368] transition-all shadow-2xl shadow-[#1AC87E]/40 hover:-translate-y-0.5"
            >
              🔒 Criar conta grátis
            </a>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-4 text-white/30 text-sm">Sem cartão de crédito • Cancele quando quiser</motion.p>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contato" className="bg-[#0A0F1E] border-t border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1AC87E] to-[#0fa85f] flex items-center justify-center text-white font-black text-sm">e</div>
              <span className="font-bold text-xl text-white">emdia</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">Controle financeiro pessoal simples, inteligente e seguro.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Produto</h4>
            <ul className="space-y-2">
              {["Como funciona", "Funcionalidades", "Planos", "FAQ"].map((l) => (
                <li key={l}><a href={`#${l.toLowerCase().replace(" ", "-")}`} className="text-white/40 text-sm hover:text-[#1AC87E] transition-colors">{l}</a></li>
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
            <a href="mailto:contato@emdiafinanceiro.com.br" className="text-white/40 text-sm hover:text-[#1AC87E] transition-colors">
              contato@emdiafinanceiro.com.br
            </a>
            <div className="mt-4">
              <a
                href={APP_URL}
                className="inline-block px-4 py-2.5 rounded-xl bg-[#1AC87E] text-white font-bold text-sm hover:bg-[#15a368] transition-colors"
              >
                Acessar App →
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">© 2025 emdia. Todos os direitos reservados.</p>
          <p className="text-white/20 text-xs">Feito com ❤️ no Brasil</p>
        </div>
      </div>
    </footer>
  );
}

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
      <CTA />
      <Footer />
    </div>
  );
}
