# Node.js 24 is the current Active LTS line (as of mid-2026; Node 22 is in
# Maintenance LTS). If this exact tag ever 404s because the base-image repo
# hasn't published it yet, swap to `1-22-bookworm`, which is guaranteed to
# exist. Check available tags at:
# https://github.com/devcontainers/images/pkgs/container/devcontainers%2Ftypescript-node
FROM mcr.microsoft.com/devcontainers/typescript-node:24-bookworm

# MySQL client — for connecting to Aiven MySQL from inside the container
# (via `mysql` CLI, e.g. to run the schema script or poke around manually).
# `default-mysql-client` is Debian's own metapackage (resolves to the
# MariaDB client, which is wire-compatible with MySQL) — no need to add
# Oracle's APT repo just for a CLI tool in a course project.
RUN apt-get update && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get install -y --no-install-recommends default-mysql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Nest CLI — shared across the whole repo, so it lives in the image rather
# than in either app's package.json.
RUN npm install -g @nestjs/cli
