import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavigationMenu } from "@/components/navigation-menu";
import { Providers } from "./providers";
import { Web3ProviderWrapper } from "@/components/providers/web3-provider-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TokenEntry - NFT Event Ticketing",
  description: "Secure and transparent event ticketing using blockchain technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Web3ProviderWrapper>
          <Providers>
            <NavigationMenu />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </Providers>
        </Web3ProviderWrapper>
      </body>
    </html>
  );
}
