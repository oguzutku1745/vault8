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

/**
 * Hook to get all vaults owned by a specific owner
 * @param owner - The owner's address
 */
export function useOwnerVaults(owner: Address | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
    abi: VaultFactoryABI,
    functionName: "getVaultsByOwner",
    args: owner ? [owner] : undefined,
    query: {
      enabled: !!owner,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });

  // Debug logging - ALWAYS log
  console.log("🔧 useOwnerVaults Hook:", {
    owner,
    factoryAddress: CONTRACT_ADDRESSES.VAULT_FACTORY,
    functionName: "getVaultsByOwner",
    args: owner ? [owner] : undefined,
    enabled: !!owner,
    data: result.data,
    dataType: typeof result.data,
    isArray: Array.isArray(result.data),
    isLoading: result.isLoading,
    isError: result.isError,
    isSuccess: result.isSuccess,
    error: result.error,
    status: result.status,
  });

  return {
    vaults: result.data as Address[] | undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook to get a vault address owned by a specific owner at a given index
 * @param owner - The owner's address
 * @param index - The index in the owner's vault array (0 for first vault)
 */
export function useOwnerVault(owner: Address | undefined, index: number = 0) {
  const { vaults, isLoading, error, refetch } = useOwnerVaults(owner);
  
  const vaultAddress = vaults && vaults.length > index ? vaults[index] : undefined;

  // Debug logging - ALWAYS log
  console.log("🔧 useOwnerVault Hook (from array):", {
    owner,
    index,
    vaultsArray: vaults,
    vaultsLength: vaults?.length,
    vaultAtIndex: vaultAddress,
    isLoading,
    isError: !!error,
    error: error?.message,
  });

  return {
    vaultAddress,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get the owner of a specific vault
 * @param vaultAddress - The vault's address
 */
export function useVaultOwnerAddress(vaultAddress: Address | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
    abi: VaultFactoryABI,
    functionName: "getVaultOwner",
    args: vaultAddress ? [vaultAddress] : undefined,
    query: {
      enabled: !!vaultAddress,
    },
  });

  return {
    owner: data as Address | undefined,
    isLoading,
    error,
    refetch,
  };
}

