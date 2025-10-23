/**
 * SDK for interacting with VaultFactory contract
 */

import { ethers } from "ethers";
import { VaultFactoryABI } from "./abis";
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from "./config";

export class VaultFactorySDK {
  private contract: ethers.Contract;
  private provider: ethers.providers.Provider;

  constructor(provider: ethers.providers.Provider) {
    this.provider = provider;
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.VAULT_FACTORY,
      VaultFactoryABI,
      provider
    );
  }

  /**
   * Legacy SDK kept for non-React batch operations only
   * For React components, use hooks from @/contracts/hooks
   */

}

/**
 * Create a VaultFactory SDK instance
 */
export function createVaultFactorySDK(
  provider?: ethers.providers.Provider
): VaultFactorySDK {
  const defaultProvider = provider || new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
  return new VaultFactorySDK(defaultProvider);
}

