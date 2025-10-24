/**
 * React hooks for writing to ManagedVault contracts using Wagmi
 * Based on Reown AppKit documentation:
 * https://docs.reown.com/appkit/recipes/EVM-smart-contract-interaction
 */

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ManagedVaultABI } from "../abis";
import type { Address } from "viem";

/**
 * Hook for syncing vault invested assets
 * Calls syncInvestedAssets() to update strategy balances
 */
export function useSyncVault(vaultAddress: Address) {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const syncVault = () => {
    writeContract({
      address: vaultAddress,
      abi: ManagedVaultABI,
      functionName: "syncInvestedAssets",
    });
  };

  return {
    syncVault,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}

/**
 * Hook for adjusting vault liquidity buffer
 * Calls setLiquidityBuffer(uint8 bufferPercent)
 */
export function useAdjustBuffer(vaultAddress: Address) {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const adjustBuffer = (bufferPercent: number) => {
    if (bufferPercent < 0 || bufferPercent > 100) {
      throw new Error("Buffer percent must be between 0 and 100");
    }

    writeContract({
      address: vaultAddress,
      abi: ManagedVaultABI,
      functionName: "setLiquidityBuffer",
      args: [bufferPercent],
    });
  };

  return {
    adjustBuffer,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}

/**
 * Hook for allocating funds to a strategy
 * Calls allocate(uint256 amount, address strategy)
 */
export function useAllocate(vaultAddress: Address) {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const allocate = (amount: bigint, strategyAddress: Address, value?: bigint) => {
    writeContract({
      address: vaultAddress,
      abi: ManagedVaultABI,
      functionName: "allocate",
      args: [amount, strategyAddress],
      value, // Optional: for strategies that need native token (e.g., for LayerZero fees)
    });
  };

  return {
    allocate,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}

/**
 * Hook for recalling funds from a strategy
 * Calls recall(uint256 amount, address strategy)
 */
export function useRecall(vaultAddress: Address) {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const recall = (amount: bigint, strategyAddress: Address) => {
    writeContract({
      address: vaultAddress,
      abi: ManagedVaultABI,
      functionName: "recall",
      args: [amount, strategyAddress],
    });
  };

  return {
    recall,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}

/**
 * Hook for initiating a bridge to Solana via CCTP
 * Calls initiateBridge(address strategy, uint256 amount) which returns a nonce
 * The bot will pick up the CctpDepositInitiated event and submit attestation to Solana
 */
export function useInitiateBridge(vaultAddress: Address) {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const initiateBridge = (amount: bigint, strategyAddress: Address) => {
    writeContract({
      address: vaultAddress,
      abi: ManagedVaultABI,
      functionName: "initiateBridge",
      args: [strategyAddress, amount],
    });
  };

  return {
    initiateBridge,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}
