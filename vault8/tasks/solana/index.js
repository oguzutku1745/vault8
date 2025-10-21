"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComputeUnitInstructions = exports.getComputeUnitPriceAndLimit = exports.TransactionType = exports.getAddressLookupTable = exports.getExplorerTxLink = exports.getLayerZeroScanLink = exports.getSolanaOAppAddress = exports.getSolanaDeployment = exports.saveSolanaDeployment = exports.deriveKeys = exports.useWeb3Js = exports.deriveConnection = void 0;
var assert_1 = __importDefault(require("assert"));
var node_fs_1 = require("node:fs");
var node_path_1 = __importDefault(require("node:path"));
var mpl_toolbox_1 = require("@metaplex-foundation/mpl-toolbox");
var umi_1 = require("@metaplex-foundation/umi");
var umi_bundle_defaults_1 = require("@metaplex-foundation/umi-bundle-defaults");
var umi_eddsa_web3js_1 = require("@metaplex-foundation/umi-eddsa-web3js");
var umi_web3js_adapters_1 = require("@metaplex-foundation/umi-web3js-adapters");
var web3_js_1 = require("@solana/web3.js");
var helpers_1 = require("@solana-developers/helpers");
var exponential_backoff_1 = require("exponential-backoff");
var devtools_1 = require("@layerzerolabs/devtools");
var devtools_solana_1 = require("@layerzerolabs/devtools-solana");
var io_devtools_1 = require("@layerzerolabs/io-devtools");
var lz_definitions_1 = require("@layerzerolabs/lz-definitions");
var myoapp_1 = require("../../lib/client/myoapp");
var utils_1 = require("../common/utils");
var LOOKUP_TABLE_ADDRESS = (_a = {},
    _a[lz_definitions_1.EndpointId.SOLANA_V2_MAINNET] = (0, umi_1.publicKey)('AokBxha6VMLLgf97B5VYHEtqztamWmYERBmmFvjuTzJB'),
    _a[lz_definitions_1.EndpointId.SOLANA_V2_TESTNET] = (0, umi_1.publicKey)('9thqPdbR27A1yLWw2spwJLySemiGMXxPnEvfmXVk4KuK'),
    _a);
// create a safe version of getKeypairFromFile that returns undefined if the file does not exist, for checking the default keypair
function safeGetKeypairDefaultPath(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, helpers_1.getKeypairFromFile)(filePath)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_1 = _a.sent();
                    // If the error is due to the file not existing, return undefined
                    if (error_1 instanceof Error && error_1.message.includes('Could not read keypair')) {
                        return [2 /*return*/, undefined];
                    }
                    throw error_1; // Rethrow if it's a different error
                case 3: return [2 /*return*/];
            }
        });
    });
}
// TODO in another PR: consider moving keypair related functions to tasks/solana/utils.ts
function getSolanaKeypair() {
    return __awaiter(this, arguments, void 0, function (readOnly) {
        var logger, keypairEnvPrivate, keypairEnvPath, _a, keypairDefaultPath, doContinue;
        if (readOnly === void 0) { readOnly = false; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger = (0, io_devtools_1.createLogger)();
                    // Early exit if read-only: ephemeral Keypair is enough.
                    if (readOnly) {
                        logger.info('Read-only mode: Using ephemeral (randomly generated) keypair.');
                        return [2 /*return*/, web3_js_1.Keypair.generate()];
                    }
                    keypairEnvPrivate = process.env.SOLANA_PRIVATE_KEY
                        ? (0, helpers_1.getKeypairFromEnvironment)('SOLANA_PRIVATE_KEY')
                        : undefined // #1 SOLANA_PRIVATE_KEY
                    ;
                    if (!process.env.SOLANA_KEYPAIR_PATH) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, helpers_1.getKeypairFromFile)(process.env.SOLANA_KEYPAIR_PATH)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = undefined; // #2 SOLANA_KEYPAIR_PATH
                    _b.label = 3;
                case 3:
                    keypairEnvPath = _a;
                    return [4 /*yield*/, safeGetKeypairDefaultPath()
                        // Throw if no keypair is found via all 3 methods
                    ]; // #3 ~/.config/solana/id.json
                case 4:
                    keypairDefaultPath = _b.sent() // #3 ~/.config/solana/id.json
                    ;
                    // Throw if no keypair is found via all 3 methods
                    if (!keypairEnvPrivate && !keypairEnvPath && !keypairDefaultPath) {
                        throw new Error('No Solana keypair found. Provide SOLANA_PRIVATE_KEY, ' +
                            'SOLANA_KEYPAIR_PATH, or place a valid keypair at ~/.config/solana/id.json.');
                    }
                    // If both environment-based keys exist, ensure they match
                    if (keypairEnvPrivate && keypairEnvPath) {
                        if (keypairEnvPrivate.publicKey.equals(keypairEnvPath.publicKey)) {
                            logger.info('Both SOLANA_PRIVATE_KEY and SOLANA_KEYPAIR_PATH match. Using environment-based keypair.');
                            return [2 /*return*/, keypairEnvPrivate];
                        }
                        else {
                            throw new Error("Conflict: SOLANA_PRIVATE_KEY and SOLANA_KEYPAIR_PATH are different keypairs.\n" +
                                "Path: ".concat(process.env.SOLANA_KEYPAIR_PATH, " => ").concat(keypairEnvPath.publicKey.toBase58(), "\n") +
                                "Env : ".concat(keypairEnvPrivate.publicKey.toBase58()));
                        }
                    }
                    // If exactly one environment-based keypair is found, use it immediately
                    if (keypairEnvPrivate) {
                        logger.info("Using Solana keypair from SOLANA_PRIVATE_KEY => ".concat(keypairEnvPrivate.publicKey.toBase58()));
                        return [2 /*return*/, keypairEnvPrivate];
                    }
                    if (keypairEnvPath) {
                        logger.info("Using Solana keypair from SOLANA_KEYPAIR_PATH (".concat(process.env.SOLANA_KEYPAIR_PATH, ") => ").concat(keypairEnvPath.publicKey.toBase58()));
                        return [2 /*return*/, keypairEnvPath];
                    }
                    // Otherwise, default path is the last fallback
                    logger.info("No environment-based keypair found. Found keypair at default path => ".concat(keypairDefaultPath.publicKey.toBase58()));
                    return [4 /*yield*/, (0, io_devtools_1.promptToContinue)("Defaulting to ~/.config/solana/id.json with address ".concat(keypairDefaultPath.publicKey.toBase58(), ". Use this keypair?"))];
                case 5:
                    doContinue = _b.sent();
                    if (!doContinue)
                        process.exit(1);
                    return [2 /*return*/, keypairDefaultPath];
            }
        });
    });
}
/**
 * Derive common connection and UMI objects for a given endpoint ID.
 * @param eid {EndpointId}
 */
