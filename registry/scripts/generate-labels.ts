import { Address } from 'viem';

import { ChainLabelMap, Source } from '@/labels/base';
import { SOURCES } from '@/labels/sources/index.js';
import {
  ChainId,
  CHAINS,
  getChainName,
  getRpcUrl,
  listChains,
  parseChainId,
} from '@/utils/chains.js';
import { addLabels, disconnect, type LabelWithAddress } from '@/utils/db.js';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.info(`
Usage: bun run generate:labels [options] [chain_id]

Options:
  --help, -h     Show this help message
  --list, -l     List available chains and their RPC status

Arguments:
  chain_id       Optional chain ID to generate labels for a single chain
                 If not provided, generates labels for all enabled chains

Examples:
  bun run generate:labels              # Generate for all chains
  bun run generate:labels 8453         # Generate for Base only
  bun run generate:labels --list       # List available chains
`);
  process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
  listChains();
  process.exit(0);
}

// Determine which chains to process
let chainsToProcess: ChainId[];

if (args.length > 0 && !args[0]?.startsWith('-')) {
  // Single chain mode
  const chainId = parseChainId(args[0]!);
  chainsToProcess = [chainId];
} else {
  // All chains mode
  chainsToProcess = CHAINS;
}

// Validate RPC configuration for all chains we'll process
for (const chain of chainsToProcess) {
  const rpcUrl = getRpcUrl(chain);
  const chainName = getChainName(chain);

  if (!rpcUrl) {
    console.error(
      `Error: No RPC configured for ${chainName} (${chain}).\n` +
        `Set RPC_${chain} in your .env.local file.\n\n` +
        `Run 'bun run generate:labels --list' to see all chains and their RPC status.`,
    );
    process.exit(1);
  }
}

// Process chains
for (const chain of chainsToProcess) {
  const chainName = getChainName(chain);
  console.info(`\nProcessing ${chainName} (${chain})...`);
  await fetchLabels(chain);
}

async function fetchLabels(chain: ChainId): Promise<void> {
  const labels: ChainLabelMap = {};
  const isValid = validateSources(SOURCES);
  if (!isValid) {
    throw new Error('Invalid sources');
  }
  for (const source of SOURCES) {
    const sourceLabelsWithAddress: LabelWithAddress[] = [];
    const info = source.getInfo();
    console.info(`  Fetching from "${info.name}"...`);
    const sourceLabels = await source.fetch(chain, labels);
    for (const addressString in sourceLabels) {
      const address = addressString as Address;
      const sourceLabel = sourceLabels[address];
      if (!sourceLabel) {
        continue;
      }
      const addressLabels = labels[address] || [];
      // Append a label if there is no label with the same type
      const hasSameType = addressLabels.some(
        (label) =>
          label.type && sourceLabel.type && label.type === sourceLabel.type,
      );
      if (!hasSameType) {
        addressLabels.push(sourceLabel);
        sourceLabelsWithAddress.push({
          address,
          ...sourceLabel,
        });
      }
      labels[address] = addressLabels;
    }
    await addLabels(chain, sourceLabelsWithAddress);
  }
}

function validateSources(sources: Source[]): boolean {
  // Source IDs must be unique
  const ids = new Set<string>();
  for (const source of sources) {
    const id = source.getInfo().id;
    if (ids.has(id)) {
      return false;
    }
    ids.add(id);
  }
  return true;
}

console.info('\nDone.');
await disconnect();
