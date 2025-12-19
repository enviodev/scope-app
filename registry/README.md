# Registry

The label registry for Scope. Stores and generates labels for known addresses (protocols, smart accounts, modules, etc.).

## Development

### Environment

Create a `.env.local` file:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scope

# Optional: Custom RPC endpoints (recommended for production)
# Format: RPC_<chainId>=<url>
RPC_1=
RPC_137=
RPC_8453=
RPC_42161=
```

If no custom RPC is set for a chain, the default public RPC from viem will be used. Custom RPCs are recommended to avoid rate limits.

### Setup

To install the dependencies:

```
bun install
```

To apply database migrations:

```
bun run db:migration:apply
```

### Generating Labels

Generate labels for all enabled chains:

```
bun run generate:labels
```

Generate labels for a specific chain:

```
bun run generate:labels 8453    # Base
bun run generate:labels 42161   # Arbitrum
```

List available chains and their RPC status:

```
bun run generate:labels --list
```

### Quick Start

From the repository root:

```
make setup
```
