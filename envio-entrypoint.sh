export NODE_OPTIONS=--max-old-space-size=2048
export TUI_OFF=true # turn the TUI off
pnpm envio local db-migrate up
exec pnpm envio start