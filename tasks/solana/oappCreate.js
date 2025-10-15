"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const umi_1 = require("@metaplex-foundation/umi");
const bs58_1 = __importDefault(require("bs58"));
const config_1 = require("hardhat/config");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const client_1 = require("../../lib/client");
const _1 = require(".");
const action = async ({ programId, eid }, hre) => {
    // TODO: accept program ID as a param
    const isTestnet = eid == lz_definitions_1.EndpointId.SOLANA_V2_TESTNET;
    const myoappInstance = new client_1.myoapp.MyOApp((0, umi_1.publicKey)(programId));
    const [oapp] = myoappInstance.pda.oapp();
    const { umi, umiWalletSigner } = await (0, _1.deriveConnection)(eid);
    const txBuilder = (0, umi_1.transactionBuilder)().add(myoappInstance.initStore(umiWalletSigner, umiWalletSigner.publicKey));
    const tx = await txBuilder.sendAndConfirm(umi);
    console.log(`createTx: ${(0, _1.getExplorerTxLink)(bs58_1.default.encode(tx.signature), isTestnet)}`);
    (0, _1.saveSolanaDeployment)(eid, programId, oapp);
};
(0, config_1.task)('lz:oapp:solana:create', 'inits the oapp account', action)
    .addParam('programId', 'The program ID of the OApp', undefined, config_1.types.string, false)
    .addParam('eid', 'The endpoint ID for the Solana network.', undefined, config_1.types.int, false);
