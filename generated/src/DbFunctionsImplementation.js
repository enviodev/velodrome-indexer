// db operations for raw_events:
const MAX_ITEMS_PER_QUERY = 500;

module.exports.readLatestSyncedEventOnChainId = (sql, chainId) => sql`
  SELECT *
  FROM public.event_sync_state
  WHERE chain_id = ${chainId}`;

module.exports.batchSetEventSyncState = (sql, entityDataArray) => {
  return sql`
    INSERT INTO public.event_sync_state
  ${sql(
    entityDataArray,
    "chain_id",
    "block_number",
    "log_index",
    "transaction_index",
    "block_timestamp"
  )}
    ON CONFLICT(chain_id) DO UPDATE
    SET
    "chain_id" = EXCLUDED."chain_id",
    "block_number" = EXCLUDED."block_number",
    "log_index" = EXCLUDED."log_index",
    "transaction_index" = EXCLUDED."transaction_index",
    "block_timestamp" = EXCLUDED."block_timestamp";
    `;
};

module.exports.setChainMetadata = (sql, entityDataArray) => {
  return (sql`
    INSERT INTO public.chain_metadata
  ${sql(
    entityDataArray,
    "chain_id",
    "start_block", // this is left out of the on conflict below as it only needs to be set once
    "block_height"
  )}
  ON CONFLICT(chain_id) DO UPDATE
  SET
  "chain_id" = EXCLUDED."chain_id",
  "block_height" = EXCLUDED."block_height";`).then(res => {
    
  }).catch(err => {
    console.log("errored", err)
  });
};

module.exports.readLatestRawEventsBlockNumberProcessedOnChainId = (
  sql,
  chainId
) => sql`
  SELECT block_number
  FROM "public"."raw_events"
  WHERE chain_id = ${chainId}
  ORDER BY event_id DESC
  LIMIT 1;`;

module.exports.readRawEventsEntities = (sql, entityIdArray) => sql`
  SELECT *
  FROM "public"."raw_events"
  WHERE (chain_id, event_id) IN ${sql(entityIdArray)}`;

module.exports.getRawEventsPageGtOrEqEventId = (
  sql,
  chainId,
  eventId,
  limit,
  contractAddresses
) => sql`
  SELECT *
  FROM "public"."raw_events"
  WHERE "chain_id" = ${chainId}
  AND "event_id" >= ${eventId}
  AND "src_address" IN ${sql(contractAddresses)}
  ORDER BY "event_id" ASC
  LIMIT ${limit}
`;

module.exports.getRawEventsPageWithinEventIdRangeInclusive = (
  sql,
  chainId,
  fromEventIdInclusive,
  toEventIdInclusive,
  limit,
  contractAddresses
) => sql`
  SELECT *
  FROM public.raw_events
  WHERE "chain_id" = ${chainId}
  AND "event_id" >= ${fromEventIdInclusive}
  AND "event_id" <= ${toEventIdInclusive}
  AND "src_address" IN ${sql(contractAddresses)}
  ORDER BY "event_id" ASC
  LIMIT ${limit}
`;

const batchSetRawEventsCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."raw_events"
  ${sql(
    entityDataArray,
    "chain_id",
    "event_id",
    "block_number",
    "log_index",
    "transaction_index",
    "transaction_hash",
    "src_address",
    "block_hash",
    "block_timestamp",
    "event_type",
    "params"
  )}
    ON CONFLICT(chain_id, event_id) DO UPDATE
    SET
    "chain_id" = EXCLUDED."chain_id",
    "event_id" = EXCLUDED."event_id",
    "block_number" = EXCLUDED."block_number",
    "log_index" = EXCLUDED."log_index",
    "transaction_index" = EXCLUDED."transaction_index",
    "transaction_hash" = EXCLUDED."transaction_hash",
    "src_address" = EXCLUDED."src_address",
    "block_hash" = EXCLUDED."block_hash",
    "block_timestamp" = EXCLUDED."block_timestamp",
    "event_type" = EXCLUDED."event_type",
    "params" = EXCLUDED."params";`;
};

const chunkBatchQuery = (
  sql,
  entityDataArray,
  queryToExecute
) => {
  const promises = [];

  // Split entityDataArray into chunks of MAX_ITEMS_PER_QUERY
  for (let i = 0; i < entityDataArray.length; i += MAX_ITEMS_PER_QUERY) {
    const chunk = entityDataArray.slice(i, i + MAX_ITEMS_PER_QUERY);

    promises.push(queryToExecute(sql, chunk));
  }

  // Execute all promises
  return Promise.all(promises).catch(e => {
    console.error("Sql query failed", e);
    throw e;
    });
};
const arrayToSqlValues = (dataArray) => {
  return dataArray.map(item => {
    return `(${item.chain_id}, '${item.entity_id}', ${item.block_number}, ${item.log_index}, '${item.transaction_hash}', '${item.entity_type}', (SELECT block_number FROM "public"."entity_history" 
              WHERE entity_id = '${item.entity_id}'
              ORDER BY block_number DESC 
              LIMIT 1))`;
  }).join(', ');
}

function mergeArrays(array1, array2) {
  const array2Map = new Map(array2.map(item => [item.entity_id, item]));

  return array1.map(item => {
    const match = array2Map.get(item.entity_id);
    if (match) {
      return {
        ...item,
        previous_block_number: match.previous_block_number,
        previous_log_index: match.previous_log_index
      };
    }
    else {
      return item;
    }
  });
}

const fetchPreviousBlockNumbersAndLogIndices = async (sql, entityDataArray) => {
  const entityIds = entityDataArray.map(item => item.entity_id);
  const uniqueEntityIds = [...new Set(entityIds)]; // Remove duplicates

  const previousBlockNumbersAndLogIndices = await sql`
    SELECT entity_id, block_number as previous_block_number, log_index as previous_log_index
    FROM "public"."entity_history"
    WHERE (entity_id, block_number, log_index) IN (
      SELECT entity_id, MAX(block_number), MAX(log_index)
      FROM "public"."entity_history"
      WHERE entity_id = ANY(${sql.array(uniqueEntityIds)})
      GROUP BY entity_id
    )
  `;

  let merge = mergeArrays(entityDataArray, previousBlockNumbersAndLogIndices)

  return merge
};

const batchSetEntityHistory = async (sql, entityDataArray) => {
  // NOTE: unfortunately the transform to automatically transform undefined to null in postgres doesn't work with queries constructed with arrays like this.
  //       https://github.com/porsager/postgres/blob/v3.4.3/README.md#transform-undefined-values
  //       This code is a workaround for that.
  for (let i = 0; i < entityDataArray.length; i++) {
    if (entityDataArray[i].previous_block_number === undefined)
      entityDataArray[i].previous_block_number = null

    if (entityDataArray[i].previous_log_index === undefined)
      entityDataArray[i].previous_log_index = null
  }

  return sql`
    INSERT INTO "public"."entity_history"
  ${sql(
    entityDataArray,
    "chain_id", "entity_id", "block_number", "log_index", "transaction_hash", "entity_type", "previous_block_number", "previous_log_index", "params"
  )};`
};

module.exports.batchSetEntityHistoryTable =  async (sql, entityDataArrayWithPrev, entityDataArrayWithoutPrev) => {
   const result = await fetchPreviousBlockNumbersAndLogIndices(sql, entityDataArrayWithoutPrev)
  const previousData = [...result, ...entityDataArrayWithPrev];
  return chunkBatchQuery(
    sql,
    previousData,
    batchSetEntityHistory
  );
};

module.exports.batchSetRawEvents = (sql, entityDataArray) => {
  return chunkBatchQuery(
    sql,
    entityDataArray,
    batchSetRawEventsCore
  );
};

module.exports.batchDeleteRawEvents = (sql, entityIdArray) => sql`
  DELETE
  FROM "public"."raw_events"
  WHERE (chain_id, event_id) IN ${sql(entityIdArray)};`;
// end db operations for raw_events

module.exports.readDynamicContractsOnChainIdAtOrBeforeBlock = (
  sql,
  chainId,
  block_number
) => sql`
  SELECT c.contract_address, c.contract_type, c.event_id
  FROM "public"."dynamic_contract_registry" as c
  JOIN raw_events e ON c.chain_id = e.chain_id
  AND c.event_id = e.event_id
  WHERE e.block_number <= ${block_number} AND e.chain_id = ${chainId};`;

//Start db operations dynamic_contract_registry
module.exports.readDynamicContractRegistryEntities = (
  sql,
  entityIdArray
) => sql`
  SELECT *
  FROM "public"."dynamic_contract_registry"
  WHERE (chain_id, contract_address) IN ${sql(entityIdArray)}`;

const batchSetDynamicContractRegistryCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."dynamic_contract_registry"
  ${sql(
    entityDataArray,
    "chain_id",
    "event_id",
    "contract_address",
    "contract_type"
  )}
    ON CONFLICT(chain_id, contract_address) DO UPDATE
    SET
    "chain_id" = EXCLUDED."chain_id",
    "event_id" = EXCLUDED."event_id",
    "contract_address" = EXCLUDED."contract_address",
    "contract_type" = EXCLUDED."contract_type";`;
};

