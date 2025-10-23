/**
 * ABIs for Strategy Adapter contracts
 */

export const StrategyAdapterCompoundIIIABI = [
  "constructor(address _comet, address _asset)",
  "function setVault(address newVault) external",
  "function deposit(uint256 amount) external payable",
  "function withdraw(uint256 amount, address to) external",
  "function balance() external view returns (uint256)",
  "function vault() external view returns (address)",
  "function isSealed() external view returns (bool)",
  "event VaultBound(address indexed vault)",
] as const;

export const StrategyAdapterSolanaABI = [
  "constructor(address asset_, address myOApp_, uint32 dstEid_, bytes memory options_)",
  "function setVault(address newVault) external",
  "function setLayerZeroOptions(bytes calldata options) external",
  "function bridge(uint256 amount) external returns (uint64 nonce)",
  "function deposit(uint256 amount) external payable",
  "function withdraw(uint256 amount, address senderVault) external",
  "function balance() external view returns (uint256)",
  "function vault() external view returns (address)",
  "function isSealed() external view returns (bool)",
  "event VaultBound(address indexed vault)",
  "event BridgeInitiated(address indexed vault, uint64 indexed nonce, uint256 grossAmount, uint256 netAmount)",
] as const;

// Strategy Adapter bytecode - to be filled after compilation
export const STRATEGY_ADAPTER_COMPOUND_BYTECODE = "" as const;
export const STRATEGY_ADAPTER_SOLANA_BYTECODE = "" as const;

