/**
 * Injective SDK client initialization.
 *
 * Centralizes all Injective API client creation so the rest of the app
 * never directly depends on SDK internals.
 */

import {
  IndexerGrpcSpotApi,
  IndexerGrpcDerivativesApi,
} from '@injectivelabs/sdk-ts';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';
import { config } from '../config';

const network =
  config.injective.network === 'mainnet' ? Network.Mainnet : Network.Testnet;

const endpoints = getNetworkEndpoints(network);

/** Spot market indexer client */
export const spotApi = new IndexerGrpcSpotApi(endpoints.indexer);

/** Derivative market indexer client */
export const derivativeApi = new IndexerGrpcDerivativesApi(endpoints.indexer);

/** Expose the resolved endpoints for status reporting */
export const activeEndpoints = {
  indexer: endpoints.indexer,
  grpc: endpoints.grpc,
  network: config.injective.network,
};
