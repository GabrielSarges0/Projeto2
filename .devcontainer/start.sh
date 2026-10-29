#!/usr/bin/env bash
# Roda a cada vez que o Codespace inicia: traz o que foi enviado do outro computador.
set -uo pipefail

if [ -z "$(git status --porcelain)" ]; then
  git pull --rebase --quiet origin main || echo "Aviso: git pull falhou; rode 'git pull' manualmente."
else
  echo "Há alterações locais não enviadas; git pull automático ignorado."
fi

if [ -z "${NEXT_PUBLIC_API_URL:-}" ]; then
  echo "Aviso: Codespaces secret NEXT_PUBLIC_API_URL ausente; o frontend vai chamar http://localhost:8080."
fi

if [ -n "${CODESPACE_NAME:-}" ]; then
  echo "Frontend neste Codespace: https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
fi
