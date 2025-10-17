import React, { useEffect, useMemo, useState } from 'react'
import { Connection } from '@solana/web3.js'
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi'
import { OAPP_PROGRAM_ID } from '../../utils/layerzero'

const PROGRAM_ID = OAPP_PROGRAM_ID.toBase58()

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
      const storePdaTuple = new MyOAppPDA(pid).oapp()
      const storePubkey = storePdaTuple[0]
      const acc = await modAccounts.safeFetchStore({ rpc: umi.rpc }, storePubkey)
      const storePdaStr = storePubkey.toString()
      console.debug('[SolanaReceiverViewer] storePda', storePdaStr, 'account:', acc)
      if (!acc) {
        setError('Store account not found on devnet. Has the program been initialized?')
        setValue('')
        return
      }
      // Kinobi + Umi sometimes return account fields flattened at top-level.
      const topLevel = (acc as any).string
      const nested = (acc as any).data?.string
      const val = typeof topLevel === 'string' ? topLevel : typeof nested === 'string' ? nested : ''
      setValue(String(val))
      setError(null)
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
