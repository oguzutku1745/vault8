"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyOAppPDA = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const serializers_1 = require("@metaplex-foundation/umi/serializers");
const umi_eddsa_web3js_1 = require("@metaplex-foundation/umi-eddsa-web3js");
const umi_2 = require("@layerzerolabs/lz-solana-sdk-v2/umi");
const eddsa = (0, umi_eddsa_web3js_1.createWeb3JsEddsa)();
class MyOAppPDA extends umi_2.OmniAppPDA {
    constructor(programId) {
        super(programId);
        this.programId = programId;
    }
    // seeds = [STORE_SEED],
    oapp() {
        return eddsa.findPda(this.programId, [Buffer.from(MyOAppPDA.STORE_SEED, 'utf8')]);
    }
    // seeds = [PEER_SEED, &count.key().to_bytes(), &params.dst_eid.to_be_bytes()],
    peer(dstChainId) {
        const [count] = this.oapp();
        return eddsa.findPda(this.programId, [
            Buffer.from(umi_2.OmniAppPDA.PEER_SEED, 'utf8'),
            (0, umi_1.publicKeyBytes)(count),
            (0, serializers_1.u32)({ endian: serializers_1.Endian.Big }).serialize(dstChainId),
        ]);
    }
    // seeds = [NONCE_SEED, &params.receiver, &params.src_eid.to_be_bytes(), &params.sender]
    nonce(receiver, remoteEid, sender) {
        return eddsa.findPda(this.programId, [
            Buffer.from(MyOAppPDA.NONCE_SEED, 'utf8'),
            (0, umi_1.publicKeyBytes)(receiver),
            (0, serializers_1.u32)({ endian: serializers_1.Endian.Big }).serialize(remoteEid),
            sender,
        ]);
    }
}
exports.MyOAppPDA = MyOAppPDA;
MyOAppPDA.STORE_SEED = 'Store';
MyOAppPDA.NONCE_SEED = 'Nonce';