module.exports.batchSetDynamicContractRegistry = (sql, entityDataArray) => {
  return chunkBatchQuery(
    sql,
    entityDataArray,
    batchSetDynamicContractRegistryCore
  );
};

module.exports.batchDeleteDynamicContractRegistry = (sql, entityIdArray) => sql`
  DELETE
  FROM "public"."dynamic_contract_registry"
  WHERE (chain_id, contract_address) IN ${sql(entityIdArray)};`;
// end db operations for dynamic_contract_registry

//////////////////////////////////////////////
// DB operations for LiquidityPoolDailySnapshot:
//////////////////////////////////////////////

module.exports.readLiquidityPoolDailySnapshotEntities = (sql, entityIdArray) => sql`
SELECT 
"chainID",
"totalFees1",
"pool",
"totalFeesUSD",
"totalEmissions",
"totalLiquidityUSD",
"reserve1",
"id",
"totalVolume0",
"totalVolume1",
"token1Price",
"numberOfSwaps",
"token0Price",
"totalVolumeUSD",
"name",
"reserve0",
"totalEmissionsUSD",
"lastUpdatedTimestamp",
"totalFees0",
"totalBribesUSD"
FROM "public"."LiquidityPoolDailySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLiquidityPoolDailySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LiquidityPoolDailySnapshot"
${sql(entityDataArray,
    "chainID",
    "totalFees1",
    "pool",
    "totalFeesUSD",
    "totalEmissions",
    "totalLiquidityUSD",
    "reserve1",
    "id",
    "totalVolume0",
    "totalVolume1",
    "token1Price",
    "numberOfSwaps",
    "token0Price",
    "totalVolumeUSD",
    "name",
    "reserve0",
    "totalEmissionsUSD",
    "lastUpdatedTimestamp",
    "totalFees0",
    "totalBribesUSD"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "chainID" = EXCLUDED."chainID",
  "totalFees1" = EXCLUDED."totalFees1",
  "pool" = EXCLUDED."pool",
  "totalFeesUSD" = EXCLUDED."totalFeesUSD",
  "totalEmissions" = EXCLUDED."totalEmissions",
  "totalLiquidityUSD" = EXCLUDED."totalLiquidityUSD",
  "reserve1" = EXCLUDED."reserve1",
  "id" = EXCLUDED."id",
  "totalVolume0" = EXCLUDED."totalVolume0",
  "totalVolume1" = EXCLUDED."totalVolume1",
  "token1Price" = EXCLUDED."token1Price",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps",
  "token0Price" = EXCLUDED."token0Price",
  "totalVolumeUSD" = EXCLUDED."totalVolumeUSD",
  "name" = EXCLUDED."name",
  "reserve0" = EXCLUDED."reserve0",
  "totalEmissionsUSD" = EXCLUDED."totalEmissionsUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp",
  "totalFees0" = EXCLUDED."totalFees0",
  "totalBribesUSD" = EXCLUDED."totalBribesUSD"
  `;
}

