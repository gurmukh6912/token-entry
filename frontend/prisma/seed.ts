import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tokenentry.com' },
    update: {},
    create: {
      email: 'admin@tokenentry.com',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  // Create organizer user
  const organizerPassword = await hash('organizer123', 12)
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@tokenentry.com' },
    update: {},
    create: {
      email: 'organizer@tokenentry.com',
      name: 'Event Organizer',
      password: organizerPassword,
      role: UserRole.ORGANIZER,
    },
  })

  // Create regular user
  const userPassword = await hash('user123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@tokenentry.com' },
    update: {},
    create: {
      email: 'user@tokenentry.com',
      name: 'Regular User',
      password: userPassword,
      role: UserRole.USER,
    },
  })

  // Create sample events
  const events = [
    {
      title: 'Summer Music Festival 2024',
      description: 'A three-day music festival featuring top artists from around the world',
      date: new Date('2024-07-15'),
      location: 'Central Park, NY',
      price: 0.1,
      totalTickets: 500,
      category: 'music',
      organizerId: organizer.id,
    },
    {
      title: 'Tech Conference 2024',
      description: 'The biggest blockchain and web3 conference of the year',
      date: new Date('2024-08-20'),
      location: 'San Francisco, CA',
      price: 0.05,
      totalTickets: 200,
      category: 'tech',
      organizerId: organizer.id,
    },
    {
      title: 'Art Gallery Opening',
      description: 'Exclusive NFT art gallery opening featuring renowned digital artists',
      date: new Date('2024-09-05'),
      location: 'Miami, FL',
      price: 0.08,
      totalTickets: 100,
      category: 'art',
      organizerId: organizer.id,
    },
  ]

  for (const eventData of events) {
    await prisma.event.upsert({
      where: {
        id: eventData.title.toLowerCase().replace(/\s+/g, '-'),
      },
      update: {},
      create: eventData,
    })
  }

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 