// backend/src/services/flatService.ts
import prisma from '../db';
import { Prisma } from '@prisma/client';
import AppError from '../utils/appError';

export const createFlat = async (data: any, ownerId: number, files: Express.Multer.File[]) => {
  const {
    flatNumber, floor, houseName, houseNumber, address, district, latitude, longitude,
    monthlyRentalCost, utilityCost, bedrooms, bathrooms, minimumStay, description, status,
    amenities: amenitiesStr
  } = data;

  let amenities;
  try {
    amenities = amenitiesStr ? JSON.parse(amenitiesStr) : [];
  } catch (parseError) {
    throw new AppError('Invalid format for amenities.', 400);
  }

  const newFlat = await prisma.flat.create({
    data: {
      owner: { connect: { id: ownerId } },
      flatNumber,
      floor: floor ? parseInt(floor) : null,
      houseName,
      houseNumber,
      address,
      district,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      monthlyRentalCost: parseFloat(monthlyRentalCost),
      utilityCost: utilityCost ? parseFloat(utilityCost) : null,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      minimumStay: minimumStay ? parseInt(minimumStay) : null,
      description,
      status: status || 'available',
      amenities: {
        create: amenities.map((amenity: { id: number }) => ({
          amenityId: amenity.id,
        })),
      },
      images: {
        create: files.map((file, index) => ({
          url: `/uploads/${file.filename}`,
          isThumbnail: index === 0,
        }))
      }
    },
  });

  return newFlat;
};

export const updateFlat = async (flatId: number, data: any, userId: number, file: Express.Multer.File | undefined) => {
    const { amenities, ...updateBody } = data;

    const flat = await prisma.flat.findUnique({
        where: { id: flatId },
        include: { images: true }
    });

    if (!flat) {
        throw new AppError('Flat not found.', 404);
    }
    if (flat.ownerId !== userId) {
        throw new AppError('Not authorized to update this flat.', 403);
    }

    const updateData: Prisma.FlatUpdateInput = {
        ...updateBody,
        floor: updateBody.floor ? parseInt(updateBody.floor) : undefined,
        latitude: updateBody.latitude ? parseFloat(updateBody.latitude) : undefined,
        longitude: updateBody.longitude ? parseFloat(updateBody.longitude) : undefined,
        monthlyRentalCost: updateBody.monthlyRentalCost ? parseFloat(updateBody.monthlyRentalCost) : undefined,
        utilityCost: updateBody.utilityCost ? parseFloat(updateBody.utilityCost) : undefined,
        bedrooms: updateBody.bedrooms ? parseInt(updateBody.bedrooms) : undefined,
        bathrooms: updateBody.bathrooms ? parseInt(updateBody.bathrooms) : undefined,
        minimumStay: updateBody.minimumStay ? parseInt(updateBody.minimumStay) : undefined,
    };

    if (file) {
        const newImageUrl = `/uploads/${file.filename}`;

        const oldThumbnail = flat.images.find(img => img.isThumbnail);
        if (oldThumbnail) {
            // TODO: Delete old image from storage
        }

        updateData.images = {
            deleteMany: { isThumbnail: true },
            create: { url: newImageUrl, isThumbnail: true }
        };
    }

    if (amenities) {
        await prisma.flatAmenity.deleteMany({ where: { flatId: flat.id } });
        updateData.amenities = {
            create: JSON.parse(amenities).map((amenity: { id: number }) => ({
                amenityId: amenity.id
            }))
        };
    }

    const updatedFlat = await prisma.flat.update({
        where: { id: flatId },
        data: updateData,
    });

    return updatedFlat;
};

