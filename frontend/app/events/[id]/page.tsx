"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useAccount, useConnect, useContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther } from 'viem'
import { type Address } from 'viem'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, MapPin, Users, Clock, Ticket } from "lucide-react"
import { toast } from "sonner"
import { WalletConnectDialog } from "@/components/wallet-connect-dialog"

// This would be imported from a contract config file
const TOKEN_ENTRY_CONTRACT = {
  address: '0x1234567890123456789012345678901234567890' as Address,
  abi: [
    {
      name: 'purchaseTickets',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: 'eventId', type: 'uint256' },
        { name: 'quantity', type: 'uint256' },
      ],
      outputs: [],
    },
  ],
} as const

export default function EventPage() {
  const params = useParams()
  const [quantity, setQuantity] = useState(1)
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false)

  const { address, isConnected } = useAccount()
  const { connect } = useConnect()

  // Contract interaction hooks
  const { write: purchaseTickets, data: purchaseData } = useContractWrite({
    ...TOKEN_ENTRY_CONTRACT,
    functionName: 'purchaseTickets',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: purchaseData?.hash,
  })

  // This would be fetched from the blockchain in a real implementation
  const event = {
    id: params.id,
    title: "Summer Music Festival 2024",
    description: "A three-day music festival featuring top artists from around the world. Experience live performances, food vendors, and interactive art installations in the heart of Central Park.",
    date: "July 15-17, 2024",
    time: "12:00 PM - 11:00 PM",
    location: "Central Park, NY",
    price: "0.1",
    totalTickets: 500,
    remainingTickets: 350,
    organizer: "EventCo Productions",
    category: "music",
    features: [
      "Multiple stages",
      "Food and beverage vendors",
      "VIP areas",
      "Art installations",
      "Meet & greet opportunities"
    ]
  }

  const handlePurchase = async () => {
    if (!isConnected) {
      setIsWalletDialogOpen(true)
      return
    }

    try {
      const totalPrice = parseFloat(event.price) * quantity + 0.01 // Including service fee
      purchaseTickets({
        args: [BigInt(event.id), BigInt(quantity)],
        value: parseEther(totalPrice.toString()),
      })
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error("Failed to purchase tickets")
    }
  }

  // Show success message when transaction is confirmed
  if (isSuccess) {
    toast.success(`Successfully purchased ${quantity} ticket(s)!`)
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
              <p className="text-muted-foreground">{event.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-sm text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-sm text-muted-foreground">
                        {event.remainingTickets} tickets remaining
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Event Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {event.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Purchase Tickets</CardTitle>
                <CardDescription>
                  Secure your spot at {event.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{event.price} ETH</p>
                  <p className="text-sm text-muted-foreground">per ticket</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of Tickets</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{parseFloat(event.price) * quantity} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee</span>
                    <span>0.01 ETH</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{(parseFloat(event.price) * quantity + 0.01).toFixed(3)} ETH</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={isConfirming}
                  onClick={handlePurchase}
                >
                  {isConfirming ? (
                    "Confirming Transaction..."
                  ) : !isConnected ? (
                    "Connect Wallet"
                  ) : (
                    <>
                      <Ticket className="mr-2 h-5 w-5" />
                      Purchase Tickets
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <WalletConnectDialog
        isOpen={isWalletDialogOpen}
        onClose={() => setIsWalletDialogOpen(false)}
        onSuccess={handlePurchase}
      />
    </>
  )
} 