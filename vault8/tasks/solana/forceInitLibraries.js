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
    logger.info(`Force initializing send/receive libraries for remote EID ${remoteEid}`);
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
    logger.info(`\nInitializing send library...`);
    const sendLibTxs = await sdk.initializeSendLibrary(remoteEid);
    if (sendLibTxs.length > 0) {
        logger.info(`Transaction created for send library`);
        const signedTx = await sdk.sign(sendLibTxs[0]);
        const result = await sdk.submit(signedTx);
        logger.info(`✅ Send library initialized: ${result}`);
    }
    else {
        logger.info(`Send library already initialized or no transaction needed`);
    }
    logger.info(`\nInitializing receive library...`);
    const receiveLibTxs = await sdk.initializeReceiveLibrary(remoteEid);
    if (receiveLibTxs.length > 0) {
        logger.info(`Transaction created for receive library`);
        const signedTx = await sdk.sign(receiveLibTxs[0]);
        const result = await sdk.submit(signedTx);
        logger.info(`✅ Receive library initialized: ${result}`);
    }
    else {
        logger.info(`Receive library already initialized or no transaction needed`);
    }
    logger.info(`\n✅ Done! Libraries should now be registered with the Endpoint.`);
    logger.info(`Verify with: node check-libraries.js`);
};
(0, config_1.task)('lz:oapp:solana:force-init-libraries', 'Force initialize send/receive libraries for a remote EID')
    .addParam('remoteEid', 'Remote endpoint ID (e.g., 40245 for Base Sepolia)')
    .setAction(action);
