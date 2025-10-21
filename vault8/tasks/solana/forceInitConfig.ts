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
}

const action: ActionType<Args> = async ({ remoteEid }, hre) => {
    const logger = createLogger()
    
    logger.info(`Force initializing ULN configs for remote EID ${remoteEid}`)
    
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
    
    // Check if configs exist
    const sendConfigExists = await sdk.sendConfigIsInitialized(remoteEid)
    const receiveConfigExists = await sdk.receiveConfigIsInitialized(remoteEid)
    
    logger.info(`Send config exists: ${sendConfigExists}`)
    logger.info(`Receive config exists: ${receiveConfigExists}`)
    
    if (sendConfigExists && receiveConfigExists) {
        logger.info(`✅ Both configs already exist, nothing to do`)
        return
    }
    
    // Initialize config
    logger.info(`Initializing configs for EID ${remoteEid}...`)
    const tx = await sdk.initConfig(remoteEid)
    
    if (!tx) {
        logger.error(`Failed to create init config transaction`)
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
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Verify
    const sendConfigExistsAfter = await sdk.sendConfigIsInitialized(remoteEid)
    const receiveConfigExistsAfter = await sdk.receiveConfigIsInitialized(remoteEid)
    
    logger.info(`\n=== Verification ===`)
    logger.info(`Send config exists: ${sendConfigExistsAfter}`)
    logger.info(`Receive config exists: ${receiveConfigExistsAfter}`)
    
    if (sendConfigExistsAfter && receiveConfigExistsAfter) {
        logger.info(`✅ Success! Both configs have been created.`)
    } else {
        logger.error(`❌ Configs were not created. Check the transaction.`)
    }
}

task('lz:oapp:solana:force-init-config', 'Force initialize ULN send/receive configs for a remote EID')
    .addParam('remoteEid', 'Remote endpoint ID (e.g., 40245 for Base Sepolia)')
    .setAction(action)

