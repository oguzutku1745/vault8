/**
 * React hooks for reading from VaultFactory contract using Wagmi
 * Based on Reown AppKit documentation:
 * https://docs.reown.com/appkit/recipes/EVM-smart-contract-interaction
 */

import { useReadContract } from "wagmi";
import { VaultFactoryABI } from "../abis";
import { CONTRACT_ADDRESSES } from "../config";
import type { Address } from "viem";

/**
 * Hook to read all vault addresses
 */
export function useAllVaults() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
    abi: VaultFactoryABI,
    functionName: "getAllVaults",
  });

  return {
    vaults: data as Address[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read approved strategies
 */
export function useApprovedStrategies() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
    abi: VaultFactoryABI,
    functionName: "approvedStrategies",
  });

  return {
    strategies: data as Address[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check if a strategy is approved
 */
export function useIsStrategyApproved(strategyAddress: Address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
    abi: VaultFactoryABI,
    functionName: "isApprovedStrategy",
    args: [strategyAddress],
  });

  return {
    isApproved: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read total vault count
 */
export function useVaultCount() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
    abi: VaultFactoryABI,
    functionName: "allVaultsLength",
  });

  return {
    count: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

