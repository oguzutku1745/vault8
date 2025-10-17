"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isV2Testnet = exports.getLayerZeroScanLink = void 0;
const getLayerZeroScanLink = (hash, isTestnet = false) => isTestnet ? `https://testnet.layerzeroscan.com/tx/${hash}` : `https://layerzeroscan.com/tx/${hash}`;
exports.getLayerZeroScanLink = getLayerZeroScanLink;
const isV2Testnet = (eid) => eid >= 10000 && eid.toString()[0] === '4';
exports.isV2Testnet = isV2Testnet;
