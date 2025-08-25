// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs for hashing passwords

const prisma = new PrismaClient();

async function main() {
  // --- Clear existing data (optional, but good for clean seeding) ---
  // Uncomment these lines ONLY if you want to wipe specific tables completely
  // before running the seed data again.
  // await prisma.flatAmenity.deleteMany();
  // await prisma.amenity.deleteMany();
  // await prisma.image.deleteMany();
  // await prisma.review.deleteMany();
  // await prisma.payment.deleteMany();
  // await prisma.extension.deleteMany();
  // await prisma.booking.deleteMany();
  // await prisma.advertisement.deleteMany();
  // await prisma.flat.deleteMany();
  // await prisma.user.deleteMany();

  console.log('Starting database seeding...');

  // --- 1. Create/Upsert Users ---
  // Passwords will be hashed just like during registration
  const hashedPasswordTenant = await bcrypt.hash('tenant123', 10);
  const hashedPasswordOwner = await bcrypt.hash('owner123', 10);

  const janeTenant = await prisma.user.upsert({
    where: { email: 'jane.tenant@test.com' },
    update: {
      passwordHash: hashedPasswordTenant,
      firstName: 'Jane',
      lastName: 'Tenant',
      userType: 'tenant',
      phone: '01711223344',
      nid: '12345678901234567',
      verified: true,
    },
    create: {
      email: 'jane.tenant@test.com',
      passwordHash: hashedPasswordTenant,
      firstName: 'Jane',
      lastName: 'Tenant',
      userType: 'tenant',
      phone: '01711223344',
      nid: '12345678901234567',
      verified: true,
    },
  });
  console.log(`Created/Upserted user: ${janeTenant.email}`);


  const bobOwner = await prisma.user.upsert({
    where: { email: 'bob.owner@test.com' },
    update: {
      passwordHash: hashedPasswordOwner,
      firstName: 'Bob',
      lastName: 'Owner',
      userType: 'owner',
      phone: '01855667788',
      nid: '98765432109876543',
      verified: true,
    },
    create: {
      email: 'bob.owner@test.com',
      passwordHash: hashedPasswordOwner,
      firstName: 'Bob',
      lastName: 'Owner',
      userType: 'owner',
      phone: '01855667788',
      nid: '98765432109876543',
      verified: true,
    },
  });
  console.log(`Created/Upserted user: ${bobOwner.email}`);

  // --- 2. Create/Upsert Amenities ---
  const amenitiesData = [
    { name: 'WiFi', description: 'High-speed internet access' },
    { name: 'AC', description: 'Air conditioning in all rooms' },
    { name: 'Parking', description: 'Dedicated parking space' },
    { name: 'Security', description: '24/7 security surveillance' },
    { name: 'Elevator', description: 'Working elevator access' },
    { name: 'Gym', description: 'On-site fitness center' },
    { name: 'Balcony', description: 'Private balcony attached to the flat' },
  ];

  const createdAmenities: { id: number; name: string }[] = [];
  for (const amenityData of amenitiesData) {
    const amenity = await prisma.amenity.upsert({
      where: { name: amenityData.name },
      update: {},
      create: amenityData,
    });
    createdAmenities.push(amenity);
  }
  console.log(`Created/Upserted ${createdAmenities.length} amenities.`);

  // --- 3. Create Flats for Bob Owner ---
  // This section can be added later or as needed
  // For now, this seed script will just ensure amenities and users are in the DB
  console.log('Database seeding completed.');
}

// Execute the main function and handle errors
main()
  .catch((e) => {
    console.error('Prisma seeding error:', e);
    return;
    //process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });