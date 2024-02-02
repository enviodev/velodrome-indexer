let sql = Postgres.makeSql(~config=Config.db->Obj.magic /* TODO: make this have the correct type */)

module EventSyncState = {
  let createEventSyncStateTable: unit => promise<unit> = async () => {
    let _ = await %raw("sql`
      CREATE TABLE IF NOT EXISTS public.event_sync_state (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        transaction_index INTEGER NOT NULL,
        block_timestamp INTEGER NOT NULL,
        PRIMARY KEY (chain_id)
      );
      `")
  }

  let dropEventSyncStateTable = async () => {
    let _ = await %raw("sql`
      DROP TABLE IF EXISTS public.event_sync_state;
    `")
  }
}

module ChainMetadata = {
  let createChainMetadataTable: unit => promise<unit> = async () => {
    let _ = await %raw("sql`
      CREATE TABLE IF NOT EXISTS public.chain_metadata (
        chain_id INTEGER NOT NULL,
        start_block INTEGER NOT NULL,
        block_height INTEGER NOT NULL,
        PRIMARY KEY (chain_id)
      );
      `")
  }

  let dropChainMetadataTable = async () => {
    let _ = await %raw("sql`
      DROP TABLE IF EXISTS public.chain_metadata;
    `")
  }
}

module PersistedState = {
  let createPersistedStateTable: unit => promise<unit> = async () => {
    let _ = await %raw("sql`
      CREATE TABLE IF NOT EXISTS public.persisted_state (
        id SERIAL PRIMARY KEY,
        envio_version TEXT NOT NULL, 
        config_hash TEXT NOT NULL,
        schema_hash TEXT NOT NULL,
        handler_files_hash TEXT NOT NULL,
        abi_files_hash TEXT NOT NULL
      );
      `")
  }

  let dropPersistedStateTable = async () => {
    let _ = await %raw("sql`
      DROP TABLE IF EXISTS public.persisted_state;
    `")
  }
}

module SyncBatchMetadata = {
  let createSyncBatchTable: unit => promise<unit> = async () => {
    @warning("-21")
    let _ = await %raw("sql`
      CREATE TABLE IF NOT EXISTS public.sync_batch (
        chain_id INTEGER NOT NULL,
        block_timestamp_range_end INTEGER NOT NULL,
        block_number_range_end INTEGER NOT NULL,
        block_hash_range_end TEXT NOT NULL,
        PRIMARY KEY (chain_id, block_number_range_end)
      );
      `")
  }

  @@warning("-21")
  let dropSyncStateTable = async () => {
    let _ = await %raw("sql`
      DROP TABLE IF EXISTS public.sync_batch;
    `")
  }
  @@warning("+21")
}

module RawEventsTable = {
  let createEventTypeEnum: unit => promise<unit> = async () => {
    @warning("-21")
    let _ = await %raw("sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
          CREATE TYPE EVENT_TYPE AS ENUM(
          'Pool_Fees',
          'Pool_Swap',
          'Pool_Sync',
          'PoolFactory_PoolCreated',
          'Voter_DistributeReward',
          'Voter_GaugeCreated'
          );
        END IF;
      END $$;
      `")
  }

  let createRawEventsTable: unit => promise<unit> = async () => {
    let _ = await createEventTypeEnum()

    @warning("-21")
    let _ = await %raw("sql`
      CREATE TABLE IF NOT EXISTS public.raw_events (
        chain_id INTEGER NOT NULL,
        event_id NUMERIC NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        transaction_index INTEGER NOT NULL,
        transaction_hash TEXT NOT NULL,
        src_address TEXT NOT NULL,
        block_hash TEXT NOT NULL,
        block_timestamp INTEGER NOT NULL,
        event_type EVENT_TYPE NOT NULL,
        params JSON NOT NULL,
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (chain_id, event_id)
      );
      `")
  }

  @@warning("-21")
  let dropRawEventsTable = async () => {
    let _ = await %raw("sql`
      DROP TABLE IF EXISTS public.raw_events;
    `")
    let _ = await %raw("sql`
      DROP TYPE IF EXISTS EVENT_TYPE CASCADE;
    `")
  }
  @@warning("+21")
}

module DynamicContractRegistryTable = {
  let createDynamicContractRegistryTable: unit => promise<unit> = async () => {
    @warning("-21")
    let _ = await %raw("sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_type') THEN
          CREATE TYPE CONTRACT_TYPE AS ENUM (
          'Pool',
          'PoolFactory',
          'Voter'
          );
        END IF;
      END $$;
      `")

    @warning("-21")
    let _ = await %raw("sql`
      CREATE TABLE IF NOT EXISTS public.dynamic_contract_registry (
        chain_id INTEGER NOT NULL,
        event_id NUMERIC NOT NULL,
        contract_address TEXT NOT NULL,
        contract_type CONTRACT_TYPE NOT NULL,
        PRIMARY KEY (chain_id, contract_address)
      );
      `")
  }

  @@warning("-21")
  let dropDynamicContractRegistryTable = async () => {
    let _ = await %raw("sql`
      DROP TABLE IF EXISTS public.dynamic_contract_registry;
    `")
    let _ = await %raw("sql`
      DROP TYPE IF EXISTS EVENT_TYPE CASCADE;
    `")
  }
  @@warning("+21")
}

module EntityHistory = {
  let createEntityTypeEnum: unit => promise<unit> = async () => {
    @warning("-21")
    let _ = await %raw("sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type') THEN
          CREATE TYPE ENTITY_TYPE AS ENUM(
            'Gauge',
            'LatestETHPrice',
            'LiquidityPool',
            'LiquidityPoolDailySnapshot',
            'LiquidityPoolHourlySnapshot',
            'LiquidityPoolUserMapping',
            'LiquidityPoolWeeklySnapshot',
            'StateStore',
            'Token',
            'TokenDailySnapshot',
            'TokenHourlySnapshot',
            'TokenWeeklySnapshot',
            'User'
          );
        END IF;
      END $$;
      `")
  }

  let createEntityHistoryTable: unit => promise<unit> = async () => {
    let _ = await createEntityTypeEnum()

    // NULL for an `entity_id` means that the entity was deleted.
    await %raw("sql`
      CREATE TABLE \"public\".\"A\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        transaction_hash BYTEA NOT NULL,
        entity_type ENTITY_TYPE NOT NULL,
        entity_id TEXT,
        PRIMARY KEY (entity_id, chain_id, block_number, log_index));
      `")
  }

  // NOTE: didn't add 'delete' functions here - delete functions aren't being used currently.
}
module Gauge = {
  let createGaugeTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"Gauge\" (\"id\" text NOT NULL,\"chainID\" numeric NOT NULL,\"pool\" text NOT NULL,\"totalEmissions\" numeric NOT NULL,\"totalEmissionsUSD\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createGaugeHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"Gauge_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"chainID\" numeric NOT NULL,
        \"pool\" text NOT NULL,
        \"totalEmissions\" numeric NOT NULL,
        \"totalEmissionsUSD\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteGaugeTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"Gauge\";`")
  }
}

module LatestETHPrice = {
  let createLatestETHPriceTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"LatestETHPrice\" (\"id\" text NOT NULL,\"price\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createLatestETHPriceHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"LatestETHPrice_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"price\" numeric NOT NULL,
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteLatestETHPriceTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"LatestETHPrice\";`")
  }
}

module LiquidityPool = {
  let createLiquidityPoolTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPool\" (\"id\" text NOT NULL,\"chainID\" numeric NOT NULL,\"token0\" text NOT NULL,\"token1\" text NOT NULL,\"isStable\" boolean NOT NULL,\"reserve0\" numeric NOT NULL,\"reserve1\" numeric NOT NULL,\"totalLiquidityETH\" numeric NOT NULL,\"totalLiquidityUSD\" numeric NOT NULL,\"totalVolume0\" numeric NOT NULL,\"totalVolume1\" numeric NOT NULL,\"totalVolumeUSD\" numeric NOT NULL,\"totalFees0\" numeric NOT NULL,\"totalFees1\" numeric NOT NULL,\"totalFeesUSD\" numeric NOT NULL,\"numberOfSwaps\" numeric NOT NULL,\"token0Price\" numeric NOT NULL,\"token1Price\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createLiquidityPoolHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPool_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"chainID\" numeric NOT NULL,
        \"token0\" text NOT NULL,
        \"token1\" text NOT NULL,
        \"isStable\" boolean NOT NULL,
        \"reserve0\" numeric NOT NULL,
        \"reserve1\" numeric NOT NULL,
        \"totalLiquidityETH\" numeric NOT NULL,
        \"totalLiquidityUSD\" numeric NOT NULL,
        \"totalVolume0\" numeric NOT NULL,
        \"totalVolume1\" numeric NOT NULL,
        \"totalVolumeUSD\" numeric NOT NULL,
        \"totalFees0\" numeric NOT NULL,
        \"totalFees1\" numeric NOT NULL,
        \"totalFeesUSD\" numeric NOT NULL,
        \"numberOfSwaps\" numeric NOT NULL,
        \"token0Price\" numeric NOT NULL,
        \"token1Price\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        
        
        
        
        
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteLiquidityPoolTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"LiquidityPool\";`")
  }
}

