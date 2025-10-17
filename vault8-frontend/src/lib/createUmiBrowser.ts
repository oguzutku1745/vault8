// Lightweight browser-safe factory for creating a Umi instance.
// Tries to use the official bundle defaults when available, otherwise
// composes a minimal Umi instance from core + web3 adapters.
export async function createUmiBrowser(rpc: string | import('@solana/web3.js').Connection) {
  // Construct a minimal Umi using core + web3js adapters (browser-safe).
  const { createUmi } = await import('@metaplex-foundation/umi')
  const { web3JsRpc } = await import('@metaplex-foundation/umi-rpc-web3js')
  const maybeTxFactory = await import('@metaplex-foundation/umi-transaction-factory-web3js').catch(() => null as any)
  const maybeMplToolbox = await import('@metaplex-foundation/mpl-toolbox').catch(() => null as any)
  const { createDefaultProgramRepository } = await import('@metaplex-foundation/umi-program-repository')

  const umi = createUmi()
  // Provide a concrete RPC backed by web3.js
  umi.use(web3JsRpc(rpc as any))
  // Ensure a program repository implementation is set
  umi.programs = createDefaultProgramRepository({ rpc: umi.rpc })
  if (maybeTxFactory && typeof maybeTxFactory.web3JsTransactionFactory === 'function') {
    umi.use(maybeTxFactory.web3JsTransactionFactory())
  }
  if (maybeMplToolbox && typeof maybeMplToolbox.mplToolbox === 'function') {
    umi.use(maybeMplToolbox.mplToolbox())
  }
  return umi
}
