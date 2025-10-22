import assert from 'assert'

import { type DeployFunction } from 'hardhat-deploy/types'

// TODO declare your contract name here
const contractName = 'MyOApp'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre

    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    // This is an external deployment pulled in from @layerzerolabs/lz-evm-sdk-v2
    //
    // @layerzerolabs/toolbox-hardhat takes care of plugging in the external deployments
    // from @layerzerolabs packages based on the configuration in your hardhat config
    //
    // For this to work correctly, your network config must define an eid property
    // set to `EndpointId` as defined in @layerzerolabs/lz-definitions
    //
    // For example:
    //
    // networks: {
    //   fuji: {
    //     ...
    //     eid: EndpointId.AVALANCHE_V2_TESTNET
    //   }
    // }
    const endpointV2Deployment = await hre.deployments.get('EndpointV2')

    // CCTP V2 addresses for Base Sepolia (Testnet)
    const CCTP_TOKEN_MESSENGER_BASE_SEPOLIA = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'
    const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'

    console.log(`CCTP TokenMessenger: ${CCTP_TOKEN_MESSENGER_BASE_SEPOLIA}`)
    console.log(`USDC Token: ${USDC_BASE_SEPOLIA}`)

    const { address } = await deploy(contractName, {
        from: deployer,
        args: [
            endpointV2Deployment.address,          // LayerZero's EndpointV2 address
            deployer,                               // owner/delegate
            CCTP_TOKEN_MESSENGER_BASE_SEPOLIA,     // CCTP V2 TokenMessenger
            USDC_BASE_SEPOLIA,                      // USDC token
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`)
}

deploy.tags = [contractName]

export default deploy
