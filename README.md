# Scope

A block explorer with native support for ERC-4337 account abstraction.

Originally developed by [destiner](https://github.com/destiner). Now maintained and developed by [Envio](https://envio.dev).

## Structure

This monorepo contains four services:

### ui

The frontend application. Built with Nuxt.js. Provides the user interface for exploring blocks, transactions, addresses, and user operations.

### api

The backend API server. Built with Hono and Bun. Serves label data and contract information to the frontend.

### registry

The label registry. Stores and generates labels for known addresses (protocols, smart accounts, modules, etc.).

### indexer

An indexer for ERC-4337 events. Built with Envio HyperIndex. Indexes UserOperationEvent and AccountDeployed events from EntryPoint contracts across multiple chains. Deployed using Envio's hosted service.

## Local Development

### Prerequisites

- Docker
- Bun
- pnpm (for indexer)

### Database Setup

Start PostgreSQL and set up the registry:

```
make setup
```

This will:
1. Start a PostgreSQL container
2. Apply database migrations
3. Generate labels

Other commands:

```
make db-start   # Start PostgreSQL
make db-stop    # Stop PostgreSQL
make db-reset   # Stop and remove all data
```

## License

MIT
