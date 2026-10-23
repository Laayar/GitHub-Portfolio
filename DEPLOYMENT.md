# Deployment Guide

This guide provides step-by-step instructions to deploy the self-hosted AI assistant on a Linux VPS. By the end of this guide, you will have a fully functional chat interface powered by a locally running Llama model.

## Prerequisites

| Requirement       | Minimum                | Recommended              |
|-------------------|------------------------|--------------------------|
| OS                | Ubuntu 22.04 LTS       | Ubuntu 24.04 LTS        |
| CPU               | 4 cores                | 8+ cores                 |
| RAM               | 8 GB                   | 16+ GB                   |
| Disk              | 20 GB free             | 50+ GB free (SSD)        |
| Network           | Public IP address       | Static public IP         |
| Access            | Root or sudo privileges | Root or sudo privileges  |

## Step 1: Update the System

Connect to your VPS via SSH and update all packages:

```bash
ssh user@your-server-ip
sudo apt update && sudo apt upgrade -y
```

## Step 2: Install Docker

Install Docker Engine using the official repository:

```bash
# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to the docker group
sudo usermod -aG docker $USER
newgrp docker
```

Verify the installation:

```bash
docker --version
docker compose version
```

## Step 3: Install Ollama

Install Ollama using the official install script:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Verify Ollama is running:

```bash
systemctl status ollama
ollama --version
```

If Ollama is not running, start it:

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Configure Ollama to Listen on All Interfaces (Optional)

By default, Ollama listens on `127.0.0.1:11434`. If Open WebUI runs in a Docker container and needs to reach Ollama on the host, you may need to adjust the bind address.

Edit the Ollama systemd service:

```bash
sudo systemctl edit ollama
```

Add the following override:

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
```

Restart the service:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

## Step 4: Download a Llama Model

Pull the desired model using the Ollama CLI:

```bash
# Pull Llama 3.2 (3B parameters, ~2 GB)
ollama pull llama3.2

# Or pull a smaller model for limited hardware
ollama pull llama3.2:1b

# Or pull a larger model for better quality
ollama pull llama3.1:8b
```

Verify the model is available:

```bash
ollama list
```

Test the model:

```bash
ollama run llama3.2 "Hello, how are you?"
```

## Step 5: Deploy Open WebUI

Run Open WebUI as a Docker container:

```bash
docker run -d \
  --name open-webui \
  --restart always \
  -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main
```

**Explanation of flags:**

| Flag                                          | Purpose                                           |
|-----------------------------------------------|---------------------------------------------------|
| `-d`                                          | Run container in detached mode                    |
| `--name open-webui`                           | Name the container for easy management            |
| `--restart always`                            | Automatically restart on crash or reboot          |
| `-p 3000:8080`                                | Map host port 3000 to container port 8080         |
| `--add-host=host.docker.internal:host-gateway`| Allow container to reach host services            |
| `-v open-webui:/app/backend/data`             | Persist data across container restarts            |
| `ghcr.io/open-webui/open-webui:main`          | Official Open WebUI container image               |

Verify the container is running:

```bash
docker ps
docker logs open-webui
```

## Step 6: Configure the Firewall

Set up UFW to allow only necessary traffic:

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow Open WebUI
sudo ufw allow 3000/tcp

# Enable the firewall
sudo ufw enable

# Verify rules
sudo ufw status verbose
```

> **Important:** Do NOT expose port 11434 (Ollama) to the public internet. It should only be accessible from localhost.

## Step 7: Access the Web Interface

Open your browser and navigate to:

```
http://your-server-ip:3000
```

On first access:

1. **Create an admin account** — the first user to register becomes the administrator.
2. **Select the model** — choose the Llama model you downloaded from the model dropdown.
3. **Start chatting** — type a message and the model will respond.

## Environment Variables

Open WebUI supports several environment variables for configuration:

| Variable                    | Default                        | Description                              |
|-----------------------------|--------------------------------|------------------------------------------|
| `OLLAMA_BASE_URL`           | `http://localhost:11434`       | URL of the Ollama API                    |
| `WEBUI_AUTH`                | `true`                         | Enable or disable authentication         |
| `WEBUI_SECRET_KEY`          | Auto-generated                 | Secret key for session management        |
| `DEFAULT_MODELS`            | (none)                         | Default model for new conversations      |
| `ENABLE_SIGNUP`             | `true`                         | Allow new user registration              |

To set environment variables, add `-e` flags to the Docker run command:

```bash
docker run -d \
  --name open-webui \
  --restart always \
  -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -e ENABLE_SIGNUP=false \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main
```

## Docker Compose (Alternative)

For a more maintainable setup, use Docker Compose. Create a file named `docker-compose.yml`:

```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    restart: always
    ports:
      - "3000:8080"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
    volumes:
      - open-webui:/app/backend/data

volumes:
  open-webui:
```

Deploy with:

```bash
docker compose up -d
```

## TLS/SSL Configuration (Production)

For production deployments, use a reverse proxy with TLS. Install Caddy as an example:

```bash
sudo apt install -y caddy
```

Create `/etc/caddy/Caddyfile`:

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

Restart Caddy:

```bash
sudo systemctl restart caddy
```

Caddy automatically obtains and renews Let's Encrypt certificates. Update your firewall:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Updating Components

### Update Open WebUI

```bash
docker pull ghcr.io/open-webui/open-webui:main
docker stop open-webui
docker rm open-webui
# Re-run the docker run command from Step 5
```

### Update Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl restart ollama
```

### Update the Model

```bash
ollama pull llama3.2
```
