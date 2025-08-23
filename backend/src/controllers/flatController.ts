// backend/src/controllers/flatController.ts
import { Request, Response } from 'express';
import prisma from '../db';
import { Prisma } from '@prisma/client';
import fs from 'fs'; // <-- Add fs for file operations
import path from 'path'; // <-- Add path

declare module 'express' {
  interface Request {
    user?: { id: number; userType: string; };
  }
}

// --- Create a new Flat listing (Owner only) ---
export const createFlat = async (req: Request, res: Response) => {
  if (!req.user || req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized. Only owners can create flats.' });
  }

  const ownerId = req.user.id;
  const {
    flatNumber, floor, houseName, houseNumber, address, district, latitude, longitude,
    monthlyRentalCost, utilityCost, bedrooms, bathrooms, minimumStay, description, status,
    amenities
  } = req.body;

  if (!address || !monthlyRentalCost || !district) {
    return res.status(400).json({ message: 'Please provide address, district and monthly rental cost.' });
  }

  try {
    const newFlat = await prisma.flat.create({
      data: {
        owner: { connect: { id: ownerId } },
        flatNumber,
        floor: floor ? parseInt(floor) : null,
        houseName,
        houseNumber,
        address,
        district, // NEW: Add district to data object
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
          create: amenities ? JSON.parse(amenities).map((amenity: { id: number }) => ({
            amenityId: amenity.id,
          })) : [],
        },
        // --- Handle image upload ---
        images: req.file ? {
          create: {
            url: `/uploads/${req.file.filename}`, // URL path to the stored image
            isThumbnail: true,
          },
        } : undefined,
      },
    });

    res.status(201).json({ message: 'Flat created successfully', flat: newFlat });
  } catch (error) {
    console.error('Error creating flat:', error);
    res.status(500).json({ message: 'Server error during creation.' });
  }
};

