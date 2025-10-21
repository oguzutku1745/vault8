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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyOAppPDA = void 0;
var umi_1 = require("@metaplex-foundation/umi");
var serializers_1 = require("@metaplex-foundation/umi/serializers");
var umi_eddsa_web3js_1 = require("@metaplex-foundation/umi-eddsa-web3js");
var umi_2 = require("@layerzerolabs/lz-solana-sdk-v2/umi");
var eddsa = (0, umi_eddsa_web3js_1.createWeb3JsEddsa)();
var MyOAppPDA = /** @class */ (function (_super) {
    __extends(MyOAppPDA, _super);
    function MyOAppPDA(programId) {
        var _this = _super.call(this, programId) || this;
        _this.programId = programId;
        return _this;
    }
    // seeds = [STORE_SEED],
    MyOAppPDA.prototype.oapp = function () {
        return eddsa.findPda(this.programId, [Buffer.from(MyOAppPDA.STORE_SEED, 'utf8')]);
    };
    // seeds = [PEER_SEED, &count.key().to_bytes(), &params.dst_eid.to_be_bytes()],
    MyOAppPDA.prototype.peer = function (dstChainId) {
        var count = this.oapp()[0];
        return eddsa.findPda(this.programId, [
            Buffer.from(umi_2.OmniAppPDA.PEER_SEED, 'utf8'),
            (0, umi_1.publicKeyBytes)(count),
            (0, serializers_1.u32)({ endian: serializers_1.Endian.Big }).serialize(dstChainId),
        ]);
    };
    // seeds = [NONCE_SEED, &params.receiver, &params.src_eid.to_be_bytes(), &params.sender]
    MyOAppPDA.prototype.nonce = function (receiver, remoteEid, sender) {
        return eddsa.findPda(this.programId, [
            Buffer.from(MyOAppPDA.NONCE_SEED, 'utf8'),
            (0, umi_1.publicKeyBytes)(receiver),
            (0, serializers_1.u32)({ endian: serializers_1.Endian.Big }).serialize(remoteEid),
            sender,
        ]);
    };
    MyOAppPDA.STORE_SEED = 'Store';
    MyOAppPDA.NONCE_SEED = 'Nonce';
    return MyOAppPDA;
}(umi_2.OmniAppPDA));
exports.MyOAppPDA = MyOAppPDA;
