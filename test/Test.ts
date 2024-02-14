import { expect } from "chai";
import { MockDb, Pool, PoolFactory } from "../generated/src/TestHelpers.gen";
import {
  LiquidityPoolEntity,
  TokenEntity,
  StateStoreEntity,
  LatestETHPriceEntity,
} from "../generated/src/Types.gen";
import { divideBase1e18, multiplyBase1e18 } from "../src/Maths";
import {
  STATE_STORE_ID,
  TEN_TO_THE_6_BI,
  TEN_TO_THE_18_BI,
  USDC,
  WETH,
  OP,
  VELO,
  TEN_TO_THE_3_BI,
} from "../src/Constants";
import { normalizeTokenAmountTo1e18, findPricePerETH } from "../src/Helpers";

// Global mock values to be used
const mockChainID = 10;
const mockToken1Address = "0x4200000000000000000000000000000000000006"; // WETH
const mockPoolAddress = "0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b";
const mockETHPriceUSD = 2000n * TEN_TO_THE_18_BI;
const token0PriceUSD = 2000n;
const token1PriceUSD = 2000n;

const mockBlockTimestamp = 1629811200;

const wethVELOPoolAddress = "0x58e6433a6903886e440ddf519ecc573c4046a6b2";

// Testing PoolCreated event
describe("PoolCreated event correctly creates LiquidityPool and Token entities", () => {
  // Create mock db
  const mockDbInitial = MockDb.createMockDb();

  // Creating mock PoolCreated event
  const mockPoolCreatedEvent = PoolFactory.PoolCreated.createMockEvent({
    token0: WETH.address,
    token1: USDC.address, // USDC
    pool: mockPoolAddress,
    stable: false,
    mockEventData: { blockTimestamp: mockBlockTimestamp, chainId: mockChainID },
  });

  // Processing the event
  const updatedMockDb = PoolFactory.PoolCreated.processEventAsync({
    event: mockPoolCreatedEvent,
    mockDb: mockDbInitial,
  });

  it("LiquidityPool entity is created correctly", async () => {
    // Getting the entity from the mock database
    let actualLiquidityPoolEntity = (
      await updatedMockDb
    ).entities.LiquidityPool.get(mockPoolAddress);

    // Expected LiquidityPool entity
    const expectedLiquidityPoolEntity: LiquidityPoolEntity = {
      id: mockPoolAddress,
      name: "Volatile AMM - WETH/USDC",
      chainID: BigInt(mockChainID),
      token0: WETH.address + "-" + mockChainID.toString(),
      token1: USDC.address + "-" + mockChainID.toString(),
      isStable: false,
      reserve0: 0n,
      reserve1: 0n,
      totalLiquidityETH: 0n,
      totalLiquidityUSD: 0n,
      totalVolume0: 0n,
      totalVolume1: 0n,
      totalVolumeUSD: 0n,
      totalFees0: 0n,
      totalFees1: 0n,
      totalFeesUSD: 0n,
      totalEmissions: 0n,
      totalEmissionsUSD: 0n,
      totalBribesUSD: 0n,
      numberOfSwaps: 0n,
      token0Price: 0n,
      token1Price: 0n,
      lastUpdatedTimestamp: BigInt(mockPoolCreatedEvent.blockTimestamp),
    };

    // Asserting that the entity in the mock database is the same as the expected entity
    expect(actualLiquidityPoolEntity).to.deep.equal(
      expectedLiquidityPoolEntity
    );
  });

  it("Token entities are created correctly", async () => {
    // Getting the entity from the mock database
    let actualToken0Entity = (await updatedMockDb).entities.Token.get(
      WETH.address + "-" + mockChainID.toString()
    );
    let actualToken1Entity = (await updatedMockDb).entities.Token.get(
      USDC.address + "-" + mockChainID.toString()
    );

    // Expected Token entities
    const expectedToken0Entity: TokenEntity = {
      id: WETH.address + "-" + mockChainID.toString(),
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18n,
      chainID: BigInt(mockChainID),
      pricePerETH: 0n,
      pricePerUSD: 0n,
      lastUpdatedTimestamp: BigInt(mockPoolCreatedEvent.blockTimestamp),
    };
    // Expected Token entities
    const expectedToken1Entity: TokenEntity = {
      id: USDC.address + "-" + mockChainID.toString(),
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6n,
      chainID: BigInt(mockChainID),
      pricePerETH: 0n,
      pricePerUSD: 0n,
      lastUpdatedTimestamp: BigInt(mockPoolCreatedEvent.blockTimestamp),
    };

    // Asserting that the entity in the mock database is the same as the expected entity
    expect(actualToken0Entity).to.deep.equal(expectedToken0Entity);
    expect(actualToken1Entity).to.deep.equal(expectedToken1Entity);
  });
});

