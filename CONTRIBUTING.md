# Contributing to Phloem

Thanks for your interest in contributing to Phloem! This document covers the basics.

## Development Setup

```bash
git clone --recursive https://github.com/phytul/phloem.git
cd phloem
pnpm install
pnpm dev
```

## Branch Strategy

We use a simplified Trunk-Based Development model:

| Branch Type      | Naming              | Example                      |
| ---------------- | ------------------- | ---------------------------- |
| `main`           | —                   | Always releasable, protected |
| `feat/<scope>`   | `feat/gateway-auth` | New features                 |
| `fix/<scope>`    | `fix/mcp-timeout`   | Bug fixes                    |
| `release/v<x.y>` | `release/v0.1`      | Release prep                 |
| `hotfix/<scope>` | `hotfix/sse-leak`   | Emergency fixes              |

- All changes go through Pull Requests (even from maintainers)
- PRs must pass CI before merge
- Use **Squash merge** for feature/fix branches

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body optional>

<footer optional>
```

### Types

| Type       | Purpose                 |
| ---------- | ----------------------- |
| `feat`     | New feature             |
| `fix`      | Bug fix                 |
| `refactor` | Code refactor           |
| `test`     | Test additions/changes  |
| `docs`     | Documentation           |
| `chore`    | Build/tooling           |
| `ci`       | CI/CD changes           |
| `perf`     | Performance improvement |

### Scopes

`gateway`, `mcp`, `web`, `shared`, `deploy`, `docs`, `api`, `ci`, `config`, `deps`

### Examples

```
feat(gateway): implement API key auth middleware
fix(mcp): fix SSE connection timeout cleanup
docs(api): update OpenAPI retrieval schema
chore(deps): bump fastify to 5.2.0
```

**Rules**:

- Subject line ≤ 72 characters
- Use imperative mood ("add" not "added")
- No period at end of subject

## Code Quality

- TypeScript `strict: true` — no `any`, no `@ts-ignore` without reason
- ESLint + Prettier enforced via pre-commit hooks
- All new public functions need types exported
- New API endpoints must be reflected in `openapi.yaml`

## Pull Request Checklist

- [ ] PR title follows Conventional Commits
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test:unit` passes
- [ ] New API paths added to `openapi.yaml`
- [ ] No `console.log` (use structured logger)
- [ ] Environment variables documented in `.env.example`

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
