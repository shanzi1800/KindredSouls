FROM node:22-slim

# ── V116: Cache busting — force fresh build on every railway up ──
ARG CACHE_BUST=20260729-V180-FORCE-REBUILD-CACHE-BUST
ARG BUILD_DATE=$(date -u +"%Y%m%dT%H%M%SZ")
ARG BUILD_DATE=$(date -u +"%Y%m%dT%H%M%SZ")

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recomme
