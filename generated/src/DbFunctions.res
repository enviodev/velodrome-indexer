let config: Postgres.poolConfig = {
  ...Config.db,
  transform: {undefined: Js.null},
}
let sql = Postgres.makeSql(~config)

type chainId = int
type eventId = string
type blockNumberRow = {@as("block_number") blockNumber: int}

module ChainMetadata = {
  type chainMetadata = {
    @as("chain_id") chainId: int,
    @as("block_height") blockHeight: int,
    @as("start_block") startBlock: int,
  }

  @module("./DbFunctionsImplementation.js")
  external setChainMetadata: (Postgres.sql, chainMetadata) => promise<unit> = "setChainMetadata"

  let setChainMetadataRow = (~chainId, ~startBlock, ~blockHeight) => {
    sql->setChainMetadata({chainId, startBlock, blockHeight})
  }
}

module EventSyncState = {
  @genType
  type eventSyncState = {
    @as("chain_id") chainId: int,
    @as("block_number") blockNumber: int,
    @as("log_index") logIndex: int,
    @as("transaction_index") transactionIndex: int,
    @as("block_timestamp") blockTimestamp: int,
  }
  @module("./DbFunctionsImplementation.js")
  external readLatestSyncedEventOnChainIdArr: (
    Postgres.sql,
    ~chainId: int,
  ) => promise<array<eventSyncState>> = "readLatestSyncedEventOnChainId"

  let readLatestSyncedEventOnChainId = async (sql, ~chainId) => {
    let arr = await sql->readLatestSyncedEventOnChainIdArr(~chainId)
    arr->Belt.Array.get(0)
  }

  let getLatestProcessedBlockNumber = async (~chainId) => {
    let latestEventOpt = await sql->readLatestSyncedEventOnChainId(~chainId)
    latestEventOpt->Belt.Option.map(event => event.blockNumber)
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<eventSyncState>) => promise<unit> =
    "batchSetEventSyncState"
}

module RawEvents = {
  type rawEventRowId = (chainId, eventId)
  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Types.rawEventsEntity>) => promise<unit> =
    "batchSetRawEvents"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<rawEventRowId>) => promise<unit> =
    "batchDeleteRawEvents"

  @module("./DbFunctionsImplementation.js")
  external readEntities: (
    Postgres.sql,
    array<rawEventRowId>,
  ) => promise<array<Types.rawEventsEntity>> = "readRawEventsEntities"

  @module("./DbFunctionsImplementation.js")
  external getRawEventsPageGtOrEqEventId: (
    Postgres.sql,
    ~chainId: chainId,
    ~eventId: Ethers.BigInt.t,
    ~limit: int,
    ~contractAddresses: array<Ethers.ethAddress>,
  ) => promise<array<Types.rawEventsEntity>> = "getRawEventsPageGtOrEqEventId"

  @module("./DbFunctionsImplementation.js")
  external getRawEventsPageWithinEventIdRangeInclusive: (
    Postgres.sql,
    ~chainId: chainId,
    ~fromEventIdInclusive: Ethers.BigInt.t,
    ~toEventIdInclusive: Ethers.BigInt.t,
    ~limit: int,
    ~contractAddresses: array<Ethers.ethAddress>,
  ) => promise<array<Types.rawEventsEntity>> = "getRawEventsPageWithinEventIdRangeInclusive"

  ///Returns an array with 1 block number (the highest processed on the given chainId)
  @module("./DbFunctionsImplementation.js")
  external readLatestRawEventsBlockNumberProcessedOnChainId: (
    Postgres.sql,
    chainId,
  ) => promise<array<blockNumberRow>> = "readLatestRawEventsBlockNumberProcessedOnChainId"

  let getLatestProcessedBlockNumber = async (~chainId) => {
    let row = await sql->readLatestRawEventsBlockNumberProcessedOnChainId(chainId)

    row->Belt.Array.get(0)->Belt.Option.map(row => row.blockNumber)
  }
}

module DynamicContractRegistry = {
  type contractAddress = Ethers.ethAddress
  type dynamicContractRegistryRowId = (chainId, contractAddress)
  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Types.dynamicContractRegistryEntity>) => promise<unit> =
    "batchSetDynamicContractRegistry"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<dynamicContractRegistryRowId>) => promise<unit> =
    "batchDeleteDynamicContractRegistry"

  @module("./DbFunctionsImplementation.js")
  external readEntities: (
    Postgres.sql,
    array<dynamicContractRegistryRowId>,
  ) => promise<array<Types.dynamicContractRegistryEntity>> = "readDynamicContractRegistryEntities"

  type contractTypeAndAddress = {
    @as("contract_address") contractAddress: Ethers.ethAddress,
    @as("contract_type") contractType: string,
    @as("event_id") eventId: Ethers.BigInt.t,
  }

  ///Returns an array with 1 block number (the highest processed on the given chainId)
  @module("./DbFunctionsImplementation.js")
  external readDynamicContractsOnChainIdAtOrBeforeBlock: (
    Postgres.sql,
    ~chainId: chainId,
    ~startBlock: int,
  ) => promise<array<contractTypeAndAddress>> = "readDynamicContractsOnChainIdAtOrBeforeBlock"
}

