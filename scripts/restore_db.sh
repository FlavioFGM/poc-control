#!/bin/sh
# Restaura um backup gerado por backup_db.sh. USO:
#   ./scripts/restore_db.sh backups/poc-control-20261023-030000.sql.gz
# Sobrescreve os dados atuais do banco `db` com o conteúdo do dump.

set -eu

if [ "${1:-}" = "" ]; then
    echo "Uso: $0 <arquivo.sql.gz>" >&2
    exit 1
fi

ARQUIVO="$1"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "Isso vai sobrescrever o banco atual com o conteúdo de $ARQUIVO."
printf "Confirma? (digite SIM) "
read -r CONFIRMACAO
if [ "$CONFIRMACAO" != "SIM" ]; then
    echo "Cancelado."
    exit 1
fi

gunzip -c "$ARQUIVO" | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

echo "Restauração concluída."
