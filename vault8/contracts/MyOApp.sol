// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { MessagingReceipt } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { CounterMsgCodec } from "./libs/CounterMsgCodec.sol";

/**
 * @title CCTP V2 Token Messenger Interface
 * @notice Circle's CCTP V2 interface for burning tokens on source chain with Fast Transfer support
 * @dev Documentation: https://developers.circle.com/cctp/evm-smart-contracts
 */
interface ICCTPTokenMessengerV2 {
    /**
     * @notice Deposits and burns tokens from sender to be minted on destination domain (CCTP V2)
     * @param amount Amount of tokens to burn
     * @param destinationDomain Destination domain identifier
     * @param mintRecipient Address receiving minted tokens on destination (bytes32 format)
     * @param burnToken Address of token to burn
     * @param destinationCaller Address that can call receiveMessage on destination (bytes32(0) = anyone)
     * @param maxFee Maximum fee paid for fast burn in units of burnToken
     * @param minFinalityThreshold Minimum finality threshold (1000 = Fast Transfer, 2000 = Standard)
     * @return nonce Unique nonce reserved by message
     */
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken,
        bytes32 destinationCaller,
        uint256 maxFee,
        uint32 minFinalityThreshold
    ) external returns (uint64 nonce);
}

contract MyOApp is OApp, OAppOptionsType3 {
    using CounterMsgCodec for bytes;
    using SafeERC20 for IERC20;

    // For legacy UI/debugging
    string public data = "Nothing received yet.";
    // Counter updated via compose ACK from Solana
    uint64 public counter;

    // Balances credited on ACK; maps beneficiary to credited amount
    mapping(address => uint256) public balances;
    // Correlate outgoing message GUID -> original sender to credit on ACK
    mapping(bytes32 => address) public pendingSender;

    // ==================== CCTP V2 Configuration ====================
    
    /// @notice Circle's CCTP V2 TokenMessenger contract on Base Sepolia
    /// @dev Base Sepolia TokenMessengerV2: 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA
    /// @dev This is the contract we need to approve USDC for (it calls transferFrom)
    ICCTPTokenMessengerV2 public immutable cctpTokenMessenger;
    
    /// @notice USDC token contract on Base Sepolia
    /// @dev Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    IERC20 public immutable usdc;
    
    /// @notice Solana domain identifier for CCTP V2
    /// @dev Solana domain: 5
    uint32 public constant SOLANA_DOMAIN = 5;
    
    /// @notice Fast Transfer finality threshold for CCTP V2
    /// @dev 1000 = Confirmed (~10-30 seconds), 2000 = Finalized (~13-19 minutes)
    uint32 public constant FAST_TRANSFER_THRESHOLD = 1000;
    
    /// @notice Store's USDC ATA on Solana (hex-encoded 32-byte address)
    /// @dev Base58: MHso38U1uo8br3gSU6bXKC8apXorKzfwPqMVgYaKCma
    /// @dev Hex: 0x0532b299adf7feeff0684579095c83982f2998b494fd93a5ae188fbcbfee74a5
    /// @dev NO CONVERSION NEEDED! Solana addresses are already 32 bytes. Pass directly to depositForBurn.
    bytes32 public constant STORE_SOLANA_USDC_ATA = 0x0532b299adf7feeff0684579095c83982f2998b494fd93a5ae188fbcbfee74a5;
    
    /// @notice CCTP V2 Fee Calculation Constants
    /// @dev Base Sepolia Fast Transfer fee: 1 bps (0.01%) = 100_000 in 1/1000 basis points
    /// @dev Fee formula: fee = (amount * MIN_FEE) / MIN_FEE_MULTIPLIER
    uint256 public constant MIN_FEE = 100_000; // 1 bps = 0.01%
    uint256 public constant MIN_FEE_MULTIPLIER = 10_000_000;
    
    /// @notice Track CCTP deposits: user => ACTUAL amount that will be minted on Solana (after fees)
    /// @dev This is the net amount user will receive on Solana (depositAmount - cctpFee)
    /// @dev Security: Ensures user can only send LayerZero message for amount they actually receive
    mapping(address => uint256) public cctpDeposits;
    
    /// @notice Track CCTP nonces for each user's deposit
    /// @dev Used for bot to correlate CCTP attestation with user
    mapping(address => uint64) public cctpNonces;
    
    // ==================== Events ====================
    
    /// @notice Emitted when user initiates CCTP deposit
    /// @param user Address of the depositor
    /// @param depositAmount Amount of USDC deposited by user (before fees)
    /// @param mintedAmount Amount of USDC that will be minted on Solana (after fees)
    /// @param fee CCTP Fast Transfer fee charged
    /// @param cctpNonce CCTP nonce for attestation tracking
    /// @param destinationDomain CCTP destination domain (Solana = 5)
    event CctpDepositInitiated(
        address indexed user,
        uint256 depositAmount,
        uint256 mintedAmount,
        uint256 fee,
        uint64 indexed cctpNonce,
        uint32 destinationDomain
    );
    
    /// @notice Emitted when user finalizes deposit by sending LayerZero message
    /// @param user Address of the depositor
    /// @param amount Amount sent via LayerZero
    /// @param dstEid LayerZero destination endpoint ID
    /// @param guid LayerZero message GUID
    event DepositFinalized(
        address indexed user,
        uint256 amount,
        uint32 indexed dstEid,
        bytes32 indexed guid
    );

    // Note: OApp inherits ownership; pass through Ownable initializer via the most-derived constructor
    constructor(
        address _endpoint,
        address _delegate,
        address _cctpTokenMessenger,
        address _usdc
    ) OApp(_endpoint, _delegate) Ownable(_delegate) {
        require(_cctpTokenMessenger != address(0), "Invalid CCTP messenger");
        require(_usdc != address(0), "Invalid USDC address");
        cctpTokenMessenger = ICCTPTokenMessengerV2(_cctpTokenMessenger);
        usdc = IERC20(_usdc);
    }

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

    // ==================== CCTP Functions ====================
    
    /**
     * @notice Complete CCTP deposit flow in one transaction
     * @dev Combines: transferFrom → approve → depositForBurn
     * @dev Calculates actual minted amount after CCTP Fast Transfer fee (1 bps = 0.01%)
     * @param _amount Amount of USDC to bridge to Solana (before fees)
     * @return nonce CCTP nonce for tracking the cross-chain message
     */
    function depositViaCCTP(uint256 _amount) external returns (uint64) {
        require(_amount > 0, "Amount must be nonzero");
        
        // Calculate CCTP Fast Transfer fee (1 bps = 0.01%)
        // Fee = (amount * MIN_FEE) / MIN_FEE_MULTIPLIER
        // For 1 USDC (1,000,000 units): fee = (1,000,000 * 100,000) / 10,000,000 = 10,000 = 0.01 USDC
        uint256 cctpFee = (_amount * MIN_FEE) / MIN_FEE_MULTIPLIER;
        uint256 mintedAmount = _amount - cctpFee;
        
        require(mintedAmount > 0, "Amount too small (fee >= amount)");
        
        // Step 1: Transfer USDC from user to this contract
        usdc.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Step 2: Approve CCTP TokenMessenger to spend our USDC
        bool approveSuccess = usdc.approve(address(cctpTokenMessenger), _amount);
        require(approveSuccess, "CCTP approval failed");
        
        // Step 3: Call CCTP depositForBurn
        // maxFee must be >= cctpFee, we use the calculated fee
        bytes memory data = abi.encodeWithSelector(
            0x8e0250ee,  // depositForBurn(uint256,uint32,bytes32,address,bytes32,uint256,uint32)
            _amount,
            SOLANA_DOMAIN,
            STORE_SOLANA_USDC_ATA,
            address(usdc),
            bytes32(0),
            cctpFee,  // Use the exact calculated fee as maxFee
            FAST_TRANSFER_THRESHOLD
        );
        
        (bool success, bytes memory result) = address(cctpTokenMessenger).call(data);
        require(success, "depositForBurn failed");
        
        // CCTP V2 depositForBurn returns uint64 nonce
        uint64 nonce = 0;
        if (result.length > 0) {
            nonce = abi.decode(result, (uint64));
        }
        
        // Store the ACTUAL minted amount (after fees) for this user
        cctpDeposits[msg.sender] = mintedAmount;
        cctpNonces[msg.sender] = nonce;
        
        emit CctpDepositInitiated(msg.sender, _amount, mintedAmount, cctpFee, nonce, SOLANA_DOMAIN);
        return nonce;
    }

    // ==================== LayerZero Functions ====================

    /**
     * @notice Get the pending CCTP deposit amount for a user
     * @param _user User address to check
     * @return amount Pending CCTP deposit amount
     * @return nonce CCTP nonce of the deposit
     */
    function getPendingDeposit(address _user) external view returns (uint256 amount, uint64 nonce) {
        return (cctpDeposits[_user], cctpNonces[_user]);
    }

    // ==================== LayerZero Functions ====================

    /**
     * @notice Step 2: Send LayerZero message to finalize deposit on Solana
     * @dev User signs this transaction AFTER bot has submitted CCTP attestation on Solana.
     * @dev This function uses the amount from the user's CCTP deposit (security: prevents amount mismatch).
     * @dev If user has NO pending CCTP deposit, this function acts as legacy direct deposit (for testing).
     * @param _dstEid LayerZero destination endpoint ID (Solana = 40168)
     * @param _options LayerZero execution options (gas, etc.)
     * @return receipt LayerZero messaging receipt
     */
    function requestDeposit(
        uint32 _dstEid,
        bytes calldata _options
    ) external payable returns (MessagingReceipt memory receipt) {
        // Get amount from user's CCTP deposit
        uint256 amount = cctpDeposits[msg.sender];
        require(amount > 0, "No pending CCTP deposit. Call depositViaCCTP first.");
        require(amount <= type(uint64).max, "Amount exceeds uint64 max");
        
        // Build 36-byte payload: [amount:8][evm_address:20][cctp_nonce:8]
        bytes memory payload = abi.encodePacked(
            _toLeBytes8(uint64(amount)),           // 8 bytes: amount (little-endian)
            msg.sender,                             // 20 bytes: EVM address
            _toLeBytes8(cctpNonces[msg.sender])    // 8 bytes: CCTP nonce (little-endian)
        );
        
        bytes memory options = combineOptions(_dstEid, /*msgType*/ 1, _options);
        receipt = _lzSend(_dstEid, payload, options, MessagingFee(msg.value, 0), payable(msg.sender));
        
        // Track sender by GUID for bot to correlate with Solana DepositEvent
        pendingSender[receipt.guid] = msg.sender;
        
        // Clear user's CCTP deposit (security: prevents replay)
        delete cctpDeposits[msg.sender];
        delete cctpNonces[msg.sender];
        
        emit DepositFinalized(msg.sender, amount, _dstEid, receipt.guid);
        
        return receipt;
    }

    /**
     * @notice Quote the LayerZero fee for requestDeposit
     * @dev Quotes based on the user's pending CCTP deposit amount
     * @param _dstEid LayerZero destination endpoint ID
     * @param _options LayerZero execution options
     * @param _payInLzToken Whether to pay fee in LZ token
     * @return fee Estimated messaging fee
     */
    function quoteDeposit(
        uint32 _dstEid,
        bytes calldata _options,
        bool _payInLzToken
    ) external view returns (MessagingFee memory fee) {
        // Get user's pending CCTP deposit amount
        uint256 amount = cctpDeposits[msg.sender];
        require(amount > 0, "No pending CCTP deposit");
        require(amount <= type(uint64).max, "Amount exceeds uint64 max");
        
        // Build same 36-byte payload for accurate fee quote
        bytes memory payload = abi.encodePacked(
            _toLeBytes8(uint64(amount)),
            msg.sender,
            _toLeBytes8(cctpNonces[msg.sender])
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

