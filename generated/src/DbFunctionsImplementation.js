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
// DB operations for Gauge:
//////////////////////////////////////////////

module.exports.readGaugeEntities = (sql, entityIdArray) => sql`
SELECT 
"id",
"chainID",
"pool",
"totalEmissions",
"totalEmissionsUSD",
"lastUpdatedTimestamp"
FROM "public"."Gauge"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetGaugeCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."Gauge"
${sql(entityDataArray,
    "id",
    "chainID",
    "pool",
    "totalEmissions",
    "totalEmissionsUSD",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "chainID" = EXCLUDED."chainID",
  "pool" = EXCLUDED."pool",
  "totalEmissions" = EXCLUDED."totalEmissions",
  "totalEmissionsUSD" = EXCLUDED."totalEmissionsUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
  `;
}

module.exports.batchSetGauge = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetGaugeCore
  );
}

module.exports.batchDeleteGauge = (sql, entityIdArray) => sql`
DELETE
FROM "public"."Gauge"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for Gauge

//////////////////////////////////////////////
// DB operations for LatestETHPrice:
//////////////////////////////////////////////

module.exports.readLatestETHPriceEntities = (sql, entityIdArray) => sql`
SELECT 
"id",
"price"
FROM "public"."LatestETHPrice"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLatestETHPriceCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LatestETHPrice"
${sql(entityDataArray,
    "id",
    "price"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "price" = EXCLUDED."price"
  `;
}

module.exports.batchSetLatestETHPrice = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetLatestETHPriceCore
  );
}

module.exports.batchDeleteLatestETHPrice = (sql, entityIdArray) => sql`
DELETE
FROM "public"."LatestETHPrice"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for LatestETHPrice

//////////////////////////////////////////////
// DB operations for LiquidityPool:
//////////////////////////////////////////////

module.exports.readLiquidityPoolEntities = (sql, entityIdArray) => sql`
SELECT 
"id",
"chainID",
"token0",
"token1",
"isStable",
"reserve0",
"reserve1",
"totalLiquidityETH",
"totalLiquidityUSD",
"totalVolume0",
"totalVolume1",
"totalVolumeUSD",
"totalFees0",
"totalFees1",
"totalFeesUSD",
"numberOfSwaps",
"token0Price",
"token1Price",
"lastUpdatedTimestamp"
FROM "public"."LiquidityPool"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLiquidityPoolCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LiquidityPool"
${sql(entityDataArray,
    "id",
    "chainID",
    "token0",
    "token1",
    "isStable",
    "reserve0",
    "reserve1",
    "totalLiquidityETH",
    "totalLiquidityUSD",
    "totalVolume0",
    "totalVolume1",
    "totalVolumeUSD",
    "totalFees0",
    "totalFees1",
    "totalFeesUSD",
    "numberOfSwaps",
    "token0Price",
    "token1Price",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "chainID" = EXCLUDED."chainID",
  "token0" = EXCLUDED."token0",
  "token1" = EXCLUDED."token1",
  "isStable" = EXCLUDED."isStable",
  "reserve0" = EXCLUDED."reserve0",
  "reserve1" = EXCLUDED."reserve1",
  "totalLiquidityETH" = EXCLUDED."totalLiquidityETH",
  "totalLiquidityUSD" = EXCLUDED."totalLiquidityUSD",
  "totalVolume0" = EXCLUDED."totalVolume0",
  "totalVolume1" = EXCLUDED."totalVolume1",
  "totalVolumeUSD" = EXCLUDED."totalVolumeUSD",
  "totalFees0" = EXCLUDED."totalFees0",
  "totalFees1" = EXCLUDED."totalFees1",
  "totalFeesUSD" = EXCLUDED."totalFeesUSD",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps",
  "token0Price" = EXCLUDED."token0Price",
  "token1Price" = EXCLUDED."token1Price",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
  `;
}

module.exports.batchSetLiquidityPool = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetLiquidityPoolCore
  );
}

