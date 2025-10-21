// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { MessagingReceipt } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { CounterMsgCodec } from "./libs/CounterMsgCodec.sol";

contract MyOApp is OApp, OAppOptionsType3 {
    using CounterMsgCodec for bytes;

    // For legacy UI/debugging
    string public data = "Nothing received yet.";
    // Counter updated via compose ACK from Solana
    uint64 public counter;

    // Balances credited on ACK; maps beneficiary to credited amount
    mapping(address => uint256) public balances;
    // Correlate outgoing message GUID -> original sender to credit on ACK
    mapping(bytes32 => address) public pendingSender;

    // Note: OApp inherits ownership; pass through Ownable initializer via the most-derived constructor
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

    // Build 8-byte little-endian payload from uint64
    function _toLeBytes8(uint64 x) internal pure returns (bytes memory out) {
        out = new bytes(8);
        uint64 v = x;
        for (uint256 i = 0; i < 8; i++) {
            out[i] = bytes1(uint8(v & 0xFF));
            v >>= 8;
        }
    }

    // Deposit: send 28-byte payload (amount + EVM address) to Solana for balance tracking
    function requestDeposit(
        uint32 _dstEid,
        uint64 _amountBaseUnits,
        bytes calldata _options
    ) external payable returns (MessagingReceipt memory receipt) {
        // Build 28-byte payload: [amount:8][evm_address:20]
        bytes memory payload = abi.encodePacked(
            _toLeBytes8(_amountBaseUnits),  // 8 bytes: amount (little-endian)
            msg.sender                       // 20 bytes: EVM address
        );
        bytes memory options = combineOptions(_dstEid, /*msgType*/ 1, _options);
        receipt = _lzSend(_dstEid, payload, options, MessagingFee(msg.value, 0), payable(msg.sender));
        // Track sender by GUID for bot to correlate with Solana DepositEvent
        pendingSender[receipt.guid] = msg.sender;
    }

    function quoteDeposit(
        uint32 _dstEid,
        uint64 _amountBaseUnits,
        bytes calldata _options,
        bool _payInLzToken
    ) external view returns (MessagingFee memory fee) {
        // Build same 28-byte payload for accurate fee quote
        bytes memory payload = abi.encodePacked(
            _toLeBytes8(_amountBaseUnits),
            msg.sender
        );
        bytes memory options = combineOptions(_dstEid, /*msgType*/ 1, _options);
        return _quote(_dstEid, payload, options, _payInLzToken);
    }

    // Not used for this flow; kept for compatibility with message-only paths
    function _lzReceive(
        Origin calldata /*origin*/,
        bytes32 /*guid*/,
        bytes calldata payload,
        address /*executor*/,
        bytes calldata /*extra*/
    ) internal override {
        // Decode legacy string if present
        // no-op for counter flow
        data = string(payload);
    }

    // External compose callback entrypoint (ACK from Solana). Called by the LayerZero Endpoint.
    // Signature compatible with ILayerZeroComposer in the installed protocol version.
    function lzCompose(
        address /*_from*/,
        address /*_to*/,
        bytes32 guid,
        uint16 /*_index*/,
        bytes calldata payload,
        bytes calldata /*_extraData*/
    ) external payable {
        // Only the LayerZero Endpoint can call compose callbacks
        require(msg.sender == address(endpoint), "LZ: caller not endpoint");

        uint64 amount = 0;
        if (payload.length == 9 && uint8(payload[0]) == CounterMsgCodec.OPCODE_ACK) {
            // decode little-endian u64 from payload[1..8]
            for (uint256 i = 0; i < 8; i++) {
                amount |= uint64(uint8(payload[1 + i])) << uint64(8 * i);
            }
            counter = amount; // keep legacy counter behavior for UI
        } else if (payload.length == 8) {
            // raw 8-byte LE amount
            for (uint256 i = 0; i < 8; i++) {
                amount |= uint64(uint8(payload[i])) << uint64(8 * i);
            }
            counter = amount; // also mirror to counter for compatibility
        }

        // Credit the original sender if the message GUID is known
        address beneficiary = pendingSender[guid];
        if (beneficiary != address(0)) {
            delete pendingSender[guid];
            balances[beneficiary] += amount;
        }
    }
}
