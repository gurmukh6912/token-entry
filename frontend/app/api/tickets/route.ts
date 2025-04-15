import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        event: true,
      },
      orderBy: {
        purchasedAt: 'desc',
      },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { eventId } = await request.json()

    // Check if event exists and has available tickets
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    if (event.soldTickets >= event.totalTickets) {
      return NextResponse.json(
        { error: "Event is sold out" },
        { status: 400 }
      )
    }

    // Create ticket and update event in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          eventId,
          userId: session.user.id,
          ticketNumber: `${event.id}-${event.soldTickets + 1}`,
        },
      })

      await tx.event.update({
        where: { id: eventId },
        data: {
          soldTickets: {
            increment: 1,
          },
        },
      })

      return ticket
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to purchase ticket" },
      { status: 500 }
    )
  }
} 