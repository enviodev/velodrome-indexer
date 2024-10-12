import { parse } from "https://deno.land/std@0.182.0/csv/mod.ts";
import Web3 from "npm:web3@4.0.1";
import "jsr:@std/dotenv/load";

const CHAIN = "base";

const CHAIN_ARGS = {
    "base": {
        RPC_URL: Deno.env.get("BASE_RPC_URL"),
        TOKENS_FILE: "src/constants/Aerodrome-Whitelisted.csv",
        OUTPUT_FILE: "src/constants/baseWhitelistedTokens.json"
    },
    "optimism": {
        RPC_URL: Deno.env.get("OPTIMISM_RPC_URL"),
        TOKENS_FILE: "src/constants/Velodrome-Whitelisted.csv",
        OUTPUT_FILE: "src/constants/optimismWhitelistedTokens.json"
    }
}

// Load environment variables
const RPC_URL = CHAIN_ARGS[CHAIN].RPC_URL;
if (!RPC_URL) {
  console.error("BASE_RPC_URL is not set in the environment variables");
  Deno.exit(1);
}

const TOKENS_FILE = CHAIN_ARGS[CHAIN].TOKENS_FILE;
const OUTPUT_FILE = CHAIN_ARGS[CHAIN].OUTPUT_FILE;

// Load ERC20 ABI from file
const ERC20_ABI = JSON.parse(await Deno.readTextFile("./abis/ERC20.json"));

// Initialize Web3 provider
const web3 = new Web3(RPC_URL);

// Read and parse CSV file
const csvContent = await Deno.readTextFile(TOKENS_FILE);
const records = parse(csvContent, { skipFirstRow: true });

const whitelistedTokens: { address: string, symbol: string, unit: string, createdBlock: number }[] = [];

for (const record of records) {
  const { address, blocktime } = record;
  try {
    const contract = new web3.eth.Contract(ERC20_ABI, address);

    const [symbol, decimals] = await Promise.all([
      contract.methods.symbol().call({}),
      contract.methods.decimals().call({})
    ]);

    const unit = decimals === '18' ? "ether" : "wei";

    whitelistedTokens.push({
      address,
      symbol,
      unit,
      createdBlock: Number(blocktime),
    });

    console.log(`Processed token: ${symbol} at address ${address}`);
  } catch (error) {
    console.error(`Error processing token at address ${address}:`, error.message);
  }
}

// Write the result to a JSON file
await Deno.writeTextFile(
  OUTPUT_FILE,
  JSON.stringify(whitelistedTokens, null, 2)
);

console.log("Whitelist generated successfully!");