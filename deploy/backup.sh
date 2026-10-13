#!/usr/bin/env bash
set -euo pipefail
umask 077
mkdir -p backups
filename="backups/second-brain-$(date +%Y%m%d-%H%M%S).sql.gz"
docker compose exec -T db sh -c 'exec mariadb-dump --single-transaction --routines --events -uroot -p"$MARIADB_ROOT_PASSWORD" second_brain' | gzip > "$filename"
gzip -t "$filename"
printf 'Backup criado: %s\n' "$filename"