module.exports.batchSetLiquidityPoolDailySnapshot = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetLiquidityPoolDailySnapshotCore
  );
}

module.exports.batchDeleteLiquidityPoolDailySnapshot = (sql, entityIdArray) => sql`
DELETE
FROM "public"."LiquidityPoolDailySnapshot"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for LiquidityPoolDailySnapshot

//////////////////////////////////////////////
// DB operations for LiquidityPoolHourlySnapshot:
//////////////////////////////////////////////

module.exports.readLiquidityPoolHourlySnapshotEntities = (sql, entityIdArray) => sql`
SELECT 
"totalEmissionsUSD",
"totalFees1",
"totalVolume0",
"pool",
"reserve1",
"totalEmissions",
"totalVolumeUSD",
"totalBribesUSD",
"lastUpdatedTimestamp",
"totalVolume1",
"totalFeesUSD",
"token1Price",
"totalFees0",
"name",
"chainID",
"numberOfSwaps",
"id",
"reserve0",
"totalLiquidityUSD",
"token0Price"
FROM "public"."LiquidityPoolHourlySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLiquidityPoolHourlySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LiquidityPoolHourlySnapshot"
${sql(entityDataArray,
    "totalEmissionsUSD",
    "totalFees1",
    "totalVolume0",
    "pool",
    "reserve1",
    "totalEmissions",
    "totalVolumeUSD",
    "totalBribesUSD",
    "lastUpdatedTimestamp",
    "totalVolume1",
    "totalFeesUSD",
    "token1Price",
    "totalFees0",
    "name",
    "chainID",
    "numberOfSwaps",
    "id",
    "reserve0",
    "totalLiquidityUSD",
    "token0Price"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "totalEmissionsUSD" = EXCLUDED."totalEmissionsUSD",
  "totalFees1" = EXCLUDED."totalFees1",
  "totalVolume0" = EXCLUDED."totalVolume0",
  "pool" = EXCLUDED."pool",
  "reserve1" = EXCLUDED."reserve1",
  "totalEmissions" = EXCLUDED."totalEmissions",
  "totalVolumeUSD" = EXCLUDED."totalVolumeUSD",
  "totalBribesUSD" = EXCLUDED."totalBribesUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp",
  "totalVolume1" = EXCLUDED."totalVolume1",
  "totalFeesUSD" = EXCLUDED."totalFeesUSD",
  "token1Price" = EXCLUDED."token1Price",
  "totalFees0" = EXCLUDED."totalFees0",
  "name" = EXCLUDED."name",
  "chainID" = EXCLUDED."chainID",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps",
  "id" = EXCLUDED."id",
  "reserve0" = EXCLUDED."reserve0",
  "totalLiquidityUSD" = EXCLUDED."totalLiquidityUSD",
  "token0Price" = EXCLUDED."token0Price"
  `;
}

module.exports.batchSetLiquidityPoolHourlySnapshot = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetLiquidityPoolHourlySnapshotCore
  );
}

module.exports.batchDeleteLiquidityPoolHourlySnapshot = (sql, entityIdArray) => sql`
DELETE
FROM "public"."LiquidityPoolHourlySnapshot"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for LiquidityPoolHourlySnapshot

//////////////////////////////////////////////
// DB operations for LiquidityPoolNew:
//////////////////////////////////////////////

module.exports.readLiquidityPoolNewEntities = (sql, entityIdArray) => sql`
SELECT 
"name",
"totalFeesUSD",
"token0_id",
"token0Price",
"reserve0",
"totalEmissions",
"totalVolumeUSD",
"chainID",
"isStable",
"reserve1",
"totalLiquidityUSD",
"token1_id",
"totalVolume1",
"numberOfSwaps",
"totalVolume0",
"totalFees0",
"id",
"totalFees1",
"token1Price",
"totalEmissionsUSD",
"totalBribesUSD",
"lastUpdatedTimestamp"
FROM "public"."LiquidityPoolNew"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLiquidityPoolNewCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LiquidityPoolNew"
${sql(entityDataArray,
    "name",
    "totalFeesUSD",
    "token0_id",
    "token0Price",
    "reserve0",
    "totalEmissions",
    "totalVolumeUSD",
    "chainID",
    "isStable",
    "reserve1",
    "totalLiquidityUSD",
    "token1_id",
    "totalVolume1",
    "numberOfSwaps",
    "totalVolume0",
    "totalFees0",
    "id",
    "totalFees1",
    "token1Price",
    "totalEmissionsUSD",
    "totalBribesUSD",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "name" = EXCLUDED."name",
  "totalFeesUSD" = EXCLUDED."totalFeesUSD",
  "token0_id" = EXCLUDED."token0_id",
  "token0Price" = EXCLUDED."token0Price",
  "reserve0" = EXCLUDED."reserve0",
  "totalEmissions" = EXCLUDED."totalEmissions",
  "totalVolumeUSD" = EXCLUDED."totalVolumeUSD",
  "chainID" = EXCLUDED."chainID",
  "isStable" = EXCLUDED."isStable",
  "reserve1" = EXCLUDED."reserve1",
  "totalLiquidityUSD" = EXCLUDED."totalLiquidityUSD",
  "token1_id" = EXCLUDED."token1_id",
  "totalVolume1" = EXCLUDED."totalVolume1",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps",
  "totalVolume0" = EXCLUDED."totalVolume0",
  "totalFees0" = EXCLUDED."totalFees0",
  "id" = EXCLUDED."id",
  "totalFees1" = EXCLUDED."totalFees1",
  "token1Price" = EXCLUDED."token1Price",
  "totalEmissionsUSD" = EXCLUDED."totalEmissionsUSD",
  "totalBribesUSD" = EXCLUDED."totalBribesUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
  `;
}

module.exports.batchSetLiquidityPoolNew = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetLiquidityPoolNewCore
  );
}