// Testing Fees event
describe("Fees event correctly updates LiquidityPool", () => {
  // Create mock db
  const mockDbEmpty = MockDb.createMockDb();

  const feesAmount0 = 5n * TEN_TO_THE_18_BI;
  const feesAmount1 = 6n * TEN_TO_THE_18_BI;

  // Create a mock LiquidityPool entity
  const mockLiquidityPoolEntity: LiquidityPoolEntity = {
    id: mockPoolAddress,
    name: "Volatile AMM - WETH/WETH",
    chainID: BigInt(mockChainID),
    token0: WETH.address,
    token1: mockToken1Address,
    isStable: false,
    reserve0: 0n,
    reserve1: 0n,
    totalLiquidityETH: 0n,
    totalLiquidityUSD: 0n,
    totalVolume0: 0n,
    totalVolume1: 0n,
    totalVolumeUSD: 0n,
    totalFees0: 0n,
    totalFees1: 0n,
    totalFeesUSD: 0n,
    totalEmissions: 0n,
    totalEmissionsUSD: 0n,
    totalBribesUSD: 0n,
    numberOfSwaps: 0n,
    token0Price: 0n,
    token1Price: 0n,
    lastUpdatedTimestamp: 0n,
  };

  // Mock Token entities
  const mockToken0Entity: TokenEntity = {
    id: WETH.address,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18n,
    chainID: BigInt(mockChainID),
    pricePerETH: 0n,
    pricePerUSD: token0PriceUSD,
    lastUpdatedTimestamp: 0n,
  };
  // Expected Token entities
  const mockToken1Entity: TokenEntity = {
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18n,
    id: mockToken1Address,
    chainID: BigInt(mockChainID),
    pricePerETH: 0n,
    pricePerUSD: token1PriceUSD,
    lastUpdatedTimestamp: 0n,
  };

  // Updating the mock DB with the mock entities
  const mockDbWithLiquidityPool = mockDbEmpty.entities.LiquidityPool.set(
    mockLiquidityPoolEntity
  );
  const mockDbWithToken0 =
    mockDbWithLiquidityPool.entities.Token.set(mockToken0Entity);
  const mockDbWithTokens =
    mockDbWithToken0.entities.Token.set(mockToken1Entity);

  // Creating mock Fees event
  const mockFeesEvent = Pool.Fees.createMockEvent({
    amount0: feesAmount0,
    amount1: feesAmount1,
    mockEventData: {
      blockTimestamp: mockBlockTimestamp,
      srcAddress: mockPoolAddress,
      chainId: mockChainID,
    },
  });

  // Processing the event
  const updatedMockDb = Pool.Fees.processEvent({
    event: mockFeesEvent,
    mockDb: mockDbWithTokens,
  });

  it("LiquidityPool entity is updated correctly", () => {
    // Getting the entity from the mock database
    const actualLiquidityPoolEntity =
      updatedMockDb.entities.LiquidityPool.get(mockPoolAddress);

    // Expected LiquidityPool entity
    const expectedLiquidityPoolEntity: LiquidityPoolEntity = {
      ...mockLiquidityPoolEntity,
      totalFees0: feesAmount0,
      totalFees1: feesAmount1,
      totalFeesUSD:
        multiplyBase1e18(feesAmount0, token0PriceUSD) +
        multiplyBase1e18(feesAmount1, token1PriceUSD),
      lastUpdatedTimestamp: BigInt(mockFeesEvent.blockTimestamp),
    };

    // Asserting that the entity in the mock database is the same as the expected entity
    expect(actualLiquidityPoolEntity).to.deep.equal(
      expectedLiquidityPoolEntity
    );
  });
});