// --- Update a Flat (Owner only) ---
export const updateFlat = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    const { amenities, ...updateBody } = req.body;

    try {
        const flat = await prisma.flat.findUnique({
            where: { id: parseInt(id) },
            include: { images: true } // Include existing images
        });

        if (!flat) {
            return res.status(404).json({ message: 'Flat not found.' });
        }
        if (flat.ownerId !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this flat.' });
        }

        const updateData: Prisma.FlatUpdateInput = {
            ...updateBody,
            // --- Safely parse numeric fields from form data ---
            floor: updateBody.floor ? parseInt(updateBody.floor) : undefined,
            latitude: updateBody.latitude ? parseFloat(updateBody.latitude) : undefined,
            longitude: updateBody.longitude ? parseFloat(updateBody.longitude) : undefined,
            monthlyRentalCost: updateBody.monthlyRentalCost ? parseFloat(updateBody.monthlyRentalCost) : undefined,
            utilityCost: updateBody.utilityCost ? parseFloat(updateBody.utilityCost) : undefined,
            bedrooms: updateBody.bedrooms ? parseInt(updateBody.bedrooms) : undefined,
            bathrooms: updateBody.bathrooms ? parseInt(updateBody.bathrooms) : undefined,
            minimumStay: updateBody.minimumStay ? parseInt(updateBody.minimumStay) : undefined,
        };

        // Handle image update
        if (req.file) {
            const newImageUrl = `/uploads/${req.file.filename}`;

            // Delete old image file if it exists
            const oldThumbnail = flat.images.find(img => img.isThumbnail);
            if (oldThumbnail) {
                const oldImagePath = path.join(__dirname, '../../uploads', path.basename(oldThumbnail.url));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Update database record for the image
            updateData.images = {
                deleteMany: { isThumbnail: true }, // Delete old thumbnail record
                create: { url: newImageUrl, isThumbnail: true } // Create new one
            };
        }

        // Handle amenities update
        if (amenities) {
            await prisma.flatAmenity.deleteMany({ where: { flatId: flat.id } });
            updateData.amenities = {
                create: JSON.parse(amenities).map((amenity: { id: number }) => ({
                    amenityId: amenity.id
                }))
            };
        }

        const updatedFlat = await prisma.flat.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        res.status(200).json({ message: 'Flat updated successfully.', flat: updatedFlat });

    } catch (error) {
        console.error('Error updating flat:', error);
        res.status(500).json({ message: 'Server error during flat update.' });
    }
};
// --- Update a Flat (Owner only) ---
export const uupdateFlat = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  const {
    flatNumber, floor, houseName, houseNumber, address, district, latitude, longitude,
    monthlyRentalCost, utilityCost, bedrooms, bathrooms,
    minimumStay, description, status,
    amenities // This should be an array of objects with { id: number }
  } = req.body;

  try {
    const flat = await prisma.flat.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, ownerId: true }
    });

    if (!flat) {
      return res.status(404).json({ message: 'Flat not found.' });
    }

    if (flat.ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this flat.' });
    }

    const updateData: Prisma.FlatUpdateInput = {
      flatNumber: flatNumber !== undefined ? flatNumber : undefined,
      floor: floor !== undefined ? parseInt(floor) : undefined,
      houseName: houseName !== undefined ? houseName : undefined,
      houseNumber: houseNumber !== undefined ? houseNumber : undefined,
      address: address !== undefined ? address : undefined,
      district: district !== undefined ? district : undefined,
      latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
      longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      monthlyRentalCost: monthlyRentalCost !== undefined ? parseFloat(monthlyRentalCost) : undefined,
      utilityCost: utilityCost !== undefined ? parseFloat(utilityCost) : undefined,
      bedrooms: bedrooms !== undefined ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms !== undefined ? parseInt(bathrooms) : undefined,
      minimumStay: minimumStay !== undefined ? parseInt(minimumStay) : undefined,
      description: description !== undefined ? description : undefined,
      status: status !== undefined ? status : undefined,
    };

    // --- FIX AMENITY LINKING LOGIC ---
    if (amenities) {
        // First, disconnect all existing amenities from the flat
        await prisma.flatAmenity.deleteMany({
            where: { flatId: flat.id }
        });

        // Then, connect the new set of amenities
        updateData.amenities = {
            create: amenities.map((amenity: { id: number }) => ({
                amenityId: amenity.id
            }))
        };
    }
    // --- END FIX ---

    const updatedFlat = await prisma.flat.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.status(200).json({ message: 'Flat updated successfully.', flat: updatedFlat });

  } catch (error) {
    console.error('Error updating flat:', error);
    res.status(500).json({ message: 'Server error during flat update.' });
  }
};

// --- Get all Flat listings with sorting (Publicly accessible) ---
export const getAllFlats = async (req: Request, res: Response) => {
  try {
    const { sortBy, sortOrder, amenities, district, minRent, maxRent } = req.query;
    let orderBy: any[] = [];
    let where: Prisma.FlatWhereInput = { status: 'available' };

    // Handle single sorting parameter
    if (sortBy && ['monthlyRentalCost', 'bedrooms', 'bathrooms'].includes(sortBy as string)) {
        const order = sortOrder === 'high' ? 'desc' : 'asc';
        orderBy.push({ [sortBy as string]: order });
    }

    // Handle filtering by amenities
    if (amenities) {
      const amenityIds = (Array.isArray(amenities) ? amenities : [amenities]).map(id => parseInt(id as string, 10));
      if (amenityIds.length > 0) {
        where = {
          ...where,
          amenities: {
            some: {
              amenityId: {
                in: amenityIds,
              },
            },
          },
        };
      }
    }
    
    // NEW: Handle filtering by district
    if (district && typeof district === 'string' && district.trim() !== '') {
        where = {
            ...where,
            district: {
                equals: district,
                
            }
        };
    }
    
    // NEW: Handle filtering by rent range
    if (minRent || maxRent) {
        where = {
            ...where,
            monthlyRentalCost: {
                gte: minRent ? parseFloat(minRent as string) : undefined,
                lte: maxRent ? parseFloat(maxRent as string) : undefined,
            }
        };
    }

    const flats = await prisma.flat.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        images: { select: { id: true, url: true, isThumbnail: true } },
        amenities: { include: { amenity: true } },
      },
      orderBy: orderBy.length > 0 ? orderBy : undefined,
    });

    res.status(200).json(flats);
  } catch (error) {
    console.error('Error fetching all flats:', error);
    res.status(500).json({ message: 'Server error fetching flats.' });
  }
};

