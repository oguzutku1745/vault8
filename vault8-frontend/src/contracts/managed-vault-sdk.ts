/**
 * SDK for interacting with ManagedVault contract
 */

import { ethers } from "ethers";
import { ManagedVaultABI, IERC20ABI } from "./abis";
import { getStrategyMetadata } from "./config";

export interface VaultInfo {
  address: string;
  name: string;
  symbol: string;
  asset: string;
  owner: string;
  totalAssets: string; // in base units
  liquidityBuffer: number;
  lastSyncTimestamp: number;
  allowedStrategies: string[];
}

export interface StrategyBalance {
  strategy: string;
  balance: string; // in base units
  metadata: ReturnType<typeof getStrategyMetadata>;
}

export interface VaultMetrics {
  totalAssets: string; // in base units
  cash: string; // in base units (liquid/unallocated)
  strategyBalances: StrategyBalance[];
  liquidityBuffer: number;
  lastSyncTimestamp: number;
}

export class ManagedVaultSDK {
  private contract: ethers.Contract;
  private provider: ethers.providers.Provider;
  public readonly address: string;

  constructor(vaultAddress: string, provider: ethers.providers.Provider) {
    this.address = vaultAddress;
    this.provider = provider;
    this.contract = new ethers.Contract(vaultAddress, ManagedVaultABI, provider);
  }

  /**
   * Get basic vault information
   */
  async getVaultInfo(): Promise<VaultInfo> {
    try {
      const [name, symbol, asset, owner, totalAssets, liquidityBuffer, lastSyncTimestamp, allowedStrategies] =
        await Promise.all([
          this.contract.name(),
          this.contract.symbol(),
          this.contract.asset(),
          this.contract.owner(),
          this.contract.totalAssets(),
          this.contract.liquidityBuffer(),
          this.contract.lastSyncTimestamp(),
          this.contract.allowedStrategies(),
        ]);

      return {
        address: this.address,
        name,
        symbol,
        asset,
        owner,
        totalAssets: totalAssets.toString(),
        liquidityBuffer,
        lastSyncTimestamp: lastSyncTimestamp.toNumber(),
        allowedStrategies,
      };
    } catch (error) {
      console.error("Failed to fetch vault info:", error);
      throw error;
    }
  }



}

/**
 * Create a ManagedVault SDK instance
 */
export function createManagedVaultSDK(
  vaultAddress: string,
  provider: ethers.providers.Provider
): ManagedVaultSDK {
  return new ManagedVaultSDK(vaultAddress, provider);
}

/**
 * Format balance from base units to human-readable format
 */
export function formatBalance(balance: string, decimals: number = 6): string {
  return ethers.utils.formatUnits(balance, decimals);
}

/**
 * Parse human-readable amount to base units
 */
export function parseAmount(amount: string, decimals: number = 6): string {
  return ethers.utils.parseUnits(amount, decimals).toString();
}

