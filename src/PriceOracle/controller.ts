import { Web3, utils } from "web3";
import { PricedTokenInfo, validUnit } from "../CustomTypes";
import {
    OPTIMISM_WHITELISTED_TOKENS,
    BASE_WHITELISTED_TOKENS,
    CHAIN_CONSTANTS,
} from "../Constants";
import contractABI from "../../abis/VeloPriceOracleABI.json";

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
 * prices of a list of token addresses. It converts the prices from Wei to the
 * specified units and returns them as an array of numbers.
 *
 * @param {string[]} addrs - An array of token addresses for which to fetch prices.
 * @param {validUnit[]} units - An array of units corresponding to each token address,
 *                              used to convert the prices from Wei.
 * @param {number} chainId - The ID of the blockchain network where the price oracle
 *                           contract is deployed.
 * @returns {Promise<number[]>} A promise that resolves to an array of token prices
 *                              converted to the specified units.
 *
 * @throws {Error} Throws an error if the price fetching process fails or if there
 *                 is an issue with the contract call.
 */
export async function read_prices(addrs: string[], units: validUnit[], chainId: number): Promise<number[]> {
    const contractAddress = CHAIN_CONSTANTS[chainId].priceOracle;
    const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    const numAddrs = addrs.length - 1;
    const prices: string[] = await contract.methods.getManyRatesWithConnectors(numAddrs, addrs).call();

    const pricesWithUnits = prices.map((price, index) => 
        Number(utils.fromWei(price, units[index]))
    );

    return pricesWithUnits;
}

/**
 * Fetches the prices of whitelisted tokens for a given blockchain network.
 *
 * This function retrieves the list of whitelisted tokens based on the provided
 * chain ID, fetches their current prices from a price oracle, and returns an
 * array of token information including their addresses, symbols, units, and prices.
 *
 * @param {number} chainId - The ID of the blockchain network to fetch prices for.
 *                           Use 10 for the Optimism network, or any other value
 *                           for the base network.
 * @returns {Promise<PricedTokenInfo[]>} A promise that resolves to an array of
 *                                       PricedTokenInfo objects, each containing
 *                                       the address, symbol, unit, and price of a token.
 *
 * @throws {Error} Throws an error if the price fetching process fails.
 */
export async function get_whitelisted_prices(chainId: number): Promise<PricedTokenInfo[]> {
    const tokenData = chainId === 10 ? OPTIMISM_WHITELISTED_TOKENS : BASE_WHITELISTED_TOKENS;
    const addresses = tokenData.map(token => token.address);
    const units = tokenData.map(token => token.unit as validUnit);

    const prices = await read_prices(addresses, units, chainId);
    
    const tokenPrices: PricedTokenInfo[] = tokenData.map((token, index) => ({
        address: token.address,
        symbol: token.symbol,
        unit: token.unit,
        price: prices[index]
    }));

    return tokenPrices;
}