module LiquidityPoolDailySnapshot = {
  let createLiquidityPoolDailySnapshotTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPoolDailySnapshot\" (\"id\" text NOT NULL,\"chainID\" numeric NOT NULL,\"pool\" text NOT NULL,\"reserve0\" numeric NOT NULL,\"reserve1\" numeric NOT NULL,\"totalLiquidityETH\" numeric NOT NULL,\"totalLiquidityUSD\" numeric NOT NULL,\"totalVolume0\" numeric NOT NULL,\"totalVolume1\" numeric NOT NULL,\"totalVolumeUSD\" numeric NOT NULL,\"totalFees0\" numeric NOT NULL,\"totalFees1\" numeric NOT NULL,\"totalFeesUSD\" numeric NOT NULL,\"numberOfSwaps\" numeric NOT NULL,\"token0Price\" numeric NOT NULL,\"token1Price\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createLiquidityPoolDailySnapshotHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPoolDailySnapshot_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"chainID\" numeric NOT NULL,
        \"pool\" text NOT NULL,
        \"reserve0\" numeric NOT NULL,
        \"reserve1\" numeric NOT NULL,
        \"totalLiquidityETH\" numeric NOT NULL,
        \"totalLiquidityUSD\" numeric NOT NULL,
        \"totalVolume0\" numeric NOT NULL,
        \"totalVolume1\" numeric NOT NULL,
        \"totalVolumeUSD\" numeric NOT NULL,
        \"totalFees0\" numeric NOT NULL,
        \"totalFees1\" numeric NOT NULL,
        \"totalFeesUSD\" numeric NOT NULL,
        \"numberOfSwaps\" numeric NOT NULL,
        \"token0Price\" numeric NOT NULL,
        \"token1Price\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        
        
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteLiquidityPoolDailySnapshotTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"LiquidityPoolDailySnapshot\";`")
  }
}

