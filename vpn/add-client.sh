#!/bin/bash
# WireGuard - Ajout d'un client côté serveur
# Usage: sudo bash add-client.sh <nom_client>

set -e

CONFIG_DIR="/etc/wireguard"
VPN_INTERFACE="wg0"
VPN_SUBNET_BASE="10.8.0"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Ce script doit être exécuté en root (sudo).${NC}"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: sudo bash add-client.sh <nom_client>"
    exit 1
fi

CLIENT_NAME="$1"
CLIENTS_DIR="${CONFIG_DIR}/clients"
mkdir -p "${CLIENTS_DIR}"

# Calcul de la prochaine IP disponible
NEXT_IP=2
while [ -f "${CLIENTS_DIR}/${VPN_SUBNET_BASE}.${NEXT_IP}.conf" ]; do
    NEXT_IP=$((NEXT_IP + 1))
    if [ "$NEXT_IP" -gt 254 ]; then
        echo -e "${RED}Plus d'IPs disponibles dans le subnet.${NC}"
        exit 1
    fi
done
CLIENT_IP="${VPN_SUBNET_BASE}.${NEXT_IP}"

# Génération des clés du client
CLIENT_PRIVATE=$(wg genkey)
CLIENT_PUBLIC=$(echo "$CLIENT_PRIVATE" | wg pubkey)
SERVER_PUBLIC=$(cat "${CONFIG_DIR}/server_public.key")

# Récupération de l'IP publique du serveur
SERVER_PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "VOTRE_IP_PUBLIQUE")
SERVER_PORT=$(grep "ListenPort" "${CONFIG_DIR}/${VPN_INTERFACE}.conf" | awk '{print $3}')

# Création du fichier de config client
cat > "${CLIENTS_DIR}/${CLIENT_NAME}.conf" <<EOF
[Interface]
PrivateKey = ${CLIENT_PRIVATE}
Address = ${CLIENT_IP}/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${SERVER_PUBLIC}
Endpoint = ${SERVER_PUBLIC_IP}:${SERVER_PORT}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
EOF

chmod 600 "${CLIENTS_DIR}/${CLIENT_NAME}.conf"

# Ajout du peer sur le serveur (à chaud, sans redémarrage)
wg set "${VPN_INTERFACE}" peer "${CLIENT_PUBLIC}" allowed-ips "${CLIENT_IP}/32"

# Persistance dans le fichier de config
cat >> "${CONFIG_DIR}/${VPN_INTERFACE}.conf" <<EOF

[Peer]
# Client: ${CLIENT_NAME}
PublicKey = ${CLIENT_PUBLIC}
AllowedIPs = ${CLIENT_IP}/32
EOF

echo ""
echo -e "${GREEN}Client '${CLIENT_NAME}' ajouté avec succès.${NC}"
echo "IP VPN assignée : ${CLIENT_IP}"
echo ""
echo "Fichier de config client : ${CLIENTS_DIR}/${CLIENT_NAME}.conf"
echo ""

# Génération QR code si qrencode est disponible
if command -v qrencode &> /dev/null; then
    echo "QR Code pour l'application mobile WireGuard :"
    qrencode -t ansiutf8 < "${CLIENTS_DIR}/${CLIENT_NAME}.conf"
else
    echo "Installer qrencode pour générer un QR Code : apt-get install qrencode"
fi

echo ""
echo "Contenu du fichier client (à copier sur l'appareil client) :"
echo -e "${YELLOW}"
cat "${CLIENTS_DIR}/${CLIENT_NAME}.conf"
echo -e "${NC}"
