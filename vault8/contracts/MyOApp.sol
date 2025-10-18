// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { MessagingReceipt } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { CounterMsgCodec } from "./libs/CounterMsgCodec.sol";

contract MyOApp is OApp, OAppOptionsType3, Ownable {
    using CounterMsgCodec for bytes;

    // For legacy UI/debugging
    string public data = "Nothing received yet.";
    // Counter updated via compose ACK from Solana
    uint64 public counter;

    constructor(address _endpoint, address _delegate) OApp(_endpoint, _delegate) Ownable(_delegate) {}

    // Type-3: request an increment on Solana; msg.value must cover both lzReceive and compose budgets
    function requestIncrement(
        uint32 _dstEid,
        uint64 _by,
        bytes calldata _options
    ) external payable returns (MessagingReceipt memory receipt) {
        bytes memory payload = CounterMsgCodec.encIncrement(_by);
        bytes memory options = combineOptions(_dstEid, /*msgType*/ 1, _options);
        receipt = _lzSend(_dstEid, payload, options, MessagingFee(msg.value, 0), payable(msg.sender));
    }

    function quoteIncrement(
        uint32 _dstEid,
        uint64 _by,
        bytes calldata _options,
        bool _payInLzToken
    ) external view returns (MessagingFee memory fee) {
        bytes memory payload = CounterMsgCodec.encIncrement(_by);
        bytes memory options = combineOptions(_dstEid, /*msgType*/ 1, _options);
        return _quote(_dstEid, payload, options, _payInLzToken);
    }

    // Not used for this flow; kept for compatibility with message-only paths
    function _lzReceive(
        Origin calldata,
        bytes32,
        bytes calldata payload,
        address,
        bytes calldata
    ) internal override {
        // Decode legacy string if present
        // no-op for counter flow
        data = string(payload);
    }

    // Compose callback on EVM (ack from Solana)
    function _lzCompose(
        Origin calldata,
        bytes32,
        bytes calldata payload,
        address,
        bytes calldata
    ) internal override {
        (uint8 op, uint64 val) = CounterMsgCodec.dec(payload);
        if (op == CounterMsgCodec.OPCODE_ACK) {
            counter = val;
        }
    }
}
