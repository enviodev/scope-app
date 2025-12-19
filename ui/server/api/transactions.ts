import {
  BlockField,
  HypersyncClient,
  TransactionField,
  type Query,
} from '@envio-dev/hypersync-client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { defineEventHandler, getQuery } from 'h3';
import type { Address, Hex } from 'viem';

import type { Sort } from './common';

interface Transaction {
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

const envioHypersyncApiKey = process.env.ENVIO_HYPERSYNC_API_KEY || '';

console.log('[API /transactions] Module loaded - file is being registered');

export default defineEventHandler(async (event) => {
  // Explicitly set JSON content type
  event.node.res.setHeader('Content-Type', 'application/json');

  console.log('\n========================================');
  console.log('[API /transactions] ⭐ HANDLER CALLED ⭐');
  console.log('[API /transactions] Handler started');
  console.log('========================================\n');

  try {
    console.log('[API /transactions] Step 1: Extracting query parameters...');
    const queryParams = getQuery(event);
    console.log('[API /transactions] Step 1: RAW query params:', queryParams);

    const {
      chain,
      address,
      cursor: cursorString,
      limit: limitString,
      sort,
    } = getQuery<{
      chain: string;
      address: Address;
      cursor: string;
      limit: string;
      sort: Sort;
    }>(event);
    console.log('[API /transactions] Step 1: ✓ Query parameters extracted');
    console.log('[API /transactions] Chain parameter value:', chain, 'Type:', typeof chain);

    console.log('[API /transactions] Step 2: Parsing cursor and limit...');
    const cursor = parseInt(cursorString as string);
    const limit = parseInt(limitString as string);
    console.log('[API /transactions] Step 2: ✓ Parsed values:', { cursor, limit });

    console.log('[API /transactions] Step 3: Full request details:');
    console.log('  - Chain:', chain);
    console.log('  - Address:', address);
    console.log('  - Cursor:', cursor);
    console.log('  - Limit:', limit);
    console.log('  - Sort:', sort);
    console.log('  - API Key present:', !!envioHypersyncApiKey);
    console.log('  - API Key length:', envioHypersyncApiKey.length);
    console.log('  - API Key value:', envioHypersyncApiKey ? `${envioHypersyncApiKey.substring(0, 8)}...` : 'EMPTY');
    console.log('  - process.env.ENVIO_HYPERSYNC_API_KEY:', process.env.ENVIO_HYPERSYNC_API_KEY ? 'SET' : 'NOT SET');

    console.log('[API /transactions] Step 4: Building HyperSync endpoint URL...');
    const endpointUrl = `https://${chain}.hypersync.xyz`;
    console.log('[API /transactions] Step 4: ✓ Endpoint URL:', endpointUrl);

    console.log('[API /transactions] Step 5: Creating HyperSync client...');
    console.log('  - About to call HypersyncClient.new()');
    console.log('  - Using bearerToken:', envioHypersyncApiKey ? 'YES' : 'NO');
    const client = HypersyncClient.new({
      url: endpointUrl,
      bearerToken: envioHypersyncApiKey,
    });
    console.log('[API /transactions] Step 5: ✓ HyperSync client created');

    console.log('[API /transactions] Step 6: Building query object...');
    const query: Query = {
      fromBlock: sort === 'asc' ? cursor || 0 : 0,
      toBlock: sort === 'desc' ? cursor || undefined : undefined,
      transactions: [
        {
          from: [address],
        },
        {
          to: [address],
        },
      ],
      maxNumTransactions: limit,
      fieldSelection: {
        block: [BlockField.Number, BlockField.Timestamp],
        transaction: [
          TransactionField.BlockNumber,
          TransactionField.TransactionIndex,
          TransactionField.Hash,
          TransactionField.From,
          TransactionField.To,
          TransactionField.Input,
          TransactionField.Value,
          TransactionField.GasPrice,
          TransactionField.Status,
        ],
      },
    };
    console.log('[API /transactions] Step 6: ✓ Query object built');
    console.log('[API /transactions] Query details:');
    console.log('  - fromBlock:', query.fromBlock);
    console.log('  - toBlock:', query.toBlock);
    console.log('  - maxNumTransactions:', query.maxNumTransactions);
    console.log('  - transaction filters:', query.transactions?.length);

    console.log('[API /transactions] Step 7: Creating stream receiver...');
    console.log('  - About to call client.stream()');
    console.log('  - Stream options: { reverse:', sort === 'desc', ', maxNumTransactions:', limit, '}');

    let height: number | null = null;
    const receiver = await client.stream(query, {
      reverse: sort === 'desc',
      maxNumTransactions: limit,
    });
    console.log('[API /transactions] Step 7: ✓ Stream receiver created');

    console.log('[API /transactions] Step 8: Initializing transactions array...');
    const transactions: Transaction[] = [];
    console.log('[API /transactions] Step 8: ✓ Array initialized');

    console.log('[API /transactions] Step 9: Starting stream loop...');
    let batchCount = 0;
    for (; ;) {
      batchCount++;
      console.log(`[API /transactions] Step 9.${batchCount}: Waiting for batch ${batchCount}...`);
      console.log('  - About to call receiver.recv()');

      const res = await receiver.recv();

      console.log(`[API /transactions] Step 9.${batchCount}: ✓ Received response from recv()`);
      console.log('  - Response is null?', res === null);

      if (res === null) {
        console.log('[API /transactions] Step 9: Stream ended (res === null)');
        break;
      }

      console.log(`[API /transactions] Batch ${batchCount} details:`);
      console.log('  - Blocks count:', res.data?.blocks?.length || 0);
      console.log('  - Transactions count:', res.data?.transactions?.length || 0);
      console.log('  - Archive height:', res.archiveHeight);
      console.log('  - Next block:', res.nextBlock);

      const pageBlocks = res.data.blocks;
      const pageTransactions = res.data.transactions.map((tx) => {
        const transactionBlock = pageBlocks.find(
          (block) => block.number === tx.blockNumber,
        );
        const timestamp = transactionBlock?.timestamp || 0;
        return {
          blockNumber: tx.blockNumber as number,
          blockTimestamp: 1000 * timestamp,
          from: tx.from as Address,
          gasPrice: tx.gasPrice?.toString() as string,
          hash: tx.hash as Hex,
          input: tx.input as Hex,
          to: (tx.to as Address | undefined) || null,
          transactionIndex: tx.transactionIndex as number,
          value: tx.value?.toString() as string,
          status: tx.status as number,
        };
      });

      console.log(`[API /transactions] Batch ${batchCount}: Mapped ${pageTransactions.length} transactions`);

      transactions.push(...pageTransactions);
      console.log(`[API /transactions] Batch ${batchCount}: Total transactions so far: ${transactions.length}`);

      height = res.archiveHeight || null;

      if (transactions.length >= limit) {
        console.log('[API /transactions] Step 9: Limit reached, stopping stream');
        console.log('  - Transactions count:', transactions.length, '>=', limit);
        break;
      }
    }

    console.log('[API /transactions] Step 10: Calculating pagination...');
    const lastTransaction = transactions.at(-1);
    const prevBlock =
      transactions.length >= limit && lastTransaction
        ? lastTransaction.blockNumber - 1
        : -1;
    console.log('[API /transactions] Step 10: ✓ Pagination calculated');
    console.log('  - Last transaction block:', lastTransaction?.blockNumber);
    console.log('  - Previous block cursor:', prevBlock);
    console.log('  - Height:', height);

    console.log('[API /transactions] Step 11: Preparing response...');

    // Ensure all values are JSON-serializable (no BigInt)
    const safeTransactions = transactions.map((tx) => ({
      ...tx,
      gasPrice: tx.gasPrice.toString(),
      value: tx.value?.toString() || '0',
    }));

    const response = {
      transactions: safeTransactions,
      pagination: {
        cursor: prevBlock,
        height,
      },
    };
    console.log('[API /transactions] Step 11: ✓ Response prepared');
    console.log('  - Total transactions:', response.transactions.length);
    console.log('  - Pagination cursor:', prevBlock);
    console.log('  - Pagination height:', height);
    console.log('  - First transaction gasPrice type:', typeof response.transactions[0]?.gasPrice);

    console.log('\n========================================');
    console.log('[API /transactions] SUCCESS - Returning response');
    console.log('========================================\n');

    return response;
  } catch (error) {
    console.error('\n========================================');
    console.error('[API /transactions] ❌ FATAL ERROR CAUGHT');
    console.error('========================================\n');
    console.error('[API /transactions] Error type:', typeof error);
    console.error('[API /transactions] Error is Error instance?', error instanceof Error);
    console.error('[API /transactions] Full error object:', error);
    console.error('[API /transactions] Error string:', String(error));

    if (error instanceof Error) {
      console.error('[API /transactions] Error name:', error.name);
      console.error('[API /transactions] Error message:', error.message);
      console.error('[API /transactions] Error stack:', error.stack);
    }

    console.error('\n========================================');
    console.error('[API /transactions] Returning error response');
    console.error('========================================\n');

    // Return a proper JSON error response
    return {
      transactions: [],
      pagination: {
        cursor: -1,
        height: null,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
