#!/bin/sh
# Daily backup of the database and uploaded images. Keeps 14 days.
# Cron (as a user in the docker group):
#   30 2 * * * /opt/vnpt-heart/deploy/backup.sh >> /var/log/vnpt-heart-backup.log 2>&1
set -eu
cd "$(dirname "$0")"
BACKUP_DIR="${BACKUP_DIR:-$(pwd)/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

docker compose exec -T db pg_dump -U vnpt_heart -Fc vnpt_heart > "$BACKUP_DIR/db-$STAMP.dump"
docker compose run --rm --no-deps --user root -v "$BACKUP_DIR:/backup" --entrypoint tar api \
  czf "/backup/uploads-$STAMP.tgz" -C /data/uploads .

# drop backups older than KEEP_DAYS (only files this script created)
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'uploads-*.tgz' \) -mtime +"$KEEP_DAYS" -exec rm -f {} +
echo "$(date '+%F %T') backup ok: db-$STAMP.dump uploads-$STAMP.tgz"