module.exports.batchDeleteLiquidityPool = (sql, entityIdArray) => sql`
DELETE
FROM "public"."LiquidityPool"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for LiquidityPool

//////////////////////////////////////////////
// DB operations for LiquidityPoolDailySnapshot:
//////////////////////////////////////////////

module.exports.readLiquidityPoolDailySnapshotEntities = (sql, entityIdArray) => sql`
SELECT 
"id",
"chainID",
"pool",
"reserve0",
"reserve1",
"totalLiquidityETH",
"totalLiquidityUSD",
"totalVolume0",
"totalVolume1",
"totalVolumeUSD",
"totalFees0",
"totalFees1",
"totalFeesUSD",
"numberOfSwaps",
"token0Price",
"token1Price",
"lastUpdatedTimestamp"
FROM "public"."LiquidityPoolDailySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLiquidityPoolDailySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LiquidityPoolDailySnapshot"
${sql(entityDataArray,
    "id",
    "chainID",
    "pool",
    "reserve0",
    "reserve1",
    "totalLiquidityETH",
    "totalLiquidityUSD",
    "totalVolume0",
    "totalVolume1",
    "totalVolumeUSD",
    "totalFees0",
    "totalFees1",
    "totalFeesUSD",
    "numberOfSwaps",
    "token0Price",
    "token1Price",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "chainID" = EXCLUDED."chainID",
  "pool" = EXCLUDED."pool",
  "reserve0" = EXCLUDED."reserve0",
  "reserve1" = EXCLUDED."reserve1",
  "totalLiquidityETH" = EXCLUDED."totalLiquidityETH",
  "totalLiquidityUSD" = EXCLUDED."totalLiquidityUSD",
  "totalVolume0" = EXCLUDED."totalVolume0",
  "totalVolume1" = EXCLUDED."totalVolume1",
  "totalVolumeUSD" = EXCLUDED."totalVolumeUSD",
  "totalFees0" = EXCLUDED."totalFees0",
  "totalFees1" = EXCLUDED."totalFees1",
  "totalFeesUSD" = EXCLUDED."totalFeesUSD",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps",
  "token0Price" = EXCLUDED."token0Price",
  "token1Price" = EXCLUDED."token1Price",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
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
"id",
"chainID",
"pool",
"reserve0",
"reserve1",
"totalLiquidityETH",
"totalLiquidityUSD",
"totalVolume0",
"totalVolume1",
"totalVolumeUSD",
"totalFees0",
"totalFees1",
"totalFeesUSD",
"numberOfSwaps",
"token0Price",
"token1Price",
"lastUpdatedTimestamp"
FROM "public"."LiquidityPoolHourlySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLiquidityPoolHourlySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LiquidityPoolHourlySnapshot"
${sql(entityDataArray,
    "id",
    "chainID",
    "pool",
    "reserve0",
    "reserve1",
    "totalLiquidityETH",
    "totalLiquidityUSD",
    "totalVolume0",
    "totalVolume1",
    "totalVolumeUSD",
    "totalFees0",
    "totalFees1",
    "totalFeesUSD",
    "numberOfSwaps",
    "token0Price",
    "token1Price",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "chainID" = EXCLUDED."chainID",
  "pool" = EXCLUDED."pool",
  "reserve0" = EXCLUDED."reserve0",
  "reserve1" = EXCLUDED."reserve1",
  "totalLiquidityETH" = EXCLUDED."totalLiquidityETH",
  "totalLiquidityUSD" = EXCLUDED."totalLiquidityUSD",
  "totalVolume0" = EXCLUDED."totalVolume0",
  "totalVolume1" = EXCLUDED."totalVolume1",
  "totalVolumeUSD" = EXCLUDED."totalVolumeUSD",
  "totalFees0" = EXCLUDED."totalFees0",
  "totalFees1" = EXCLUDED."totalFees1",
  "totalFeesUSD" = EXCLUDED."totalFeesUSD",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps",
  "token0Price" = EXCLUDED."token0Price",
  "token1Price" = EXCLUDED."token1Price",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
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
// DB operations for LiquidityPoolUserMapping:
//////////////////////////////////////////////

module.exports.readLiquidityPoolUserMappingEntities = (sql, entityIdArray) => sql`
SELECT 
"id",
"liquidityPool",
"user"
FROM "public"."LiquidityPoolUserMapping"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLiquidityPoolUserMappingCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LiquidityPoolUserMapping"
${sql(entityDataArray,
    "id",
    "liquidityPool",
    "user"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "liquidityPool" = EXCLUDED."liquidityPool",
  "user" = EXCLUDED."user"
  `;
}

module.exports.batchSetLiquidityPoolUserMapping = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetLiquidityPoolUserMappingCore
  );
}

module.exports.batchDeleteLiquidityPoolUserMapping = (sql, entityIdArray) => sql`
DELETE
FROM "public"."LiquidityPoolUserMapping"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for LiquidityPoolUserMapping

//////////////////////////////////////////////
// DB operations for LiquidityPoolWeeklySnapshot:
//////////////////////////////////////////////

module.exports.readLiquidityPoolWeeklySnapshotEntities = (sql, entityIdArray) => sql`
SELECT 
"id",
"chainID",
"pool",
"reserve0",
"reserve1",
"totalLiquidityETH",
"totalLiquidityUSD",
"totalVolume0",
"totalVolume1",
"totalVolumeUSD",
"totalFees0",
"totalFees1",
"totalFeesUSD",
"numberOfSwaps",
"token0Price",
"token1Price",
"lastUpdatedTimestamp"
FROM "public"."LiquidityPoolWeeklySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetLiquidityPoolWeeklySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."LiquidityPoolWeeklySnapshot"
${sql(entityDataArray,
    "id",
    "chainID",
    "pool",
    "reserve0",
    "reserve1",
    "totalLiquidityETH",
    "totalLiquidityUSD",
    "totalVolume0",
    "totalVolume1",
    "totalVolumeUSD",
    "totalFees0",
    "totalFees1",
    "totalFeesUSD",
    "numberOfSwaps",
    "token0Price",
    "token1Price",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "chainID" = EXCLUDED."chainID",
  "pool" = EXCLUDED."pool",
  "reserve0" = EXCLUDED."reserve0",
  "reserve1" = EXCLUDED."reserve1",
  "totalLiquidityETH" = EXCLUDED."totalLiquidityETH",
  "totalLiquidityUSD" = EXCLUDED."totalLiquidityUSD",
  "totalVolume0" = EXCLUDED."totalVolume0",
  "totalVolume1" = EXCLUDED."totalVolume1",
  "totalVolumeUSD" = EXCLUDED."totalVolumeUSD",
  "totalFees0" = EXCLUDED."totalFees0",
  "totalFees1" = EXCLUDED."totalFees1",
  "totalFeesUSD" = EXCLUDED."totalFeesUSD",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps",
  "token0Price" = EXCLUDED."token0Price",
  "token1Price" = EXCLUDED."token1Price",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
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
// DB operations for StateStore:
//////////////////////////////////////////////

module.exports.readStateStoreEntities = (sql, entityIdArray) => sql`
SELECT 
"id",
"latestEthPrice"
FROM "public"."StateStore"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetStateStoreCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."StateStore"
${sql(entityDataArray,
    "id",
    "latestEthPrice"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "latestEthPrice" = EXCLUDED."latestEthPrice"
  `;
}

module.exports.batchSetStateStore = (sql, entityDataArray) => {

  return chunkBatchQuery(
    sql, 
    entityDataArray, 
    batchSetStateStoreCore
  );
}

module.exports.batchDeleteStateStore = (sql, entityIdArray) => sql`
DELETE
FROM "public"."StateStore"
WHERE id IN ${sql(entityIdArray)};`
// end db operations for StateStore

//////////////////////////////////////////////
// DB operations for Token:
//////////////////////////////////////////////

module.exports.readTokenEntities = (sql, entityIdArray) => sql`
SELECT 
"id",
"chainID",
"pricePerETH",
"pricePerUSD",
"lastUpdatedTimestamp"
FROM "public"."Token"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetTokenCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."Token"
${sql(entityDataArray,
    "id",
    "chainID",
    "pricePerETH",
    "pricePerUSD",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "chainID" = EXCLUDED."chainID",
  "pricePerETH" = EXCLUDED."pricePerETH",
  "pricePerUSD" = EXCLUDED."pricePerUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
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
"id",
"chainID",
"token",
"pricePerETH",
"pricePerUSD",
"lastUpdatedTimestamp"
FROM "public"."TokenDailySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetTokenDailySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."TokenDailySnapshot"
${sql(entityDataArray,
    "id",
    "chainID",
    "token",
    "pricePerETH",
    "pricePerUSD",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "chainID" = EXCLUDED."chainID",
  "token" = EXCLUDED."token",
  "pricePerETH" = EXCLUDED."pricePerETH",
  "pricePerUSD" = EXCLUDED."pricePerUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
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
"id",
"chainID",
"token",
"pricePerETH",
"pricePerUSD",
"lastUpdatedTimestamp"
FROM "public"."TokenHourlySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetTokenHourlySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."TokenHourlySnapshot"
${sql(entityDataArray,
    "id",
    "chainID",
    "token",
    "pricePerETH",
    "pricePerUSD",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "chainID" = EXCLUDED."chainID",
  "token" = EXCLUDED."token",
  "pricePerETH" = EXCLUDED."pricePerETH",
  "pricePerUSD" = EXCLUDED."pricePerUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
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
"id",
"chainID",
"token",
"pricePerETH",
"pricePerUSD",
"lastUpdatedTimestamp"
FROM "public"."TokenWeeklySnapshot"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetTokenWeeklySnapshotCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."TokenWeeklySnapshot"
${sql(entityDataArray,
    "id",
    "chainID",
    "token",
    "pricePerETH",
    "pricePerUSD",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "chainID" = EXCLUDED."chainID",
  "token" = EXCLUDED."token",
  "pricePerETH" = EXCLUDED."pricePerETH",
  "pricePerUSD" = EXCLUDED."pricePerUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
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
"id",
"numberOfSwaps",
"totalSwapVolumeUSD",
"lastUpdatedTimestamp"
FROM "public"."User"
WHERE id IN ${sql(entityIdArray)};`;

const batchSetUserCore = (sql, entityDataArray) => {
  return sql`
    INSERT INTO "public"."User"
${sql(entityDataArray,
    "id",
    "numberOfSwaps",
    "totalSwapVolumeUSD",
    "lastUpdatedTimestamp"
  )}
  ON CONFLICT(id) DO UPDATE
  SET
  "id" = EXCLUDED."id",
  "numberOfSwaps" = EXCLUDED."numberOfSwaps",
  "totalSwapVolumeUSD" = EXCLUDED."totalSwapVolumeUSD",
  "lastUpdatedTimestamp" = EXCLUDED."lastUpdatedTimestamp"
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

