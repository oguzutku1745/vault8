"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const io_devtools_1 = require("@layerzerolabs/io-devtools");
const index_1 = require("./index");
const factory_1 = require("../../lib/factory");
const web3_js_1 = require("@solana/web3.js");
const action = async ({ remoteEid }, hre) => {
    const logger = (0, io_devtools_1.createLogger)();
    logger.info(`Force initializing ULN configs for remote EID ${remoteEid}`);
    // Get Solana deployment
    const { programId, oapp } = (0, index_1.getSolanaDeployment)(lz_definitions_1.EndpointId.SOLANA_V2_TESTNET);
    logger.info(`Solana OApp: ${oapp}`);
    logger.info(`Program ID: ${programId}`);
    // Get connection and keypair
    const { connection } = await (0, index_1.deriveConnection)(lz_definitions_1.EndpointId.SOLANA_V2_TESTNET, false);
    const { web3JsKeypair } = await (0, index_1.useWeb3Js)();
    // Create SDK factory with proper parameters
    const userAccountFactory = async () => web3JsKeypair.publicKey;
    const programIdFactory = async () => new web3_js_1.PublicKey(programId);
    const connectionFactory = async () => connection;
    const factory = (0, factory_1.createSimpleOAppFactory)(userAccountFactory, programIdFactory, connectionFactory);
    // Create SDK instance
    const point = {
        eid: lz_definitions_1.EndpointId.SOLANA_V2_TESTNET,
        address: oapp,
    };
    const sdk = await factory(point);
    // Check if configs exist
    const sendConfigExists = await sdk.sendConfigIsInitialized(remoteEid);
    const receiveConfigExists = await sdk.receiveConfigIsInitialized(remoteEid);
    logger.info(`Send config exists: ${sendConfigExists}`);
    logger.info(`Receive config exists: ${receiveConfigExists}`);
    if (sendConfigExists && receiveConfigExists) {
        logger.info(`✅ Both configs already exist, nothing to do`);
        return;
    }
    // Initialize config
    logger.info(`Initializing configs for EID ${remoteEid}...`);
    const tx = await sdk.initConfig(remoteEid);
    if (!tx) {
        logger.error(`Failed to create init config transaction`);
        return;
    }
    logger.info(`Transaction created: ${tx.description}`);
    logger.info(`Executing transaction...`);
    // Execute the transaction
    const signedTx = await sdk.sign(tx);
    const result = await sdk.submit(signedTx);
    logger.info(`✅ Transaction submitted: ${result}`);
    logger.info(`Waiting for confirmation...`);
    // Wait a bit for confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Verify
    const sendConfigExistsAfter = await sdk.sendConfigIsInitialized(remoteEid);
    const receiveConfigExistsAfter = await sdk.receiveConfigIsInitialized(remoteEid);
    logger.info(`\n=== Verification ===`);
    logger.info(`Send config exists: ${sendConfigExistsAfter}`);
    logger.info(`Receive config exists: ${receiveConfigExistsAfter}`);
    if (sendConfigExistsAfter && receiveConfigExistsAfter) {
        logger.info(`✅ Success! Both configs have been created.`);
    }
    else {
        logger.error(`❌ Configs were not created. Check the transaction.`);
    }
};
(0, config_1.task)('lz:oapp:solana:force-init-config', 'Force initialize ULN send/receive configs for a remote EID')
    .addParam('remoteEid', 'Remote endpoint ID (e.g., 40245 for Base Sepolia)')
    .setAction(action);
