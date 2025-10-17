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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyOApp = exports.MessageType = exports.MY_OAPP_PROGRAM_ID = exports.types = exports.instructions = exports.errors = exports.accounts = void 0;
exports.getPeer = getPeer;
exports.initConfig = initConfig;
exports.initSendLibrary = initSendLibrary;
exports.initReceiveLibrary = initReceiveLibrary;
exports.initOAppNonce = initOAppNonce;
const umi_1 = require("@metaplex-foundation/umi");
const umi_program_repository_1 = require("@metaplex-foundation/umi-program-repository");
const umi_web3js_adapters_1 = require("@metaplex-foundation/umi-web3js-adapters");
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("ethers/lib/utils");
const umi_2 = require("@layerzerolabs/lz-solana-sdk-v2/umi");
// ESM shim: re-export the TypeScript source so the browser gets ESM named
// exports instead of CJS `exports`.
export * from './myoapp.ts'
const ENDPOINT_PROGRAM_ID = umi_2.EndpointProgram.ENDPOINT_PROGRAM_ID;
var MessageType;
(function (MessageType) {
    MessageType[MessageType["VANILLA"] = 1] = "VANILLA";
    MessageType[MessageType["COMPOSED_TYPE"] = 2] = "COMPOSED_TYPE";
})(MessageType || (exports.MessageType = MessageType = {}));
class MyOApp {
    constructor(programId, endpointProgramId = umi_2.EndpointProgram.ENDPOINT_PROGRAM_ID, rpc) {
        this.programId = programId;
        this.endpointProgramId = endpointProgramId;
        this.pda = new pda_1.MyOAppPDA(programId);
        if (rpc === undefined) {
            rpc = (0, umi_1.createNullRpc)();
            rpc.getCluster = () => 'custom';
        }
        this.programRepo = (0, umi_program_repository_1.createDefaultProgramRepository)({ rpc: rpc }, [
            {
                name: 'myOapp',
                publicKey: programId,
                getErrorFromCode(code, cause) {
                    return errors.getMyOappErrorFromCode(code, this, cause);
                },
                getErrorFromName(name, cause) {
                    return errors.getMyOappErrorFromName(name, this, cause);
                },
                isOnCluster() {
                    return true;
                },
            },
        ]);
        this.eventAuthority = new umi_2.EventPDA(programId).eventAuthority()[0];
        this.endpointSDK = new umi_2.EndpointProgram.Endpoint(endpointProgramId);
    }
    async getEnforcedOptions(rpc, remoteEid) {
        const [peer] = this.pda.peer(remoteEid);
        const peerInfo = await accounts.fetchPeerConfig({ rpc }, peer);
        return peerInfo.enforcedOptions;
    }
    getProgram(clusterFilter = 'custom') {
        return this.programRepo.get('myOapp', clusterFilter);
    }
    async getStore(rpc, commitment = 'confirmed') {
        const [count] = this.pda.oapp();
        return accounts.safeFetchStore({ rpc }, count, { commitment });
    }
    initStore(payer, admin) {
        const [oapp] = this.pda.oapp();
        const remainingAccounts = this.endpointSDK.getRegisterOappIxAccountMetaForCPI(payer.publicKey, oapp);
        return instructions
            .initStore({ payer: payer, programs: this.programRepo }, {
            payer,
            store: oapp,
            lzReceiveTypesAccounts: this.pda.lzReceiveTypesAccounts()[0],
            // args
            admin: admin,
            endpoint: this.endpointSDK.programId,
        })
            .addRemainingAccounts(remainingAccounts).items[0];
    }
    async send(rpc, payer, params, remainingAccounts, commitment = 'confirmed') {
        const { dstEid, nativeFee, lzTokenFee, message, options, composeMsg } = params;
        const msgLibProgram = await this.getSendLibraryProgram(rpc, payer, dstEid);
        const [oapp] = this.pda.oapp();
        const [peer] = this.pda.peer(dstEid);
        const receiverInfo = await accounts.fetchPeerConfig({ rpc }, peer, { commitment });
        const packetPath = {
            dstEid,
            sender: oapp,
            receiver: receiverInfo.peerAddress,
        };
        remainingAccounts =
            remainingAccounts ??
                (await this.endpointSDK.getSendIXAccountMetaForCPI(rpc, payer, {
                    path: packetPath,
                    msgLibProgram,
                }, commitment));
        if (remainingAccounts === undefined) {
            throw new Error('Failed to get remaining accounts for send instruction');
        }
        return instructions
            .send({ programs: this.programRepo }, {
            store: oapp,
            peer: peer,
            endpoint: this.endpointSDK.pda.setting()[0],
            // args
            dstEid,
            message,
            composeMsg: composeMsg ?? null,
            options,
            nativeFee: nativeFee,
            lzTokenFee: lzTokenFee ?? 0,
        })
            .addRemainingAccounts(remainingAccounts).items[0];
    }
    setPeerConfig(accounts, param) {
        const { admin } = accounts;
        const { remote } = param;
        let config;
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
            admin,
            store: this.pda.oapp()[0],
            peer: this.pda.peer(remote)[0],
            // args
            remoteEid: remote,
            config,
        }).items[0];
    }
    async quote(rpc, payer, params, remainingAccounts, commitment = 'confirmed') {
        const { dstEid, message, options, payInLzToken, composeMsg } = params;
        const msgLibProgram = await this.getSendLibraryProgram(rpc, payer, dstEid);
        const [oapp] = this.pda.oapp();
        // const [endpointSettingPDA] = endpoint.deriver.setting()
        const [peer] = this.pda.peer(dstEid);
        const receiverInfo = await accounts.fetchPeerConfig({ rpc }, peer, { commitment });
        const packetPath = {
            dstEid,
            sender: oapp,
            receiver: receiverInfo.peerAddress,
        };
        remainingAccounts =
            remainingAccounts ??
                (await this.endpointSDK.getQuoteIXAccountMetaForCPI(rpc, payer, {
                    path: packetPath,
                    msgLibProgram,
                }));
        if (remainingAccounts === undefined) {
            throw new Error('Failed to get remaining accounts for quote instruction');
        }
        const ix = instructions
            .quoteSend({
            programs: this.programRepo,
        }, {
            store: oapp,
            peer,
            endpoint: this.endpointSDK.pda.setting()[0],
            // args
            dstEid,
            message,
            composeMsg: composeMsg ?? null,
            options,
            payInLzToken,
            receiver: packetPath.receiver,
        })
            .addRemainingAccounts(remainingAccounts).items[0];
        //TODO: use @solana-developers/helpers to get the compute units
        const modifyComputeUnits = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
            units: 400000,
        });
        return (0, umi_2.simulateWeb3JsTransaction)(rpc, [modifyComputeUnits, (0, umi_web3js_adapters_1.toWeb3JsInstruction)(ix.instruction)], this.programId, payer, umi_2.EndpointProgram.types.getMessagingFeeSerializer(), 'confirmed');
    }
    async getSendLibraryProgram(rpc, payer, dstEid) {
        const [oapp] = this.pda.oapp();
        const sendLibInfo = await this.endpointSDK.getSendLibrary(rpc, oapp, dstEid);
        if (!sendLibInfo.programId) {
            throw new Error('Send library not initialized or blocked message library');
        }
        const { programId: msgLibProgram } = sendLibInfo;
        const msgLibVersion = await this.endpointSDK.getMessageLibVersion(rpc, payer, msgLibProgram);
        if (msgLibVersion.major === 0n && msgLibVersion.minor == 0 && msgLibVersion.endpointVersion == 2) {
            return new umi_2.SimpleMessageLibProgram.SimpleMessageLib(msgLibProgram);
        }
        else if (msgLibVersion.major === 3n && msgLibVersion.minor == 0 && msgLibVersion.endpointVersion == 2) {
            return new umi_2.UlnProgram.Uln(msgLibProgram);
        }
        throw new Error(`Unsupported message library version: ${JSON.stringify(msgLibVersion, null, 2)}`);
    }
}
exports.MyOApp = MyOApp;
async function getPeer(rpc, dstEid, oftProgramId) {
    const [peer] = new pda_1.MyOAppPDA(oftProgramId).peer(dstEid);
    const info = await accounts.fetchPeerConfig({ rpc }, peer);
    return (0, utils_1.hexlify)(info.peerAddress);
}
function initConfig(programId, accounts, remoteEid, programs) {
    const { admin, payer } = accounts;
    const pda = new pda_1.MyOAppPDA(programId);
    let msgLibProgram, endpointProgram;
    if (programs === undefined) {
        msgLibProgram = umi_2.UlnProgram.ULN_PROGRAM_ID;
        endpointProgram = umi_2.EndpointProgram.ENDPOINT_PROGRAM_ID;
    }
    else {
        msgLibProgram = programs.msgLib ?? umi_2.UlnProgram.ULN_PROGRAM_ID;
        endpointProgram = programs.endpoint ?? umi_2.EndpointProgram.ENDPOINT_PROGRAM_ID;
    }
    const endpoint = new umi_2.EndpointProgram.Endpoint(endpointProgram);
    let msgLib;
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
function initSendLibrary(accounts, remoteEid, endpointProgram = ENDPOINT_PROGRAM_ID) {
    const { admin, oapp } = accounts;
    const endpoint = new umi_2.EndpointProgram.Endpoint(endpointProgram);
    return endpoint.initOAppSendLibrary(admin, { sender: oapp, remote: remoteEid });
}
function initReceiveLibrary(accounts, remoteEid, endpointProgram = ENDPOINT_PROGRAM_ID) {
    const { admin, oapp } = accounts;
    const endpoint = new umi_2.EndpointProgram.Endpoint(endpointProgram);
    return endpoint.initOAppReceiveLibrary(admin, { receiver: oapp, remote: remoteEid });
}
function initOAppNonce(accounts, remoteEid, remoteOappAddr, // must be 32 bytes
endpointProgram = ENDPOINT_PROGRAM_ID) {
    const { admin, oapp } = accounts;
    const endpoint = new umi_2.EndpointProgram.Endpoint(endpointProgram);
    return endpoint.initOAppNonce(admin, {
        localOApp: oapp,
        remote: remoteEid,
        remoteOApp: remoteOappAddr,
    });
}
