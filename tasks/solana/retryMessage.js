"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const umi_web3js_adapters_1 = require("@metaplex-foundation/umi-web3js-adapters");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("hardhat/config");
const devtools_1 = require("@layerzerolabs/devtools");
const devtools_evm_hardhat_1 = require("@layerzerolabs/devtools-evm-hardhat");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const lz_solana_sdk_v2_1 = require("@layerzerolabs/lz-solana-sdk-v2");
const index_1 = require("./index");
// Run: npx hardhat lz:oapp:solana:retry-message --src-eid <srcEid> --nonce <nonce> --sender <SRC_OAPP> --dst-eid <dstEid> --receiver <RECEIVER> --guid <GUID> --message <MESSAGE> --with-compute-unit-limit <CU_LIMIT> --lamports <LAMPORTS> --with-compute-unit-price <microLamports>
(0, config_1.task)('lz:oapp:solana:retry-message', 'Retry a stored message on Solana')
    .addParam('srcEid', 'The source EndpointId', undefined, devtools_evm_hardhat_1.types.eid)
    .addParam('nonce', 'The nonce of the message', undefined, devtools_evm_hardhat_1.types.bigint)
    .addParam('sender', 'The source OApp address (hex)', undefined, devtools_evm_hardhat_1.types.string)
    .addParam('dstEid', 'The destination EndpointId (Solana chain)', undefined, devtools_evm_hardhat_1.types.eid)
    .addParam('receiver', 'The receiver address on the destination Solana chain (bytes58)', undefined, devtools_evm_hardhat_1.types.string)
    .addParam('guid', 'The GUID of the message (hex)', undefined, devtools_evm_hardhat_1.types.string)
    .addParam('message', 'The message data in hex format', undefined, devtools_evm_hardhat_1.types.string)
    .addParam('withComputeUnitLimit', 'The CU for the lzReceive instruction', undefined, devtools_evm_hardhat_1.types.int)
    .addParam('lamports', 'The lamports for the lzReceive instruction', undefined, devtools_evm_hardhat_1.types.int)
    .addParam('withComputeUnitPrice', 'The priority fee in microLamports', undefined, devtools_evm_hardhat_1.types.int)
    .setAction(async ({ srcEid, nonce, sender, dstEid, receiver, guid, message, withComputeUnitLimit, lamports, withComputeUnitPrice, }) => {
    const { connection, umiWalletKeyPair } = await (0, index_1.deriveConnection)(dstEid);
    const signer = (0, umi_web3js_adapters_1.toWeb3JsKeypair)(umiWalletKeyPair);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    const tx = new web3_js_1.Transaction({
        feePayer: signer.publicKey,
        blockhash,
        lastValidBlockHeight,
    });
    const instruction = await (0, lz_solana_sdk_v2_1.lzReceive)(connection, signer.publicKey, {
        nonce: nonce.toString(),
        srcEid,
        sender: (0, devtools_1.makeBytes32)(sender),
        receiver,
        guid,
        message,
    }, Uint8Array.from([withComputeUnitLimit, lamports]), 'confirmed');
    if (withComputeUnitPrice) {
        tx.add(web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: withComputeUnitPrice,
        }));
    }
    tx.add(instruction);
    tx.recentBlockhash = blockhash;
    tx.sign(signer);
    const signature = await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [signer]);
    console.log(`View Solana transaction here: ${(0, index_1.getExplorerTxLink)(signature.toString(), dstEid == lz_definitions_1.EndpointId.SOLANA_V2_TESTNET)}`);
});
