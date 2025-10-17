import { signerIdentity } from "@metaplex-foundation/umi";
// use a loose Signer type locally to avoid strict web3.js Transaction vs VersionedTransaction mismatches
import type { Signer as UmiSignerType } from "@metaplex-foundation/umi";
import type { VersionedTransaction } from "@solana/web3.js";

// Wrap an AppKit wallet provider into a Umi Signer identity
export function makeUmiSignerFromAppKit(walletProvider: any, publicKey: any) {
  // A minimal signer that delegates to AppKit's signTransaction
  const signer: any = {
    publicKey: publicKey,
    async signTransaction(tx: VersionedTransaction) {
      // Forward to AppKit's signTransaction and return the signed tx
      return await walletProvider.signTransaction(tx as any)
    },
    async signAllTransactions(txs: VersionedTransaction[]) {
      const out: any[] = []
      for (const t of txs) {
        out.push(await walletProvider.signTransaction(t as any))
      }
      return out
    },
  }

  return {
    signer: signer as UmiSignerType,
    identity: signerIdentity(signer as UmiSignerType),
  }
}

export default makeUmiSignerFromAppKit
