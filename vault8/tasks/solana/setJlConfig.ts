import fs from 'node:fs'
import path from 'node:path'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { task, types } from 'hardhat/config'

import * as anchor from '@coral-xyz/anchor'

import { deriveConnection, getSolanaDeployment, useWeb3Js } from '../solana'

interface Args {
  eid: number
  jlConfig: string // path to JSON produced by your JL script
  printOnly?: boolean
}

function toPubkey(name: string, v: string | undefined): PublicKey {
  if (!v) throw new Error(`Missing or undefined public key field: ${name}`)
  try { return new PublicKey(v) } catch (e) {
    throw new Error(`Invalid public key for ${name}: ${v}`)
  }
}

function deriveStorePda(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from('Store')], programId)
  return pda
}

function deriveAta(owner: PublicKey, mint: PublicKey, tokenProgram: PublicKey, associatedTokenProgram: PublicKey): PublicKey {
  // SPL Associated Token Account PDA seeds: ["ata", owner, token_program, mint]
  const [ata] = PublicKey.findProgramAddressSync(
    [Buffer.from('ata'), owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
    associatedTokenProgram,
  )
  return ata
}

task('lz:oapp:solana:set-jl-config', 'Sets Jupiter Lend + SPL config on Store and prints ATAs')
  .addParam('eid', 'Solana endpoint id (e.g., 40168 for devnet)', undefined, types.int)
  .addParam('jlConfig', 'Path to JSON with JL CPI accounts', undefined, types.string)
  .addFlag('printOnly', 'Only derive and print ATAs; do not send on-chain transaction')
  .setAction(async ({ eid, jlConfig, printOnly }: Args, hre) => {
    const deployment = getSolanaDeployment(eid as any)
    const programId = new PublicKey(deployment.programId)

  const cfgPath = path.resolve(jlConfig)
    if (!fs.existsSync(cfgPath)) throw new Error(`Config JSON not found at ${cfgPath}`)
    const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))

    // Accept alternate/synonym keys from different scripts
    // Prefer canonical names; fall back to synonyms found in the provided JSON
    const jlLendingProgram = raw.jlLendingProgram || raw.lendingProgram || raw.liquidityProgram
    const jlLiquidityProgram = raw.jlLiquidityProgram || raw.liquidityProgram || raw.lendingProgram
    if (!raw.jlLendingProgram && !raw.lendingProgram && raw.liquidityProgram) {
      console.warn('jlLendingProgram not provided; using liquidityProgram as fallback')
    }
    if (!raw.jlLiquidityProgram && raw.lendingProgram && !raw.liquidityProgram) {
      console.warn('jlLiquidityProgram not provided; using lendingProgram as fallback')
    }

    const params = {
      usdcMint: toPubkey('usdcMint', raw.usdcMint),
      tokenProgram: toPubkey('tokenProgram', raw.tokenProgram),
      associatedTokenProgram: toPubkey('associatedTokenProgram', raw.associatedTokenProgram),
      systemProgram: toPubkey('systemProgram', (raw.systemProgram as string) ?? SystemProgram.programId.toBase58()),
      jlLendingProgram: toPubkey('jlLendingProgram', jlLendingProgram),
      jlLiquidityProgram: toPubkey('jlLiquidityProgram', jlLiquidityProgram),
      jlLendingAdmin: toPubkey('jlLendingAdmin', raw.jlLendingAdmin || raw.lendingAdmin),
      jlLending: toPubkey('jlLending', raw.jlLending || raw.lending),
      jlFTokenMint: toPubkey('jlFTokenMint', raw.jlFTokenMint || raw.fTokenMint),
      jlSupplyTokenReservesLiquidity: toPubkey('jlSupplyTokenReservesLiquidity', raw.jlSupplyTokenReservesLiquidity || raw.supplyTokenReservesLiquidity),
      jlLendingSupplyPositionOnLiquidity: toPubkey('jlLendingSupplyPositionOnLiquidity', raw.jlLendingSupplyPositionOnLiquidity || raw.lendingSupplyPositionOnLiquidity),
      jlRateModel: toPubkey('jlRateModel', raw.jlRateModel || raw.rateModel),
      jlVault: toPubkey('jlVault', raw.jlVault || raw.vault),
      jlLiquidity: toPubkey('jlLiquidity', raw.jlLiquidity || raw.liquidity),
      jlRewardsRateModel: toPubkey('jlRewardsRateModel', raw.jlRewardsRateModel || raw.rewardsRateModel),
    }

  const { connection } = await deriveConnection(eid as any)
    const { web3JsKeypair } = await useWeb3Js()
    const wallet = new anchor.Wallet(web3JsKeypair)
    const provider = new anchor.AnchorProvider(connection as any, wallet, {})
    anchor.setProvider(provider)

    // Load IDL
    const idlPath = path.resolve('target', 'idl', 'my_oapp.json')
    if (!fs.existsSync(idlPath)) throw new Error(`IDL not found at ${idlPath}. Build the program first.`)
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'))

    const program = new anchor.Program(idl, programId, provider)
    const store = deriveStorePda(programId)

    console.log('Program ID:', programId.toBase58())
    console.log('Store PDA  :', store.toBase58())

    if (printOnly) {
      console.log('ℹ️  Print-only mode: skipping on-chain set_jl_config')
    } else {
      // Call set_jl_config
      const txSig = await program.methods
        .setJlConfig(params as any)
        .accounts({ store, admin: wallet.publicKey })
        .rpc()

      console.log('✅ set_jl_config sent. tx =', txSig)
    }

    // Print ATAs for convenience
    const usdcAta = deriveAta(store, params.usdcMint, params.tokenProgram, params.associatedTokenProgram)
    const fTokenAta = deriveAta(store, params.jlFTokenMint, params.tokenProgram, params.associatedTokenProgram)
    console.log('Store USDC ATA:', usdcAta.toBase58())
    console.log('Store fToken ATA:', fTokenAta.toBase58())
  })
