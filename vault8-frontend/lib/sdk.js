"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomOAppSDK = void 0;
const assert_1 = __importDefault(require("assert"));
const mpl_toolbox_1 = require("@metaplex-foundation/mpl-toolbox");
const umi_1 = require("@metaplex-foundation/umi");
const umi_bundle_defaults_1 = require("@metaplex-foundation/umi-bundle-defaults");
const umi_web3js_adapters_1 = require("@metaplex-foundation/umi-web3js-adapters");
const web3_js_1 = require("@solana/web3.js");
const devtools_1 = require("@layerzerolabs/devtools");
const devtools_2 = require("@layerzerolabs/devtools");
const devtools_solana_1 = require("@layerzerolabs/devtools-solana");
const io_devtools_1 = require("@layerzerolabs/io-devtools");
const lz_solana_sdk_v2_1 = require("@layerzerolabs/lz-solana-sdk-v2");
const lz_v2_utilities_1 = require("@layerzerolabs/lz-v2-utilities");
const protocol_devtools_solana_1 = require("@layerzerolabs/protocol-devtools-solana");
const client_1 = require("./client");
/*
 * refer to the OFT wrapper SDK in the devtools repo at packages/ua-devtools-solana/src/oft/sdk.ts to understand why this wrapper SDK is needed.
 */
