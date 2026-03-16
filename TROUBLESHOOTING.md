# Troubleshooting

This document covers common issues encountered during deployment and operation of the self-hosted AI assistant, along with their solutions and debugging commands.

## Quick Diagnostics

Run these commands first to identify the state of all system components:

```bash
# Check Ollama status
systemctl status ollama

# Check if Ollama API is responding
curl http://localhost:11434/api/tags

# Check Open WebUI container
docker ps -a | grep open-webui

# Check Open WebUI logs
docker logs --tail 50 open-webui

# Check listening ports
sudo ss -tlnp | grep -E '3000|11434'

# Check firewall rules
sudo ufw status verbose
```

## Common Issues

### 1. Open WebUI Cannot Connect to Ollama

**Symptoms:**
- "Could not connect to Ollama" error in the UI
- Empty model list in the model selector
- Connection refused errors in container logs

**Causes and Solutions:**

**Ollama is not running:**

```bash
sudo systemctl start ollama
sudo systemctl enable ollama
systemctl status ollama
```

**Ollama is not accessible from the Docker container:**

When Open WebUI runs inside Docker and Ollama runs on the host, the container cannot reach `localhost` on the host by default.

Solution — use the `--add-host` flag:

```bash
docker run -d \
  --name open-webui \
  --restart always \
  -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main
```

**Ollama is bound to 127.0.0.1 only:**

Edit the Ollama service to bind to all interfaces:

```bash
sudo systemctl edit ollama
```

Add:

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
```

Then restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

Verify Ollama is listening on all interfaces:

```bash
sudo ss -tlnp | grep 11434
```

---

### 2. Port Conflicts

**Symptoms:**
- "Port is already allocated" error when starting Docker container
- "Address already in use" error when starting Ollama

**Solution — identify the process using the port:**

```bash
# Check what is using port 3000
sudo ss -tlnp | grep 3000

# Check what is using port 11434
sudo ss -tlnp | grep 11434

# Kill a specific process by PID (replace <PID> with the actual process ID)
sudo kill <PID>
```

**Solution — use a different port:**

```bash
# Run Open WebUI on port 8080 instead of 3000
docker run -d \
  --name open-webui \
  --restart always \
  -p 8080:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main
```

---

### 3. Docker Networking Issues

**Symptoms:**
- Container starts but cannot reach Ollama
- DNS resolution failures inside the container
- Timeout errors when connecting to the Ollama API

**Debug commands:**

```bash
# Inspect container network settings
docker inspect open-webui | grep -A 20 "NetworkSettings"

# Test connectivity from inside the container
docker exec open-webui curl -s http://host.docker.internal:11434/api/tags

# Check Docker network
docker network ls
docker network inspect bridge
```

**Solution — use host networking:**

As an alternative, run the container with host networking:

```bash
docker run -d \
  --name open-webui \
  --restart always \
  --network=host \
  -e OLLAMA_BASE_URL=http://localhost:11434 \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main
```

> **Note:** With `--network=host`, Open WebUI will listen on port 8080 directly on the host (its internal default port).

---

### 4. Firewall Blocking Connections

**Symptoms:**
- Cannot access Open WebUI from the browser
- Connection times out when navigating to `http://server-ip:3000`
- SSH works but web access does not

**Debug commands:**

```bash
# Check UFW status
sudo ufw status verbose

# Check iptables rules
sudo iptables -L -n

# Test local connectivity
curl http://localhost:3000
```

**Solution — allow the required port:**

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

**Verify from another machine:**

```bash
# From your local machine
curl -I http://your-server-ip:3000
```

If using a cloud provider (AWS, GCP, Azure, DigitalOcean), also check the **security group** or **network firewall** rules in the cloud console.

---

### 5. Model Loading Errors

**Symptoms:**
- "Model not found" error in Open WebUI
- Ollama returns an error when trying to generate a response
- Slow or failed model downloads

**Debug commands:**

```bash
# List installed models
ollama list

# Check disk space
df -h

# Check Ollama logs
journalctl -u ollama --no-pager --since "1 hour ago"

# Check available memory
free -h
```

**Solution — model not downloaded:**

```bash
ollama pull llama3.2
```

**Solution — insufficient disk space:**

```bash
# Remove unused models
ollama rm <model-name>

# Check model sizes
du -sh ~/.ollama/models/
```

**Solution — insufficient memory:**

If the model is too large for available RAM, switch to a smaller variant:

```bash
# Use the 1B parameter version instead of 3B
ollama pull llama3.2:1b
```

---

### 6. Slow Response Times

**Symptoms:**
- Model takes a very long time to generate responses
- Tokens appear slowly in the chat interface
- High CPU usage during inference

**Debug commands:**

```bash
# Monitor system resources
htop

# Check CPU usage
top -b -n 1 | head -20

# Check memory usage
free -h

# Check if swap is being used
swapon --show
```

**Solutions:**

| Issue                  | Solution                                        |
|------------------------|-------------------------------------------------|
| CPU-only inference     | Expected — see [PERFORMANCE.md](PERFORMANCE.md) |
| Insufficient RAM       | Use a smaller quantized model                   |
| Swap thrashing         | Add more RAM or use a smaller model             |
| Too many concurrent users | Limit concurrent requests in Open WebUI      |

---

### 7. Open WebUI Container Keeps Restarting

**Symptoms:**
- `docker ps` shows the container restarting in a loop
- Status shows `Restarting (1) X seconds ago`

**Debug commands:**

```bash
# Check container logs
docker logs --tail 100 open-webui

# Check container exit code
docker inspect open-webui --format='{{.State.ExitCode}}'

# Check system resources
free -h
df -h
```

**Common causes:**

- Insufficient disk space for the SQLite database
- Permission issues on the mounted volume
- Port conflict preventing the server from binding

**Solution — recreate the container:**

```bash
docker stop open-webui
docker rm open-webui
# Re-run the docker run command
```

**Solution — reset persistent data (last resort):**

```bash
docker volume rm open-webui
# Re-run the docker run command (this will lose all chat history)
```

---

### 8. SSL/TLS Certificate Issues

**Symptoms:**
- Browser shows "Not Secure" warning
- Certificate errors when accessing the interface

**Solution with Caddy:**

```bash
# Check Caddy status
sudo systemctl status caddy

# Check Caddy logs
sudo journalctl -u caddy --no-pager --since "1 hour ago"

# Verify DNS records point to your server
dig your-domain.com
```

Ensure ports 80 and 443 are open:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Useful Log Locations

| Component   | Log Command                                      |
|-------------|--------------------------------------------------|
| Ollama      | `journalctl -u ollama -f`                        |
| Open WebUI  | `docker logs -f open-webui`                      |
| Docker      | `journalctl -u docker -f`                        |
| Caddy       | `journalctl -u caddy -f`                         |
| UFW         | `sudo tail -f /var/log/ufw.log`                  |
| System      | `dmesg --follow`                                 |

## Getting Help

If you cannot resolve an issue:

1. Check the [Ollama documentation](https://github.com/ollama/ollama)
2. Check the [Open WebUI documentation](https://github.com/open-webui/open-webui)
3. Search for the error message in the respective GitHub Issues pages
4. Collect logs from all components and include them when opening a new issue
