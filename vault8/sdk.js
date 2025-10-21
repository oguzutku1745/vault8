"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomOAppSDK = void 0;
var assert_1 = __importDefault(require("assert"));
var mpl_toolbox_1 = require("@metaplex-foundation/mpl-toolbox");
var umi_1 = require("@metaplex-foundation/umi");
var umi_bundle_defaults_1 = require("@metaplex-foundation/umi-bundle-defaults");
var umi_web3js_adapters_1 = require("@metaplex-foundation/umi-web3js-adapters");
var web3_js_1 = require("@solana/web3.js");
var devtools_1 = require("@layerzerolabs/devtools");
var devtools_2 = require("@layerzerolabs/devtools");
var devtools_solana_1 = require("@layerzerolabs/devtools-solana");
var io_devtools_1 = require("@layerzerolabs/io-devtools");
var lz_solana_sdk_v2_1 = require("@layerzerolabs/lz-solana-sdk-v2");
var lz_v2_utilities_1 = require("@layerzerolabs/lz-v2-utilities");
var protocol_devtools_solana_1 = require("@layerzerolabs/protocol-devtools-solana");
var client_1 = require("./client");
/*
 * refer to the OFT wrapper SDK in the devtools repo at packages/ua-devtools-solana/src/oft/sdk.ts to understand why this wrapper SDK is needed.
 */
