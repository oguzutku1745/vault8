"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("hardhat/config");
const devtools_1 = require("@layerzerolabs/devtools");
const devtools_evm_hardhat_1 = require("@layerzerolabs/devtools-evm-hardhat");
const devtools_solana_1 = require("@layerzerolabs/devtools-solana");
const io_devtools_1 = require("@layerzerolabs/io-devtools");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const ua_devtools_1 = require("@layerzerolabs/ua-devtools");
const ua_devtools_evm_hardhat_1 = require("@layerzerolabs/ua-devtools-evm-hardhat");
const aptos_1 = require("../aptos");
const solana_1 = require("../solana");
const utils_1 = require("../solana/utils");
const types_1 = require("./types");
const utils_2 = require("./utils");
/**
 * We extend the default wiring task to add functionality required by Solana
 */
(0, config_1.task)(ua_devtools_evm_hardhat_1.TASK_LZ_OAPP_WIRE)
    .addParam('multisigKey', 'The MultiSig key', undefined, types_1.publicKey, true)
    // We use this argument to get around the fact that we want to both override the task action for the wiring task
    // and wrap this task with custom configurators
    //
    // By default, this argument will be left empty and the default OApp configurator will be used.
    // The tasks that are using custom configurators will override this argument with the configurator of their choice
    .addParam('internalConfigurator', 'FOR INTERNAL USE ONLY', undefined, devtools_evm_hardhat_1.types.fn, true)
    .addParam('isSolanaInitConfig', 'FOR INTERNAL USE ONLY', undefined, devtools_evm_hardhat_1.types.boolean, true)
    .setAction(async (args, hre, runSuper) => {
    const logger = (0, io_devtools_1.createLogger)(args.logLevel);
    //
    //
    // ENVIRONMENT SETUP
    //
    //
    // The Solana transaction size estimation algorithm is not very accurate, so we increase its tolerance by 192 bytes
    (0, devtools_solana_1.setTransactionSizeBuffer)(192);
    //
    //
    // USER INPUT
    //
    //
    // construct the user's keypair via the SOLANA_PRIVATE_KEY env var
    const keypair = (await (0, solana_1.useWeb3Js)()).web3JsKeypair; // note: this can be replaced with getSolanaKeypair() if we are okay to export that
    const userAccount = keypair.publicKey;
    const solanaEid = await (0, utils_1.findSolanaEndpointIdInGraph)(hre, args.oappConfig);
    const solanaDeployment = (0, solana_1.getSolanaDeployment)(solanaEid);
    // Then we grab the programId from the args
    const programId = new web3_js_1.PublicKey(solanaDeployment.programId);
    // TODO: refactor to instead use a function such as verifySolanaDeployment that also checks for oapp key
    if (!programId) {
        logger.error('Missing programId in solana deployment');
        return;
    }
    const configurator = args.internalConfigurator;
    //
    //
    // TOOLING SETUP
    //
    //
    // We'll need a connection factory to be able to query the Solana network
    //
    // If you haven't set RPC_URL_SOLANA and/or RPC_URL_SOLANA_TESTNET environment variables,
    // the factory will use the default public RPC URLs
    const connectionFactory = (0, utils_2.createSolanaConnectionFactory)();
    // We'll need SDKs to be able to use devtools
    const sdkFactory = (0, utils_2.createSdkFactory)(userAccount, programId, connectionFactory);
    // We'll also need a signer factory
    const solanaSignerFactory = (0, utils_2.createSolanaSignerFactory)(keypair, connectionFactory, args.multisigKey);
    const aptosSignerFactory = (0, aptos_1.createAptosSignerFactory)();
    //
    //
    // SUBTASK OVERRIDES
    //
    //
    // We'll need to override the default implementation of the configure subtask
    // (responsible for collecting the on-chain configuration of the contracts
    // and coming up with the transactions that need to be sent to the network)
    //
    // The only thing we are overriding is the sdkFactory parameter - we supply the SDK factory we created above
    (0, config_1.subtask)(ua_devtools_evm_hardhat_1.SUBTASK_LZ_OAPP_WIRE_CONFIGURE, 'Configure OFT', async (subtaskArgs, _hre, runSuper) => {
        // start of pre-wiring checks. we only do this when the current task is wire. if the current task is init-config, we shouldn't run this.
        if (!args.isSolanaInitConfig) {
            logger.debug('Running pre-wiring checks...');
            const { graph } = subtaskArgs;
            for (const connection of graph.connections) {
                // check if from Solana Endpoint
                if ((0, lz_definitions_1.endpointIdToChainType)(connection.vector.from.eid) === lz_definitions_1.ChainType.SOLANA) {
                    if (connection.config?.sendLibrary) {
                        // if from Solana Endpoint, ensure the PeerConfig account was already initialized
                        const solanaConnection = await connectionFactory(connection.vector.from.eid);
                        const [sendConfig, receiveConfig] = await (0, utils_2.getSolanaUlnConfigPDAs)(connection.vector.to.eid, solanaConnection, new web3_js_1.PublicKey(connection.config.sendLibrary), new web3_js_1.PublicKey(solanaDeployment.oapp));
                        if (sendConfig == null) {
                            utils_2.DebugLogger.printErrorAndFixSuggestion(utils_2.KnownErrors.ULN_INIT_CONFIG_SKIPPED, `SendConfig on ${connection.vector.from.eid} not initialized for remote ${connection.vector.to.eid}.`);
                        }
                        if (receiveConfig == null) {
                            utils_2.DebugLogger.printErrorAndFixSuggestion(utils_2.KnownErrors.ULN_INIT_CONFIG_SKIPPED, `ReceiveConfig on ${connection.vector.from.eid} not initialized for remote ${connection.vector.to.eid}.`);
                        }
                        if (sendConfig == null || receiveConfig == null) {
                            throw new Error('SendConfig or ReceiveConfig not initialized. ');
                        }
                    }
                    else {
                        logger.debug(`No sendLibrary found in connection config for ${connection.vector.from.eid} -> ${connection.vector.to.eid}`);
                    }
                }
            }
            // end of pre-wiring checks
        }
        return runSuper({
            ...subtaskArgs,
            configurator: configurator ?? subtaskArgs.configurator,
            sdkFactory,
            graph: {
                ...subtaskArgs.graph,
                contracts: subtaskArgs.graph.contracts.filter((contract) => {
                    const chainType = (0, lz_definitions_1.endpointIdToChainType)(contract.point.eid);
                    return chainType !== lz_definitions_1.ChainType.APTOS && chainType !== lz_definitions_1.ChainType.INITIA;
                }),
                connections: subtaskArgs.graph.connections.filter((connection) => {
                    const fromChainType = (0, lz_definitions_1.endpointIdToChainType)(connection.vector.from.eid);
                    return fromChainType !== lz_definitions_1.ChainType.APTOS && fromChainType !== lz_definitions_1.ChainType.INITIA;
                }),
            },
        });
    });
    // We'll also need to override the default implementation of the signAndSend subtask
    // (responsible for sending transactions to the network and waiting for confirmations)
    //
    // In this subtask we need to override the createSigner function so that it uses the Solana
    // signer for all Solana transactions
    (0, config_1.subtask)(devtools_evm_hardhat_1.SUBTASK_LZ_SIGN_AND_SEND, 'Sign OFT transactions', (args, _hre, runSuper) => runSuper({
        ...args,
        createSigner: (0, devtools_1.firstFactory)(aptosSignerFactory, solanaSignerFactory, args.createSigner),
    }));
    return runSuper(args);
});
// We'll change the default ownership transfer task to use our wire implementation
//
// The reason for this is the fact that the ownership transfer task has a deficiency
// and that is the fact that it does not support a custom SDK factory as of yet
//
// The two tasks are identical and the only drawback of this approach is the fact
// that the logs will say "Wiring OApp" instead of "Transferring ownership"
(0, config_1.task)(ua_devtools_evm_hardhat_1.TASK_LZ_OWNABLE_TRANSFER_OWNERSHIP)
    .addParam('multisigKey', 'The MultiSig key', undefined, types_1.publicKey, true)
    .setAction(async (args, hre) => {
    return hre.run(ua_devtools_evm_hardhat_1.TASK_LZ_OAPP_WIRE, { ...args, internalConfigurator: ua_devtools_1.configureOwnable });
});