var deriveConnection = function (eid_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([eid_1], args_1, true), void 0, function (eid, readOnly) {
        var keypair, connectionFactory, connection, umi, umiWalletKeyPair, umiWalletSigner;
        if (readOnly === void 0) { readOnly = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSolanaKeypair(readOnly)];
                case 1:
                    keypair = _a.sent();
                    connectionFactory = (0, utils_1.createSolanaConnectionFactory)();
                    return [4 /*yield*/, connectionFactory(eid)];
                case 2:
                    connection = _a.sent();
                    umi = (0, umi_bundle_defaults_1.createUmi)(connection.rpcEndpoint).use((0, mpl_toolbox_1.mplToolbox)());
                    umiWalletKeyPair = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
                    umiWalletSigner = (0, umi_1.createSignerFromKeypair)(umi, umiWalletKeyPair);
                    umi.use((0, umi_1.signerIdentity)(umiWalletSigner));
                    return [2 /*return*/, {
                            connection: connection,
                            umi: umi,
                            umiWalletKeyPair: umiWalletKeyPair,
                            umiWalletSigner: umiWalletSigner,
                        }];
            }
        });
    });
};
exports.deriveConnection = deriveConnection;
var useWeb3Js = function () { return __awaiter(void 0, void 0, void 0, function () {
    var keypair;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getSolanaKeypair()];
            case 1:
                keypair = _a.sent();
                return [2 /*return*/, {
                        web3JsKeypair: keypair,
                    }];
        }
    });
}); };
exports.useWeb3Js = useWeb3Js;
/**
 * Derive the keys needed for the OFT program.
 * @param programIdStr {string}
 */
var deriveKeys = function (programIdStr) {
    var programId = (0, umi_1.publicKey)(programIdStr);
    var eddsa = (0, umi_eddsa_web3js_1.createWeb3JsEddsa)();
    var myoappDeriver = new myoapp_1.MyOApp(programId);
    var lockBox = eddsa.generateKeypair();
    var escrowPK = lockBox.publicKey;
    var oappPda = myoappDeriver.pda.oapp()[0];
    return {
        programId: programId,
        lockBox: lockBox,
        escrowPK: escrowPK,
        oappPda: oappPda,
        eddsa: eddsa,
    };
};
exports.deriveKeys = deriveKeys;
/**
 * Outputs the OFT accounts to a JSON file.
 * @param eid {EndpointId}
 * @param programId {string}
 * @param oapp {string}
 */
