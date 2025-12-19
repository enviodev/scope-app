import ky, { type KyInstance } from 'ky';
import type { Address, Hex } from 'viem';

import type { Chain } from '@/utils/chains.js';

type Sort = 'asc' | 'desc';

interface Pagination {
  cursor: number | null;
  height: number | null;
}

interface AddressTransactionsResponse {
  transactions: TransactionResponse[];
  pagination: Pagination;
}

interface AddressTransactions {
  transactions: Transaction[];
  pagination: Pagination;
}

interface AddressLogs {
  logs: Log[];
  pagination: Pagination;
}

interface TransactionResponse {
  blockNumber: number;
  blockTimestamp: number;
  from: Address;
  gasPrice: string;
  hash: Hex;
  input: Hex;
  to: Address | null;
  transactionIndex: number;
  value: string;
  status: number;
}

interface Transaction {
  blockNumber: number;
  blockTimestamp: number;
  from: Address;
  gasPrice: bigint;
  hash: Hex;
  input: Hex;
  to: Address | null;
  transactionIndex: number;
  value: bigint;
  status: number;
}

interface Erc20Transfer {
  type: 'erc20';
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: Hex;
  asset: Address;
  from: Address;
  to: Address;
  amount: string;
}

interface Erc721Transfer {
  type: 'erc721';
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: Hex;
  asset: Address;
  from: Address;
  to: Address;
  id: string;
  amount: string;
}

interface Erc1155Transfer {
  type: 'erc1155';
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: Hex;
  asset: Address;
  from: Address;
  to: Address;
  ids: string[];
  amounts: string[];
}

type Transfer = Erc20Transfer | Erc721Transfer | Erc1155Transfer;

interface AddressTransfers {
  transfers: Transfer[];
  pagination: Pagination;
}

interface Log {
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: Hex;
  logIndex: number;
  address: Address;
  topics: Hex[];
  data: Hex;
}

interface TokenBalance {
  address: Address;
  symbol: string;
  decimals: number;
  balance: string;
  iconUrl?: string;
}

class Service {
  chain: Chain;
  client: KyInstance;

  constructor(chain: Chain, appBaseUrl: string) {
    this.chain = chain;
    this.client = ky.create({
      prefixUrl: `${appBaseUrl}/api`,
      timeout: false,
    });
  }

  getSort(): Sort {
    return 'desc';
  }

  async getAddressTransactions(
    address: Address,
    startCursor: number | null,
    limit: number,
    sort: Sort,
  ): Promise<AddressTransactions> {
    console.log('[HypersyncService] getAddressTransactions called', {
      chain: this.chain,
      address,
      cursor: startCursor,
      limit,
      sort,
    });

    try {
      console.log('[HypersyncService] Making API request to /api/transactions...');
      console.log('[HypersyncService] Search params:', {
        chain: this.chain,
        address,
        cursor: startCursor ? startCursor : 0,
        limit,
        sort,
      });

      const response = await this.client.get('transactions', {
        searchParams: {
          chain: this.chain,
          address,
          cursor: startCursor ? startCursor : 0,
          limit,
          sort,
        },
      });

      console.log('[HypersyncService] Response received:');
      console.log('  - Status:', response.status);
      console.log('  - Status text:', response.statusText);
      console.log('  - Content-Type:', response.headers.get('content-type'));
      console.log('  - Response OK:', response.ok);

      // Clone the response so we can read it multiple times if needed
      const clonedResponse = response.clone();

      // Try to read as text first to see what we're getting
      const responseText = await clonedResponse.text();
      console.log('[HypersyncService] Response body (first 500 chars):', responseText);
      console.log('[HypersyncService] Response body length:', responseText.length);

      // Now parse as JSON
      console.log('[HypersyncService] Attempting to parse response as JSON...');
      const transactions = await response.json<AddressTransactionsResponse>();

      console.log('[HypersyncService] Successfully parsed JSON response');
      console.log('[HypersyncService] Response data:', {
        transactionCount: transactions.transactions?.length || 0,
        pagination: transactions.pagination,
        hasError: !!(transactions as any).error,
        errorMessage: (transactions as any).error,
      });

      return {
        transactions: transactions.transactions.map((transaction) => ({
          ...transaction,
          gasPrice: BigInt(transaction.gasPrice),
          value: BigInt(transaction.value),
        })),
        pagination: transactions.pagination,
      };
    } catch (error) {
      console.error('[HypersyncService] getAddressTransactions ERROR:');
      console.error('  - Error type:', typeof error);
      console.error('  - Error name:', error instanceof Error ? error.name : 'N/A');
      console.error('  - Error message:', error instanceof Error ? error.message : String(error));
      console.error('  - Full error:', error);

      if (error instanceof Error && 'response' in error) {
        const httpError = error as any;
        console.error('  - HTTP Status:', httpError.response?.status);
        console.error('  - HTTP Status Text:', httpError.response?.statusText);

        try {
          const errorBody = await httpError.response?.text();
          console.error('  - Response body:', errorBody?.substring(0, 1000));
        } catch (e) {
          console.error('  - Could not read error response body');
        }
      }

      throw error;
    }
  }

