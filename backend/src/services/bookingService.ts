// backend/src/services/bookingService.ts
import prisma from '../db';
import AppError from '../utils/appError';

export const createBooking = async (flatId: number, tenantId: number, startDate: string, endDate: string) => {
    const flat = await prisma.flat.findUnique({
        where: { id: flatId },
        select: { id: true, status: true, monthlyRentalCost: true, ownerId: true }
    });

    if (!flat) {
        throw new AppError('Flat not found.', 404);
    }

    if (flat.ownerId === tenantId) {
        throw new AppError('Owners cannot book their own flats.', 403);
    }

    const conflictingBookings = await prisma.booking.findMany({
        where: {
            flatId: flat.id,
            status: 'active',
            OR: [
                {
                    startDate: { lte: new Date(endDate) },
                    endDate: { gte: new Date(startDate) },
                },
            ],
        },
    });

    if (conflictingBookings.length > 0) {
        throw new AppError('Booking dates conflict with an existing active reservation.', 400);
    }

    const newBooking = await prisma.booking.create({
        data: {
            user: { connect: { id: tenantId } },
            flat: { connect: { id: flat.id } },
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'pending',
            autoRenewEnabled: true,
            payments: {
                create: {
                    amount: flat.monthlyRentalCost,
                    datePaid: new Date(),
                    status: 'pending',
                    paymentMethod: 'system',
                },
            },
        },
    });

    await prisma.flat.update({
        where: {id: flat.id},
        data: {status: 'pending'}
    })

    return newBooking;
};

export const getOwnerBookings = async (ownerId: number) => {
    const bookings = await prisma.booking.findMany({
        where: {
            flat: {
                ownerId: ownerId,
            },
        },
        include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            flat: { select: { id: true, address: true, houseName: true } },
            payments: true,
            extensions: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return bookings;
};

export const approveBooking = async (bookingId: number, ownerId: number) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { flat: { select: { ownerId: true, id : true } }, payments: true },
    });

    if (!booking) {
        throw new AppError('Booking request not found.', 404);
    }

    if (booking.flat.ownerId !== ownerId) {
        throw new AppError('Not authorized to approve this booking.', 403);
    }

    if (booking.status !== 'pending') {
        throw new AppError('Booking is not in "pending" status for approval.', 400);
    }

    const [updatedBooking] = await prisma.$transaction([
        prisma.booking.update({
            where: { id: bookingId },
            data: { 
                status: 'approved',
                approvedAt: new Date(),
            },
        }),
        prisma.payment.updateMany({
            where: { bookingId: bookingId, status: 'pending' },
            data: { status: 'awaiting_tenant_payment' },
        }),
    ]);
    
    return updatedBooking;
};

export const disapproveBooking = async (bookingId: number, ownerId: number) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { flat: { select: { id: true, ownerId: true } }, payments: true },
    });

    if (!booking) {
        throw new AppError('Booking request not found.', 404);
    }

    if (booking.flat.ownerId !== ownerId) {
        throw new AppError('Not authorized to disapprove this booking.', 403);
    }

    if (booking.status !== 'pending' && booking.status !== 'approved') {
        throw new AppError('Booking cannot be disapproved from its current status.', 400);
    }

    const [updatedBooking] = await prisma.$transaction([
        prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'disapproved', cancelledAt: new Date() },
        }),
        prisma.payment.updateMany({
            where: { bookingId: bookingId, status: { in: ['pending', 'awaiting_tenant_payment'] } },
            data: { status: 'failed' },
        }),
        prisma.flat.update({
            where: { id: booking.flat.id },
            data: { status: 'available' }
        })
    ]);

    return updatedBooking;
};

export const getTenantBookings = async (tenantId: number) => {
    const bookings = await prisma.booking.findMany({
        where: {
            userId: tenantId,
        },
        include: {
            flat: { select: { id: true, address: true, houseName: true, owner: { select: { firstName: true, lastName: true } } } },
            payments: true,
            extensions: true,
            review: true, // <-- Add this line
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return bookings;
};

export const cancelBooking = async (bookingId: number, tenantId: number) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { userId: true, flat: { select: { id: true } }, status: true },
    });

    if (!booking) {
        throw new AppError('Booking not found.', 404);
    }

    if (booking.userId !== tenantId) {
        throw new AppError('Not authorized to cancel this booking.', 403);
    }

    if (booking.status !== 'pending' && booking.status !== 'approved') {
        throw new AppError('Only pending or approved (awaiting payment) bookings can be cancelled by tenant.', 400);
    }

    await prisma.$transaction([
        prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'cancelled', cancelledAt: new Date() },
        }),
        prisma.payment.updateMany({
            where: { bookingId: bookingId, status: { in: ['pending', 'awaiting_tenant_payment'] } },
            data: { status: 'failed' },
        }),
        prisma.flat.update({
            where: { id: booking.flat.id },
            data: { status: 'available' }
        })
    ]);
};

