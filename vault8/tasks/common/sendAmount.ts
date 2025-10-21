import { task, types } from 'hardhat/config'
import { ActionType, HardhatRuntimeEnvironment } from 'hardhat/types'

import { Options } from '@layerzerolabs/lz-v2-utilities'

interface Args {
    dstEid: number
    // Decimal string or integer in base units; we assume caller provides base units already to avoid decimal math on-chain
    amountBaseUnits: string
    contractName: string
    lzReceiveGas: number
    composeGas: number
}

const action: ActionType<Args> = async (
    { dstEid, amountBaseUnits, contractName, lzReceiveGas, composeGas },
    hre: HardhatRuntimeEnvironment
) => {
    const signer = await hre.ethers.getNamedSigner('deployer')
    // @ts-expect-error signer type widening
    const myOApp = (await hre.ethers.getContract(contractName)).connect(signer)

    const amt = BigInt(amountBaseUnits)
    if (amt > (1n << 64n) - 1n) throw new Error('amountBaseUnits does not fit into u64')

    // Build options: ensure both lzReceive and compose gas are covered on Solana and on the EVM ACK path
    const options = Options.newOptions()
        .addExecutorLzReceiveOption(lzReceiveGas, 0)
        .addExecutorComposeOption(0, composeGas, 0) // index 0 compose
        .toHex()
        .toString()

    // Quote fees
    const [nativeFee] = await myOApp.quoteDeposit(dstEid, amt, options, false)
    console.log('🔖 Native fee quoted:', nativeFee.toString())

    const tx = await myOApp.requestDeposit(dstEid, amt, options, { value: nativeFee })
    const rc = await tx.wait()
    console.log('✉️  Sent amount payload', amt.toString(), '→ eid', dstEid)
    console.log('🧾 Tx:', rc.transactionHash)
}

task('lz:oapp:send-amount', 'Sends an 8-byte LE amount payload (base units) to Solana')
    .addParam('dstEid', 'Destination endpoint ID', undefined, types.int, false)
    .addParam('amountBaseUnits', 'Amount in base units (fits in u64)', undefined, types.string, false)
    .addOptionalParam('contractName', 'Deployed contract name', 'MyOApp', types.string)
    .addOptionalParam('lzReceiveGas', 'lzReceive gas on Solana', 230000, types.int)
    .addOptionalParam('composeGas', 'compose gas for ACK', 60000, types.int)
    .setAction(action)