module LiquidityPoolHourlySnapshot = {
  let createLiquidityPoolHourlySnapshotTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPoolHourlySnapshot\" (\"id\" text NOT NULL,\"chainID\" numeric NOT NULL,\"pool\" text NOT NULL,\"reserve0\" numeric NOT NULL,\"reserve1\" numeric NOT NULL,\"totalLiquidityETH\" numeric NOT NULL,\"totalLiquidityUSD\" numeric NOT NULL,\"totalVolume0\" numeric NOT NULL,\"totalVolume1\" numeric NOT NULL,\"totalVolumeUSD\" numeric NOT NULL,\"totalFees0\" numeric NOT NULL,\"totalFees1\" numeric NOT NULL,\"totalFeesUSD\" numeric NOT NULL,\"numberOfSwaps\" numeric NOT NULL,\"token0Price\" numeric NOT NULL,\"token1Price\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createLiquidityPoolHourlySnapshotHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPoolHourlySnapshot_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"chainID\" numeric NOT NULL,
        \"pool\" text NOT NULL,
        \"reserve0\" numeric NOT NULL,
        \"reserve1\" numeric NOT NULL,
        \"totalLiquidityETH\" numeric NOT NULL,
        \"totalLiquidityUSD\" numeric NOT NULL,
        \"totalVolume0\" numeric NOT NULL,
        \"totalVolume1\" numeric NOT NULL,
        \"totalVolumeUSD\" numeric NOT NULL,
        \"totalFees0\" numeric NOT NULL,
        \"totalFees1\" numeric NOT NULL,
        \"totalFeesUSD\" numeric NOT NULL,
        \"numberOfSwaps\" numeric NOT NULL,
        \"token0Price\" numeric NOT NULL,
        \"token1Price\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        
        
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteLiquidityPoolHourlySnapshotTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"LiquidityPoolHourlySnapshot\";`")
  }
}

