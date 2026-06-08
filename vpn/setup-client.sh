#!/bin/bash
# WireGuard VPN - Installation client (Ubuntu/Debian)
# Usage: sudo bash setup-client.sh

set -e

VPN_INTERFACE="wg0"
CONFIG_DIR="/etc/wireguard"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Ce script doit être exécuté en root (sudo).${NC}"
    exit 1
fi

echo -e "${GREEN}=== Installation WireGuard Client ===${NC}"

# Vérification si déjà installé
if command -v wg &> /dev/null; then
    echo -e "${YELLOW}WireGuard est déjà installé.${NC}"
    wg --version
else
    echo "Installation de WireGuard..."
    apt-get update -qq
    apt-get install -y wireguard wireguard-tools qrencode
    echo -e "${GREEN}WireGuard installé avec succès.${NC}"
fi

# Génération des clés client
if [ ! -f "${CONFIG_DIR}/client_private.key" ]; then
    echo "Génération des clés client..."
    wg genkey | tee "${CONFIG_DIR}/client_private.key" | wg pubkey > "${CONFIG_DIR}/client_public.key"
    chmod 600 "${CONFIG_DIR}/client_private.key"
    echo -e "${GREEN}Clés client générées.${NC}"
else
    echo -e "${YELLOW}Clés client déjà existantes.${NC}"
fi

CLIENT_PRIVATE_KEY=$(cat "${CONFIG_DIR}/client_private.key")
CLIENT_PUBLIC_KEY=$(cat "${CONFIG_DIR}/client_public.key")

echo ""
echo -e "${GREEN}=== Configuration client ===${NC}"
echo ""
echo "Clé publique du client (à ajouter sur le serveur) :"
echo -e "${YELLOW}${CLIENT_PUBLIC_KEY}${NC}"
echo ""

# Demande des infos serveur
read -rp "IP publique du serveur VPN : " SERVER_PUBLIC_IP
read -rp "Port du serveur [51820] : " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-51820}
read -rp "Clé publique du serveur : " SERVER_PUBLIC_KEY
read -rp "IP assignée au client (ex: 10.8.0.2/24) : " CLIENT_VPN_IP
read -rp "Tout le trafic via VPN ? (oui/non) [oui] : " FULL_TUNNEL
FULL_TUNNEL=${FULL_TUNNEL:-oui}

if [ "$FULL_TUNNEL" = "oui" ]; then
    ALLOWED_IPS="0.0.0.0/0, ::/0"
else
    # Seulement le subnet VPN
    ALLOWED_IPS="10.8.0.0/24"
fi

# Création de la config client
cat > "${CONFIG_DIR}/${VPN_INTERFACE}.conf" <<EOF
[Interface]
PrivateKey = ${CLIENT_PRIVATE_KEY}
Address = ${CLIENT_VPN_IP}
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${SERVER_PUBLIC_KEY}
Endpoint = ${SERVER_PUBLIC_IP}:${SERVER_PORT}
AllowedIPs = ${ALLOWED_IPS}
PersistentKeepalive = 25
EOF

chmod 600 "${CONFIG_DIR}/${VPN_INTERFACE}.conf"

echo ""
echo -e "${GREEN}Configuration créée : ${CONFIG_DIR}/${VPN_INTERFACE}.conf${NC}"
echo ""
read -rp "Démarrer la connexion VPN maintenant ? (oui/non) [oui] : " START_NOW
START_NOW=${START_NOW:-oui}

if [ "$START_NOW" = "oui" ]; then
    systemctl enable "wg-quick@${VPN_INTERFACE}"
    systemctl start "wg-quick@${VPN_INTERFACE}" || systemctl restart "wg-quick@${VPN_INTERFACE}"
    echo ""
    echo -e "${GREEN}VPN client démarré.${NC}"
    wg show
else
    echo ""
    echo "Pour démarrer manuellement :"
    echo "  sudo wg-quick up ${VPN_INTERFACE}"
fi

echo ""
echo "Pour ajouter ce client sur le serveur, exécuter sur le serveur :"
echo -e "${YELLOW}  sudo wg set wg0 peer ${CLIENT_PUBLIC_KEY} allowed-ips ${CLIENT_VPN_IP%/*}/32${NC}"
