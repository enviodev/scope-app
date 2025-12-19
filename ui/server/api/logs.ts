import {
  BlockField,
  HypersyncClient,
  LogField,
  type Query,
} from '@envio-dev/hypersync-client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { defineEventHandler, getQuery } from 'h3';
import type { Address, Hex } from 'viem';

import type { Sort } from './common';

interface Log {
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: Hex;
  logIndex: number;
  address: Address;
  topics: Hex[];
  data: Hex;
}

const envioHypersyncApiKey = process.env.ENVIO_HYPERSYNC_API_KEY || '';

export default defineEventHandler(async (event) => {
  // Explicitly set JSON content type
  event.node.res.setHeader('Content-Type', 'application/json');

  console.log('\n========================================');
  console.log('[API /logs] Handler started');
  console.log('========================================\n');

  try {
    console.log('[API /logs] Step 1: Extracting query parameters...');
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
    console.log('[API /logs] Step 1: ✓ Query parameters extracted');

    console.log('[API /logs] Step 2: Parsing cursor and limit...');
    const cursor = parseInt(cursorString as string);
    const limit = parseInt(limitString as string);
    console.log('[API /logs] Step 2: ✓ Parsed values:', { cursor, limit });

    console.log('[API /logs] Step 3: Full request details:');
    console.log('  - Chain:', chain);
    console.log('  - Address:', address);
    console.log('  - Cursor:', cursor);
    console.log('  - Limit:', limit);
    console.log('  - Sort:', sort);
    console.log('  - API Key present:', !!envioHypersyncApiKey);
    console.log('  - API Key length:', envioHypersyncApiKey.length);

    console.log('[API /logs] Step 4: Building HyperSync endpoint URL...');
    const endpointUrl = `https://${chain}.hypersync.xyz`;
    console.log('[API /logs] Step 4: ✓ Endpoint URL:', endpointUrl);

    console.log('[API /logs] Step 5: Creating HyperSync client...');
    console.log('  - About to call HypersyncClient.new()');
    console.log('  - Using bearerToken:', envioHypersyncApiKey ? 'YES' : 'NO');
    const client = HypersyncClient.new({
      url: endpointUrl,
      bearerToken: envioHypersyncApiKey,
    });
    console.log('[API /logs] Step 5: ✓ HyperSync client created');

    console.log('[API /logs] Step 6: Building query object...');
    const query: Query = {
      fromBlock: sort === 'asc' ? cursor || 0 : 0,
      toBlock: sort === 'desc' ? cursor || undefined : undefined,
      logs: [
        {
          address: [address],
        },
      ],
      maxNumLogs: limit,
      fieldSelection: {
        block: [BlockField.Number, BlockField.Timestamp],
        log: [
          LogField.LogIndex,
          LogField.TransactionHash,
          LogField.BlockNumber,
          LogField.Address,
          LogField.Data,
          LogField.Topic0,
          LogField.Topic1,
          LogField.Topic2,
          LogField.Topic3,
        ],
      },
    };
    console.log('[API /logs] Step 6: ✓ Query object built');
    console.log('[API /logs] Query details:');
    console.log('  - fromBlock:', query.fromBlock);
    console.log('  - toBlock:', query.toBlock);
    console.log('  - maxNumLogs:', query.maxNumLogs);
    console.log('  - log filters:', query.logs?.length);

    console.log('[API /logs] Step 7: Creating stream receiver...');
    console.log('  - About to call client.stream()');
    console.log('  - Stream options: { reverse:', sort === 'desc', ', maxNumLogs:', limit, '}');

    let height: number | null = null;
    const receiver = await client.stream(query, {
      reverse: sort === 'desc',
      maxNumLogs: limit,
    });
    console.log('[API /logs] Step 7: ✓ Stream receiver created');

    console.log('[API /logs] Step 8: Initializing logs array...');
    const logs: Log[] = [];
    console.log('[API /logs] Step 8: ✓ Array initialized');

    console.log('[API /logs] Step 9: Starting stream loop...');
    let batchCount = 0;
    for (; ;) {
      batchCount++;
      console.log(`[API /logs] Step 9.${batchCount}: Waiting for batch ${batchCount}...`);
      console.log('  - About to call receiver.recv()');

      const res = await receiver.recv();

      console.log(`[API /logs] Step 9.${batchCount}: ✓ Received response from recv()`);
      console.log('  - Response is null?', res === null);

      if (res === null) {
        console.log('[API /logs] Step 9: Stream ended (res === null)');
        break;
      }

      console.log(`[API /logs] Batch ${batchCount} details:`);
      console.log('  - Blocks count:', res.data?.blocks?.length || 0);
      console.log('  - Logs count:', res.data?.logs?.length || 0);
      console.log('  - Archive height:', res.archiveHeight);
      console.log('  - Next block:', res.nextBlock);

      const pageBlocks = res.data.blocks;
      const pageLogs = res.data.logs.map((log) => {
        const logBlock = pageBlocks.find(
          (block) => block.number === log.blockNumber,
        );
        const timestamp = logBlock?.timestamp || 0;
        return {
          blockNumber: log.blockNumber as number,
          blockTimestamp: 1000 * timestamp,
          logIndex: log.logIndex as number,
          transactionHash: log.transactionHash as Hex,
          address: log.address as Address,
          data: log.data as Hex,
          topics: log.topics.filter(
            (topic) => topic !== null && topic !== undefined,
          ) as Hex[],
        };
      });

      console.log(`[API /logs] Batch ${batchCount}: Mapped ${pageLogs.length} logs`);

      logs.push(...pageLogs);
      console.log(`[API /logs] Batch ${batchCount}: Total logs so far: ${logs.length}`);

      height = res.archiveHeight || null;

      if (logs.length >= limit) {
        console.log('[API /logs] Step 9: Limit reached, stopping stream');
        console.log('  - Logs count:', logs.length, '>=', limit);
        break;
      }
    }

    console.log('[API /logs] Step 10: Calculating pagination...');
    const lastLog = logs.at(-1);
    const prevBlock =
      logs.length >= limit && lastLog ? lastLog.blockNumber - 1 : -1;
    console.log('[API /logs] Step 10: ✓ Pagination calculated');
    console.log('  - Last log block:', lastLog?.blockNumber);
    console.log('  - Previous block cursor:', prevBlock);
    console.log('  - Height:', height);

    console.log('[API /logs] Step 11: Preparing response...');
    const response = {
      logs,
      pagination: {
        cursor: prevBlock,
        height,
      },
    };
    console.log('[API /logs] Step 11: ✓ Response prepared');
    console.log('  - Total logs:', logs.length);
    console.log('  - Pagination cursor:', prevBlock);
    console.log('  - Pagination height:', height);

    console.log('\n========================================');
    console.log('[API /logs] SUCCESS - Returning response');
    console.log('========================================\n');

    return response;
  } catch (error) {
    console.error('\n========================================');
    console.error('[API /logs] ❌ FATAL ERROR CAUGHT');
    console.error('========================================\n');
    console.error('[API /logs] Error type:', typeof error);
    console.error('[API /logs] Error is Error instance?', error instanceof Error);
    console.error('[API /logs] Full error object:', error);
    console.error('[API /logs] Error string:', String(error));

    if (error instanceof Error) {
      console.error('[API /logs] Error name:', error.name);
      console.error('[API /logs] Error message:', error.message);
      console.error('[API /logs] Error stack:', error.stack);
    }

    console.error('\n========================================');
    console.error('[API /logs] Returning error response');
    console.error('========================================\n');

    // Return a proper JSON error response
    return {
      logs: [],
      pagination: {
        cursor: -1,
        height: null,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
