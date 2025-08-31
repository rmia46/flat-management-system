// backend/src/controllers/reviewController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { Decimal } from '@prisma/client/runtime/library';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';

// --- Create or Update a Review ---
export const upsertReview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId, flatId, reviewedUserId, comment, ...criteria } = req.body;
  const reviewerId = req.user?.id;

  if (!reviewerId) {
    return next(new AppError('Not authenticated.', 401));
  }
  if (!bookingId || !flatId) {
    return next(new AppError('Booking ID and Flat ID are required.', 400));
  }

  // --- Eligibility Check ---
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { flat: true },
  });

  if (!booking) {
    return next(new AppError('Associated booking not found.', 404));
  }

  const existingReview = await prisma.review.findUnique({
      where: { bookingId: parseInt(bookingId) }
  });

  const isTenantOfBooking = booking.userId === reviewerId;
  const isOwnerOfFlat = booking.flat.ownerId === reviewerId;

  if (!isTenantOfBooking && !isOwnerOfFlat) {
    return next(new AppError('You are not authorized to review this booking.', 403));
  }

  // --- Data Preparation & Calculation ---
  let reviewData: any = {
    comment,
    flatId: parseInt(flatId),
    reviewerId,
    bookingId: parseInt(bookingId),
    dateSubmitted: new Date(),
  };
  let totalRating = 0;
  let criteriaCount = 0;

  if (isTenantOfBooking) {
    reviewData.reviewedUserId = booking.flat.ownerId;
    const tenantCriteria = ['flatQuality', 'hygiene', 'location', 'ownerBehavior'];
    tenantCriteria.forEach(key => {
      if (criteria[key] !== undefined) {
        const rating = parseInt(criteria[key]);
        reviewData[key] = rating;
        totalRating += rating;
        criteriaCount++;
      }
    });
  } else if (isOwnerOfFlat) {
    reviewData.reviewedUserId = booking.userId;
    const ownerCriteria = ['tenantBehavior', 'cooperation'];
    ownerCriteria.forEach(key => {
      if (criteria[key] !== undefined) {
        const rating = parseInt(criteria[key]);
        reviewData[key] = rating;
        totalRating += rating;
        criteriaCount++;
      }
    });
  }

  if (criteriaCount === 0) {
    return next(new AppError('At least one rating criterion is required.', 400));
  }

  reviewData.ratingGiven = new Decimal(totalRating / criteriaCount);

  // --- Upsert Logic ---
  let savedReview;
  if (existingReview) {
    if (existingReview.reviewerId !== reviewerId) {
      return next(new AppError('You are not authorized to edit this review.', 403));
    }
    savedReview = await prisma.review.update({
      where: { id: existingReview.id },
      data: reviewData,
    });
  } else {
    savedReview = await prisma.review.create({
      data: reviewData,
    });
  }

  // Recalculate the flat's average rating
  const aggregateRatings = await prisma.review.aggregate({
    _avg: { ratingGiven: true },
    where: { flatId: parseInt(flatId) },
  });
  const newAverageRating = aggregateRatings._avg.ratingGiven;

  await prisma.flat.update({
    where: { id: parseInt(flatId) },
    data: { rating: newAverageRating },
  });

  res.status(201).json({
    status: 'success',
    message: existingReview ? 'Review updated successfully.' : 'Review submitted successfully.',
    data: { review: savedReview },
  });
});


// --- Get Reviews for a Flat ---
export const getReviewsForFlat = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { flatId } = req.params;

  const reviews = await prisma.review.findMany({
    where: {
      flatId: parseInt(flatId),
    },
    include: {
      reviewer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      dateSubmitted: 'desc',
    },
  });

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

// --- Get Reviews for a User (as a Tenant or Owner) ---
export const getReviewsForUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  const reviews = await prisma.review.findMany({
    where: {
      reviewedUserId: parseInt(userId),
    },
    include: {
      reviewer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      flat: {
        select: {
          address: true,
        },
      },
    },
    orderBy: {
      dateSubmitted: 'desc',
    },
  });

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

// --- Get a Specific Review by Booking ID ---
export const getReviewByBookingId = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError('Not authenticated.', 401));
  }

  const review = await prisma.review.findUnique({
    where: {
      bookingId: parseInt(bookingId),
    },
  });

  if (!review) {
    return next(new AppError('Review not found for this booking.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { review },
  });
});

// --- Delete a Review ---
export const deleteReview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { reviewId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError('Not authenticated.', 401));
  }

  const review = await prisma.review.findUnique({
    where: { id: parseInt(reviewId) },
  });

  if (!review) {
    return next(new AppError('Review not found.', 404));
  }

  if (review.reviewerId !== userId) {
    return next(new AppError('You are not authorized to delete this review.', 403));
  }

  await prisma.review.delete({
    where: { id: parseInt(reviewId) },
  });

  // After deleting, recalculate the flat's average rating
  const aggregateRatings = await prisma.review.aggregate({
    _avg: { ratingGiven: true },
    where: { flatId: review.flatId },
  });
  const newAverageRating = aggregateRatings._avg.ratingGiven;

  await prisma.flat.update({
    where: { id: review.flatId },
    data: { rating: newAverageRating },
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
