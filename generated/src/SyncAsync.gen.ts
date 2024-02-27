/* TypeScript file generated from SyncAsync.res by genType. */
/* eslint-disable import/first */


// tslint:disable-next-line:interface-over-type-literal
export type t<sync,async> = 
    { tag: "Sync"; value: sync }
  | { tag: "Async"; value: async };
