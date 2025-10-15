"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicKey = exports.keyPair = void 0;
const bs58_1 = require("@coral-xyz/anchor/dist/cjs/utils/bytes/bs58");
const web3_js_1 = require("@solana/web3.js");
exports.keyPair = {
    name: 'keyPair',
    parse(name, value) {
        return web3_js_1.Keypair.fromSecretKey((0, bs58_1.decode)(value));
    },
    validate() { },
};
exports.publicKey = {
    name: 'keyPair',
    parse(name, value) {
        return new web3_js_1.PublicKey(value);
    },
    validate() { },
};
