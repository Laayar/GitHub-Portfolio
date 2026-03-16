# Self-Hosted AI Assistant

A production-ready, self-hosted AI assistant deployed on a Linux VPS using **Ollama**, **Open WebUI**, and a **Llama** large language model. The system provides a private, web-based chat interface for interacting with a locally running LLM — no external API calls, no data leaving your server.

## Project Overview

This project deploys a complete AI chat system on a single virtual private server. It combines three open-source components into a cohesive stack that anyone can reproduce on their own infrastructure:

- **Ollama** serves as the inference engine, managing and running LLM models locally.
- **Open WebUI** provides a polished, multi-user chat interface accessible through a web browser.
- **Llama** (by Meta) is the large language model that powers the natural language understanding and generation.

The entire system runs without reliance on third-party AI APIs such as OpenAI or Anthropic, giving you full control over your data and infrastructure.

## System Architecture

```
┌──────────────────────────────────────────────┐
│                  Linux VPS                   │
│                                              │
│   ┌──────────────┐      ┌────────────────┐   │
│   │  Open WebUI   │ HTTP │    Ollama      │   │
│   │  (Docker)     ├─────►│  (Host)        │   │
│   │  Port: 3000   │:11434│                │   │
│   └──────────────┘      │  ┌──────────┐   │   │
│                          │  │  Llama   │   │   │
│                          │  │  Model   │   │   │
│                          │  └──────────┘   │   │
│                          └────────────────┘   │
└──────────────────────────────────────────────┘
         ▲
         │ Port 3000
    ┌────┴────┐
    │  Users  │
    │(Browser)│
    └─────────┘
```

For the full architecture breakdown, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Technology Stack

| Component       | Technology                           | Role                                |
|-----------------|--------------------------------------|-------------------------------------|
| LLM             | Llama 3.2 (3B parameters)           | Language understanding & generation |
| Inference Engine| Ollama                               | Model serving and management        |
| Web Interface   | Open WebUI                           | User-facing chat application        |
| Containerization| Docker                               | Application isolation               |
| Operating System| Ubuntu 22.04+ LTS                    | Server OS                           |
| Firewall        | UFW                                  | Network access control              |
| Reverse Proxy   | Caddy (optional)                     | TLS termination                     |

## Infrastructure Requirements

| Resource   | Minimum          | Recommended        |
|------------|------------------|--------------------|
| CPU        | 4 cores          | 8+ cores           |
| RAM        | 8 GB             | 16+ GB             |
| Disk       | 20 GB SSD        | 50+ GB NVMe SSD    |
| OS         | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS   |
| Network    | Public IP        | Static public IP    |

## Installation Guide

### Quick Start

```bash
# 1. Install Docker
sudo apt update && sudo apt install -y docker.io
sudo systemctl enable docker && sudo systemctl start docker

# 2. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 3. Pull a Llama model
ollama pull llama3.2

# 4. Run Open WebUI
docker run -d \
  --name open-webui \
  --restart always \
  -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main

# 5. Open http://your-server-ip:3000 in your browser
```

For detailed step-by-step instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Deployment Instructions

The full deployment guide covers:

1. System preparation and package installation
2. Docker Engine setup
3. Ollama installation and configuration
4. Model downloading and verification
5. Open WebUI container deployment
6. Firewall configuration with UFW
7. Optional TLS setup with Caddy
8. Docker Compose alternative

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete walkthrough.

## Usage Instructions

### First-Time Setup

1. Navigate to `http://your-server-ip:3000` in your web browser.
2. Register the first user account — this account becomes the administrator.
3. Select the Llama model from the model dropdown at the top of the chat interface.
4. Type a message and press Enter to start a conversation.

### Daily Usage

- **New conversation:** Click the "New Chat" button in the sidebar.
- **Switch models:** Use the model selector dropdown to change between installed models.
- **Search history:** Use the search bar in the sidebar to find previous conversations.
- **Manage users:** Admin users can manage accounts through Settings > Admin Panel.

### Managing Models

```bash
# List installed models
ollama list

# Download a new model
ollama pull llama3.1:8b

# Remove a model
ollama rm llama3.2:1b

# Test a model from the command line
ollama run llama3.2 "Explain Docker in one sentence."
```

## Troubleshooting

Common issues and solutions:

| Issue                          | Quick Fix                                                   |
|--------------------------------|-------------------------------------------------------------|
| Cannot access the web UI       | Check firewall: `sudo ufw allow 3000/tcp`                   |
| Empty model list               | Verify Ollama is running: `systemctl status ollama`          |
| Container keeps restarting     | Check logs: `docker logs open-webui`                        |
| Slow responses                 | Use a smaller model: `ollama pull llama3.2:1b`              |
| Out of memory                  | Reduce context window or switch to a smaller model          |

For detailed troubleshooting steps, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Security Considerations

### Network Security

- **Ollama API (port 11434)** is bound to `localhost` only and is never exposed to the public internet.
- **Open WebUI (port 3000)** is the only externally accessible service and handles its own authentication.
- **SSH (port 22)** uses key-based authentication; password authentication should be disabled.

### Data Privacy

- All data stays on your server. No API calls are made to external services.
- Conversations are stored in a local SQLite database inside the Open WebUI Docker volume.
- Model weights are stored locally on disk under `~/.ollama/models/`.

### Recommended Hardening

- Place Open WebUI behind a reverse proxy (Caddy or Nginx) with TLS encryption.
- Disable user registration after creating admin accounts: set `ENABLE_SIGNUP=false`.
- Use a VPN or IP allowlist to restrict access to the web interface.
- Keep all components updated regularly.
- Configure automatic security updates for the host OS:

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Future Improvements

- [ ] **GPU acceleration** — Add NVIDIA GPU support for significantly faster inference
- [ ] **Multi-model support** — Deploy multiple models for different use cases (coding, writing, analysis)
- [ ] **Automated backups** — Implement scheduled backups of chat history and configuration
- [ ] **Monitoring and alerting** — Add Prometheus and Grafana for system health monitoring
- [ ] **CI/CD pipeline** — Automate deployment and updates with GitHub Actions
- [ ] **Load balancing** — Support multiple Ollama instances for horizontal scaling
- [ ] **RAG integration** — Add Retrieval-Augmented Generation for document-aware conversations
- [ ] **Custom model fine-tuning** — Fine-tune models on domain-specific data

## Documentation

| Document                                     | Description                                  |
|----------------------------------------------|----------------------------------------------|
| [ARCHITECTURE.md](ARCHITECTURE.md)           | System architecture and component details    |
| [DEPLOYMENT.md](DEPLOYMENT.md)               | Step-by-step deployment instructions         |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)     | Common issues and solutions                  |
| [PERFORMANCE.md](PERFORMANCE.md)             | Performance benchmarks and optimization tips |

## License

This project uses open-source components:

- [Ollama](https://github.com/ollama/ollama) — MIT License
- [Open WebUI](https://github.com/open-webui/open-webui) — MIT License
- [Llama](https://github.com/meta-llama/llama-models) — Llama Community License
