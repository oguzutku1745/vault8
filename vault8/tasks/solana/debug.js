"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const umi_1 = require("@metaplex-foundation/umi");
const umi_web3js_adapters_1 = require("@metaplex-foundation/umi-web3js-adapters");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("hardhat/config");
const devtools_1 = require("@layerzerolabs/devtools");
const devtools_evm_hardhat_1 = require("@layerzerolabs/devtools-evm-hardhat");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const lz_solana_sdk_v2_1 = require("@layerzerolabs/lz-solana-sdk-v2");
const protocol_devtools_solana_1 = require("@layerzerolabs/protocol-devtools-solana");
const client_1 = require("../../lib/client");
const taskHelper_1 = require("../common/taskHelper");
const utils_1 = require("../common/utils");
const index_1 = require("./index");
const DEBUG_ACTIONS = {
    STORE: 'store',
    GET_ADMIN: 'admin',
    GET_DELEGATE: 'delegate',
    CHECKS: 'checks',
    GET_PEERS: 'peers',
};
const getStore = (eid, store) => (0, umi_1.publicKey)(store ?? (0, index_1.getSolanaOAppAddress)(eid));
(0, config_1.task)('lz:oapp:solana:debug', 'Prints OApp Store and Peer information')
    .addParam('eid', 'Solana mainnet (30168) or testnet (40168).  Defaults to mainnet.', lz_definitions_1.EndpointId.SOLANA_V2_MAINNET, devtools_evm_hardhat_1.types.eid)
    .addParam('store', 'The Store public key. Derived from deployments if not provided.', undefined, devtools_evm_hardhat_1.types.string, true)
    .addParam('endpoint', 'The Endpoint public key', lz_solana_sdk_v2_1.EndpointProgram.PROGRAM_ID.toBase58(), devtools_evm_hardhat_1.types.string)
    .addOptionalParam('dstEids', 'Destination eids to check (comma-separated list)', [], devtools_evm_hardhat_1.types.csv)
    .addOptionalParam('action', `The action to perform: ${Object.keys(DEBUG_ACTIONS).join(', ')} (defaults to all)`, undefined, devtools_evm_hardhat_1.types.string)
    .setAction(async (taskArgs) => {
    const { eid, store: storeArg, endpoint, dstEids, action } = taskArgs;
    const { umi, connection } = await (0, index_1.deriveConnection)(eid, true);
    const store = getStore(eid, storeArg);
    let storeInfo;
    try {
        storeInfo = await client_1.myoapp.accounts.fetchStore(umi, store);
    }
    catch (e) {
        console.error(`Failed to fetch Store at ${store.toString()}:`, e);
        return;
    }
    const epDeriver = new lz_solana_sdk_v2_1.EndpointPDADeriver(new web3_js_1.PublicKey(endpoint));
    const [oAppRegistry] = epDeriver.oappRegistry((0, umi_web3js_adapters_1.toWeb3JsPublicKey)(store));
    const oAppRegistryInfo = await lz_solana_sdk_v2_1.EndpointProgram.accounts.OAppRegistry.fromAccountAddress(connection, oAppRegistry);
    if (!oAppRegistryInfo) {
        console.warn('OAppRegistry info not found.');
        return;
    }
    const oappDeriver = new client_1.MyOAppPDA(storeInfo.header.owner);
    const printStore = async () => {
        utils_1.DebugLogger.header('Store Information');
        utils_1.DebugLogger.keyValue('Owner', storeInfo.header.owner);
        utils_1.DebugLogger.keyValue('Admin', storeInfo.admin);
        utils_1.DebugLogger.keyValue('Endpoint Program', storeInfo.endpointProgram);
        utils_1.DebugLogger.keyValue('String', storeInfo.string);
        utils_1.DebugLogger.separator();
    };
    const printAdmin = async () => {
        const admin = storeInfo.admin;
        utils_1.DebugLogger.keyValue('Admin', admin);
    };
    const printDelegate = async () => {
        const delegate = oAppRegistryInfo?.delegate?.toBase58();
        utils_1.DebugLogger.header('OApp Registry Information');
        utils_1.DebugLogger.keyValue('Delegate', delegate);
        utils_1.DebugLogger.separator();
    };
    const printChecks = async () => {
        const delegate = oAppRegistryInfo?.delegate?.toBase58();
        utils_1.DebugLogger.header('Checks');
        utils_1.DebugLogger.keyValue('Admin (Owner) same as Delegate', storeInfo.admin === delegate);
        utils_1.DebugLogger.separator();
    };
    const printPeerConfigs = async () => {
        const peerConfigs = dstEids.map((dstEid) => {
            const peerConfig = oappDeriver.peer(dstEid);
            return (0, umi_1.publicKey)(peerConfig);
        });
        const mockKeypair = new web3_js_1.Keypair();
        const point = {
            eid,
            address: store.toString(),
        };
        const endpointV2Sdk = new protocol_devtools_solana_1.EndpointV2(await (0, utils_1.createSolanaConnectionFactory)()(eid), point, mockKeypair.publicKey // doesn't matter as we are not sending transactions
        );
        utils_1.DebugLogger.header('Peer Configurations');
        const peerConfigInfos = await client_1.myoapp.accounts.fetchAllPeerConfig(umi, peerConfigs);
        for (let index = 0; index < dstEids.length; index++) {
            const dstEid = dstEids[index];
            const info = peerConfigInfos[index];
            const network = (0, lz_definitions_1.getNetworkForChainId)(dstEid);
            const oAppReceiveConfig = await (0, taskHelper_1.getSolanaReceiveConfig)(endpointV2Sdk, dstEid, store);
            const oAppSendConfig = await (0, taskHelper_1.getSolanaSendConfig)(endpointV2Sdk, dstEid, store);
            // Show the chain info
            utils_1.DebugLogger.header(`${dstEid} (${network.chainName})`);
            if (info) {
                // Existing PeerConfig info
                utils_1.DebugLogger.keyValue('PeerConfig Account', peerConfigs[index].toString());
                utils_1.DebugLogger.keyValue('Peer Address', (0, devtools_1.denormalizePeer)(info.peerAddress, dstEid));
                utils_1.DebugLogger.keyHeader('Enforced Options');
                utils_1.DebugLogger.keyValue('Send', (0, utils_1.decodeLzReceiveOptions)((0, utils_1.uint8ArrayToHex)(info.enforcedOptions.send, true)), 2);
                utils_1.DebugLogger.keyValue('SendAndCall', (0, utils_1.decodeLzReceiveOptions)((0, utils_1.uint8ArrayToHex)(info.enforcedOptions.sendAndCall, true)), 2);
                printOAppReceiveConfigs(oAppReceiveConfig, network.chainName);
                printOAppSendConfigs(oAppSendConfig, network.chainName);
            }
            else {
                // No PeerConfig account
                console.log(`No PeerConfig account found for ${dstEid} (${network.chainName}).`);
            }
            utils_1.DebugLogger.separator();
        }
    };
    if (action) {
        switch (action) {
            case DEBUG_ACTIONS.STORE:
                await printStore();
                break;
            case DEBUG_ACTIONS.GET_ADMIN:
                await printAdmin();
                break;
            case DEBUG_ACTIONS.GET_DELEGATE:
                await printDelegate();
                break;
            case DEBUG_ACTIONS.CHECKS:
                await printChecks();
                break;
            case DEBUG_ACTIONS.GET_PEERS:
                await printPeerConfigs();
                break;
            default:
                console.error(`Invalid action specified. Use any of ${Object.keys(DEBUG_ACTIONS)}.`);
        }
    }
    else {
        await printStore();
        await printDelegate();
        if (dstEids.length > 0)
            await printPeerConfigs();
        await printChecks();
    }
});
function printOAppReceiveConfigs(oAppReceiveConfig, peerChainName) {
    const oAppReceiveConfigIndexesToKeys = {
        0: 'receiveLibrary',
        1: 'receiveUlnConfig',
        2: 'receiveLibraryTimeoutConfig',
    };
    if (!oAppReceiveConfig) {
        console.log('No receive configs found.');
        return;
    }
    utils_1.DebugLogger.keyValue(`Receive Configs (${peerChainName} to solana)`, '');
    for (let i = 0; i < oAppReceiveConfig.length; i++) {
        const item = oAppReceiveConfig[i];
        if (typeof item === 'object' && item !== null) {
            // Print each property in the object
            utils_1.DebugLogger.keyValue(`${oAppReceiveConfigIndexesToKeys[i]}`, '', 2);
            for (const [propKey, propVal] of Object.entries(item)) {
                utils_1.DebugLogger.keyValue(`${propKey}`, String(propVal), 3);
            }
        }
        else {
            // Print a primitive (string, number, etc.)
            utils_1.DebugLogger.keyValue(`${oAppReceiveConfigIndexesToKeys[i]}`, String(item), 2);
        }
    }
}
function printOAppSendConfigs(oAppSendConfig, peerChainName) {
    const sendOappConfigIndexesToKeys = {
        0: 'sendLibrary',
        1: 'sendUlnConfig',
        2: 'sendExecutorConfig',
    };
    if (!oAppSendConfig) {
        console.log('No send configs found.');
        return;
    }
    utils_1.DebugLogger.keyValue(`Send Configs (solana to ${peerChainName})`, '');
    for (let i = 0; i < oAppSendConfig.length; i++) {
        const item = oAppSendConfig[i];
        if (typeof item === 'object' && item !== null) {
            utils_1.DebugLogger.keyValue(`${sendOappConfigIndexesToKeys[i]}`, '', 2);
            for (const [propKey, propVal] of Object.entries(item)) {
                utils_1.DebugLogger.keyValue(`${propKey}`, String(propVal), 3);
            }
        }
        else {
            utils_1.DebugLogger.keyValue(`${sendOappConfigIndexesToKeys[i]}`, String(item), 2);
        }
    }
}
