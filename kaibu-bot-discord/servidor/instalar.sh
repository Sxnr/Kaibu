#!/usr/bin/env bash
# Instala el bot de Kaibu en un servidor Ubuntu propio (por ejemplo Oracle Cloud "Always Free").
# Uso (una sola vez, en el servidor):
#   curl -fsSL https://raw.githubusercontent.com/Sxnr/Kaibu/main/kaibu-bot-discord/servidor/instalar.sh | bash
# Se puede correr de nuevo sin problemas. Las llaves NO van en este archivo: van en ~/kaibu-bot.env.
set -euo pipefail

REPO="https://github.com/Sxnr/Kaibu.git"
USUARIO="$(whoami)"
CARPETA="$HOME/Kaibu"
LLAVES="$HOME/kaibu-bot.env"
VERSION_NODE=22

echo "▶ 1/5 · Instalando Node.js ${VERSION_NODE} y git…"
sudo apt-get update -qq
sudo apt-get install -y -qq git curl ca-certificates >/dev/null
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt "$VERSION_NODE" ]; then
  curl -fsSL "https://deb.nodesource.com/setup_${VERSION_NODE}.x" | sudo -E bash - >/dev/null
  sudo apt-get install -y -qq nodejs >/dev/null
fi
echo "  Node $(node -v)"

echo "▶ 2/5 · Bajando solo la carpeta del bot desde GitHub…"
if [ ! -d "$CARPETA/.git" ]; then
  git clone -q --depth 1 --filter=blob:none --sparse "$REPO" "$CARPETA"
  git -C "$CARPETA" sparse-checkout set kaibu-bot-discord
fi
(cd "$CARPETA/kaibu-bot-discord" && npm ci --omit=dev --no-audit --no-fund --loglevel=error)
chmod +x "$CARPETA/kaibu-bot-discord/servidor/actualizar.sh"

echo "▶ 3/5 · Archivo de llaves (~/kaibu-bot.env)…"
if [ ! -f "$LLAVES" ]; then
  cp "$CARPETA/kaibu-bot-discord/.env.example" "$LLAVES"
fi
chmod 600 "$LLAVES"

echo "▶ 4/5 · Dejando el bot como servicio (se enciende solo y se reinicia si falla)…"
sudo tee /etc/systemd/system/kaibu-bot.service >/dev/null <<EOF
[Unit]
Description=Bot de Discord de Kaibu
After=network-online.target
Wants=network-online.target

[Service]
User=${USUARIO}
WorkingDirectory=${CARPETA}/kaibu-bot-discord
EnvironmentFile=${LLAVES}
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
EOF

# Cada 5 minutos revisa si hay cambios del bot en GitHub (como hacía Render).
sudo tee /etc/systemd/system/kaibu-bot-actualizar.service >/dev/null <<EOF
[Unit]
Description=Actualiza el bot de Kaibu desde GitHub

[Service]
Type=oneshot
ExecStart=${CARPETA}/kaibu-bot-discord/servidor/actualizar.sh ${CARPETA} ${USUARIO}
EOF
sudo tee /etc/systemd/system/kaibu-bot-actualizar.timer >/dev/null <<EOF
[Unit]
Description=Revisa cada 5 minutos si hay una versión nueva del bot de Kaibu

[Timer]
OnBootSec=3min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable -q kaibu-bot kaibu-bot-actualizar.timer
sudo systemctl start kaibu-bot-actualizar.timer

echo "▶ 5/5 · Encendiendo…"
if grep -qE '^DISCORD_TOKEN=.+' "$LLAVES" && grep -qE '^SUPABASE_SERVICE_ROLE_KEY=.+' "$LLAVES"; then
  sudo systemctl restart kaibu-bot
  echo "✅ Listo. Mira cómo arranca con:  journalctl -u kaibu-bot -f"
else
  echo ""
  echo "✋ Falta poner las llaves. Escribe:  nano ~/kaibu-bot.env"
  echo "   Copia los valores desde Render → Environment, guarda (Ctrl+O, Enter) y sal (Ctrl+X)."
  echo "   Después escribe:  sudo systemctl restart kaibu-bot"
fi
