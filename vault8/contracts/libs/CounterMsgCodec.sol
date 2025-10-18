// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @notice Simple opcode + u64 codec for counter demo
library CounterMsgCodec {
    uint8 internal constant OPCODE_INCREMENT = 1; // payload: uint64 by
    uint8 internal constant OPCODE_ACK = 2;       // payload: uint64 newCount

    function encIncrement(uint64 by) internal pure returns (bytes memory) {
        return abi.encodePacked(OPCODE_INCREMENT, by);
    }

    function encAck(uint64 newCount) internal pure returns (bytes memory) {
        return abi.encodePacked(OPCODE_ACK, newCount);
    }

    function dec(bytes calldata payload) internal pure returns (uint8 opcode, uint64 value) {
        opcode = uint8(payload[0]);
        value = abi.decode(payload[1:], (uint64));
    }
}
