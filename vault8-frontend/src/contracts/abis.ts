/**
 * Contract ABIs for vault8 platform
 * Only includes the view functions we need for reading data
 */

export const VaultFactoryABI = [
  // View functions
  "function allVaults(uint256) view returns (address)",
  "function getAllVaults() view returns (address[])",
  "function allVaultsLength() view returns (uint256)",
  "function approvedStrategies() view returns (address[])",
  "function isApprovedStrategy(address) view returns (bool)",
  
  // Write functions
  "function approveStrategy(address strategy) external",
  "function deployVault(address asset, string calldata name, string calldata symbol, address vaultOwner, address[] calldata selectedStrategies) external returns (address vault)",
  
  // Events
  "event StrategyApproved(address indexed strategy)",
  "event VaultDeployed(address indexed vault, address indexed asset, address indexed owner)",
] as const;

export const ManagedVaultABI = [
  // View functions - Asset info
  "function totalAssets() view returns (uint256)",
  "function asset() view returns (address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  
  // View functions - Strategy info
  "function allowedStrategies() view returns (address[])",
  "function isStrategyAllowed(address) view returns (bool)",
  "function strategyBalance(address strategy) view returns (uint256)",
  "function strategyBalances(address) view returns (uint256)",
  
  // View functions - Vault management
  "function liquidityBuffer() view returns (uint8)",
  "function lastSyncTimestamp() view returns (uint256)",
  "function investedAssets() view returns (uint256)",
  "function owner() view returns (address)",
  
  // Write functions (for later use)
  "function syncInvestedAssets() external",
  "function setLiquidityBuffer(uint8 bufferPercent) external",
  "function allocate(uint256 amount, address strategy) external payable",
] as const;

export const IERC20ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
] as const;

