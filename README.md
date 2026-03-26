# Scope

[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289da?logo=discord&logoColor=white)](https://discord.com/invite/envio)

A block explorer with native support for [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) account abstraction, powered by [Envio HyperIndex](https://docs.envio.dev/docs/HyperIndex/overview).

Live at [scope.sh](https://scope.sh).

Originally developed by [destiner](https://github.com/destiner). Now maintained and developed by [Envio](https://envio.dev).

## What is Scope?

Scope is an account abstraction-focused block explorer that lets you explore blocks, transactions, addresses, and ERC-4337 user operations across multiple chains. The indexer powering it is built with Envio HyperIndex, deployed on Envio's hosted service, and indexes `UserOperationEvent` and `AccountDeployed` events from EntryPoint contracts.

## Repo Structure

This monorepo contains four services:

### ui
The frontend application. Built with Nuxt.js. Provides the user interface for exploring blocks, transactions, addresses, and user operations.

### api
The backend API server. Built with Hono and Bun. Serves label data and contract information to the frontend.

### registry
The label registry. Stores and generates labels for known addresses (protocols, smart accounts, modules, etc.).

### indexer
An indexer for ERC-4337 events. Built with Envio HyperIndex. Indexes `UserOperationEvent` and `AccountDeployed` events from EntryPoint contracts across multiple chains. Deployed on Envio's hosted service.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Bun](https://bun.sh)
- [pnpm](https://pnpm.io/installation) (for the indexer)

## Local Development

```bash
make setup      # Start services, apply migrations, install dependencies
make api-dev    # Run API server
make ui-dev     # Run UI (in a separate terminal)
```

### All Commands

**Database:**
```bash
make db-start   # Start PostgreSQL and Minio
make db-stop    # Stop all containers
make db-reset   # Stop and remove all data
make db-setup   # Start database and apply migrations
```

**Registry:**
```bash
make registry-generate                   # Generate labels for all chains
make registry-generate-chain CHAIN=8453  # Generate labels for a specific chain
make registry-chains                     # List available chains
```

**API:**
```bash
make api-install  # Install dependencies
make api-dev      # Run in development mode
make api-start    # Run in production mode
```

**UI:**
```bash
make ui-install   # Install dependencies
make ui-dev       # Run in development mode
```

## Built With

- [Envio HyperIndex](https://docs.envio.dev/docs/HyperIndex/overview) - multichain indexing framework for ERC-4337 events
- [Nuxt.js](https://nuxt.com) - frontend framework
- [Hono](https://hono.dev) + [Bun](https://bun.sh) - API server
- [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) - account abstraction standard

## Documentation

- [HyperIndex Docs](https://docs.envio.dev/docs/HyperIndex/overview)
- [Envio Hosted Service](https://docs.envio.dev/docs/HyperIndex/hosted-service)

## License

MIT

## Support

- [Discord community](https://discord.com/invite/envio)
- [Envio Docs](https://docs.envio.dev)
