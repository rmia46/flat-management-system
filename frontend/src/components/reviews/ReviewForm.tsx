// frontend/src/components/reviews/ReviewForm.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { upsertReview } from '@/services/api';
import { toast } from 'sonner';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

// Reusable Star Rating Input Component
const StarRatingInput = ({ label, rating, setRating }: { label: string, rating: number, setRating: (rating: number) => void }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          return (
            <Star
              key={starValue}
              size={20}
              className={`cursor-pointer transition-colors ${
                starValue <= (hoverRating || rating)
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }`}
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(0)}
            />
          );
        })}
      </div>
    </div>
  );
};

interface ReviewFormProps {
  booking: any; // Pass the whole booking object
  existingReview?: any; // Pass existing review if editing
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ booking, existingReview, onReviewSubmitted }) => {
  const { user } = useAuth();
  
  // State for Tenant's criteria
  const [flatQuality, setFlatQuality] = useState(0);
  const [hygiene, setHygiene] = useState(0);
  const [location, setLocation] = useState(0);
  const [ownerBehavior, setOwnerBehavior] = useState(0);
  
  // State for Owner's criteria
  const [tenantBehavior, setTenantBehavior] = useState(0);
  const [cooperation, setCooperation] = useState(0);

  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const isTenantReviewing = user?.userType === 'tenant';

  // NEW: useEffect to populate form fields when existingReview changes
  useEffect(() => {
    if (existingReview) {
      setComment(existingReview.comment || '');
      if (isTenantReviewing) {
        setFlatQuality(existingReview.flatQuality || 0);
        setHygiene(existingReview.hygiene || 0);
        setLocation(existingReview.location || 0);
        setOwnerBehavior(existingReview.ownerBehavior || 0);
      } else { // Must be owner reviewing tenant
        setTenantBehavior(existingReview.tenantBehavior || 0);
        setCooperation(existingReview.cooperation || 0);
      }
    } else {
      // Reset form if no existing review (e.g., switching from edit to new review)
      setComment('');
      setFlatQuality(0);
      setHygiene(0);
      setLocation(0);
      setOwnerBehavior(0);
      setTenantBehavior(0);
      setCooperation(0);
    }
  }, [existingReview, isTenantReviewing]); // Re-run when existingReview or userType changes

  // Calculate the overall rating based on the criteria
  const overallRating = useMemo(() => {
    const ratings = isTenantReviewing
      ? [flatQuality, hygiene, location, ownerBehavior]
      : [tenantBehavior, cooperation];
    
    const validRatings = ratings.filter(r => r > 0);
    if (validRatings.length === 0) return 0;
    
    const sum = validRatings.reduce((acc, r) => acc + r, 0);
    return (sum / validRatings.length).toFixed(2);
  }, [flatQuality, hygiene, location, ownerBehavior, tenantBehavior, cooperation, isTenantReviewing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const reviewData: any = {
      bookingId: booking.id,
      flatId: booking.flat.id,
      comment,
    };

    if (isTenantReviewing) {
      Object.assign(reviewData, { flatQuality, hygiene, location, ownerBehavior });
    } else {
      Object.assign(reviewData, { tenantBehavior, cooperation });
    }

    if (parseFloat(String(overallRating)) === 0) {
      toast.error('Please provide a rating for at least one criterion.');
      return;
    }
    
    setLoading(true);
    try {
      await upsertReview(reviewData);
      toast.success(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
      onReviewSubmitted();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* --- Criteria Section --- */}
      <div className="space-y-2 rounded-md border p-4">
        {isTenantReviewing ? (
          <>
            <StarRatingInput label="Flat Quality" rating={flatQuality} setRating={setFlatQuality} />
            <StarRatingInput label="Hygiene" rating={hygiene} setRating={setHygiene} />
            <StarRatingInput label="Location" rating={location} setRating={setLocation} />
            <StarRatingInput label="Owner's Behavior" rating={ownerBehavior} setRating={setOwnerBehavior} />
          </>
        ) : (
          <>
            <StarRatingInput label="Tenant's Behavior" rating={tenantBehavior} setRating={setTenantBehavior} />
            <StarRatingInput label="Cooperation" rating={cooperation} setRating={setCooperation} />
          </>
        )}
      </div>

      {/* --- Overall Rating Display --- */}
      <div className="flex justify-between items-center rounded-md border bg-muted/50 p-4">
        <h4 className="font-semibold">Overall Rating</h4>
        <p className="text-2xl font-bold text-primary">{overallRating}</p>
      </div>

      {/* --- Comment Section --- */}
      <div>
        <label htmlFor="comment" className="text-sm font-medium mb-2 block">Your Comments (Optional)</label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isTenantReviewing ? "How was your stay? What did you like or dislike?" : "Any comments about the tenant?"}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <LoadingSpinner size={16} className="mr-2" /> : (existingReview ? 'Update Review' : 'Submit Review')}
      </Button>
    </form>
  );
};

export default ReviewForm;