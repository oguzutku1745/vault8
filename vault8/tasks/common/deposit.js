"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const ethers_1 = require("ethers");
const action = async ({ dstEid, amount, correlationId, user, contractName }, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const contract = (await hre.ethers.getContract(contractName)).connect(signer);
    const amt = BigInt(amount);
    if (amt > (1n << 64n) - 1n)
        throw new Error('amount too large for u64');
    // Build payload: [8 LE amount][32 corrId][20 user]
    const le = new Uint8Array(8);
    let tmp = amt;
    for (let i = 0; i < 8; i++) {
        le[i] = Number(tmp & 0xffn);
        tmp >>= 8n;
    }
    let corr = new Uint8Array(32);
    if (correlationId) {
        const hex = correlationId.startsWith('0x') ? correlationId : ('0x' + correlationId);
        if (ethers_1.ethers.utils.hexDataLength(hex) !== 32)
            throw new Error('correlationId must be 32 bytes');
        corr = ethers_1.ethers.utils.arrayify(hex);
    }
    let usr = new Uint8Array(20);
    const who = user ?? await signer.getAddress();
    usr = ethers_1.ethers.utils.arrayify(who);
    const payload = ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.concat([le, corr, usr]));
    const options = '0x';
    const [nativeFee] = await contract.quote(dstEid, payload, options, false);
    const tx = await contract.send(dstEid, payload, options, { value: nativeFee });
    const rcpt = await tx.wait();
    console.log('Deposit intent sent. tx:', rcpt.transactionHash);
};
(0, config_1.task)('lz:oapp:deposit', 'Send a deposit payload (amount LE, correlationId, user)')
    .addParam('dstEid', 'Destination endpoint ID', undefined, config_1.types.int)
    .addParam('amount', 'Amount in base units (u64)', undefined, config_1.types.string)
    .addOptionalParam('correlationId', 'Correlation id (0x32-bytes hex)', undefined, config_1.types.string)
    .addOptionalParam('user', 'User address (defaults to signer)', undefined, config_1.types.string)
    .addOptionalParam('contractName', 'Deployed contract name', 'MyOApp', config_1.types.string)
    .setAction(action);
