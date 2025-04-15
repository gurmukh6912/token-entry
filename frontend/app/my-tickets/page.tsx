"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRCodeCanvas as QRCode } from "qrcode.react"

interface Ticket {
  id: string
  eventId: string
  eventTitle: string
  ticketNumber: string
  date: string
  location: string
  price: string
}

interface TicketCardProps {
  ticket: Ticket
  showQR: boolean
}

export default function MyTicketsPage() {
  // Mock data - would be fetched from blockchain
  const tickets: { active: Ticket[], past: Ticket[] } = {
    active: [
      {
        id: "1",
        eventId: "1",
        eventTitle: "Summer Music Festival 2024",
        ticketNumber: "A123",
        date: "July 15-17, 2024",
        location: "Central Park, NY",
        price: "0.1 ETH",
      },
      {
        id: "2",
        eventId: "2",
        eventTitle: "Tech Conference 2024",
        ticketNumber: "B456",
        date: "August 20, 2024",
        location: "San Francisco, CA",
        price: "0.05 ETH",
      },
    ],
    past: [
      {
        id: "3",
        eventId: "3",
        eventTitle: "Winter Concert 2023",
        ticketNumber: "C789",
        date: "December 15, 2023",
        location: "Madison Square Garden, NY",
        price: "0.08 ETH",
      },
    ],
  }

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)

  const TicketCard = ({ ticket, showQR = false }: TicketCardProps) => (
    <Card key={ticket.id} className="relative">
      <CardHeader>
        <CardTitle>{ticket.eventTitle}</CardTitle>
        <CardDescription>Ticket #{ticket.ticketNumber}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Date:</strong> {ticket.date}</p>
          <p><strong>Location:</strong> {ticket.location}</p>
          <p><strong>Price paid:</strong> {ticket.price}</p>
        </div>
        {showQR && (
          <div className="mt-4 flex justify-center">
            <QRCode
              value={JSON.stringify({
                ticketId: ticket.id,
                eventId: ticket.eventId,
                ticketNumber: ticket.ticketNumber,
              })}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {!showQR ? (
          <Button onClick={() => setSelectedTicket(ticket.id)}>Show QR Code</Button>
        ) : (
          <Button variant="outline" onClick={() => setSelectedTicket(null)}>Hide QR Code</Button>
        )}
      </CardFooter>
    </Card>
  )

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My Tickets</h1>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Tickets</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {tickets.active.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              You don't have any active tickets.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {tickets.active.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  showQR={selectedTicket === ticket.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {tickets.past.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              You don't have any past tickets.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {tickets.past.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  showQR={selectedTicket === ticket.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 