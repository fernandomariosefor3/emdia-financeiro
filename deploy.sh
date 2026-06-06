#!/bin/bash
# ============================================
# Script de Deploy — emdia Financeiro
# Deploy para: GitHub + Firebase + Vercel
# ============================================

set -e

echo ""
echo "🚀 emdia Financeiro — Script de Deploy"
echo "======================================="
echo ""

# ---- 1. Build ----
echo "📦 [1/4] Instalando dependências e fazendo build..."
npm install
npm run build
echo "✅ Build concluído!"
echo ""

# ---- 2. GitHub ----
echo "🐙 [2/4] Enviando para o GitHub..."
git add -A
if git diff --cached --quiet; then
  echo "   Nenhuma mudança para commitar."
else
  git commit -m "chore: deploy $(date +%Y-%m-%d_%H-%M)"
  git push origin main
  echo "✅ Push para GitHub concluído!"
fi
echo ""

# ---- 3. Firebase ----
echo "🔥 [3/4] Deploy no Firebase Hosting..."
echo "   Projeto: emdiafinanceiro-13483"
firebase deploy --only hosting --project emdiafinanceiro-13483
echo "✅ Deploy no Firebase concluído!"
echo ""

# ---- 4. Vercel ----
echo "▲ [4/4] Deploy na Vercel..."
vercel --prod --yes
echo "✅ Deploy na Vercel concluído!"
echo ""

echo "🎉 Deploy completo em todas as plataformas!"
echo ""
echo "URLs:"
echo "  🔥 Firebase:  https://emdiafinanceiro-13483.web.app"
echo "  🔥 Firebase:  https://emdiafinanceiro-13483.firebaseapp.com"
echo "  ▲ Vercel:     https://emdia-financeiro.vercel.app"
echo "  🌐 Domínio:   https://emdiafinanceiro.com.br"
echo ""
