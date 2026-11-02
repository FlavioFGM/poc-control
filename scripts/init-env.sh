#!/bin/sh
# Cria o .env na primeira execução (sem sobrescrever um existente): copia .env.example, gera
# POSTGRES_PASSWORD e SESSION_SECRET aleatórios, pergunta e-mail/senha do admin e grava o hash
# argon2 já no formato certo para o engine de compose detectado.
#
# Uso: scripts/init-env.sh        (interativo)
#      ADMIN_EMAIL=a@b.c ADMIN_PASSWORD=... scripts/init-env.sh   (não interativo)
#
# Atenção: o volume `pgdata` guarda as credenciais do PRIMEIRO start do banco. Se você já subiu o
# stack sem .env, rode `docker compose down -v` (apaga os dados do banco) antes de subir de novo.

set -eu

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
    echo ".env já existe -- nada a fazer (apague-o para gerar de novo)."
    exit 0
fi

if command -v docker >/dev/null 2>&1; then ENGINE=docker; COMPOSE="docker compose"
elif command -v podman >/dev/null 2>&1; then ENGINE=podman; COMPOSE="podman-compose"
else echo "Nem docker nem podman encontrados." >&2; exit 1; fi

rand() { head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n' | cut -c1-"$1"; }

EMAIL="${ADMIN_EMAIL:-}"
if [ -z "$EMAIL" ]; then printf "E-mail do admin: "; read -r EMAIL; fi
SENHA="${ADMIN_PASSWORD:-}"
if [ -z "$SENHA" ]; then
    printf "Senha do admin: "; stty -echo 2>/dev/null || true; read -r SENHA; stty echo 2>/dev/null || true; echo
fi
[ -n "$EMAIL" ] && [ -n "$SENHA" ] || { echo "E-mail e senha são obrigatórios." >&2; exit 1; }

echo "Construindo a imagem da api para gerar o hash da senha..."
# Direto pelo engine (não pelo compose): sem .env o compose recusa até o build, por causa dos ${VAR:?}.
IMAGEM="poc-control-hash:tmp"
$ENGINE build -q -t "$IMAGEM" ./api >/dev/null
HASH="$($ENGINE run --rm --entrypoint python "$IMAGEM" scripts/hash_password.py "$SENHA" | tail -n1)"
case "$HASH" in '$argon2'*) ;; *) echo "Falha ao gerar o hash: $HASH" >&2; exit 1;; esac

# Docker Compose real interpola "$" no .env (escrever "$$"); podman-compose não (ver .env.example).
if [ "$ENGINE" = docker ]; then HASH_ENV="$(printf '%s' "$HASH" | sed 's/\$/$$/g')"; else HASH_ENV="$HASH"; fi

PGPASS="$(rand 32)"; SECRET="$(rand 48)"
# '|' como delimitador do sed; o hash não contém '|'. '&' no hash seria especial, então escapa.
HASH_SED="$(printf '%s' "$HASH_ENV" | sed 's/[&|\\]/\\&/g')"
sed -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$PGPASS|" \
    -e "s|^SESSION_SECRET=.*|SESSION_SECRET=$SECRET|" \
    -e "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=$EMAIL|" \
    -e "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=$HASH_SED|" \
    .env.example > .env
chmod 600 .env
echo ".env criado. Preencha GEMINI_API_KEY nele (ou por usuário, dentro do app) e rode: $COMPOSE up -d --build"
