        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A0F1E]">
            Olá, {user?.displayName?.split(" ")[0] ?? "usuário"} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* AI Insights (Copilot) */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <InsightsCard />
          </motion.div>
        )}

        {/* Stats */}
