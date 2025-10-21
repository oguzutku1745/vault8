import { task, types } from 'hardhat/config'
import { ActionType, HardhatRuntimeEnvironment } from 'hardhat/types'
import { ethers } from 'ethers'

interface Args {
  dstEid: number
  amount: string // in base units (u64 safe up to 9e18, but we limit to u64 here)
  correlationId?: string // 0x…32 bytes
  user?: string // optional; defaults to msg.sender
  contractName: string
}

const action: ActionType<Args> = async ({ dstEid, amount, correlationId, user, contractName }, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners()
  const contract = (await hre.ethers.getContract(contractName)).connect(signer)

  const amt = BigInt(amount)
  if (amt > (1n << 64n) - 1n) throw new Error('amount too large for u64')

  // Build payload: [8 LE amount][32 corrId][20 user]
  const le = new Uint8Array(8) as unknown as Uint8Array
  let tmp = amt
  for (let i = 0; i < 8; i++) {
    le[i] = Number(tmp & 0xffn)
    tmp >>= 8n
  }

  let corr: Uint8Array = new Uint8Array(32) as unknown as Uint8Array
  if (correlationId) {
    const hex = correlationId.startsWith('0x') ? correlationId : ('0x' + correlationId)
    if (ethers.utils.hexDataLength(hex) !== 32) throw new Error('correlationId must be 32 bytes')
  corr = ethers.utils.arrayify(hex) as unknown as Uint8Array
  }

  let usr: Uint8Array = new Uint8Array(20) as unknown as Uint8Array
  const who = user ?? await signer.getAddress()
  usr = ethers.utils.arrayify(who) as unknown as Uint8Array

  const payload = ethers.utils.hexlify(ethers.utils.concat([le, corr, usr]))
  const options = '0x'

  const [nativeFee] = await contract.quote(dstEid, payload, options, false)
  const tx = await contract.send(dstEid, payload, options, { value: nativeFee })
  const rcpt = await tx.wait()
  console.log('Deposit intent sent. tx:', rcpt.transactionHash)
}

task('lz:oapp:deposit', 'Send a deposit payload (amount LE, correlationId, user)')
  .addParam('dstEid', 'Destination endpoint ID', undefined, types.int)
  .addParam('amount', 'Amount in base units (u64)', undefined, types.string)
  .addOptionalParam('correlationId', 'Correlation id (0x32-bytes hex)', undefined, types.string)
  .addOptionalParam('user', 'User address (defaults to signer)', undefined, types.string)
  .addOptionalParam('contractName', 'Deployed contract name', 'MyOApp', types.string)
  .setAction(action)
