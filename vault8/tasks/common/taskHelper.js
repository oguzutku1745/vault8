"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSolanaReceiveConfig = getSolanaReceiveConfig;
exports.getSolanaSendConfig = getSolanaSendConfig;
const lz_solana_sdk_v2_1 = require("@layerzerolabs/lz-solana-sdk-v2");
const protocol_devtools_1 = require("@layerzerolabs/protocol-devtools");
/**
 * Get the receive config for a Solana OApp
 * @param endpointV2Sdk {IEndpointV2} SDK for the endpoint
 * @param remoteEid {EndpointId} remote eid
 * @param address {OmniAddress} address of the OApp
 */
async function getSolanaReceiveConfig(endpointV2Sdk, remoteEid, address) {
    const [receiveLibrary] = await endpointV2Sdk.getReceiveLibrary(address, remoteEid);
    return [
        receiveLibrary ?? lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ADDRESS,
        await endpointV2Sdk.getAppUlnConfig(address, lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ID.toBase58(), remoteEid, protocol_devtools_1.Uln302ConfigType.Receive),
        {
            lib: lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ID.toBase58(),
            expiry: 0n, // unsupported for Solana
        },
    ];
}
/**
 * Get the send config for a Solana OApp.
 * @param endpointV2Sdk {IEndpointV2} SDK for the endpoint
 * @param eid {EndpointId} remote eid
 * @param address {OmniAddress} address of the OApp
 */
async function getSolanaSendConfig(endpointV2Sdk, eid, address) {
    const sendLibrary = (await endpointV2Sdk.getSendLibrary(address, eid)) ?? lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ADDRESS;
    return [
        sendLibrary,
        await endpointV2Sdk.getAppUlnConfig(address, lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ID.toBase58(), eid, protocol_devtools_1.Uln302ConfigType.Send),
        await endpointV2Sdk.getAppExecutorConfig(address, sendLibrary, eid),
    ];
}
