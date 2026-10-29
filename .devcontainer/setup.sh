#!/usr/bin/env bash
# Roda uma vez, quando o Codespace é criado.
set -euo pipefail

(cd backend && ./mvnw -B -q dependency:go-offline) || echo "Aviso: download das dependências Maven falhou; o primeiro build baixa de novo."
(cd frontend && npm ci)
