"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
require("dotenv/config");
require("hardhat-deploy");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-contract-sizer");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy-ethers");
require("@layerzerolabs/toolbox-hardhat");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
require("./tasks/index");
// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC;
// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const accounts = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
        ? [PRIVATE_KEY]
        : undefined;
if (accounts == null) {
    console.warn('Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.');
}
const config = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        'arbitrum-sepolia': {
            eid: lz_definitions_1.EndpointId.ARBSEP_V2_TESTNET,
            url: process.env.RPC_URL_ARB_SEPOLIA || 'https://arbitrum-sepolia.gateway.tenderly.co',
            accounts,
        },
        hardhat: {
            // Need this for testing because TestHelperOz5.sol is exceeding the compiled contract size limit
            allowUnlimitedContractSize: true,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
    },
};
exports.default = config;
