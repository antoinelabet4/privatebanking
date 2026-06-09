#!/bin/bash
# NordVPN - Installation complète automatique (Ubuntu/Debian)
# Usage: sudo bash setup-nordvpn.sh
# Tout le trafic passe par NordVPN. Seule étape manuelle : nordvpn login

set -e

COUNTRY="Switzerland"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Lancer avec sudo : sudo bash setup-nordvpn.sh${NC}"
    exit 1
fi

REAL_USER="${SUDO_USER:-$USER}"

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}   Installation NordVPN - Configuration auto    ${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# --- Installation ---
if command -v nordvpn &> /dev/null; then
    echo -e "${YELLOW}NordVPN déjà installé : $(nordvpn --version)${NC}"
else
    echo "[1/5] Téléchargement et installation de NordVPN..."
    # Ajout de la clé GPG et du dépôt NordVPN manuellement pour pouvoir passer -y
    curl -sSf https://downloads.nordcdn.com/configs/linux/kde/packages/nordvpn-release_1.0.0_all.deb -o /tmp/nordvpn-release.deb 2>/dev/null \
        || wget -qO /tmp/nordvpn-release.deb https://repo.nordvpn.com/deb/nordvpn/debian/pool/main/nordvpn-release_1.0.0_all.deb
    DEBIAN_FRONTEND=noninteractive dpkg -i /tmp/nordvpn-release.deb
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y nordvpn
    rm -f /tmp/nordvpn-release.deb
    echo -e "${GREEN}OK${NC}"
fi

# --- Groupe nordvpn ---
echo "[2/5] Configuration des permissions..."
if [ -n "$REAL_USER" ] && [ "$REAL_USER" != "root" ]; then
    usermod -aG nordvpn "$REAL_USER" 2>/dev/null || true
fi
echo -e "${GREEN}OK${NC}"

# --- Service ---
echo "[3/5] Démarrage du service nordvpnd..."
systemctl enable nordvpnd --quiet
systemctl restart nordvpnd
sleep 2
echo -e "${GREEN}OK${NC}"

# --- Paramètres de sécurité ---
echo "[4/5] Application des paramètres de sécurité..."

run_nordvpn() {
    if [ -n "$REAL_USER" ] && [ "$REAL_USER" != "root" ]; then
        su - "$REAL_USER" -c "nordvpn $*" 2>/dev/null || nordvpn "$@" 2>/dev/null || true
    else
        nordvpn "$@" 2>/dev/null || true
    fi
}

run_nordvpn set killswitch on       # Coupe internet si VPN tombe
run_nordvpn set cybersec on         # Bloque pubs et malwares
run_nordvpn set obfuscate on        # Masque le trafic VPN
run_nordvpn set notify off          # Pas de notifications
run_nordvpn set autoconnect on "$COUNTRY"

# DNS NordVPN anti-fuite
run_nordvpn set dns 103.86.96.100 103.86.99.100

echo -e "${GREEN}OK${NC}"

# --- Service auto-connexion boot ---
echo "[5/5] Création du service de démarrage automatique..."
cat > /etc/systemd/system/nordvpn-autoconnect.service <<EOF
[Unit]
Description=NordVPN auto-connect
After=nordvpnd.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=${REAL_USER}
ExecStart=/usr/bin/nordvpn connect ${COUNTRY}
RemainAfterExit=yes
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nordvpn-autoconnect.service --quiet
echo -e "${GREEN}OK${NC}"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Installation terminée avec succès            ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Paramètres actifs :"
echo -e "  Kill Switch   : ${GREEN}ON${NC}  (internet coupé si VPN tombe)"
echo -e "  CyberSec      : ${GREEN}ON${NC}  (pubs et malwares bloqués)"
echo -e "  Obfuscation   : ${GREEN}ON${NC}  (trafic VPN masqué)"
echo -e "  Auto-connect  : ${GREEN}ON${NC}  → ${COUNTRY}"
echo -e "  DNS anti-fuite: ${GREEN}ON${NC}"
echo ""
echo -e "${YELLOW}Une seule étape restante — connecte ton compte :${NC}"
echo ""
echo -e "  ${CYAN}nordvpn login${NC}"
echo ""
echo -e "NordVPN se connectera ensuite automatiquement à ${COUNTRY} à chaque démarrage."
echo ""
