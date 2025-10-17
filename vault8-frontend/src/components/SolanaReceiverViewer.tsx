import React, { useEffect, useMemo, useState } from 'react'
import { Connection } from '@solana/web3.js'
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi'

const PROGRAM_ID = '9hYxCB1KnVzRpCBtKktvCA77F28pE8H35g4WgiopzwyJ'

const SolanaReceiverViewer: React.FC = () => {
  const [value, setValue] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connection = useMemo(() => new Connection('https://api.devnet.solana.com', 'confirmed'), [])

  const readOnce = async () => {
    try {
      setLoading(true)
      setError(null)
      const [modAccounts, pdaMod, createUmiBrowser] = await Promise.all([
        import('../../lib/client/generated/my_oapp/accounts/store.ts'),
        import('../../lib/client/pda.ts'),
        import('../lib/createUmiBrowser'),
      ])
      const umi = await createUmiBrowser.createUmiBrowser(connection)
      const pid = umiPublicKey(PROGRAM_ID)
      const { MyOAppPDA } = pdaMod as any
      const [storePda] = new MyOAppPDA(pid).oapp()
  const acc = await modAccounts.fetchStore({ rpc: umi.rpc }, storePda)
      setValue((acc as any).data.string)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    readOnce()
    const id = setInterval(readOnce, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <section style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, marginTop: 20 }}>
      <h2>Solana Receiver</h2>
      <p style={{ fontSize: 14, color: '#666' }}>Reading Store account on Solana Devnet</p>
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

export default SolanaReceiverViewer