// Testing an arbitrary Sync event correctly updates LiquidityPool
describe("Sync event correctly updates WETH/USDC pool entity", () => {
  // Create mock db
  const mockDbEmpty = MockDb.createMockDb();

  const reserveAmount0 = 10n * TEN_TO_THE_18_BI; // 10 WETH
  const reserveAmount1 = 20000n * TEN_TO_THE_6_BI; // 20,000 USDC

  // Create a mock LiquidityPool entity
  const mockLiquidityPoolEntity: LiquidityPoolEntity = {
    id: mockPoolAddress,
    name: "Volatile AMM - WETH/USDC",
    chainID: BigInt(mockChainID),
    token0: WETH.address,
    token1: USDC.address,
    isStable: false,
    reserve0: 0n,
    reserve1: 0n,
    totalLiquidityETH: 0n,
    totalLiquidityUSD: 0n,
    totalVolume0: 0n,
    totalVolume1: 0n,
    totalVolumeUSD: 0n,
    totalFees0: 0n,
    totalFees1: 0n,
    totalFeesUSD: 0n,
    totalEmissions: 0n,
    totalEmissionsUSD: 0n,
    totalBribesUSD: 0n,
    numberOfSwaps: 0n,
    token0Price: 0n,
    token1Price: 0n,
    lastUpdatedTimestamp: 0n,
  };

  // Mock Token entities
  const mockToken0Entity: TokenEntity = {
    id: WETH.address,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18n,
    chainID: BigInt(mockChainID),
    pricePerETH: 1n,
    pricePerUSD: mockETHPriceUSD,
    lastUpdatedTimestamp: 0n,
  };
  const mockToken1Entity: TokenEntity = {
    id: USDC.address,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6n,
    chainID: BigInt(mockChainID),
    pricePerETH: divideBase1e18(1n, mockETHPriceUSD),
    pricePerUSD: 1n,
    lastUpdatedTimestamp: 0n,
  };
  // Mock LatestETHPrice entity
  const mockLatestETHPriceEntity: LatestETHPriceEntity = {
    id: "TIMESTAMP_PLACEHOLDER",
    price: mockETHPriceUSD,
  };
  // Mock State Store entity
  const mockStateStoreEntity: StateStoreEntity = {
    id: STATE_STORE_ID,
    latestEthPrice: mockLatestETHPriceEntity.id,
  };

  // Updating the mock DB with the mock entities
  const mockDbWithToken0 = mockDbEmpty.entities.Token.set(mockToken0Entity);
  const mockDbWithTokens =
    mockDbWithToken0.entities.Token.set(mockToken1Entity);
  const mockDbWithLiquidityPool = mockDbWithTokens.entities.LiquidityPool.set(
    mockLiquidityPoolEntity
  );
  const mockDbWithLatestETHPrice =
    mockDbWithLiquidityPool.entities.LatestETHPrice.set(
      mockLatestETHPriceEntity
    );
  const mockDbWithStateStore =
    mockDbWithLatestETHPrice.entities.StateStore.set(mockStateStoreEntity);

  // Creating mock Sync event
  const mockSyncEvent = Pool.Sync.createMockEvent({
    reserve0: reserveAmount0,
    reserve1: reserveAmount1,
    mockEventData: {
      blockTimestamp: mockBlockTimestamp,
      chainId: mockChainID,
      srcAddress: mockPoolAddress,
    },
  });

  // Processing the event
  const updatedMockDb = Pool.Sync.processEvent({
    event: mockSyncEvent,
    mockDb: mockDbWithStateStore,
  });

  it("Reserve and token price values of LiquidityPool entity are updated correctly", () => {
    // Getting the entity from the mock database
    const actualLiquidityPoolEntity =
      updatedMockDb.entities.LiquidityPool.get(mockPoolAddress);

    let normalizedReserve0Amount = normalizeTokenAmountTo1e18(
      reserveAmount0,
      Number(mockToken0Entity.decimals)
    );
    let normalizedReserve1Amount = normalizeTokenAmountTo1e18(
      reserveAmount1,
      Number(mockToken1Entity.decimals)
    );

    // Expected LiquidityPool entity
    const expectedLiquidityPoolEntity: LiquidityPoolEntity = {
      ...mockLiquidityPoolEntity,
      reserve0: normalizedReserve0Amount,
      reserve1: normalizedReserve1Amount,
      token0Price: divideBase1e18(
        normalizedReserve1Amount,
        normalizedReserve0Amount
      ),
      token1Price: divideBase1e18(
        normalizedReserve0Amount,
        normalizedReserve1Amount
      ),
      totalLiquidityETH: 20n * TEN_TO_THE_18_BI, // 20 WETH
      totalLiquidityUSD: 40000n * TEN_TO_THE_18_BI, // 40000 USD
      lastUpdatedTimestamp: BigInt(mockSyncEvent.blockTimestamp),
    };

    // Asserting that the entity in the mock database is the same as the expected entity
    expect(actualLiquidityPoolEntity).to.deep.equal(
      expectedLiquidityPoolEntity
    );
  });
});