module.exports.batchDeleteLiquidityPoolNew = (sql, entityIdArray) => sql`
DELETE
FROM "public"."LiquidityPoolNew"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for LiquidityPoolNew

//////////////////////////////////////////////
// DB operations for LiquidityPoolWeeklySnapshot:
//////////////////////////////////////////////

module.exports.readLiquidityPoolWeeklySnapshotEntities = (sql, entityIdArray) => sql`
SELECT 
"name",
"totalVolume1",
"totalLiquidityUSD",
"totalEmissions",
"pool",
"reserve0",
"totalVolumeUSD",
"totalFeesUSD",
"numberOfSwaps",
"totalVolume0",
"token1Price",
"totalEmissionsUSD",
"totalBribesUSD",
"lastUpdatedTimestamp",
"totalFees0",
"reserve1",
"token0Price",
"id",
"totalFees1",
"chainID"
FROM "public"."LiquidityPoolWeeklySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLiquidityPoolWeeklySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LiquidityPoolWeeklySnapshot"
${sql(entityDataArray,
    "name",
    "totalVolume1",
    "totalLiquidityUSD",
    "totalEmissions",
    "pool",
    "reserve0",
    "totalVolumeUSD",
    "totalFeesUSD",
    "numberOfSwaps",
    "totalVolume0",
    "token1Price",
    "totalEmissionsUSD",
    "totalBribesUSD",
    "lastUpdatedTimestamp",
    "totalFees0",
    "reserve1",
    "token0Price",
    "id",
    "totalFees1",
    "chainID"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "name" = EXCLUDED."name",
  "totalVolume1" = EXCLUDED."totalVolume1",
  "totalLiquidityUSD" = EXCLUDED."totalLiquidityUSD",
  "totalEmissions" = EXCLUDED."totalEmissions",
  "pool" = EXCLUDED."pool",
  "reserve0" = EXCLUDED."reserve0",
  "totalVolumeUSD" = EXCLUDED."totalVolumeUSD",
  "totalFeesUSD" = EXCLUDED."totalFeesUSD",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps",
  "totalVolume0" = EXCLUDED."totalVolume0",
  "token1Price" = EXCLUDED."token1Price",
  "totalEmissionsUSD" = EXCLUDED."totalEmissionsUSD",
  "totalBribesUSD" = EXCLUDED."totalBribesUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp",
  "totalFees0" = EXCLUDED."totalFees0",
  "reserve1" = EXCLUDED."reserve1",
  "token0Price" = EXCLUDED."token0Price",
  "id" = EXCLUDED."id",
  "totalFees1" = EXCLUDED."totalFees1",
  "chainID" = EXCLUDED."chainID"
  `;
}

module.exports.batchSetLiquidityPoolWeeklySnapshot = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetLiquidityPoolWeeklySnapshotCore
  );
}

module.exports.batchDeleteLiquidityPoolWeeklySnapshot = (sql, entityIdArray) => sql`
DELETE
FROM "public"."LiquidityPoolWeeklySnapshot"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for LiquidityPoolWeeklySnapshot

//////////////////////////////////////////////
// DB operations for Token:
//////////////////////////////////////////////

module.exports.readTokenEntities = (sql, entityIdArray) => sql`
SELECT 
"symbol",
"lastUpdatedTimestamp",
"name",
"chainID",
"id",
"decimals",
"poolUsedForPricing",
"pricePerUSDNew"
FROM "public"."Token"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetTokenCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."Token"
${sql(entityDataArray,
    "symbol",
    "lastUpdatedTimestamp",
    "name",
    "chainID",
    "id",
    "decimals",
    "poolUsedForPricing",
    "pricePerUSDNew"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "symbol" = EXCLUDED."symbol",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp",
  "name" = EXCLUDED."name",
  "chainID" = EXCLUDED."chainID",
  "id" = EXCLUDED."id",
  "decimals" = EXCLUDED."decimals",
  "poolUsedForPricing" = EXCLUDED."poolUsedForPricing",
  "pricePerUSDNew" = EXCLUDED."pricePerUSDNew"
  `;
}

module.exports.batchSetToken = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetTokenCore
  );
}

