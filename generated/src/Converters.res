exception UndefinedEvent(string)

let getVal = (_typ, _fn) =>
  %raw(`
    Array.isArray(_typ) ?
       _typ.map(inner => getVal(inner, _fn)) : _typ.val
`)

let eventStringToEvent = (eventName: string, contractName: string): Types.eventName => {
  switch (eventName, contractName) {
  | ("Fees", "Pool") => Pool_Fees
  | ("Swap", "Pool") => Pool_Swap
  | ("Sync", "Pool") => Pool_Sync
  | ("PoolCreated", "PoolFactory") => PoolFactory_PoolCreated
  | ("DistributeReward", "Voter") => Voter_DistributeReward
  | ("GaugeCreated", "Voter") => Voter_GaugeCreated
  | ("NotifyReward", "VotingReward") => VotingReward_NotifyReward
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
    ~txOrigin: option<Ethers.ethAddress>,
  ) => {
    let params: Types.PoolContract.FeesEvent.eventArgs = {
      sender: logDescription.args.sender,
      amount0: logDescription.args.amount0,
      amount1: logDescription.args.amount1,
    }

    let feesLog: Types.eventLog<Types.PoolContract.FeesEvent.eventArgs> = {
      params,
      chainId,
      txOrigin,
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
    ~txOrigin: option<Ethers.ethAddress>,
  ) => {
    let params: Types.PoolContract.FeesEvent.eventArgs = {
      sender: decodedEvent.args.sender,
      amount0: decodedEvent.args.amount0,
      amount1: decodedEvent.args.amount1,
    }

    let feesLog: Types.eventLog<Types.PoolContract.FeesEvent.eventArgs> = {
      params,
      chainId,
      txOrigin,
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

  type decodedFeesIndexed = {
    @as("0") sender: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
  }

  type decodedFeesBody = {
    @as("0") amount0: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
    @as("1") amount1: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
  }

  let convertFeesDecodedEventParams = (
    decodedEvent: HyperSyncClient.Decoder.decodedEvent<'a>,
  ): Types.PoolContract.FeesEvent.eventArgs => {
    let {sender}: decodedFeesIndexed = decodedEvent.indexed->Obj.magic

    let {amount0, amount1}: decodedFeesBody = decodedEvent.body->Obj.magic

    {
      sender: sender->getVal(getVal),
      amount0: amount0->getVal(getVal),
      amount1: amount1->getVal(getVal),
    }
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
    ~txOrigin: option<Ethers.ethAddress>,
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
      txOrigin,
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
    ~txOrigin: option<Ethers.ethAddress>,
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
      txOrigin,
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

  type decodedSwapIndexed = {
    @as("0") sender: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("1") to: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
  }

  type decodedSwapBody = {
    @as("0") amount0In: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
    @as("1") amount1In: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
    @as("2") amount0Out: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
    @as("3") amount1Out: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
  }

  let convertSwapDecodedEventParams = (
    decodedEvent: HyperSyncClient.Decoder.decodedEvent<'a>,
  ): Types.PoolContract.SwapEvent.eventArgs => {
    let {sender, to}: decodedSwapIndexed = decodedEvent.indexed->Obj.magic

    let {amount0In, amount1In, amount0Out, amount1Out}: decodedSwapBody =
      decodedEvent.body->Obj.magic

    {
      sender: sender->getVal(getVal),
      to: to->getVal(getVal),
      amount0In: amount0In->getVal(getVal),
      amount1In: amount1In->getVal(getVal),
      amount0Out: amount0Out->getVal(getVal),
      amount1Out: amount1Out->getVal(getVal),
    }
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
    ~txOrigin: option<Ethers.ethAddress>,
  ) => {
    let params: Types.PoolContract.SyncEvent.eventArgs = {
      reserve0: logDescription.args.reserve0,
      reserve1: logDescription.args.reserve1,
    }

    let syncLog: Types.eventLog<Types.PoolContract.SyncEvent.eventArgs> = {
      params,
      chainId,
      txOrigin,
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
    ~txOrigin: option<Ethers.ethAddress>,
  ) => {
    let params: Types.PoolContract.SyncEvent.eventArgs = {
      reserve0: decodedEvent.args.reserve0,
      reserve1: decodedEvent.args.reserve1,
    }

    let syncLog: Types.eventLog<Types.PoolContract.SyncEvent.eventArgs> = {
      params,
      chainId,
      txOrigin,
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

  type decodedSyncBody = {
    @as("0") reserve0: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
    @as("1") reserve1: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
  }

  let convertSyncDecodedEventParams = (
    decodedEvent: HyperSyncClient.Decoder.decodedEvent<'a>,
  ): Types.PoolContract.SyncEvent.eventArgs => {
    let {reserve0, reserve1}: decodedSyncBody = decodedEvent.body->Obj.magic

    {
      reserve0: reserve0->getVal(getVal),
      reserve1: reserve1->getVal(getVal),
    }
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
    ~txOrigin: option<Ethers.ethAddress>,
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
      txOrigin,
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
    ~txOrigin: option<Ethers.ethAddress>,
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
      txOrigin,
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

  type decodedPoolCreatedIndexed = {
    @as("0") token0: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("1") token1: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("2") stable: HyperSyncClient.Decoder.decodedSolType<bool>,
  }

  type decodedPoolCreatedBody = {
    @as("0") pool: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("1") unnamed: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
  }

  let convertPoolCreatedDecodedEventParams = (
    decodedEvent: HyperSyncClient.Decoder.decodedEvent<'a>,
  ): Types.PoolFactoryContract.PoolCreatedEvent.eventArgs => {
    let {token0, token1, stable}: decodedPoolCreatedIndexed = decodedEvent.indexed->Obj.magic

    let {pool, unnamed}: decodedPoolCreatedBody = decodedEvent.body->Obj.magic

    {
      token0: token0->getVal(getVal),
      token1: token1->getVal(getVal),
      stable: stable->getVal(getVal),
      pool: pool->getVal(getVal),
      unnamed: unnamed->getVal(getVal),
    }
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
    ~txOrigin: option<Ethers.ethAddress>,
  ) => {
    let params: Types.VoterContract.DistributeRewardEvent.eventArgs = {
      sender: logDescription.args.sender,
      gauge: logDescription.args.gauge,
      amount: logDescription.args.amount,
    }

    let distributeRewardLog: Types.eventLog<Types.VoterContract.DistributeRewardEvent.eventArgs> = {
      params,
      chainId,
      txOrigin,
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
    ~txOrigin: option<Ethers.ethAddress>,
  ) => {
    let params: Types.VoterContract.DistributeRewardEvent.eventArgs = {
      sender: decodedEvent.args.sender,
      gauge: decodedEvent.args.gauge,
      amount: decodedEvent.args.amount,
    }

    let distributeRewardLog: Types.eventLog<Types.VoterContract.DistributeRewardEvent.eventArgs> = {
      params,
      chainId,
      txOrigin,
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

  type decodedDistributeRewardIndexed = {
    @as("0") sender: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("1") gauge: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
  }

  type decodedDistributeRewardBody = {
    @as("0") amount: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
  }

  let convertDistributeRewardDecodedEventParams = (
    decodedEvent: HyperSyncClient.Decoder.decodedEvent<'a>,
  ): Types.VoterContract.DistributeRewardEvent.eventArgs => {
    let {sender, gauge}: decodedDistributeRewardIndexed = decodedEvent.indexed->Obj.magic

    let {amount}: decodedDistributeRewardBody = decodedEvent.body->Obj.magic

    {
      sender: sender->getVal(getVal),
      gauge: gauge->getVal(getVal),
      amount: amount->getVal(getVal),
    }
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
    ~txOrigin: option<Ethers.ethAddress>,
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
      txOrigin,
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
    ~txOrigin: option<Ethers.ethAddress>,
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
      txOrigin,
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

  type decodedGaugeCreatedIndexed = {
    @as("0") poolFactory: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("1") votingRewardsFactory: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("2") gaugeFactory: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
  }

  type decodedGaugeCreatedBody = {
    @as("0") pool: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("1") bribeVotingReward: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("2") feeVotingReward: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("3") gauge: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("4") creator: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
  }

  let convertGaugeCreatedDecodedEventParams = (
    decodedEvent: HyperSyncClient.Decoder.decodedEvent<'a>,
  ): Types.VoterContract.GaugeCreatedEvent.eventArgs => {
    let {poolFactory, votingRewardsFactory, gaugeFactory}: decodedGaugeCreatedIndexed =
      decodedEvent.indexed->Obj.magic

    let {pool, bribeVotingReward, feeVotingReward, gauge, creator}: decodedGaugeCreatedBody =
      decodedEvent.body->Obj.magic

    {
      poolFactory: poolFactory->getVal(getVal),
      votingRewardsFactory: votingRewardsFactory->getVal(getVal),
      gaugeFactory: gaugeFactory->getVal(getVal),
      pool: pool->getVal(getVal),
      bribeVotingReward: bribeVotingReward->getVal(getVal),
      feeVotingReward: feeVotingReward->getVal(getVal),
      gauge: gauge->getVal(getVal),
      creator: creator->getVal(getVal),
    }
  }
}

module VotingReward = {
  let convertNotifyRewardViemDecodedEvent: Viem.decodedEvent<'a> => Viem.decodedEvent<
    Types.VotingRewardContract.NotifyRewardEvent.eventArgs,
  > = Obj.magic

  let convertNotifyRewardLogDescription = (log: Ethers.logDescription<'a>): Ethers.logDescription<
    Types.VotingRewardContract.NotifyRewardEvent.eventArgs,
  > => {
    //Convert from the ethersLog type with indexs as keys to named key value object
    let ethersLog: Ethers.logDescription<
      Types.VotingRewardContract.NotifyRewardEvent.ethersEventArgs,
    > =
      log->Obj.magic
    let {args, name, signature, topic} = ethersLog

    {
      name,
      signature,
      topic,
      args: {
        from: args.from,
        reward: args.reward,
        epoch: args.epoch,
        amount: args.amount,
      },
    }
  }

  let convertNotifyRewardLog = (
    logDescription: Ethers.logDescription<Types.VotingRewardContract.NotifyRewardEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
    ~txOrigin: option<Ethers.ethAddress>,
  ) => {
    let params: Types.VotingRewardContract.NotifyRewardEvent.eventArgs = {
      from: logDescription.args.from,
      reward: logDescription.args.reward,
      epoch: logDescription.args.epoch,
      amount: logDescription.args.amount,
    }

    let notifyRewardLog: Types.eventLog<Types.VotingRewardContract.NotifyRewardEvent.eventArgs> = {
      params,
      chainId,
      txOrigin,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.VotingRewardContract_NotifyReward(notifyRewardLog)
  }
  let convertNotifyRewardLogViem = (
    decodedEvent: Viem.decodedEvent<Types.VotingRewardContract.NotifyRewardEvent.eventArgs>,
    ~log: Ethers.log,
    ~blockTimestamp: int,
    ~chainId: int,
    ~txOrigin: option<Ethers.ethAddress>,
  ) => {
    let params: Types.VotingRewardContract.NotifyRewardEvent.eventArgs = {
      from: decodedEvent.args.from,
      reward: decodedEvent.args.reward,
      epoch: decodedEvent.args.epoch,
      amount: decodedEvent.args.amount,
    }

    let notifyRewardLog: Types.eventLog<Types.VotingRewardContract.NotifyRewardEvent.eventArgs> = {
      params,
      chainId,
      txOrigin,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.VotingRewardContract_NotifyReward(notifyRewardLog)
  }

  type decodedNotifyRewardIndexed = {
    @as("0") from: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("1") reward: HyperSyncClient.Decoder.decodedSolType<Ethers.ethAddress>,
    @as("2") epoch: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
  }

  type decodedNotifyRewardBody = {
    @as("0") amount: HyperSyncClient.Decoder.decodedSolType<Ethers.BigInt.t>,
  }

  let convertNotifyRewardDecodedEventParams = (
    decodedEvent: HyperSyncClient.Decoder.decodedEvent<'a>,
  ): Types.VotingRewardContract.NotifyRewardEvent.eventArgs => {
    let {from, reward, epoch}: decodedNotifyRewardIndexed = decodedEvent.indexed->Obj.magic

    let {amount}: decodedNotifyRewardBody = decodedEvent.body->Obj.magic

    {
      from: from->getVal(getVal),
      reward: reward->getVal(getVal),
      epoch: epoch->getVal(getVal),
      amount: amount->getVal(getVal),
    }
  }
}

exception ParseError(Ethers.Interface.parseLogError)
exception UnregisteredContract(Ethers.ethAddress)

let parseEventEthers = (
  ~log,
  ~blockTimestamp,
  ~contractInterfaceManager,
  ~chainId,
  ~txOrigin,
): Belt.Result.t<Types.event, _> => {
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
        ->Pool.convertFeesLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | Pool_Swap =>
        logDescription
        ->Pool.convertSwapLogDescription
        ->Pool.convertSwapLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | Pool_Sync =>
        logDescription
        ->Pool.convertSyncLogDescription
        ->Pool.convertSyncLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | PoolFactory_PoolCreated =>
        logDescription
        ->PoolFactory.convertPoolCreatedLogDescription
        ->PoolFactory.convertPoolCreatedLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | Voter_DistributeReward =>
        logDescription
        ->Voter.convertDistributeRewardLogDescription
        ->Voter.convertDistributeRewardLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | Voter_GaugeCreated =>
        logDescription
        ->Voter.convertGaugeCreatedLogDescription
        ->Voter.convertGaugeCreatedLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | VotingReward_NotifyReward =>
        logDescription
        ->VotingReward.convertNotifyRewardLogDescription
        ->VotingReward.convertNotifyRewardLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      }

      Ok(event)
    }
  }
}

let makeEventLog = (
  params: 'args,
  ~log: Ethers.log,
  ~blockTimestamp: int,
  ~chainId: int,
  ~txOrigin: option<Ethers.ethAddress>,
): Types.eventLog<'args> => {
  chainId,
  params,
  txOrigin,
  blockNumber: log.blockNumber,
  blockTimestamp,
  blockHash: log.blockHash,
  srcAddress: log.address,
  transactionHash: log.transactionHash,
  transactionIndex: log.transactionIndex,
  logIndex: log.logIndex,
}

let convertDecodedEvent = (
  event: HyperSyncClient.Decoder.decodedEvent<'t>,
  ~contractInterfaceManager,
  ~log: Ethers.log,
  ~blockTimestamp,
  ~chainId,
  ~txOrigin: option<Ethers.ethAddress>,
): result<Types.event, _> => {
  switch contractInterfaceManager->ContractInterfaceManager.getContractNameFromAddress(
    ~contractAddress=log.address,
  ) {
  | None => Error(UnregisteredContract(log.address))
  | Some(contractName) =>
    let event = switch Types.eventTopicToEventName(contractName, log.topics[0]) {
    | Pool_Fees =>
      event
      ->Pool.convertFeesDecodedEventParams
      ->makeEventLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      ->Types.PoolContract_Fees
    | Pool_Swap =>
      event
      ->Pool.convertSwapDecodedEventParams
      ->makeEventLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      ->Types.PoolContract_Swap
    | Pool_Sync =>
      event
      ->Pool.convertSyncDecodedEventParams
      ->makeEventLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      ->Types.PoolContract_Sync
    | PoolFactory_PoolCreated =>
      event
      ->PoolFactory.convertPoolCreatedDecodedEventParams
      ->makeEventLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      ->Types.PoolFactoryContract_PoolCreated
    | Voter_DistributeReward =>
      event
      ->Voter.convertDistributeRewardDecodedEventParams
      ->makeEventLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      ->Types.VoterContract_DistributeReward
    | Voter_GaugeCreated =>
      event
      ->Voter.convertGaugeCreatedDecodedEventParams
      ->makeEventLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      ->Types.VoterContract_GaugeCreated
    | VotingReward_NotifyReward =>
      event
      ->VotingReward.convertNotifyRewardDecodedEventParams
      ->makeEventLog(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      ->Types.VotingRewardContract_NotifyReward
    }
    Ok(event)
  }
}

let parseEvent = (
  ~log,
  ~blockTimestamp,
  ~contractInterfaceManager,
  ~chainId,
  ~txOrigin,
): Belt.Result.t<Types.event, _> => {
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
        ->Pool.convertFeesLogViem(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | Pool_Swap =>
        decodedEvent
        ->Pool.convertSwapViemDecodedEvent
        ->Pool.convertSwapLogViem(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | Pool_Sync =>
        decodedEvent
        ->Pool.convertSyncViemDecodedEvent
        ->Pool.convertSyncLogViem(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | PoolFactory_PoolCreated =>
        decodedEvent
        ->PoolFactory.convertPoolCreatedViemDecodedEvent
        ->PoolFactory.convertPoolCreatedLogViem(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | Voter_DistributeReward =>
        decodedEvent
        ->Voter.convertDistributeRewardViemDecodedEvent
        ->Voter.convertDistributeRewardLogViem(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | Voter_GaugeCreated =>
        decodedEvent
        ->Voter.convertGaugeCreatedViemDecodedEvent
        ->Voter.convertGaugeCreatedLogViem(~log, ~blockTimestamp, ~chainId, ~txOrigin)
      | VotingReward_NotifyReward =>
        decodedEvent
        ->VotingReward.convertNotifyRewardViemDecodedEvent
        ->VotingReward.convertNotifyRewardLogViem(~log, ~blockTimestamp, ~chainId, ~txOrigin)
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
  ~txOrigin: option<Ethers.ethAddress>,
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
      txOrigin,
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

let parseRawEvent = (
  rawEvent: Types.rawEventsEntity,
  ~chain,
  ~txOrigin: option<Ethers.ethAddress>,
): Spice.result<Types.eventBatchQueueItem> => {
  rawEvent.eventType
  ->Types.eventName_decode
  ->Belt.Result.flatMap(eventName => {
    switch eventName {
    | Pool_Fees =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.PoolContract.FeesEvent.eventArgs_decode,
        ~variantAccessor=Types.poolContract_Fees,
        ~chain,
        ~txOrigin,
      )
    | Pool_Swap =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.PoolContract.SwapEvent.eventArgs_decode,
        ~variantAccessor=Types.poolContract_Swap,
        ~chain,
        ~txOrigin,
      )
    | Pool_Sync =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.PoolContract.SyncEvent.eventArgs_decode,
        ~variantAccessor=Types.poolContract_Sync,
        ~chain,
        ~txOrigin,
      )
    | PoolFactory_PoolCreated =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.PoolFactoryContract.PoolCreatedEvent.eventArgs_decode,
        ~variantAccessor=Types.poolFactoryContract_PoolCreated,
        ~chain,
        ~txOrigin,
      )
    | Voter_DistributeReward =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.VoterContract.DistributeRewardEvent.eventArgs_decode,
        ~variantAccessor=Types.voterContract_DistributeReward,
        ~chain,
        ~txOrigin,
      )
    | Voter_GaugeCreated =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.VoterContract.GaugeCreatedEvent.eventArgs_decode,
        ~variantAccessor=Types.voterContract_GaugeCreated,
        ~chain,
        ~txOrigin,
      )
    | VotingReward_NotifyReward =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.VotingRewardContract.NotifyRewardEvent.eventArgs_decode,
        ~variantAccessor=Types.votingRewardContract_NotifyReward,
        ~chain,
        ~txOrigin,
      )
    }
  })
}
