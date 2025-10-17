import React, { useEffect, useMemo, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

// Minimal ABI for MyOApp on Base: only need the public `data()` view
const myOAppAbi = [
  {
    inputs: [],
    name: 'data',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Deployed MyOApp address on Base Sepolia (from deployments/BASE-sepolia/MyOApp.json)
const MY_OAPP_BASE_SEPOLIA = '0xd8f3748bfA24f99a169E989476729BA535dfe487' as const

type Props = {
  pollingMs?: number
}

const BaseReceiverViewer: React.FC<Props> = ({ pollingMs = 8000 }) => {
  const [value, setValue] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const client = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      }),
    []
  )

  const readOnce = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await client.readContract({
        abi: myOAppAbi,
        address: MY_OAPP_BASE_SEPOLIA,
        functionName: 'data',
      })
      setValue(String(res))
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial fetch
    readOnce()
    // poll periodically
    const id = setInterval(readOnce, pollingMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, pollingMs])

  return (
    <section style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, marginTop: 20 }}>
      <h2>Base Receiver</h2>
      <p style={{ fontSize: 14, color: '#666' }}>
        Reading MyOApp.data() on Base Sepolia: {MY_OAPP_BASE_SEPOLIA}
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <button onClick={readOnce} disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        {error && <span style={{ color: 'red' }}>Error: {error}</span>}
      </div>
      <div style={{ marginTop: 12, padding: 12, background: '#f7f7f7', borderRadius: 6 }}>
        <strong>data:</strong>
        <div style={{ marginTop: 6, wordBreak: 'break-word' }}>{value || '—'}</div>
      </div>
    </section>
  )
}

export default BaseReceiverViewer
