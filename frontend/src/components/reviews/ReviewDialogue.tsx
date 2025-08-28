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
  flatId: number | null;
  flatAddress: string | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

const ReviewDialog: React.FC<ReviewDialogProps> = ({
  flatId,
  flatAddress,
  isOpen,
  onClose,
  onReviewSubmitted
}) => {
  if (!flatId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            You are reviewing the flat at: {flatAddress}
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          flatId={flatId}
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