/**
 * Custom hook to fetch all necessary data for a single vault
 * Used in Marketplace to display vault information
 */

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import type { Address } from "viem";
import { useTotalAssets, useAllowedStrategies, useStrategyBalance, useVaultName } from "./useVaultRead";
import { TARGET_PROTOCOLS } from "../config";

const compoundAdapterABI = [
  {
    "inputs": [],
    "name": "comet",
    "outputs": [{"internalType": "contract IComet", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const solanaAdapterABI = [
  {
    "inputs": [],
    "name": "myOApp",
    "outputs": [{"internalType": "contract IMyOAppBridge", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface VaultData {
  address: Address;
  name: string;
  totalAssets: bigint;
  totalAssetsFormatted: string;
  chains: ("base" | "solana")[];
  strategies: {
    name: string;
    allocation: number;
    balance: bigint;
  }[];
  isLoading: boolean;
}

/**
 * Hook to fetch complete vault data for Marketplace display
 */
export function useVaultData(vaultAddress: Address | undefined): VaultData | null {
  // Fetch basic vault info
  const { name, isLoading: isLoadingName } = useVaultName(
    vaultAddress || "0x0000000000000000000000000000000000000000" as Address
  );
  
  const { totalAssets, isLoading: isLoadingAssets } = useTotalAssets(
    vaultAddress || "0x0000000000000000000000000000000000000000" as Address
  );
  
  const { allowedStrategies, isLoading: isLoadingStrategies } = useAllowedStrategies(
    vaultAddress || "0x0000000000000000000000000000000000000000" as Address
  );
  
  // Get strategy addresses
  const strategy0Address = allowedStrategies?.[0];
  const strategy1Address = allowedStrategies?.[1];
  
  // Identify strategy types
  const { data: myOAppTest0 } = useReadContract({
    address: strategy0Address,
    abi: solanaAdapterABI,
    functionName: "myOApp",
    query: { enabled: !!strategy0Address },
  });
  
  const { data: cometTest0 } = useReadContract({
    address: strategy0Address,
    abi: compoundAdapterABI,
    functionName: "comet",
    query: { enabled: !!strategy0Address },
  });
  
  const { data: myOAppTest1 } = useReadContract({
    address: strategy1Address,
    abi: solanaAdapterABI,
    functionName: "myOApp",
    query: { enabled: !!strategy1Address },
  });
  
  const { data: cometTest1 } = useReadContract({
    address: strategy1Address,
    abi: compoundAdapterABI,
    functionName: "comet",
    query: { enabled: !!strategy1Address },
  });
  
  // Determine strategy types
  const strategy0IsCompound = cometTest0 && cometTest0.toLowerCase() === TARGET_PROTOCOLS.COMPOUND_V3_COMET.toLowerCase();
  const strategy0IsSolana = myOAppTest0 && myOAppTest0.toLowerCase() === TARGET_PROTOCOLS.MYOAPP_BRIDGE.toLowerCase();
  const strategy1IsCompound = cometTest1 && cometTest1.toLowerCase() === TARGET_PROTOCOLS.COMPOUND_V3_COMET.toLowerCase();
  const strategy1IsSolana = myOAppTest1 && myOAppTest1.toLowerCase() === TARGET_PROTOCOLS.MYOAPP_BRIDGE.toLowerCase();
  
  const compoundStrategyAddress = strategy0IsCompound ? strategy0Address : strategy1IsCompound ? strategy1Address : undefined;
  const solanaStrategyAddress = strategy0IsSolana ? strategy0Address : strategy1IsSolana ? strategy1Address : undefined;
  
  // Fetch strategy balances
  const { balance: compoundBalance, isLoading: isLoadingCompound } = useStrategyBalance(
    vaultAddress || "0x0000000000000000000000000000000000000000" as Address,
    compoundStrategyAddress as Address || "0x0000000000000000000000000000000000000000" as Address,
    !!compoundStrategyAddress
  );
  
  const { balance: solanaBalance, isLoading: isLoadingSolana } = useStrategyBalance(
    vaultAddress || "0x0000000000000000000000000000000000000000" as Address,
    solanaStrategyAddress as Address || "0x0000000000000000000000000000000000000000" as Address,
    !!solanaStrategyAddress
  );
  
  // Calculate formatted data
  const vaultData = useMemo(() => {
    if (!vaultAddress || !name) return null;
    
    const isLoading = isLoadingName || isLoadingAssets || isLoadingStrategies || isLoadingCompound || isLoadingSolana;
    
    // Format total assets
    const totalAssetsFormatted = totalAssets 
      ? `$${Number(formatUnits(totalAssets, 6)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "$0.00";
    
    // Determine chains
    const chains: ("base" | "solana")[] = allowedStrategies && allowedStrategies.length === 2 
      ? ["base", "solana"] 
      : ["base"];
    
    // Calculate strategy allocations
    const strategies = [];
    const totalAssetsNum = totalAssets ? Number(formatUnits(totalAssets, 6)) : 0;
    
    if (compoundStrategyAddress && compoundBalance && totalAssetsNum > 0) {
      const balanceNum = Number(formatUnits(compoundBalance, 6));
      const allocation = (balanceNum / totalAssetsNum) * 100;
      strategies.push({
        name: "Compound V3",
        allocation: Number(allocation.toFixed(2)),
        balance: compoundBalance,
      });
    }
    
    if (solanaStrategyAddress && solanaBalance && totalAssetsNum > 0) {
      const balanceNum = Number(formatUnits(solanaBalance, 6));
      const allocation = (balanceNum / totalAssetsNum) * 100;
      strategies.push({
        name: "Jupiter",
        allocation: Number(allocation.toFixed(2)),
        balance: solanaBalance,
      });
    }
    
    return {
      address: vaultAddress,
      name,
      totalAssets: totalAssets || 0n,
      totalAssetsFormatted,
      chains,
      strategies,
      isLoading,
    };
  }, [
    vaultAddress,
    name,
    totalAssets,
    allowedStrategies,
    compoundStrategyAddress,
    solanaStrategyAddress,
    compoundBalance,
    solanaBalance,
    isLoadingName,
    isLoadingAssets,
    isLoadingStrategies,
    isLoadingCompound,
    isLoadingSolana,
  ]);
  
  return vaultData;
}

