"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComputeUnitInstructions = exports.getComputeUnitPriceAndLimit = exports.TransactionType = exports.getAddressLookupTable = exports.getExplorerTxLink = exports.getLayerZeroScanLink = exports.getSolanaOAppAddress = exports.getSolanaDeployment = exports.saveSolanaDeployment = exports.deriveKeys = exports.useWeb3Js = exports.deriveConnection = void 0;
const assert_1 = __importDefault(require("assert"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const mpl_toolbox_1 = require("@metaplex-foundation/mpl-toolbox");
const umi_1 = require("@metaplex-foundation/umi");
const umi_bundle_defaults_1 = require("@metaplex-foundation/umi-bundle-defaults");
const umi_eddsa_web3js_1 = require("@metaplex-foundation/umi-eddsa-web3js");
const umi_web3js_adapters_1 = require("@metaplex-foundation/umi-web3js-adapters");
const web3_js_1 = require("@solana/web3.js");
const helpers_1 = require("@solana-developers/helpers");
const exponential_backoff_1 = require("exponential-backoff");
const devtools_1 = require("@layerzerolabs/devtools");
const devtools_solana_1 = require("@layerzerolabs/devtools-solana");
const io_devtools_1 = require("@layerzerolabs/io-devtools");
const lz_definitions_1 = require("@layerzerolabs/lz-definitions");
const myoapp_1 = require("../../lib/client/myoapp");
const utils_1 = require("../common/utils");
const LOOKUP_TABLE_ADDRESS = {
    [lz_definitions_1.EndpointId.SOLANA_V2_MAINNET]: (0, umi_1.publicKey)('AokBxha6VMLLgf97B5VYHEtqztamWmYERBmmFvjuTzJB'),
    [lz_definitions_1.EndpointId.SOLANA_V2_TESTNET]: (0, umi_1.publicKey)('9thqPdbR27A1yLWw2spwJLySemiGMXxPnEvfmXVk4KuK'),
};
// create a safe version of getKeypairFromFile that returns undefined if the file does not exist, for checking the default keypair
async function safeGetKeypairDefaultPath(filePath) {
    try {
        return await (0, helpers_1.getKeypairFromFile)(filePath);
    }
    catch (error) {
        // If the error is due to the file not existing, return undefined
        if (error instanceof Error && error.message.includes('Could not read keypair')) {
            return undefined;
        }
        throw error; // Rethrow if it's a different error
    }
}
// TODO in another PR: consider moving keypair related functions to tasks/solana/utils.ts
async function getSolanaKeypair(readOnly = false) {
    const logger = (0, io_devtools_1.createLogger)();
    // Early exit if read-only: ephemeral Keypair is enough.
    if (readOnly) {
        logger.info('Read-only mode: Using ephemeral (randomly generated) keypair.');
        return web3_js_1.Keypair.generate();
    }
    // Attempt to load from each source
    const keypairEnvPrivate = process.env.SOLANA_PRIVATE_KEY
        ? (0, helpers_1.getKeypairFromEnvironment)('SOLANA_PRIVATE_KEY')
        : undefined; // #1 SOLANA_PRIVATE_KEY
    const keypairEnvPath = process.env.SOLANA_KEYPAIR_PATH
        ? await (0, helpers_1.getKeypairFromFile)(process.env.SOLANA_KEYPAIR_PATH)
        : undefined; // #2 SOLANA_KEYPAIR_PATH
    const keypairDefaultPath = await safeGetKeypairDefaultPath(); // #3 ~/.config/solana/id.json
    // Throw if no keypair is found via all 3 methods
    if (!keypairEnvPrivate && !keypairEnvPath && !keypairDefaultPath) {
        throw new Error('No Solana keypair found. Provide SOLANA_PRIVATE_KEY, ' +
            'SOLANA_KEYPAIR_PATH, or place a valid keypair at ~/.config/solana/id.json.');
    }
    // If both environment-based keys exist, ensure they match
    if (keypairEnvPrivate && keypairEnvPath) {
        if (keypairEnvPrivate.publicKey.equals(keypairEnvPath.publicKey)) {
            logger.info('Both SOLANA_PRIVATE_KEY and SOLANA_KEYPAIR_PATH match. Using environment-based keypair.');
            return keypairEnvPrivate;
        }
        else {
            throw new Error(`Conflict: SOLANA_PRIVATE_KEY and SOLANA_KEYPAIR_PATH are different keypairs.\n` +
                `Path: ${process.env.SOLANA_KEYPAIR_PATH} => ${keypairEnvPath.publicKey.toBase58()}\n` +
                `Env : ${keypairEnvPrivate.publicKey.toBase58()}`);
        }
    }
    // If exactly one environment-based keypair is found, use it immediately
    if (keypairEnvPrivate) {
        logger.info(`Using Solana keypair from SOLANA_PRIVATE_KEY => ${keypairEnvPrivate.publicKey.toBase58()}`);
        return keypairEnvPrivate;
    }
    if (keypairEnvPath) {
        logger.info(`Using Solana keypair from SOLANA_KEYPAIR_PATH (${process.env.SOLANA_KEYPAIR_PATH}) => ${keypairEnvPath.publicKey.toBase58()}`);
        return keypairEnvPath;
    }
    // Otherwise, default path is the last fallback
    logger.info(`No environment-based keypair found. Found keypair at default path => ${keypairDefaultPath.publicKey.toBase58()}`);
    const doContinue = await (0, io_devtools_1.promptToContinue)(`Defaulting to ~/.config/solana/id.json with address ${keypairDefaultPath.publicKey.toBase58()}. Use this keypair?`);
    if (!doContinue)
        process.exit(1);
    return keypairDefaultPath;
}
/**
 * Derive common connection and UMI objects for a given endpoint ID.
 * @param eid {EndpointId}
 */
const deriveConnection = async (eid, readOnly = false) => {
    const keypair = await getSolanaKeypair(readOnly);
    const connectionFactory = (0, utils_1.createSolanaConnectionFactory)();
    const connection = await connectionFactory(eid);
    const umi = (0, umi_bundle_defaults_1.createUmi)(connection.rpcEndpoint).use((0, mpl_toolbox_1.mplToolbox)());
    const umiWalletKeyPair = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
    const umiWalletSigner = (0, umi_1.createSignerFromKeypair)(umi, umiWalletKeyPair);
    umi.use((0, umi_1.signerIdentity)(umiWalletSigner));
    return {
        connection,
        umi,
        umiWalletKeyPair,
        umiWalletSigner,
    };
};
exports.deriveConnection = deriveConnection;
const useWeb3Js = async () => {
    // note: if we are okay with exporting getSolanaKeypair, then useWeb3js can be removed
    const keypair = await getSolanaKeypair();
    return {
        web3JsKeypair: keypair,
    };
};
exports.useWeb3Js = useWeb3Js;
/**
 * Derive the keys needed for the OFT program.
 * @param programIdStr {string}
 */
const deriveKeys = (programIdStr) => {
    const programId = (0, umi_1.publicKey)(programIdStr);
    const eddsa = (0, umi_eddsa_web3js_1.createWeb3JsEddsa)();
    const myoappDeriver = new myoapp_1.MyOApp(programId);
    const lockBox = eddsa.generateKeypair();
    const escrowPK = lockBox.publicKey;
    const [oappPda] = myoappDeriver.pda.oapp();
    return {
        programId,
        lockBox,
        escrowPK,
        oappPda,
        eddsa,
    };
};
exports.deriveKeys = deriveKeys;
/**
 * Outputs the OFT accounts to a JSON file.
 * @param eid {EndpointId}
 * @param programId {string}
 * @param oapp {string}
 */
const saveSolanaDeployment = (eid, programId, oapp) => {
    const outputDir = `./deployments/${(0, lz_definitions_1.endpointIdToNetwork)(eid)}`;
    if (!(0, node_fs_1.existsSync)(outputDir)) {
        (0, node_fs_1.mkdirSync)(outputDir, { recursive: true });
    }
    (0, node_fs_1.writeFileSync)(`${outputDir}/OApp.json`, JSON.stringify({
        programId,
        oapp,
    }, null, 4));
    console.log(`Accounts have been saved to ${outputDir}/OApp.json`);
};
exports.saveSolanaDeployment = saveSolanaDeployment;
/**
 * Reads the OFT deployment info from disk for the given endpoint ID.
 * @param eid {EndpointId}
 * @returns The contents of the OApp.json file as a JSON object.
 */
const getSolanaDeployment = (eid) => {
    if (!eid) {
        throw new Error('eid is required');
    }
    const outputDir = node_path_1.default.join('deployments', (0, lz_definitions_1.endpointIdToNetwork)(eid));
    const filePath = node_path_1.default.join(outputDir, 'OApp.json'); // Note: if you have multiple deployments, change this filename to refer to the desired deployment file
    if (!(0, node_fs_1.existsSync)(filePath)) {
        utils_1.DebugLogger.printErrorAndFixSuggestion(utils_1.KnownErrors.SOLANA_DEPLOYMENT_NOT_FOUND);
        throw new Error(`Could not find Solana deployment file for eid ${eid} at: ${filePath}`);
    }
    const fileContents = (0, node_fs_1.readFileSync)(filePath, 'utf-8');
    return JSON.parse(fileContents);
};
exports.getSolanaDeployment = getSolanaDeployment;
const getSolanaOAppAddress = (eid) => {
    const { oapp } = (0, exports.getSolanaDeployment)(eid);
    if (!oapp) {
        throw new Error('oapp not defined in the deployment file');
    }
    return oapp;
};
exports.getSolanaOAppAddress = getSolanaOAppAddress;
// TODO: move below outside of solana folder since it's generic
const getLayerZeroScanLink = (hash, isTestnet = false) => isTestnet ? `https://testnet.layerzeroscan.com/tx/${hash}` : `https://layerzeroscan.com/tx/${hash}`;
exports.getLayerZeroScanLink = getLayerZeroScanLink;
const getExplorerTxLink = (hash, isTestnet = false) => `https://solscan.io/tx/${hash}?cluster=${isTestnet ? 'devnet' : 'mainnet-beta'}`;
exports.getExplorerTxLink = getExplorerTxLink;
const getAddressLookupTable = async (connection, umi, fromEid) => {
    // Lookup Table Address and Priority Fee Calculation
    const lookupTableAddress = LOOKUP_TABLE_ADDRESS[fromEid];
    (0, assert_1.default)(lookupTableAddress != null, `No lookup table found for ${(0, devtools_1.formatEid)(fromEid)}`);
    const addressLookupTableInput = await (0, mpl_toolbox_1.fetchAddressLookupTable)(umi, lookupTableAddress);
    if (!addressLookupTableInput) {
        throw new Error(`No address lookup table found for ${lookupTableAddress}`);
    }
    const { value: lookupTableAccount } = await connection.getAddressLookupTable((0, umi_web3js_adapters_1.toWeb3JsPublicKey)(lookupTableAddress));
    if (!lookupTableAccount) {
        throw new Error(`No address lookup table account found for ${lookupTableAddress}`);
    }
    return {
        lookupTableAddress,
        addressLookupTableInput,
        lookupTableAccount,
    };
};
exports.getAddressLookupTable = getAddressLookupTable;
var TransactionType;
(function (TransactionType) {
    TransactionType["CreateToken"] = "CreateToken";
    TransactionType["CreateMultisig"] = "CreateMultisig";
    TransactionType["InitOft"] = "InitOft";
    TransactionType["SetAuthority"] = "SetAuthority";
    TransactionType["InitConfig"] = "InitConfig";
    TransactionType["SendOFT"] = "SendOFT";
    TransactionType["SendMessage"] = "SendMessage";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
const TransactionCuEstimates = {
    // for the sample values, they are: devnet, mainnet
    [TransactionType.CreateToken]: 125000, // actual sample: (59073, 123539), 55785 (more volatile as it has CPI to Metaplex)
    [TransactionType.CreateMultisig]: 5000, // actual sample: 3,230
    [TransactionType.InitOft]: 70000, // actual sample: 59207, 65198 (note: this is the only transaction that createOFTAdapter does)
    [TransactionType.SetAuthority]: 8000, // actual sample: 6424, 6472
    [TransactionType.InitConfig]: 42000, // actual sample: 33157, 40657
    [TransactionType.SendOFT]: 230000, // actual sample: 217,784
    [TransactionType.SendMessage]: 230000, // this is an estimate, not based on actual sample
};
const getComputeUnitPriceAndLimit = async (connection, ixs, wallet, lookupTableAccount, transactionType) => {
    const { averageFeeExcludingZeros } = await (0, devtools_solana_1.getPrioritizationFees)(connection);
    const priorityFee = Math.round(averageFeeExcludingZeros);
    const computeUnitPrice = BigInt(priorityFee);
    let computeUnits;
    try {
        computeUnits = await (0, exponential_backoff_1.backOff)(() => (0, helpers_1.getSimulationComputeUnits)(
        // @ts-expect-error complain about the type of connection, but it's good. cause: versions differing.
        connection, ixs.map((ix) => (0, umi_web3js_adapters_1.toWeb3JsInstruction)(ix)), (0, umi_web3js_adapters_1.toWeb3JsPublicKey)(wallet.publicKey), [lookupTableAccount]), {
            maxDelay: 10000,
            numOfAttempts: 3,
        });
    }
    catch (e) {
        console.error(`Error retrieving simulations compute units from RPC:`, e);
        const continueByUsingHardcodedEstimate = await (0, io_devtools_1.promptToContinue)('Failed to call simulateTransaction on the RPC. This can happen when the network is congested. Would you like to use hardcoded estimates (TransactionCuEstimates) ? This may result in slightly overpaying for the transaction.');
        if (!continueByUsingHardcodedEstimate) {
            throw new Error('Failed to call simulateTransaction on the RPC and user chose to not continue with hardcoded estimate.');
        }
        console.log(`Falling back to hardcoded estimate for ${transactionType}: ${TransactionCuEstimates[transactionType]} CUs`);
        computeUnits = TransactionCuEstimates[transactionType];
    }
    if (!computeUnits) {
        throw new Error('Unable to compute units');
    }
    return {
        computeUnitPrice,
        computeUnits,
    };
};
exports.getComputeUnitPriceAndLimit = getComputeUnitPriceAndLimit;
const addComputeUnitInstructions = async (connection, umi, eid, txBuilder, umiWalletSigner, computeUnitPriceScaleFactor, transactionType) => {
    const computeUnitLimitScaleFactor = 1.1; // hardcoded to 1.1 as the estimations are not perfect and can fall slightly short of the actual CU usage on-chain
    const { addressLookupTableInput, lookupTableAccount } = await (0, exports.getAddressLookupTable)(connection, umi, eid);
    const { computeUnitPrice, computeUnits } = await (0, exports.getComputeUnitPriceAndLimit)(connection, txBuilder.getInstructions(), umiWalletSigner, lookupTableAccount, transactionType);
    // Since transaction builders are immutable, we must be careful to always assign the result of the add and prepend
    // methods to a new variable.
    const newTxBuilder = (0, umi_1.transactionBuilder)()
        .add((0, mpl_toolbox_1.setComputeUnitPrice)(umi, {
        microLamports: computeUnitPrice * BigInt(Math.floor(computeUnitPriceScaleFactor)),
    }))
        .add((0, mpl_toolbox_1.setComputeUnitLimit)(umi, { units: computeUnits * computeUnitLimitScaleFactor }))
        .setAddressLookupTables([addressLookupTableInput])
        .add(txBuilder);
    return newTxBuilder;
};
exports.addComputeUnitInstructions = addComputeUnitInstructions;
