echo "Starting indexer..."
sleep 10

export TUI_OFF=${TUI_OFF} # turn the TUI off

# these migrate step below is only required if hasura is being used
echo "running indexer migrations..."
pnpm envio local db-migrate up

echo "starting indexer..."
exec pnpm envio start
