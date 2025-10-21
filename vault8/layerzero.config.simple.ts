import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { OAppEnforcedOption, OmniPointHardhat, OAppOmniGraphHardhat } from '@layerzerolabs/toolbox-hardhat'

import { getSolanaOAppAddress } from './tasks/solana'

const baseContract: OmniPointHardhat = {
    eid: EndpointId.BASESEP_V2_TESTNET,
    contractName: 'MyOApp',
}

const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 230_000, // Increased from 100k
    },
    {
        msgType: 1,
        optionType: ExecutorOptionType.COMPOSE,
        index: 0,
        gas: 60_000,
        value: 0,
    },
]

const SOLANA_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 230_000,
    },
]

export default async function () {
    const solanaContract: OmniPointHardhat = {
        eid: EndpointId.SOLANA_V2_TESTNET,
        address: getSolanaOAppAddress(EndpointId.SOLANA_V2_TESTNET),
    }

    const graph: OAppOmniGraphHardhat = {
        contracts: [
            { contract: baseContract },
            { contract: solanaContract },
        ],
        connections: [
            {
                from: baseContract,
                to: solanaContract,
                config: {
                    enforcedOptions: EVM_ENFORCED_OPTIONS,
                },
            },
            {
                from: solanaContract,
                to: baseContract,
                config: {
                    enforcedOptions: SOLANA_ENFORCED_OPTIONS,
                },
            },
        ],
    }
    return graph
}

