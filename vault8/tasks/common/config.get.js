"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("hardhat/config");
const devtools_1 = require("@layerzerolabs/devtools");
const devtools_evm_hardhat_1 = require("@layerzerolabs/devtools-evm-hardhat");
const io_devtools_1 = require("@layerzerolabs/io-devtools");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const protocol_devtools_solana_1 = require("@layerzerolabs/protocol-devtools-solana");
const ua_devtools_evm_1 = require("@layerzerolabs/ua-devtools-evm");
const ua_devtools_evm_hardhat_1 = require("@layerzerolabs/ua-devtools-evm-hardhat");
const ua_devtools_evm_hardhat_2 = require("@layerzerolabs/ua-devtools-evm-hardhat");
const taskHelper_1 = require("./taskHelper");
const utils_1 = require("./utils");
/**
 * Helper function to determine if the point is Solana
 * @param point {OmniPoint}
 */
const isSolana = (point) => (0, lz_definitions_1.endpointIdToChainType)(point.eid) === lz_definitions_1.ChainType.SOLANA;
/**
 * Helper function to get the hardhat.config.ts network name for a given endpoint id, or use the convention of
 * networkName-environment for Solana.
 * @param eid {EndpointId}
 */
const getEid = (eid) => {
    switch (eid) {
        // In the case of solana-testnet and solana-mainnet, we'll use the convention of networkName-environment
        case lz_definitions_1.EndpointId.SOLANA_V2_TESTNET:
        case lz_definitions_1.EndpointId.SOLANA_V2_MAINNET: {
            const { chainName, env } = (0, lz_definitions_1.getNetworkForChainId)(eid);
            return `${chainName}-${env}`;
        }
        default:
            // For all other chains, we'll use the network name from hardhat.config.ts
            return (0, devtools_evm_hardhat_1.getNetworkNameForEid)(eid);
    }
};
const action = async ({ logLevel = 'info', oappConfig }, hre) => {
    (0, io_devtools_1.setDefaultLogLevel)(logLevel);
    const logger = (0, io_devtools_1.createLogger)(logLevel);
    const graph = await hre.run(ua_devtools_evm_hardhat_1.SUBTASK_LZ_OAPP_CONFIG_LOAD, {
        configPath: oappConfig,
        schema: ua_devtools_evm_hardhat_1.OAppOmniGraphHardhatSchema,
        task: ua_devtools_evm_hardhat_1.TASK_LZ_OAPP_CONFIG_GET,
    });
    const evmSdkFactory = (0, ua_devtools_evm_1.createOAppFactory)((0, devtools_evm_hardhat_1.createConnectedContractFactory)());
    const configs = {};
    // Iterate over the graph of connections not from Solana
    const tasks = graph.connections
        .filter(({ vector: { from } }) => !isSolana(from))
        .map(({ vector: { from, to } }) => async () => {
        const endpointV2Sdk = await (await evmSdkFactory(from)).getEndpointSDK();
        // OApp User Set Config
        const receiveCustomConfig = await (0, ua_devtools_evm_hardhat_2.getReceiveConfig)(endpointV2Sdk, to.eid, from.address, true);
        const sendCustomConfig = await (0, ua_devtools_evm_hardhat_2.getSendConfig)(endpointV2Sdk, to.eid, from.address, true);
        const [sendCustomLibrary, sendCustomUlnConfig, sendCustomExecutorConfig] = sendCustomConfig ?? [];
        const [receiveCustomLibrary, receiveCustomUlnConfig] = receiveCustomConfig ?? [];
        // Default Config
        const receiveDefaultConfig = await (0, ua_devtools_evm_hardhat_2.getReceiveConfig)(endpointV2Sdk, to.eid);
        const sendDefaultConfig = await (0, ua_devtools_evm_hardhat_2.getSendConfig)(endpointV2Sdk, to.eid);
        const [sendDefaultLibrary, sendDefaultUlnConfig, sendDefaultExecutorConfig] = sendDefaultConfig ?? [];
        const [receiveDefaultLibrary, receiveDefaultUlnConfig] = receiveDefaultConfig ?? [];
        // OApp Config
        const receiveOAppConfig = await (0, ua_devtools_evm_hardhat_2.getReceiveConfig)(endpointV2Sdk, to.eid, from.address);
        const sendOAppConfig = await (0, ua_devtools_evm_hardhat_2.getSendConfig)(endpointV2Sdk, to.eid, from.address);
        const [sendOAppLibrary, sendOAppUlnConfig, sendOAppExecutorConfig] = sendOAppConfig ?? [];
        const [receiveOAppLibrary, receiveOAppUlnConfig] = receiveOAppConfig ?? [];
        const localNetworkName = getEid(from.eid);
        const remoteNetworkName = getEid(to.eid);
        // Update the global state
        configs[localNetworkName] = {
            ...configs[localNetworkName],
            [remoteNetworkName]: {
                defaultSendLibrary: sendOAppLibrary,
                defaultReceiveLibrary: receiveOAppLibrary,
                sendUlnConfig: sendOAppUlnConfig,
                sendExecutorConfig: sendOAppExecutorConfig,
                receiveUlnConfig: receiveOAppUlnConfig,
            },
        };
        console.log((0, io_devtools_1.printCrossTable)([
            {
                localNetworkName,
                remoteNetworkName,
                sendLibrary: sendCustomLibrary,
                receiveLibrary: receiveCustomLibrary,
                sendUlnConfig: sendCustomUlnConfig,
                sendExecutorConfig: sendCustomExecutorConfig,
                receiveUlnConfig: receiveCustomUlnConfig,
            },
            {
                localNetworkName,
                remoteNetworkName,
                sendLibrary: sendDefaultLibrary,
                receiveLibrary: receiveDefaultLibrary,
                sendUlnConfig: sendDefaultUlnConfig,
                sendExecutorConfig: sendDefaultExecutorConfig,
                receiveUlnConfig: receiveDefaultUlnConfig,
            },
            {
                localNetworkName,
                remoteNetworkName,
                sendLibrary: sendOAppLibrary,
                receiveLibrary: receiveOAppLibrary,
                sendUlnConfig: sendOAppUlnConfig,
                sendExecutorConfig: sendOAppExecutorConfig,
                receiveUlnConfig: receiveOAppUlnConfig,
            },
        ], ['', 'Custom OApp Config', 'Default OApp Config', 'Active OApp Config']));
    });
    // Iterate over the graph of connections from Solana
    const solTasks = graph.connections
        .filter(({ vector: { from } }) => isSolana(from))
        .map(({ vector: { from, to } }) => async () => {
        const endpointV2Sdk = new protocol_devtools_solana_1.EndpointV2(await (0, utils_1.createSolanaConnectionFactory)()(from.eid), from, new web3_js_1.PublicKey(from.address) // doesn't matter as we are not sending transactions
        );
        // OApp Config
        const receiveOAppConfig = await (0, taskHelper_1.getSolanaReceiveConfig)(endpointV2Sdk, to.eid, from.address);
        const sendOAppConfig = await (0, taskHelper_1.getSolanaSendConfig)(endpointV2Sdk, to.eid, from.address);
        const [sendOAppLibrary, sendOAppUlnConfig, sendOAppExecutorConfig] = sendOAppConfig ?? [];
        const [receiveOAppLibrary, receiveOAppUlnConfig] = receiveOAppConfig ?? [];
        const localNetworkName = getEid(from.eid);
        const remoteNetworkName = getEid(to.eid);
        // Update the global state
        configs[localNetworkName] = {
            ...configs[localNetworkName],
            [remoteNetworkName]: {
                defaultSendLibrary: sendOAppLibrary,
                defaultReceiveLibrary: receiveOAppLibrary,
                sendUlnConfig: sendOAppUlnConfig,
                sendExecutorConfig: sendOAppExecutorConfig,
                receiveUlnConfig: receiveOAppUlnConfig,
            },
        };
        // Defaults are treated much differently in Solana, so we only output the active OApp config.
        console.log((0, io_devtools_1.printCrossTable)([
            {
                localNetworkName,
                remoteNetworkName,
                sendLibrary: sendOAppLibrary,
                receiveLibrary: receiveOAppLibrary,
                sendUlnConfig: sendOAppUlnConfig,
                sendExecutorConfig: sendOAppExecutorConfig,
                receiveUlnConfig: receiveOAppUlnConfig,
            },
        ], ['', 'Active OApp Config']));
    });
    // We allow this script to be executed either in parallel or in series
    const applicative = (0, devtools_1.createDefaultApplicative)(logger);
    await applicative(tasks);
    await applicative(solTasks);
    return configs;
};
(0, config_1.task)(ua_devtools_evm_hardhat_1.TASK_LZ_OAPP_CONFIG_GET, 'Outputs Custom OApp Config, Default OApp Config, and Active OApp Config. Each config contains Send & Receive Libraries, Send Uln & Executor Configs, and Receive Executor Configs', action);
