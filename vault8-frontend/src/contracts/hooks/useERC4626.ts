/**
 * React hooks for ERC4626 vault operations (deposit/withdraw)
 */

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import type { Address } from "viem";
import { parseUnits } from "viem";

const ERC4626_ABI = [
  {
    "inputs": [{"name": "assets", "type": "uint256"}, {"name": "receiver", "type": "address"}],
    "name": "deposit",
    "outputs": [{"name": "shares", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "assets", "type": "uint256"}, {"name": "receiver", "type": "address"}, {"name": "owner", "type": "address"}],
    "name": "withdraw",
    "outputs": [{"name": "shares", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "shares", "type": "uint256"}],
    "name": "previewRedeem",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "maxWithdraw",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
] as const;

/**
 * Hook to deposit assets into ERC4626 vault
 */
export function useVaultDeposit(vaultAddress: Address) {
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = (amount: string, receiverAddress: Address, decimals: number = 6) => {
    const amountBigInt = parseUnits(amount, decimals);
    writeContract({
      address: vaultAddress,
      abi: ERC4626_ABI,
      functionName: "deposit",
      args: [amountBigInt, receiverAddress],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook to withdraw assets from ERC4626 vault
 */
export function useVaultWithdraw(vaultAddress: Address) {
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = (
    amount: string,
    receiverAddress: Address,
    ownerAddress: Address,
    decimals: number = 6
  ) => {
    const amountBigInt = parseUnits(amount, decimals);
    writeContract({
      address: vaultAddress,
      abi: ERC4626_ABI,
      functionName: "withdraw",
      args: [amountBigInt, receiverAddress, ownerAddress],
    });
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook to read user's vault share balance
 */
export function useVaultShareBalance(vaultAddress: Address, userAddress: Address | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    shares: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to preview how many assets can be withdrawn with current shares
 */
export function usePreviewRedeem(vaultAddress: Address, shares: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_ABI,
    functionName: "previewRedeem",
    args: shares ? [shares] : undefined,
    query: {
      enabled: !!shares && shares > 0n,
    },
  });

  return {
    assets: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get max withdrawable assets for a user
 */
export function useMaxWithdraw(vaultAddress: Address, userAddress: Address | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_ABI,
    functionName: "maxWithdraw",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    maxWithdrawable: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

