#!/bin/sh
set -e

# Falha cedo e com mensagem clara se o .env não foi preparado (scripts/init-env.sh).
if [ -z "${ADMIN_PASSWORD_HASH:-}" ] || [ -z "${SESSION_SECRET:-}" ] || [ "${SESSION_SECRET:-}" = "changeme" ]; then
    echo "ERRO: ADMIN_PASSWORD_HASH/SESSION_SECRET ausentes ou ainda com valor de exemplo." >&2
    echo "Rode scripts/init-env.sh (ou preencha o .env conforme DOCKER.md) e suba de novo." >&2
    exit 1
fi

python -m alembic upgrade head
python -m app.seed

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