module.exports.batchDeleteToken = (sql, entityIdArray) => sql`
DELETE
FROM "public"."Token"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for Token

//////////////////////////////////////////////
// DB operations for TokenDailySnapshot:
//////////////////////////////////////////////

module.exports.readTokenDailySnapshotEntities = (sql, entityIdArray) => sql`
SELECT 
"token",
"pricePerUSDNew",
"symbol",
"lastUpdatedTimestamp",
"name",
"id",
"poolUsedForPricing",
"chainID"
FROM "public"."TokenDailySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetTokenDailySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."TokenDailySnapshot"
${sql(entityDataArray,
    "token",
    "pricePerUSDNew",
    "symbol",
    "lastUpdatedTimestamp",
    "name",
    "id",
    "poolUsedForPricing",
    "chainID"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "token" = EXCLUDED."token",
  "pricePerUSDNew" = EXCLUDED."pricePerUSDNew",
  "symbol" = EXCLUDED."symbol",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp",
  "name" = EXCLUDED."name",
  "id" = EXCLUDED."id",
  "poolUsedForPricing" = EXCLUDED."poolUsedForPricing",
  "chainID" = EXCLUDED."chainID"
  `;
}

module.exports.batchSetTokenDailySnapshot = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetTokenDailySnapshotCore
  );
}

module.exports.batchDeleteTokenDailySnapshot = (sql, entityIdArray) => sql`
DELETE
FROM "public"."TokenDailySnapshot"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for TokenDailySnapshot

//////////////////////////////////////////////
// DB operations for TokenHourlySnapshot:
//////////////////////////////////////////////

module.exports.readTokenHourlySnapshotEntities = (sql, entityIdArray) => sql`
SELECT 
"poolUsedForPricing",
"symbol",
"token",
"pricePerUSDNew",
"chainID",
"lastUpdatedTimestamp",
"id",
"name"
FROM "public"."TokenHourlySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetTokenHourlySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."TokenHourlySnapshot"
${sql(entityDataArray,
    "poolUsedForPricing",
    "symbol",
    "token",
    "pricePerUSDNew",
    "chainID",
    "lastUpdatedTimestamp",
    "id",
    "name"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "poolUsedForPricing" = EXCLUDED."poolUsedForPricing",
  "symbol" = EXCLUDED."symbol",
  "token" = EXCLUDED."token",
  "pricePerUSDNew" = EXCLUDED."pricePerUSDNew",
  "chainID" = EXCLUDED."chainID",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp",
  "id" = EXCLUDED."id",
  "name" = EXCLUDED."name"
  `;
}

module.exports.batchSetTokenHourlySnapshot = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetTokenHourlySnapshotCore
  );
}

