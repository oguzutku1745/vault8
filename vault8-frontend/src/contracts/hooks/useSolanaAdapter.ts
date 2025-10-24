/**
 * React hooks for reading from StrategyAdapterSolana contracts
 */

import { useReadContract } from "wagmi";
import { StrategyAdapterSolanaABI } from "../abis-strategies";
import type { Address } from "viem";

/**
 * Hook to read pending bridge data from Solana adapter
 * Returns the amount (after CCTP fees), nonce, and key
 */
export function usePendingBridge(
  solanaAdapterAddress: Address | undefined,
  enabled: boolean = true
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: solanaAdapterAddress,
    abi: StrategyAdapterSolanaABI,
    functionName: "pendingBridge",
    query: {
      enabled: enabled && !!solanaAdapterAddress,
      // Poll every 2 seconds when monitoring for bot completion
      refetchInterval: enabled ? 2000 : false,
    },
  });

  return {
    pendingBridge: data
      ? {
          amount: data[0] as bigint,
          nonce: data[1] as bigint,
          key: data[2] as string,
        }
      : null,
    isLoading,
    error,
    refetch,
  };
}

