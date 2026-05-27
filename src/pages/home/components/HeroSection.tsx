import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="https://readdy.ai/api/search-image?query=modern%20minimalist%20financial%20dashboard%20workspace%20with%20clean%20desk%2C%20laptop%20showing%20charts%20and%20graphs%2C%20soft%20natural%20light%2C%20premium%20lifestyle%2C%20money%20management%2C%20personal%20finance%20app%2C%20elegant%20and%20professional%20atmosphere%2C%20warm%20neutral%20tones%20with%20subtle%20green%20accents%2C%20high-end%20photography%20style%2C%20bokeh%20background%2C%20sophisticated%20and%20trustworthy&width=1920&height=1080&seq=hero-emdia-v3&orientation=landscape"
          alt="emdia hero background"
          className="w-full h-full object-cover object-top"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/60" />
        {/* Brand tint overlay - warm green tones only, NO blue/purple */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/30 via-transparent to-forest-950/20" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-brand-400/10 blur-2xl animate-float" />
      <div className="absolute bottom-32 right-16 w-32 h-32 rounded-full bg-gold-400/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wider uppercase shadow-soft">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse inline-block shadow-glow-green" />
          Controle Financeiro Inteligente
        </div>


        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
          Seu dinheiro,
          <br />
          <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-gold-200 bg-clip-text text-transparent">
            sob controle
          </span>
        </h1>

        <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          O emdia é a plataforma definitiva para gerenciar suas finanças pessoais com simplicidade, inteligência e clareza — tudo em um só lugar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth"
            className="px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold text-base rounded-full transition-all duration-300 whitespace-nowrap cursor-pointer flex items-center gap-2 shadow-glow-green hover:shadow-lg hover:-translate-y-0.5"
          >
            <i className="ri-rocket-line" /> Começar grátis
          </Link>
          <button
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-4 border-2 border-white/40 text-white font-bold text-base rounded-full hover:bg-white/10 transition-all duration-200 whitespace-nowrap cursor-pointer backdrop-blur-sm hover:border-white/60"
          >
            Como funciona
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[
            { value: "10k+", label: "Usuários ativos" },
            { value: "R$ 5M+", label: "Gerenciados" },
            { value: "99%", label: "Satisfação" },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-white/5 backdrop-blur-sm rounded-2xl py-4 px-3 border border-white/10">
              <div className="text-3xl md:text-4xl font-extrabold text-white">{stat.value}</div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 C360,0 1080,80 1440,20 L1440,80 L0,80 Z" fill="#f8fafc" />
        </svg>
      </div>
    </section>
  );
}