module LiquidityPoolUserMapping = {
  let createLiquidityPoolUserMappingTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPoolUserMapping\" (\"id\" text NOT NULL,\"liquidityPool\" text NOT NULL,\"user\" text NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createLiquidityPoolUserMappingHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPoolUserMapping_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"liquidityPool\" text NOT NULL,
        \"user\" text NOT NULL,
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteLiquidityPoolUserMappingTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"LiquidityPoolUserMapping\";`")
  }
}

module LiquidityPoolWeeklySnapshot = {
  let createLiquidityPoolWeeklySnapshotTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPoolWeeklySnapshot\" (\"id\" text NOT NULL,\"chainID\" numeric NOT NULL,\"pool\" text NOT NULL,\"reserve0\" numeric NOT NULL,\"reserve1\" numeric NOT NULL,\"totalLiquidityETH\" numeric NOT NULL,\"totalLiquidityUSD\" numeric NOT NULL,\"totalVolume0\" numeric NOT NULL,\"totalVolume1\" numeric NOT NULL,\"totalVolumeUSD\" numeric NOT NULL,\"totalFees0\" numeric NOT NULL,\"totalFees1\" numeric NOT NULL,\"totalFeesUSD\" numeric NOT NULL,\"numberOfSwaps\" numeric NOT NULL,\"token0Price\" numeric NOT NULL,\"token1Price\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createLiquidityPoolWeeklySnapshotHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"LiquidityPoolWeeklySnapshot_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"chainID\" numeric NOT NULL,
        \"pool\" text NOT NULL,
        \"reserve0\" numeric NOT NULL,
        \"reserve1\" numeric NOT NULL,
        \"totalLiquidityETH\" numeric NOT NULL,
        \"totalLiquidityUSD\" numeric NOT NULL,
        \"totalVolume0\" numeric NOT NULL,
        \"totalVolume1\" numeric NOT NULL,
        \"totalVolumeUSD\" numeric NOT NULL,
        \"totalFees0\" numeric NOT NULL,
        \"totalFees1\" numeric NOT NULL,
        \"totalFeesUSD\" numeric NOT NULL,
        \"numberOfSwaps\" numeric NOT NULL,
        \"token0Price\" numeric NOT NULL,
        \"token1Price\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        
        
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteLiquidityPoolWeeklySnapshotTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"LiquidityPoolWeeklySnapshot\";`")
  }
}

module StateStore = {
  let createStateStoreTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"StateStore\" (\"id\" text NOT NULL,\"latestEthPrice\" text NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createStateStoreHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"StateStore_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"latestEthPrice\" text NOT NULL,
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteStateStoreTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"StateStore\";`")
  }
}

module Token = {
  let createTokenTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"Token\" (\"id\" text NOT NULL,\"chainID\" numeric NOT NULL,\"pricePerETH\" numeric NOT NULL,\"pricePerUSD\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createTokenHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"Token_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"chainID\" numeric NOT NULL,
        \"pricePerETH\" numeric NOT NULL,
        \"pricePerUSD\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        
        
        
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteTokenTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"Token\";`")
  }
}

