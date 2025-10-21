import { task } from 'hardhat/config'
import { ActionType } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'
import { createLogger } from '@layerzerolabs/io-devtools'

import { getSolanaDeployment, deriveConnection, useWeb3Js } from './index'
import { createSimpleOAppFactory } from '../../lib/factory'
import { OmniPoint } from '@layerzerolabs/devtools'
import { PublicKey } from '@solana/web3.js'

interface Args {
    remoteEid: number
    peerAddress: string
}

const action: ActionType<Args> = async ({ remoteEid, peerAddress }, hre) => {
    const logger = createLogger()
    
    logger.info(`Force setting peer for remote EID ${remoteEid} to ${peerAddress}`)
    
    // Get Solana deployment
    const { programId, oapp } = getSolanaDeployment(EndpointId.SOLANA_V2_TESTNET)
    logger.info(`Solana OApp: ${oapp}`)
    logger.info(`Program ID: ${programId}`)
    
    // Get connection and keypair
    const { connection } = await deriveConnection(EndpointId.SOLANA_V2_TESTNET, false)
    const { web3JsKeypair } = await useWeb3Js()
    
    // Create SDK factory with proper parameters
    const userAccountFactory = async () => web3JsKeypair.publicKey
    const programIdFactory = async () => new PublicKey(programId)
    const connectionFactory = async () => connection
    
    const factory = createSimpleOAppFactory(userAccountFactory, programIdFactory, connectionFactory)
    
    // Create SDK instance
    const point: OmniPoint = {
        eid: EndpointId.SOLANA_V2_TESTNET,
        address: oapp,
    }
    
    const sdk = await factory(point)
    
    // Check if peer already exists
    const hasPeer = await sdk.hasPeer(remoteEid, peerAddress)
    
    logger.info(`Peer already set: ${hasPeer}`)
    
    if (hasPeer) {
        logger.info(`✅ Peer is already correctly set, nothing to do`)
        return
    }
    
    // Set the peer
    logger.info(`Setting peer for EID ${remoteEid} to ${peerAddress}...`)
    const tx = await sdk.setPeer(remoteEid, peerAddress)
    
    if (!tx) {
        logger.error(`Failed to create set peer transaction`)
        return
    }
    
    logger.info(`Transaction created: ${tx.description}`)
    logger.info(`Executing transaction...`)
    
    // Execute the transaction
    const signedTx = await sdk.sign(tx)
    const result = await sdk.submit(signedTx)
    
    logger.info(`✅ Transaction submitted: ${result}`)
    logger.info(`Waiting for confirmation...`)
    
    // Wait a bit for confirmation
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Verify
    const hasPeerAfter = await sdk.hasPeer(remoteEid, peerAddress)
    
    logger.info(`\n=== Verification ===`)
    logger.info(`Peer correctly set: ${hasPeerAfter}`)
    
    if (hasPeerAfter) {
        logger.info(`✅ Success! Peer has been set.`)
    } else {
        logger.error(`❌ Peer was not set. Check the transaction.`)
    }
}

task('lz:oapp:solana:force-set-peer', 'Force set peer for a remote EID on Solana OApp')
    .addParam('remoteEid', 'Remote endpoint ID (e.g., 40245 for Base Sepolia)')
    .addParam('peerAddress', 'Peer OApp address on the remote chain (EVM address for Base)')
    .setAction(action)

