"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const umi_1 = require("@metaplex-foundation/umi");
const config_1 = require("hardhat/config");
const client_1 = require("../../lib/client");
const solana_1 = require("../solana");
const utils_1 = require("./utils");
const action = async ({ oappConfig, contractName }, hre) => {
    const eids = await (0, utils_1.listEidsInLzConfig)(hre, oappConfig);
    console.log('\n🌐 LayerZero OApp States\n');
    for (const eid of eids) {
        console.group(`→ endpoint ${eid}`);
        if ((0, utils_1.isSolanaEid)(eid)) {
            const solanaState = await fetchSolanaOappState(eid);
            console.log('Solana OApp PDA:', solanaState._oappPda);
            console.log('Solana OApp Data:', solanaState.string);
        }
        else if ((0, utils_1.isEvmEid)(eid)) {
            const evm = await fetchEvmOappState(eid, hre, contractName);
            console.log('EVM OApp Address:', evm.address);
            console.log('EVM OApp Data:', evm.data);
        }
        else {
            console.log('Unknown endpoint type:', eid);
        }
        console.groupEnd();
        console.log(); // blank line for spacing
    }
};
async function fetchEvmOappState(eid, hre, contractName) {
    const contract = await hre.ethers.getContract(contractName);
    return {
        address: contract.address,
        // @ts-expect-error data method exists on MyOApp
        data: await contract.data(),
    };
}
async function fetchSolanaOappState(eid) {
    const { umi } = await (0, solana_1.deriveConnection)(eid, true);
    const deployment = (0, solana_1.getSolanaDeployment)(eid);
    const client = new client_1.myoapp.MyOApp((0, umi_1.publicKey)(deployment.programId));
    const [pda] = client.pda.oapp();
    const store = await client_1.myoapp.accounts.fetchStore(umi, pda);
    return {
        _oappPda: pda.toString(),
        ...store,
    };
}
(0, config_1.task)('lz:oapp:get', 'Fetch and pretty-print OApp state for each configured endpoint', action)
    .addParam('oappConfig', 'The LZ config file to use', undefined, config_1.types.string, true)
    .addOptionalParam('contractName', 'Name of the EVM OApp contract (default: MyOApp)', 'MyOApp', config_1.types.string);
