## Velodrome V2 indexer

This repo contains the indexer for Velodrome V2 contracts that are deployed on Optimism.

Deployment contract addresses can be found [here](https://velodrome.finance/security#contracts).

### Running the indexer

Clone this repo and then run

```bash
envio dev
```

> Make sure you have Docker application running

To stop the indexer, run

```bash
envio stop
```

### Subgraph files

Some files from the Velodrome V2 subgraph are housed under `/subgraph_files` sub-directory.

The repository for the subgraph can be found [here](https://github.com/messari/subgraphs/tree/master/subgraphs/velodrome-finance).