module TokenDailySnapshot = {
  let createTokenDailySnapshotTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"TokenDailySnapshot\" (\"id\" text NOT NULL,\"chainID\" numeric NOT NULL,\"token\" text NOT NULL,\"pricePerETH\" numeric NOT NULL,\"pricePerUSD\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createTokenDailySnapshotHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"TokenDailySnapshot_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"chainID\" numeric NOT NULL,
        \"token\" text NOT NULL,
        \"pricePerETH\" numeric NOT NULL,
        \"pricePerUSD\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteTokenDailySnapshotTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"TokenDailySnapshot\";`")
  }
}

module TokenHourlySnapshot = {
  let createTokenHourlySnapshotTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"TokenHourlySnapshot\" (\"id\" text NOT NULL,\"chainID\" numeric NOT NULL,\"token\" text NOT NULL,\"pricePerETH\" numeric NOT NULL,\"pricePerUSD\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createTokenHourlySnapshotHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"TokenHourlySnapshot_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"chainID\" numeric NOT NULL,
        \"token\" text NOT NULL,
        \"pricePerETH\" numeric NOT NULL,
        \"pricePerUSD\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteTokenHourlySnapshotTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"TokenHourlySnapshot\";`")
  }
}

module TokenWeeklySnapshot = {
  let createTokenWeeklySnapshotTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"TokenWeeklySnapshot\" (\"id\" text NOT NULL,\"chainID\" numeric NOT NULL,\"token\" text NOT NULL,\"pricePerETH\" numeric NOT NULL,\"pricePerUSD\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createTokenWeeklySnapshotHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"TokenWeeklySnapshot_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"chainID\" numeric NOT NULL,
        \"token\" text NOT NULL,
        \"pricePerETH\" numeric NOT NULL,
        \"pricePerUSD\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteTokenWeeklySnapshotTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"TokenWeeklySnapshot\";`")
  }
}

module User = {
  let createUserTable: unit => promise<unit> = async () => {
    await %raw("sql`
      CREATE TABLE \"public\".\"User\" (\"id\" text NOT NULL,\"numberOfSwaps\" numeric NOT NULL,\"totalSwapVolumeUSD\" numeric NOT NULL,\"lastUpdatedTimestamp\" numeric NOT NULL, 
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\"));`")
  }

  let createUserHistoryTable: unit => promise<unit> = async () => {
    // Rather using chain_id + log_index + block_number and not also "transaction_hash TEXT NOT NULL"
    await %raw("sql`
      CREATE TABLE \"public\".\"User_history\" (
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        \"id\" text NOT NULL,
        \"numberOfSwaps\" numeric NOT NULL,
        \"totalSwapVolumeUSD\" numeric NOT NULL,
        \"lastUpdatedTimestamp\" numeric NOT NULL,
        
        db_write_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (\"id\", chain_id, block_number, log_index));`")
  }

  let deleteUserTable: unit => promise<unit> = async () => {
    // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).
    await %raw("sql`DROP TABLE IF EXISTS \"public\".\"User\";`")
  }
}

let deleteAllTables: unit => promise<unit> = async () => {
  Logging.trace("Dropping all tables")
  // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).

  @warning("-21")
  await (
    %raw(
      "sql.unsafe`DROP SCHEMA public CASCADE;CREATE SCHEMA public;GRANT ALL ON SCHEMA public TO postgres;GRANT ALL ON SCHEMA public TO public;`"
    )
  )
}

let deleteAllTablesExceptRawEventsAndDynamicContractRegistry: unit => promise<unit> = async () => {
  // NOTE: we can refine the `IF EXISTS` part because this now prints to the terminal if the table doesn't exist (which isn't nice for the developer).

  @warning("-21")
  await (
    %raw("sql.unsafe`
    DO $$ 
    DECLARE
        table_name_var text;
    BEGIN
        FOR table_name_var IN (SELECT table_name
                           FROM information_schema.tables
                           WHERE table_schema = 'public'
                           AND table_name != 'raw_events'
                           AND table_name != 'dynamic_contract_registry') 
        LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || table_name_var || ' CASCADE';
        END LOOP;
    END $$;
  `")
  )
}

type t
@module external process: t = "process"

type exitCode = Success | Failure
@send external exit: (t, exitCode) => unit = "exit"

// TODO: all the migration steps should run as a single transaction
let runUpMigrations = async (~shouldExit) => {
  let exitCode = ref(Success)
  await PersistedState.createPersistedStateTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE800: Error creating persisted_state table`)->Promise.resolve
  })

