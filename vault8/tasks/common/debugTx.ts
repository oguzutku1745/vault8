import { task, types } from 'hardhat/config'

type InspectArgs = {
    hash: string
    contractName: string
}

task('lz:oapp:inspect-tx', 'Inspect an EVM tx and highlight LayerZero Endpoint logs')
    .addParam('hash', 'Transaction hash', undefined, types.string, false)
    .addOptionalParam('contractName', 'Contract name to resolve endpoint from', 'MyOApp', types.string)
    .setAction(async ({ hash, contractName = 'MyOApp' }: InspectArgs, hre) => {
        const provider = hre.ethers.provider
        const receipt = await provider.getTransactionReceipt(hash)
        if (!receipt) {
            console.log('No receipt found')
            return
        }

    const myOApp = await hre.ethers.getContract(contractName)
        // @ts-expect-error endpoint() exists on MyOApp
        const endpoint: string = await myOApp.endpoint()

        console.log('Status:', receipt.status ? 'Success' : 'Failed')
        console.log('Logs:', receipt.logs.length)
        console.log('Endpoint address:', endpoint)
        for (let i = 0; i < receipt.logs.length; i++) {
            const l = receipt.logs[i]
            const isEndpoint = l.address.toLowerCase() === endpoint.toLowerCase()
            console.log(
                `#${i} ${l.address} topics[0]=${l.topics?.[0] ?? '0x'}${isEndpoint ? '  <-- Endpoint' : ''}`
            )
        }
    })

type EvmDebugArgs = {
    dstEid?: number
    contractName?: string
}

task('lz:oapp:evm:debug', 'Print EVM OApp endpoint and basic settings')
    .addOptionalParam('dstEid', 'Destination EID to query enforced options for', 40168, types.int)
    .addOptionalParam('contractName', 'EVM OApp contract name', 'MyOApp', types.string)
    .setAction(async ({ dstEid, contractName = 'MyOApp' }: EvmDebugArgs, hre) => {
        const myOApp = await hre.ethers.getContract(contractName)
        // @ts-expect-error endpoint() exists on MyOApp
        const endpoint: string = await myOApp.endpoint()
        console.log('MyOApp:', myOApp.address)
        console.log('Endpoint:', endpoint)
        try {
            // @ts-expect-error enforcedOptions exists on MyOApp
            const options: string = await myOApp.enforcedOptions(dstEid, 1)
            console.log(`Enforced options (dstEid=${dstEid}, msgType=1):`, options)
        } catch (e) {
            console.log('Could not read enforcedOptions:', e)
        }
    })
