import React, { useMemo, useState } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useWalletClient } from 'wagmi'
import { createPublicClient, http, type Hex } from 'viem'
import { baseSepolia } from 'viem/chains'
import { Options } from '@layerzerolabs/lz-v2-utilities'

// Minimal ABI entries we need: quote(dstEid,string,bytes,bool) and send(dstEid,string,bytes)
const myOAppAbi = [
  {
    inputs: [
      { internalType: 'uint32', name: '_dstEid', type: 'uint32' },
      { internalType: 'string', name: '_string', type: 'string' },
      { internalType: 'bytes', name: '_options', type: 'bytes' },
      { internalType: 'bool', name: '_payInLzToken', type: 'bool' },
    ],
    name: 'quote',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'nativeFee', type: 'uint256' },
          { internalType: 'uint256', name: 'lzTokenFee', type: 'uint256' },
        ],
        internalType: 'struct MessagingFee',
        name: 'fee',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint32', name: '_dstEid', type: 'uint32' },
      { internalType: 'string', name: '_string', type: 'string' },
      { internalType: 'bytes', name: '_options', type: 'bytes' },
    ],
    name: 'send',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'guid', type: 'bytes32' },
          { internalType: 'uint64', name: 'nonce', type: 'uint64' },
          {
            components: [
              { internalType: 'uint256', name: 'nativeFee', type: 'uint256' },
              { internalType: 'uint256', name: 'lzTokenFee', type: 'uint256' },
            ],
            internalType: 'struct MessagingFee',
            name: 'fee',
            type: 'tuple',
          },
        ],
        internalType: 'struct MessagingReceipt',
        name: 'receipt',
        type: 'tuple',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

const MY_OAPP_BASE_SEPOLIA = '0xd8f3748bfA24f99a169E989476729BA535dfe487' as const
const DST_EID_SOLANA_DEVNET = 40168

function bytesToHex(b: Uint8Array): Hex {
  return ('0x' + Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('')) as Hex
}

const BaseToSolanaSender: React.FC = () => {
  const { isConnected, address } = useAppKitAccount({ namespace: 'eip155' })
  const { data: walletClient } = useWalletClient()
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      }),
    []
  )

  const [message, setMessage] = useState('Hello back from Base!')
  const [nativeFee, setNativeFee] = useState<bigint | null>(null)
  const [sending, setSending] = useState(false)
  const [quoting, setQuoting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const doQuote = async () => {
    try {
      setQuoting(true)
      setError(null)
      const options = Options.newOptions().toBytes()
      const res = (await publicClient.readContract({
        address: MY_OAPP_BASE_SEPOLIA,
        abi: myOAppAbi,
        functionName: 'quote',
        args: [DST_EID_SOLANA_DEVNET, message, bytesToHex(options), false],
      })) as { nativeFee: bigint; lzTokenFee: bigint }
      setNativeFee(res.nativeFee)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setQuoting(false)
    }
  }

  const doSend = async () => {
    if (!walletClient) {
      setError('Connect an EVM wallet (EIP-155) first.')
      return
    }
    try {
      setSending(true)
      setError(null)
      if (nativeFee == null) await doQuote()
      const options = Options.newOptions().toBytes()
      const hash = await walletClient.writeContract({
        chain: baseSepolia,
        address: MY_OAPP_BASE_SEPOLIA,
        abi: myOAppAbi,
        functionName: 'send',
        args: [DST_EID_SOLANA_DEVNET, message, bytesToHex(options)],
        value: nativeFee ?? 0n,
      })
      setTxHash(hash)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <section style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, marginTop: 20 }}>
      <h2>Send: Base → Solana</h2>
      <p style={{ fontSize: 14, color: '#666' }}>
        Uses viem + AppKit wallet to call MyOApp.send on Base Sepolia, delivering to Solana Devnet (EID {DST_EID_SOLANA_DEVNET}).
      </p>
      {isConnected && address ? (
        <div style={{ padding: 8, background: '#eef7ff', border: '1px solid #bcdfff', borderRadius: 6, marginBottom: 12 }}>
          <strong>EVM Wallet:</strong> {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      ) : (
        <div style={{ padding: 8, background: '#fff6e6', border: '1px solid #ffd599', borderRadius: 6, marginBottom: 12 }}>
          Connect your EVM wallet via the AppKit button above to send from Base.
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Message to Solana</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <button onClick={doQuote} disabled={quoting} style={{ padding: '8px 12px' }}>
          {quoting ? 'Quoting…' : 'Quote Fee'}
        </button>
        {nativeFee !== null && (
          <span style={{ fontSize: 14 }}>Native Fee: {nativeFee.toString()} wei</span>
        )}
      </div>

      <button onClick={doSend} disabled={sending || !isConnected} style={{ padding: '10px 16px', background: '#000', color: '#fff', borderRadius: 6 }}>
        {sending ? 'Sending…' : 'Send to Solana Devnet'}
      </button>

      {txHash && (
        <div style={{ marginTop: 12 }}>
          <div>TX: {txHash}</div>
          <div>
            <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">View on BaseScan</a>
          </div>
          <div>
            <a href={`https://testnet.layerzeroscan.com/tx/${txHash}`} target="_blank" rel="noreferrer">Track on LayerZero Scan</a>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, color: 'red' }}>Error: {error}</div>
      )}
    </section>
  )
}

export default BaseToSolanaSender
