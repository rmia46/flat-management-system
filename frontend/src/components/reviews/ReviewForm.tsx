// frontend/src/components/reviews/ReviewForm.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { createReview } from '@/services/api';
import { toast } from 'sonner';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ReviewFormProps {
  flatId: number;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ flatId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    setLoading(true);
    try {
      await createReview(flatId, { ratingGiven: rating, comment });
      toast.success('Thank you for your review!');
      onReviewSubmitted();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
      <h4 className="font-semibold">Leave a Review</h4>
      <div>
        <label className="text-sm font-medium mb-2 block">Your Rating</label>
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, index) => {
            const starRating = index + 1;
            return (
              <Star
                key={starRating}
                size={24}
                className={`cursor-pointer transition-colors ${
                  starRating <= (hoverRating || rating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300'
                }`}
                onClick={() => setRating(starRating)}
                onMouseEnter={() => setHoverRating(starRating)}
                onMouseLeave={() => setHoverRating(0)}
              />
            );
          })}
        </div>
      </div>
      <div>
        <label htmlFor="comment" className="text-sm font-medium mb-2 block">Your Comments (Optional)</label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was your stay? What did you like or dislike?"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <LoadingSpinner size={16} className="mr-2" /> : 'Submit Review'}
      </Button>
    </form>
  );
};

export default ReviewForm;