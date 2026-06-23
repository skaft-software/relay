FROM ubuntu:26.04

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates xz-utils bash procps psmisc libvulkan1 libgomp1 libatomic1 mesa-vulkan-drivers binutils \
    && curl -fsSL https://nodejs.org/dist/v25.9.0/node-v25.9.0-linux-x64.tar.xz | tar -xJ -C /usr/local --strip-components=1 \
    && rm -rf /var/lib/apt/lists/*

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

# Node 22+ native .env loading. Falls back to process env if /app/.env is missing
# (e.g. when --env-file is used via docker run instead of a volume mount).
CMD ["node", "--experimental-strip-types", "--env-file=/app/.env", "src/main.ts"]