var saveSolanaDeployment = function (eid, programId, oapp) {
    var outputDir = "./deployments/".concat((0, lz_definitions_1.endpointIdToNetwork)(eid));
    if (!(0, node_fs_1.existsSync)(outputDir)) {
        (0, node_fs_1.mkdirSync)(outputDir, { recursive: true });
    }
    (0, node_fs_1.writeFileSync)("".concat(outputDir, "/OApp.json"), JSON.stringify({
        programId: programId,
        oapp: oapp,
    }, null, 4));
    console.log("Accounts have been saved to ".concat(outputDir, "/OApp.json"));
};
exports.saveSolanaDeployment = saveSolanaDeployment;
/**
 * Reads the OFT deployment info from disk for the given endpoint ID.
 * @param eid {EndpointId}
 * @returns The contents of the OApp.json file as a JSON object.
 */
var getSolanaDeployment = function (eid) {
    if (!eid) {
        throw new Error('eid is required');
    }
    var outputDir = node_path_1.default.join('deployments', (0, lz_definitions_1.endpointIdToNetwork)(eid));
    var filePath = node_path_1.default.join(outputDir, 'OApp.json'); // Note: if you have multiple deployments, change this filename to refer to the desired deployment file
    if (!(0, node_fs_1.existsSync)(filePath)) {
        utils_1.DebugLogger.printErrorAndFixSuggestion(utils_1.KnownErrors.SOLANA_DEPLOYMENT_NOT_FOUND);
        throw new Error("Could not find Solana deployment file for eid ".concat(eid, " at: ").concat(filePath));
    }
    var fileContents = (0, node_fs_1.readFileSync)(filePath, 'utf-8');
    return JSON.parse(fileContents);
};
exports.getSolanaDeployment = getSolanaDeployment;
var getSolanaOAppAddress = function (eid) {
    var oapp = (0, exports.getSolanaDeployment)(eid).oapp;
    if (!oapp) {
        throw new Error('oapp not defined in the deployment file');
    }
    return oapp;
};
exports.getSolanaOAppAddress = getSolanaOAppAddress;
// TODO: move below outside of solana folder since it's generic
var getLayerZeroScanLink = function (hash, isTestnet) {
    if (isTestnet === void 0) { isTestnet = false; }
    return isTestnet ? "https://testnet.layerzeroscan.com/tx/".concat(hash) : "https://layerzeroscan.com/tx/".concat(hash);
};
exports.getLayerZeroScanLink = getLayerZeroScanLink;
var getExplorerTxLink = function (hash, isTestnet) {
    if (isTestnet === void 0) { isTestnet = false; }
    return "https://solscan.io/tx/".concat(hash, "?cluster=").concat(isTestnet ? 'devnet' : 'mainnet-beta');
};
exports.getExplorerTxLink = getExplorerTxLink;
var getAddressLookupTable = function (connection, umi, fromEid) { return __awaiter(void 0, void 0, void 0, function () {
    var lookupTableAddress, addressLookupTableInput, lookupTableAccount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lookupTableAddress = LOOKUP_TABLE_ADDRESS[fromEid];
                (0, assert_1.default)(lookupTableAddress != null, "No lookup table found for ".concat((0, devtools_1.formatEid)(fromEid)));
                return [4 /*yield*/, (0, mpl_toolbox_1.fetchAddressLookupTable)(umi, lookupTableAddress)];
            case 1:
                addressLookupTableInput = _a.sent();
                if (!addressLookupTableInput) {
                    throw new Error("No address lookup table found for ".concat(lookupTableAddress));
                }
                return [4 /*yield*/, connection.getAddressLookupTable((0, umi_web3js_adapters_1.toWeb3JsPublicKey)(lookupTableAddress))];
            case 2:
                lookupTableAccount = (_a.sent()).value;
                if (!lookupTableAccount) {
                    throw new Error("No address lookup table account found for ".concat(lookupTableAddress));
                }
                return [2 /*return*/, {
                        lookupTableAddress: lookupTableAddress,
                        addressLookupTableInput: addressLookupTableInput,
                        lookupTableAccount: lookupTableAccount,
                    }];
        }
    });
}); };
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
var TransactionCuEstimates = (_b = {},
    // for the sample values, they are: devnet, mainnet
    _b[TransactionType.CreateToken] = 125000,
    _b[TransactionType.CreateMultisig] = 5000,
    _b[TransactionType.InitOft] = 70000,
    _b[TransactionType.SetAuthority] = 8000,
    _b[TransactionType.InitConfig] = 42000,
    _b[TransactionType.SendOFT] = 230000,
    _b[TransactionType.SendMessage] = 230000,
    _b);
