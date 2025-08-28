// frontend/src/components/reviews/ReviewCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface Review {
  ratingGiven: number;
  comment: string | null;
  dateSubmitted: string;
  reviewer: {
    firstName: string;
    lastName: string;
  };
  // New criteria fields
  flatQuality?: number;
  hygiene?: number;
  location?: number;
  ownerBehavior?: number;
  tenantBehavior?: number;
  cooperation?: number;
}

interface ReviewCardProps {
  review: Review;
}

// Helper to render star ratings
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
      />
    ))}
  </div>
);

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const isTenantReview = review.flatQuality !== undefined; // Heuristic to determine if it's a tenant's review of a flat/owner

  return (
    <Card className="border-l-4 border-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-semibold">
            {review.reviewer.firstName} {review.reviewer.lastName.charAt(0)}.
          </CardTitle>
          <StarRating rating={review.ratingGiven} />
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(review.dateSubmitted).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{review.comment || 'No comment provided.'}</p>
        
        <div className="space-y-1 text-sm">
          {isTenantReview ? (
            <>
              {review.flatQuality && <p><strong>Flat Quality:</strong> <StarRating rating={review.flatQuality} /></p>}
              {review.hygiene && <p><strong>Hygiene:</strong> <StarRating rating={review.hygiene} /></p>}
              {review.location && <p><strong>Location:</strong> <StarRating rating={review.location} /></p>}
              {review.ownerBehavior && <p><strong>Owner's Behavior:</strong> <StarRating rating={review.ownerBehavior} /></p>}
            </>
          ) : (
            <>
              {review.tenantBehavior && <p><strong>Tenant's Behavior:</strong> <StarRating rating={review.tenantBehavior} /></p>}
              {review.cooperation && <p><strong>Cooperation:</strong> <StarRating rating={review.cooperation} /></p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;