  async getAddressLogs(
    address: Address,
    startCursor: number | null,
    limit: number,
    sort: Sort,
  ): Promise<AddressLogs> {
    console.log('[HypersyncService] getAddressLogs called', {
      chain: this.chain,
      address,
      cursor: startCursor,
      limit,
      sort,
    });

    try {
      console.log('[HypersyncService] Making API request to /api/logs...');
      console.log('[HypersyncService] Search params:', {
        chain: this.chain,
        address,
        cursor: startCursor ? startCursor : 0,
        limit,
        sort,
      });

      const response = await this.client.get('logs', {
        searchParams: {
          chain: this.chain,
          address,
          cursor: startCursor ? startCursor : 0,
          limit,
          sort,
        },
      });

      console.log('[HypersyncService] Response received:');
      console.log('  - Status:', response.status);
      console.log('  - Status text:', response.statusText);
      console.log('  - Content-Type:', response.headers.get('content-type'));
      console.log('  - Response OK:', response.ok);

      // Clone the response so we can read it multiple times if needed
      const clonedResponse = response.clone();

      // Try to read as text first to see what we're getting
      const responseText = await clonedResponse.text();
      console.log('[HypersyncService] Response body (first 500 chars):', responseText.substring(0, 500));
      console.log('[HypersyncService] Response body length:', responseText.length);

      // Now parse as JSON
      console.log('[HypersyncService] Attempting to parse response as JSON...');
      const logs = await response.json<AddressLogs>();

      console.log('[HypersyncService] Successfully parsed JSON response');
      console.log('[HypersyncService] Response data:', {
        logCount: logs.logs?.length || 0,
        pagination: logs.pagination,
        hasError: !!(logs as any).error,
        errorMessage: (logs as any).error,
      });

      return logs;
    } catch (error) {
      console.error('[HypersyncService] getAddressLogs ERROR:');
      console.error('  - Error type:', typeof error);
      console.error('  - Error name:', error instanceof Error ? error.name : 'N/A');
      console.error('  - Error message:', error instanceof Error ? error.message : String(error));
      console.error('  - Full error:', error);

      if (error instanceof Error && 'response' in error) {
        const httpError = error as any;
        console.error('  - HTTP Status:', httpError.response?.status);
        console.error('  - HTTP Status Text:', httpError.response?.statusText);

        try {
          const errorBody = await httpError.response?.text();
          console.error('  - Response body:', errorBody?.substring(0, 1000));
        } catch (e) {
          console.error('  - Could not read error response body');
        }
      }

      throw error;
    }
  }

  async getAddressTransfers(
    address: Address,
    startCursor: number | null,
    limit: number,
    sort: Sort,
  ): Promise<AddressTransfers> {
    const response = await this.client.get('transfers', {
      searchParams: {
        chain: this.chain,
        address,
        cursor: startCursor ? startCursor : 0,
        limit,
        sort,
      },
    });
    return response.json<AddressTransfers>();
  }

  async getOpTxHash(hash: Hex): Promise<Hex> {
    const response = await this.client.get('userop', {
      searchParams: {
        chain: this.chain,
        hash,
      },
    });
    return response.text() as Promise<Hex>;
  }

  async getAddressBalances(address: Address): Promise<TokenBalance[]> {
    const response = await this.client.get('balances', {
      searchParams: {
        chain: this.chain,
        address,
      },
    });
    return response.json<TokenBalance[]>();
  }
}

export default Service;
export type { Transaction, Log, Transfer, Pagination, Sort, TokenBalance };