var getComputeUnitPriceAndLimit = function (connection, ixs, wallet, lookupTableAccount, transactionType) { return __awaiter(void 0, void 0, void 0, function () {
    var averageFeeExcludingZeros, priorityFee, computeUnitPrice, computeUnits, e_1, continueByUsingHardcodedEstimate;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, devtools_solana_1.getPrioritizationFees)(connection)];
            case 1:
                averageFeeExcludingZeros = (_a.sent()).averageFeeExcludingZeros;
                priorityFee = Math.round(averageFeeExcludingZeros);
                computeUnitPrice = BigInt(priorityFee);
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 6]);
                return [4 /*yield*/, (0, exponential_backoff_1.backOff)(function () {
                        return (0, helpers_1.getSimulationComputeUnits)(
                        // @ts-expect-error complain about the type of connection, but it's good. cause: versions differing.
                        connection, ixs.map(function (ix) { return (0, umi_web3js_adapters_1.toWeb3JsInstruction)(ix); }), (0, umi_web3js_adapters_1.toWeb3JsPublicKey)(wallet.publicKey), [lookupTableAccount]);
                    }, {
                        maxDelay: 10000,
                        numOfAttempts: 3,
                    })];
            case 3:
                computeUnits = _a.sent();
                return [3 /*break*/, 6];
            case 4:
                e_1 = _a.sent();
                console.error("Error retrieving simulations compute units from RPC:", e_1);
                return [4 /*yield*/, (0, io_devtools_1.promptToContinue)('Failed to call simulateTransaction on the RPC. This can happen when the network is congested. Would you like to use hardcoded estimates (TransactionCuEstimates) ? This may result in slightly overpaying for the transaction.')];
            case 5:
                continueByUsingHardcodedEstimate = _a.sent();
                if (!continueByUsingHardcodedEstimate) {
                    throw new Error('Failed to call simulateTransaction on the RPC and user chose to not continue with hardcoded estimate.');
                }
                console.log("Falling back to hardcoded estimate for ".concat(transactionType, ": ").concat(TransactionCuEstimates[transactionType], " CUs"));
                computeUnits = TransactionCuEstimates[transactionType];
                return [3 /*break*/, 6];
            case 6:
                if (!computeUnits) {
                    throw new Error('Unable to compute units');
                }
                return [2 /*return*/, {
                        computeUnitPrice: computeUnitPrice,
                        computeUnits: computeUnits,
                    }];
        }
    });
}); };
exports.getComputeUnitPriceAndLimit = getComputeUnitPriceAndLimit;
var addComputeUnitInstructions = function (connection, umi, eid, txBuilder, umiWalletSigner, computeUnitPriceScaleFactor, transactionType) { return __awaiter(void 0, void 0, void 0, function () {
    var computeUnitLimitScaleFactor, _a, addressLookupTableInput, lookupTableAccount, _b, computeUnitPrice, computeUnits, newTxBuilder;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                computeUnitLimitScaleFactor = 1.1 // hardcoded to 1.1 as the estimations are not perfect and can fall slightly short of the actual CU usage on-chain
                ;
                return [4 /*yield*/, (0, exports.getAddressLookupTable)(connection, umi, eid)];
            case 1:
                _a = _c.sent(), addressLookupTableInput = _a.addressLookupTableInput, lookupTableAccount = _a.lookupTableAccount;
                return [4 /*yield*/, (0, exports.getComputeUnitPriceAndLimit)(connection, txBuilder.getInstructions(), umiWalletSigner, lookupTableAccount, transactionType)
                    // Since transaction builders are immutable, we must be careful to always assign the result of the add and prepend
                    // methods to a new variable.
                ];
            case 2:
                _b = _c.sent(), computeUnitPrice = _b.computeUnitPrice, computeUnits = _b.computeUnits;
                newTxBuilder = (0, umi_1.transactionBuilder)()
                    .add((0, mpl_toolbox_1.setComputeUnitPrice)(umi, {
                    microLamports: computeUnitPrice * BigInt(Math.floor(computeUnitPriceScaleFactor)),
                }))
                    .add((0, mpl_toolbox_1.setComputeUnitLimit)(umi, { units: computeUnits * computeUnitLimitScaleFactor }))
                    .setAddressLookupTables([addressLookupTableInput])
                    .add(txBuilder);
                return [2 /*return*/, newTxBuilder];
        }
    });
}); };
exports.addComputeUnitInstructions = addComputeUnitInstructions;
