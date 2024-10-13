import { Web3, utils } from "web3";
import { validUnit } from "./CustomTypes";
import {
    OPTIMISM_WHITELISTED_TOKENS,
    BASE_WHITELISTED_TOKENS,
    CHAIN_CONSTANTS,
} from "./Constants";
import contractABI from "../abis/VeloPriceOracleABI.json";
import { Token, TokenPrice } from "./src/Types.gen";

let pricesLastUpdated: { [chainId: number]: Date } = {};
export function setPricesLastUpdated(chainId: number, date: Date) {
    pricesLastUpdated[chainId] = date;
}

export function getPricesLastUpdated(chainId: number): Date | null {
    return pricesLastUpdated[chainId] || null;
}

/**
 * Reads the prices of specified tokens from a price oracle contract.
 *
 * This function interacts with a blockchain price oracle to fetch the current
 * prices of a list of token addresses. It returns them as an array of strings.
 * 
 * @note: See https://github.com/ethzoomer/optimism-prices for underlying smart contract
 * implementation.
 *
 * @param {string[]} addrs - An array of token addresses for which to fetch prices.
 * @param {number} chainId - The ID of the blockchain network where the price oracle
 *                           contract is deployed.
 * @param {number} blockNumber - The block number to fetch prices for.
 * @returns {Promise<string[]>} A promise that resolves to an array of token prices
 *                              as strings.
 *
 * @throws {Error} Throws an error if the price fetching process fails or if there
 *                 is an issue with the contract call.
 */
export async function read_prices(addrs: string[], chainId: number, blockNumber: number): Promise<string[]> {
    const contractAddress = CHAIN_CONSTANTS[chainId].oracle.getAddress(blockNumber);
    const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    const numAddrs = addrs.length - 1;
    const prices: string[] = await contract.methods.getManyRatesWithConnectors(numAddrs, addrs)
        .call({}, blockNumber);
    return prices;
}

/**
 * Fetches the prices of whitelisted tokens for a given blockchain network.
 *
 * This function retrieves the list of whitelisted tokens based on the provided
 * chain ID, fetches their current prices from a price oracle, and updates the
 * context with token information including their addresses, symbols, units, and prices.
 *
 * @param {number} chainId - The ID of the blockchain network to fetch prices for.
 *                           Use 10 for the Optimism network, or any other value
 *                           for the base network.
 * @param {number} blockNumber - The block number to fetch prices for.
 * @param {Date} blockDatetime - The datetime of the block to use for updating timestamps.
 * @param {any} context - The context object to interact with the Token and TokenPrice entities.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 *
 * @throws {Error} Throws an error if the price fetching process fails.
 */
export async function set_whitelisted_prices(chainId: number, blockNumber: number, blockDatetime: Date, context: any): Promise<void> {
    // Skip if not yet available
    let startBlock = CHAIN_CONSTANTS[chainId].oracle.startBlock || Number.MAX_SAFE_INTEGER;
    if (blockNumber < startBlock) return;

    const lastUpdated = getPricesLastUpdated(chainId);
    const timeDelta = CHAIN_CONSTANTS[chainId].oracle.updateDelta * 1000;
    const tokensNeedUpdate = !lastUpdated || (blockDatetime.getTime() - lastUpdated.getTime()) > timeDelta;
    if (!tokensNeedUpdate) return;

    // Get token data for chain
    const tokenData = chainId === 10 ? OPTIMISM_WHITELISTED_TOKENS : BASE_WHITELISTED_TOKENS;

    // Get prices from oracle
    const addresses = tokenData
        .filter(token => token.createdBlock <= blockNumber)
        .map(token => token.address);

    if (addresses.length === 0) return;
    const prices = await read_prices(addresses, chainId, blockNumber);

    // Map prices to token addresses
    const pricesByAddress = new Map<string, string>();
    pricesByAddress.set(CHAIN_CONSTANTS[chainId].usdc.address, "1");

    prices.forEach((price, index) => {
        pricesByAddress.set(addresses[index], price == "-1" ? "0" : price);
    });
    
    for (const token of tokenData) {
        const price = pricesByAddress.get(token.address) || 0;
        
        // Get or create Token entity
        let tokenEntity = await context.Token.get(token.address);
        if (!tokenEntity) {
            // Create a new token entity if it doesn't exist
            tokenEntity = {
                id: token.address,
                address: token.address,
                symbol: token.symbol,
                name: token.symbol, // Using symbol as name, update if you have a separate name field
                chainID: BigInt(chainId),
                decimals: BigInt(18), // Assuming 18 decimals, update if you have specific decimal information
                pricePerUSDNew: BigInt(0),
                lastUpdatedTimestamp: new Date(0)
            };
        }

        // Update Token entity
        const updatedToken: Token = {
            ...tokenEntity,
            pricePerUSDNew: BigInt(price),
            lastUpdatedTimestamp: blockDatetime
        };
        context.Token.set(updatedToken);

        // Create new TokenPrice entity
        const tokenPrice: TokenPrice = {
            id: `${chainId}_${token.address}_${blockNumber}`,
            name: token.symbol,
            address: token.address,
            price: Number(price),
            chainID: chainId,
            lastUpdatedTimestamp: blockDatetime,
        };
        context.TokenPrice.set(tokenPrice);
    }

    setPricesLastUpdated(chainId, blockDatetime);
}