/// <reference path="./react-shims.d.ts" />
import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { projectId, metadata, networks, wagmiAdapter , solanaWeb3JsAdapter} from './config'
import { ThemeProvider } from '@/components/theme-provider'

// Import pages
import HomePage from './pages/Home'
import DashboardPage from './pages/Dashboard'
import MarketplacePage from './pages/Marketplace'
import VaultDetailPage from './pages/VaultDetail'

const queryClient = new QueryClient()

const generalConfig = {
  projectId,
  metadata,
  networks,
  themeMode: 'light' as const,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
}

// Create modal
console.debug('[frontend] App.tsx - createAppKit')
createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter],
  ...generalConfig,
})

export function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vault8-ui-theme">
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/vault/:id" element={<VaultDetailPage />} />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}

export default App
