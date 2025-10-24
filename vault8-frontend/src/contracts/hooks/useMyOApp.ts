/**
 * React hooks for interacting with MyOApp contract (LayerZero bridge)
 */

import { useReadContract } from "wagmi";
import { TARGET_PROTOCOLS } from "../config";
import type { Address } from "viem";

// MyOApp ABI - only the functions we need
const MyOAppABI = [
  {
    "inputs": [
      { "internalType": "uint32", "name": "_dstEid", "type": "uint32" },
      { "internalType": "bytes", "name": "_options", "type": "bytes" },
      { "internalType": "bool", "name": "_payInLzToken", "type": "bool" }
    ],
    "name": "quoteDeposit",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "nativeFee", "type": "uint256" },
          { "internalType": "uint256", "name": "lzTokenFee", "type": "uint256" }
        ],
        "internalType": "struct MessagingFee",
        "name": "fee",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

/**
 * Hook to quote LayerZero fee for depositing to Solana
 * This must be called after a CCTP deposit has been initiated
 * 
 * @param userAddress - The address that initiated the deposit (msg.sender)
 * @param enabled - Whether to enable the query (default: true)
 * @returns The quoted fee in native token (ETH on Base)
 */
export function useQuoteLayerZeroFee(userAddress?: Address, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: TARGET_PROTOCOLS.MYOAPP_BRIDGE as Address,
    abi: MyOAppABI,
    functionName: "quoteDeposit",
    args: [
      TARGET_PROTOCOLS.SOLANA_DST_EID,
      TARGET_PROTOCOLS.DEFAULT_LZ_OPTIONS as `0x${string}`,
      false, // _payInLzToken
    ],
    // Override msg.sender for the view call
    account: userAddress,
    query: {
      enabled: enabled && !!userAddress,
    },
  });

  // Debug logging
  console.log("🔍 useQuoteLayerZeroFee Debug:", {
    userAddress,
    enabled,
    isLoading,
    hasData: !!data,
    data,
    error: error?.message || error,
    myOAppAddress: TARGET_PROTOCOLS.MYOAPP_BRIDGE,
  });

  return {
    fee: data?.nativeFee as bigint | undefined, // nativeFee from MessagingFee struct
    lzTokenFee: data?.lzTokenFee as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

