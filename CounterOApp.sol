// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// Import the LayerZero OApp base contracts.  These contracts expose the
// cross‑chain messaging interface (send/receive) as well as helper
// functions for quoting gas and bundling execution options.  See
// LayerZero's OApp quick‑start for a full example【606843145861602†L165-L280】.
import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OAppOptionsType3} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CounterOApp
/// @notice A simple omnichain counter example.  This contract lives on an
/// EVM chain (e.g. Base) and communicates with its sibling program on
/// Solana.  Calling `incrementCounter` dispatches a message to the
/// Solana program to increment its internal counter; calling
/// `requestCounter` asks the Solana program to return its current
/// counter value.  When the Solana program responds, `_lzReceive`
/// decodes the message and updates the local mirror of the counter.
///
/// The message format is intentionally simple:
///   - byte0: message type (0 = increment, 1 = read request, 2 = read response)
///   - bytes1–8 (only for type 2): the u64 counter value returned by
///     the Solana program encoded big‑endian.
contract CounterOApp is OApp, OAppOptionsType3, Ownable {
    /// @notice Most recent counter value observed on Solana.  Will be zero
    /// until the first read response is received.
    uint64 public solanaCounter;

    /// @notice Message types understood by this contract.  Solidity
    /// enums are compiled into uint8 values starting at zero.
    enum MessageType {
        Increment,     // 0
        ReadRequest,   // 1
        ReadResponse   // 2
    }

    /// @param _endpoint The address of the local LayerZero Endpoint V2 on
    /// the EVM chain.  This value is chain specific and can be found in
    /// the deployed contracts list.
    /// @param _owner The address allowed to configure peers and enforced
    /// options.  Uses OpenZeppelin’s Ownable for role management.
    constructor(address _endpoint, address _owner)
        OApp(_endpoint, _owner)
        Ownable(_owner)
    {}

    // ───────────────────────────────────────────────────────────
    //  Message construction and dispatch
    //
    // Each of the following functions encodes a one‑byte header to
    // indicate the action being requested and then calls `_lzSend` to
    // dispatch the message to Solana.  LayerZero handles fee
    // calculation and DVN/Executor logistics behind the scenes.  The
    // caller must provide the message fee as `msg.value`.

    /// @notice Dispatch a message to increment the Solana counter.
    /// @param _dstEid The destination Endpoint ID for Solana (see LayerZero
    /// documentation for current EID assignments).  This ID is used by
    /// the Endpoint to route the message to the correct chain.
    /// @param _options Additional execution options to pass through to
    /// LayerZero.  These options can specify the amount of compute or
    /// gas to provision on the destination chain【992394672514374†L126-L134】.
    function incrementCounter(uint32 _dstEid, bytes calldata _options) external payable {
        // Encode only the message type byte (0 for Increment).  No
        // additional parameters are needed.
        bytes memory _message = abi.encodePacked(uint8(MessageType.Increment));

        // Merge any call‑specific options with enforced options and
        // dispatch the message.  The user pays for the entire message
        // upfront (DVN verification + destination execution)【992394672514374†L119-L122】.
        _lzSend(
            _dstEid,
            _message,
            combineOptions(_dstEid, 0, _options),
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    /// @notice Dispatch a read request to the Solana counter.  Upon
    /// delivery, the Solana program will respond with a ReadResponse
    /// containing the current counter value.
    /// @param _dstEid Destination Endpoint ID (Solana).  Same as above.
    /// @param _options Execution options for the read request.
    function requestCounter(uint32 _dstEid, bytes calldata _options) external payable {
        // Message type 1 indicates a read request.
        bytes memory _message = abi.encodePacked(uint8(MessageType.ReadRequest));
        _lzSend(
            _dstEid,
            _message,
            combineOptions(_dstEid, 0, _options),
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    // ───────────────────────────────────────────────────────────
    //  Receive and decode messages
    //
    // `_lzReceive` is called by the Endpoint after a cross‑chain
    // message has been verified and routed to this OApp.  Only the
    // Endpoint can call this function and it performs origin
    // validation on your behalf【217935283593160†L296-L368】.  Your
    // implementation should decode the payload and apply business logic.
    /// @param _origin Metadata about the sending chain and sender.
    /// @param _guid A globally unique ID for this message packet.
    /// @param _message ABI‑encoded payload originally sent from the
    /// remote chain.  In this example, the first byte is the message
    /// type, and the remaining bytes (if any) contain parameters.
    /// @param _executor The Executor that delivered this message.
    /// @param _extraData Additional data from the Executor (unused).
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        // Require at least one byte for the message type.
        require(_message.length >= 1, "CounterOApp: empty message");

        uint8 mtype = uint8(_message[0]);
        if (mtype == uint8(MessageType.ReadResponse)) {
            // A ReadResponse message contains a u64 counter value in
            // bytes1..=8 (8 bytes).  Use abi.decode on the tail of the
            // message.  The value is big‑endian so decoding directly
            // into uint64 yields the correct result.
            require(_message.length == 1 + 8, "CounterOApp: invalid response length");
            // Slice off the first byte; decode the rest as uint64.
            uint64 newVal = abi.decode(_message[1:], (uint64));
            solanaCounter = newVal;
        } else {
            // Unknown message type — ignore or revert as desired.
            revert("CounterOApp: unhandled message type");
        }
    }

    /// @notice Helper to return the last known Solana counter value.
    function getCounter() external view returns (uint64) {
        return solanaCounter;
    }
}