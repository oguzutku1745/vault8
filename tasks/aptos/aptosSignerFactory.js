"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAptosSignerFactory = createAptosSignerFactory;
const devtools_1 = require("@layerzerolabs/devtools");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
function createAptosSignerFactory() {
    return async function (eid) {
        if ((0, lz_definitions_1.endpointIdToChainType)(eid) !== lz_definitions_1.ChainType.APTOS && (0, lz_definitions_1.endpointIdToChainType)(eid) !== lz_definitions_1.ChainType.INITIA) {
            throw new Error(`createAptosSignerFactory() called with Move VM EID: ${(0, devtools_1.formatEid)(eid)}`);
        }
        const aptosSigner = {
            // The devtools signature requires these members:
            eid,
            getPoint: () => {
                const point = {
                    eid,
                    address: '0x0',
                };
                return point;
            },
            /**
             * sign(omniTx) => Promise<string>
             * Build & sign an Aptos entry function call, returning the BCS as a hex string.
             */
            sign: async (omniTx) => {
                return '0x0';
            },
            /**
             * signAndSend(omniTx) => Promise<OmniTransactionResponse<OmniTransactionReceipt>>
             * Just calls sign(...) to get the BCS hex, then submit it.
             */
            signAndSend: async (omniTx) => {
                return {
                    transactionHash: '0x0',
                    wait: async (_confirmations) => {
                        return { transactionHash: '0x0' };
                    },
                };
            },
        };
        return aptosSigner;
    };
}
