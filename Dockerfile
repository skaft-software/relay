FROM ubuntu:26.04 AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates xz-utils bash procps psmisc libgomp1 libatomic1 binutils \
    && curl -fsSL https://nodejs.org/dist/v25.9.0/node-v25.9.0-linux-x64.tar.xz | tar -xJ -C /usr/local --strip-components=1 \
    && rm -rf /var/lib/apt/lists/*

# ── GPU backend: "cuda" or "vulkan" (default) ──────────────────────────
ARG GPU_BACKEND=vulkan

# Vulkan packages
RUN if [ "$GPU_BACKEND" = "vulkan" ]; then \
      apt-get update && apt-get install -y --no-install-recommends \
        libvulkan1 mesa-vulkan-drivers \
      && rm -rf /var/lib/apt/lists/*; \
    fi

# CUDA runtime (libcudart + driver stubs — works with or without nvidia-container-toolkit)
RUN if [ "$GPU_BACKEND" = "cuda" ]; then \
      apt-get update && apt-get install -y --no-install-recommends \
        gnupg2 \
      && curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/3bf863cc.pub \
         | gpg --dearmor -o /usr/share/keyrings/cuda-archive-keyring.gpg \
      && echo "deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/ /" \
         > /etc/apt/sources.list.d/cuda.list \
      && apt-get update && apt-get install -y --no-install-recommends \
        cuda-cudart-12-6 libcublas-12-6 libnccl2 \
      && rm -rf /var/lib/apt/lists/*; \
    fi

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY src ./src
COPY docs ./docs

RUN groupadd -g 991 render 2>/dev/null || true; groupadd -r relay && useradd -r -g relay relay && usermod -a -G 44,991 relay || true

ENV PORT=1234 \
    UPSTREAM_BASE_URL=http://127.0.0.1:8080/v1 \
    MAX_REQUEST_BODY_BYTES=1048576

EXPOSE 1234

USER relay

# Docker Compose supplies .env via env_file. Do not pass --env-file here:
# Node exits when the file path is absent inside the image.
CMD ["node", "--experimental-strip-types", "src/main.ts"]
