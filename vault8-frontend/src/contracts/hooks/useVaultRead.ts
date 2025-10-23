/**
 * React hooks for reading from ManagedVault contracts using Wagmi
 * Based on Reown AppKit documentation:
 * https://docs.reown.com/appkit/recipes/EVM-smart-contract-interaction
 */

import { useReadContract } from "wagmi";
import { ManagedVaultABI } from "../abis";
import type { Address } from "viem";

/**
 * Hook to read total assets in vault
 */
export function useTotalAssets(vaultAddress: Address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: ManagedVaultABI,
    functionName: "totalAssets",
  });

  return {
    totalAssets: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read liquidity buffer
 */
export function useLiquidityBuffer(vaultAddress: Address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: ManagedVaultABI,
    functionName: "liquidityBuffer",
  });

  return {
    liquidityBuffer: data as number | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read last sync timestamp
 */
export function useLastSyncTimestamp(vaultAddress: Address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: ManagedVaultABI,
    functionName: "lastSyncTimestamp",
  });

  return {
    lastSyncTimestamp: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read allowed strategies
 */
export function useAllowedStrategies(vaultAddress: Address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: ManagedVaultABI,
    functionName: "allowedStrategies",
  });

  return {
    allowedStrategies: data as Address[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read strategy balance
 */
export function useStrategyBalance(vaultAddress: Address, strategyAddress: Address, enabled = true) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: ManagedVaultABI,
    functionName: "strategyBalance",
    args: [strategyAddress],
    query: {
      enabled, // Only fetch when enabled
    },
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read vault owner
 */
export function useVaultOwner(vaultAddress: Address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: ManagedVaultABI,
    functionName: "owner",
  });

  return {
    owner: data as Address | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read vault name
 */
export function useVaultName(vaultAddress: Address) {
  const { data, isLoading, error } = useReadContract({
    address: vaultAddress,
    abi: ManagedVaultABI,
    functionName: "name",
  });

  return {
    name: data as string | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to read vault asset address
 */
export function useVaultAsset(vaultAddress: Address) {
  const { data, isLoading, error } = useReadContract({
    address: vaultAddress,
    abi: ManagedVaultABI,
    functionName: "asset",
  });

  return {
    asset: data as Address | undefined,
    isLoading,
    error,
  };
}

