import {
  PriceFetcher,
} from "generated";

import { Token } from "./../src/Types.gen";

PriceFetcher.PriceFetched.handlerWithLoader({
  loader: async ({ event, context }) => {
    // Load the single token from the loader to be updated
    const currentToken = await context.Token.get(
      event.params.token.toString() + "-" + event.chainId.toString()
    );

    return { currentToken };
  },
  handler: async ({ event, context, loaderReturn }) => {
    if (loaderReturn) {
      const { currentToken } = loaderReturn;

      // The token entity should be created via PoolCreated event from the PoolFactory contract
      if (currentToken) {
        // Create a new instance of Token to be updated in the DB
        const newTokenInstance: Token = {
          ...currentToken,
          pricePerUSDNew: event.params.price,
          lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
        };

        // Update the Token in the DB
        context.Token.set(newTokenInstance);
      }
    }
  },
});