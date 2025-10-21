import {
    type CreateTransactionsFromOmniEdges,
    OmniPoint,
    OmniSDKFactory,
    type OmniVector,
    createConfigureEdges,
    createConfigureMultiple,
    formatOmniVector,
} from '@layerzerolabs/devtools'
import { isOmniPointOnSolana } from '@layerzerolabs/devtools-solana'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import { CustomOAppSDK } from './sdk'

import type { IOApp, OAppConfigurator, OAppOmniGraph } from '@layerzerolabs/ua-devtools'

const createMyOAppLogger = () => createModuleLogger('MyOApp')
const withMyOAppLogger = createWithAsyncLogger(createMyOAppLogger)

/**
 * Helper function that checks whether a vector originates from a Solana network
 *
 * @param {OmniVector} vector
 * @returns {boolean}
 */
const isVectorFromSolana = (vector: OmniVector): boolean => isOmniPointOnSolana(vector.from)

/**
 * Helper function that checks whether a vector points to a Solana network
 *
 * @param {OmniVector} vector
 * @returns {boolean}
 */
const isVectorToSolana = (vector: OmniVector): boolean => isOmniPointOnSolana(vector.to)

/**
 * Helper function that wraps a edge configuration function,
 * only executing it for edges that originate in Solana
 *
 * @param {CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp>} createTransactions
 * @returns {CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp>}
 */
const onlyEdgesFromSolana = (
    createTransactions: CreateTransactionsFromOmniEdges<OAppOmniGraph, CustomOAppSDK>
): CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp> => {
    const logger = createMyOAppLogger()

    return (edge, sdk, graph, createSdk) => {
        if (!isVectorFromSolana(edge.vector)) {
            return logger.verbose(`Ignoring connection ${formatOmniVector(edge.vector)}`), undefined
        }

        return createTransactions(
            edge,
            sdk as unknown as CustomOAppSDK,
            graph,
            createSdk as unknown as OmniSDKFactory<CustomOAppSDK, OmniPoint>
        )
    }
}

/**
 * Helper function that wraps a edge configuration function,
 * only executing it for edges that point to Solana
 *
 * @param {CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp>} createTransactions
 * @returns {CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp>}
 */
const onlyEdgesToSolana = (
    createTransactions: CreateTransactionsFromOmniEdges<OAppOmniGraph, CustomOAppSDK>
): CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp> => {
    const logger = createMyOAppLogger()

    return (edge, sdk, graph, createSdk) => {
        if (!isVectorToSolana(edge.vector)) {
            return logger.verbose(`Ignoring connection ${formatOmniVector(edge.vector)}`), undefined
        }

        return createTransactions(
            edge,
            sdk as unknown as CustomOAppSDK,
            graph,
            createSdk as unknown as OmniSDKFactory<CustomOAppSDK, OmniPoint>
        )
    }
}

// Initialize send configs for edges FROM Solana
export const initSendConfig: OAppConfigurator = createConfigureEdges(
    onlyEdgesFromSolana(
        withMyOAppLogger(async ({ vector: { to } }, sdk) => {
            const logger = createMyOAppLogger()
            if (typeof sdk.sendConfigIsInitialized !== 'function') {
                return (
                    logger.warn(`Could not find sendConfigIsInitialized() method on OAppWrapperSDK SDK, skipping`),
                    undefined
                )
            }
            if (typeof sdk.initConfig !== 'function') {
                return logger.warn(`Could not find initConfig() method on OAppWrapperSDK SDK, skipping`), undefined
            }

            logger.verbose(`Checking if the sendConfig for ${to.eid} ${to.address} is initialized`)

            const isInitialized = await sdk.sendConfigIsInitialized(to.eid)
            if (isInitialized) {
                return logger.verbose(`sendConfig for ${to.eid} ${to.address} is already initialized`), undefined
            }
            logger.verbose(`Initializing sendConfig for ${to.eid} ${to.address}`)
            return sdk.initConfig(to.eid)
        })
    )
)

// Initialize receive configs for edges TO Solana
export const initReceiveConfig: OAppConfigurator = createConfigureEdges(
    onlyEdgesToSolana(
        withMyOAppLogger(async ({ vector: { from } }, sdk) => {
            const logger = createMyOAppLogger()
            if (typeof sdk.receiveConfigIsInitialized !== 'function') {
                // If the method doesn't exist, try using the same initConfig method with the from EID
                logger.verbose(`receiveConfigIsInitialized not found, using initConfig for from EID ${from.eid}`)
            }
            if (typeof sdk.initConfig !== 'function') {
                return logger.warn(`Could not find initConfig() method on OAppWrapperSDK SDK, skipping`), undefined
            }

            logger.verbose(`Checking if the receiveConfig from ${from.eid} ${from.address} is initialized`)

            // Check if receive config is initialized (same method can be used for both send and receive)
            const isInitialized = await sdk.receiveConfigIsInitialized(from.eid)
            if (isInitialized) {
                return logger.verbose(`receiveConfig from ${from.eid} ${from.address} is already initialized`), undefined
            }
            logger.verbose(`Initializing receiveConfig from ${from.eid} ${from.address}`)
            return sdk.initConfig(from.eid)
        })
    )
)

// Combine both send and receive config initialization
export const initConfig: OAppConfigurator = createConfigureMultiple(initSendConfig, initReceiveConfig)

export const initOAppAccounts = initConfig
