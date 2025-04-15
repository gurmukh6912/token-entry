"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("all")

  // This would be fetched from the blockchain in a real implementation
  const events = [
    {
      id: 1,
      title: "Summer Music Festival 2024",
      description: "A three-day music festival featuring top artists from around the world",
      date: "July 15-17, 2024",
      location: "Central Park, NY",
      price: "0.1 ETH",
      category: "music",
    },
    {
      id: 2,
      title: "Tech Conference 2024",
      description: "The biggest blockchain and web3 conference of the year",
      date: "August 20, 2024",
      location: "San Francisco, CA",
      price: "0.05 ETH",
      category: "tech",
    },
    {
      id: 3,
      title: "Art Gallery Opening",
      description: "Exclusive NFT art gallery opening featuring renowned digital artists",
      date: "September 5, 2024",
      location: "Miami, FL",
      price: "0.08 ETH",
      category: "art",
    },
    // Add more events as needed
  ]

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = category === "all" || event.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold">Events</h1>
        <div className="flex gap-4 w-full sm:w-auto">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="tech">Tech</SelectItem>
              <SelectItem value="art">Art</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              <CardDescription>{event.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Date:</strong> {event.date}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Price:</strong> {event.price}</p>
                <p><strong>Category:</strong> {event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/events/${event.id}`} className="w-full">
                <Button className="w-full">Buy Tickets</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No events found matching your criteria.</p>
        </div>
      )}
    </div>
  )
} 