// frontend/src/components/reviews/ReviewCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Review {
  ratingGiven: number;
  comment: string | null;
  dateSubmitted: string;
  reviewer: {
    firstName: string;
    lastName: string;
    userType: string;
  };
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
  const isOwnerReview = review.reviewer.userType === 'owner';
  
  return (
    <Card className="border-l-4 border-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-semibold flex items-center gap-2">
            {review.reviewer.firstName} {review.reviewer.lastName.charAt(0)}.
            {isOwnerReview && <Badge variant="secondary" className="px-2 py-0">Owner</Badge>}
          </CardTitle>
          <StarRating rating={review.ratingGiven} />
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(review.dateSubmitted).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{review.comment || 'No comment provided.'}</p>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;