/**
 * React hooks for deploying vaults and strategies using Wagmi
 */

import { useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from "wagmi";
import { VaultFactoryABI, ManagedVaultABI } from "../abis";
import { StrategyAdapterCompoundIIIABI, StrategyAdapterSolanaABI } from "../abis-strategies";
import { CONTRACT_ADDRESSES } from "../config";
import type { Address } from "viem";

/**
 * Hook to approve a strategy in VaultFactory
 */
export function useApproveStrategy() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const approveStrategy = (strategyAddress: Address) => {
    writeContract({
      address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
      abi: VaultFactoryABI,
      functionName: "approveStrategy",
      args: [strategyAddress],
    });
  };

  return {
    approveStrategy,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}

/**
 * Hook to deploy a new vault via VaultFactory
 */
export function useDeployVault() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({ hash });

  const deployVault = (params: {
    asset: Address;
    name: string;
    symbol: string;
    vaultOwner: Address;
    selectedStrategies: Address[];
  }) => {
    writeContract({
      address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
      abi: VaultFactoryABI,
      functionName: "deployVault",
      args: [params.asset, params.name, params.symbol, params.vaultOwner, params.selectedStrategies],
    });
  };

  return {
    deployVault,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}

/**
 * Hook to set vault address on a strategy adapter (binds and seals)
 */
export function useSetVault(strategyAddress: Address, strategyType: "compound" | "solana") {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const abi = strategyType === "compound" ? StrategyAdapterCompoundIIIABI : StrategyAdapterSolanaABI;

  const setVault = (vaultAddress: Address) => {
    writeContract({
      address: strategyAddress,
      abi,
      functionName: "setVault",
      args: [vaultAddress],
    });
  };

  return {
    setVault,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}

/**
 * Hook to deploy a contract using raw transaction
 * Used for deploying strategy adapters
 */
export function useDeployContract() {
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({ hash });

  const deployContract = (bytecode: `0x${string}`) => {
    sendTransaction({
      to: null, // Contract creation
      data: bytecode,
    });
  };

  return {
    deployContract,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}

/**
 * Hook to set liquidity buffer on ManagedVault
 * Note: This is different from useAdjustBuffer as it's used during initial setup
 */
export function useSetLiquidityBuffer(vaultAddress: Address) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const setLiquidityBuffer = (bufferPercent: number) => {
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
    setLiquidityBuffer,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    error,
  };
}

