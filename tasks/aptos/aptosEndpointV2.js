"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AptosEndpointV2 = void 0;
/**
 * Minimal "AptosEndpointV2" skeleton that implements IEndpointV2 for Aptos.
 * All methods here return placeholder or dummy values for now.
 */
class AptosEndpointV2 {
    constructor(point) {
        this.point = point;
    }
    //
    // ----------------------------------------------------------
    //  Required by IOmniSDK (the base) or the IEndpointV2 extension
    // ----------------------------------------------------------
    // The devtools might call this to fetch a "Uln302" object.
    // For now, return a dummy object that implements IUln302
    async getUln302SDK(_address) {
        return {
            point: this.point,
            // placeholders to avoid compile errors:
            async getUlnConfig(_eid, _address, _type) {
                return {};
            },
            async getAppUlnConfig(_eid, _address, _type) {
                return {};
            },
            async hasAppUlnConfig(_eid, _oapp, _config, _type) {
                return false;
            },
            async setDefaultUlnConfig(_eid, _config) {
                return {
                    point: this.point,
                    data: '0x00',
                };
            },
            async getExecutorConfig(_eid, _address) {
                return {
                    maxMessageSize: 1024,
                    executor: '0x0',
                };
            },
            async getAppExecutorConfig(_eid, _address) {
                return {
                    maxMessageSize: 1024,
                    executor: '0x0',
                };
            },
            async hasAppExecutorConfig(_eid, _oapp, _config) {
                return false;
            },
            async setDefaultExecutorConfig(_eid, _config) {
                return {
                    point: this.point,
                    data: '0x00',
                };
            },
        };
    }
    // The devtools might call this to fetch a "UlnRead" object.
    // For now, return a dummy object that implements IUlnRead
    async getUlnReadSDK(_address) {
        return {
            point: this.point,
            async getUlnConfig(_channelId, _address) {
                return {
                    executor: '0x0',
                    requiredDVNs: [],
                    optionalDVNs: [],
                    optionalDVNThreshold: 0,
                };
            },
            async getAppUlnConfig(_channelId, _address) {
                return {
                    executor: '0x0',
                    requiredDVNs: [],
                    optionalDVNs: [],
                    optionalDVNThreshold: 0,
                };
            },
            async hasAppUlnConfig(_channelId, _oapp, _config) {
                return false;
            },
            async setDefaultUlnConfig(_channelId, _config) {
                return {
                    point: this.point,
                    data: '0x00',
                };
            },
        };
    }
    //
    // ----------------------------------------------------------
    //  Required by IEndpointV2 specifically
    // ----------------------------------------------------------
    async getDelegate(_oapp) {
        return undefined;
    }
    async isDelegate(_oapp, _delegate) {
        return false;
    }
    async getDefaultReceiveLibrary(_eid) {
        return undefined;
    }
    async setDefaultReceiveLibrary(_eid, _uln, _gracePeriod) {
        return {
            point: this.point,
            data: '0x00',
        };
    }
    async getDefaultSendLibrary(_eid) {
        return undefined;
    }
    async setDefaultSendLibrary(_eid, _uln) {
        return {
            point: this.point,
            data: '0x00',
        };
    }
    async isRegisteredLibrary(_uln) {
        return false;
    }
    async registerLibrary(_uln) {
        return {
            point: this.point,
            data: '0x00',
        };
    }
    async getSendLibrary(_sender, _dstEid) {
        return '0x0';
    }
    async getReceiveLibrary(_receiver, _srcEid) {
        return ['0x0', false];
    }
    async getDefaultReceiveLibraryTimeout(_eid) {
        return { lib: '0x0', expiry: BigInt(0) };
    }
    async getReceiveLibraryTimeout(_receiver, _srcEid) {
        return { lib: '0x0', expiry: BigInt(0) };
    }
    async setSendLibrary(_oapp, _eid, _uln) {
        return {
            point: this.point,
            data: '0x00',
        };
    }
    async isDefaultSendLibrary(_sender, _dstEid) {
        return false;
    }
    async setReceiveLibrary(_oapp, _eid, _uln, _gracePeriod) {
        return {
            point: this.point,
            data: '0x00',
        };
    }
    async setReceiveLibraryTimeout(_oapp, _eid, _uln, _expiry) {
        return {
            point: this.point,
            data: '0x00',
        };
    }
    async getExecutorConfig(_oapp, _uln, _eid) {
        return {
            maxMessageSize: 1024,
            executor: '0x0',
        };
    }
    async getAppExecutorConfig(_oapp, _uln, _eid) {
        return {
            maxMessageSize: 1024,
            executor: '0x0',
        };
    }
    async hasAppExecutorConfig(_oapp, _uln, _eid, _config) {
        return false;
    }
    async setExecutorConfig(_oapp, _uln, _setExecutorConfig) {
        // Possibly return multiple OmniTransactions if the devtools call expects them
        return [
            {
                point: this.point,
                data: '0x00',
            },
        ];
    }
    async getUlnConfig(_oapp, _uln, _eid, _type) {
        return {
            confirmations: BigInt(0),
            requiredDVNs: [],
            optionalDVNs: [],
            optionalDVNThreshold: 0,
        };
    }
    async getAppUlnConfig(_oapp, _uln, _eid, _type) {
        return {
            confirmations: BigInt(0),
            requiredDVNs: [],
            optionalDVNs: [],
            optionalDVNThreshold: 0,
        };
    }
    async getAppUlnReadConfig(_oapp, _uln, _channelId) {
        return {
            executor: '0x0',
            requiredDVNs: [],
            optionalDVNs: [],
            optionalDVNThreshold: 0,
        };
    }
    async hasAppUlnConfig(_oapp, _uln, _eid, _config, _type) {
        return false;
    }
    async hasAppUlnReadConfig(_oapp, _uln, _channelId, _config) {
        return false;
    }
    async setUlnConfig(_oapp, _uln, _setUlnConfig) {
        return [
            {
                point: this.point,
                data: '0x00',
            },
        ];
    }
    async setUlnReadConfig(_oapp, _uln, _setUlnConfig) {
        return [
            {
                point: this.point,
                data: '0x00',
            },
        ];
    }
    async getUlnConfigParams(_uln, _setUlnConfig) {
        return [];
    }
    async getUlnReadConfigParams(_uln, _setUlnConfig) {
        return [];
    }
    async getExecutorConfigParams(_uln, _setExecutorConfig) {
        return [];
    }
    async setConfig(_oapp, _uln, _setConfigParam) {
        return [
            {
                point: this.point,
                data: '0x00',
            },
        ];
    }
    async quote(_params, _sender) {
        return {
            nativeFee: BigInt(0),
            lzTokenFee: BigInt(0),
        };
    }
}
exports.AptosEndpointV2 = AptosEndpointV2;
