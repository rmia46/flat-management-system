// backend/src/controllers/reviewController.ts
import { Request, Response } from 'express';
import prisma from '../db';

// --- Create a Review ---
export const createReview = async (req: Request, res: Response) => {
  const { flatId } = req.params;
  const { ratingGiven, comment } = req.body;
  const reviewerId = req.user?.id;
  const reviewerRole = req.user?.userType;

  if (!reviewerId || !reviewerRole) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  if (!ratingGiven || ratingGiven < 1 || ratingGiven > 5) {
    return res.status(400).json({ message: 'A rating between 1 and 5 is required.' });
  }

  try {
    // --- Validation: Check if the user is eligible to review ---
    // For a tenant to review a flat, they must have a past booking.
    if (reviewerRole === 'tenant') {
      const validBooking = await prisma.booking.findFirst({
        where: {
          userId: reviewerId,
          flatId: parseInt(flatId),
          // Check for bookings that have ended
          endDate: {
            lt: new Date(),
          },
          status: 'active', // Or 'expired' if you add that status
        },
      });

      if (!validBooking) {
        return res.status(403).json({ message: 'You can only review flats after your booking is complete.' });
      }
    }
    // (Future enhancement: Add logic for owners to review tenants)

    // --- Create the review and update the flat's average rating ---
    const [newReview] = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          flatId: parseInt(flatId),
          reviewerId,
          reviewerRole,
          ratingGiven,
          comment,
          dateSubmitted: new Date(),
        },
      });

      // Recalculate the average rating for the flat
      const aggregateRatings = await tx.review.aggregate({
        _avg: {
          ratingGiven: true,
        },
        where: {
          flatId: parseInt(flatId),
        },
      });

      const newAverageRating = aggregateRatings._avg.ratingGiven;

      await tx.flat.update({
        where: { id: parseInt(flatId) },
        data: { rating: newAverageRating },
      });

      return [review];
    });

    res.status(201).json({ message: 'Review submitted successfully.', review: newReview });
  } catch (error) {
    console.error('Error creating review:', error);
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
        // Include the reviewer's name with the review
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

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error while fetching reviews.' });
  }
};