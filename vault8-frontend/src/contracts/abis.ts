/**
 * Contract ABIs for vault8 platform
 * Only includes the view functions we need for reading data
 */

export const VaultFactoryABI = [
  // View functions
  {
    type: 'function',
    name: 'allVaults',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllVaults',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allVaultsLength',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approvedStrategies',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'isApprovedStrategy',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  },
  
  // Write functions
  {
    type: 'function',
    name: 'approveStrategy',
    inputs: [{ name: 'strategy', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'deployVault',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'vaultOwner', type: 'address' },
      { name: 'selectedStrategies', type: 'address[]' }
    ],
    outputs: [{ name: 'vault', type: 'address' }],
    stateMutability: 'nonpayable'
  },
  
  // Events
  {
    type: 'event',
    name: 'StrategyApproved',
    inputs: [{ name: 'strategy', type: 'address', indexed: true }]
  },
  {
    type: 'event',
    name: 'VaultDeployed',
    inputs: [
      { name: 'vault', type: 'address', indexed: true },
      { name: 'asset', type: 'address', indexed: true },
      { name: 'owner', type: 'address', indexed: true }
    ]
  }
] as const;

export const ManagedVaultABI = [
  // View functions - Asset info
  {
    type: 'function',
    name: 'totalAssets',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'asset',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  
  // View functions - Strategy info
  {
    type: 'function',
    name: 'allowedStrategies',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'isStrategyAllowed',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'strategyBalance',
    inputs: [{ name: 'strategy', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'strategyBalances',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  
  // View functions - Vault management
  {
    type: 'function',
    name: 'liquidityBuffer',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'lastSyncTimestamp',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'investedAssets',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  
  // Write functions
  {
    type: 'function',
    name: 'syncInvestedAssets',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setLiquidityBuffer',
    inputs: [{ name: 'bufferPercent', type: 'uint8' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'allocate',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'strategy', type: 'address' }
    ],
    outputs: [],
    stateMutability: 'payable'
  }
] as const;

export const IERC20ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
] as const;

