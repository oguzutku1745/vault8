"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSolanaEndpointIdInGraph = void 0;
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const ua_devtools_evm_hardhat_1 = require("@layerzerolabs/ua-devtools-evm-hardhat");
const findSolanaEndpointIdInGraph = async (hre, oappConfig) => {
    if (!oappConfig)
        throw new Error('Missing oappConfig');
    let graph;
    try {
        graph = await hre.run(ua_devtools_evm_hardhat_1.SUBTASK_LZ_OAPP_CONFIG_LOAD, {
            configPath: oappConfig,
            schema: ua_devtools_evm_hardhat_1.OAppOmniGraphHardhatSchema,
            task: ua_devtools_evm_hardhat_1.TASK_LZ_OAPP_CONFIG_GET,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to load OApp configuration: ${error.message}`);
        }
        else {
            throw new Error('Failed to load OApp configuration: Unknown error');
        }
    }
    let solanaEid = null;
    const checkSolanaEndpoint = (eid) => {
        if ((0, lz_definitions_1.endpointIdToChainType)(eid) === lz_definitions_1.ChainType.SOLANA) {
            if (solanaEid && solanaEid !== eid) {
                throw new Error(`Multiple Solana Endpoint IDs found: ${solanaEid}, ${eid}`);
            }
            solanaEid = eid;
        }
    };
    for (const { vector } of graph.connections) {
        checkSolanaEndpoint(vector.from.eid);
        checkSolanaEndpoint(vector.to.eid);
        if (solanaEid)
            return solanaEid;
    }
    throw new Error('No Solana Endpoint ID found. Ensure your OApp configuration includes a valid Solana endpoint.');
};
exports.findSolanaEndpointIdInGraph = findSolanaEndpointIdInGraph;
