# Performance

This document covers expected performance characteristics, hardware requirements, and model selection guidance for the self-hosted AI assistant running on CPU-based infrastructure.

## Hardware Requirements

### Minimum Requirements

| Component | Specification                     | Notes                                |
|-----------|-----------------------------------|--------------------------------------|
| CPU       | 4 cores, x86_64 or ARM64         | AVX2 support recommended for x86    |
| RAM       | 8 GB                             | Enough for small models (1B–3B)     |
| Disk      | 20 GB free (SSD recommended)     | Model storage + OS + Docker         |
| Network   | 1 Mbps                           | Only needed for initial setup        |

### Recommended Requirements

| Component | Specification                     | Notes                                |
|-----------|-----------------------------------|--------------------------------------|
| CPU       | 8+ cores, modern x86_64 or ARM64 | Higher clock speed improves inference|
| RAM       | 16–32 GB                         | Required for 7B–8B parameter models |
| Disk      | 50+ GB SSD (NVMe preferred)      | Faster model loading from disk       |
| GPU       | NVIDIA with 8+ GB VRAM (optional)| Dramatically improves inference speed|

## Model Size vs Performance

### Available Llama Models

| Model              | Parameters | Disk Size (Q4_0) | RAM Required | Quality   |
|--------------------|-----------|-------------------|--------------|-----------|
| `llama3.2:1b`      | 1B        | ~0.7 GB           | ~2 GB        | Basic     |
| `llama3.2`         | 3B        | ~2 GB             | ~4 GB        | Good      |
| `llama3.1:8b`      | 8B        | ~4.7 GB           | ~8 GB        | Very Good |
| `llama3.1:70b`     | 70B       | ~40 GB            | ~48 GB       | Excellent |

### Quantization Levels

Quantization reduces model size and memory usage at the cost of some quality. Ollama uses GGUF format with several quantization options:

| Quantization | Size Reduction | Quality Impact  | Use Case                          |
|-------------|----------------|-----------------|-----------------------------------|
| Q8_0        | ~50%           | Minimal loss    | Best quality, more RAM needed     |
| Q5_K_M      | ~65%           | Very slight loss| Good balance of quality and size  |
| Q4_K_M      | ~70%           | Slight loss     | Recommended default               |
| Q4_0        | ~75%           | Noticeable loss | Minimum viable for constrained HW |
| Q2_K        | ~85%           | Significant loss| Only for extremely limited RAM    |

## CPU Inference Performance

### Expected Token Generation Speed

Performance varies significantly based on hardware. The following benchmarks are approximate for **CPU-only inference** on typical VPS hardware:

| Model            | 4-core VPS | 8-core VPS | 16-core Server |
|------------------|-----------|------------|----------------|
| `llama3.2:1b`    | ~15 tok/s  | ~25 tok/s  | ~40 tok/s      |
| `llama3.2` (3B)  | ~6 tok/s   | ~12 tok/s  | ~20 tok/s      |
| `llama3.1:8b`    | ~2 tok/s   | ~5 tok/s   | ~10 tok/s      |
| `llama3.1:70b`   | N/A        | <1 tok/s   | ~2 tok/s       |

> **Note:** These values are rough estimates. Actual performance depends on CPU architecture, clock speed, RAM speed, quantization level, and prompt length.

### What Does This Mean in Practice?

| Speed        | User Experience                                          |
|-------------|----------------------------------------------------------|
| >20 tok/s    | Real-time, smooth conversation                           |
| 10–20 tok/s  | Comfortable, minor noticeable delay                      |
| 5–10 tok/s   | Usable, visible streaming of tokens                      |
| 2–5 tok/s    | Slow but functional, suitable for async tasks            |
| <2 tok/s     | Very slow, not recommended for interactive use           |

## GPU Acceleration

Adding a GPU dramatically improves inference performance:

| GPU              | VRAM  | `llama3.2` (3B) | `llama3.1:8b` |
|------------------|-------|------------------|---------------|
| NVIDIA T4        | 16 GB | ~60 tok/s        | ~30 tok/s     |
| NVIDIA A10G      | 24 GB | ~90 tok/s        | ~50 tok/s     |
| NVIDIA RTX 4090  | 24 GB | ~120 tok/s       | ~70 tok/s     |

Ollama automatically detects and uses NVIDIA GPUs when CUDA drivers are installed.

To verify GPU detection:

```bash
ollama ps
nvidia-smi
```

## Memory Management

### How Ollama Uses Memory

1. **Model Loading:** The entire model is loaded into RAM (or VRAM) on the first request.
2. **Context Processing:** Additional memory is needed for the context window.
3. **Idle Timeout:** By default, Ollama keeps the model in memory for 5 minutes after the last request, then unloads it.

### Memory Usage Formula (Approximate)

```
Total RAM ≈ Model Size (quantized) + Context Window Memory + OS Overhead
```

Example for `llama3.2` (3B, Q4_0):
- Model: ~2 GB
- Context (4096 tokens): ~0.5 GB
- OS + Docker + Open WebUI: ~1.5 GB
- **Total: ~4 GB minimum**

### Monitoring Memory Usage

```bash
# Overall system memory
free -h

# Ollama process memory
ps aux | grep ollama

# Detailed memory breakdown
cat /proc/meminfo | head -5
```

## Optimization Tips

### 1. Choose the Right Model Size

Select the largest model that fits comfortably in your available RAM:

```bash
# Check available memory
free -h

# If you have 8 GB RAM, use the 3B model
ollama pull llama3.2

# If you have 16+ GB RAM, use the 8B model
ollama pull llama3.1:8b
```

### 2. Reduce Context Window

Shorter context windows use less memory and improve speed:

```bash
# In Ollama Modelfile
FROM llama3.2
PARAMETER num_ctx 2048
```

### 3. Enable Swap Space (Safety Net)

Adding swap prevents out-of-memory kills but degrades performance:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Set CPU Thread Count

Ollama uses all available cores by default. On shared VPS instances, limiting threads can prevent resource contention:

```bash
# Set via environment variable
OLLAMA_NUM_THREADS=4 ollama serve
```

### 5. Keep the Model Loaded

To avoid cold-start delays, increase the model keep-alive time:

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "keep_alive": "24h"
}'
```

## Benchmarking Your Setup

Run a quick benchmark to measure your system's performance:

```bash
# Time a simple request
time curl -s http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Write a one-paragraph summary of machine learning.",
  "stream": false
}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
tokens = data.get('eval_count', 0)
duration = data.get('eval_duration', 1) / 1e9
print(f'Tokens: {tokens}')
print(f'Duration: {duration:.2f}s')
print(f'Speed: {tokens/duration:.1f} tokens/sec')
"
```

## Performance Summary

| VPS Tier         | RAM   | Best Model       | Expected Speed | Experience    |
|------------------|-------|------------------|----------------|---------------|
| Entry (4 core)   | 8 GB  | `llama3.2:1b`    | ~15 tok/s      | Smooth        |
| Mid (8 core)     | 16 GB | `llama3.2` (3B)  | ~12 tok/s      | Comfortable   |
| High (16 core)   | 32 GB | `llama3.1:8b`    | ~10 tok/s      | Comfortable   |
| GPU-enabled       | 16 GB + GPU | `llama3.1:8b` | ~30–70 tok/s | Real-time  |
