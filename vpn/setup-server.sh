#!/bin/bash
# WireGuard VPN - Installation serveur (Ubuntu/Debian)
# Usage: sudo bash setup-server.sh

set -e

VPN_INTERFACE="wg0"
VPN_PORT="51820"
VPN_SUBNET="10.8.0.0/24"
SERVER_IP="10.8.0.1"
CONFIG_DIR="/etc/wireguard"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Ce script doit être exécuté en root (sudo).${NC}"
    exit 1
fi

echo -e "${GREEN}=== Installation WireGuard Serveur ===${NC}"

# Vérification si déjà installé
if command -v wg &> /dev/null; then
    echo -e "${YELLOW}WireGuard est déjà installé.${NC}"
    wg --version
else
    echo "Installation de WireGuard..."
    apt-get update -qq
    apt-get install -y wireguard wireguard-tools
    echo -e "${GREEN}WireGuard installé avec succès.${NC}"
fi

# Détection de l'interface réseau principale
MAIN_IFACE=$(ip route | grep default | awk '{print $5}' | head -1)
echo "Interface réseau principale détectée : ${MAIN_IFACE}"

# Génération des clés serveur
if [ ! -f "${CONFIG_DIR}/server_private.key" ]; then
    echo "Génération des clés serveur..."
    wg genkey | tee "${CONFIG_DIR}/server_private.key" | wg pubkey > "${CONFIG_DIR}/server_public.key"
    chmod 600 "${CONFIG_DIR}/server_private.key"
    echo -e "${GREEN}Clés serveur générées.${NC}"
else
    echo -e "${YELLOW}Clés serveur déjà existantes.${NC}"
fi

SERVER_PRIVATE_KEY=$(cat "${CONFIG_DIR}/server_private.key")
SERVER_PUBLIC_KEY=$(cat "${CONFIG_DIR}/server_public.key")

# Création de la config serveur
if [ ! -f "${CONFIG_DIR}/${VPN_INTERFACE}.conf" ]; then
    cat > "${CONFIG_DIR}/${VPN_INTERFACE}.conf" <<EOF
[Interface]
Address = ${SERVER_IP}/24
ListenPort = ${VPN_PORT}
PrivateKey = ${SERVER_PRIVATE_KEY}

# NAT - trafic client vers internet
PostUp   = iptables -A FORWARD -i ${VPN_INTERFACE} -j ACCEPT; iptables -A FORWARD -o ${VPN_INTERFACE} -j ACCEPT; iptables -t nat -A POSTROUTING -s ${VPN_SUBNET} -o ${MAIN_IFACE} -j MASQUERADE
PostDown = iptables -D FORWARD -i ${VPN_INTERFACE} -j ACCEPT; iptables -D FORWARD -o ${VPN_INTERFACE} -j ACCEPT; iptables -t nat -D POSTROUTING -s ${VPN_SUBNET} -o ${MAIN_IFACE} -j MASQUERADE

# Ajouter les clients avec wg set wg0 peer <PUBLIC_KEY> allowed-ips <CLIENT_IP>/32
# ou éditer ce fichier et ajouter des blocs [Peer]
EOF
    chmod 600 "${CONFIG_DIR}/${VPN_INTERFACE}.conf"
    echo -e "${GREEN}Configuration serveur créée.${NC}"
else
    echo -e "${YELLOW}Configuration serveur déjà existante.${NC}"
fi

# Activation du forwarding IP
echo "Activation du forwarding IP..."
sysctl -w net.ipv4.ip_forward=1 > /dev/null
if ! grep -q "net.ipv4.ip_forward=1" /etc/sysctl.conf; then
    echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
fi

# Démarrage et activation au boot
echo "Démarrage de WireGuard..."
systemctl enable "wg-quick@${VPN_INTERFACE}"
systemctl start "wg-quick@${VPN_INTERFACE}" || systemctl restart "wg-quick@${VPN_INTERFACE}"

# Ouverture du port UFW si disponible
if command -v ufw &> /dev/null; then
    ufw allow "${VPN_PORT}/udp" > /dev/null 2>&1 || true
    echo "Port ${VPN_PORT}/udp ouvert dans UFW."
fi

echo ""
echo -e "${GREEN}=== Serveur WireGuard opérationnel ===${NC}"
echo ""
echo "Clé publique du serveur (à fournir aux clients) :"
echo -e "${YELLOW}${SERVER_PUBLIC_KEY}${NC}"
echo ""
echo "IP serveur VPN : ${SERVER_IP}"
echo "Port           : ${VPN_PORT}/UDP"
echo "Subnet VPN     : ${VPN_SUBNET}"
echo ""
echo "Pour ajouter un client :"
echo "  bash add-client.sh <nom_client>"
echo ""
wg show
