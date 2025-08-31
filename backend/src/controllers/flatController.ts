// backend/src/controllers/flatController.ts
import { Request, Response } from 'express';
import prisma from '../db';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

declare module 'express' {
  interface Request {
    user?: { id: number; userType: string; };
    file?: Express.Multer.File;
  }
}

// Utility function to update statuses
const updateCompletedBookings = async () => {
  try {
    const now = new Date();
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'active',
        endDate: {
          lt: now,
        },
      },
      select: {
        id: true,
        flatId: true,
      },
    });

    if (completedBookings.length > 0) {
      const bookingIds = completedBookings.map(b => b.id);
      const flatIds = completedBookings.map(b => b.flatId);

      // Use a transaction to ensure both updates succeed
      await prisma.$transaction([
        // Set booking status to 'completed'
        prisma.booking.updateMany({
          where: { id: { in: bookingIds } },
          data: { status: 'completed' },
        }),
        // Set flat status to 'available'
        prisma.flat.updateMany({
          where: { id: { in: flatIds } },
          data: { status: 'available' },
        }),
      ]);
      console.log(`Updated ${completedBookings.length} bookings to completed status.`);
    }
  } catch (error) {
    console.error("Error updating completed bookings:", error);
  }
};

// --- Create a new Flat listing (Owner only) ---
export const createFlat = async (req: Request, res: Response) => {
  if (!req.user || req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized. Only owners can create flats.' });
  }

  // MODIFIED: The files will now be in req.files as an array
  const files = req.files as Express.Multer.File[];

  const ownerId = req.user.id;
  const {
    flatNumber, floor, houseName, houseNumber, address, district, latitude, longitude,
    monthlyRentalCost, utilityCost, bedrooms, bathrooms, minimumStay, description, status,
    amenities: amenitiesStr
  } = req.body;
  
  let amenities;
  try {
    amenities = amenitiesStr ? JSON.parse(amenitiesStr) : [];
  } catch (parseError) {
    return res.status(400).json({ message: 'Invalid format for amenities.' });
  }

  if (!address || !monthlyRentalCost || !district) {
    return res.status(400).json({ message: 'Please provide address, district and monthly rental cost.' });
  }

  // MODIFIED: Check if at least one file was uploaded
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'At least one image is required.' });
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
        // MODIFIED: Create multiple image records
        images: {
          create: files.map((file, index) => ({
            url: `/uploads/${file.filename}`,
            // Designate the first image as the thumbnail
            isThumbnail: index === 0,
          }))
        }
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
            include: { images: true }
        });

        if (!flat) {
            return res.status(404).json({ message: 'Flat not found.' });
        }
        if (flat.ownerId !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this flat.' });
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

        if (req.file) {
            const newImageUrl = `/uploads/${req.file.filename}`;

            const oldThumbnail = flat.images.find(img => img.isThumbnail);
            if (oldThumbnail) {
                const oldImagePath = path.join(__dirname, '../../uploads', path.basename(oldThumbnail.url));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
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

    if (sortBy && ['monthlyRentalCost', 'bedrooms', 'bathrooms'].includes(sortBy as string)) {
        const order = sortOrder === 'high' ? 'desc' : 'asc';
        orderBy.push({ [sortBy as string]: order });
    }

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
    
    if (district && typeof district === 'string' && district.trim() !== '') {
        where = {
            ...where,
            district: {
                equals: district,
                
            }
        };
    }
    
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
  await updateCompletedBookings();

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

    const relevantBookingWhereClause = {
      status: {
        in: ['pending', 'approved', 'active']
      }
    };

    let queryOptions: Prisma.FlatFindUniqueArgs;

    if (isOwnerOfFlat) {
      queryOptions = {
        where: { id: parseInt(id) },
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
            where: { flatId: parseInt(id), ...relevantBookingWhereClause },
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
        where: { id: parseInt(id) },
        select: {
          id: true, houseName: true, address: true, district: true, latitude: true, longitude: true,
          monthlyRentalCost: true, utilityCost: isAuthenticatedUser, bedrooms: true, bathrooms: true,
          minimumStay: true, description: true, status: true, rating: true, createdAt: true,
          updatedAt: true, ownerId: true,
          // FIXED: Explicitly cast to boolean to satisfy TypeScript
          flatNumber: !!isOwnerOfFlat,
          floor: !!isOwnerOfFlat,
          houseNumber: !!isOwnerOfFlat,
          owner: {
            select: {
              id: true, firstName: true, lastName: true, email: isAuthenticatedUser,
              // FIXED: Explicitly cast to boolean
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

    // Check for conflicting bookings (only with 'active' bookings)
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        flatId: flat.id,
        status: 'active', // Only check against active bookings
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
        return res.status(400).json({ message: 'Booking dates conflict with an existing active reservation.' });
    }


    // Create the booking record with 'pending_owner_approval' status
    const newBooking = await prisma.booking.create({
      data: {
        user: { connect: { id: tenantId } },
        flat: { connect: { id: flat.id } },
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'pending', // Initial status: Awaiting owner approval (using 'pending' as per schema)
        autoRenewEnabled: true,
        payments: {
          create: {
            amount: flat.monthlyRentalCost,
            datePaid: new Date(), // This will be updated upon actual payment
            status: 'pending', // Payment is pending from tenant (using 'pending' as per schema)
            paymentMethod: 'system', // Placeholder
          },
        },
      },
    });

    // Update the flat status to 'pending' to indicate a request is in progress
    await prisma.flat.update({
        where: {id: flat.id},
        data: {status: 'pending'} // Flat is now pending a booking approval
    })

    res.status(201).json({ message: 'Booking request created successfully. Awaiting owner approval.', booking: newBooking });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error during booking creation.' });
  }
};

// --- Get All Booking Requests for an Owner ---
export const getOwnerBookings = async (req: Request, res: Response) => {
  await updateCompletedBookings();

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
        payments: true, // Include payments to check status
        extensions: true, // Include extensions
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
      include: { flat: { select: { ownerId: true, id : true } }, payments: true },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking request not found.' });
    }

    if (booking.flat.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Not authorized to approve this booking.' });
    }

    if (booking.status !== 'pending') { // Only approve if status is 'pending'
        return res.status(400).json({ message: 'Booking is not in "pending" status for approval.' });
    }

    // Update booking status to 'approved' (awaiting tenant payment)
    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: parseInt(id) },
        data: { 
            status: 'approved', // Now tenant needs to pay
            approvedAt: new Date(),
        },
      }),
      prisma.payment.updateMany({ // Update associated payments
        where: { bookingId: parseInt(id), status: 'pending' }, // Assuming initial payment status is 'pending'
        data: { status: 'awaiting_tenant_payment' },
      }),
    ]);
    
    res.status(200).json({ message: 'Booking approved by owner. Awaiting tenant payment.', booking: updatedBooking });
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
      include: { flat: { select: { id: true, ownerId: true } }, payments: true },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking request not found.' });
    }

    if (booking.flat.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Not authorized to disapprove this booking.' });
    }

    if (booking.status !== 'pending' && booking.status !== 'approved') {
        return res.status(400).json({ message: 'Booking cannot be disapproved from its current status.' });
    }

    const [updatedBooking] = await prisma.$transaction([
        prisma.booking.update({
            where: { id: parseInt(id) },
            data: { status: 'disapproved', cancelledAt: new Date() },
        }),
        prisma.payment.updateMany({
            where: { bookingId: parseInt(id), status: { in: ['pending', 'awaiting_tenant_payment'] } },
            data: { status: 'failed' },
        }),
        prisma.flat.update({
            where: { id: booking.flat.id },
            data: { status: 'available' }
        })
    ]);

    res.status(200).json({ message: 'Booking disapproved successfully.', booking: updatedBooking });
  } catch (error) {
    console.error('Error disapproving booking:', error);
    res.status(500).json({ message: 'Server error disapproving booking.' });
  }
};

