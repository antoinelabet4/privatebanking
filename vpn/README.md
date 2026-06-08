# VPN WireGuard - Mini PC (Ubuntu/Debian)

WireGuard VPN pour le mini PC, configurable en mode **serveur** et/ou **client**.

## Prérequis

- Ubuntu 20.04+ ou Debian 11+
- Accès root (`sudo`)
- Port UDP 51820 ouvert sur le routeur/firewall (mode serveur)

## Mode Serveur

Le mini PC héberge le VPN. D'autres appareils s'y connectent.

```bash
sudo bash vpn/setup-server.sh
```

Une fois le serveur installé, ajouter des clients :

```bash
sudo bash vpn/add-client.sh <nom_client>
# ex: sudo bash vpn/add-client.sh laptop-antoine
```

Cela génère un fichier `.conf` et un QR Code pour l'app mobile WireGuard.

## Mode Client

Le mini PC se connecte à un serveur WireGuard existant.

```bash
sudo bash vpn/setup-client.sh
```

Le script demande :
- L'IP publique du serveur
- Le port (défaut : 51820)
- La clé publique du serveur
- L'IP VPN à assigner au client

## Commandes utiles

```bash
# Statut du VPN
sudo wg show

# Démarrer/arrêter
sudo wg-quick up wg0
sudo wg-quick down wg0

# Redémarrer le service
sudo systemctl restart wg-quick@wg0

# Voir les logs
sudo journalctl -u wg-quick@wg0 -f
```

## Architecture réseau

```
Internet
   │
   │ IP publique du mini PC
   ▼
[Mini PC - Serveur WireGuard]
   │  10.8.0.1
   │
   ├── 10.8.0.2  Client laptop
   ├── 10.8.0.3  Client téléphone
   └── 10.8.0.4  Client autre machine
```

## Ports

| Service    | Port       | Protocole |
|------------|------------|-----------|
| WireGuard  | 51820      | UDP       |
