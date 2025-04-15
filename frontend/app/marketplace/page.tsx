"use client"

import { useState } from "react"
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther } from 'viem'
import { type Address } from 'viem'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, MapPin, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"
import { WalletConnectDialog } from "@/components/wallet-connect-dialog"

// This would be imported from a contract config file
const TOKEN_ENTRY_MARKETPLACE_CONTRACT = {
  address: '0x1234567890123456789012345678901234567890' as Address,
  abi: [
    {
      name: 'purchaseResaleTicket',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: 'listingId', type: 'uint256' },
      ],
      outputs: [],
    },
  ],
} as const

export default function MarketplacePage() {
  const [sortBy, setSortBy] = useState("date")
  const [priceRange, setPriceRange] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<number | null>(null)

  const { isConnected } = useAccount()

  // Contract interaction hooks
  const { write: purchaseResaleTicket, data: purchaseData } = useContractWrite({
    ...TOKEN_ENTRY_MARKETPLACE_CONTRACT,
    functionName: 'purchaseResaleTicket',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: purchaseData?.hash,
  })

  // This would be fetched from the blockchain in a real implementation
  const listings = [
    {
      id: 1,
      eventTitle: "Summer Music Festival 2024",
      date: "July 15-17, 2024",
      location: "Central Park, NY",
      price: "0.12",
      originalPrice: "0.1",
      seller: "0x1234...5678",
      quantity: 2,
    },
    {
      id: 2,
      eventTitle: "Tech Conference 2024",
      date: "August 20, 2024",
      location: "San Francisco, CA",
      price: "0.06",
      originalPrice: "0.05",
      seller: "0x8765...4321",
      quantity: 1,
    },
    {
      id: 3,
      eventTitle: "Art Gallery Opening",
      date: "September 5, 2024",
      location: "Miami, FL",
      price: "0.09",
      originalPrice: "0.08",
      seller: "0x5432...1098",
      quantity: 3,
    },
  ]

  const handlePurchase = async (listingId: number) => {
    if (!isConnected) {
      setSelectedListing(listingId)
      setIsWalletDialogOpen(true)
      return
    }

    try {
      const listing = listings.find(l => l.id === listingId)
      if (!listing) throw new Error("Listing not found")

      purchaseResaleTicket({
        args: [BigInt(listingId)],
        value: parseEther(listing.price),
      })
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error("Failed to purchase ticket")
    }
  }

  // Show success message when transaction is confirmed
  if (isSuccess) {
    toast.success("Successfully purchased ticket!")
  }

  const filteredListings = listings.filter((listing) =>
    listing.eventTitle.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === "price-asc") {
      return parseFloat(a.price) - parseFloat(b.price)
    }
    if (sortBy === "price-desc") {
      return parseFloat(b.price) - parseFloat(a.price)
    }
    // Default to date sorting
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  }).filter((listing) => {
    const price = parseFloat(listing.price)
    switch (priceRange) {
      case "under-01":
        return price < 0.1
      case "01-05":
        return price >= 0.1 && price <= 0.5
      case "over-05":
        return price > 0.5
      default:
        return true
    }
  })

  return (
    <>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ticket Marketplace</h1>
            <p className="text-muted-foreground">Find and purchase resale tickets</p>
          </div>
          <Button variant="outline">List My Ticket</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Price range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under-01">Under 0.1 ETH</SelectItem>
              <SelectItem value="01-05">0.1 - 0.5 ETH</SelectItem>
              <SelectItem value="over-05">Over 0.5 ETH</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader>
                <CardTitle>{listing.eventTitle}</CardTitle>
                <CardDescription>Listed by {listing.seller}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{listing.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{listing.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">Original Price: {listing.originalPrice} ETH</p>
                    <p className="font-medium">Resale Price: {listing.price} ETH</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {listing.quantity} {listing.quantity === 1 ? "ticket" : "tickets"} available
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  disabled={isConfirming && selectedListing === listing.id}
                  onClick={() => handlePurchase(listing.id)}
                >
                  {isConfirming && selectedListing === listing.id ? (
                    "Confirming Transaction..."
                  ) : !isConnected ? (
                    "Connect Wallet to Purchase"
                  ) : (
                    "Purchase Ticket"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tickets found matching your criteria.</p>
          </div>
        )}
      </div>

      <WalletConnectDialog
        isOpen={isWalletDialogOpen}
        onClose={() => {
          setIsWalletDialogOpen(false)
          setSelectedListing(null)
        }}
        onSuccess={() => {
          if (selectedListing) {
            handlePurchase(selectedListing)
          }
        }}
      />
    </>
  )
} 