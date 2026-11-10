#!/usr/bin/env bash
# Lo corre el servidor cada 5 minutos (kaibu-bot-actualizar.timer): si en GitHub hay cambios
# del bot, los baja, instala lo que haga falta y reinicia el bot. Si no hay cambios, no hace nada.
# Uso: actualizar.sh <carpeta del repositorio> <usuario dueño>
set -euo pipefail

CARPETA="${1:?Falta la carpeta del repositorio}"
USUARIO="${2:?Falta el usuario}"
como() { sudo -u "$USUARIO" "$@"; }

cd "$CARPETA"
antes="$(como git rev-parse HEAD)"
como git fetch -q --depth 1 origin main
despues="$(como git rev-parse FETCH_HEAD)"
[ "$antes" = "$despues" ] && exit 0

cambio_el_bot=1
como git diff --quiet "$antes" "$despues" -- kaibu-bot-discord && cambio_el_bot=0
como git reset -q --hard FETCH_HEAD
[ "$cambio_el_bot" = 0 ] && exit 0

(cd kaibu-bot-discord && como npm ci --omit=dev --no-audit --no-fund --loglevel=error)
systemctl restart kaibu-bot
echo "Bot actualizado a ${despues:0:7}"
