import { createAppKit } from '@reown/appkit/react'

import { WagmiProvider } from 'wagmi'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActionButtonList } from './components/ActionButtonList'
import { InfoList } from './components/InfoList'
import CrossChainMessaging from './components/cross-chain-messaging'
import BaseReceiverViewer from './components/BaseReceiverViewer'
import BaseToSolanaSender from './components/BaseToSolanaSender'
import SolanaReceiverViewer from './components/SolanaReceiverViewer'
import { projectId, metadata, networks, wagmiAdapter , solanaWeb3JsAdapter} from './config'

import "./App.css"

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
    <div className={"pages"}>
      <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
      <h1>AppKit Wagmi+solana React dApp Example</h1>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
            <appkit-button />
            <ActionButtonList />
            <div className="advice">
              <p>
                This projectId only works on localhost. <br/>
                Go to <a href="https://dashboard.reown.com" target="_blank" className="link-button" rel="Reown Dashboard">Reown Dashboard</a> to get your own.
              </p>
            </div>
            <CrossChainMessaging />
            <BaseReceiverViewer />
            <BaseToSolanaSender />
            <SolanaReceiverViewer />
            <InfoList />
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  )
}

export default App