// --- Get Flats for Authenticated Owner (Owner only) ---
export const getOwnerFlats = async (req: Request, res: Response) => {
  if (!req.user || req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized. Only owners can view their flats.' });
  }

  const ownerId = req.user.id;
  try {
    const ownerFlats = await prisma.flat.findMany({
      where: { ownerId: ownerId },
      include: {
        images: { select: { id: true, url: true, isThumbnail: true } },
        amenities: { include: { amenity: true } },
      },
    });

    res.status(200).json(ownerFlats);
  } catch (error) {
    console.error('Error fetching owner flats:', error);
    res.status(500).json({ message: 'Server error fetching owner flats.' });
  }
};

// --- Get Single Flat Details ---
export const getFlatById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userType = req.user?.userType;
  try {
    const flatAuthCheck = await prisma.flat.findUnique({
      where: { id: parseInt(id) },
      select: { ownerId: true }
    });

    if (!flatAuthCheck) {
      return res.status(404).json({ message: 'Flat not found.' });
    }

    const isOwnerOfFlat = userId && flatAuthCheck.ownerId === userId && userType === 'owner';
    const isAuthenticatedUser = !!userId;

    let queryOptions: Prisma.FlatFindUniqueArgs;

    if (isOwnerOfFlat) {
      queryOptions = {
        where: { id: parseInt(id) },
        include: {
          owner: true,
          images: true,
          amenities: { include: { amenity: true } },
        },
      };
    } else {
      queryOptions = {
        where: { id: parseInt(id) },
        select: {
          id: true,
          houseName: true,
          address: true,
          district: true, 
          latitude: true,
          longitude: true,
          monthlyRentalCost: true,
          bedrooms: true,
          bathrooms: true,
          minimumStay: true,
          description: true,
          status: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,

          flatNumber: isAuthenticatedUser,
          floor: isAuthenticatedUser,
          houseNumber: isAuthenticatedUser,
          utilityCost: isAuthenticatedUser,

          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: isAuthenticatedUser,
              phone: isOwnerOfFlat ? true : false,
              nid: isOwnerOfFlat ? true : false,
            },
          },

          images: { select: { id: true, url: true, isThumbnail: true } },
          amenities: { select: { amenity: { select: { id: true, name: true, description: true } } } },
        },
      };
    }

    const flatData = await prisma.flat.findUnique(queryOptions);

    if (!flatData) {
      return res.status(404).json({ message: 'Flat details not found after main fetch.' });
    }

    res.status(200).json(flatData);
  } catch (error) {
    console.error('Error fetching flat by ID:', error);
    res.status(500).json({ message: 'Server error fetching flat details.' });
  }
};

// --- Delete a Flat (Owner only) ---
export const deleteFlat = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const flat = await prisma.flat.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, ownerId: true }
    });

    if (!flat) {
      return res.status(404).json({ message: 'Flat not found.' });
    }

    if (flat.ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this flat.' });
    }

    await prisma.flat.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Flat deleted successfully.' });

  } catch (error) {
    console.error('Error deleting flat:', error);
    res.status(500).json({ message: 'Server error during flat deletion.' });
  }
};


// --- Get All Amenities ---
export const getAllAmenities = async (req: Request, res: Response) => {
  try {
    const amenities = await prisma.amenity.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      }
    });
    res.status(200).json(amenities);
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({ message: 'Server error fetching amenities.' });
  }
};

