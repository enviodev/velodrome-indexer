/* TypeScript file generated from Logs.res by genType. */
/* eslint-disable import/first */


// @ts-ignore: Implicit any on import
const Curry = require('rescript/lib/js/curry.js');

// @ts-ignore: Implicit any on import
const LogsBS = require('./Logs.bs');

import type {Exn_t as Js_Exn_t} from '../src/Js.shim';

// tslint:disable-next-line:interface-over-type-literal
export type userLogger = {
  readonly debug: (_1:string) => void; 
  readonly info: (_1:string) => void; 
  readonly warn: (_1:string) => void; 
  readonly error: (_1:string) => void; 
  readonly errorWithExn: (_1:(undefined | Js_Exn_t), _2:string) => void
};

export const debug: <T1>(_1:userLogger, _2:T1) => void = function <T1>(Arg1: any, Arg2: any) {
  const result = Curry._2(LogsBS.debug, Arg1, Arg2);
  return result
};

export const info: <T1>(_1:userLogger, _2:T1) => void = function <T1>(Arg1: any, Arg2: any) {
  const result = Curry._2(LogsBS.info, Arg1, Arg2);
  return result
};

export const warn: <T1>(_1:userLogger, _2:T1) => void = function <T1>(Arg1: any, Arg2: any) {
  const result = Curry._2(LogsBS.warn, Arg1, Arg2);
  return result
};

export const error: <T1>(_1:userLogger, _2:T1) => void = function <T1>(Arg1: any, Arg2: any) {
  const result = Curry._2(LogsBS.error, Arg1, Arg2);
  return result
};

export const errorWithExn: <T1>(_1:userLogger, _2:(undefined | Js_Exn_t), _3:T1) => void = function <T1>(Arg1: any, Arg2: any, Arg3: any) {
  const result = Curry._3(LogsBS.errorWithExn, Arg1, Arg2, Arg3);
  return result
};