  await EventSyncState.createEventSyncStateTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE800: Error creating event_sync_state table`)->Promise.resolve
  })
  await ChainMetadata.createChainMetadataTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE800: Error creating chain_metadata table`)->Promise.resolve
  })
  await SyncBatchMetadata.createSyncBatchTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE800: Error creating sync_batch table`)->Promise.resolve
  })
  await RawEventsTable.createRawEventsTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE800: Error creating raw_events table`)->Promise.resolve
  })
  await DynamicContractRegistryTable.createDynamicContractRegistryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE801: Error creating dynamic_contracts table`)->Promise.resolve
  })
  // TODO: catch and handle query errors
  await Gauge.createGaugeTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating Gauge table`)->Promise.resolve
  })
  await Gauge.createGaugeHistoryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating Gauge entity history table`)->Promise.resolve
  })
  await LatestETHPrice.createLatestETHPriceTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating LatestETHPrice table`)->Promise.resolve
  })
  await LatestETHPrice.createLatestETHPriceHistoryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating LatestETHPrice entity history table`,
    )->Promise.resolve
  })
  await LiquidityPool.createLiquidityPoolTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating LiquidityPool table`)->Promise.resolve
  })
  await LiquidityPool.createLiquidityPoolHistoryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating LiquidityPool entity history table`,
    )->Promise.resolve
  })
  await LiquidityPoolDailySnapshot.createLiquidityPoolDailySnapshotTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating LiquidityPoolDailySnapshot table`,
    )->Promise.resolve
  })
  await LiquidityPoolDailySnapshot.createLiquidityPoolDailySnapshotHistoryTable()->Promise.catch(
    err => {
      exitCode := Failure
      Logging.errorWithExn(
        err,
        `EE802: Error creating LiquidityPoolDailySnapshot entity history table`,
      )->Promise.resolve
    },
  )
  await LiquidityPoolHourlySnapshot.createLiquidityPoolHourlySnapshotTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating LiquidityPoolHourlySnapshot table`,
    )->Promise.resolve
  })
  await LiquidityPoolHourlySnapshot.createLiquidityPoolHourlySnapshotHistoryTable()->Promise.catch(
    err => {
      exitCode := Failure
      Logging.errorWithExn(
        err,
        `EE802: Error creating LiquidityPoolHourlySnapshot entity history table`,
      )->Promise.resolve
    },
  )
  await LiquidityPoolUserMapping.createLiquidityPoolUserMappingTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating LiquidityPoolUserMapping table`,
    )->Promise.resolve
  })
  await LiquidityPoolUserMapping.createLiquidityPoolUserMappingHistoryTable()->Promise.catch(
    err => {
      exitCode := Failure
      Logging.errorWithExn(
        err,
        `EE802: Error creating LiquidityPoolUserMapping entity history table`,
      )->Promise.resolve
    },
  )
  await LiquidityPoolWeeklySnapshot.createLiquidityPoolWeeklySnapshotTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating LiquidityPoolWeeklySnapshot table`,
    )->Promise.resolve
  })
  await LiquidityPoolWeeklySnapshot.createLiquidityPoolWeeklySnapshotHistoryTable()->Promise.catch(
    err => {
      exitCode := Failure
      Logging.errorWithExn(
        err,
        `EE802: Error creating LiquidityPoolWeeklySnapshot entity history table`,
      )->Promise.resolve
    },
  )
  await StateStore.createStateStoreTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating StateStore table`)->Promise.resolve
  })
  await StateStore.createStateStoreHistoryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating StateStore entity history table`,
    )->Promise.resolve
  })
  await Token.createTokenTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating Token table`)->Promise.resolve
  })
  await Token.createTokenHistoryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating Token entity history table`)->Promise.resolve
  })
  await TokenDailySnapshot.createTokenDailySnapshotTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating TokenDailySnapshot table`)->Promise.resolve
  })
  await TokenDailySnapshot.createTokenDailySnapshotHistoryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating TokenDailySnapshot entity history table`,
    )->Promise.resolve
  })
  await TokenHourlySnapshot.createTokenHourlySnapshotTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating TokenHourlySnapshot table`)->Promise.resolve
  })
  await TokenHourlySnapshot.createTokenHourlySnapshotHistoryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating TokenHourlySnapshot entity history table`,
    )->Promise.resolve
  })
  await TokenWeeklySnapshot.createTokenWeeklySnapshotTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating TokenWeeklySnapshot table`)->Promise.resolve
  })
  await TokenWeeklySnapshot.createTokenWeeklySnapshotHistoryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(
      err,
      `EE802: Error creating TokenWeeklySnapshot entity history table`,
    )->Promise.resolve
  })
  await User.createUserTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating User table`)->Promise.resolve
  })
  await User.createUserHistoryTable()->Promise.catch(err => {
    exitCode := Failure
    Logging.errorWithExn(err, `EE802: Error creating User entity history table`)->Promise.resolve
  })
  await TrackTables.trackAllTables()->Promise.catch(err => {
    Logging.errorWithExn(err, `EE803: Error tracking tables`)->Promise.resolve
  })
  if shouldExit {
    process->exit(exitCode.contents)
  }
  exitCode.contents
}

let runDownMigrations = async (~shouldExit, ~shouldDropRawEvents) => {
  let exitCode = ref(Success)

  //
  // await Gauge.deleteGaugeTable()
  //
  // await LatestETHPrice.deleteLatestETHPriceTable()
  //
  // await LiquidityPool.deleteLiquidityPoolTable()
  //
  // await LiquidityPoolDailySnapshot.deleteLiquidityPoolDailySnapshotTable()
  //
  // await LiquidityPoolHourlySnapshot.deleteLiquidityPoolHourlySnapshotTable()
  //
  // await LiquidityPoolUserMapping.deleteLiquidityPoolUserMappingTable()
  //
  // await LiquidityPoolWeeklySnapshot.deleteLiquidityPoolWeeklySnapshotTable()
  //
  // await StateStore.deleteStateStoreTable()
  //
  // await Token.deleteTokenTable()
  //
  // await TokenDailySnapshot.deleteTokenDailySnapshotTable()
  //
  // await TokenHourlySnapshot.deleteTokenHourlySnapshotTable()
  //
  // await TokenWeeklySnapshot.deleteTokenWeeklySnapshotTable()
  //
  // await User.deleteUserTable()
  //

  // NOTE: For now delete any remaining tables.
  if shouldDropRawEvents {
    await deleteAllTables()->Promise.catch(err => {
      exitCode := Failure
      Logging.errorWithExn(err, "EE804: Error dropping entity tables")->Promise.resolve
    })
  } else {
    await deleteAllTablesExceptRawEventsAndDynamicContractRegistry()->Promise.catch(err => {
      exitCode := Failure
      Logging.errorWithExn(
        err,
        "EE805: Error dropping entity tables except for raw events",
      )->Promise.resolve
    })
  }
  if shouldExit {
    process->exit(exitCode.contents)
  }
  exitCode.contents
}

let setupDb = async (~shouldDropRawEvents) => {
  Logging.info("Provisioning Database")
  // TODO: we should make a hash of the schema file (that gets stored in the DB) and either drop the tables and create new ones or keep this migration.
  //       for now we always run the down migration.
  // if (process.env.MIGRATE === "force" || hash_of_schema_file !== hash_of_current_schema)
  let exitCodeDown = await runDownMigrations(~shouldExit=false, ~shouldDropRawEvents)
  // else
  //   await clearDb()

  let exitCodeUp = await runUpMigrations(~shouldExit=false)

  let exitCode = switch (exitCodeDown, exitCodeUp) {
  | (Success, Success) => Success
  | _ => Failure
  }

  process->exit(exitCode)
}
