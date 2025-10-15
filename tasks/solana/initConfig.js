"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devtools_evm_hardhat_1 = require("@layerzerolabs/devtools-evm-hardhat");
const ua_devtools_evm_hardhat_1 = require("@layerzerolabs/ua-devtools-evm-hardhat");
const config_1 = require("../../lib/config");
// We'll create clones of the wire task and only override the configurator argument
const wireLikeTask = (0, devtools_evm_hardhat_1.inheritTask)(ua_devtools_evm_hardhat_1.TASK_LZ_OAPP_WIRE);
// This task will use the `initOFTAccounts` configurator that initializes the Solana accounts
const initConfigTask = wireLikeTask('lz:oapp:solana:init-config');
// TODO: currently the message for 'already done' state is "OApp is already wired." which is misleading -> should be changed to "Pathway Config already initialized"
initConfigTask
    .setDescription('Initialize OApp accounts for Solana')
    .setAction(async (args, hre) => hre.run(ua_devtools_evm_hardhat_1.TASK_LZ_OAPP_WIRE, { ...args, internalConfigurator: config_1.initOAppAccounts, isSolanaInitConfig: true }));
