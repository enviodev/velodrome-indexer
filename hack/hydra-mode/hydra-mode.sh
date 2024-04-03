#!/bin/bash

# copy the required files accross
cd "$(dirname "$0")"
cp ./TrackTables.res ../../generated/src
cp ./HydraMigrate.res ../../generated/src
cp ./docker-compose.yaml ../../generated

# build rescript code
cd ../../generated
pnpm rescript build -with-deps

# start docker and reset any stale/old state.
docker compose down -v
docker volume rm generated_postgres_data_hydra
docker compose up -d

# wait a bit to ensure docker is finished and then run the migration script for hydra.
sleep 2
node -e "require('./src/HydraMigrate.bs.js').migrate().then(() => { console.log('finished setting up table'); process.exit(0)}).catch((e) => { console.error('there was an error', e); process.exit(1); })"

