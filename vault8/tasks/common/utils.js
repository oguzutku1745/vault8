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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEidsInLzConfig = exports.ERRORS_FIXES_MAP = exports.KnownErrors = exports.DebugLogger = exports.createSolanaSignerFactory = exports.createSdkFactory = exports.createSolanaConnectionFactory = void 0;
exports.uint8ArrayToHex = uint8ArrayToHex;
exports.decodeLzReceiveOptions = decodeLzReceiveOptions;
exports.getSolanaUlnConfigPDAs = getSolanaUlnConfigPDAs;
exports.isSolanaEid = isSolanaEid;
exports.isEvmEid = isEvmEid;
var assert_1 = __importDefault(require("assert"));
var web3_js_1 = require("@solana/web3.js");
var devtools_1 = require("@layerzerolabs/devtools");
var devtools_evm_hardhat_1 = require("@layerzerolabs/devtools-evm-hardhat");
var devtools_solana_1 = require("@layerzerolabs/devtools-solana");
var lz_definitions_1 = require("@layerzerolabs/lz-definitions");
var lz_solana_sdk_v2_1 = require("@layerzerolabs/lz-solana-sdk-v2");
var lz_v2_utilities_1 = require("@layerzerolabs/lz-v2-utilities");
var ua_devtools_evm_1 = require("@layerzerolabs/ua-devtools-evm");
var ua_devtools_evm_hardhat_1 = require("@layerzerolabs/ua-devtools-evm-hardhat");
var factory_1 = require("../../lib/factory");
var aptos_1 = require("../aptos");
var createSolanaConnectionFactory = function () {
    var _a;
    return (0, devtools_solana_1.createConnectionFactory)((0, devtools_solana_1.createRpcUrlFactory)((_a = {},
        _a[lz_definitions_1.EndpointId.SOLANA_V2_MAINNET] = process.env.RPC_URL_SOLANA,
        _a[lz_definitions_1.EndpointId.SOLANA_V2_TESTNET] = process.env.RPC_URL_SOLANA_TESTNET,
        _a)));
};
exports.createSolanaConnectionFactory = createSolanaConnectionFactory;
var createSdkFactory = function (userAccount, programId, connectionFactory) {
    if (connectionFactory === void 0) { connectionFactory = (0, exports.createSolanaConnectionFactory)(); }
    // To create a EVM/Solana SDK factory we need to merge the EVM and the Solana factories into one
    //
    // We do this by using the firstFactory helper function that is provided by the devtools package.
    // This function will try to execute the factories one by one and return the first one that succeeds.
    var evmSdkfactory = (0, ua_devtools_evm_1.createOAppFactory)((0, devtools_evm_hardhat_1.createConnectedContractFactory)());
    var aptosSdkFactory = (0, aptos_1.createAptosOAppFactory)();
    var solanaSdkFactory = (0, factory_1.createSimpleOAppFactory)(
    // The first parameter to createOFTFactory is a user account factory
    //
    // This is a function that receives an OmniPoint ({ eid, address } object)
    // and returns a user account to be used with that SDK.
    //
    // For our purposes this will always be the user account coming from the secret key passed in
    function () { return userAccount; }, 
    // The second parameter is a program ID factory
    //
    // This is a function that receives an OmniPoint ({ eid, address } object)
    // and returns a program ID to be used with that SDK.
    //
    // Since we only have one OFT deployed, this will always be the program ID passed as a CLI parameter.
    //
    // In situations where we might have multiple configs with OFTs using multiple program IDs,
    // this function needs to decide which one to use.
    function () { return programId; }, 
    // Last but not least the SDK will require a connection
    connectionFactory);
    // We now "merge" the two SDK factories into one.
    //
    // We do this by using the firstFactory helper function that is provided by the devtools package.
    // This function will try to execute the factories one by one and return the first one that succeeds.
    return function (point) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if ((0, lz_definitions_1.endpointIdToChainType)(point.eid) === lz_definitions_1.ChainType.SOLANA) {
                return [2 /*return*/, solanaSdkFactory(point)];
            }
            else if ((0, lz_definitions_1.endpointIdToChainType)(point.eid) === lz_definitions_1.ChainType.EVM) {
                return [2 /*return*/, evmSdkfactory(point)];
            }
            else if ((0, lz_definitions_1.endpointIdToChainType)(point.eid) === lz_definitions_1.ChainType.APTOS ||
                (0, lz_definitions_1.endpointIdToChainType)(point.eid) === lz_definitions_1.ChainType.INITIA) {
                return [2 /*return*/, aptosSdkFactory(point)];
            }
            else {
                console.error("Unsupported chain type for EID ".concat(point.eid));
                throw new Error("Unsupported chain type for EID ".concat(point.eid));
            }
            return [2 /*return*/];
        });
    }); };
};
exports.createSdkFactory = createSdkFactory;
var createSolanaSignerFactory = function (wallet, connectionFactory, multisigKey) {
    if (connectionFactory === void 0) { connectionFactory = (0, exports.createSolanaConnectionFactory)(); }
    return function (eid) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    (0, assert_1.default)((0, lz_definitions_1.endpointIdToChainType)(eid) === lz_definitions_1.ChainType.SOLANA, "Solana signer factory can only create signers for Solana networks. Received ".concat((0, devtools_1.formatEid)(eid)));
                    if (!multisigKey) return [3 /*break*/, 2];
                    _b = devtools_solana_1.OmniSignerSolanaSquads.bind;
                    _c = [void 0, eid];
                    return [4 /*yield*/, connectionFactory(eid)];
                case 1:
                    _a = new (_b.apply(devtools_solana_1.OmniSignerSolanaSquads, _c.concat([_f.sent(), multisigKey, wallet])))();
                    return [3 /*break*/, 4];
                case 2:
                    _d = devtools_solana_1.OmniSignerSolana.bind;
                    _e = [void 0, eid];
                    return [4 /*yield*/, connectionFactory(eid)];
                case 3:
                    _a = new (_d.apply(devtools_solana_1.OmniSignerSolana, _e.concat([_f.sent(), wallet])))();
                    _f.label = 4;
                case 4: return [2 /*return*/, _a];
            }
        });
    }); };
};
exports.createSolanaSignerFactory = createSolanaSignerFactory;
function uint8ArrayToHex(uint8Array, prefix) {
    if (prefix === void 0) { prefix = false; }
    var hexString = Buffer.from(uint8Array).toString('hex');
    return prefix ? "0x".concat(hexString) : hexString;
}
function formatBigIntForDisplay(n) {
    return n.toLocaleString().replace(/,/g, '_');
}
function decodeLzReceiveOptions(hex) {
    try {
        // Handle empty/undefined values first
        if (!hex || hex === '0x')
            return 'No options set';
        var options = lz_v2_utilities_1.Options.fromOptions(hex);
        var lzReceiveOpt = options.decodeExecutorLzReceiveOption();
        return lzReceiveOpt
            ? "gas: ".concat(formatBigIntForDisplay(lzReceiveOpt.gas), " , value: ").concat(formatBigIntForDisplay(lzReceiveOpt.value), " wei")
            : 'No executor options';
    }
    catch (e) {
        return "Invalid options (".concat(hex.slice(0, 12), "...)");
    }
}
function getSolanaUlnConfigPDAs(remote, connection, ulnAddress, oappPda) {
    return __awaiter(this, void 0, void 0, function () {
        var uln, sendConfig, receiveConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uln = new lz_solana_sdk_v2_1.UlnProgram.Uln(new web3_js_1.PublicKey(ulnAddress));
                    sendConfig = uln.getSendConfigState(connection, new web3_js_1.PublicKey(oappPda), remote);
                    receiveConfig = uln.getReceiveConfigState(connection, new web3_js_1.PublicKey(oappPda), remote);
                    return [4 /*yield*/, Promise.all([sendConfig, receiveConfig])];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
var DebugLogger = /** @class */ (function () {
    function DebugLogger() {
    }
    DebugLogger.keyValue = function (key, value, indentLevel) {
        if (indentLevel === void 0) { indentLevel = 0; }
        var indent = ' '.repeat(indentLevel * 2);
        console.log("".concat(indent, "\u001B[33m").concat(key, ":\u001B[0m ").concat(value));
    };
    DebugLogger.keyHeader = function (key, indentLevel) {
        if (indentLevel === void 0) { indentLevel = 0; }
        var indent = ' '.repeat(indentLevel * 2);
        console.log("".concat(indent, "\u001B[33m").concat(key, ":\u001B[0m"));
    };
    DebugLogger.header = function (text) {
        console.log("\u001B[36m".concat(text, "\u001B[0m"));
    };
    DebugLogger.separator = function () {
        console.log('\x1b[90m----------------------------------------\x1b[0m');
    };
    /**
     * Logs an error (in red) and corresponding fix suggestion (in blue).
     * Uses the ERRORS_FIXES_MAP to retrieve text based on the known error type.
     *
     * @param type Required KnownErrors enum member
     * @param errorMsg Optional string message to append to the error.
     */
    DebugLogger.printErrorAndFixSuggestion = function (type, errorMsg) {
        var fixInfo = exports.ERRORS_FIXES_MAP[type];
        if (!fixInfo) {
            // Fallback if the error type is not recognized
            console.log("\u001B[31mError:\u001B[0m Unknown error type \"".concat(type, "\""));
            return;
        }
        // If errorMsg is specified, append it in parentheses
        var errorOutput = errorMsg ? "".concat(type, ": (").concat(errorMsg, ")") : type;
        // Print the error type in red
        console.log("\u001B[31mError:\u001B[0m ".concat(errorOutput));
        // Print the tip in green
        console.log("\u001B[32mFix suggestion:\u001B[0m ".concat(fixInfo.tip));
        // Print the info in blue
        if (fixInfo.info) {
            console.log("\u001B[34mElaboration:\u001B[0m ".concat(fixInfo.info));
        }
        // log empty line to separate error messages
        console.log();
    };
    return DebugLogger;
}());
exports.DebugLogger = DebugLogger;
var KnownErrors;
(function (KnownErrors) {
    // variable name format: <DOMAIN>_<REASON>
    // e.g. If the user forgets to deploy the OFT Program, the variable name should be:
    // FIX_SUGGESTION_OFT_PROGRAM_NOT_DEPLOYED
    KnownErrors["ULN_INIT_CONFIG_SKIPPED"] = "ULN_INIT_CONFIG_SKIPPED";
    KnownErrors["SOLANA_DEPLOYMENT_NOT_FOUND"] = "SOLANA_DEPLOYMENT_NOT_FOUND";
})(KnownErrors || (exports.KnownErrors = KnownErrors = {}));
exports.ERRORS_FIXES_MAP = (_a = {},
    _a[KnownErrors.ULN_INIT_CONFIG_SKIPPED] = {
        tip: 'Did you run `npx hardhat lz:oft:solana:init-config --oapp-config <LZ_CONFIG_FILE_NAME> --solana-eid <SOLANA_EID>` ?',
        info: 'You must run lz:oft:solana:init-config once before you run lz:oapp:wire. If you have added new pathways, you must also run lz:oft:solana:init-config again.',
    },
    // TODO: verify below (was copied from OFT)
    _a[KnownErrors.SOLANA_DEPLOYMENT_NOT_FOUND] = {
        tip: 'Did you run `npx hardhat lz:oapp:solana:create` ?',
        info: 'The Solana deployment file is required to run config tasks. The default path is ./deployments/solana-<mainnet/testnet>/OApp.json',
    },
    _a);
var listEidsInLzConfig = function (hre, oappConfig) { return __awaiter(void 0, void 0, void 0, function () {
    var graph, error_1, eids, _i, _a, vector;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!oappConfig)
                    throw new Error('Missing oappConfig');
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, hre.run(ua_devtools_evm_hardhat_1.SUBTASK_LZ_OAPP_CONFIG_LOAD, {
                        configPath: oappConfig,
                        schema: ua_devtools_evm_hardhat_1.OAppOmniGraphHardhatSchema,
                        task: ua_devtools_evm_hardhat_1.TASK_LZ_OAPP_CONFIG_GET,
                    })];
            case 2:
                graph = _b.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                if (error_1 instanceof Error) {
                    throw new Error("Failed to load OApp configuration: ".concat(error_1.message));
                }
                else {
                    throw new Error('Failed to load OApp configuration: Unknown error');
                }
                return [3 /*break*/, 4];
            case 4:
                eids = new Set();
                // loop through the connections and add the eids to the Set
                for (_i = 0, _a = graph.connections; _i < _a.length; _i++) {
                    vector = _a[_i].vector;
                    eids.add(vector.from.eid);
                    eids.add(vector.to.eid);
                }
                return [2 /*return*/, Array.from(eids)];
        }
    });
}); };
exports.listEidsInLzConfig = listEidsInLzConfig;
function isSolanaEid(eid) {
    return (0, lz_definitions_1.endpointIdToChainType)(eid) === lz_definitions_1.ChainType.SOLANA;
}
function isEvmEid(eid) {
    return (0, lz_definitions_1.endpointIdToChainType)(eid) === lz_definitions_1.ChainType.EVM;
}
