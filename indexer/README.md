# ERC-4337 EntryPoint Indexer

An indexer for ERC-4337 account abstraction events. Built with [Envio HyperIndex](https://docs.envio.dev/). Indexes UserOperationEvent and AccountDeployed events from EntryPoint v0.7 and v0.8 contracts.

Deployed using [Envio's hosted service](https://envio.dev/).

## Development

To install the dependencies:

```
pnpm
```

To build the indexer:

```
pnpm run codegen
pnpm run build
```

To run the indexer locally:

```
pnpm run dev
```