export const confirmPayment = async (bookingId: number, tenantId: number) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { 
            flat: { select: { id: true, status: true } }, 
            payments: { where: { status: 'awaiting_tenant_payment' } }
        },
    });

    if (!booking) {
        throw new AppError('Booking not found.', 404);
    }

    if (booking.userId !== tenantId) {
        throw new AppError('Not authorized to confirm payment for this booking.', 403);
    }

    if (booking.status !== 'approved') {
        throw new AppError('Booking is not in "approved" status. Payment cannot be confirmed.', 400);
    }

    if (booking.payments.length === 0) {
        throw new AppError('No pending payments found for this booking.', 400);
    }
    
    const paymentToConfirm = booking.payments[0];

    const [updatedBooking, updatedPayment] = await prisma.$transaction([
        prisma.booking.update({
            where: { id: bookingId },
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

    return { updatedBooking, updatedPayment };
};

export const requestExtension = async (bookingId: number, tenantId: number, newEndDate: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, userId: true, endDate: true, flatId: true, flat: { select: { monthlyRentalCost: true } } },
    });

    if (!booking) {
        throw new AppError('Booking not found.', 404);
    }
    if (booking.userId !== tenantId) {
        throw new AppError('Not authorized to request extension for this booking.', 403);
    }

    const currentEndDate = new Date(booking.endDate);
    const requestedNewEndDate = new Date(newEndDate);

    if (requestedNewEndDate <= currentEndDate) {
        throw new AppError('New end date must be after the current end date.', 400);
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

    return newExtension;
};

export const approveExtension = async (extensionId: number, ownerId: number) => {
    const extension = await prisma.extension.findUnique({
        where: { id: extensionId },
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
        throw new AppError('Extension request not found.', 404);
    }
    if (extension.booking.flat.ownerId !== ownerId) {
        throw new AppError('Not authorized to approve this extension.', 403);
    }
    if (extension.status !== 'pending') {
        throw new AppError('Extension is not in "pending" status for approval.', 400);
    }

    const pendingExtensionPayment = extension.booking.payments.find(p => p.status === 'pending' && p.datePaid.toDateString() === extension.requestedAt.toDateString());

    if (!pendingExtensionPayment) {
        throw new AppError('No pending payment found for this extension request.', 400);
    }

    const [updatedExtension] = await prisma.$transaction([
        prisma.extension.update({
            where: { id: extensionId },
            data: { status: 'approved' },
        }),
        prisma.payment.update({
            where: { id: pendingExtensionPayment.id },
            data: { status: 'awaiting_tenant_payment' },
        }),
    ]);

    return updatedExtension;
};

export const rejectExtension = async (extensionId: number, ownerId: number) => {
    const extension = await prisma.extension.findUnique({
        where: { id: extensionId },
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
        throw new AppError('Extension request not found.', 404);
    }
    if (extension.booking.flat.ownerId !== ownerId) {
        throw new AppError('Not authorized to reject this extension.', 403);
    }
    if (extension.status !== 'pending' && extension.status !== 'approved') {
        throw new AppError('Extension cannot be rejected from its current status.', 400);
    }

    const pendingExtensionPayment = extension.booking.payments.find(p => p.status === 'pending' && p.datePaid.toDateString() === extension.requestedAt.toDateString());

    const [updatedExtension] = await prisma.$transaction([
        prisma.extension.update({
            where: { id: extensionId },
            data: { status: 'rejected' },
        }),
        ...(pendingExtensionPayment ? [
            prisma.payment.update({
                where: { id: pendingExtensionPayment.id },
                data: { status: 'failed' },
            })
        ] : []),
    ]);

    return updatedExtension;
};

export const confirmExtensionPayment = async (extensionId: number, tenantId: number) => {
    const extension = await prisma.extension.findUnique({
        where: { id: extensionId },
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
        throw new AppError('Extension not found.', 404);
    }
    if (extension.booking.userId !== tenantId) {
        throw new AppError('Not authorized to confirm payment for this extension.', 403);
    }
    if (extension.status !== 'approved') {
        throw new AppError('Extension is not in "approved" status. Payment cannot be confirmed.', 400);
    }

    const paymentToConfirm = extension.booking.payments.find(p => p.status === 'awaiting_tenant_payment' && p.datePaid.toDateString() === extension.requestedAt.toDateString());

    if (!paymentToConfirm) {
        throw new AppError('No pending payment found for this extension.', 400);
    }

    const [updatedExtension, updatedBooking, updatedPayment] = await prisma.$transaction([
        prisma.extension.update({
            where: { id: extensionId },
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

    return { updatedExtension, updatedBooking, updatedPayment };
};