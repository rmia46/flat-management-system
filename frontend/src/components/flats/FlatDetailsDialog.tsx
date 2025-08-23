// frontend/src/components/flats/FlatDetailsDialog.tsx (CORRECTED)

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  getFlatById,
  createBooking,
  cancelBooking,
  approveBooking,
  disapproveBooking,
  confirmPayment,
  deleteFlat,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Define a more comprehensive Flat type to match backend 'select' and 'include'
interface FlatDetails {
  id: number;
  flatNumber?: string | null;
  floor?: number | null;
  houseName?: string | null;
  houseNumber?: string | null;
  address: string;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  monthlyRentalCost: number | null;
  utilityCost?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  balcony?: boolean | null;
  minimumStay?: number | null;
  description?: string | null;
  status: string;
  rating?: number | null;
  ownerId: number;
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    nid?: string | null;
  };
  images?: { id: number; url: string; isThumbnail: boolean }[];
  amenities?: { amenity: { id: number; name: string; description: string | null } }[];
}

interface FlatDetailsDialogProps {
  flatId: number | null;
  bookingId?: number | null;
  isOpen: boolean;
  onClose: () => void;
  // NEW: Added this prop to signal a list refresh in parent components
  onActionComplete?: () => void; 
}

const FlatDetailsDialog: React.FC<FlatDetailsDialogProps> = ({ flatId, bookingId, isOpen, onClose, onActionComplete }) => {
  const { isAuthenticated, user, isLoading, triggerRefresh } = useAuth();
  const navigate = useNavigate();
  const [flatDetails, setFlatDetails] = useState<FlatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '' });
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isOwnerActionLoading, setIsOwnerActionLoading] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  useEffect(() => {
    if (!flatId || !isOpen) {
      setFlatDetails(null);
      setLoading(false);
      setError('');
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getFlatById(flatId);
        setFlatDetails(response.data);
      } catch (err: any) {
        console.error('Error fetching flat details by ID:', err.response ? err.response.data : err.message);
        setError(err.response?.data?.message || 'Failed to load flat details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [flatId, isOpen, isAuthenticated, user, isLoading]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingLoading(true);

    if (!user || user.userType !== 'tenant') {
      toast.error('You must be a tenant to book a flat.');
      setIsBookingLoading(false);
      return;
    }

    if (!bookingDates.startDate || !bookingDates.endDate) {
      toast.error('Start and End dates are required.');
      setIsBookingLoading(false);
      return;
    }

    try {
      const bookingData = {
        startDate: new Date(bookingDates.startDate),
        endDate: new Date(bookingDates.endDate),
      };
      const response = await createBooking(flatId as number, bookingData);
      toast.success(response.data.message);
      onClose();
      triggerRefresh();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create booking.';
      toast.error(errorMessage);
      console.error('Booking creation failed:', err);
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      if (!bookingId) return;
      await cancelBooking(bookingId);
      toast.success('Booking cancelled successfully.');
      onClose();
      onActionComplete?.(); // Notify parent to refresh
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel booking.';
      toast.error(errorMessage);
      console.error("Cancellation failed:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsConfirmingPayment(true);
    try {
      if (!bookingId) return;
      await confirmPayment(bookingId);
      toast.success("Payment confirmed! Your booking is now active.");
      onClose();
      onActionComplete?.(); // Notify parent to refresh
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to confirm payment.';
      toast.error(errorMessage);
      console.error("Payment confirmation failed:", err);
    } finally {
      setIsConfirmingPayment(false);
    }
  };


  const handleExtendBooking = async () => {
    setIsExtending(true);
    try {
      toast.info('Feature coming soon! Extending booking...');
      onClose();
    } catch (err) {
      toast.error('Failed to request extension.');
      console.error("Extension failed:", err);
    } finally {
      setIsExtending(false);
    }
  };

  const handleOwnerAction = async (action: 'approve' | 'disapprove') => {
    setIsOwnerActionLoading(true);
    try {
      if (!bookingId) return;
      if (action === 'approve') {
        await approveBooking(bookingId);
        toast.success('Booking approved successfully!');
      } else {
        await disapproveBooking(bookingId);
        toast.info('Booking cancelled.');
      }
      onClose();
      onActionComplete?.(); // Notify parent to refresh
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to perform action.';
      toast.error(message);
      console.error(`Failed to ${action} booking:`, err);
    } finally {
      setIsOwnerActionLoading(false);
    }
  };

  const handleDeleteFlat = async () => {
    try {
      if (!flatId) return;
      await deleteFlat(flatId);
      toast.success('Flat deleted successfully.');
      onClose();
      onActionComplete?.(); // Notify parent to refresh
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete flat.';
      toast.error(message);
      console.error('Failed to delete flat:', err);
    }
  };

  const handleEditFlat = () => {
    if (flatId) {
        navigate(`/flats/edit/${flatId}`);
        onClose();
    }
  };
  
  
// NEW: A centralized function to render all buttons and actions
const renderButtons = () => {
    if (loading || !flatDetails) return null;

    const isOwnerOfThisFlat = user?.id === flatDetails.ownerId && user?.userType === 'owner';
    const isTenant = user?.userType === 'tenant';

    // Scenario 1: Unauthenticated User
    if (!isAuthenticated) {
        return (
          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Sign up or Login to book this flat.
            </p>
            <Button asChild className="mr-2">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        );
    }
    
    // Scenario 2: Owner of the flat
    if (isOwnerOfThisFlat) {
        // Owner viewing their own flat. Show edit/delete options.
        return (
            <div className="mt-6 border-t border-border pt-4 flex justify-end space-x-2">
                <Button variant="secondary" onClick={handleEditFlat}>Edit</Button>
                <Button variant="destructive" onClick={handleDeleteFlat}>Delete</Button>
                {/* Special case: owner viewing a pending booking request */}
                {flatDetails.status === 'pending' && bookingId && (
                  <div className="flex space-x-2 ml-auto">
                    <Button onClick={() => handleOwnerAction('approve')} disabled={isOwnerActionLoading}>
                        {isOwnerActionLoading ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button variant="destructive" onClick={() => handleOwnerAction('disapprove')} disabled={isOwnerActionLoading}>
                        {isOwnerActionLoading ? 'Processing...' : 'Cancel'}
                    </Button>
                  </div>
                )}
            </div>
        );
    }

    // Scenario 3: Authenticated Tenant
    if (isTenant) {
        // Tenant can only book an available flat
        if (flatDetails.status === 'available') {
            return (
                <div className="mt-6 border-t border-border pt-4">
                    <h3 className="text-xl font-bold text-foreground mb-4">Book this Flat</h3>
                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-muted-foreground mb-1">Start Date:</label>
                            <Input type="date" id="startDate" name="startDate" value={bookingDates.startDate} onChange={(e) => setBookingDates({ ...bookingDates, startDate: e.target.value })} required />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-muted-foreground mb-1">End Date:</label>
                            <Input type="date" id="endDate" name="endDate" value={bookingDates.endDate} onChange={(e) => setBookingDates({ ...bookingDates, endDate: e.target.value })} required />
                        </div>
                        <Button type="submit" disabled={isBookingLoading}>
                            {isBookingLoading ? 'Processing Booking...' : 'Book Now'}
                        </Button>
                    </form>
                </div>
            );
        }
        
        // Tenant viewing their own pending booking request
        if (flatDetails.status === 'pending') {
            return (
                <div className="mt-6 border-t border-border pt-4 flex justify-end space-x-2">
                    <p className="text-muted-foreground self-center">Awaiting owner approval.</p>
                    <Button variant="destructive" onClick={handleCancelBooking} disabled={isCancelling}>
                        {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </Button>
                </div>
            );
        }

        // Tenant viewing their own approved booking
        if (flatDetails.status === 'approved') {
            return (
                <div className="mt-6 border-t border-border pt-4 flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCancelBooking} disabled={isCancelling}>
                        {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </Button>
                    <Button onClick={handleConfirmPayment} disabled={isConfirmingPayment}>
                        {isConfirmingPayment ? 'Processing...' : 'Confirm Payment'}
                    </Button>
                </div>
            );
        }
        
        // Tenant viewing their own active/booked flat
        if (flatDetails.status === 'booked' || flatDetails.status === 'active') {
             return (
                 <div className="mt-6 border-t border-border pt-4 flex justify-end space-x-2">
                    <Button onClick={handleExtendBooking} disabled={isExtending}>
                        {isExtending ? 'Extending...' : 'Extend'}
                    </Button>
                    <Button variant="destructive" onClick={handleCancelBooking} disabled={isCancelling}>
                        {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </Button>
                </div>
             );
        }
    }
    
    // Default case: no actions available for this user on this flat.
    return (
      <div className="mt-6 border-t border-border pt-4 text-center">
        <p className="text-muted-foreground">No actions available for this flat.</p>
      </div>
    );
  };

  const getFlatContent = () => {
    if (loading) {
      return <p className="text-muted-foreground">Loading flat details...</p>;
    }
    if (error) {
      return <p className="text-destructive">{error}</p>;
    }
    if (!flatDetails) {
      return <p className="text-muted-foreground">Flat details not found.</p>;
    }

    const showSensitiveDetails = isAuthenticated;

    return (
      <div className="space-y-4">
        {/* Essential Info (always visible) */}
        <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
          <p><strong>Address:</strong> {flatDetails.address}</p>
          <p><strong>District:</strong> {flatDetails.district ?? 'N/A'}</p>
          <p><strong>Rent:</strong> BDT {flatDetails.monthlyRentalCost?.toLocaleString() ?? 'N/A'}</p>
          <p><strong>Beds:</strong> {flatDetails.bedrooms ?? 'N/A'}</p>
          <p><strong>Baths:</strong> {flatDetails.bathrooms ?? 'N/A'}</p>
          <p><strong>Status:</strong> <span className={`font-medium ${flatDetails.status === 'available' ? 'text-green-600' : 'text-destructive'}`}> {flatDetails.status} </span></p>
          {flatDetails.rating !== null && flatDetails.rating !== undefined && <p><strong>Rating:</strong> {flatDetails.rating.toFixed(1)}/5</p>}
          {flatDetails.balcony && <p><strong>Balcony:</strong> Yes</p>}
        </div>

        {flatDetails.description && (
          <div>
            <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">Description:</h4>
            <p className="text-muted-foreground text-base">{flatDetails.description}</p>
          </div>
        )}

        {/* Images (Display first image as a larger view, others as thumbnails) */}
        {flatDetails.images && flatDetails.images.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">Images:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {flatDetails.images.map((img, index) => (
                <img key={img.id} src={img.url} alt={`Flat image ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {flatDetails.amenities && flatDetails.amenities.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">Amenities:</h4>
            <div className="flex flex-wrap gap-2">
              {flatDetails.amenities.map((a) => (
                <span key={a.amenity.id} className="bg-secondary text-secondary-foreground py-1 px-3 rounded-full text-sm font-medium">
                  {a.amenity.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Conditional Sensitive Details & Owner Info */}
        {showSensitiveDetails ? (
          <div className="mt-6 border-t border-border pt-4 space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Detailed Information</h3>
            <p><strong>Flat Number:</strong> {flatDetails.flatNumber ?? 'N/A'}</p>
            <p><strong>Floor:</strong> {flatDetails.floor ?? 'N/A'}</p>
            <p><strong>House Number:</strong> {flatDetails.houseNumber ?? 'N/A'}</p>
            <p><strong>Utility Cost:</strong> BDT {flatDetails.utilityCost?.toLocaleString() ?? 'N/A'}</p>
            
            {flatDetails.owner && (
              <>
                <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">Owner Contact:</h4>
                <p><strong>Name:</strong> {flatDetails.owner.firstName} {flatDetails.owner.lastName}</p>
                {flatDetails.owner.email && <p><strong>Email:</strong> {flatDetails.owner.email}</p>}
                {flatDetails.owner.phone && <p><strong>Phone:</strong> {flatDetails.owner.phone}</p>}
                {flatDetails.owner.nid && <p><strong>NID:</strong> {flatDetails.owner.nid}</p>}
              </>
            )}
          </div>
        ) : (
          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Sign up or Login to view more flat details and owner information.
            </p>
            <Button asChild className="mr-2">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        )}
        
        {renderButtons()}

      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Flat Details: {flatDetails?.address}</DialogTitle>
          <DialogDescription>
            Detailed information about the flat.
          </DialogDescription>
        </DialogHeader>
        {getFlatContent()}
      </DialogContent>
    </Dialog>
  );
};

export default FlatDetailsDialog;