"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAptosOAppFactory = createAptosOAppFactory;
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const aptosEndpointV2_1 = require("./aptosEndpointV2");
function createAptosOAppFactory() {
    return async function (point) {
        const supportedChaintypes = [lz_definitions_1.ChainType.APTOS, lz_definitions_1.ChainType.INITIA];
        if (!supportedChaintypes.includes((0, lz_definitions_1.endpointIdToChainType)(point.eid))) {
            throw new Error(`Aptos SDK factory can only create SDKs for Aptos networks. Received EID ${point.eid}.`);
        }
        const createStubTransaction = (description) => ({
            point,
            data: `0x`,
            description: `[APTOS STUB] ${description}`,
        });
        return {
            point,
            async getOwner() {
                return undefined;
            },
            async hasOwner(owner) {
                return false;
            },
            async setOwner(owner) {
                return createStubTransaction(`setOwner(${owner})`);
            },
            async getEndpointSDK() {
                return new aptosEndpointV2_1.AptosEndpointV2(point);
            },
            async getPeer(eid) {
                return undefined;
            },
            async hasPeer(eid, peer) {
                return false;
            },
            async setPeer(eid, peer) {
                return createStubTransaction(`setPeer(${eid}, ${peer})`);
            },
            async getDelegate() {
                return undefined;
            },
            async setDelegate(address) {
                return createStubTransaction(`setDelegate(${address})`);
            },
            async isDelegate() {
                return false;
            },
            async getEnforcedOptions() {
                return {};
            },
            async setEnforcedOptions(enforcedOptions) {
                return createStubTransaction(`setEnforcedOptions(${enforcedOptions.length} options)`);
            },
            async getCallerBpsCap() {
                return BigInt(0);
            },
            async setCallerBpsCap(callerBpsCap) {
                return createStubTransaction(`setCallerBpsCap(${callerBpsCap})`);
            },
        };
    };
}
