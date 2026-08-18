# Phloem

Phloem is an enterprise-grade, self-hosted knowledge base platform built on RAGFlow. It wraps the engine with a typed Node.js API gateway and MCP server for seamless Agent integration.

> **Phloem** (韧皮部) — the vascular tissue that transports nutrients through a plant. Knowledge should flow the same way.

## Why Phloem

- **Self-hosted** — your documents, your infrastructure, your control. No data leaves your environment.
- **Agent-ready** — expose your knowledge base via REST API or MCP server, so AI agents get grounded, retrieval-augmented answers.
- **Typed end-to-end** — one OpenAPI contract drives gateway routes, client SDK, and mock layers. Fewer integration surprises.
- **Swappable backend** — an adapter layer isolates RAGFlow; swap or upgrade the engine without touching business code.
- **Extensible** — a registry of extension points (middleware, routes, MCP tools, web modules) designed for plugin-style customization without forking.

## Architecture

```
┌────────────┐   REST    ┌─────────────┐            ┌──────────────┐
│  Web UI    │──────────▶│   Gateway   │──adapter──▶│   RAGFlow    │
│  (React)   │           │  (Fastify)  │            │  (submodule) │
└────────────┘           └──────┬──────┘            └──────────────┘
                                │
                         ┌──────┴──────┐
                         │ MCP Server  │  ◀── Claude Desktop, Cursor, custom agents
                         └─────────────┘
```

## Packages

| Package                                 | Description                            |
| --------------------------------------- | -------------------------------------- |
| [`@phloem/shared`](./packages/shared)   | Types, Zod schemas, API contracts      |
| [`@phloem/gateway`](./packages/gateway) | Fastify API gateway with adapter layer |
| [`@phloem/mcp`](./packages/mcp)         | MCP server exposing knowledge tools    |
| [`@phloem/web`](./packages/web)         | React web console (dark, minimal)      |
| `@phloem/eslint-config`                 | Shared ESLint flat config              |

## Getting Started

### Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- Docker (for RAGFlow backend)

### Install

```bash
git clone --recurse-submodules https://github.com/phytul/phloem.git
cd phloem
pnpm install
cp deploy/docker/.env.example deploy/docker/.env
```

### Run (mock mode — no backend needed)

```bash
# Gateway
pnpm --filter @phloem/gateway dev

# Web console (mock data via MSW)
VITE_API_MODE=mock pnpm --filter @phloem/web dev
```

### Run (with RAGFlow)

```bash
# Build and start RAGFlow (Lite profile, Infinity engine)
docker compose -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.lite.yml up -d

pnpm --filter @phloem/gateway dev
pnpm --filter @phloem/web dev
```

### Verify

```bash
curl http://localhost:3000/healthz
```

## API

The REST contract is the single source of truth: [`openapi.yaml`](./openapi.yaml).

Core resources:

- `POST /v1/retrieval` — hybrid retrieval across datasets
- `GET/POST /v1/datasets` — knowledge base management
- `POST /v1/datasets/{id}/documents` — document upload
- `GET /healthz` — liveness probe

## MCP Tools

| Tool                 | Description                             |
| -------------------- | --------------------------------------- |
| `retrieve_knowledge` | Hybrid retrieval across knowledge bases |
| `list_datasets`      | List available knowledge bases          |

## Development

```bash
pnpm run build        # build all packages
pnpm run typecheck    # strict TS check across the monorepo
pnpm run lint         # ESLint + Prettier
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). Hooks (lint-staged + commitlint) enforce this automatically.

## License

[Apache-2.0](./LICENSE)

## Links

- [RAGFlow](https://github.com/infiniflow/ragflow) — the underlying engine
- [MCP](https://modelcontextprotocol.io) — Model Context Protocol
