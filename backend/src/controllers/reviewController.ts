// backend/src/controllers/reviewController.ts
import { Request, Response } from 'express';
import prisma from '../db';
import { Decimal } from '@prisma/client/runtime/library';

// --- Create or Update a Review ---
export const upsertReview = async (req: Request, res: Response) => {
  const { bookingId, flatId, reviewedUserId, comment, ...criteria } = req.body;
  const reviewerId = req.user?.id;

  if (!reviewerId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  if (!bookingId || !flatId) {
    return res.status(400).json({ message: 'Booking ID and Flat ID are required.' });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { flat: true },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Associated booking not found.' });
    }
    
    // CHANGED: Find an existing review by both bookingId AND reviewerId
    const existingReview = await prisma.review.findFirst({
        where: { bookingId: parseInt(bookingId), reviewerId: reviewerId }
    });

    const isTenantOfBooking = booking.userId === reviewerId;
    const isOwnerOfFlat = booking.flat.ownerId === reviewerId;

    if (!isTenantOfBooking && !isOwnerOfFlat) {
      return res.status(403).json({ message: 'You can only review a booking that you are either the tenant or the owner of.' });
    }
    
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
      return res.status(400).json({ message: 'At least one rating criterion is required.' });
    }

    reviewData.ratingGiven = new Decimal(totalRating / criteriaCount);

    let savedReview;
    if (existingReview) {
      if (existingReview.reviewerId !== reviewerId) {
        return res.status(403).json({ message: 'You can only edit a review that you have written yourself.' });
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

    const aggregateRatings = await prisma.review.aggregate({
      _avg: { ratingGiven: true },
      where: { flatId: parseInt(flatId) },
    });
    const newAverageRating = aggregateRatings._avg.ratingGiven;
    
    await prisma.flat.update({
      where: { id: parseInt(flatId) },
      data: { rating: newAverageRating },
    });

    res.status(201).json({ message: existingReview ? 'Review updated successfully.' : 'Review submitted successfully.', review: savedReview });

  } catch (error) {
    console.error('Error upserting review:', error);
    res.status(500).json({ message: 'Server error while submitting review.' });
  }
};  



// --- Get Reviews for a Flat ---
export const getReviewsForFlat = async (req: Request, res: Response) => {
  const { flatId } = req.params;

  try {
    const reviews = await prisma.review.findMany({
      where: {
        flatId: parseInt(flatId),
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            userType: true,
          },
        },
      },
      orderBy: {
        dateSubmitted: 'desc',
      },
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error while fetching reviews.' });
  }
};