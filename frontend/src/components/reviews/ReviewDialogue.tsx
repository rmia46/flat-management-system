// frontend/src/components/reviews/ReviewDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ReviewForm from './ReviewForm';

interface ReviewDialogProps {
  booking: any | null;
  existingReview?: any | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

const ReviewDialog: React.FC<ReviewDialogProps> = ({
  booking,
  existingReview,
  isOpen,
  onClose,
  onReviewSubmitted
}) => {
  if (!booking) return null;

  const title = existingReview ? 'Edit Your Review' : 'Leave a Review';
  const description = `You are reviewing the booking for the flat at: ${booking.flat.address}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ReviewForm
          booking={booking}
          existingReview={existingReview}
          onReviewSubmitted={() => {
            onReviewSubmitted();
            onClose(); // Close the dialog after submission
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;