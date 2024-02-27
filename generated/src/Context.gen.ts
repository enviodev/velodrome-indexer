/* TypeScript file generated from Context.res by genType. */
/* eslint-disable import/first */


import type {dynamicContractRegistryEntity as Types_dynamicContractRegistryEntity} from './Types.gen';

import type {entityRead as Types_entityRead} from './Types.gen';

import type {t as Pino_t} from '../src/bindings/Pino.gen';

import type {userLogger as Logs_userLogger} from './Logs.gen';

// tslint:disable-next-line:interface-over-type-literal
export type genericContextCreatorFunctions<loaderContext,handlerContextSync,handlerContextAsync> = {
  readonly logger: Pino_t; 
  readonly log: Logs_userLogger; 
  readonly getLoaderContext: () => loaderContext; 
  readonly getHandlerContextSync: () => handlerContextSync; 
  readonly getHandlerContextAsync: () => handlerContextAsync; 
  readonly getEntitiesToLoad: () => Types_entityRead[]; 
  readonly getAddedDynamicContractRegistrations: () => Types_dynamicContractRegistryEntity[]
};
