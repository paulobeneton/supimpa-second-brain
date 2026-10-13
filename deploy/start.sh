#!/bin/sh
set -eu

echo "Waiting for database..."
for i in $(seq 1 30); do
  if php artisan migrate:status >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
php artisan migrate --force
exec apache2-foreground