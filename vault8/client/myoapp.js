"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyOApp = exports.MessageType = exports.MY_OAPP_PROGRAM_ID = exports.types = exports.instructions = exports.errors = exports.accounts = void 0;
exports.getPeer = getPeer;
exports.initConfig = initConfig;
exports.initSendLibrary = initSendLibrary;
exports.initReceiveLibrary = initReceiveLibrary;
exports.initOAppNonce = initOAppNonce;
var umi_1 = require("@metaplex-foundation/umi");
var umi_program_repository_1 = require("@metaplex-foundation/umi-program-repository");
var umi_web3js_adapters_1 = require("@metaplex-foundation/umi-web3js-adapters");
var web3_js_1 = require("@solana/web3.js");
var utils_1 = require("ethers/lib/utils");
var umi_2 = require("@layerzerolabs/lz-solana-sdk-v2/umi");
var accounts = __importStar(require("./generated/my_oapp/accounts"));
exports.accounts = accounts;
var errors = __importStar(require("./generated/my_oapp/errors"));
exports.errors = errors;
var instructions = __importStar(require("./generated/my_oapp/instructions"));
exports.instructions = instructions;
var types = __importStar(require("./generated/my_oapp/types"));
exports.types = types;
var pda_1 = require("./pda");
var my_oapp_1 = require("./generated/my_oapp");
Object.defineProperty(exports, "MY_OAPP_PROGRAM_ID", { enumerable: true, get: function () { return my_oapp_1.MY_OAPP_PROGRAM_ID; } });
var ENDPOINT_PROGRAM_ID = umi_2.EndpointProgram.ENDPOINT_PROGRAM_ID;
var MessageType;
(function (MessageType) {
    MessageType[MessageType["VANILLA"] = 1] = "VANILLA";
    MessageType[MessageType["COMPOSED_TYPE"] = 2] = "COMPOSED_TYPE";
})(MessageType || (exports.MessageType = MessageType = {}));
var MyOApp = /** @class */ (function () {
    function MyOApp(programId, endpointProgramId, rpc) {
        if (endpointProgramId === void 0) { endpointProgramId = umi_2.EndpointProgram.ENDPOINT_PROGRAM_ID; }
        this.programId = programId;
        this.endpointProgramId = endpointProgramId;
        this.pda = new pda_1.MyOAppPDA(programId);
        if (rpc === undefined) {
            rpc = (0, umi_1.createNullRpc)();
            rpc.getCluster = function () { return 'custom'; };
        }
        this.programRepo = (0, umi_program_repository_1.createDefaultProgramRepository)({ rpc: rpc }, [
            {
                name: 'myOapp',
                publicKey: programId,
                getErrorFromCode: function (code, cause) {
                    return errors.getMyOappErrorFromCode(code, this, cause);
                },
                getErrorFromName: function (name, cause) {
                    return errors.getMyOappErrorFromName(name, this, cause);
                },
                isOnCluster: function () {
                    return true;
                },
            },
        ]);
        this.eventAuthority = new umi_2.EventPDA(programId).eventAuthority()[0];
        this.endpointSDK = new umi_2.EndpointProgram.Endpoint(endpointProgramId);
    }
    MyOApp.prototype.getEnforcedOptions = function (rpc, remoteEid) {
        return __awaiter(this, void 0, void 0, function () {
            var peer, peerInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        peer = this.pda.peer(remoteEid)[0];
                        return [4 /*yield*/, accounts.fetchPeerConfig({ rpc: rpc }, peer)];
                    case 1:
                        peerInfo = _a.sent();
                        return [2 /*return*/, peerInfo.enforcedOptions];
                }
            });
        });
    };
    MyOApp.prototype.getProgram = function (clusterFilter) {
        if (clusterFilter === void 0) { clusterFilter = 'custom'; }
        return this.programRepo.get('myOapp', clusterFilter);
    };
    MyOApp.prototype.getStore = function (rpc_1) {
        return __awaiter(this, arguments, void 0, function (rpc, commitment) {
            var count;
            if (commitment === void 0) { commitment = 'confirmed'; }
            return __generator(this, function (_a) {
                count = this.pda.oapp()[0];
                return [2 /*return*/, accounts.safeFetchStore({ rpc: rpc }, count, { commitment: commitment })];
            });
        });
    };
    MyOApp.prototype.initStore = function (payer, admin) {
        var oapp = this.pda.oapp()[0];
        var remainingAccounts = this.endpointSDK.getRegisterOappIxAccountMetaForCPI(payer.publicKey, oapp);
        return instructions
            .initStore({ payer: payer, programs: this.programRepo }, {
            payer: payer,
            store: oapp,
            lzReceiveTypesAccounts: this.pda.lzReceiveTypesAccounts()[0],
            // args
            admin: admin,
            endpoint: this.endpointSDK.programId,
        })
            .addRemainingAccounts(remainingAccounts).items[0];
    };
    MyOApp.prototype.send = function (rpc_1, payer_1, params_1, remainingAccounts_1) {
        return __awaiter(this, arguments, void 0, function (rpc, payer, params, remainingAccounts, commitment) {
            var dstEid, nativeFee, lzTokenFee, message, options, composeMsg, msgLibProgram, oapp, peer, receiverInfo, packetPath, _a;
            if (commitment === void 0) { commitment = 'confirmed'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dstEid = params.dstEid, nativeFee = params.nativeFee, lzTokenFee = params.lzTokenFee, message = params.message, options = params.options, composeMsg = params.composeMsg;
                        return [4 /*yield*/, this.getSendLibraryProgram(rpc, payer, dstEid)];
                    case 1:
                        msgLibProgram = _b.sent();
                        oapp = this.pda.oapp()[0];
                        peer = this.pda.peer(dstEid)[0];
                        return [4 /*yield*/, accounts.fetchPeerConfig({ rpc: rpc }, peer, { commitment: commitment })];
                    case 2:
                        receiverInfo = _b.sent();
                        packetPath = {
                            dstEid: dstEid,
                            sender: oapp,
                            receiver: receiverInfo.peerAddress,
                        };
                        if (!(remainingAccounts !== null && remainingAccounts !== void 0)) return [3 /*break*/, 3];
                        _a = remainingAccounts;
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.endpointSDK.getSendIXAccountMetaForCPI(rpc, payer, {
                            path: packetPath,
                            msgLibProgram: msgLibProgram,
                        }, commitment)];
                    case 4:
                        _a = (_b.sent());
                        _b.label = 5;
                    case 5:
                        remainingAccounts = _a;
                        if (remainingAccounts === undefined) {
                            throw new Error('Failed to get remaining accounts for send instruction');
                        }
                        return [2 /*return*/, instructions
                                .send({ programs: this.programRepo }, {
                                store: oapp,
                                peer: peer,
                                endpoint: this.endpointSDK.pda.setting()[0],
                                // args
                                dstEid: dstEid,
                                message: message,
                                composeMsg: composeMsg !== null && composeMsg !== void 0 ? composeMsg : null,
                                options: options,
                                nativeFee: nativeFee,
                                lzTokenFee: lzTokenFee !== null && lzTokenFee !== void 0 ? lzTokenFee : 0,
                            })
                                .addRemainingAccounts(remainingAccounts).items[0]];
                }
            });
        });
    };
    MyOApp.prototype.setPeerConfig = function (accounts, param) {
        var admin = accounts.admin;
        var remote = param.remote;
        var config;
        if (param.__kind === 'PeerAddress') {
            if (param.peer.length !== 32) {
                throw new Error('Peer must be 32 bytes (left-padded with zeroes)');
            }
            config = types.peerConfigParam('PeerAddress', [param.peer]);
        }
        else if (param.__kind === 'EnforcedOptions') {
            config = {
                __kind: 'EnforcedOptions',
                send: param.send,
                sendAndCall: param.sendAndCall,
            };
        }
        else {
            throw new Error('Invalid peer config');
        }
        return instructions.setPeerConfig({ programs: this.programRepo }, {
            admin: admin,
            store: this.pda.oapp()[0],
            peer: this.pda.peer(remote)[0],
            // args
            remoteEid: remote,
            config: config,
        }).items[0];
    };
    MyOApp.prototype.quote = function (rpc_1, payer_1, params_1, remainingAccounts_1) {
        return __awaiter(this, arguments, void 0, function (rpc, payer, params, remainingAccounts, commitment) {
            var dstEid, message, options, payInLzToken, composeMsg, msgLibProgram, oapp, peer, receiverInfo, packetPath, _a, ix, modifyComputeUnits;
            if (commitment === void 0) { commitment = 'confirmed'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dstEid = params.dstEid, message = params.message, options = params.options, payInLzToken = params.payInLzToken, composeMsg = params.composeMsg;
                        return [4 /*yield*/, this.getSendLibraryProgram(rpc, payer, dstEid)];
                    case 1:
                        msgLibProgram = _b.sent();
                        oapp = this.pda.oapp()[0];
                        peer = this.pda.peer(dstEid)[0];
                        return [4 /*yield*/, accounts.fetchPeerConfig({ rpc: rpc }, peer, { commitment: commitment })];
                    case 2:
                        receiverInfo = _b.sent();
                        packetPath = {
                            dstEid: dstEid,
                            sender: oapp,
                            receiver: receiverInfo.peerAddress,
                        };
                        if (!(remainingAccounts !== null && remainingAccounts !== void 0)) return [3 /*break*/, 3];
                        _a = remainingAccounts;
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.endpointSDK.getQuoteIXAccountMetaForCPI(rpc, payer, {
                            path: packetPath,
                            msgLibProgram: msgLibProgram,
                        })];
                    case 4:
                        _a = (_b.sent());
                        _b.label = 5;
                    case 5:
                        remainingAccounts = _a;
                        if (remainingAccounts === undefined) {
                            throw new Error('Failed to get remaining accounts for quote instruction');
                        }
                        ix = instructions
                            .quoteSend({
                            programs: this.programRepo,
                        }, {
                            store: oapp,
                            peer: peer,
                            endpoint: this.endpointSDK.pda.setting()[0],
                            // args
                            dstEid: dstEid,
                            message: message,
                            composeMsg: composeMsg !== null && composeMsg !== void 0 ? composeMsg : null,
                            options: options,
                            payInLzToken: payInLzToken,
                            receiver: packetPath.receiver,
                        })
                            .addRemainingAccounts(remainingAccounts).items[0];
                        modifyComputeUnits = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
                            units: 400000,
                        });
                        return [2 /*return*/, (0, umi_2.simulateWeb3JsTransaction)(rpc, [modifyComputeUnits, (0, umi_web3js_adapters_1.toWeb3JsInstruction)(ix.instruction)], this.programId, payer, umi_2.EndpointProgram.types.getMessagingFeeSerializer(), 'confirmed')];
                }
            });
        });
    };
    MyOApp.prototype.getSendLibraryProgram = function (rpc, payer, dstEid) {
        return __awaiter(this, void 0, void 0, function () {
            var oapp, sendLibInfo, msgLibProgram, msgLibVersion;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        oapp = this.pda.oapp()[0];
                        return [4 /*yield*/, this.endpointSDK.getSendLibrary(rpc, oapp, dstEid)];
                    case 1:
                        sendLibInfo = _a.sent();
                        if (!sendLibInfo.programId) {
                            throw new Error('Send library not initialized or blocked message library');
                        }
                        msgLibProgram = sendLibInfo.programId;
                        return [4 /*yield*/, this.endpointSDK.getMessageLibVersion(rpc, payer, msgLibProgram)];
                    case 2:
                        msgLibVersion = _a.sent();
                        if (msgLibVersion.major === 0n && msgLibVersion.minor == 0 && msgLibVersion.endpointVersion == 2) {
                            return [2 /*return*/, new umi_2.SimpleMessageLibProgram.SimpleMessageLib(msgLibProgram)];
                        }
                        else if (msgLibVersion.major === 3n && msgLibVersion.minor == 0 && msgLibVersion.endpointVersion == 2) {
                            return [2 /*return*/, new umi_2.UlnProgram.Uln(msgLibProgram)];
                        }
                        throw new Error("Unsupported message library version: ".concat(JSON.stringify(msgLibVersion, null, 2)));
                }
            });
        });
    };
    return MyOApp;
}());
exports.MyOApp = MyOApp;
function getPeer(rpc, dstEid, oftProgramId) {
    return __awaiter(this, void 0, void 0, function () {
        var peer, info;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    peer = new pda_1.MyOAppPDA(oftProgramId).peer(dstEid)[0];
                    return [4 /*yield*/, accounts.fetchPeerConfig({ rpc: rpc }, peer)];
                case 1:
                    info = _a.sent();
                    return [2 /*return*/, (0, utils_1.hexlify)(info.peerAddress)];
            }
        });
    });
}
function initConfig(programId, accounts, remoteEid, programs) {
    var _a, _b;
    var admin = accounts.admin, payer = accounts.payer;
    var pda = new pda_1.MyOAppPDA(programId);
    var msgLibProgram, endpointProgram;
    if (programs === undefined) {
        msgLibProgram = umi_2.UlnProgram.ULN_PROGRAM_ID;
        endpointProgram = umi_2.EndpointProgram.ENDPOINT_PROGRAM_ID;
    }
    else {
        msgLibProgram = (_a = programs.msgLib) !== null && _a !== void 0 ? _a : umi_2.UlnProgram.ULN_PROGRAM_ID;
        endpointProgram = (_b = programs.endpoint) !== null && _b !== void 0 ? _b : umi_2.EndpointProgram.ENDPOINT_PROGRAM_ID;
    }
    var endpoint = new umi_2.EndpointProgram.Endpoint(endpointProgram);
    var msgLib;
    if (msgLibProgram === umi_2.SimpleMessageLibProgram.SIMPLE_MESSAGELIB_PROGRAM_ID) {
        msgLib = new umi_2.SimpleMessageLibProgram.SimpleMessageLib(umi_2.SimpleMessageLibProgram.SIMPLE_MESSAGELIB_PROGRAM_ID);
    }
    else {
        msgLib = new umi_2.UlnProgram.Uln(msgLibProgram);
    }
    return endpoint.initOAppConfig({
        delegate: admin,
        payer: payer.publicKey,
    }, {
        msgLibSDK: msgLib,
        oapp: pda.oapp()[0],
        remote: remoteEid,
    });
}
function initSendLibrary(accounts, remoteEid, endpointProgram) {
    if (endpointProgram === void 0) { endpointProgram = ENDPOINT_PROGRAM_ID; }
    var admin = accounts.admin, oapp = accounts.oapp;
    var endpoint = new umi_2.EndpointProgram.Endpoint(endpointProgram);
    return endpoint.initOAppSendLibrary(admin, { sender: oapp, remote: remoteEid });
}
function initReceiveLibrary(accounts, remoteEid, endpointProgram) {
    if (endpointProgram === void 0) { endpointProgram = ENDPOINT_PROGRAM_ID; }
    var admin = accounts.admin, oapp = accounts.oapp;
    var endpoint = new umi_2.EndpointProgram.Endpoint(endpointProgram);
    return endpoint.initOAppReceiveLibrary(admin, { receiver: oapp, remote: remoteEid });
}
function initOAppNonce(accounts, remoteEid, remoteOappAddr, // must be 32 bytes
endpointProgram) {
    if (endpointProgram === void 0) { endpointProgram = ENDPOINT_PROGRAM_ID; }
    var admin = accounts.admin, oapp = accounts.oapp;
    var endpoint = new umi_2.EndpointProgram.Endpoint(endpointProgram);
    return endpoint.initOAppNonce(admin, {
        localOApp: oapp,
        remote: remoteEid,
        remoteOApp: remoteOappAddr,
    });
}
