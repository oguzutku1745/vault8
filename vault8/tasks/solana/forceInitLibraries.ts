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
    
    logger.info(`Force initializing send/receive libraries for remote EID ${remoteEid}`)
    
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
    
    logger.info(`\nInitializing send library...`)
    const sendLibTxs = await sdk.initializeSendLibrary(remoteEid)
    
    if (sendLibTxs.length > 0) {
        logger.info(`Transaction created for send library`)
        const signedTx = await sdk.sign(sendLibTxs[0])
        const result = await sdk.submit(signedTx)
        logger.info(`✅ Send library initialized: ${result}`)
    } else {
        logger.info(`Send library already initialized or no transaction needed`)
    }
    
    logger.info(`\nInitializing receive library...`)
    const receiveLibTxs = await sdk.initializeReceiveLibrary(remoteEid)
    
    if (receiveLibTxs.length > 0) {
        logger.info(`Transaction created for receive library`)
        const signedTx = await sdk.sign(receiveLibTxs[0])
        const result = await sdk.submit(signedTx)
        logger.info(`✅ Receive library initialized: ${result}`)
    } else {
        logger.info(`Receive library already initialized or no transaction needed`)
    }
    
    logger.info(`\n✅ Done! Libraries should now be registered with the Endpoint.`)
    logger.info(`Verify with: node check-libraries.js`)
}

task('lz:oapp:solana:force-init-libraries', 'Force initialize send/receive libraries for a remote EID')
    .addParam('remoteEid', 'Remote endpoint ID (e.g., 40245 for Base Sepolia)')
    .setAction(action)