// --- Create a Booking (Tenant only) ---
export const createBooking = async (req: Request, res: Response) => {
  const { id: flatId } = req.params;
  const tenantId = req.user?.id;

  // Restrict to tenants
  if (!tenantId || req.user?.userType !== 'tenant') {
    return res.status(403).json({ message: 'Not authorized. Only tenants can book flats.' });
  }

  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required for a booking.' });
  }

  try {
    const flat = await prisma.flat.findUnique({
      where: { id: parseInt(flatId) },
      select: { id: true, status: true, monthlyRentalCost: true, ownerId: true }
    });

    if (!flat) {
      return res.status(404).json({ message: 'Flat not found.' });
    }

    if (flat.ownerId === tenantId) {
         return res.status(403).json({message: 'Owners cannot book their own flats.'})
    }

    if (flat.status !== 'available') {
      return res.status(400).json({ message: 'Flat is not currently available for booking.' });
    }

    // Check for conflicting bookings
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        flatId: flat.id,
        status: { in: ['pending', 'approved', 'active'] },
        OR: [
          {
            // New booking starts during an existing one
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
        return res.status(400).json({ message: 'Booking dates conflict with an existing reservation.' });
    }


    // Create the booking record
    const newBooking = await prisma.booking.create({
      data: {
        user: { connect: { id: tenantId } },
        flat: { connect: { id: flat.id } },
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'pending', // Awaiting owner approval
        autoRenewEnabled: true,
        // Assuming simplified payment logic for now
        payments: {
          create: {
            amount: parseFloat(flat.monthlyRentalCost as unknown as string),
            datePaid: new Date(),
            status: 'completed',
            paymentMethod: 'system',
          },
        },
      },
    });

    // For now, we can immediately update the flat status to 'pending' to prevent other bookings
    await prisma.flat.update({
        where: {id: flat.id},
        data: {status: 'pending'}
    })

    res.status(201).json({ message: 'Booking request created successfully.', booking: newBooking });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error during booking creation.' });
  }
};

// --- Get All Booking Requests for an Owner ---
export const getOwnerBookings = async (req: Request, res: Response) => {
  const ownerId = req.user?.id;

  if (!ownerId || req.user?.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized. Only owners can view booking requests.' });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        flat: {
          ownerId: ownerId,
        },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        flat: { select: { id: true, address: true, houseName: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    res.status(500).json({ message: 'Server error fetching booking requests.' });
  }
};


// --- Approve a Booking Request (Owner only) ---
export const approveBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const ownerId = req.user?.id;

  if (!ownerId || req.user?.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized. Only owners can approve bookings.' });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: { flat: { select: { ownerId: true } } },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking request not found.' });
    }

    if (booking.flat.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Not authorized to approve this booking.' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status: 'approved' },
    });

    res.status(200).json({ message: 'Booking approved successfully.', booking: updatedBooking });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ message: 'Server error approving booking.' });
  }
};


// --- Disapprove a Booking Request (Owner only) ---
export const disapproveBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const ownerId = req.user?.id;

  if (!ownerId || req.user?.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized. Only owners can disapprove bookings.' });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: { flat: { select: { id: true, ownerId: true } } },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking request not found.' });
    }

    if (booking.flat.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Not authorized to disapprove this booking.' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status: 'disapproved' },
    });

    // Potentially update flat status back to 'available'
    await prisma.flat.update({
        where: {id: booking.flat.id},
        data: {status: 'available'}
    });

    res.status(200).json({ message: 'Booking disapproved successfully.', booking: updatedBooking });
  } catch (error) {
    console.error('Error disapproving booking:', error);
    res.status(500).json({ message: 'Server error disapproving booking.' });
  }
};

// --- Get All Bookings for a Tenant ---
export const getTenantBookings = async (req: Request, res: Response) => {
  const tenantId = req.user?.id;

  if (!tenantId || req.user?.userType !== 'tenant') {
    return res.status(403).json({ message: 'Not authorized. Only tenants can view their bookings.' });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: tenantId,
      },
      include: {
        flat: { select: { id: true, address: true, houseName: true, owner: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching tenant bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings.' });
  }
};


// --- NEW: Cancel a Booking Request (Tenant only) ---
export const cancelBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user?.id;

  if (!tenantId || req.user?.userType !== 'tenant') {
    return res.status(403).json({ message: 'Not authorized. Only tenants can cancel their own bookings.' });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true, flat: { select: { id: true } }, status: true },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId !== tenantId) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be cancelled.' });
    }

    await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status: 'cancelled' } // <-- NEW: Explicitly set status to 'cancelled'
    });

    // Update the flat status back to 'available'
    await prisma.flat.update({
      where: { id: booking.flat.id },
      data: { status: 'available' }
    });

    res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error cancelling booking.' });
  }
};