type entityHistoryItem = {
  chain_id: int,
  previous_block_number: option<int>,
  previous_log_index: option<int>,
  block_number: int,
  log_index: int,
  transaction_hash: string,
  entity_type: string,
  entity_id: string,
  params: option<string>,
}

module EntityHistory = {
  @module("./DbFunctionsImplementation.js")
  external batchSet: (
    Postgres.sql,
    ~withPrev: array<entityHistoryItem>,
    ~withoutPrev: array<entityHistoryItem>,
  ) => promise<unit> = "batchSetEntityHistoryTable"
}

module LiquidityPoolDailySnapshot = {
  open Types

  let decodeUnsafe = (entityJson: Js.Json.t): liquidityPoolDailySnapshotEntity => {
    let entityDecoded = switch entityJson->liquidityPoolDailySnapshotEntity_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity liquidityPoolDailySnapshot using spice",
        "raw_unparsed_object": entityJson,
      })
      Error(e)
    }->Belt.Result.getExn

    entityDecoded
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Js.Json.t>) => promise<unit> =
    "batchSetLiquidityPoolDailySnapshot"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<Types.id>) => promise<unit> =
    "batchDeleteLiquidityPoolDailySnapshot"

  @module("./DbFunctionsImplementation.js")
  external readEntitiesFromDb: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readLiquidityPoolDailySnapshotEntities"

  let readEntities = async (sql: Postgres.sql, ids: array<Types.id>): array<
    liquidityPoolDailySnapshotEntity,
  > => {
    let res = await readEntitiesFromDb(sql, ids)
    res->Belt.Array.map(entityJson => entityJson->decodeUnsafe)
  }
}
module LiquidityPoolHourlySnapshot = {
  open Types

  let decodeUnsafe = (entityJson: Js.Json.t): liquidityPoolHourlySnapshotEntity => {
    let entityDecoded = switch entityJson->liquidityPoolHourlySnapshotEntity_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity liquidityPoolHourlySnapshot using spice",
        "raw_unparsed_object": entityJson,
      })
      Error(e)
    }->Belt.Result.getExn

    entityDecoded
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Js.Json.t>) => promise<unit> =
    "batchSetLiquidityPoolHourlySnapshot"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<Types.id>) => promise<unit> =
    "batchDeleteLiquidityPoolHourlySnapshot"

  @module("./DbFunctionsImplementation.js")
  external readEntitiesFromDb: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readLiquidityPoolHourlySnapshotEntities"

  let readEntities = async (sql: Postgres.sql, ids: array<Types.id>): array<
    liquidityPoolHourlySnapshotEntity,
  > => {
    let res = await readEntitiesFromDb(sql, ids)
    res->Belt.Array.map(entityJson => entityJson->decodeUnsafe)
  }
}
module LiquidityPoolNew = {
  open Types

  let decodeUnsafe = (entityJson: Js.Json.t): liquidityPoolNewEntity => {
    let entityDecoded = switch entityJson->liquidityPoolNewEntity_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity liquidityPoolNew using spice",
        "raw_unparsed_object": entityJson,
      })
      Error(e)
    }->Belt.Result.getExn

    entityDecoded
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Js.Json.t>) => promise<unit> = "batchSetLiquidityPoolNew"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<Types.id>) => promise<unit> =
    "batchDeleteLiquidityPoolNew"

  @module("./DbFunctionsImplementation.js")
  external readEntitiesFromDb: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readLiquidityPoolNewEntities"

  let readEntities = async (sql: Postgres.sql, ids: array<Types.id>): array<
    liquidityPoolNewEntity,
  > => {
    let res = await readEntitiesFromDb(sql, ids)
    res->Belt.Array.map(entityJson => entityJson->decodeUnsafe)
  }
}
module LiquidityPoolWeeklySnapshot = {
  open Types

  let decodeUnsafe = (entityJson: Js.Json.t): liquidityPoolWeeklySnapshotEntity => {
    let entityDecoded = switch entityJson->liquidityPoolWeeklySnapshotEntity_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity liquidityPoolWeeklySnapshot using spice",
        "raw_unparsed_object": entityJson,
      })
      Error(e)
    }->Belt.Result.getExn

    entityDecoded
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Js.Json.t>) => promise<unit> =
    "batchSetLiquidityPoolWeeklySnapshot"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<Types.id>) => promise<unit> =
    "batchDeleteLiquidityPoolWeeklySnapshot"

  @module("./DbFunctionsImplementation.js")
  external readEntitiesFromDb: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readLiquidityPoolWeeklySnapshotEntities"

  let readEntities = async (sql: Postgres.sql, ids: array<Types.id>): array<
    liquidityPoolWeeklySnapshotEntity,
  > => {
    let res = await readEntitiesFromDb(sql, ids)
    res->Belt.Array.map(entityJson => entityJson->decodeUnsafe)
  }
}
module Token = {
  open Types