// Testing the first and second Sync events correctly updates LiquidityPool and Token entities
describe("Sequence of Sync events correctly updates pool and token entity", () => {
  // Create mock db
  const mockDbEmpty = MockDb.createMockDb();

  const reserveAmount0 = 1000000000000000n;
  const reserveAmount1 = 10000000000000000000n;

  // Create a mock LiquidityPool entity
  const mockLiquidityPoolEntity: LiquidityPoolEntity = {
    id: wethVELOPoolAddress, // WETH/VELO
    name: "Volatile AMM - WETH/VELO",
    chainID: BigInt(mockChainID),
    token0: WETH.address,
    token1: VELO.address,
    isStable: false,
    reserve0: 0n,
    reserve1: 0n,
    totalLiquidityETH: 0n,
    totalLiquidityUSD: 0n,
    totalVolume0: 0n,
    totalVolume1: 0n,
    totalVolumeUSD: 0n,
    totalFees0: 0n,
    totalFees1: 0n,
    totalFeesUSD: 0n,
    totalEmissions: 0n,
    totalEmissionsUSD: 0n,
    totalBribesUSD: 0n,
    numberOfSwaps: 0n,
    token0Price: 0n,
    token1Price: 0n,
    lastUpdatedTimestamp: 0n,
  };

  // Mock Token entities
  const mockToken0Entity: TokenEntity = {
    id: WETH.address,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18n,
    chainID: BigInt(mockChainID),
    pricePerETH: 0n,
    pricePerUSD: 0n,
    lastUpdatedTimestamp: 0n,
  };
  const mockToken1Entity: TokenEntity = {
    id: VELO.address,
    symbol: "VELO",
    name: "Velodrome",
    decimals: 18n,
    chainID: BigInt(mockChainID),
    pricePerETH: 0n,
    pricePerUSD: 0n,
    lastUpdatedTimestamp: 0n,
  };
  // Mock LatestETHPrice entity
  const mockLatestETHPriceEntity: LatestETHPriceEntity = {
    id: "TIMESTAMP_PLACEHOLDER",
    price: mockETHPriceUSD,
  };
  // Mock State Store entity
  const mockStateStoreEntity: StateStoreEntity = {
    id: STATE_STORE_ID,
    latestEthPrice: mockLatestETHPriceEntity.id,
  };

  // Updating the mock DB with the mock entities
  const mockDbWithToken0 = mockDbEmpty.entities.Token.set(mockToken0Entity);
  const mockDbWithTokens =
    mockDbWithToken0.entities.Token.set(mockToken1Entity);
  const mockDbWithLiquidityPool = mockDbWithTokens.entities.LiquidityPool.set(
    mockLiquidityPoolEntity
  );
  const mockDbWithLatestETHPrice =
    mockDbWithLiquidityPool.entities.LatestETHPrice.set(
      mockLatestETHPriceEntity
    );
  const mockDbWithStateStore =
    mockDbWithLatestETHPrice.entities.StateStore.set(mockStateStoreEntity);

  // Creating mock Sync event
  const mockSyncEvent = Pool.Sync.createMockEvent({
    reserve0: reserveAmount0,
    reserve1: reserveAmount1,
    mockEventData: {
      blockTimestamp: mockBlockTimestamp,
      chainId: mockChainID,
      srcAddress: wethVELOPoolAddress,
    },
  });

  // Processing the event
  const updatedMockDb = Pool.Sync.processEvent({
    event: mockSyncEvent,
    mockDb: mockDbWithStateStore,
  });

  let normalizedReserve0Amount = normalizeTokenAmountTo1e18(
    reserveAmount0,
    Number(mockToken0Entity.decimals)
  );
  let normalizedReserve1Amount = normalizeTokenAmountTo1e18(
    reserveAmount1,
    Number(mockToken1Entity.decimals)
  );

  const expectedLiquidityPoolEntityAfterFirstSync: LiquidityPoolEntity = {
    ...mockLiquidityPoolEntity,
    reserve0: normalizedReserve0Amount,
    reserve1: normalizedReserve1Amount,
    token0Price: divideBase1e18(
      normalizedReserve1Amount,
      normalizedReserve0Amount
    ),
    token1Price: divideBase1e18(
      normalizedReserve0Amount,
      normalizedReserve1Amount
    ),
    totalLiquidityETH: 2000000000000000n, // 0.002 WETH
    totalLiquidityUSD: 4n * TEN_TO_THE_18_BI, // 4 USD at 2000 USD/ETH
    lastUpdatedTimestamp: BigInt(mockSyncEvent.blockTimestamp),
  };

  const updatedMockDbAfterFirstSync = updatedMockDb.entities.LiquidityPool.set(
    expectedLiquidityPoolEntityAfterFirstSync
  );

  // start of second sync event
  const secondReserveAmount0 = 1000000n;
  const secondReserveAmount1 = 40000000000000000000n;

  const usdcVELOPoolAddress = "0x8134a2fdc127549480865fb8e5a9e8a8a95a54c5";

  // Create a mock LiquidityPool entity
  const secondMockLiquidityPoolEntity: LiquidityPoolEntity = {
    id: usdcVELOPoolAddress, // USDC/VELO
    name: "Volatile AMM - USDC/VELO",
    chainID: BigInt(mockChainID),
    token0: USDC.address,
    token1: VELO.address,
    isStable: false,
    reserve0: 0n,
    reserve1: 0n,
    totalLiquidityETH: 0n,
    totalLiquidityUSD: 0n,
    totalVolume0: 0n,
    totalVolume1: 0n,
    totalVolumeUSD: 0n,
    totalFees0: 0n,
    totalFees1: 0n,
    totalFeesUSD: 0n,
    totalEmissions: 0n,
    totalEmissionsUSD: 0n,
    totalBribesUSD: 0n,
    numberOfSwaps: 0n,
    token0Price: 0n,
    token1Price: 0n,
    lastUpdatedTimestamp: 0n,
  };

  // Mock Token entities
  const usdcToken: TokenEntity = {
    id: USDC.address,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6n,
    chainID: BigInt(mockChainID),
    pricePerETH: 0n,
    pricePerUSD: 0n,
    lastUpdatedTimestamp: 0n,
  };

  // Updating the mock DB with the mock entities
  const secondMockDbWithToken0 =
    updatedMockDbAfterFirstSync.entities.Token.set(usdcToken);
  const secondMockDbWithLiquidityPool =
    secondMockDbWithToken0.entities.LiquidityPool.set(
      secondMockLiquidityPoolEntity
    );

  // Creating mock Sync event
  const secondMockSyncEvent = Pool.Sync.createMockEvent({
    reserve0: secondReserveAmount0,
    reserve1: secondReserveAmount1,
    mockEventData: {
      blockTimestamp: mockBlockTimestamp,
      chainId: mockChainID,
      srcAddress: usdcVELOPoolAddress,
    },
  });

  // Processing the event
  const secondUpdatedMockDb = Pool.Sync.processEvent({
    event: secondMockSyncEvent,
    mockDb: secondMockDbWithLiquidityPool,
  });

  it("First Sync event: Reserve and token price values of LiquidityPool entity are updated correctly", () => {
    // Getting the entity from the mock database
    const actualLiquidityPoolEntity =
      updatedMockDb.entities.LiquidityPool.get(wethVELOPoolAddress);

    let normalizedReserve0Amount = normalizeTokenAmountTo1e18(
      reserveAmount0,
      Number(mockToken0Entity.decimals)
    );
    let normalizedReserve1Amount = normalizeTokenAmountTo1e18(
      reserveAmount1,
      Number(mockToken1Entity.decimals)
    );

    // Expected LiquidityPool entity
    const expectedLiquidityPoolEntity: LiquidityPoolEntity = {
      ...mockLiquidityPoolEntity,
      reserve0: normalizedReserve0Amount,
      reserve1: normalizedReserve1Amount,
      token0Price: divideBase1e18(
        normalizedReserve1Amount,
        normalizedReserve0Amount
      ),
      token1Price: divideBase1e18(
        normalizedReserve0Amount,
        normalizedReserve1Amount
      ),
      totalLiquidityETH: 2000000000000000n, // 0.002 WETH
      totalLiquidityUSD: 4n * TEN_TO_THE_18_BI, // 4 USD at 2000 USD/ETH
      lastUpdatedTimestamp: BigInt(mockSyncEvent.blockTimestamp),
    };

    // Asserting that the entity in the mock database is the same as the expected entity
    expect(actualLiquidityPoolEntity).to.deep.equal(
      expectedLiquidityPoolEntity
    );
  });

  it("First Sync event: Token entities are updated correctly", () => {
    // Getting the entity from the mock database
    const actualToken0Entity = updatedMockDb.entities.Token.get(
      mockToken0Entity.id
    );
    const actualToken1Entity = updatedMockDb.entities.Token.get(
      mockToken1Entity.id
    );

    // Expected Token entities
    const expectedToken0Entity: TokenEntity = {
      ...mockToken0Entity,
      pricePerETH: TEN_TO_THE_18_BI,
      pricePerUSD: 2000n * TEN_TO_THE_18_BI,
      lastUpdatedTimestamp: BigInt(mockSyncEvent.blockTimestamp),
    };
    const expectedToken1Entity: TokenEntity = {
      ...mockToken1Entity,
      pricePerETH: (100n * TEN_TO_THE_18_BI) / TEN_TO_THE_6_BI, // 0.0001 WETH
      pricePerUSD: (2n * TEN_TO_THE_18_BI) / 10n, // 0.2 USD
      lastUpdatedTimestamp: BigInt(mockSyncEvent.blockTimestamp),
    };

    // Asserting that the entity in the mock database is the same as the expected entity
    expect(actualToken0Entity).to.deep.equal(expectedToken0Entity);
    expect(actualToken1Entity).to.deep.equal(expectedToken1Entity);
  });

  it("Second Sync event: Reserve and token price values of LiquidityPool entity are updated correctly", () => {
    // Getting the entity from the mock database
    const actualLiquidityPoolEntity =
      secondUpdatedMockDb.entities.LiquidityPool.get(usdcVELOPoolAddress);

    let normalizedReserve0Amount = normalizeTokenAmountTo1e18(
      secondReserveAmount0,
      Number(usdcToken.decimals)
    );
    let normalizedReserve1Amount = normalizeTokenAmountTo1e18(
      secondReserveAmount1,
      Number(mockToken1Entity.decimals)
    );

    // Expected LiquidityPool entity
    const expectedLiquidityPoolEntity: LiquidityPoolEntity = {
      ...secondMockLiquidityPoolEntity,
      reserve0: normalizedReserve0Amount,
      reserve1: normalizedReserve1Amount,
      token0Price: divideBase1e18(
        normalizedReserve1Amount,
        normalizedReserve0Amount
      ),
      token1Price: divideBase1e18(
        normalizedReserve0Amount,
        normalizedReserve1Amount
      ),
      totalLiquidityETH: (1n * TEN_TO_THE_18_BI) / TEN_TO_THE_3_BI, // 0.001 WETH at 2000 USD/ETH
      totalLiquidityUSD: 2n * TEN_TO_THE_18_BI, // 2 USD
      lastUpdatedTimestamp: BigInt(mockSyncEvent.blockTimestamp),
    };

    // Asserting that the entity in the mock database is the same as the expected entity
    expect(actualLiquidityPoolEntity).to.deep.equal(
      expectedLiquidityPoolEntity
    );
  });

  it("Second Sync event: Token entities are updated correctly", () => {
    // Getting the entity from the mock database
    const actualToken0Entity = secondUpdatedMockDb.entities.Token.get(
      usdcToken.id
    );
    const actualToken1Entity = secondUpdatedMockDb.entities.Token.get(
      mockToken1Entity.id
    );

    // Expected Token entities
    const expectedToken0Entity: TokenEntity = {
      ...usdcToken,
      pricePerETH: (1n * TEN_TO_THE_18_BI) / 2000n, // 0.0005 WETH
      pricePerUSD: 1n * TEN_TO_THE_18_BI, // 1 USD
      lastUpdatedTimestamp: BigInt(secondMockSyncEvent.blockTimestamp),
    };
    const expectedToken1Entity: TokenEntity = {
      ...mockToken1Entity,
      pricePerETH: 20000n, // 1 WETH
      pricePerUSD: 2000n * TEN_TO_THE_18_BI, // 2000 USD
      lastUpdatedTimestamp: BigInt(secondMockSyncEvent.blockTimestamp),
    };

    // Asserting that the entity in the mock database is the same as the expected entity
    expect(actualToken0Entity).to.deep.equal(expectedToken0Entity);
    expect(actualToken1Entity).to.deep.equal(expectedToken1Entity);
  });
});

