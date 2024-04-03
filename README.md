## Multi-chain indexer for Velodrome V2 and Aerodrome

This repo contains the indexer for [Velodrome V2](https://velodrome.finance/) on Optimism and [Aerodrome](https://aerodrome.finance/) on Base.

The indexer is written in TypeScript.

### Overview of user-defined files

- `config.yaml`
  - Outlines which contracts should be indexed from which blockchains into the database.
  - For each contract listed, users have to define the specific events that should be ingested by the indexer.
  - Allows the same contract & event structure to be shared across two different chains (Optimism and Base for Velodrome V2 and Aerodrome respectively)
  - Defines the entities (i.e. tables) that should be loaded for each event.
  - For specific deployments of a contract on specific chains, allows users to define the address of the contract.
  - Contracts without an `address` field in the file are dynamically registered - read [here](https://docs.envio.dev/docs/dynamic-contracts) for further information on dynamic contracts.
  - To index any other events from other smart contracts, add them initially here.
- `schema.graphql`
  - Outlines the shape of data to be saved in Postgres database from the indexer, in form of entity tables.
  - For each entity, its field properties and their types are outlined.
  - Some entities are linked to other entities - for example, each `LiquidityPool` entity has 2 `Token` entities linked to it.
- `src/EventHandlers.ts`
  - Outlines how each event should be used to update the entities that are outlined in the `schema.graphql` file.
  - The event handlers are written in TypeScript for Velodrome indexer.
  - Consists of a `loader` and a `handler` function for each event - see [here](https://docs.envio.dev/docs/event-handlers) for detailed explanation of the purpose of the two functions.
  - Makes use of custom helper functions and types in `/src` directory - these have been added to minimize code duplication and refactored to increase readability of the overall codebase.

### Development

To develop the indexer further, refer to the [Envio documentation](https://docs.envio.dev/docs/overview) for additional guidelines.

#### Notable Envio CLI commands

This command will generate the `generated` folder for the repo based on the latest `config.yaml` and `schema.graphql` files.

```bash
envio codegen
```

During local testing, this command will drop all the existing information in the database and create new tables for a new local run.

```bash
envio local db-migrate setup
```

### Running the indexer

Clone this repo and then run (this single command will spin up the required docker images, run DB migrations, perform codegen for any changes and start the indexer)

```bash
envio dev
```

> Make sure you have Docker application running

To stop the indexer, run

```bash
envio stop
```
### Hydra-mode

Hydra is a postgres based database that exposes the same postgres api but stores the data in a columnlar layout which is optimised for analytic type queries that aggregate data across large numbers of rows on large datasets.

To run this indexer against hydra (rather than standard postgres) first run `pnpm enable-hydra`.

Once that completes without error, run `pnpm start`. 

NOTE: it is advised not to run `envio dev` when in hydra mode. This creates risk that the indexer will revert to standard postgres mode. While developing, rather just use standard postgres, and switch to hydra once you are happy with the logic in the indexer.

### Testing

To run the tests inside `/test` directory, run

```bash
pnpm test
```