class CustomOAppSDK extends devtools_solana_1.OmniSDK {
    constructor(connection, point, userAccount, programId, logger) {
        super(connection, point, userAccount, logger);
        this.programId = programId;
        // cache Umi-specific objects for reuse
        this.umi = (0, umi_bundle_defaults_1.createUmi)(connection.rpcEndpoint).use((0, mpl_toolbox_1.mplToolbox)());
        this.umiUserAccount = (0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(userAccount);
        this.umiProgramId = (0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(this.programId);
        this.umiPublicKey = (0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(this.publicKey);
        this.umiMyOAppSdk = new client_1.myoapp.MyOApp((0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(this.programId));
    }
    async getOwner() {
        this.logger.debug(`Getting owner`);
        const config = await (0, devtools_1.mapError)(() => {
            return client_1.myoapp.accounts.fetchStore(this.umi, this.umiPublicKey);
        }, (error) => new Error(`Failed to get owner for ${this.label}: ${error}`));
        const owner = config.admin;
        return this.logger.debug(`Got owner: ${owner}`), owner;
    }
    async hasOwner(address) {
        this.logger.debug(`Checking whether ${address} is an owner`);
        const owner = await this.getOwner();
        const isOwner = (0, devtools_2.areBytes32Equal)((0, devtools_2.normalizePeer)(address, this.point.eid), (0, devtools_2.normalizePeer)(owner, this.point.eid));
        return this.logger.debug(`Checked whether ${address} is an owner (${owner}): ${(0, io_devtools_1.printBoolean)(isOwner)}`), isOwner;
    }
    // TODO: to implement after we implement OAppConfig
    // async setOwner(address: OmniAddress): Promise<OmniTransaction> {
    //     this.logger.debug(`Setting owner to ${address}`)
    //     return {
    //         ...(await this.createTransaction(this._umiToWeb3Tx([await this._setOFTAdminIx(address)]))),
    //         description: `Setting owner to ${address}`,
    //     }
    // }
    async getEndpointSDK() {
        this.logger.debug(`Getting EndpointV2 SDK`);
        return new protocol_devtools_solana_1.EndpointV2(this.connection, { eid: this.point.eid, address: lz_solana_sdk_v2_1.EndpointProgram.PROGRAM_ID.toBase58() }, this.userAccount);
    }
    async getPeer(eid) {
        const eidLabel = `eid ${eid} (${(0, devtools_2.formatEid)(eid)})`;
        this.logger.debug(`Getting peer for ${eidLabel}`);
        try {
            const peer = await client_1.myoapp.getPeer(this.umi.rpc, eid, this.umiProgramId);
            // We run the hex string we got through a normalization/de-normalization process
            // that will ensure that zero addresses will get stripped
            // and any network-specific logic will be applied
            return (0, devtools_2.denormalizePeer)((0, devtools_2.fromHex)(peer), eid);
        }
        catch (error) {
            if (String(error).match(/was not found at the provided address/i)) {
                return undefined;
            }
            throw new Error(`Failed to get peer for ${eidLabel} for OFT ${this.label}: ${error}`);
        }
    }
    async hasPeer(eid, address) {
        const peer = await this.getPeer(eid);
        return (0, devtools_2.areBytes32Equal)((0, devtools_2.normalizePeer)(peer, eid), (0, devtools_2.normalizePeer)(address, eid));
    }
    async setPeer(eid, address) {
        const eidLabel = (0, devtools_2.formatEid)(eid);
        // We use the `mapError` and pretend `normalizePeer` is async to avoid having a let and a try/catch block
        const normalizedPeer = await (0, devtools_1.mapError)(async () => (0, devtools_2.normalizePeer)(address, eid), (error) => new Error(`Failed to convert peer ${address} for ${eidLabel} for ${this.label} to bytes: ${error}`));
        const peerAsBytes32 = (0, devtools_2.makeBytes32)(normalizedPeer);
        const delegate = await this.safeGetDelegate();
        const oapp = this.umiPublicKey;
        this.logger.debug(`Setting peer for eid ${eid} (${eidLabel}) to address ${peerAsBytes32}`);
        const umiTxs = [
            await this._createSetPeerAddressIx(normalizedPeer, eid), // admin
            // this.umiMyOAppSdk.setPeer(delegate, { peer: normalizedPeer, remoteEid: eid }),TODO: remove, since things are now handled by _createSetPeerAddressIx and _setPeerEnforcedOptionsIx
            await this._setPeerEnforcedOptionsIx(new Uint8Array([0, 3]), new Uint8Array([0, 3]), eid), // admin
            client_1.myoapp.initOAppNonce({ admin: delegate, oapp }, eid, normalizedPeer), // delegate
        ];
        const isSendLibraryInitialized = await this.isSendLibraryInitialized(eid);
        const isReceiveLibraryInitialized = await this.isReceiveLibraryInitialized(eid);
        if (!isSendLibraryInitialized) {
            umiTxs.push(client_1.myoapp.initSendLibrary({ admin: delegate, oapp }, eid));
        }
        if (!isReceiveLibraryInitialized) {
            umiTxs.push(client_1.myoapp.initReceiveLibrary({ admin: delegate, oapp }, eid));
        }
        return {
            ...(await this.createTransaction(this._umiToWeb3Tx(umiTxs))),
            description: `Setting peer for eid ${eid} (${eidLabel}) to address ${peerAsBytes32} ${delegate.publicKey} ${(await this._getAdmin()).publicKey}`,
        };
    }
    async getDelegate() {
        this.logger.debug(`Getting delegate`);
        const endpointSdk = await this.getEndpointSDK();
        const delegate = await endpointSdk.getDelegate(this.point.address);
        return this.logger.verbose(`Got delegate: ${delegate}`), delegate;
    }
    async isDelegate(delegate) {
        this.logger.debug(`Checking whether ${delegate} is a delegate`);
        const endpointSdk = await this.getEndpointSDK();
        const isDelegate = await endpointSdk.isDelegate(this.point.address, delegate);
        return this.logger.verbose(`Checked delegate: ${delegate}: ${(0, io_devtools_1.printBoolean)(isDelegate)}`), isDelegate;
    }
    async setDelegate(delegate) {
        this.logger.debug(`Setting delegate to ${delegate}`);
        return {
            ...(await this.createTransaction(this._umiToWeb3Tx([await this._setOFTDelegateIx(delegate)]))),
            description: `Setting delegate to ${delegate}`,
        };
    }
    async getEnforcedOptions(eid, msgType) {
        // First we check that we can understand the message type
        this.assertMsgType(msgType);
        const eidLabel = `eid ${eid} (${(0, devtools_2.formatEid)(eid)})`;
        this.logger.verbose(`Getting enforced options for ${eidLabel} and message type ${msgType}`);
        try {
            const options = await this.umiMyOAppSdk.getEnforcedOptions(this.umi.rpc, eid);
            const optionsForMsgType = msgType === MSG_TYPE_SEND ? options.send : options.sendAndCall;
            return (0, devtools_2.toHex)(optionsForMsgType);
        }
        catch (error) {
            if (String(error).match(/was not found at the provided address/)) {
                return (0, devtools_2.toHex)(new Uint8Array(0));
            }
            throw new Error(`Failed to get enforced options for ${this.label} for ${eidLabel} and message type ${msgType}: ${error}`);
        }
    }
    async setOutboundRateLimit(eid, rateLimit) {
        this.logger.verbose(`Setting outbound rate limit for ${eid} to ${(0, io_devtools_1.printJson)(rateLimit)}`);
        return {
            ...(await this.createTransaction(this._umiToWeb3Tx([await this._setPeerOutboundRateLimit(eid, rateLimit)]))),
            description: `Setting outbound rate limit for ${eid} to ${(0, io_devtools_1.printJson)(rateLimit)}`,
        };
    }
    async setInboundRateLimit(eid, rateLimit) {
        this.logger.verbose(`Setting outbound rate limit for ${eid} to ${(0, io_devtools_1.printJson)(rateLimit)}`);
        return {
            ...(await this.createTransaction(this._umiToWeb3Tx([await this._setPeerInboundRateLimit(eid, rateLimit)]))),
            description: `Setting outbound rate limit for ${eid} to ${(0, io_devtools_1.printJson)(rateLimit)}`,
        };
    }
    async setEnforcedOptions(enforcedOptions) {
        this.logger.verbose(`Setting enforced options to ${(0, io_devtools_1.printJson)(enforcedOptions)}`);
        const optionsByEidAndMsgType = this.reduceEnforcedOptions(enforcedOptions);
        const emptyOptions = lz_v2_utilities_1.Options.newOptions().toBytes();
        const ixs = [];
        for (const [eid, optionsByMsgType] of optionsByEidAndMsgType) {
            const sendOption = optionsByMsgType.get(MSG_TYPE_SEND) ?? emptyOptions;
            const sendAndCallOption = optionsByMsgType.get(MSG_TYPE_SEND_AND_CALL) ?? emptyOptions;
            ixs.push(await this._setPeerEnforcedOptionsIx(sendOption, sendAndCallOption, eid));
        }
        return {
            ...(await this.createTransaction(this._umiToWeb3Tx(ixs))),
            description: `Setting enforced options to ${(0, io_devtools_1.printJson)(enforcedOptions)}`,
        };
    }
    async isSendLibraryInitialized(eid) {
        const endpointSdk = await this.getEndpointSDK();
        return endpointSdk.isSendLibraryInitialized(this.point.address, eid);
    }
    async initializeSendLibrary(eid) {
        this.logger.verbose(`Initializing send library on ${(0, devtools_2.formatEid)(eid)}`);
        const endpointSdk = await this.getEndpointSDK();
        return endpointSdk.initializeSendLibrary(this.point.address, eid);
    }
    async isReceiveLibraryInitialized(eid) {
        const endpointSdk = await this.getEndpointSDK();
        return endpointSdk.isReceiveLibraryInitialized(this.point.address, eid);
    }
    async initializeReceiveLibrary(eid) {
        this.logger.verbose(`Initializing receive library on ${(0, devtools_2.formatEid)(eid)}`);
        const endpointSdk = await this.getEndpointSDK();
        return endpointSdk.initializeReceiveLibrary(this.point.address, eid);
    }
    async isOAppConfigInitialized(eid) {
        const endpointSdk = await this.getEndpointSDK();
        return endpointSdk.isOAppConfigInitialized(this.point.address, eid);
    }
    async initializeOAppConfig(eid, lib) {
        this.logger.verbose(`Initializing OApp config for library ${lib} on ${(0, devtools_2.formatEid)(eid)}`);
        const endpointSdk = await this.getEndpointSDK();
        return endpointSdk.initializeOAppConfig(this.point.address, eid, lib ?? undefined);
    }
    /**
     * Helper utility that takes an array of `OAppEnforcedOptionParam` objects and turns them into
     * a map keyed by `EndpointId` that contains another map keyed by `MsgType`.
     *
     * @param {OAppEnforcedOptionParam[]} enforcedOptions
     * @returns {Map<EndpointId, Map<MsgType, Uint8Array>>}
     */
    reduceEnforcedOptions(enforcedOptions) {
        return enforcedOptions.reduce((optionsByEid, enforcedOption) => {
            const { eid, option: { msgType, options }, } = enforcedOption;
            // First we check that we can understand the message type
            this.assertMsgType(msgType);
            // Then we warn the user if they are trying to specify enforced options for eid & msgType more than once
            // in which case the former option will be ignored
            const optionsByMsgType = optionsByEid.get(eid) ?? new Map();
            if (optionsByMsgType.has(msgType)) {
                this.logger.warn(`Duplicate enforced option for ${(0, devtools_2.formatEid)(eid)} and msgType ${msgType}`);
            }
            // We wrap the call with try/catch to deliver a better error message in case malformed options were passed
            try {
                optionsByMsgType.set(msgType, lz_v2_utilities_1.Options.fromOptions(options).toBytes());
            }
            catch (error) {
                throw new Error(`Invalid enforced options for ${this.label} for ${(0, devtools_2.formatEid)(eid)} and msgType ${msgType}: ${options}: ${error}`);
            }
            optionsByEid.set(eid, optionsByMsgType);
            return optionsByEid;
        }, new Map());
    }
    /**
     * Helper method that asserts that `value` is a `MsgType` that the OFT understands
     * and prints out a friendly error message if it doesn't
     *
     * @param {unknown} value
     * @returns {undefined}
     */
    assertMsgType(value) {
        (0, assert_1.default)(isMsgType(value), `${this.label}: Invalid msgType received: ${value}. Expected one of ${MSG_TYPE_SEND} (send), ${MSG_TYPE_SEND_AND_CALL} (send and call)`);
    }
    async setCallerBpsCap(callerBpsCap) {
        this.logger.debug(`Setting caller BPS cap to ${callerBpsCap}`);
        throw new TypeError(`setCallerBpsCap() not implemented on Solana OFT SDK`);
    }
    async getCallerBpsCap() {
        this.logger.debug(`Getting caller BPS cap`);
        throw new TypeError(`getCallerBpsCap() not implemented on Solana OFT SDK`);
    }
    async sendConfigIsInitialized(_eid) {
        const deriver = new lz_solana_sdk_v2_1.MessageLibPDADeriver(lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ID);
        const [sendConfig] = deriver.sendConfig(_eid, new web3_js_1.PublicKey(this.point.address));
        const accountInfo = await this.connection.getAccountInfo(sendConfig);
        return accountInfo != null;
    }
    async initConfig(eid) {
        const delegateAddress = await this.getDelegate();
        // delegate may be undefined if it has not yet been set.  In this case, use admin, which must exist.
        const delegate = delegateAddress ? (0, umi_1.createNoopSigner)((0, umi_1.publicKey)(delegateAddress)) : await this._getAdmin();
        return {
            ...(await this.createTransaction(this._umiToWeb3Tx([
                client_1.myoapp.initConfig(this.umiProgramId, {
                    admin: delegate,
                    payer: delegate,
                }, eid, {
                    msgLib: (0, umi_web3js_adapters_1.fromWeb3JsPublicKey)(lz_solana_sdk_v2_1.UlnProgram.PROGRAM_ID),
                }),
            ]))),
            description: `oapp.initConfig(${eid})`,
        };
    }
    async _setPeerConfigIx(param) {
        return this.umiMyOAppSdk.setPeerConfig({ admin: await this._getAdmin() }, param);
    }
    async _createSetPeerAddressIx(normalizedPeer, eid) {
        return this._setPeerConfigIx({
            __kind: 'PeerAddress',
            peer: normalizedPeer,
            remote: eid,
        });
    }
    async _setPeerEnforcedOptionsIx(send, sendAndCall, eid) {
        return this._setPeerConfigIx({
            __kind: 'EnforcedOptions',
            send,
            sendAndCall,
            remote: eid,
        });
    }
    // Convert Umi instructions to Web3JS Transaction
    _umiToWeb3Tx(ixs) {
        const web3Transaction = new web3_js_1.Transaction();
        const txBuilder = new umi_1.TransactionBuilder(ixs);
        txBuilder.getInstructions().forEach((umiInstruction) => {
            const web3Instruction = new web3_js_1.TransactionInstruction({
                programId: new web3_js_1.PublicKey(umiInstruction.programId),
                keys: umiInstruction.keys.map((key) => ({
                    pubkey: new web3_js_1.PublicKey(key.pubkey),
                    isSigner: key.isSigner,
                    isWritable: key.isWritable,
                })),
                data: Buffer.from(umiInstruction.data),
            });
            // Add the instruction to the Web3.js transaction
            web3Transaction.add(web3Instruction);
        });
        return web3Transaction;
    }
    async safeGetDelegate() {
        const delegateAddress = await this.getDelegate();
        if (!delegateAddress) {
            throw new Error('No delegate found');
        }
        return (0, umi_1.createNoopSigner)((0, umi_1.publicKey)(delegateAddress));
    }
    async _getAdmin() {
        const owner = await this.getOwner();
        return (0, umi_1.createNoopSigner)((0, umi_1.publicKey)(owner));
    }
}
exports.CustomOAppSDK = CustomOAppSDK;
__decorate([
    (0, devtools_1.AsyncRetriable)()
], CustomOAppSDK.prototype, "getOwner", null);
__decorate([
    (0, devtools_1.AsyncRetriable)()
], CustomOAppSDK.prototype, "getEndpointSDK", null);
__decorate([
    (0, devtools_1.AsyncRetriable)()
], CustomOAppSDK.prototype, "getPeer", null);
__decorate([
    (0, devtools_1.AsyncRetriable)()
], CustomOAppSDK.prototype, "getDelegate", null);
__decorate([
    (0, devtools_1.AsyncRetriable)()
], CustomOAppSDK.prototype, "isDelegate", null);
__decorate([
    (0, devtools_1.AsyncRetriable)()
], CustomOAppSDK.prototype, "getEnforcedOptions", null);
__decorate([
    (0, devtools_1.AsyncRetriable)()
], CustomOAppSDK.prototype, "getCallerBpsCap", null);
const MSG_TYPE_SEND = 1;
const MSG_TYPE_SEND_AND_CALL = 2;
const isMsgType = (value) => value === MSG_TYPE_SEND || value === MSG_TYPE_SEND_AND_CALL;