describe("Unit test - findPricePerETH", () => {
  const usdcToken: TokenEntity = {
    id: USDC.address,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6n,
    chainID: BigInt(mockChainID),
    pricePerETH: 0n,
    pricePerUSD: 0n,
    lastUpdatedTimestamp: 0n,
  };

  const veloToken: TokenEntity = {
    id: VELO.address,
    symbol: "VELO",
    name: "Velodrome",
    decimals: 18n,
    chainID: BigInt(mockChainID),
    pricePerETH: (100n * TEN_TO_THE_18_BI) / TEN_TO_THE_6_BI, // 0.0001 WETH
    pricePerUSD: (2n * TEN_TO_THE_18_BI) / 10n, // 0.2 USD
    lastUpdatedTimestamp: 0n,
  };

  const wethToken: TokenEntity = {
    id: WETH.address,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18n,
    chainID: BigInt(mockChainID),
    pricePerETH: TEN_TO_THE_18_BI,
    pricePerUSD: 2000n * TEN_TO_THE_18_BI,
    lastUpdatedTimestamp: 0n,
  };

  const whitelistedTokensList = [usdcToken, veloToken, wethToken];

  // Expected LiquidityPool entity
  const wethVeloPoolEntity: LiquidityPoolEntity = {
    id: wethVELOPoolAddress, // WETH/VELO
    name: "Volatile AMM - WETH/VELO",
    chainID: BigInt(mockChainID),
    token0: WETH.address,
    token1: VELO.address,
    isStable: false,
    token0Price: divideBase1e18(10000000000000000000n, 1000000000000000n),
    token1Price: divideBase1e18(1000000000000000n, 10000000000000000000n),
    // these values are not used in the function being tested - they are just placeholders
    reserve0: 0n,
    reserve1: 0n,
    totalLiquidityETH: 0n,
    totalLiquidityUSD: 0n,
    totalVolume0: 0n,
    totalVolume1: 0n,
    totalVolumeUSD: 0n,
    totalFees0: 0n,
    totalFees1: 0n,
    totalFeesUSD: 0n,
    totalEmissions: 0n,
    totalEmissionsUSD: 0n,
    totalBribesUSD: 0n,
    numberOfSwaps: 0n,
    lastUpdatedTimestamp: 0n,
  };

  let relevantPoolEntitiesToken0: LiquidityPoolEntity[] = [];
  let relevantPoolEntitiesToken1: LiquidityPoolEntity[] = [wethVeloPoolEntity];

  // These are based on USDC/VELO pool liquidity
  let relativeToken0Price = divideBase1e18(
    5000000000000000000n,
    TEN_TO_THE_18_BI
  );
  let relativeToken1Price = divideBase1e18(
    TEN_TO_THE_18_BI,
    5000000000000000000n
  );

  let { token0PricePerETH, token1PricePerETH } = findPricePerETH(
    usdcToken,
    veloToken,
    whitelistedTokensList,
    relevantPoolEntitiesToken0,
    relevantPoolEntitiesToken1,
    mockChainID,
    relativeToken0Price,
    relativeToken1Price
  );

  it("token0PricePerETH value is correct", () => {
    // USDC
    expect(token0PricePerETH).to.equal((1n * TEN_TO_THE_18_BI) / 2000n); // 0.0005 WETH
  });

  it("token1PricePerETH value is correct", () => {
    // VELO
    expect(token1PricePerETH).to.equal(
      (100n * TEN_TO_THE_18_BI) / TEN_TO_THE_6_BI
    ); // 0.0001 WETH
  });
});