// --- Get All Bookings for a Tenant ---
export const getTenantBookings = async (req: Request, res: Response) => {
  await updateCompletedBookings();

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
        payments: true,
        extensions: true,
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


// --- Cancel a Booking (Tenant only) ---
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

    if (booking.status !== 'pending' && booking.status !== 'approved') {
      return res.status(400).json({ message: 'Only pending or approved (awaiting payment) bookings can be cancelled by tenant.' });
    }

    await prisma.$transaction([
        prisma.booking.update({
            where: { id: parseInt(id) },
            data: { status: 'cancelled', cancelledAt: new Date() },
        }),
        prisma.payment.updateMany({
            where: { bookingId: parseInt(id), status: { in: ['pending', 'awaiting_tenant_payment'] } },
            data: { status: 'failed' },
        }),
        prisma.flat.update({
            where: { id: booking.flat.id },
            data: { status: 'available' }
        })
    ]);

    res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error cancelling booking.' });
  }
};

// --- Tenant Confirms Payment for Booking ---
export const confirmPayment = async (req: Request, res: Response) => {
  const { id } = req.params; // Booking ID
  const tenantId = req.user?.id;

  if (!tenantId || req.user?.userType !== 'tenant') {
    return res.status(403).json({ message: 'Not authorized. Only tenants can confirm payment.' });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: { 
        flat: { select: { id: true, status: true } }, 
        payments: { where: { status: 'awaiting_tenant_payment' } }
      },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId !== tenantId) {
      return res.status(403).json({ message: 'Not authorized to confirm payment for this booking.' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Booking is not in "approved" status. Payment cannot be confirmed.' });
    }

    if (booking.payments.length === 0) {
        return res.status(400).json({ message: 'No pending payments found for this booking.' });
    }
    
    const paymentToConfirm = booking.payments[0];

    const [updatedBooking, updatedPayment] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: parseInt(id) },
        data: { status: 'active' },
      }),
      prisma.payment.update({
        where: { id: paymentToConfirm.id },
        data: { status: 'completed', datePaid: new Date() },
      }),
      prisma.flat.update({
        where: { id: booking.flat.id },
        data: { status: 'booked' },
      }),
    ]);

    res.status(200).json({ message: 'Payment confirmed. Booking is now active.', booking: updatedBooking, payment: updatedPayment });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Server error during payment confirmation.' });
  }
};

// --- Tenant Requests Extension ---
export const requestExtension = async (req: Request, res: Response) => {
    const { id: bookingId } = req.params;
    const tenantId = req.user?.id;
    const { newEndDate } = req.body;

    if (!tenantId || req.user?.userType !== 'tenant') {
        return res.status(403).json({ message: 'Not authorized. Only tenants can request extensions.' });
    }
    if (!newEndDate) {
        return res.status(400).json({ message: 'New end date is required for an extension request.' });
    }

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(bookingId) },
            select: { id: true, userId: true, endDate: true, flatId: true, flat: { select: { monthlyRentalCost: true } } },
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        if (booking.userId !== tenantId) {
            return res.status(403).json({ message: 'Not authorized to request extension for this booking.' });
        }

        const currentEndDate = new Date(booking.endDate);
        const requestedNewEndDate = new Date(newEndDate);

        if (requestedNewEndDate <= currentEndDate) {
            return res.status(400).json({ message: 'New end date must be after the current end date.' });
        }

        const newExtension = await prisma.extension.create({
            data: {
                booking: { connect: { id: booking.id } },
                newStartDate: currentEndDate,
                newEndDate: requestedNewEndDate,
                status: 'pending',
            },
        });

        await prisma.payment.create({
            data: {
                booking: { connect: { id: booking.id } },
                amount: booking.flat.monthlyRentalCost,
                datePaid: new Date(),
                status: 'pending',
                paymentMethod: 'system',
            },
        });

        res.status(201).json({ message: 'Extension request submitted. Awaiting owner approval.', extension: newExtension });

    } catch (error) {
        console.error('Error requesting extension:', error);
        res.status(500).json({ message: 'Server error during extension request.' });
    }
};

// --- Owner Approves Extension Request ---
export const approveExtension = async (req: Request, res: Response) => {
    const { id: extensionId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId || req.user?.userType !== 'owner') {
        return res.status(403).json({ message: 'Not authorized. Only owners can approve extensions.' });
    }

    try {
        const extension = await prisma.extension.findUnique({
            where: { id: parseInt(extensionId) },
            include: { 
                booking: { 
                    select: { 
                        id: true, 
                        flat: { select: { ownerId: true } }, 
                        payments: { where: { status: 'pending' } }
                    } 
                } 
            },
        });

        if (!extension) {
            return res.status(404).json({ message: 'Extension request not found.' });
        }
        if (extension.booking.flat.ownerId !== ownerId) {
            return res.status(403).json({ message: 'Not authorized to approve this extension.' });
        }
        if (extension.status !== 'pending') {
            return res.status(400).json({ message: 'Extension is not in "pending" status for approval.' });
        }

        const pendingExtensionPayment = extension.booking.payments.find(p => p.status === 'pending' && p.datePaid.toDateString() === extension.requestedAt.toDateString());

        if (!pendingExtensionPayment) {
            return res.status(400).json({ message: 'No pending payment found for this extension request.' });
        }

        const [updatedExtension] = await prisma.$transaction([
            prisma.extension.update({
                where: { id: parseInt(extensionId) },
                data: { status: 'approved' },
            }),
            prisma.payment.update({
                where: { id: pendingExtensionPayment.id },
                data: { status: 'awaiting_tenant_payment' },
            }),
        ]);

        res.status(200).json({ message: 'Extension approved by owner. Awaiting tenant payment.', extension: updatedExtension });

    } catch (error) {
        console.error('Error approving extension:', error);
        res.status(500).json({ message: 'Server error approving extension.' });
    }
};

// --- Owner Rejects Extension Request ---
export const rejectExtension = async (req: Request, res: Response) => {
    const { id: extensionId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId || req.user?.userType !== 'owner') {
        return res.status(403).json({ message: 'Not authorized. Only owners can reject extensions.' });
    }

    try {
        const extension = await prisma.extension.findUnique({
            where: { id: parseInt(extensionId) },
            include: { 
                booking: { 
                    select: { 
                        id: true, 
                        flat: { select: { ownerId: true } },
                        payments: { where: { status: 'pending' } }
                    } 
                } 
            },
        });

        if (!extension) {
            return res.status(404).json({ message: 'Extension request not found.' });
        }
        if (extension.booking.flat.ownerId !== ownerId) {
            return res.status(403).json({ message: 'Not authorized to reject this extension.' });
        }
        if (extension.status !== 'pending' && extension.status !== 'approved') {
            return res.status(400).json({ message: 'Extension cannot be rejected from its current status.' });
        }

        const pendingExtensionPayment = extension.booking.payments.find(p => p.status === 'pending' && p.datePaid.toDateString() === extension.requestedAt.toDateString());

        const [updatedExtension] = await prisma.$transaction([
            prisma.extension.update({
                where: { id: parseInt(extensionId) },
                data: { status: 'rejected' },
            }),
            ...(pendingExtensionPayment ? [
                prisma.payment.update({
                    where: { id: pendingExtensionPayment.id },
                    data: { status: 'failed' },
                })
            ] : []),
        ]);

        res.status(200).json({ message: 'Extension request rejected.', extension: updatedExtension });

    } catch (error) {
        console.error('Error rejecting extension:', error);
        res.status(500).json({ message: 'Server error during extension rejection.' });
    }
};

// --- Tenant Confirms Payment for Extension ---
export const confirmExtensionPayment = async (req: Request, res: Response) => {
    const { id: extensionId } = req.params;
    const tenantId = req.user?.id;

    if (!tenantId || req.user?.userType !== 'tenant') {
        return res.status(403).json({ message: 'Not authorized. Only tenants can confirm extension payment.' });
    }

    try {
        const extension = await prisma.extension.findUnique({
            where: { id: parseInt(extensionId) },
            include: { 
                booking: { 
                    select: { 
                        id: true, 
                        userId: true, 
                        endDate: true,
                        flatId: true,
                        payments: { where: { status: 'awaiting_tenant_payment' } }
                    } 
                } 
            },
        });

        if (!extension) {
            return res.status(404).json({ message: 'Extension not found.' });
        }
        if (extension.booking.userId !== tenantId) {
            return res.status(403).json({ message: 'Not authorized to confirm payment for this extension.' });
        }
        if (extension.status !== 'approved') {
            return res.status(400).json({ message: 'Extension is not in "approved" status. Payment cannot be confirmed.' });
        }

        const paymentToConfirm = extension.booking.payments.find(p => p.status === 'awaiting_tenant_payment' && p.datePaid.toDateString() === extension.requestedAt.toDateString());

        if (!paymentToConfirm) {
            return res.status(400).json({ message: 'No pending payment found for this extension.' });
        }

        const [updatedExtension, updatedBooking, updatedPayment] = await prisma.$transaction([
            prisma.extension.update({
                where: { id: parseInt(extensionId) },
                data: { status: 'approved' },
            }),
            prisma.booking.update({
                where: { id: extension.booking.id },
                data: { endDate: extension.newEndDate },
            }),
            prisma.payment.update({
                where: { id: paymentToConfirm.id },
                data: { status: 'completed', datePaid: new Date() },
            }),
        ]);

        res.status(200).json({ message: 'Extension payment confirmed. Booking end date updated.', extension: updatedExtension, booking: updatedBooking, payment: updatedPayment });

    } catch (error) {
        console.error('Error confirming extension payment:', error);
        res.status(500).json({ message: 'Server error during extension payment confirmation.' });
    }
};
// --- NEW: Controller for Manual Status Update ---
export const updateFlatStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;

  if (!userId || req.user?.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized.' });
  }
  if (status !== 'available' && status !== 'unavailable') {
    return res.status(400).json({ message: 'Invalid status provided.' });
  }

  try {
    const flat = await prisma.flat.findUnique({
      where: { id: parseInt(id) },
      include: { bookings: { where: { status: { in: ['pending', 'approved', 'active'] } } } }
    });

    if (!flat) {
      return res.status(404).json({ message: 'Flat not found.' });
    }
    if (flat.ownerId !== userId) {
      return res.status(403).json({ message: 'You do not own this flat.' });
    }
    if (flat.bookings.length > 0) {
      return res.status(400).json({ message: 'Cannot change status while flat has active or pending bookings.' });
    }

    const updatedFlat = await prisma.flat.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.status(200).json(updatedFlat);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating flat status.' });
  }
};