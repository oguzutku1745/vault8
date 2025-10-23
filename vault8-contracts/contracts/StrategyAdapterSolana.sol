// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStrategy} from "./IStrategy.sol";

struct MessagingFee {
    uint256 nativeFee;
    uint256 lzTokenFee;
}

struct MessagingReceipt {
    bytes32 guid;
    uint64 nonce;
    MessagingFee fee;
}

interface IMyOAppBridge {
    function depositViaCCTP(uint256 amount) external returns (uint64);
    function requestDeposit(uint32 dstEid, bytes calldata options) external payable returns (MessagingReceipt memory);
    function getPendingDeposit(address user) external view returns (uint256 amount, uint64 nonce);
}

/**
 * @title StrategyAdapterSolana
 * @notice Adapter that orchestrates bridging to Solana via MyOApp (CCTP + LayerZero).
 * @dev Requires two explicit calls from the vault owner:
 *      1. `bridge(amount)` – burns USDC via Circle CCTP and records the net amount.
 *      2. `deposit(amount)` – finalizes the LayerZero leg, requiring the bridge record.
 */
contract StrategyAdapterSolana is IStrategy {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    IMyOAppBridge public immutable myOApp;
    uint32 public immutable dstEid;

    address public vault;
    bool public isSealed;
    bytes public lzOptions;

    mapping(bytes32 => uint256) public bridged;

    event VaultBound(address indexed vault);
    event BridgeInitiated(address indexed vault, uint64 indexed nonce, uint256 grossAmount, uint256 netAmount);
    event DepositRequested(address indexed vault, uint64 indexed nonce, bytes32 guid, uint256 amount);
    event LayerZeroOptionsUpdated(bytes options);

    error NotVault();
    error ZeroAddress();
    error Sealed();
    error PendingBridge();
    error BridgeMissing();
    error AmountMismatch();
    error WithdrawUnsupported();

    constructor(IERC20 asset_, IMyOAppBridge myOApp_, uint32 dstEid_, bytes memory options_) {
        if (address(asset_) == address(0) || address(myOApp_) == address(0)) revert ZeroAddress();
        asset = asset_;
        myOApp = myOApp_;
        dstEid = dstEid_;
        lzOptions = options_;
    }

    function setVault(address newVault) external {
        if (isSealed) revert Sealed();
        if (newVault == address(0)) revert ZeroAddress();
        vault = newVault;
        isSealed = true;
        emit VaultBound(newVault);
    }

    /**
     * @notice Update LayerZero execution options; callable only by the vault.
     */
    function setLayerZeroOptions(bytes calldata options) external {
        if (msg.sender != vault) revert NotVault();
        lzOptions = options;
        emit LayerZeroOptionsUpdated(options);
    }

    /**
     * @notice Initiate the CCTP burn and record the bridged amount keyed by `vault + nonce`.
     * @dev Expects `vault` to have approved this adapter for `amount`.
     */
    function bridge(uint256 amount) external returns (uint64 nonce) {
        if (msg.sender != vault) revert NotVault();
        if (amount == 0) revert AmountMismatch();

        (uint256 pendingAmount, ) = myOApp.getPendingDeposit(address(this));
        if (pendingAmount != 0) revert PendingBridge();

        asset.safeTransferFrom(vault, address(this), amount);
        SafeERC20.forceApprove(asset, address(myOApp), amount);

        nonce = myOApp.depositViaCCTP(amount);

        SafeERC20.forceApprove(asset, address(myOApp), 0);

        (uint256 mintedAmount, uint64 recordedNonce) = myOApp.getPendingDeposit(address(this));
        if (recordedNonce != nonce || mintedAmount == 0) revert AmountMismatch();

        bytes32 key = _bridgeKey(vault, nonce);
        if (bridged[key] != 0) revert PendingBridge();
        bridged[key] = mintedAmount;

        emit BridgeInitiated(vault, nonce, amount, mintedAmount);
    }

    /**
     * @notice Finalize the LayerZero request; must match a prior bridge record.
     * @dev `amount` must equal the net minted amount (gross minus CCTP fee).
     */
    function deposit(uint256 amount) external payable override {
        if (msg.sender != vault) revert NotVault();
        if (amount == 0) revert AmountMismatch();

        (uint256 pendingAmount, uint64 nonce) = myOApp.getPendingDeposit(address(this));
        if (pendingAmount == 0) revert BridgeMissing();

        bytes32 key = _bridgeKey(vault, nonce);
        uint256 recorded = bridged[key];
        if (recorded == 0) revert BridgeMissing();
        if (pendingAmount != recorded || pendingAmount != amount) revert AmountMismatch();

        MessagingReceipt memory receipt = myOApp.requestDeposit{value: msg.value}(dstEid, lzOptions);

        delete bridged[key];

        emit DepositRequested(vault, nonce, receipt.guid, amount);
    }

    function withdraw(uint256, address) external pure override {
        revert WithdrawUnsupported();
    }

    /**
     * @notice Reports the currently pending bridged amount (net minted).
     */
    function balance() external view override returns (uint256) {
        (uint256 pendingAmount, ) = myOApp.getPendingDeposit(address(this));
        return pendingAmount;
    }

    function pendingBridge() external view returns (uint256 amount, uint64 nonce, bytes32 key) {
        (amount, nonce) = myOApp.getPendingDeposit(address(this));
        if (amount != 0) {
            key = _bridgeKey(vault, nonce);
        }
    }

    function _bridgeKey(address vaultAddress, uint64 nonce) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(vaultAddress, nonce));
    }
}
