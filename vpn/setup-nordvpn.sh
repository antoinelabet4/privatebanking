#!/bin/bash
# NordVPN - Installation et configuration (Ubuntu/Debian)
# Usage: sudo bash setup-nordvpn.sh
# Tout le trafic du mini PC passera par NordVPN.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Ce script doit être exécuté en root (sudo).${NC}"
    exit 1
fi

echo -e "${CYAN}=== Installation NordVPN ===${NC}"

# Vérification si déjà installé
if command -v nordvpn &> /dev/null; then
    echo -e "${YELLOW}NordVPN est déjà installé.${NC}"
    nordvpn --version
else
    echo "Téléchargement et installation de NordVPN..."
    curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh | sh
    echo -e "${GREEN}NordVPN installé avec succès.${NC}"
fi

# Ajout de l'utilisateur courant au groupe nordvpn (évite sudo pour chaque commande)
REAL_USER="${SUDO_USER:-$USER}"
if [ -n "$REAL_USER" ] && ! groups "$REAL_USER" | grep -q nordvpn; then
    usermod -aG nordvpn "$REAL_USER"
    echo "Utilisateur '$REAL_USER' ajouté au groupe nordvpn."
    echo -e "${YELLOW}Se déconnecter/reconnecter pour que le groupe soit actif.${NC}"
fi

# Démarrage du service nordvpnd
systemctl enable nordvpnd
systemctl start nordvpnd || systemctl restart nordvpnd
echo -e "${GREEN}Service nordvpnd démarré.${NC}"

echo ""
echo -e "${CYAN}=== Configuration ===${NC}"
echo ""

# Choix du pays
echo "Pays disponibles courants :"
echo "  Switzerland, Netherlands, Germany, France, United_States,"
echo "  United_Kingdom, Sweden, Norway, Canada, Japan, Singapore"
echo ""
read -rp "Pays de connexion [Switzerland] : " COUNTRY
COUNTRY=${COUNTRY:-Switzerland}

# Options de sécurité
read -rp "Activer le Kill Switch (coupe internet si VPN tombe) ? [oui] : " KILLSWITCH
KILLSWITCH=${KILLSWITCH:-oui}

read -rp "Activer la protection contre les fuites DNS ? [oui] : " DNS_LEAK
DNS_LEAK=${DNS_LEAK:-oui}

read -rp "Activer CyberSec (bloque pubs et malwares) ? [oui] : " CYBERSEC
CYBERSEC=${CYBERSEC:-oui}

read -rp "Se connecter automatiquement au démarrage ? [oui] : " AUTOCONNECT
AUTOCONNECT=${AUTOCONNECT:-oui}

echo ""
echo -e "${CYAN}Application des paramètres...${NC}"

# Application de la config (exécuté en tant qu'utilisateur normal si possible)
apply_setting() {
    if [ -n "$REAL_USER" ] && [ "$REAL_USER" != "root" ]; then
        su - "$REAL_USER" -c "nordvpn $*" 2>/dev/null || nordvpn "$@"
    else
        nordvpn "$@"
    fi
}

[ "$KILLSWITCH"  = "oui" ] && apply_setting set killswitch on  || apply_setting set killswitch off
[ "$DNS_LEAK"    = "oui" ] && apply_setting set dns 103.86.96.100 103.86.99.100 || true
[ "$CYBERSEC"    = "oui" ] && apply_setting set cybersec on    || apply_setting set cybersec off
[ "$AUTOCONNECT" = "oui" ] && apply_setting set autoconnect on "$COUNTRY" || apply_setting set autoconnect off

echo ""
echo -e "${GREEN}=== NordVPN configuré ===${NC}"
echo ""
echo -e "${YELLOW}Étape suivante : connexion au compte NordVPN${NC}"
echo ""
echo "Exécuter en tant qu'utilisateur normal (sans sudo) :"
echo -e "${CYAN}  nordvpn login${NC}"
echo ""
echo "Puis se connecter au pays choisi :"
echo -e "${CYAN}  nordvpn connect ${COUNTRY}${NC}"
echo ""
echo "Commandes utiles :"
echo "  nordvpn status              - Statut de la connexion"
echo "  nordvpn connect             - Connexion au serveur optimal"
echo "  nordvpn connect France      - Connexion à un pays spécifique"
echo "  nordvpn disconnect          - Déconnexion"
echo "  nordvpn countries           - Liste de tous les pays disponibles"
echo "  nordvpn settings            - Voir la configuration actuelle"
echo ""

# Création du service systemd pour auto-connexion au boot
if [ "$AUTOCONNECT" = "oui" ]; then
    echo "Création du service de connexion automatique au boot..."
    cat > /etc/systemd/system/nordvpn-autoconnect.service <<EOF
[Unit]
Description=NordVPN auto-connect au démarrage
After=nordvpnd.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=${REAL_USER}
ExecStart=/usr/bin/nordvpn connect ${COUNTRY}
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload
    systemctl enable nordvpn-autoconnect.service
    echo -e "${GREEN}Service d'auto-connexion activé (se lance après nordvpnd au boot).${NC}"
fi