var CustomOAppSDK = function () {
    var _a;
    var _classSuper = devtools_solana_1.OmniSDK;
    var _instanceExtraInitializers = [];
    var _getOwner_decorators;
    var _getEndpointSDK_decorators;
    var _getPeer_decorators;
    var _getDelegate_decorators;
    var _isDelegate_decorators;
    var _getEnforcedOptions_decorators;
    var _getCallerBpsCap_decorators;
    return _a = /** @class */ (function (_super) {
            __extends(CustomOAppSDK, _super);
            function CustomOAppSDK(connection, point, userAccount, programId, logger) {
                var _this = _super.call(this, connection, point, userAccount, logger) || this;
                _this.programId = (__runInitializers(_this, _instanceExtraInitializers), programId);
                // cache Umi-specific objects for reuse
                _this.umi = (0, umi_bundle_defaults_1.createUmi)(connection.rpcEndpoint).use((0, mpl_toolbox_1.mplToolbox)());
                _this.umiUserAccount = (0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(userAccount);
                _this.umiProgramId = (0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(_this.programId);
                _this.umiPublicKey = (0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(_this.publicKey);
                _this.umiMyOAppSdk = new client_1.myoapp.MyOApp((0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(_this.programId));
                return _this;
            }
            CustomOAppSDK.prototype.getOwner = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var config, owner;
                    var _this = this;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                this.logger.debug("Getting owner");
                                return [4 /*yield*/, (0, devtools_1.mapError)(function () {
                                        return client_1.myoapp.accounts.fetchStore(_this.umi, _this.umiPublicKey);
                                    }, function (error) { return new Error("Failed to get owner for ".concat(_this.label, ": ").concat(error)); })];
                            case 1:
                                config = _b.sent();
                                owner = config.admin;
                                return [2 /*return*/, (this.logger.debug("Got owner: ".concat(owner)), owner)];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.hasOwner = function (address) {
                return __awaiter(this, void 0, void 0, function () {
                    var owner, isOwner;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                this.logger.debug("Checking whether ".concat(address, " is an owner"));
                                return [4 /*yield*/, this.getOwner()];
                            case 1:
                                owner = _b.sent();
                                isOwner = (0, devtools_2.areBytes32Equal)((0, devtools_2.normalizePeer)(address, this.point.eid), (0, devtools_2.normalizePeer)(owner, this.point.eid));
                                return [2 /*return*/, (this.logger.debug("Checked whether ".concat(address, " is an owner (").concat(owner, "): ").concat((0, io_devtools_1.printBoolean)(isOwner))), isOwner)];
                        }
                    });
                });
            };
            // TODO: to implement after we implement OAppConfig
            // async setOwner(address: OmniAddress): Promise<OmniTransaction> {
            //     this.logger.debug(`Setting owner to ${address}`)
            //     return {
            //         ...(await this.createTransaction(this._umiToWeb3Tx([await this._setOFTAdminIx(address)]))),
            //         description: `Setting owner to ${address}`,
            //     }
            // }
            CustomOAppSDK.prototype.getEndpointSDK = function () {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_b) {
                        this.logger.debug("Getting EndpointV2 SDK");
                        return [2 /*return*/, new protocol_devtools_solana_1.EndpointV2(this.connection, { eid: this.point.eid, address: lz_solana_sdk_v2_1.EndpointProgram.PROGRAM_ID.toBase58() }, this.userAccount)];
                    });
                });
            };
            CustomOAppSDK.prototype.getPeer = function (eid) {
                return __awaiter(this, void 0, void 0, function () {
                    var eidLabel, peer, error_1;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                eidLabel = "eid ".concat(eid, " (").concat((0, devtools_2.formatEid)(eid), ")");
                                this.logger.debug("Getting peer for ".concat(eidLabel));
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, client_1.myoapp.getPeer(this.umi.rpc, eid, this.umiProgramId)
                                    // We run the hex string we got through a normalization/de-normalization process
                                    // that will ensure that zero addresses will get stripped
                                    // and any network-specific logic will be applied
                                ];
                            case 2:
                                peer = _b.sent();
                                // We run the hex string we got through a normalization/de-normalization process
                                // that will ensure that zero addresses will get stripped
                                // and any network-specific logic will be applied
                                return [2 /*return*/, (0, devtools_2.denormalizePeer)((0, devtools_2.fromHex)(peer), eid)];
                            case 3:
                                error_1 = _b.sent();
                                if (String(error_1).match(/was not found at the provided address/i)) {
                                    return [2 /*return*/, undefined];
                                }
                                throw new Error("Failed to get peer for ".concat(eidLabel, " for OFT ").concat(this.label, ": ").concat(error_1));
                            case 4: return [2 /*return*/];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.hasPeer = function (eid, address) {
                return __awaiter(this, void 0, void 0, function () {
                    var peer;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, this.getPeer(eid)];
                            case 1:
                                peer = _b.sent();
                                return [2 /*return*/, (0, devtools_2.areBytes32Equal)((0, devtools_2.normalizePeer)(peer, eid), (0, devtools_2.normalizePeer)(address, eid))];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.setPeer = function (eid, address) {
                return __awaiter(this, void 0, void 0, function () {
                    var eidLabel, normalizedPeer, peerAsBytes32, delegate, oapp, umiTxs, _b, isSendLibraryInitialized, isReceiveLibraryInitialized, _c, _d, _e, _f;
                    var _g;
                    var _this = this;
                    return __generator(this, function (_h) {
                        switch (_h.label) {
                            case 0:
                                eidLabel = (0, devtools_2.formatEid)(eid);
                                return [4 /*yield*/, (0, devtools_1.mapError)(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_b) {
                                        return [2 /*return*/, (0, devtools_2.normalizePeer)(address, eid)];
                                    }); }); }, function (error) {
                                        return new Error("Failed to convert peer ".concat(address, " for ").concat(eidLabel, " for ").concat(_this.label, " to bytes: ").concat(error));
                                    })];
                            case 1:
                                normalizedPeer = _h.sent();
                                peerAsBytes32 = (0, devtools_2.makeBytes32)(normalizedPeer);
                                return [4 /*yield*/, this.safeGetDelegate()];
                            case 2:
                                delegate = _h.sent();
                                oapp = this.umiPublicKey;
                                this.logger.debug("Setting peer for eid ".concat(eid, " (").concat(eidLabel, ") to address ").concat(peerAsBytes32));
                                return [4 /*yield*/, this._createSetPeerAddressIx(normalizedPeer, eid)];
                            case 3:
                                _b = [
                                    _h.sent()
                                ];
                                // this.umiMyOAppSdk.setPeer(delegate, { peer: normalizedPeer, remoteEid: eid }),TODO: remove, since things are now handled by _createSetPeerAddressIx and _setPeerEnforcedOptionsIx
                                return [4 /*yield*/, this._setPeerEnforcedOptionsIx(new Uint8Array([0, 3]), new Uint8Array([0, 3]), eid)];
                            case 4:
                                umiTxs = _b.concat([
                                    // this.umiMyOAppSdk.setPeer(delegate, { peer: normalizedPeer, remoteEid: eid }),TODO: remove, since things are now handled by _createSetPeerAddressIx and _setPeerEnforcedOptionsIx
                                    _h.sent(), // admin
                                    client_1.myoapp.initOAppNonce({ admin: delegate, oapp: oapp }, eid, normalizedPeer)
                                ]);
                                return [4 /*yield*/, this.isSendLibraryInitialized(eid)];
                            case 5:
                                isSendLibraryInitialized = _h.sent();
                                return [4 /*yield*/, this.isReceiveLibraryInitialized(eid)];
                            case 6:
                                isReceiveLibraryInitialized = _h.sent();
                                if (!isSendLibraryInitialized) {
                                    umiTxs.push(client_1.myoapp.initSendLibrary({ admin: delegate, oapp: oapp }, eid));
                                }
                                if (!isReceiveLibraryInitialized) {
                                    umiTxs.push(client_1.myoapp.initReceiveLibrary({ admin: delegate, oapp: oapp }, eid));
                                }
                                _c = [{}];
                                return [4 /*yield*/, this.createTransaction(this._umiToWeb3Tx(umiTxs))];
                            case 7:
                                _d = [__assign.apply(void 0, _c.concat([(_h.sent())]))];
                                _g = {};
                                _f = (_e = "Setting peer for eid ".concat(eid, " (").concat(eidLabel, ") to address ").concat(peerAsBytes32, " ").concat(delegate.publicKey, " ")).concat;
                                return [4 /*yield*/, this._getAdmin()];
                            case 8: return [2 /*return*/, __assign.apply(void 0, _d.concat([(_g.description = _f.apply(_e, [(_h.sent()).publicKey]), _g)]))];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.getDelegate = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var endpointSdk, delegate;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                this.logger.debug("Getting delegate");
                                return [4 /*yield*/, this.getEndpointSDK()];
                            case 1:
                                endpointSdk = _b.sent();
                                return [4 /*yield*/, endpointSdk.getDelegate(this.point.address)];
                            case 2:
                                delegate = _b.sent();
                                return [2 /*return*/, (this.logger.verbose("Got delegate: ".concat(delegate)), delegate)];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.isDelegate = function (delegate) {
                return __awaiter(this, void 0, void 0, function () {
                    var endpointSdk, isDelegate;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                this.logger.debug("Checking whether ".concat(delegate, " is a delegate"));
                                return [4 /*yield*/, this.getEndpointSDK()];
                            case 1:
                                endpointSdk = _b.sent();
                                return [4 /*yield*/, endpointSdk.isDelegate(this.point.address, delegate)];
                            case 2:
                                isDelegate = _b.sent();
                                return [2 /*return*/, (this.logger.verbose("Checked delegate: ".concat(delegate, ": ").concat((0, io_devtools_1.printBoolean)(isDelegate))), isDelegate)];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.setDelegate = function (delegate) {
                return __awaiter(this, void 0, void 0, function () {
                    var _b, _c, _d;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                this.logger.debug("Setting delegate to ".concat(delegate));
                                _b = [{}];
                                _c = this.createTransaction;
                                _d = this._umiToWeb3Tx;
                                return [4 /*yield*/, this._setOFTDelegateIx(delegate)];
                            case 1: return [4 /*yield*/, _c.apply(this, [_d.apply(this, [[_e.sent()]])])];
                            case 2: return [2 /*return*/, __assign.apply(void 0, [__assign.apply(void 0, _b.concat([(_e.sent())])), { description: "Setting delegate to ".concat(delegate) }])];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.getEnforcedOptions = function (eid, msgType) {
                return __awaiter(this, void 0, void 0, function () {
                    var eidLabel, options, optionsForMsgType, error_2;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                // First we check that we can understand the message type
                                this.assertMsgType(msgType);
                                eidLabel = "eid ".concat(eid, " (").concat((0, devtools_2.formatEid)(eid), ")");
                                this.logger.verbose("Getting enforced options for ".concat(eidLabel, " and message type ").concat(msgType));
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, this.umiMyOAppSdk.getEnforcedOptions(this.umi.rpc, eid)];
                            case 2:
                                options = _b.sent();
                                optionsForMsgType = msgType === MSG_TYPE_SEND ? options.send : options.sendAndCall;
                                return [2 /*return*/, (0, devtools_2.toHex)(optionsForMsgType)];
                            case 3:
                                error_2 = _b.sent();
                                if (String(error_2).match(/was not found at the provided address/)) {
                                    return [2 /*return*/, (0, devtools_2.toHex)(new Uint8Array(0))];
                                }
                                throw new Error("Failed to get enforced options for ".concat(this.label, " for ").concat(eidLabel, " and message type ").concat(msgType, ": ").concat(error_2));
                            case 4: return [2 /*return*/];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.setOutboundRateLimit = function (eid, rateLimit) {
                return __awaiter(this, void 0, void 0, function () {
                    var _b, _c, _d;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                this.logger.verbose("Setting outbound rate limit for ".concat(eid, " to ").concat((0, io_devtools_1.printJson)(rateLimit)));
                                _b = [{}];
                                _c = this.createTransaction;
                                _d = this._umiToWeb3Tx;
                                return [4 /*yield*/, this._setPeerOutboundRateLimit(eid, rateLimit)];
                            case 1: return [4 /*yield*/, _c.apply(this, [_d.apply(this, [[_e.sent()]])])];
                            case 2: return [2 /*return*/, __assign.apply(void 0, [__assign.apply(void 0, _b.concat([(_e.sent())])), { description: "Setting outbound rate limit for ".concat(eid, " to ").concat((0, io_devtools_1.printJson)(rateLimit)) }])];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.setInboundRateLimit = function (eid, rateLimit) {
                return __awaiter(this, void 0, void 0, function () {
                    var _b, _c, _d;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                this.logger.verbose("Setting outbound rate limit for ".concat(eid, " to ").concat((0, io_devtools_1.printJson)(rateLimit)));
                                _b = [{}];
                                _c = this.createTransaction;
                                _d = this._umiToWeb3Tx;
                                return [4 /*yield*/, this._setPeerInboundRateLimit(eid, rateLimit)];
                            case 1: return [4 /*yield*/, _c.apply(this, [_d.apply(this, [[_e.sent()]])])];
                            case 2: return [2 /*return*/, __assign.apply(void 0, [__assign.apply(void 0, _b.concat([(_e.sent())])), { description: "Setting outbound rate limit for ".concat(eid, " to ").concat((0, io_devtools_1.printJson)(rateLimit)) }])];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.setEnforcedOptions = function (enforcedOptions) {
                return __awaiter(this, void 0, void 0, function () {
                    var optionsByEidAndMsgType, emptyOptions, ixs, _i, optionsByEidAndMsgType_1, _b, eid, optionsByMsgType, sendOption, sendAndCallOption, _c, _d, _e;
                    var _f, _g;
                    return __generator(this, function (_h) {
                        switch (_h.label) {
                            case 0:
                                this.logger.verbose("Setting enforced options to ".concat((0, io_devtools_1.printJson)(enforcedOptions)));
                                optionsByEidAndMsgType = this.reduceEnforcedOptions(enforcedOptions);
                                emptyOptions = lz_v2_utilities_1.Options.newOptions().toBytes();
                                ixs = [];
                                _i = 0, optionsByEidAndMsgType_1 = optionsByEidAndMsgType;
                                _h.label = 1;
                            case 1:
                                if (!(_i < optionsByEidAndMsgType_1.length)) return [3 /*break*/, 4];
                                _b = optionsByEidAndMsgType_1[_i], eid = _b[0], optionsByMsgType = _b[1];
                                sendOption = (_f = optionsByMsgType.get(MSG_TYPE_SEND)) !== null && _f !== void 0 ? _f : emptyOptions;
                                sendAndCallOption = (_g = optionsByMsgType.get(MSG_TYPE_SEND_AND_CALL)) !== null && _g !== void 0 ? _g : emptyOptions;
                                _d = (_c = ixs).push;
                                return [4 /*yield*/, this._setPeerEnforcedOptionsIx(sendOption, sendAndCallOption, eid)];
                            case 2:
                                _d.apply(_c, [_h.sent()]);
                                _h.label = 3;
                            case 3:
                                _i++;
                                return [3 /*break*/, 1];
                            case 4:
                                _e = [{}];
                                return [4 /*yield*/, this.createTransaction(this._umiToWeb3Tx(ixs))];
                            case 5: return [2 /*return*/, __assign.apply(void 0, [__assign.apply(void 0, _e.concat([(_h.sent())])), { description: "Setting enforced options to ".concat((0, io_devtools_1.printJson)(enforcedOptions)) }])];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.isSendLibraryInitialized = function (eid) {
                return __awaiter(this, void 0, void 0, function () {
                    var endpointSdk;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, this.getEndpointSDK()];
                            case 1:
                                endpointSdk = _b.sent();
                                return [2 /*return*/, endpointSdk.isSendLibraryInitialized(this.point.address, eid)];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.initializeSendLibrary = function (eid) {
                return __awaiter(this, void 0, void 0, function () {
                    var endpointSdk;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                this.logger.verbose("Initializing send library on ".concat((0, devtools_2.formatEid)(eid)));
                                return [4 /*yield*/, this.getEndpointSDK()];
                            case 1:
                                endpointSdk = _b.sent();
                                return [2 /*return*/, endpointSdk.initializeSendLibrary(this.point.address, eid)];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.isReceiveLibraryInitialized = function (eid) {
                return __awaiter(this, void 0, void 0, function () {
                    var endpointSdk;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, this.getEndpointSDK()];
                            case 1:
                                endpointSdk = _b.sent();
                                return [2 /*return*/, endpointSdk.isReceiveLibraryInitialized(this.point.address, eid)];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.initializeReceiveLibrary = function (eid) {
                return __awaiter(this, void 0, void 0, function () {
                    var endpointSdk;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                this.logger.verbose("Initializing receive library on ".concat((0, devtools_2.formatEid)(eid)));
                                return [4 /*yield*/, this.getEndpointSDK()];
                            case 1:
                                endpointSdk = _b.sent();
                                return [2 /*return*/, endpointSdk.initializeReceiveLibrary(this.point.address, eid)];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.isOAppConfigInitialized = function (eid) {
                return __awaiter(this, void 0, void 0, function () {
                    var endpointSdk;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, this.getEndpointSDK()];
                            case 1:
                                endpointSdk = _b.sent();
                                return [2 /*return*/, endpointSdk.isOAppConfigInitialized(this.point.address, eid)];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.initializeOAppConfig = function (eid, lib) {
                return __awaiter(this, void 0, void 0, function () {
                    var endpointSdk;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                this.logger.verbose("Initializing OApp config for library ".concat(lib, " on ").concat((0, devtools_2.formatEid)(eid)));
                                return [4 /*yield*/, this.getEndpointSDK()];
                            case 1:
                                endpointSdk = _b.sent();
                                return [2 /*return*/, endpointSdk.initializeOAppConfig(this.point.address, eid, lib !== null && lib !== void 0 ? lib : undefined)];
                        }
                    });
                });
            };
            /**
             * Helper utility that takes an array of `OAppEnforcedOptionParam` objects and turns them into
             * a map keyed by `EndpointId` that contains another map keyed by `MsgType`.
             *
             * @param {OAppEnforcedOptionParam[]} enforcedOptions
             * @returns {Map<EndpointId, Map<MsgType, Uint8Array>>}
             */
            CustomOAppSDK.prototype.reduceEnforcedOptions = function (enforcedOptions) {
                var _this = this;
                return enforcedOptions.reduce(function (optionsByEid, enforcedOption) {
                    var _b;
                    var eid = enforcedOption.eid, _c = enforcedOption.option, msgType = _c.msgType, options = _c.options;
                    // First we check that we can understand the message type
                    _this.assertMsgType(msgType);
                    // Then we warn the user if they are trying to specify enforced options for eid & msgType more than once
                    // in which case the former option will be ignored
                    var optionsByMsgType = (_b = optionsByEid.get(eid)) !== null && _b !== void 0 ? _b : new Map();
                    if (optionsByMsgType.has(msgType)) {
                        _this.logger.warn("Duplicate enforced option for ".concat((0, devtools_2.formatEid)(eid), " and msgType ").concat(msgType));
                    }
                    // We wrap the call with try/catch to deliver a better error message in case malformed options were passed
                    try {
                        optionsByMsgType.set(msgType, lz_v2_utilities_1.Options.fromOptions(options).toBytes());
                    }
                    catch (error) {
                        throw new Error("Invalid enforced options for ".concat(_this.label, " for ").concat((0, devtools_2.formatEid)(eid), " and msgType ").concat(msgType, ": ").concat(options, ": ").concat(error));
                    }
                    optionsByEid.set(eid, optionsByMsgType);
                    return optionsByEid;
                }, new Map());
            };
            /**
             * Helper method that asserts that `value` is a `MsgType` that the OFT understands
             * and prints out a friendly error message if it doesn't
             *
             * @param {unknown} value
             * @returns {undefined}
             */
            CustomOAppSDK.prototype.assertMsgType = function (value) {
                (0, assert_1.default)(isMsgType(value), "".concat(this.label, ": Invalid msgType received: ").concat(value, ". Expected one of ").concat(MSG_TYPE_SEND, " (send), ").concat(MSG_TYPE_SEND_AND_CALL, " (send and call)"));
            };
            CustomOAppSDK.prototype.setCallerBpsCap = function (callerBpsCap) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_b) {
                        this.logger.debug("Setting caller BPS cap to ".concat(callerBpsCap));
                        throw new TypeError("setCallerBpsCap() not implemented on Solana OFT SDK");
                    });
                });
            };
            CustomOAppSDK.prototype.getCallerBpsCap = function () {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_b) {
                        this.logger.debug("Getting caller BPS cap");
                        throw new TypeError("getCallerBpsCap() not implemented on Solana OFT SDK");
                    });
                });
            };
            CustomOAppSDK.prototype.sendConfigIsInitialized = function (_eid) {
                return __awaiter(this, void 0, void 0, function () {
                    var deriver, sendConfig, accountInfo;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                deriver = new lz_solana_sdk_v2_1.MessageLibPDADeriver(lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ID);
                                sendConfig = deriver.sendConfig(_eid, new web3_js_1.PublicKey(this.point.address))[0];
                                return [4 /*yield*/, this.connection.getAccountInfo(sendConfig)];
                            case 1:
                                accountInfo = _b.sent();
                                return [2 /*return*/, accountInfo != null];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.receiveConfigIsInitialized = function (_eid) {
                return __awaiter(this, void 0, void 0, function () {
                    var deriver, receiveConfig, accountInfo;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                deriver = new lz_solana_sdk_v2_1.MessageLibPDADeriver(lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ID);
                                receiveConfig = deriver.receiveConfig(_eid, new web3_js_1.PublicKey(this.point.address))[0];
                                return [4 /*yield*/, this.connection.getAccountInfo(receiveConfig)];
                            case 1:
                                accountInfo = _b.sent();
                                return [2 /*return*/, accountInfo != null];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype.initConfig = function (eid) {
                return __awaiter(this, void 0, void 0, function () {
                    var delegateAddress, delegate, _b, _c;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0: return [4 /*yield*/, this.getDelegate()
                                // delegate may be undefined if it has not yet been set.  In this case, use admin, which must exist.
                            ];
                            case 1:
                                delegateAddress = _d.sent();
                                if (!delegateAddress) return [3 /*break*/, 2];
                                _b = (0, umi_1.createNoopSigner)((0, umi_1.publicKey)(delegateAddress));
                                return [3 /*break*/, 4];
                            case 2: return [4 /*yield*/, this._getAdmin()];
                            case 3:
                                _b = _d.sent();
                                _d.label = 4;
                            case 4:
                                delegate = _b;
                                _c = [{}];
                                return [4 /*yield*/, this.createTransaction(this._umiToWeb3Tx([
                                        client_1.myoapp.initConfig(this.umiProgramId, {
                                            admin: delegate,
                                            payer: delegate,
                                        }, eid, {
                                            msgLib: (0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ID),
                                        }),
                                    ]))];
                            case 5: return [2 /*return*/, __assign.apply(void 0, [__assign.apply(void 0, _c.concat([(_d.sent())])), { description: "oapp.initConfig(".concat(eid, ")") }])];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype._setPeerConfigIx = function (param) {
                return __awaiter(this, void 0, void 0, function () {
                    var _b, _c;
                    var _d;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                _c = (_b = this.umiMyOAppSdk).setPeerConfig;
                                _d = {};
                                return [4 /*yield*/, this._getAdmin()];
                            case 1: return [2 /*return*/, _c.apply(_b, [(_d.admin = _e.sent(), _d), param])];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype._createSetPeerAddressIx = function (normalizedPeer, eid) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_b) {
                        return [2 /*return*/, this._setPeerConfigIx({
                                __kind: 'PeerAddress',
                                peer: normalizedPeer,
                                remote: eid,
                            })];
                    });
                });
            };
            CustomOAppSDK.prototype._setPeerEnforcedOptionsIx = function (send, sendAndCall, eid) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_b) {
                        return [2 /*return*/, this._setPeerConfigIx({
                                __kind: 'EnforcedOptions',
                                send: send,
                                sendAndCall: sendAndCall,
                                remote: eid,
                            })];
                    });
                });
            };
            // Convert Umi instructions to Web3JS Transaction
            CustomOAppSDK.prototype._umiToWeb3Tx = function (ixs) {
                var web3Transaction = new web3_js_1.Transaction();
                var txBuilder = new umi_1.TransactionBuilder(ixs);
                txBuilder.getInstructions().forEach(function (umiInstruction) {
                    var web3Instruction = new web3_js_1.TransactionInstruction({
                        programId: new web3_js_1.PublicKey(umiInstruction.programId),
                        keys: umiInstruction.keys.map(function (key) { return ({
                            pubkey: new web3_js_1.PublicKey(key.pubkey),
                            isSigner: key.isSigner,
                            isWritable: key.isWritable,
                        }); }),
                        data: Buffer.from(umiInstruction.data),
                    });
                    // Add the instruction to the Web3.js transaction
                    web3Transaction.add(web3Instruction);
                });
                return web3Transaction;
            };
            CustomOAppSDK.prototype.safeGetDelegate = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var delegateAddress;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, this.getDelegate()];
                            case 1:
                                delegateAddress = _b.sent();
                                if (!delegateAddress) {
                                    throw new Error('No delegate found');
                                }
                                return [2 /*return*/, (0, umi_1.createNoopSigner)((0, umi_1.publicKey)(delegateAddress))];
                        }
                    });
                });
            };
            CustomOAppSDK.prototype._getAdmin = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var owner;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, this.getOwner()];
                            case 1:
                                owner = _b.sent();
                                return [2 /*return*/, (0, umi_1.createNoopSigner)((0, umi_1.publicKey)(owner))];
                        }
                    });
                });
            };
            return CustomOAppSDK;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _getOwner_decorators = [(0, devtools_1.AsyncRetriable)()];
            _getEndpointSDK_decorators = [(0, devtools_1.AsyncRetriable)()];
            _getPeer_decorators = [(0, devtools_1.AsyncRetriable)()];
            _getDelegate_decorators = [(0, devtools_1.AsyncRetriable)()];
            _isDelegate_decorators = [(0, devtools_1.AsyncRetriable)()];
            _getEnforcedOptions_decorators = [(0, devtools_1.AsyncRetriable)()];
            _getCallerBpsCap_decorators = [(0, devtools_1.AsyncRetriable)()];
            __esDecorate(_a, null, _getOwner_decorators, { kind: "method", name: "getOwner", static: false, private: false, access: { has: function (obj) { return "getOwner" in obj; }, get: function (obj) { return obj.getOwner; } }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getEndpointSDK_decorators, { kind: "method", name: "getEndpointSDK", static: false, private: false, access: { has: function (obj) { return "getEndpointSDK" in obj; }, get: function (obj) { return obj.getEndpointSDK; } }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getPeer_decorators, { kind: "method", name: "getPeer", static: false, private: false, access: { has: function (obj) { return "getPeer" in obj; }, get: function (obj) { return obj.getPeer; } }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getDelegate_decorators, { kind: "method", name: "getDelegate", static: false, private: false, access: { has: function (obj) { return "getDelegate" in obj; }, get: function (obj) { return obj.getDelegate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _isDelegate_decorators, { kind: "method", name: "isDelegate", static: false, private: false, access: { has: function (obj) { return "isDelegate" in obj; }, get: function (obj) { return obj.isDelegate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getEnforcedOptions_decorators, { kind: "method", name: "getEnforcedOptions", static: false, private: false, access: { has: function (obj) { return "getEnforcedOptions" in obj; }, get: function (obj) { return obj.getEnforcedOptions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getCallerBpsCap_decorators, { kind: "method", name: "getCallerBpsCap", static: false, private: false, access: { has: function (obj) { return "getCallerBpsCap" in obj; }, get: function (obj) { return obj.getCallerBpsCap; } }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CustomOAppSDK = CustomOAppSDK;
var MSG_TYPE_SEND = 1;
var MSG_TYPE_SEND_AND_CALL = 2;
var isMsgType = function (value) { return value === MSG_TYPE_SEND || value === MSG_TYPE_SEND_AND_CALL; };
