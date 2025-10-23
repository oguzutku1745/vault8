"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const lz_v2_utilities_1 = require("@layerzerolabs/lz-v2-utilities");
const action = async ({ dstEid, amountBaseUnits, contractName, lzReceiveGas, composeGas }, hre) => {
    const signer = await hre.ethers.getNamedSigner('deployer');
    // @ts-expect-error signer type widening
    const myOApp = (await hre.ethers.getContract(contractName)).connect(signer);
    const amt = BigInt(amountBaseUnits);
    if (amt > (1n << 64n) - 1n)
        throw new Error('amountBaseUnits does not fit into u64');
    // Build options: ensure both lzReceive and compose gas are covered on Solana and on the EVM ACK path
    // _value parameter = lamports to fund rent + fees on Solana (0.003 SOL = 3M lamports)
    const options = lz_v2_utilities_1.Options.newOptions()
        .addExecutorLzReceiveOption(lzReceiveGas, 3000000) // _value: 3M lamports for UserBalance PDA rent + fees
        .addExecutorComposeOption(0, composeGas, 0) // index 0 compose
        .toHex()
        .toString();

    console.log('options', options);
    // Quote fees
    const [nativeFee] = await myOApp.quoteDeposit(dstEid, amt, options, false);
    console.log('🔖 Native fee quoted:', nativeFee.toString());
    const tx = await myOApp.requestDeposit(dstEid, amt, options, { value: nativeFee });
    const rc = await tx.wait();
    console.log('✉️  Sent amount payload', amt.toString(), '→ eid', dstEid);
    console.log('🧾 Tx:', rc.transactionHash);
};
(0, config_1.task)('lz:oapp:send-amount', 'Sends an 8-byte LE amount payload (base units) to Solana')
    .addParam('dstEid', 'Destination endpoint ID', undefined, config_1.types.int, false)
    .addParam('amountBaseUnits', 'Amount in base units (fits in u64)', undefined, config_1.types.string, false)
    .addOptionalParam('contractName', 'Deployed contract name', 'MyOApp', config_1.types.string)
    .addOptionalParam('lzReceiveGas', 'lzReceive gas on Solana (compute units)', 600000, config_1.types.int)
    .addOptionalParam('composeGas', 'compose gas for ACK', 60000, config_1.types.int)
    .setAction(action);
