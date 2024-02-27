%%raw(`globalThis.fetch = require('node-fetch')`)
open Fetch

type t
@module external process: t = "process"

@send external exit: (t, unit) => unit = "exit"

%%private(let envSafe = EnvSafe.make())
let operatorUrl =
  envSafe->EnvSafe.get(
    ~name="ENVIO_OPERATOR_URL",
    ~struct=S.string(),
    ~devFallback="svc/envio-operator",
    (),
  )
let operatorPort =
  envSafe->EnvSafe.get(
    ~name="ENVIO_OPERATOR_PORT",
    ~struct=S.int()->S.Int.port(),
    ~devFallback=8081,
    (),
  )
let commitHash =
  envSafe->EnvSafe.get(~name="COMMIT_HASH", ~struct=S.string(), ~devFallback="latest", ())
let organisationId =
  envSafe->EnvSafe.get(~name="ORGANISATION_ID", ~struct=S.string(), ~devFallback="", ())
let indexerId = envSafe->EnvSafe.get(~name="INDEXER_ID", ~struct=S.string(), ~devFallback="", ())
let createDatabase = async () => {
  // TODO: add the orginisation/user ID to this to allow multiple people to have the same project name and avoid confusion!
  let response = await fetch(
    `${operatorUrl}:${operatorPort->Belt.Int.toString}/databases`,
    {
      method: #POST,
      body: `{
                "commitHash": "${commitHash}",
                "indexerId": "${indexerId}",
                "organisationId": "${organisationId}"
              }`->Body.string,
      headers: Headers.fromObject({
        "Content-type": "application/json",
      }),
    },
  )
  let _ = await response->Response.json

  process->exit()
}
