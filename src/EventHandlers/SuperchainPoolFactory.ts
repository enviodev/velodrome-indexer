import { SuperchainPoolFactory, SuperchainPoolFactory_RootPoolCreated } from "generated";
import { CHAIN_CONSTANTS } from "../Constants";
import Web3 from "web3";
import SuperchainPoolABI from "../../abis/SuperchainPoolABI.json";

async function getPoolChainId(poolAddress: string, eventChainId: number) {
    const rpcURL = CHAIN_CONSTANTS[eventChainId].rpcURL;
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(SuperchainPoolABI, poolAddress);
    const chainId = await contract.methods.chainid().call();
    return Number(chainId);
}

SuperchainPoolFactory.RootPoolCreated.handlerWithLoader({
  loader: async ({ event, context }) => {
    try {
      const poolChainId = await getPoolChainId(event.params.pool, event.chainId);
      return { poolChainId };
    } catch (error) {
      console.error(`Error getting pool chain id for pool ${event.params.pool} on chain ${event.chainId}: ${error}`);
    }
    return null;

  },
  handler: async ({ event, context, loaderReturn }) => {

    const entity: any = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      token0: event.params.token0,
      token1: event.params.token1,
      pool: event.params.pool,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
      stable: event.params.stable,
      length: event.params.length,
    };

    if (loaderReturn) {
      const { poolChainId } = loaderReturn;
      entity.poolChainId = poolChainId;
      console.log(entity);
    }

    context.SuperchainPoolFactory_RootPoolCreated.set(entity as SuperchainPoolFactory_RootPoolCreated);
  },
});