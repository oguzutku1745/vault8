"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOAppAccounts = exports.initConfig = exports.initReceiveConfig = exports.initSendConfig = void 0;
const devtools_1 = require("@layerzerolabs/devtools");
const devtools_solana_1 = require("@layerzerolabs/devtools-solana");
const io_devtools_1 = require("@layerzerolabs/io-devtools");
const createMyOAppLogger = () => (0, io_devtools_1.createModuleLogger)('MyOApp');
const withMyOAppLogger = (0, io_devtools_1.createWithAsyncLogger)(createMyOAppLogger);
/**
 * Helper function that checks whether a vector originates from a Solana network
 *
 * @param {OmniVector} vector
 * @returns {boolean}
 */
const isVectorFromSolana = (vector) => (0, devtools_solana_1.isOmniPointOnSolana)(vector.from);
/**
 * Helper function that checks whether a vector points to a Solana network
 *
 * @param {OmniVector} vector
 * @returns {boolean}
 */
const isVectorToSolana = (vector) => (0, devtools_solana_1.isOmniPointOnSolana)(vector.to);
/**
 * Helper function that wraps a edge configuration function,
 * only executing it for edges that originate in Solana
 *
 * @param {CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp>} createTransactions
 * @returns {CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp>}
 */
const onlyEdgesFromSolana = (createTransactions) => {
    const logger = createMyOAppLogger();
    return (edge, sdk, graph, createSdk) => {
        if (!isVectorFromSolana(edge.vector)) {
            return logger.verbose(`Ignoring connection ${(0, devtools_1.formatOmniVector)(edge.vector)}`), undefined;
        }
        return createTransactions(edge, sdk, graph, createSdk);
    };
};
/**
 * Helper function that wraps a edge configuration function,
 * only executing it for edges that point to Solana
 *
 * @param {CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp>} createTransactions
 * @returns {CreateTransactionsFromOmniEdges<OAppOmniGraph, IOApp>}
 */
const onlyEdgesToSolana = (createTransactions) => {
    const logger = createMyOAppLogger();
    return (edge, sdk, graph, createSdk) => {
        if (!isVectorToSolana(edge.vector)) {
            return logger.verbose(`Ignoring connection ${(0, devtools_1.formatOmniVector)(edge.vector)}`), undefined;
        }
        return createTransactions(edge, sdk, graph, createSdk);
    };
};
// Initialize send configs for edges FROM Solana
exports.initSendConfig = (0, devtools_1.createConfigureEdges)(onlyEdgesFromSolana(withMyOAppLogger(async ({ vector: { to } }, sdk) => {
    const logger = createMyOAppLogger();
    if (typeof sdk.sendConfigIsInitialized !== 'function') {
        return (logger.warn(`Could not find sendConfigIsInitialized() method on OAppWrapperSDK SDK, skipping`),
            undefined);
    }
    if (typeof sdk.initConfig !== 'function') {
        return logger.warn(`Could not find initConfig() method on OAppWrapperSDK SDK, skipping`), undefined;
    }
    logger.verbose(`Checking if the sendConfig for ${to.eid} ${to.address} is initialized`);
    const isInitialized = await sdk.sendConfigIsInitialized(to.eid);
    if (isInitialized) {
        return logger.verbose(`sendConfig for ${to.eid} ${to.address} is already initialized`), undefined;
    }
    logger.verbose(`Initializing sendConfig for ${to.eid} ${to.address}`);
    return sdk.initConfig(to.eid);
})));
// Initialize receive configs for edges TO Solana
exports.initReceiveConfig = (0, devtools_1.createConfigureEdges)(onlyEdgesToSolana(withMyOAppLogger(async ({ vector: { from } }, sdk) => {
    const logger = createMyOAppLogger();
    if (typeof sdk.receiveConfigIsInitialized !== 'function') {
        // If the method doesn't exist, try using the same initConfig method with the from EID
        logger.verbose(`receiveConfigIsInitialized not found, using initConfig for from EID ${from.eid}`);
    }
    if (typeof sdk.initConfig !== 'function') {
        return logger.warn(`Could not find initConfig() method on OAppWrapperSDK SDK, skipping`), undefined;
    }
    logger.verbose(`Checking if the receiveConfig from ${from.eid} ${from.address} is initialized`);
    // Check if receive config is initialized (same method can be used for both send and receive)
    const isInitialized = await sdk.receiveConfigIsInitialized(from.eid);
    if (isInitialized) {
        return logger.verbose(`receiveConfig from ${from.eid} ${from.address} is already initialized`), undefined;
    }
    logger.verbose(`Initializing receiveConfig from ${from.eid} ${from.address}`);
    return sdk.initConfig(from.eid);
})));
// Combine both send and receive config initialization
exports.initConfig = (0, devtools_1.createConfigureMultiple)(exports.initSendConfig, exports.initReceiveConfig);
exports.initOAppAccounts = exports.initConfig;
