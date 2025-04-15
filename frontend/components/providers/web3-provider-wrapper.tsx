"use client"

import { Web3Provider } from "@/components/web3-provider"

export function Web3ProviderWrapper({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>
} 