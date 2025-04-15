import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  // This would be fetched from the blockchain in a real implementation
  const featuredEvents = [
    {
      id: 1,
      title: "Summer Music Festival 2024",
      description: "A three-day music festival featuring top artists from around the world",
      date: "July 15-17, 2024",
      location: "Central Park, NY",
      price: "0.1 ETH",
    },
    {
      id: 2,
      title: "Tech Conference 2024",
      description: "The biggest blockchain and web3 conference of the year",
      date: "August 20, 2024",
      location: "San Francisco, CA",
      price: "0.05 ETH",
    },
    {
      id: 3,
      title: "Art Gallery Opening",
      description: "Exclusive NFT art gallery opening featuring renowned digital artists",
      date: "September 5, 2024",
      location: "Miami, FL",
      price: "0.08 ETH",
    },
  ]

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to TokenEntry</h1>
        <p className="text-xl text-muted-foreground">
          Secure and transparent event ticketing using blockchain technology
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/events">
            <Button size="lg">Browse Events</Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" size="lg">Visit Marketplace</Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Featured Events</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredEvents.map((event) => (
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
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/events/${event.id}`} className="w-full">
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
