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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AptosEndpointV2 = void 0;
/**
 * Minimal "AptosEndpointV2" skeleton that implements IEndpointV2 for Aptos.
 * All methods here return placeholder or dummy values for now.
 */
var AptosEndpointV2 = /** @class */ (function () {
    function AptosEndpointV2(point) {
        this.point = point;
    }
    //
    // ----------------------------------------------------------
    //  Required by IOmniSDK (the base) or the IEndpointV2 extension
    // ----------------------------------------------------------
    // The devtools might call this to fetch a "Uln302" object.
    // For now, return a dummy object that implements IUln302
    AptosEndpointV2.prototype.getUln302SDK = function (_address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        point: this.point,
                        // placeholders to avoid compile errors:
                        getUlnConfig: function (_eid, _address, _type) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {}];
                                });
                            });
                        },
                        getAppUlnConfig: function (_eid, _address, _type) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {}];
                                });
                            });
                        },
                        hasAppUlnConfig: function (_eid, _oapp, _config, _type) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, false];
                                });
                            });
                        },
                        setDefaultUlnConfig: function (_eid, _config) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {
                                            point: this.point,
                                            data: '0x00',
                                        }];
                                });
                            });
                        },
                        getExecutorConfig: function (_eid, _address) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {
                                            maxMessageSize: 1024,
                                            executor: '0x0',
                                        }];
                                });
                            });
                        },
                        getAppExecutorConfig: function (_eid, _address) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {
                                            maxMessageSize: 1024,
                                            executor: '0x0',
                                        }];
                                });
                            });
                        },
                        hasAppExecutorConfig: function (_eid, _oapp, _config) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, false];
                                });
                            });
                        },
                        setDefaultExecutorConfig: function (_eid, _config) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {
                                            point: this.point,
                                            data: '0x00',
                                        }];
                                });
                            });
                        },
                    }];
            });
        });
    };
    // The devtools might call this to fetch a "UlnRead" object.
    // For now, return a dummy object that implements IUlnRead
    AptosEndpointV2.prototype.getUlnReadSDK = function (_address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        point: this.point,
                        getUlnConfig: function (_channelId, _address) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {
                                            executor: '0x0',
                                            requiredDVNs: [],
                                            optionalDVNs: [],
                                            optionalDVNThreshold: 0,
                                        }];
                                });
                            });
                        },
                        getAppUlnConfig: function (_channelId, _address) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {
                                            executor: '0x0',
                                            requiredDVNs: [],
                                            optionalDVNs: [],
                                            optionalDVNThreshold: 0,
                                        }];
                                });
                            });
                        },
                        hasAppUlnConfig: function (_channelId, _oapp, _config) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, false];
                                });
                            });
                        },
                        setDefaultUlnConfig: function (_channelId, _config) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {
                                            point: this.point,
                                            data: '0x00',
                                        }];
                                });
                            });
                        },
                    }];
            });
        });
    };
    //
    // ----------------------------------------------------------
    //  Required by IEndpointV2 specifically
    // ----------------------------------------------------------
    AptosEndpointV2.prototype.getDelegate = function (_oapp) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    AptosEndpointV2.prototype.isDelegate = function (_oapp, _delegate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, false];
            });
        });
    };
    AptosEndpointV2.prototype.getDefaultReceiveLibrary = function (_eid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    AptosEndpointV2.prototype.setDefaultReceiveLibrary = function (_eid, _uln, _gracePeriod) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        point: this.point,
                        data: '0x00',
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.getDefaultSendLibrary = function (_eid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    AptosEndpointV2.prototype.setDefaultSendLibrary = function (_eid, _uln) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        point: this.point,
                        data: '0x00',
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.isRegisteredLibrary = function (_uln) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, false];
            });
        });
    };
    AptosEndpointV2.prototype.registerLibrary = function (_uln) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        point: this.point,
                        data: '0x00',
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.getSendLibrary = function (_sender, _dstEid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, '0x0'];
            });
        });
    };
    AptosEndpointV2.prototype.getReceiveLibrary = function (_receiver, _srcEid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ['0x0', false]];
            });
        });
    };
    AptosEndpointV2.prototype.getDefaultReceiveLibraryTimeout = function (_eid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { lib: '0x0', expiry: BigInt(0) }];
            });
        });
    };
    AptosEndpointV2.prototype.getReceiveLibraryTimeout = function (_receiver, _srcEid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { lib: '0x0', expiry: BigInt(0) }];
            });
        });
    };
    AptosEndpointV2.prototype.setSendLibrary = function (_oapp, _eid, _uln) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        point: this.point,
                        data: '0x00',
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.isDefaultSendLibrary = function (_sender, _dstEid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, false];
            });
        });
    };
    AptosEndpointV2.prototype.setReceiveLibrary = function (_oapp, _eid, _uln, _gracePeriod) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        point: this.point,
                        data: '0x00',
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.setReceiveLibraryTimeout = function (_oapp, _eid, _uln, _expiry) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        point: this.point,
                        data: '0x00',
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.getExecutorConfig = function (_oapp, _uln, _eid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        maxMessageSize: 1024,
                        executor: '0x0',
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.getAppExecutorConfig = function (_oapp, _uln, _eid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        maxMessageSize: 1024,
                        executor: '0x0',
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.hasAppExecutorConfig = function (_oapp, _uln, _eid, _config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, false];
            });
        });
    };
    AptosEndpointV2.prototype.setExecutorConfig = function (_oapp, _uln, _setExecutorConfig) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Possibly return multiple OmniTransactions if the devtools call expects them
                return [2 /*return*/, [
                        {
                            point: this.point,
                            data: '0x00',
                        },
                    ]];
            });
        });
    };
    AptosEndpointV2.prototype.getUlnConfig = function (_oapp, _uln, _eid, _type) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        confirmations: BigInt(0),
                        requiredDVNs: [],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.getAppUlnConfig = function (_oapp, _uln, _eid, _type) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        confirmations: BigInt(0),
                        requiredDVNs: [],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.getAppUlnReadConfig = function (_oapp, _uln, _channelId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        executor: '0x0',
                        requiredDVNs: [],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    }];
            });
        });
    };
    AptosEndpointV2.prototype.hasAppUlnConfig = function (_oapp, _uln, _eid, _config, _type) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, false];
            });
        });
    };
    AptosEndpointV2.prototype.hasAppUlnReadConfig = function (_oapp, _uln, _channelId, _config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, false];
            });
        });
    };
    AptosEndpointV2.prototype.setUlnConfig = function (_oapp, _uln, _setUlnConfig) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            point: this.point,
                            data: '0x00',
                        },
                    ]];
            });
        });
    };
    AptosEndpointV2.prototype.setUlnReadConfig = function (_oapp, _uln, _setUlnConfig) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            point: this.point,
                            data: '0x00',
                        },
                    ]];
            });
        });
    };
    AptosEndpointV2.prototype.getUlnConfigParams = function (_uln, _setUlnConfig) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    AptosEndpointV2.prototype.getUlnReadConfigParams = function (_uln, _setUlnConfig) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    AptosEndpointV2.prototype.getExecutorConfigParams = function (_uln, _setExecutorConfig) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    AptosEndpointV2.prototype.setConfig = function (_oapp, _uln, _setConfigParam) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            point: this.point,
                            data: '0x00',
                        },
                    ]];
            });
        });
    };
    AptosEndpointV2.prototype.quote = function (_params, _sender) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        nativeFee: BigInt(0),
                        lzTokenFee: BigInt(0),
                    }];
            });
        });
    };
    return AptosEndpointV2;
}());
exports.AptosEndpointV2 = AptosEndpointV2;
