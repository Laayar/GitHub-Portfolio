# Architecture

## System Overview

This project implements a self-hosted AI assistant running entirely on a single Linux VPS. The system uses **Ollama** as the inference engine, **Open WebUI** as the user-facing chat interface, and a **Llama** large language model (LLM) for natural language processing.

All components run locally on the server with no external API dependencies, ensuring full data privacy and control.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Linux VPS                            │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Docker Network                       │ │
│  │                                                        │ │
│  │  ┌──────────────────┐       ┌───────────────────────┐  │ │
│  │  │   Open WebUI     │       │       Ollama          │  │ │
│  │  │                  │       │                       │  │ │
│  │  │  - Chat UI       │ HTTP  │  - REST API Server    │  │ │
│  │  │  - User Auth     ├──────►│  - Model Management   │  │ │
│  │  │  - Chat History  │:11434 │  - Inference Engine   │  │ │
│  │  │  - Model Mgmt    │       │                       │  │ │
│  │  │                  │       │  ┌─────────────────┐   │  │ │
│  │  │  Port: 8080      │       │  │   Llama Model   │   │  │ │
│  │  │  (internal)      │       │  │   (GGUF format) │   │  │ │
│  │  └──────────────────┘       │  └─────────────────┘   │  │ │
│  │                             └───────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────┐                                           │
│  │   Firewall   │  Port 3000 ──► Open WebUI (exposed)      │
│  │   (UFW)      │  Port 11434 ─► Ollama (internal only)    │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
        ▲
        │ HTTPS / Port 3000
        │
┌───────┴───────┐
│   End Users   │
│  (Browser)    │
└───────────────┘
```

## Component Details

### Open WebUI

Open WebUI is the front-end chat interface that users interact with through their web browser. It provides a modern, responsive UI similar to ChatGPT.

| Property          | Value                                    |
|-------------------|------------------------------------------|
| Role              | Web-based chat interface                 |
| Container Image   | `ghcr.io/open-webui/open-webui:main`     |
| Internal Port     | 8080                                     |
| Exposed Port      | 3000 (mapped from 8080)                  |
| Persistent Data   | Chat history, user accounts, settings    |
| Volume Mount      | `open-webui:/app/backend/data`           |

**Key features:**

- Multi-user authentication and session management
- Conversation history with search functionality
- Model selection and parameter tuning
- Markdown rendering and code syntax highlighting
- File upload and document analysis support

### Ollama

Ollama is the inference server that loads, manages, and runs LLM models. It exposes a REST API that Open WebUI consumes to generate responses.

| Property          | Value                                    |
|-------------------|------------------------------------------|
| Role              | LLM inference engine and model manager   |
| Installation      | Native binary on the host OS             |
| API Port          | 11434                                    |
| API Endpoint      | `http://localhost:11434`                 |
| Model Storage     | `~/.ollama/models/`                      |

**Key features:**

- Runs models in GGUF format optimized for CPU and GPU inference
- Supports concurrent model loading and switching
- Provides a REST API compatible with the OpenAI API format
- Handles model downloading, caching, and version management

### Llama Model

The Llama model is the large language model that performs the actual text generation. It runs inside Ollama and processes user prompts to produce responses.

| Property          | Value                                    |
|-------------------|------------------------------------------|
| Role              | Natural language processing and generation |
| Format            | GGUF (quantized)                         |
| Typical Variants  | `llama3.2`, `llama3.1`, `llama3`         |
| Quantization      | Q4_0, Q4_K_M, Q5_K_M, Q8_0             |
| Context Window    | 2048–131072 tokens (varies by model)     |

## Data Flow

### Request Lifecycle

1. **User sends a message** through the Open WebUI chat interface in their browser.
2. **Open WebUI receives the request** and processes it (authentication, history context, system prompt assembly).
3. **Open WebUI forwards the request** to the Ollama API at `http://host.docker.internal:11434/api/chat` (or `http://localhost:11434` if Ollama runs on the host).
4. **Ollama loads the model** into memory (if not already loaded) and begins inference.
5. **Ollama streams tokens** back to Open WebUI as they are generated.
6. **Open WebUI renders the response** in real time in the user's browser.
7. **Open WebUI saves the conversation** to its local database for history and context.

### Data Flow Diagram

```
User Browser                Open WebUI                    Ollama                   Llama Model
    │                           │                            │                          │
    │  1. Send message          │                            │                          │
    ├──────────────────────────►│                            │                          │
    │                           │  2. POST /api/chat         │                          │
    │                           ├───────────────────────────►│                          │
    │                           │                            │  3. Load model & infer   │
    │                           │                            ├─────────────────────────►│
    │                           │                            │                          │
    │                           │                            │  4. Return tokens        │
    │                           │                            │◄─────────────────────────┤
    │                           │  5. Stream tokens (SSE)    │                          │
    │                           │◄───────────────────────────┤                          │
    │  6. Render response       │                            │                          │
    │◄──────────────────────────┤                            │                          │
    │                           │  7. Save to DB             │                          │
    │                           │─────────┐                  │                          │
    │                           │◄────────┘                  │                          │
```

## Network Communication

### Ports

| Port  | Service     | Direction | Access          | Protocol |
|-------|-------------|-----------|-----------------|----------|
| 3000  | Open WebUI  | Inbound   | Public (or VPN) | HTTP     |
| 11434 | Ollama API  | Internal  | Localhost only  | HTTP     |
| 22    | SSH         | Inbound   | Admin only      | TCP      |

### Internal Communication

- **Open WebUI → Ollama:** HTTP requests over the Docker bridge network or via `localhost` when Ollama is installed natively on the host. The default endpoint is `http://localhost:11434`.
- **Browser → Open WebUI:** HTTP on port 3000. In production, this should be placed behind a reverse proxy (e.g., Nginx or Caddy) with TLS termination.

### DNS and Service Discovery

When running Open WebUI in Docker and Ollama on the host:

- Open WebUI connects to Ollama using `http://host.docker.internal:11434` (Docker Desktop) or the host's IP address.
- On Linux, the `--network=host` flag or `--add-host=host.docker.internal:host-gateway` flag can be used to allow container-to-host communication.

## Storage and Persistence

| Component   | Data Stored                        | Storage Location                     |
|-------------|------------------------------------|--------------------------------------|
| Open WebUI  | User accounts, chat history, settings | Docker volume: `open-webui`       |
| Ollama      | Downloaded models, configuration   | Host filesystem: `~/.ollama/models/` |

## Security Boundaries

- **Ollama API** is bound to `localhost` only and is not exposed to the public internet.
- **Open WebUI** handles authentication and should be the only publicly accessible service.
- **SSH access** is restricted to key-based authentication for server administration.
- All inter-service communication occurs over the local network stack, never traversing the public internet.
