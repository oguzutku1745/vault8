"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEidsInLzConfig = exports.ERRORS_FIXES_MAP = exports.KnownErrors = exports.DebugLogger = exports.createSolanaSignerFactory = exports.createSdkFactory = exports.createSolanaConnectionFactory = void 0;
exports.uint8ArrayToHex = uint8ArrayToHex;
exports.decodeLzReceiveOptions = decodeLzReceiveOptions;
exports.getSolanaUlnConfigPDAs = getSolanaUlnConfigPDAs;
exports.isSolanaEid = isSolanaEid;
exports.isEvmEid = isEvmEid;
const assert_1 = __importDefault(require("assert"));
const web3_js_1 = require("@solana/web3.js");
const devtools_1 = require("@layerzerolabs/devtools");
const devtools_evm_hardhat_1 = require("@layerzerolabs/devtools-evm-hardhat");
const devtools_solana_1 = require("@layerzerolabs/devtools-solana");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const lz_solana_sdk_v2_1 = require("@layerzerolabs/lz-solana-sdk-v2");
const lz_v2_utilities_1 = require("@layerzerolabs/lz-v2-utilities");
const ua_devtools_evm_1 = require("@layerzerolabs/ua-devtools-evm");
const ua_devtools_evm_hardhat_1 = require("@layerzerolabs/ua-devtools-evm-hardhat");
const factory_1 = require("../../lib/factory");
const aptos_1 = require("../aptos");
const createSolanaConnectionFactory = () => (0, devtools_solana_1.createConnectionFactory)((0, devtools_solana_1.createRpcUrlFactory)({
    [lz_definitions_1.EndpointId.SOLANA_V2_MAINNET]: process.env.RPC_URL_SOLANA,
    [lz_definitions_1.EndpointId.SOLANA_V2_TESTNET]: process.env.RPC_URL_SOLANA_TESTNET,
}));
exports.createSolanaConnectionFactory = createSolanaConnectionFactory;
const createSdkFactory = (userAccount, programId, connectionFactory = (0, exports.createSolanaConnectionFactory)()) => {
    // To create a EVM/Solana SDK factory we need to merge the EVM and the Solana factories into one
    //
    // We do this by using the firstFactory helper function that is provided by the devtools package.
    // This function will try to execute the factories one by one and return the first one that succeeds.
    const evmSdkfactory = (0, ua_devtools_evm_1.createOAppFactory)((0, devtools_evm_hardhat_1.createConnectedContractFactory)());
    const aptosSdkFactory = (0, aptos_1.createAptosOAppFactory)();
    const solanaSdkFactory = (0, factory_1.createSimpleOAppFactory)(
    // The first parameter to createOFTFactory is a user account factory
    //
    // This is a function that receives an OmniPoint ({ eid, address } object)
    // and returns a user account to be used with that SDK.
    //
    // For our purposes this will always be the user account coming from the secret key passed in
    () => userAccount, 
    // The second parameter is a program ID factory
    //
    // This is a function that receives an OmniPoint ({ eid, address } object)
    // and returns a program ID to be used with that SDK.
    //
    // Since we only have one OFT deployed, this will always be the program ID passed as a CLI parameter.
    //
    // In situations where we might have multiple configs with OFTs using multiple program IDs,
    // this function needs to decide which one to use.
    () => programId, 
    // Last but not least the SDK will require a connection
    connectionFactory);
    // We now "merge" the two SDK factories into one.
    //
    // We do this by using the firstFactory helper function that is provided by the devtools package.
    // This function will try to execute the factories one by one and return the first one that succeeds.
    return async (point) => {
        if ((0, lz_definitions_1.endpointIdToChainType)(point.eid) === lz_definitions_1.ChainType.SOLANA) {
            return solanaSdkFactory(point);
        }
        else if ((0, lz_definitions_1.endpointIdToChainType)(point.eid) === lz_definitions_1.ChainType.EVM) {
            return evmSdkfactory(point);
        }
        else if ((0, lz_definitions_1.endpointIdToChainType)(point.eid) === lz_definitions_1.ChainType.APTOS ||
            (0, lz_definitions_1.endpointIdToChainType)(point.eid) === lz_definitions_1.ChainType.INITIA) {
            return aptosSdkFactory(point);
        }
        else {
            console.error(`Unsupported chain type for EID ${point.eid}`);
            throw new Error(`Unsupported chain type for EID ${point.eid}`);
        }
    };
};
exports.createSdkFactory = createSdkFactory;
const createSolanaSignerFactory = (wallet, connectionFactory = (0, exports.createSolanaConnectionFactory)(), multisigKey) => {
    return async (eid) => {
        (0, assert_1.default)((0, lz_definitions_1.endpointIdToChainType)(eid) === lz_definitions_1.ChainType.SOLANA, `Solana signer factory can only create signers for Solana networks. Received ${(0, devtools_1.formatEid)(eid)}`);
        return multisigKey
            ? new devtools_solana_1.OmniSignerSolanaSquads(eid, await connectionFactory(eid), multisigKey, wallet)
            : new devtools_solana_1.OmniSignerSolana(eid, await connectionFactory(eid), wallet);
    };
};
exports.createSolanaSignerFactory = createSolanaSignerFactory;
function uint8ArrayToHex(uint8Array, prefix = false) {
    const hexString = Buffer.from(uint8Array).toString('hex');
    return prefix ? `0x${hexString}` : hexString;
}
function formatBigIntForDisplay(n) {
    return n.toLocaleString().replace(/,/g, '_');
}
function decodeLzReceiveOptions(hex) {
    try {
        // Handle empty/undefined values first
        if (!hex || hex === '0x')
            return 'No options set';
        const options = lz_v2_utilities_1.Options.fromOptions(hex);
        const lzReceiveOpt = options.decodeExecutorLzReceiveOption();
        return lzReceiveOpt
            ? `gas: ${formatBigIntForDisplay(lzReceiveOpt.gas)} , value: ${formatBigIntForDisplay(lzReceiveOpt.value)} wei`
            : 'No executor options';
    }
    catch (e) {
        return `Invalid options (${hex.slice(0, 12)}...)`;
    }
}
async function getSolanaUlnConfigPDAs(remote, connection, ulnAddress, oappPda) {
    const uln = new lz_solana_sdk_v2_1.UlnProgram.Uln(new web3_js_1.PublicKey(ulnAddress));
    const sendConfig = uln.getSendConfigState(connection, new web3_js_1.PublicKey(oappPda), remote);
    const receiveConfig = uln.getReceiveConfigState(connection, new web3_js_1.PublicKey(oappPda), remote);
    return await Promise.all([sendConfig, receiveConfig]);
}
class DebugLogger {
    static keyValue(key, value, indentLevel = 0) {
        const indent = ' '.repeat(indentLevel * 2);
        console.log(`${indent}\x1b[33m${key}:\x1b[0m ${value}`);
    }
    static keyHeader(key, indentLevel = 0) {
        const indent = ' '.repeat(indentLevel * 2);
        console.log(`${indent}\x1b[33m${key}:\x1b[0m`);
    }
    static header(text) {
        console.log(`\x1b[36m${text}\x1b[0m`);
    }
    static separator() {
        console.log('\x1b[90m----------------------------------------\x1b[0m');
    }
    /**
     * Logs an error (in red) and corresponding fix suggestion (in blue).
     * Uses the ERRORS_FIXES_MAP to retrieve text based on the known error type.
     *
     * @param type Required KnownErrors enum member
     * @param errorMsg Optional string message to append to the error.
     */
    static printErrorAndFixSuggestion(type, errorMsg) {
        const fixInfo = exports.ERRORS_FIXES_MAP[type];
        if (!fixInfo) {
            // Fallback if the error type is not recognized
            console.log(`\x1b[31mError:\x1b[0m Unknown error type "${type}"`);
            return;
        }
        // If errorMsg is specified, append it in parentheses
        const errorOutput = errorMsg ? `${type}: (${errorMsg})` : type;
        // Print the error type in red
        console.log(`\x1b[31mError:\x1b[0m ${errorOutput}`);
        // Print the tip in green
        console.log(`\x1b[32mFix suggestion:\x1b[0m ${fixInfo.tip}`);
        // Print the info in blue
        if (fixInfo.info) {
            console.log(`\x1b[34mElaboration:\x1b[0m ${fixInfo.info}`);
        }
        // log empty line to separate error messages
        console.log();
    }
}
exports.DebugLogger = DebugLogger;
var KnownErrors;
(function (KnownErrors) {
    // variable name format: <DOMAIN>_<REASON>
    // e.g. If the user forgets to deploy the OFT Program, the variable name should be:
    // FIX_SUGGESTION_OFT_PROGRAM_NOT_DEPLOYED
    KnownErrors["ULN_INIT_CONFIG_SKIPPED"] = "ULN_INIT_CONFIG_SKIPPED";
    KnownErrors["SOLANA_DEPLOYMENT_NOT_FOUND"] = "SOLANA_DEPLOYMENT_NOT_FOUND";
})(KnownErrors || (exports.KnownErrors = KnownErrors = {}));
exports.ERRORS_FIXES_MAP = {
    [KnownErrors.ULN_INIT_CONFIG_SKIPPED]: {
        tip: 'Did you run `npx hardhat lz:oft:solana:init-config --oapp-config <LZ_CONFIG_FILE_NAME> --solana-eid <SOLANA_EID>` ?',
        info: 'You must run lz:oft:solana:init-config once before you run lz:oapp:wire. If you have added new pathways, you must also run lz:oft:solana:init-config again.',
    },
    // TODO: verify below (was copied from OFT)
    [KnownErrors.SOLANA_DEPLOYMENT_NOT_FOUND]: {
        tip: 'Did you run `npx hardhat lz:oapp:solana:create` ?',
        info: 'The Solana deployment file is required to run config tasks. The default path is ./deployments/solana-<mainnet/testnet>/OApp.json',
    },
};
const listEidsInLzConfig = async (hre, oappConfig) => {
    if (!oappConfig)
        throw new Error('Missing oappConfig');
    let graph;
    try {
        graph = await hre.run(ua_devtools_evm_hardhat_1.SUBTASK_LZ_OAPP_CONFIG_LOAD, {
            configPath: oappConfig,
            schema: ua_devtools_evm_hardhat_1.OAppOmniGraphHardhatSchema,
            task: ua_devtools_evm_hardhat_1.TASK_LZ_OAPP_CONFIG_GET,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to load OApp configuration: ${error.message}`);
        }
        else {
            throw new Error('Failed to load OApp configuration: Unknown error');
        }
    }
    // init a Set
    const eids = new Set();
    // loop through the connections and add the eids to the Set
    for (const { vector } of graph.connections) {
        eids.add(vector.from.eid);
        eids.add(vector.to.eid);
    }
    return Array.from(eids);
};
exports.listEidsInLzConfig = listEidsInLzConfig;
function isSolanaEid(eid) {
    return (0, lz_definitions_1.endpointIdToChainType)(eid) === lz_definitions_1.ChainType.SOLANA;
}
function isEvmEid(eid) {
    return (0, lz_definitions_1.endpointIdToChainType)(eid) === lz_definitions_1.ChainType.EVM;
}
