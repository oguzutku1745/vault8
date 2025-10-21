"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const io_devtools_1 = require("@layerzerolabs/io-devtools");
const index_1 = require("./index");
const factory_1 = require("../../lib/factory");
const web3_js_1 = require("@solana/web3.js");
const action = async ({ remoteEid, peerAddress }, hre) => {
    const logger = (0, io_devtools_1.createLogger)();
    logger.info(`Force setting peer for remote EID ${remoteEid} to ${peerAddress}`);
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
    // Check if peer already exists
    const hasPeer = await sdk.hasPeer(remoteEid, peerAddress);
    logger.info(`Peer already set: ${hasPeer}`);
    if (hasPeer) {
        logger.info(`✅ Peer is already correctly set, nothing to do`);
        return;
    }
    // Set the peer
    logger.info(`Setting peer for EID ${remoteEid} to ${peerAddress}...`);
    const tx = await sdk.setPeer(remoteEid, peerAddress);
    if (!tx) {
        logger.error(`Failed to create set peer transaction`);
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
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Verify
    const hasPeerAfter = await sdk.hasPeer(remoteEid, peerAddress);
    logger.info(`\n=== Verification ===`);
    logger.info(`Peer correctly set: ${hasPeerAfter}`);
    if (hasPeerAfter) {
        logger.info(`✅ Success! Peer has been set.`);
    }
    else {
        logger.error(`❌ Peer was not set. Check the transaction.`);
    }
};
(0, config_1.task)('lz:oapp:solana:force-set-peer', 'Force set peer for a remote EID on Solana OApp')
    .addParam('remoteEid', 'Remote endpoint ID (e.g., 40245 for Base Sepolia)')
    .addParam('peerAddress', 'Peer OApp address on the remote chain (EVM address for Base)')
    .setAction(action);
