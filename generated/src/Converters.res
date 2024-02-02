exception UndefinedEvent(string)

let eventStringToEvent = (eventName: string, contractName: string): Types.eventName => {
  switch (eventName, contractName) {
  | ("Fees", "Pool") => Pool_Fees
  | ("Swap", "Pool") => Pool_Swap
  | ("Sync", "Pool") => Pool_Sync
  | ("PoolCreated", "PoolFactory") => PoolFactory_PoolCreated
  | ("DistributeReward", "Voter") => Voter_DistributeReward
  | ("GaugeCreated", "Voter") => Voter_GaugeCreated
  | _ => UndefinedEvent(eventName)->raise
  }
}

module Pool = {
  let convertFeesViemDecodedEvent: Viem.decodedEvent<'a> => Viem.decodedEvent<
    Types.PoolContract.FeesEvent.eventArgs,
  > = Obj.magic

  let convertFeesLogDescription = (log: Ethers.logDescription<'a>): Ethers.logDescription<
    Types.PoolContract.FeesEvent.eventArgs,
  > => {
    //Convert from the ethersLog type with indexs as keys to named key value object
    let ethersLog: Ethers.logDescription<Types.PoolContract.FeesEvent.ethersEventArgs> =
      log->Obj.magic
    let {args, name, signature, topic} = ethersLog

    {
      name,
      signature,
      topic,
      args: {
        sender: args.sender,
        amount0: args.amount0,
        amount1: args.amount1,
      },
    }
  }

  let convertFeesLog = (
    logDescription: Ethers.logDescription<Types.PoolContract.FeesEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.PoolContract.FeesEvent.eventArgs = {
      sender: logDescription.args.sender,
      amount0: logDescription.args.amount0,
      amount1: logDescription.args.amount1,
    }

    let feesLog: Types.eventLog<Types.PoolContract.FeesEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.PoolContract_Fees(feesLog)
  }
  let convertFeesLogViem = (
    decodedEvent: Viem.decodedEvent<Types.PoolContract.FeesEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.PoolContract.FeesEvent.eventArgs = {
      sender: decodedEvent.args.sender,
      amount0: decodedEvent.args.amount0,
      amount1: decodedEvent.args.amount1,
    }

    let feesLog: Types.eventLog<Types.PoolContract.FeesEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.PoolContract_Fees(feesLog)
  }

  let convertSwapViemDecodedEvent: Viem.decodedEvent<'a> => Viem.decodedEvent<
    Types.PoolContract.SwapEvent.eventArgs,
  > = Obj.magic

  let convertSwapLogDescription = (log: Ethers.logDescription<'a>): Ethers.logDescription<
    Types.PoolContract.SwapEvent.eventArgs,
  > => {
    //Convert from the ethersLog type with indexs as keys to named key value object
    let ethersLog: Ethers.logDescription<Types.PoolContract.SwapEvent.ethersEventArgs> =
      log->Obj.magic
    let {args, name, signature, topic} = ethersLog

    {
      name,
      signature,
      topic,
      args: {
        sender: args.sender,
        to: args.to,
        amount0In: args.amount0In,
        amount1In: args.amount1In,
        amount0Out: args.amount0Out,
        amount1Out: args.amount1Out,
      },
    }
  }

  let convertSwapLog = (
    logDescription: Ethers.logDescription<Types.PoolContract.SwapEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.PoolContract.SwapEvent.eventArgs = {
      sender: logDescription.args.sender,
      to: logDescription.args.to,
      amount0In: logDescription.args.amount0In,
      amount1In: logDescription.args.amount1In,
      amount0Out: logDescription.args.amount0Out,
      amount1Out: logDescription.args.amount1Out,
    }

    let swapLog: Types.eventLog<Types.PoolContract.SwapEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.PoolContract_Swap(swapLog)
  }
  let convertSwapLogViem = (
    decodedEvent: Viem.decodedEvent<Types.PoolContract.SwapEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.PoolContract.SwapEvent.eventArgs = {
      sender: decodedEvent.args.sender,
      to: decodedEvent.args.to,
      amount0In: decodedEvent.args.amount0In,
      amount1In: decodedEvent.args.amount1In,
      amount0Out: decodedEvent.args.amount0Out,
      amount1Out: decodedEvent.args.amount1Out,
    }

    let swapLog: Types.eventLog<Types.PoolContract.SwapEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.PoolContract_Swap(swapLog)
  }

  let convertSyncViemDecodedEvent: Viem.decodedEvent<'a> => Viem.decodedEvent<
    Types.PoolContract.SyncEvent.eventArgs,
  > = Obj.magic

  let convertSyncLogDescription = (log: Ethers.logDescription<'a>): Ethers.logDescription<
    Types.PoolContract.SyncEvent.eventArgs,
  > => {
    //Convert from the ethersLog type with indexs as keys to named key value object
    let ethersLog: Ethers.logDescription<Types.PoolContract.SyncEvent.ethersEventArgs> =
      log->Obj.magic
    let {args, name, signature, topic} = ethersLog

    {
      name,
      signature,
      topic,
      args: {
        reserve0: args.reserve0,
        reserve1: args.reserve1,
      },
    }
  }

  let convertSyncLog = (
    logDescription: Ethers.logDescription<Types.PoolContract.SyncEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.PoolContract.SyncEvent.eventArgs = {
      reserve0: logDescription.args.reserve0,
      reserve1: logDescription.args.reserve1,
    }

    let syncLog: Types.eventLog<Types.PoolContract.SyncEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.PoolContract_Sync(syncLog)
  }
  let convertSyncLogViem = (
    decodedEvent: Viem.decodedEvent<Types.PoolContract.SyncEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.PoolContract.SyncEvent.eventArgs = {
      reserve0: decodedEvent.args.reserve0,
      reserve1: decodedEvent.args.reserve1,
    }

    let syncLog: Types.eventLog<Types.PoolContract.SyncEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.PoolContract_Sync(syncLog)
  }
}

module PoolFactory = {
  let convertPoolCreatedViemDecodedEvent: Viem.decodedEvent<'a> => Viem.decodedEvent<
    Types.PoolFactoryContract.PoolCreatedEvent.eventArgs,
  > = Obj.magic

  let convertPoolCreatedLogDescription = (log: Ethers.logDescription<'a>): Ethers.logDescription<
    Types.PoolFactoryContract.PoolCreatedEvent.eventArgs,
  > => {
    //Convert from the ethersLog type with indexs as keys to named key value object
    let ethersLog: Ethers.logDescription<
      Types.PoolFactoryContract.PoolCreatedEvent.ethersEventArgs,
    > =
      log->Obj.magic
    let {args, name, signature, topic} = ethersLog

    {
      name,
      signature,
      topic,
      args: {
        token0: args.token0,
        token1: args.token1,
        stable: args.stable,
        pool: args.pool,
        unnamed: args.unnamed,
      },
    }
  }

  let convertPoolCreatedLog = (
    logDescription: Ethers.logDescription<Types.PoolFactoryContract.PoolCreatedEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.PoolFactoryContract.PoolCreatedEvent.eventArgs = {
      token0: logDescription.args.token0,
      token1: logDescription.args.token1,
      stable: logDescription.args.stable,
      pool: logDescription.args.pool,
      unnamed: logDescription.args.unnamed,
    }

    let poolCreatedLog: Types.eventLog<Types.PoolFactoryContract.PoolCreatedEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.PoolFactoryContract_PoolCreated(poolCreatedLog)
  }
  let convertPoolCreatedLogViem = (
    decodedEvent: Viem.decodedEvent<Types.PoolFactoryContract.PoolCreatedEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.PoolFactoryContract.PoolCreatedEvent.eventArgs = {
      token0: decodedEvent.args.token0,
      token1: decodedEvent.args.token1,
      stable: decodedEvent.args.stable,
      pool: decodedEvent.args.pool,
      unnamed: decodedEvent.args.unnamed,
    }

    let poolCreatedLog: Types.eventLog<Types.PoolFactoryContract.PoolCreatedEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.PoolFactoryContract_PoolCreated(poolCreatedLog)
  }
}

module Voter = {
  let convertDistributeRewardViemDecodedEvent: Viem.decodedEvent<'a> => Viem.decodedEvent<
    Types.VoterContract.DistributeRewardEvent.eventArgs,
  > = Obj.magic

  let convertDistributeRewardLogDescription = (
    log: Ethers.logDescription<'a>,
  ): Ethers.logDescription<Types.VoterContract.DistributeRewardEvent.eventArgs> => {
    //Convert from the ethersLog type with indexs as keys to named key value object
    let ethersLog: Ethers.logDescription<
      Types.VoterContract.DistributeRewardEvent.ethersEventArgs,
    > =
      log->Obj.magic
    let {args, name, signature, topic} = ethersLog

    {
      name,
      signature,
      topic,
      args: {
        sender: args.sender,
        gauge: args.gauge,
        amount: args.amount,
      },
    }
  }

  let convertDistributeRewardLog = (
    logDescription: Ethers.logDescription<Types.VoterContract.DistributeRewardEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.VoterContract.DistributeRewardEvent.eventArgs = {
      sender: logDescription.args.sender,
      gauge: logDescription.args.gauge,
      amount: logDescription.args.amount,
    }

    let distributeRewardLog: Types.eventLog<Types.VoterContract.DistributeRewardEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.VoterContract_DistributeReward(distributeRewardLog)
  }
  let convertDistributeRewardLogViem = (
    decodedEvent: Viem.decodedEvent<Types.VoterContract.DistributeRewardEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.VoterContract.DistributeRewardEvent.eventArgs = {
      sender: decodedEvent.args.sender,
      gauge: decodedEvent.args.gauge,
      amount: decodedEvent.args.amount,
    }

    let distributeRewardLog: Types.eventLog<Types.VoterContract.DistributeRewardEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.VoterContract_DistributeReward(distributeRewardLog)
  }

  let convertGaugeCreatedViemDecodedEvent: Viem.decodedEvent<'a> => Viem.decodedEvent<
    Types.VoterContract.GaugeCreatedEvent.eventArgs,
  > = Obj.magic

  let convertGaugeCreatedLogDescription = (log: Ethers.logDescription<'a>): Ethers.logDescription<
    Types.VoterContract.GaugeCreatedEvent.eventArgs,
  > => {
    //Convert from the ethersLog type with indexs as keys to named key value object
    let ethersLog: Ethers.logDescription<Types.VoterContract.GaugeCreatedEvent.ethersEventArgs> =
      log->Obj.magic
    let {args, name, signature, topic} = ethersLog

    {
      name,
      signature,
      topic,
      args: {
        poolFactory: args.poolFactory,
        votingRewardsFactory: args.votingRewardsFactory,
        gaugeFactory: args.gaugeFactory,
        pool: args.pool,
        bribeVotingReward: args.bribeVotingReward,
        feeVotingReward: args.feeVotingReward,
        gauge: args.gauge,
        creator: args.creator,
      },
    }
  }

  let convertGaugeCreatedLog = (
    logDescription: Ethers.logDescription<Types.VoterContract.GaugeCreatedEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.VoterContract.GaugeCreatedEvent.eventArgs = {
      poolFactory: logDescription.args.poolFactory,
      votingRewardsFactory: logDescription.args.votingRewardsFactory,
      gaugeFactory: logDescription.args.gaugeFactory,
      pool: logDescription.args.pool,
      bribeVotingReward: logDescription.args.bribeVotingReward,
      feeVotingReward: logDescription.args.feeVotingReward,
      gauge: logDescription.args.gauge,
      creator: logDescription.args.creator,
    }

    let gaugeCreatedLog: Types.eventLog<Types.VoterContract.GaugeCreatedEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.VoterContract_GaugeCreated(gaugeCreatedLog)
  }
  let convertGaugeCreatedLogViem = (
    decodedEvent: Viem.decodedEvent<Types.VoterContract.GaugeCreatedEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
  ) => {
    let params: Types.VoterContract.GaugeCreatedEvent.eventArgs = {
      poolFactory: decodedEvent.args.poolFactory,
      votingRewardsFactory: decodedEvent.args.votingRewardsFactory,
      gaugeFactory: decodedEvent.args.gaugeFactory,
      pool: decodedEvent.args.pool,
      bribeVotingReward: decodedEvent.args.bribeVotingReward,
      feeVotingReward: decodedEvent.args.feeVotingReward,
      gauge: decodedEvent.args.gauge,
      creator: decodedEvent.args.creator,
    }

    let gaugeCreatedLog: Types.eventLog<Types.VoterContract.GaugeCreatedEvent.eventArgs> = {
      params,
      chainId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.VoterContract_GaugeCreated(gaugeCreatedLog)
  }
}

type parseEventError =
  ParseError(Ethers.Interface.parseLogError) | UnregisteredContract(Ethers.ethAddress)

exception ParseEventErrorExn(parseEventError)

let parseEventEthers = (~log, ~blockTimestamp, ~contractInterfaceManager, ~chainId): Belt.Result.t<
  Types.event,
  _,
> => {
  let logDescriptionResult = contractInterfaceManager->ContractInterfaceManager.parseLogEthers(~log)
  switch logDescriptionResult {
  | Error(e) =>
    switch e {
    | ParseError(parseError) => ParseError(parseError)
    | UndefinedInterface(contractAddress) => UnregisteredContract(contractAddress)
    }->Error

  | Ok(logDescription) =>
    switch contractInterfaceManager->ContractInterfaceManager.getContractNameFromAddress(
      ~contractAddress=log.address,
    ) {
    | None => Error(UnregisteredContract(log.address))
    | Some(contractName) =>
      let event = switch eventStringToEvent(logDescription.name, contractName) {
      | Pool_Fees =>
        logDescription
        ->Pool.convertFeesLogDescription
        ->Pool.convertFeesLog(~log, ~blockTimestamp, ~chainId)
      | Pool_Swap =>
        logDescription
        ->Pool.convertSwapLogDescription
        ->Pool.convertSwapLog(~log, ~blockTimestamp, ~chainId)
      | Pool_Sync =>
        logDescription
        ->Pool.convertSyncLogDescription
        ->Pool.convertSyncLog(~log, ~blockTimestamp, ~chainId)
      | PoolFactory_PoolCreated =>
        logDescription
        ->PoolFactory.convertPoolCreatedLogDescription
        ->PoolFactory.convertPoolCreatedLog(~log, ~blockTimestamp, ~chainId)
      | Voter_DistributeReward =>
        logDescription
        ->Voter.convertDistributeRewardLogDescription
        ->Voter.convertDistributeRewardLog(~log, ~blockTimestamp, ~chainId)
      | Voter_GaugeCreated =>
        logDescription
        ->Voter.convertGaugeCreatedLogDescription
        ->Voter.convertGaugeCreatedLog(~log, ~blockTimestamp, ~chainId)
      }

      Ok(event)
    }
  }
}

let parseEvent = (~log, ~blockTimestamp, ~contractInterfaceManager, ~chainId): Belt.Result.t<
  Types.event,
  _,
> => {
  let decodedEventResult = contractInterfaceManager->ContractInterfaceManager.parseLogViem(~log)
  switch decodedEventResult {
  | Error(e) =>
    switch e {
    | ParseError(parseError) => ParseError(parseError)
    | UndefinedInterface(contractAddress) => UnregisteredContract(contractAddress)
    }->Error

  | Ok(decodedEvent) =>
    switch contractInterfaceManager->ContractInterfaceManager.getContractNameFromAddress(
      ~contractAddress=log.address,
    ) {
    | None => Error(UnregisteredContract(log.address))
    | Some(contractName) =>
      let event = switch eventStringToEvent(decodedEvent.eventName, contractName) {
      | Pool_Fees =>
        decodedEvent
        ->Pool.convertFeesViemDecodedEvent
        ->Pool.convertFeesLogViem(~log, ~blockTimestamp, ~chainId)
      | Pool_Swap =>
        decodedEvent
        ->Pool.convertSwapViemDecodedEvent
        ->Pool.convertSwapLogViem(~log, ~blockTimestamp, ~chainId)
      | Pool_Sync =>
        decodedEvent
        ->Pool.convertSyncViemDecodedEvent
        ->Pool.convertSyncLogViem(~log, ~blockTimestamp, ~chainId)
      | PoolFactory_PoolCreated =>
        decodedEvent
        ->PoolFactory.convertPoolCreatedViemDecodedEvent
        ->PoolFactory.convertPoolCreatedLogViem(~log, ~blockTimestamp, ~chainId)
      | Voter_DistributeReward =>
        decodedEvent
        ->Voter.convertDistributeRewardViemDecodedEvent
        ->Voter.convertDistributeRewardLogViem(~log, ~blockTimestamp, ~chainId)
      | Voter_GaugeCreated =>
        decodedEvent
        ->Voter.convertGaugeCreatedViemDecodedEvent
        ->Voter.convertGaugeCreatedLogViem(~log, ~blockTimestamp, ~chainId)
      }

      Ok(event)
    }
  }
}

let decodeRawEventWith = (
  rawEvent: Types.rawEventsEntity,
  ~decoder: Spice.decoder<'a>,
  ~variantAccessor: Types.eventLog<'a> => Types.event,
  ~chain,
): Spice.result<Types.eventBatchQueueItem> => {
  switch rawEvent.params->Js.Json.parseExn {
  | exception exn =>
    let message =
      exn
      ->Js.Exn.asJsExn
      ->Belt.Option.flatMap(jsexn => jsexn->Js.Exn.message)
      ->Belt.Option.getWithDefault("No message on exn")

    Spice.error(`Failed at JSON.parse. Error: ${message}`, rawEvent.params->Obj.magic)
  | v => Ok(v)
  }
  ->Belt.Result.flatMap(json => {
    json->decoder
  })
  ->Belt.Result.map(params => {
    let event = {
      chainId: rawEvent.chainId,
      blockNumber: rawEvent.blockNumber,
      blockTimestamp: rawEvent.blockTimestamp,
      blockHash: rawEvent.blockHash,
      srcAddress: rawEvent.srcAddress,
      transactionHash: rawEvent.transactionHash,
      transactionIndex: rawEvent.transactionIndex,
      logIndex: rawEvent.logIndex,
      params,
    }->variantAccessor

    let queueItem: Types.eventBatchQueueItem = {
      timestamp: rawEvent.blockTimestamp,
      chain,
      blockNumber: rawEvent.blockNumber,
      logIndex: rawEvent.logIndex,
      event,
    }

    queueItem
  })
}

let parseRawEvent = (rawEvent: Types.rawEventsEntity, ~chain): Spice.result<
  Types.eventBatchQueueItem,
> => {
  rawEvent.eventType
  ->Types.eventName_decode
  ->Belt.Result.flatMap(eventName => {
    switch eventName {
    | Pool_Fees =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.PoolContract.FeesEvent.eventArgs_decode,
        ~variantAccessor=Types.poolContract_Fees,
        ~chain,
      )
    | Pool_Swap =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.PoolContract.SwapEvent.eventArgs_decode,
        ~variantAccessor=Types.poolContract_Swap,
        ~chain,
      )
    | Pool_Sync =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.PoolContract.SyncEvent.eventArgs_decode,
        ~variantAccessor=Types.poolContract_Sync,
        ~chain,
      )
    | PoolFactory_PoolCreated =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.PoolFactoryContract.PoolCreatedEvent.eventArgs_decode,
        ~variantAccessor=Types.poolFactoryContract_PoolCreated,
        ~chain,
      )
    | Voter_DistributeReward =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.VoterContract.DistributeRewardEvent.eventArgs_decode,
        ~variantAccessor=Types.voterContract_DistributeReward,
        ~chain,
      )
    | Voter_GaugeCreated =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.VoterContract.GaugeCreatedEvent.eventArgs_decode,
        ~variantAccessor=Types.voterContract_GaugeCreated,
        ~chain,
      )
    }
  })
}
