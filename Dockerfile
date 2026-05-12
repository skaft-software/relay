FROM node:25-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY src ./src

RUN addgroup -S relay && adduser -S relay -G relay

ENV HOST=127.0.0.1 \
    PORT=1234 \
    UPSTREAM_BASE_URL=http://host.docker.internal:8080/v1 \
    MAX_REQUEST_BODY_BYTES=1048576

EXPOSE 1234

USER relay

CMD ["node", "--experimental-strip-types", "src/main.ts"]
