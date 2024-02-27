/* TypeScript file generated from Pino.res by genType. */
/* eslint-disable import/first */


// tslint:disable-next-line:interface-over-type-literal
export type logLevelUser = "udebug" | "uinfo" | "uwarn" | "uerror";

// tslint:disable-next-line:max-classes-per-file 
// tslint:disable-next-line:class-name
export abstract class pinoMessageBlob { protected opaque!: any }; /* simulate opaque types */

// tslint:disable-next-line:interface-over-type-literal
export type t = {
  readonly trace: (_1:pinoMessageBlob) => void; 
  readonly debug: (_1:pinoMessageBlob) => void; 
  readonly info: (_1:pinoMessageBlob) => void; 
  readonly warn: (_1:pinoMessageBlob) => void; 
  readonly error: (_1:pinoMessageBlob) => void; 
  readonly fatal: (_1:pinoMessageBlob) => void
};
