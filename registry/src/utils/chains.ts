import { Chain as ChainData } from 'viem';
import {
  mainnet,
  sepolia,
  optimism,
  optimismSepolia,
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  arbitrum,
  arbitrumSepolia,
  mode,
  linea,
  arbitrumNova,
  celo,
  avalanche,
  avalancheFuji,
  gnosis,
  bsc,
  monadTestnet,
  monad,
  megaethTestnet,
} from 'viem/chains';

// Chain IDs
const ETHEREUM = mainnet.id;
const SEPOLIA = sepolia.id;
const OPTIMISM = optimism.id;
const OPTIMISM_SEPOLIA = optimismSepolia.id;
const BASE = base.id;
const BASE_SEPOLIA = baseSepolia.id;
const POLYGON = polygon.id;
const POLYGON_AMOY = polygonAmoy.id;
const ARBITRUM = arbitrum.id;
const ARBITRUM_SEPOLIA = arbitrumSepolia.id;
const MODE = mode.id;
const LINEA = linea.id;
const ARBITRUM_NOVA = arbitrumNova.id;
const CELO = celo.id;
const AVALANCHE = avalanche.id;
const AVALANCHE_FUJI = avalancheFuji.id;
const GNOSIS = gnosis.id;
const BSC = bsc.id;
const MONAD_TESTNET = monadTestnet.id;
const MONAD = monad.id;
const MEGAETH_TESTNET = megaethTestnet.id;

type ChainId =
  | typeof ETHEREUM
  | typeof SEPOLIA
  | typeof OPTIMISM
  | typeof OPTIMISM_SEPOLIA
  | typeof BASE
  | typeof BASE_SEPOLIA
  | typeof POLYGON
  | typeof POLYGON_AMOY
  | typeof ARBITRUM
  | typeof ARBITRUM_SEPOLIA
  | typeof MODE
  | typeof LINEA
  | typeof ARBITRUM_NOVA
  | typeof CELO
  | typeof AVALANCHE
  | typeof AVALANCHE_FUJI
  | typeof GNOSIS
  | typeof BSC
  | typeof MONAD_TESTNET
  | typeof MONAD
  | typeof MEGAETH_TESTNET;

// Chain configuration map
const CHAIN_CONFIG: Record<ChainId, { data: ChainData; name: string }> = {
  [ETHEREUM]: { data: mainnet, name: 'Ethereum' },
  [SEPOLIA]: { data: sepolia, name: 'Sepolia' },
  [OPTIMISM]: { data: optimism, name: 'Optimism' },
  [OPTIMISM_SEPOLIA]: { data: optimismSepolia, name: 'Optimism Sepolia' },
  [BASE]: { data: base, name: 'Base' },
  [BASE_SEPOLIA]: { data: baseSepolia, name: 'Base Sepolia' },
  [POLYGON]: { data: polygon, name: 'Polygon' },
  [POLYGON_AMOY]: { data: polygonAmoy, name: 'Polygon Amoy' },
  [ARBITRUM]: { data: arbitrum, name: 'Arbitrum' },
  [ARBITRUM_SEPOLIA]: { data: arbitrumSepolia, name: 'Arbitrum Sepolia' },
  [MODE]: { data: mode, name: 'Mode' },
  [LINEA]: { data: linea, name: 'Linea' },
  [ARBITRUM_NOVA]: { data: arbitrumNova, name: 'Arbitrum Nova' },
  [CELO]: { data: celo, name: 'Celo' },
  [AVALANCHE]: { data: avalanche, name: 'Avalanche' },
  [AVALANCHE_FUJI]: { data: avalancheFuji, name: 'Avalanche Fuji' },
  [GNOSIS]: { data: gnosis, name: 'Gnosis' },
  [BSC]: { data: bsc, name: 'BSC' },
  [MONAD_TESTNET]: { data: monadTestnet, name: 'Monad Testnet' },
  [MONAD]: { data: monad, name: 'Monad' },
  [MEGAETH_TESTNET]: { data: megaethTestnet, name: 'MegaETH Testnet' },
};

// Enabled chains for label generation
const CHAINS: ChainId[] = [
  POLYGON,
  POLYGON_AMOY,
  BASE,
  BASE_SEPOLIA,
  ARBITRUM,
  ARBITRUM_SEPOLIA,
  MODE,
  LINEA,
  ARBITRUM_NOVA,
  CELO,
  AVALANCHE,
  AVALANCHE_FUJI,
  GNOSIS,
  BSC,
  MONAD_TESTNET,
  MONAD,
  MEGAETH_TESTNET,
];

function getChainData(chainId: ChainId): ChainData {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    throw new Error(`Unknown chain ID: ${chainId}`);
  }
  return config.data;
}

function getChainName(chainId: ChainId): string {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    return `Chain ${chainId}`;
  }
  return config.name;
}

function getRpcUrl(chainId: ChainId): string | null {
  // Check for environment variable first: RPC_<chainId>
  const envKey = `RPC_${chainId}`;
  const envRpc = process.env[envKey];
  if (envRpc) {
    return envRpc;
  }

  // Fall back to viem's default RPC
  const chainData = getChainData(chainId);
  return chainData.rpcUrls.default.http[0] ?? null;
}

function validateRpcConfig(chainId: ChainId): void {
  const rpcUrl = getRpcUrl(chainId);
  const chainName = getChainName(chainId);

  if (!rpcUrl) {
    throw new Error(
      `No RPC configured for ${chainName} (${chainId}).\n` +
      `Set RPC_${chainId} in your .env.local file.`,
    );
  }
}

function isValidChainId(value: number): value is ChainId {
  return value in CHAIN_CONFIG;
}

function parseChainId(value: string): ChainId {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid chain ID: "${value}" is not a number`);
  }
  if (!isValidChainId(parsed)) {
    const validIds = Object.keys(CHAIN_CONFIG).join(', ');
    throw new Error(
      `Unknown chain ID: ${parsed}\nValid chain IDs: ${validIds}`,
    );
  }
  return parsed;
}

function listChains(): void {
  console.info('Available chains:');
  for (const chainId of CHAINS) {
    const name = getChainName(chainId);
    const rpcUrl = getRpcUrl(chainId);
    const envKey = `RPC_${chainId}`;
    const hasCustomRpc = !!process.env[envKey];
    const status = rpcUrl
      ? hasCustomRpc
        ? 'custom RPC'
        : 'default RPC'
      : 'no RPC';
    console.info(`  ${chainId}: ${name} (${status})`);
  }
}

export {
  CHAINS,
  CHAIN_CONFIG,
  ETHEREUM,
  SEPOLIA,
  OPTIMISM,
  OPTIMISM_SEPOLIA,
  BASE,
  BASE_SEPOLIA,
  POLYGON,
  POLYGON_AMOY,
  ARBITRUM,
  ARBITRUM_SEPOLIA,
  MODE,
  LINEA,
  ARBITRUM_NOVA,
  CELO,
  AVALANCHE,
  AVALANCHE_FUJI,
  GNOSIS,
  BSC,
  MONAD_TESTNET,
  MONAD,
  MEGAETH_TESTNET,
  getChainData,
  getChainName,
  getRpcUrl,
  validateRpcConfig,
  isValidChainId,
  parseChainId,
  listChains,
};
export type { ChainId };