export const getOwnerFlats = async (ownerId: number) => {
    const flats = await prisma.flat.findMany({
        where: { ownerId },
        include: {
            images: { select: { id: true, url: true, isThumbnail: true } },
            amenities: { include: { amenity: true } },
            bookings: {
                where: { status: { in: ['pending', 'approved', 'active'] } },
                orderBy: { endDate: 'desc' },
                take: 1, // Get the most recent active/pending/approved booking
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Dynamically update flat status based on booking expiry
    const updatedFlats = await Promise.all(flats.map(async flat => {
        const latestBooking = flat.bookings[0];
        if (latestBooking && latestBooking.status === 'active' && latestBooking.endDate < new Date()) {
            // Booking has expired, update flat status to available and booking status to expired
            await prisma.$transaction([
                prisma.flat.update({
                    where: { id: flat.id },
                    data: { status: 'available' },
                }),
                prisma.booking.update({
                    where: { id: latestBooking.id },
                    data: { status: 'expired' },
                }),
            ]);
            return { ...flat, status: 'available', bookings: [{ ...latestBooking, status: 'expired' }] }; // Return updated flat and booking
        }
        return flat;
    }));

    return updatedFlats;
};

export const getFlatById = async (flatId: number, userId?: number, userType?: string) => {
    const flatAuthCheck = await prisma.flat.findUnique({
        where: { id: flatId },
        select: { ownerId: true }
    });

    if (!flatAuthCheck) {
        return null;
    }

    const isOwnerOfFlat = userId && flatAuthCheck.ownerId === userId && userType === 'owner';
    const isAuthenticatedUser = !!userId;

    const relevantBookingWhereClause = {
        status: {
            in: ['pending', 'approved', 'active']
        }
    };

    let queryOptions: Prisma.FlatFindUniqueArgs;

    if (isOwnerOfFlat) {
        queryOptions = {
            where: { id: flatId },
            include: {
                owner: true,
                images: true,
                amenities: { include: { amenity: true } },
                reviews: {
                    include: {
                        reviewer: { select: { firstName: true, lastName: true } }
                    },
                    orderBy: { dateSubmitted: 'desc' }
                },
                bookings: {
                    where: { flatId: flatId, ...relevantBookingWhereClause },
                    include: { 
                        payments: true, 
                        extensions: true, 
                        user: { select: { firstName: true, lastName: true, email: true, phone: true, nid: true } } 
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                }
            },
        };
    } else {
        queryOptions = {
            where: { id: flatId },
            select: {
                id: true, houseName: true, address: true, district: true, latitude: true, longitude: true,
                monthlyRentalCost: true, utilityCost: isAuthenticatedUser, bedrooms: true, bathrooms: true,
                minimumStay: true, description: true, status: true, rating: true, createdAt: true,
                updatedAt: true, ownerId: true,
                flatNumber: !!isOwnerOfFlat,
                floor: !!isOwnerOfFlat,
                houseNumber: !!isOwnerOfFlat,
                owner: {
                    select: {
                        id: true, firstName: true, lastName: true, email: isAuthenticatedUser,
                        phone: !!isOwnerOfFlat,
                        nid: !!isOwnerOfFlat,
                    },
                },
                images: { select: { id: true, url: true, isThumbnail: true } },
                amenities: { select: { amenity: { select: { id: true, name: true, description: true } } } },
                reviews: {
                    include: {
                        reviewer: { select: { firstName: true, lastName: true } }
                    },
                    orderBy: { dateSubmitted: 'desc' }
                },
                bookings: {
                    where: { userId: userId || -1, ...relevantBookingWhereClause },
                    include: { 
                        payments: true, extensions: true,
                        user: { select: { firstName: true, lastName: true, email: true, phone: true, nid: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                }
            },
        };
    }

    const flatData = await prisma.flat.findUnique(queryOptions);

    if (!flatData) {
        return null;
    }

    // Cast flatData to any to bypass TypeScript type checking for bookings access
    const flatWithBookings: any = flatData;

    // Dynamically update flat status based on booking expiry for this specific flat
    const activeBooking = flatWithBookings.bookings?.find((b: any) => b.status === 'active');
    if (activeBooking && activeBooking.endDate < new Date()) {
        await prisma.$transaction([
            prisma.flat.update({
                where: { id: flatWithBookings.id },
                data: { status: 'available' },
            }),
            prisma.booking.update({
                where: { id: activeBooking.id },
                data: { status: 'expired' },
            }),
        ]);
        // Update the flat object in memory before returning
        return {
            ...flatWithBookings,
            status: 'available',
            bookings: flatWithBookings.bookings?.map((b: any) => b.id === activeBooking.id ? { ...b, status: 'expired' } : b),
        };
    }

    return flatWithBookings;
};

export const deleteFlat = async (flatId: number, userId: number) => {
    const flat = await prisma.flat.findUnique({
        where: { id: flatId },
        select: { id: true, ownerId: true }
    });

    if (!flat) {
        throw new AppError('Flat not found.', 404);
    }

    if (flat.ownerId !== userId) {
        throw new AppError('Not authorized to delete this flat.', 403);
    }

    await prisma.flat.delete({
        where: { id: flatId },
    });
};