module.exports.batchDeleteTokenHourlySnapshot = (sql, entityIdArray) => sql`
DELETE
FROM "public"."TokenHourlySnapshot"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for TokenHourlySnapshot

//////////////////////////////////////////////
// DB operations for TokenWeeklySnapshot:
//////////////////////////////////////////////

module.exports.readTokenWeeklySnapshotEntities = (sql, entityIdArray) => sql`
SELECT 
"chainID",
"name",
"lastUpdatedTimestamp",
"symbol",
"id",
"pricePerUSDNew",
"poolUsedForPricing",
"token"
FROM "public"."TokenWeeklySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetTokenWeeklySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."TokenWeeklySnapshot"
${sql(entityDataArray,
    "chainID",
    "name",
    "lastUpdatedTimestamp",
    "symbol",
    "id",
    "pricePerUSDNew",
    "poolUsedForPricing",
    "token"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "chainID" = EXCLUDED."chainID",
  "name" = EXCLUDED."name",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp",
  "symbol" = EXCLUDED."symbol",
  "id" = EXCLUDED."id",
  "pricePerUSDNew" = EXCLUDED."pricePerUSDNew",
  "poolUsedForPricing" = EXCLUDED."poolUsedForPricing",
  "token" = EXCLUDED."token"
  `;
}

module.exports.batchSetTokenWeeklySnapshot = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetTokenWeeklySnapshotCore
  );
}

module.exports.batchDeleteTokenWeeklySnapshot = (sql, entityIdArray) => sql`
DELETE
FROM "public"."TokenWeeklySnapshot"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for TokenWeeklySnapshot

//////////////////////////////////////////////
// DB operations for User:
//////////////////////////////////////////////

module.exports.readUserEntities = (sql, entityIdArray) => sql`
SELECT 
"joined_at_timestamp",
"id",
"numberOfSwaps"
FROM "public"."User"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetUserCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."User"
${sql(entityDataArray,
    "joined_at_timestamp",
    "id",
    "numberOfSwaps"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "joined_at_timestamp" = EXCLUDED."joined_at_timestamp",
  "id" = EXCLUDED."id",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps"
  `;
}

module.exports.batchSetUser = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetUserCore
  );
}

module.exports.batchDeleteUser = (sql, entityIdArray) => sql`
DELETE
FROM "public"."User"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for User

