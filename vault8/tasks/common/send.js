"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const umi_1 = require("@metaplex-foundation/umi");
const bs58_1 = __importDefault(require("bs58"));
const config_1 = require("hardhat/config");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const lz_v2_utilities_1 = require("@layerzerolabs/lz-v2-utilities");
const client_1 = require("../../lib/client");
const index_1 = require("../solana/index");
const utils_1 = require("../utils");
const action = async ({ fromEid, dstEid, message, computeUnitPriceScaleFactor, contractName }, hre) => {
    if ((0, lz_definitions_1.endpointIdToChainType)(fromEid) === lz_definitions_1.ChainType.SOLANA) {
        await sendFromSolana(fromEid, dstEid, message, computeUnitPriceScaleFactor);
    }
    else if ((0, lz_definitions_1.endpointIdToChainType)(fromEid) === lz_definitions_1.ChainType.EVM) {
        await sendFromEvm(dstEid, message, contractName, hre);
    }
    else {
        throw new Error(`Unsupported ChainType for fromEid ${fromEid}`);
    }
};
async function sendFromSolana(fromEid, dstEid, message, computeUnitPriceScaleFactor) {
    const solanaEid = fromEid;
    const solanaDeployment = (0, index_1.getSolanaDeployment)(solanaEid);
    const { connection, umi, umiWalletSigner } = await (0, index_1.deriveConnection)(solanaEid);
    const myoappInstance = new client_1.myoapp.MyOApp((0, umi_1.publicKey)(solanaDeployment.programId));
    const options = lz_v2_utilities_1.Options.newOptions().toBytes(); // leaving empty, relying on enforced options instead
    const { nativeFee } = await myoappInstance.quote(umi.rpc, umiWalletSigner.publicKey, {
        dstEid,
        message,
        options,
        payInLzToken: false,
    });
    console.log('🔖 Native fee quoted:', nativeFee.toString());
    let txBuilder = (0, umi_1.transactionBuilder)().add(await myoappInstance.send(umi.rpc, umiWalletSigner.publicKey, {
        dstEid,
        message,
        options,
        nativeFee,
    }));
    txBuilder = await (0, index_1.addComputeUnitInstructions)(connection, umi, fromEid, txBuilder, umiWalletSigner, computeUnitPriceScaleFactor, index_1.TransactionType.SendMessage);
    const tx = await txBuilder.sendAndConfirm(umi);
    const txHash = bs58_1.default.encode(tx.signature);
    console.log('✉️  Cross-chain message:', `"${message}"`, '→ endpointId', dstEid);
    console.log('🧾 Transaction hash:', txHash);
    console.log('🌐 Track transfer:', (0, utils_1.getLayerZeroScanLink)(txHash, (0, utils_1.isV2Testnet)(dstEid)));
}
async function sendFromEvm(dstEid, message, contractName, hre) {
    const signer = await hre.ethers.getNamedSigner('deployer');
    // @ts-expect-error signer is fine
    const myOApp = (await hre.ethers.getContract(contractName)).connect(signer);
    const options = lz_v2_utilities_1.Options.newOptions().toHex().toString(); // leaving empty, relying on enforced options instead
    const [nativeFee] = await myOApp.quote(dstEid, message, options, false);
    console.log('🔖 Native fee quoted:', nativeFee.toString());
    const txResponse = await myOApp.send(dstEid, message, options, {
        value: nativeFee,
    });
    const txReceipt = await txResponse.wait();
    console.log('✉️  Cross-chain message:', `"${message}"`, '→ endpointId', dstEid);
    console.log('🧾 Transaction hash:', txReceipt.transactionHash);
    console.log('🌐 Track transfer:', (0, utils_1.getLayerZeroScanLink)(txReceipt.transactionHash, (0, utils_1.isV2Testnet)(dstEid)));
}
// Note: for testing reference, Optimism Sepolia's eid is 40232 and Solana Devnet's eid is 40168
(0, config_1.task)('lz:oapp:send', 'Sends a string message cross-chain', action)
    .addParam('fromEid', 'Source endpoint ID', undefined, config_1.types.int, false)
    .addParam('dstEid', 'Destination endpoint ID', undefined, config_1.types.int, false)
    .addParam('message', 'String message to send', undefined, config_1.types.string, false)
    .addParam('computeUnitPriceScaleFactor', 'The compute unit price scale factor', 4, config_1.types.float, true) // only if fromEid is Solana
    .addOptionalParam('contractName', 'Name of the OApp contract in deployments folder', 'MyOApp', config_1.types.string); // only if fromEid is EVM
