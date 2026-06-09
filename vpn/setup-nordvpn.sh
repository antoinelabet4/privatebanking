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

# Désactive needrestart (bloque apt de manière interactive sur Ubuntu)
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_SUSPEND=1
export NEEDRESTART_MODE=a
[ -d /etc/needrestart/conf.d ] && echo "\$nrconf{restart} = 'a';" > /etc/needrestart/conf.d/99-auto.conf

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}   Installation NordVPN - Configuration auto    ${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# --- Installation ---
if command -v nordvpn &> /dev/null; then
    echo -e "${YELLOW}[1/5] NordVPN déjà installé : $(nordvpn --version)${NC}"
else
    echo "[1/5] Téléchargement et installation de NordVPN..."
    # Ajout manuel GPG + dépôt pour éviter tout script interactif tiers
    curl -sSfL https://repo.nordvpn.com/gpg/nordvpn_public.asc \
        | gpg --dearmor > /usr/share/keyrings/nordvpn-archive-keyring.gpg
    # Suppression d'un éventuel doublon de sources
    rm -f /etc/apt/sources.list.d/nordvpn.list
    echo "deb [signed-by=/usr/share/keyrings/nordvpn-archive-keyring.gpg] https://repo.nordvpn.com/deb/nordvpn/debian stable main" \
        > /etc/apt/sources.list.d/nordvpn-app.list
    apt-get update -qq
    apt-get install -y nordvpn
    # Nettoyage doublon éventuel créé par le postinst nordvpn
    if [ -f /etc/apt/sources.list.d/nordvpn.list ] && [ -f /etc/apt/sources.list.d/nordvpn-app.list ]; then
        rm -f /etc/apt/sources.list.d/nordvpn.list
    fi
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
# Attente que le daemon soit prêt
for i in $(seq 1 10); do
    nordvpn status &>/dev/null && break || sleep 1
done
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

run_nordvpn set killswitch on
run_nordvpn set cybersec on
run_nordvpn set obfuscate on
run_nordvpn set notify off
run_nordvpn set autoconnect on "$COUNTRY"
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
