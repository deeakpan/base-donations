'use client';

import { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'wagmi/chains';
import { WagmiProvider, createConfig, http } from 'wagmi';

const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || ''),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={baseSepolia}
        config={{
          appearance: {
            name: 'Base Builder Fund',
            logo: '/logo.png',
            mode: 'auto',
            theme: 'default',
          },
          wallet: {
            display: 'modal',
            termsUrl: 'https://base.org/terms',
            privacyUrl: 'https://base.org/privacy',
            supportedWallets: {
              rabby: true,
              trust: true,
              frame: true,
            },
          },
        }}
      >
        {children}
      </OnchainKitProvider>
    </WagmiProvider>
  );
}

