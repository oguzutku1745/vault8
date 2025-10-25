import { Link, useLocation } from "react-router-dom"
import { useAppKitAccount } from "@reown/appkit/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useOwnerVault } from "@/contracts/hooks/useFactoryRead"
import { ADMIN_ADDRESS, CONTRACT_ADDRESSES } from "@/contracts/config"
import type { Address } from "viem"

export function Header() {
  const location = useLocation()
  const { address, isConnected } = useAppKitAccount()
  
  const isActive = (path: string) => location.pathname === path
  
  // Check if user owns any vaults (we only check for first vault at index 0)
  const { vaultAddress: userVault, isLoading: isLoadingVault, error: vaultError, refetch } = useOwnerVault(address as Address | undefined, 0)
  
  // Debug logging
  console.log("🔍 Header - Ownership Check:", {
    connectedAddress: address,
    isConnected,
    userVault,
    isLoadingVault,
    vaultError: vaultError?.message,
    factoryAddress: CONTRACT_ADDRESSES.VAULT_FACTORY,
  })
  
  // User can see dashboard if they own a vault OR they are the admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
  const hasVault = userVault && userVault !== "0x0000000000000000000000000000000000000000"
  const canAccessDashboard = isAdmin || hasVault
  
  console.log("🎯 Header - Access Control:", {
    isAdmin,
    hasVault,
    canAccessDashboard,
  })

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/path60.png" alt="Vault8 Logo" className="h-8 w-8 rounded-lg" />
            
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {isConnected && canAccessDashboard && (
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dashboard
              </Link>
            )}
            <Link
              to="/marketplace"
              className={`text-sm font-medium transition-colors ${
                isActive('/marketplace') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Markets
            </Link>
            <a
              href="https://github.com/oguzutku1745/vault8"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <appkit-button />
        </div>
      </div>
    </header>
  )
}
