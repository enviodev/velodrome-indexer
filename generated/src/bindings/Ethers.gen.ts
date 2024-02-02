/* TypeScript file generated from Ethers.res by genType. */
/* eslint-disable import/first */


// @ts-ignore: Implicit any on import
const EthersBS = require('./Ethers.bs');

import type {EthersAddress as $$ethAddress} from './OpaqueTypes';

import type {GenericBigInt as $$BigInt_t} from './OpaqueTypes';

// tslint:disable-next-line:interface-over-type-literal
export type BigInt_t = $$BigInt_t;

// tslint:disable-next-line:interface-over-type-literal
export type ethAddress = $$ethAddress;

export const Addresses_mockAddresses: ethAddress[] = EthersBS.Addresses.mockAddresses;

export const Addresses_defaultAddress: ethAddress = EthersBS.Addresses.defaultAddress;

export const Addresses: { mockAddresses: ethAddress[]; defaultAddress: ethAddress } = EthersBS.Addresses