  let decodeUnsafe = (entityJson: Js.Json.t): tokenEntity => {
    let entityDecoded = switch entityJson->tokenEntity_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity token using spice",
        "raw_unparsed_object": entityJson,
      })
      Error(e)
    }->Belt.Result.getExn

    entityDecoded
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Js.Json.t>) => promise<unit> = "batchSetToken"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<Types.id>) => promise<unit> = "batchDeleteToken"

  @module("./DbFunctionsImplementation.js")
  external readEntitiesFromDb: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readTokenEntities"

  let readEntities = async (sql: Postgres.sql, ids: array<Types.id>): array<tokenEntity> => {
    let res = await readEntitiesFromDb(sql, ids)
    res->Belt.Array.map(entityJson => entityJson->decodeUnsafe)
  }
}
module TokenDailySnapshot = {
  open Types

  let decodeUnsafe = (entityJson: Js.Json.t): tokenDailySnapshotEntity => {
    let entityDecoded = switch entityJson->tokenDailySnapshotEntity_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity tokenDailySnapshot using spice",
        "raw_unparsed_object": entityJson,
      })
      Error(e)
    }->Belt.Result.getExn

    entityDecoded
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Js.Json.t>) => promise<unit> =
    "batchSetTokenDailySnapshot"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<Types.id>) => promise<unit> =
    "batchDeleteTokenDailySnapshot"

  @module("./DbFunctionsImplementation.js")
  external readEntitiesFromDb: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readTokenDailySnapshotEntities"

  let readEntities = async (sql: Postgres.sql, ids: array<Types.id>): array<
    tokenDailySnapshotEntity,
  > => {
    let res = await readEntitiesFromDb(sql, ids)
    res->Belt.Array.map(entityJson => entityJson->decodeUnsafe)
  }
}
module TokenHourlySnapshot = {
  open Types

  let decodeUnsafe = (entityJson: Js.Json.t): tokenHourlySnapshotEntity => {
    let entityDecoded = switch entityJson->tokenHourlySnapshotEntity_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity tokenHourlySnapshot using spice",
        "raw_unparsed_object": entityJson,
      })
      Error(e)
    }->Belt.Result.getExn

    entityDecoded
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Js.Json.t>) => promise<unit> =
    "batchSetTokenHourlySnapshot"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<Types.id>) => promise<unit> =
    "batchDeleteTokenHourlySnapshot"

  @module("./DbFunctionsImplementation.js")
  external readEntitiesFromDb: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readTokenHourlySnapshotEntities"

  let readEntities = async (sql: Postgres.sql, ids: array<Types.id>): array<
    tokenHourlySnapshotEntity,
  > => {
    let res = await readEntitiesFromDb(sql, ids)
    res->Belt.Array.map(entityJson => entityJson->decodeUnsafe)
  }
}
module TokenWeeklySnapshot = {
  open Types

  let decodeUnsafe = (entityJson: Js.Json.t): tokenWeeklySnapshotEntity => {
    let entityDecoded = switch entityJson->tokenWeeklySnapshotEntity_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity tokenWeeklySnapshot using spice",
        "raw_unparsed_object": entityJson,
      })
      Error(e)
    }->Belt.Result.getExn

    entityDecoded
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Js.Json.t>) => promise<unit> =
    "batchSetTokenWeeklySnapshot"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<Types.id>) => promise<unit> =
    "batchDeleteTokenWeeklySnapshot"

  @module("./DbFunctionsImplementation.js")
  external readEntitiesFromDb: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readTokenWeeklySnapshotEntities"

  let readEntities = async (sql: Postgres.sql, ids: array<Types.id>): array<
    tokenWeeklySnapshotEntity,
  > => {
    let res = await readEntitiesFromDb(sql, ids)
    res->Belt.Array.map(entityJson => entityJson->decodeUnsafe)
  }
}
module User = {
  open Types

  let decodeUnsafe = (entityJson: Js.Json.t): userEntity => {
    let entityDecoded = switch entityJson->userEntity_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity user using spice",
        "raw_unparsed_object": entityJson,
      })
      Error(e)
    }->Belt.Result.getExn

    entityDecoded
  }

  @module("./DbFunctionsImplementation.js")
  external batchSet: (Postgres.sql, array<Js.Json.t>) => promise<unit> = "batchSetUser"

  @module("./DbFunctionsImplementation.js")
  external batchDelete: (Postgres.sql, array<Types.id>) => promise<unit> = "batchDeleteUser"

  @module("./DbFunctionsImplementation.js")
  external readEntitiesFromDb: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readUserEntities"

  let readEntities = async (sql: Postgres.sql, ids: array<Types.id>): array<userEntity> => {
    let res = await readEntitiesFromDb(sql, ids)
    res->Belt.Array.map(entityJson => entityJson->decodeUnsafe)
  }
}
