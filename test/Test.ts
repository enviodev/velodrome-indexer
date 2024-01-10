import { expect } from "chai";
import { MockDb, Pool, PoolFactory } from "../generated/src/TestHelpers.gen";
import {
  LiquidityPoolEntity,
  TokenEntity,
  StateStoreEntity,
  LatestETHPriceEntity,
} from "../generated/src/Types.gen";
import { divideBase1e18, multiplyBase1e18 } from "../src/Maths";
import { STATE_STORE_ID, TEN_TO_THE_18_BI } from "../src/Constants";

// Global mock values to be used
const mockChainID = 10;
const mockToken0Address = " 0x4200000000000000000000000000000000000006"; // WETH
const mockToken1Address = " 0x4200000000000000000000000000000000000006"; // WETH
const mockPoolAddress = "0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b";

// Testing PoolCreated event
describe("PoolCreated event correctly creates LiquidityPool and Token entities", () => {
  // Create mock db
  const mockDbInitial = MockDb.createMockDb();

  // Creating mock PoolCreated event
  const mockPoolCreatedEvent = PoolFactory.PoolCreated.createMockEvent({
    token0: mockToken0Address,
    token1: mockToken1Address,
    pool: mockPoolAddress,
    stable: false,
    mockEventData: { chainId: mockChainID },
  });

  // Processing the event
  const updatedMockDb = PoolFactory.PoolCreated.processEvent({
    event: mockPoolCreatedEvent,
    mockDb: mockDbInitial,
  });

  it("LiquidityPool entity is created correctly", () => {
    // Getting the entity from the mock database
    let actualLiquidityPoolEntity =
      updatedMockDb.entities.LiquidityPool.get(mockPoolAddress);

    // Expected LiquidityPool entity
    const expectedLiquidityPoolEntity: LiquidityPoolEntity = {
      id: mockPoolAddress,
      chainID: BigInt(mockChainID),
      token0: mockToken0Address,
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

  it("Token entities are created correctly", () => {
    // Getting the entity from the mock database
    let actualToken0Entity =
      updatedMockDb.entities.Token.get(mockToken0Address);
    let actualToken1Entity =
      updatedMockDb.entities.Token.get(mockToken1Address);

    // Expected Token entities
    const expectedToken0Entity: TokenEntity = {
      id: mockToken0Address,
      chainID: BigInt(mockChainID),
      pricePerETH: 0n,
      pricePerUSD: 0n,
      lastUpdatedTimestamp: BigInt(mockPoolCreatedEvent.blockTimestamp),
    };
    // Expected Token entities
    const expectedToken1Entity: TokenEntity = {
      id: mockToken1Address,
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
  const token0PriceUSD = 1n;
  const token1PriceUSD = 1n;

  // Create a mock LiquidityPool entity
  const mockLiquidityPoolEntity: LiquidityPoolEntity = {
    id: mockPoolAddress,
    chainID: BigInt(mockChainID),
    token0: mockToken0Address,
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
    numberOfSwaps: 0n,
    token0Price: 0n,
    token1Price: 0n,
    lastUpdatedTimestamp: 0n,
  };

  // Mock Token entities
  const mockToken0Entity: TokenEntity = {
    id: mockToken0Address,
    chainID: BigInt(mockChainID),
    pricePerETH: 0n,
    pricePerUSD: token0PriceUSD,
    lastUpdatedTimestamp: 0n,
  };
  // Expected Token entities
  const mockToken1Entity: TokenEntity = {
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

// Testing Sync event correctly updates LiquidityPool
describe("Sync event correctly updates LiquidityPool entity", () => {
  // Create mock db
  const mockDbEmpty = MockDb.createMockDb();

  const reserveAmount0 = 5n * TEN_TO_THE_18_BI;
  const reserveAmount1 = 6n * TEN_TO_THE_18_BI;
  const token0PriceUSD = 1n;
  const token1PriceUSD = 1n;

  // Create a mock LiquidityPool entity
  const mockLiquidityPoolEntity: LiquidityPoolEntity = {
    id: mockPoolAddress,
    chainID: BigInt(mockChainID),
    token0: mockToken0Address,
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
    numberOfSwaps: 0n,
    token0Price: 0n,
    token1Price: 0n,
    lastUpdatedTimestamp: 0n,
  };

  // Mock Token entities
  const mockToken0Entity: TokenEntity = {
    id: mockToken0Address,
    chainID: BigInt(mockChainID),
    pricePerETH: 0n,
    pricePerUSD: token0PriceUSD,
    lastUpdatedTimestamp: 0n,
  };
  const mockToken1Entity: TokenEntity = {
    id: mockToken1Address,
    chainID: BigInt(mockChainID),
    pricePerETH: 0n,
    pricePerUSD: token1PriceUSD,
    lastUpdatedTimestamp: 0n,
  };
  // Mock LatestETHPrice entity
  const mockLatestETHPriceEntity: LatestETHPriceEntity = {
    id: "TIMESTAMP_PLACEHOLDER",
    price: 5n,
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
    mockEventData: { chainId: mockChainID, srcAddress: mockPoolAddress },
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

    // Expected LiquidityPool entity
    const expectedLiquidityPoolEntity: LiquidityPoolEntity = {
      ...mockLiquidityPoolEntity,
      reserve0: reserveAmount0,
      reserve1: reserveAmount1,
      token0Price: divideBase1e18(reserveAmount1, reserveAmount0),
      token1Price: divideBase1e18(reserveAmount0, reserveAmount1),
    };

    // Asserting that the entity in the mock database is the same as the expected entity
    expect(actualLiquidityPoolEntity).to.deep.equal(
      expectedLiquidityPoolEntity
    );
  });
});

// 3. Swap event correctly updates liquidityPool and User entities
// 4. Sync event correctly updates liquidityPool event and Token entities, especially prices of tokens
// 5. GaugeCreated event correctly creates Gauge entity
// 6. DistributeReward event correctly updates Gauge entity
