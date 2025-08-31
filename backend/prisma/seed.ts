// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- Clear existing data for Bob Owner to make the seed script re-runnable ---
  const bobOwnerExisting = await prisma.user.findUnique({ where: { email: 'bob.owner@test.com' } });
  if (bobOwnerExisting) {
    console.log('Clearing old flat data for Bob Owner to prevent duplicates...');
    const existingFlats = await prisma.flat.findMany({
      where: { ownerId: bobOwnerExisting.id },
      select: { id: true },
    });
    const flatIds = existingFlats.map(f => f.id);

    if (flatIds.length > 0) {
      // Delete records from related tables first to avoid foreign key constraint errors
      await prisma.image.deleteMany({ where: { flatId: { in: flatIds } } });
      await prisma.flatAmenity.deleteMany({ where: { flatId: { in: flatIds } } });
      
      // Now delete the flats themselves
      await prisma.flat.deleteMany({ where: { id: { in: flatIds } } });
    }
  }

  console.log('Starting database seeding...');

  // --- 1. Create/Upsert Users ---
  const hashedPasswordTenant = await bcrypt.hash('tenant123', 10);
  const hashedPasswordOwner = await bcrypt.hash('owner123', 10);

  const janeTenant = await prisma.user.upsert({
    where: { email: 'jane.tenant@test.com' },
    update: {},
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
    update: {},
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
  console.log(`Creating flats with images for ${bobOwner.email}...`);

  const wifi = createdAmenities.find(a => a.name === 'WiFi');
  const ac = createdAmenities.find(a => a.name === 'AC');
  const parking = createdAmenities.find(a => a.name === 'Parking');
  const security = createdAmenities.find(a => a.name === 'Security');
  const elevator = createdAmenities.find(a => a.name === 'Elevator');
  const balcony = createdAmenities.find(a => a.name === 'Balcony');

  // **MODIFIED**: Added image URLs to the flat data
  const flatsData = [
    {
      address: '123 Gulshan Avenue, Gulshan 2',
      district: 'Dhaka',
      monthlyRentalCost: 50000,
      bedrooms: 3,
      bathrooms: 3,
      description: 'A spacious and modern 3-bedroom apartment in the heart of Gulshan. Comes with a beautiful city view and high-end fittings.',
      amenities: [wifi, ac, parking, elevator, security].filter(Boolean) as { id: number }[],
      imageUrl: '/uploads/flat-img1.jpg',
    },
    {
      address: '456 Agrabad C/A',
      district: 'Chittagong',
      monthlyRentalCost: 25000,
      bedrooms: 2,
      bathrooms: 2,
      description: 'Cozy 2-bedroom flat perfect for a small family. Located in a prime commercial area with easy access to markets and schools.',
      amenities: [ac, security, balcony].filter(Boolean) as { id: number }[],
      imageUrl: '/uploads/flat-img2.jpg',
    },
    {
      address: '789 Zindabazar Point',
      district: 'Sylhet',
      monthlyRentalCost: 15000,
      bedrooms: 2,
      bathrooms: 1,
      description: 'Affordable and well-maintained flat in a bustling neighborhood. Ideal for students or young professionals.',
      amenities: [wifi, balcony].filter(Boolean) as { id: number }[],
      imageUrl: '/uploads/flat-img3.jpg',
    },
    {
      address: '101 Mirpur DOHS, Road 5',
      district: 'Dhaka',
      monthlyRentalCost: 35000,
      bedrooms: 3,
      bathrooms: 2,
      description: 'Secure and peaceful 3-bedroom apartment located in the Mirpur DOHS area. Features 24/7 security and a dedicated parking space.',
      amenities: [parking, security, elevator].filter(Boolean) as { id: number }[],
      imageUrl: '/uploads/flat-img4.jpg',
    },
  ];

  for (const flatData of flatsData) {
    await prisma.flat.create({
      data: {
        ownerId: bobOwner.id,
        address: flatData.address,
        district: flatData.district,
        monthlyRentalCost: flatData.monthlyRentalCost,
        bedrooms: flatData.bedrooms,
        bathrooms: flatData.bathrooms,
        description: flatData.description,
        status: 'available',
        amenities: {
          create: flatData.amenities.map(amenity => ({
            amenityId: amenity.id,
          })),
        },
        // **MODIFIED**: Create a related image record for each flat
        images: {
          create: {
            url: flatData.imageUrl,
            isThumbnail: true, // Set this image as the main thumbnail
          },
        },
      },
    });
  }
  console.log(`Created ${flatsData.length} new flats for Bob Owner.`);

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error('Prisma seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });