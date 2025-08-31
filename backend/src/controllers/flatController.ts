// backend/src/controllers/flatController.ts
import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import * as flatService from '../services/flatService';
import * as bookingService from '../services/bookingService';
import * as amenityService from '../services/amenityService';
import {
    createFlatSchema,
    updateFlatSchema,
    updateFlatStatusSchema
} from '../validations/flatValidation';
import {
    createBookingSchema,
    requestExtensionSchema
} from '../validations/bookingValidation';
import { Prisma } from '@prisma/client';
import prisma from '../db';

// --- Flats ---
export const createFlat = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'owner') {
        return next(new AppError('Not authorized. Only owners can create flats.', 403));
    }
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
        return next(new AppError('At least one image is required.', 400));
    }

    const data = createFlatSchema.parse(req.body);
    const newFlat = await flatService.createFlat(data, req.user.id, files);

    res.status(201).json({ 
        status: 'success',
        message: 'Flat created successfully', 
        data: { flat: newFlat } 
    });
});

export const getAllFlats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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

    res.status(200).json({
        status: 'success',
        results: flats.length,
        data: { flats },
    });
});

export const getOwnerFlats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'owner') {
        return next(new AppError('Not authorized. Only owners can view their flats.', 403));
    }

    const ownerFlats = await flatService.getOwnerFlats(req.user.id);

    res.status(200).json({
        status: 'success',
        results: ownerFlats.length,
        data: { flats: ownerFlats },
    });
});

export const getFlatById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userType = req.user?.userType;

    const flatData = await flatService.getFlatById(parseInt(id), userId, userType);

    if (!flatData) {
        return next(new AppError('Flat not found.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { flat: flatData },
    });
});

export const updateFlat = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return next(new AppError('Not authenticated.', 401));
    }

    const data = updateFlatSchema.parse(req.body);
    const updatedFlat = await flatService.updateFlat(parseInt(id), data, userId, req.file);

    res.status(200).json({
        status: 'success',
        message: 'Flat updated successfully.',
        data: { flat: updatedFlat },
    });
});

export const deleteFlat = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return next(new AppError('Not authenticated.', 401));
    }

    await flatService.deleteFlat(parseInt(id), userId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

export const updateFlatStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = updateFlatStatusSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId || req.user?.userType !== 'owner') {
        return next(new AppError('Not authorized.', 403));
    }

    const flat = await prisma.flat.findUnique({
        where: { id: parseInt(id) },
        include: { bookings: { where: { status: { in: ['pending', 'approved', 'active'] } } } }
    });

    if (!flat) {
        return next(new AppError('Flat not found.', 404));
    }
    if (flat.ownerId !== userId) {
        return next(new AppError('You do not own this flat.', 403));
    }
    if (flat.bookings.length > 0) {
        return next(new AppError('Cannot change status while flat has active or pending bookings.', 400));
    }

    const updatedFlat = await prisma.flat.update({
        where: { id: parseInt(id) },
        data: { status },
    });

    res.status(200).json({
        status: 'success',
        data: { flat: updatedFlat },
    });
});


// --- Bookings ---
export const createBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id: flatId } = req.params;
    const tenantId = req.user?.id;

    if (!tenantId || req.user?.userType !== 'tenant') {
        return next(new AppError('Not authorized. Only tenants can book flats.', 403));
    }

    const { startDate, endDate } = createBookingSchema.parse(req.body);

    const newBooking = await bookingService.createBooking(parseInt(flatId), tenantId, startDate, endDate);

    res.status(201).json({
        status: 'success',
        message: 'Booking request created successfully. Awaiting owner approval.',
        data: { booking: newBooking },
    });
});

export const getOwnerBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const ownerId = req.user?.id;

    if (!ownerId || req.user?.userType !== 'owner') {
        return next(new AppError('Not authorized. Only owners can view booking requests.', 403));
    }

    const bookings = await bookingService.getOwnerBookings(ownerId);

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: { bookings },
    });
});

export const approveBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId || req.user?.userType !== 'owner') {
        return next(new AppError('Not authorized. Only owners can approve bookings.', 403));
    }

    const updatedBooking = await bookingService.approveBooking(parseInt(id), ownerId);

    res.status(200).json({
        status: 'success',
        message: 'Booking approved by owner. Awaiting tenant payment.',
        data: { booking: updatedBooking },
    });
});

export const disapproveBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId || req.user?.userType !== 'owner') {
        return next(new AppError('Not authorized. Only owners can disapprove bookings.', 403));
    }

    const updatedBooking = await bookingService.disapproveBooking(parseInt(id), ownerId);

    res.status(200).json({
        status: 'success',
        message: 'Booking disapproved successfully.',
        data: { booking: updatedBooking },
    });
});

export const getTenantBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user?.id;

    if (!tenantId || req.user?.userType !== 'tenant') {
        return next(new AppError('Not authorized. Only tenants can view their bookings.', 403));
    }

    const bookings = await bookingService.getTenantBookings(tenantId);

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: { bookings },
    });
});

export const cancelBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const tenantId = req.user?.id;

    if (!tenantId || req.user?.userType !== 'tenant') {
        return next(new AppError('Not authorized. Only tenants can cancel their own bookings.', 403));
    }

    await bookingService.cancelBooking(parseInt(id), tenantId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

export const confirmPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // Booking ID
    const tenantId = req.user?.id;

    if (!tenantId || req.user?.userType !== 'tenant') {
        return next(new AppError('Not authorized. Only tenants can confirm payment.', 403));
    }

    const { updatedBooking, updatedPayment } = await bookingService.confirmPayment(parseInt(id), tenantId);

    res.status(200).json({
        status: 'success',
        message: 'Payment confirmed. Booking is now active.',
        data: { booking: updatedBooking, payment: updatedPayment },
    });
});

export const requestExtension = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id: bookingId } = req.params;
    const tenantId = req.user?.id;
    const { newEndDate } = requestExtensionSchema.parse(req.body);

    if (!tenantId || req.user?.userType !== 'tenant') {
        return next(new AppError('Not authorized. Only tenants can request extensions.', 403));
    }

    const newExtension = await bookingService.requestExtension(parseInt(bookingId), tenantId, newEndDate);

    res.status(201).json({
        status: 'success',
        message: 'Extension request submitted. Awaiting owner approval.',
        data: { extension: newExtension },
    });
});

export const approveExtension = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id: extensionId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId || req.user?.userType !== 'owner') {
        return next(new AppError('Not authorized. Only owners can approve extensions.', 403));
    }

    const updatedExtension = await bookingService.approveExtension(parseInt(extensionId), ownerId);

    res.status(200).json({
        status: 'success',
        message: 'Extension approved by owner. Awaiting tenant payment.',
        data: { extension: updatedExtension },
    });
});

export const rejectExtension = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id: extensionId } = req.params;
    const ownerId = req.user?.id;

    if (!ownerId || req.user?.userType !== 'owner') {
        return next(new AppError('Not authorized. Only owners can reject extensions.', 403));
    }

    const updatedExtension = await bookingService.rejectExtension(parseInt(extensionId), ownerId);

    res.status(200).json({
        status: 'success',
        message: 'Extension request rejected.',
        data: { extension: updatedExtension },
    });
});

export const confirmExtensionPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id: extensionId } = req.params;
    const tenantId = req.user?.id;

    if (!tenantId || req.user?.userType !== 'tenant') {
        return next(new AppError('Not authorized. Only tenants can confirm extension payment.', 403));
    }

    const { updatedExtension, updatedBooking, updatedPayment } = await bookingService.confirmExtensionPayment(parseInt(extensionId), tenantId);

    res.status(200).json({
        status: 'success',
        message: 'Extension payment confirmed. Booking end date updated.',
        data: { extension: updatedExtension, booking: updatedBooking, payment: updatedPayment },
    });
});


// --- Amenities ---
export const getAllAmenities = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const amenities = await amenityService.getAllAmenities();
    res.status(200).json({
        status: 'success',
        results: amenities.length,
        data: { amenities },
    });
});