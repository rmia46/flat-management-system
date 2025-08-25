// frontend/src/components/flats/FlatDetailsDialog.tsx (REVISED for Extension Visibility)

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  getFlatById,
  createBooking,
  cancelBooking,
  approveBooking,
  disapproveBooking,
  confirmPayment,
  requestExtension,
  approveExtension,
  rejectExtension,
  confirmExtensionPayment,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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
  status: string; // Flat status
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
  bookings?: BookingDetail[];
}

interface BookingDetail {
  id: number;
  userId: number;
  flatId: number;
  startDate: string;
  endDate: string;
  status: string; // Booking status
  autoRenewEnabled: boolean;
  requestedAt: string;
  approvedAt?: string | null;
  cancelledAt?: string | null;
  payments: PaymentDetail[];
  extensions: ExtensionDetail[];
}

interface PaymentDetail {
  id: number;
  bookingId: number;
  amount: number;
  datePaid: string;
  transactionId?: string | null;
  paymentMethod?: string | null;
  status: string; // Payment status
}

interface ExtensionDetail {
  id: number;
  bookingId: number;
  newStartDate: string;
  newEndDate: string;
  status: string; // Extension status ('pending', 'approved', 'rejected')
  requestedAt: string;
}

interface FlatDetailsDialogProps {
  flatId: number | null;
  bookingId?: number | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

const FlatDetailsDialog: React.FC<FlatDetailsDialogProps> = ({ flatId, bookingId, isOpen, onClose, onActionComplete }) => {
  const { isAuthenticated, user, isLoading: authLoading, triggerRefresh } = useAuth();
  const [flatDetails, setFlatDetails] = useState<FlatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '' });
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isRequestingExtension, setIsRequestingExtension] = useState(false);
  const [extensionNewEndDate, setExtensionNewEndDate] = useState('');
  const [isApprovingExtension, setIsApprovingExtension] = useState(false);
  const [isRejectingExtension, setIsRejectingExtension] = useState(false);
  const [isConfirmingExtensionPayment, setIsConfirmingExtensionPayment] = useState(false);

  const currentBooking = flatDetails?.bookings?.find(b => b.id === bookingId) || flatDetails?.bookings?.[0];

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
  }, [flatId, isOpen, isAuthenticated, user, authLoading, bookingId, triggerRefresh]);

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

    const start = new Date(bookingDates.startDate);
    const end = new Date(bookingDates.endDate);

    if (start >= end) {
        toast.error('End date must be after start date.');
        setIsBookingLoading(false);
        return;
    }
    if (start < new Date()) {
        toast.error('Start date cannot be in the past.');
        setIsBookingLoading(false);
        return;
    }

    try {
      const bookingData = {
        startDate: start,
        endDate: end,
      };
      const response = await createBooking(flatId as number, bookingData);
      toast.success(response.data.message);
      onActionComplete?.();
      onClose();

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
          if (!currentBooking) return;
          await cancelBooking(currentBooking.id);
          toast.success('Booking cancelled successfully.');
          onActionComplete?.();
          onClose();
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
      if (!currentBooking) return;
      await confirmPayment(currentBooking.id);
      toast.success('Payment confirmed! Booking is now active.');
      onActionComplete?.();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to confirm payment.';
      toast.error(errorMessage);
      console.error("Payment confirmation failed:", err);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleOwnerBookingAction = async (action: 'approve' | 'disapprove') => {
      setIsBookingLoading(true);
      try {
          if (!currentBooking) return;
          if (action === 'approve') {
              await approveBooking(currentBooking.id);
              toast.success('Booking approved! Awaiting tenant payment.');
          } else {
              await disapproveBooking(currentBooking.id);
              toast.info('Booking disapproved.');
          }
          onActionComplete?.();
          onClose();
      } catch (err: any) {
          const message = err.response?.data?.message || `Failed to ${action} booking.`;
          toast.error(message);
          console.error(`Failed to ${action} booking:`, err);
      } finally {
          setIsBookingLoading(false);
      }
  };

  const handleRequestExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequestingExtension(true);
    try {
      if (!currentBooking) {
        toast.error('No active booking found for extension.');
        return;
      }
      if (!extensionNewEndDate) {
        toast.error('Please select a new end date for the extension.');
        return;
      }
      const newEndDateObj = new Date(extensionNewEndDate);
      const currentBookingEndDate = new Date(currentBooking.endDate);

      if (newEndDateObj <= currentBookingEndDate) {
        toast.error('New end date must be after the current booking end date.');
        return;
      }

      await requestExtension(currentBooking.id, newEndDateObj);
      toast.success('Extension request submitted. Awaiting owner approval.');
      onActionComplete?.();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to request extension.';
      toast.error(errorMessage);
      console.error("Extension request failed:", err);
    } finally {
      setIsRequestingExtension(false);
    }
  };

  const handleOwnerExtensionAction = async (extensionId: number, action: 'approve' | 'reject') => {
    setIsApprovingExtension(true);
    try {
      if (action === 'approve') {
        await approveExtension(extensionId);
        toast.success('Extension approved! Awaiting tenant payment.');
      } else {
        await rejectExtension(extensionId);
        toast.info('Extension rejected.');
      }
      onActionComplete?.();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || `Failed to ${action} extension.`;
      toast.error(message);
      console.error(`Failed to ${action} extension:`, err);
    } finally {
      setIsApprovingExtension(false);
    }
  };

  const handleConfirmExtensionPayment = async (extensionId: number) => {
    setIsConfirmingExtensionPayment(true);
    try {
      await confirmExtensionPayment(extensionId);
      toast.success('Extension payment confirmed! Booking end date updated.');
      onActionComplete?.();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to confirm extension payment.';
      toast.error(errorMessage);
      console.error("Extension payment confirmation failed:", err);
    } finally {
      setIsConfirmingExtensionPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'pending':
          case 'approved':
          case 'awaiting_payment': // For booking status
              return 'text-yellow-600';
          case 'active':
          case 'approved_by_owner': // This status is not in schema but used for display
              return 'text-green-600';
          case 'disapproved':
          case 'cancelled':
          case 'rejected':
              return 'text-red-600';
          case 'awaiting_tenant_payment': // For payment status
              return 'text-blue-600';
          case 'completed': // For payment status
              return 'text-green-600';
          case 'failed': // For payment status
              return 'text-red-600';
          default:
              return '';
      }
  };
  
  const getFlatContent = () => {
    if (loading || authLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size={32} className="text-primary" />
          <p className="ml-2 text-muted-foreground">Loading flat details...</p>
        </div>
      );
    }
    if (error) {
      return <p className="text-destructive">{error}</p>;
    }
    if (!flatDetails) {
      return <p className="text-muted-foreground">Flat details not found.</p>;
    }
    const backendBaseUrl = api.defaults.baseURL?.replace('/api', '');
    const showSensitiveDetails = isAuthenticated;
    const isOwnerOfThisFlat = user && flatDetails.ownerId === user.id && user.userType === 'owner';
    const isTenant = user && user.userType === 'tenant';

    const displayBooking = currentBooking;
    const isBookingActive = displayBooking?.status === 'active';
    const isBookingPendingOwnerApproval = displayBooking?.status === 'pending';
    const isBookingAwaitingPayment = displayBooking?.status === 'approved';
    const isBookingDisapproved = displayBooking?.status === 'disapproved';
    const isBookingCancelled = displayBooking?.status === 'cancelled';

    // Find the latest extension that is either pending owner approval or awaiting tenant payment
    let latestActionableExtension: ExtensionDetail | null = null;
    let associatedExtensionPayment: PaymentDetail | null = null;

    if (displayBooking && displayBooking.extensions.length > 0) {
        // Sort extensions by requestedAt descending to get the latest
        const sortedExtensions = [...displayBooking.extensions].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        
        for (const ext of sortedExtensions) {
            // Find the payment associated with this specific extension request
            // We link them by bookingId and a close datePaid/requestedAt (within a small window)
            const paymentForThisExtension = displayBooking.payments.find(
                p => p.bookingId === ext.bookingId &&
                     (p.status === 'pending' || p.status === 'awaiting_tenant_payment') &&
                     new Date(p.datePaid).toDateString() === new Date(ext.requestedAt).toDateString()
            );

            // Only consider extensions that are pending owner approval OR approved by owner but awaiting tenant payment
            if (ext.status === 'pending' || (ext.status === 'approved' && paymentForThisExtension?.status === 'awaiting_tenant_payment')) {
                latestActionableExtension = ext;
                associatedExtensionPayment = paymentForThisExtension || null;
                break; // Found the latest actionable extension
            }
        }
    }

    const isExtensionPendingOwnerApproval = latestActionableExtension?.status === 'pending';
    const isExtensionAwaitingPayment = latestActionableExtension?.status === 'approved' && associatedExtensionPayment?.status === 'awaiting_tenant_payment';
    const showExtensionSection = !!latestActionableExtension; // Only show if there's an actionable extension


    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
          <p><strong>Address:</strong> {flatDetails.address}</p>
          <p><strong>District:</strong> {flatDetails.district ?? 'N/A'}</p>
          <p><strong>Rent:</strong> BDT {flatDetails.monthlyRentalCost?.toLocaleString() ?? 'N/A'}</p>
          <p><strong>Beds:</strong> {flatDetails.bedrooms ?? 'N/A'}</p>
          <p><strong>Baths:</strong> {flatDetails.bathrooms ?? 'N/A'}</p>
          <p><strong>Flat Status:</strong> <span className={`font-medium ${flatDetails.status === 'available' ? 'text-green-600' : 'text-destructive'}`}> {flatDetails.status} </span></p>
          {flatDetails.rating !== null && flatDetails.rating !== undefined && <p><strong>Rating:</strong> {flatDetails.rating.toFixed(1)}/5</p>}
          {flatDetails.balcony && <p><strong>Balcony:</strong> Yes</p>}
        </div>

        {flatDetails.description && (
          <div>
            <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">Description:</h4>
            <p className="text-muted-foreground text-base">{flatDetails.description}</p>
          </div>
        )}

        {flatDetails.images && flatDetails.images.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">Images:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {flatDetails.images.map((img, index) => {
                const fullImageUrl = img.url ? `${backendBaseUrl}${img.url}` : '';
                return (
                  <img
                    key={img.id}
                    src={fullImageUrl}
                    alt={`Flat image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                );
              })}
            </div>
          </div>
        )}

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
                <p><strong>Email:</strong> {flatDetails.owner.email ?? 'N/A'}</p>
                <p><strong>Phone:</strong> {flatDetails.owner.phone ?? 'N/A'}</p>
                {isOwnerOfThisFlat && <p><strong>NID:</strong> {flatDetails.owner.nid ?? 'N/A'}</p>}
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

        {displayBooking && (
            <div className="mt-6 border-t border-border pt-4 space-y-3">
                <h3 className="text-xl font-bold text-foreground">Booking Status:</h3>
                <p><strong>Current Booking Status:</strong> <span className={`font-semibold ${getStatusColor(displayBooking.status)}`}>{displayBooking.status.replace(/_/g, ' ')}</span></p>
                <p><strong>Booking Period:</strong> {new Date(displayBooking.startDate).toDateString()} - {new Date(displayBooking.endDate).toDateString()}</p>
                {displayBooking.approvedAt && <p><strong>Approved On:</strong> {new Date(displayBooking.approvedAt).toDateString()}</p>}
                {displayBooking.cancelledAt && <p><strong>Cancelled On:</strong> {new Date(displayBooking.cancelledAt).toDateString()}</p>}
                
                {displayBooking.payments.length > 0 && (
                    <p><strong>Payment Status:</strong> <span className={`font-semibold ${getStatusColor(displayBooking.payments[0].status)}`}>{displayBooking.payments[0].status.replace(/_/g, ' ')}</span> (Amount: BDT {displayBooking.payments[0].amount.toLocaleString()})</p>
                )}

                {isTenant && (
                    <div className="flex justify-end space-x-2">
                        {isBookingAwaitingPayment && (
                            <Button onClick={handleConfirmPayment} disabled={isConfirmingPayment}>
                                {isConfirmingPayment ? <LoadingSpinner size={16} className="mr-2" /> : 'Confirm Payment'}
                            </Button>
                        )}
                        {(isBookingPendingOwnerApproval || isBookingAwaitingPayment) && (
                            <Button variant="destructive" onClick={handleCancelBooking} disabled={isCancelling}>
                                {isCancelling ? <LoadingSpinner size={16} className="mr-2" /> : 'Cancel Booking'}
                            </Button>
                        )}
                        {isBookingActive && (
                          <form onSubmit={handleRequestExtension} className="flex items-center space-x-2">
                            <Input
                              type="date"
                              value={extensionNewEndDate}
                              onChange={(e) => setExtensionNewEndDate(e.target.value)}
                              min={new Date(new Date(displayBooking.endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              required
                            />
                            <Button type="submit" disabled={isRequestingExtension}>
                              {isRequestingExtension ? <LoadingSpinner size={16} className="mr-2" /> : 'Request Extension'}
                            </Button>
                          </form>
                        )}
                    </div>
                )}

                {isOwnerOfThisFlat && (
                    <div className="flex justify-end space-x-2">
                        {isBookingPendingOwnerApproval && (
                            <>
                                <Button onClick={() => handleOwnerBookingAction('approve')} disabled={isBookingLoading}>
                                    {isBookingLoading ? <LoadingSpinner size={16} className="mr-2" /> : 'Approve Booking'}
                                </Button>
                                <Button variant="destructive" onClick={() => handleOwnerBookingAction('disapprove')} disabled={isBookingLoading}>
                                    {isBookingLoading ? <LoadingSpinner size={16} className="mr-2" /> : 'Disapprove Booking'}
                                </Button>
                            </>
                        )}
                        {isBookingAwaitingPayment && (
                           <Button variant="destructive" onClick={() => handleOwnerBookingAction('disapprove')} disabled={isBookingLoading}>
                                {isBookingLoading ? <LoadingSpinner size={16} className="mr-2" /> : 'Cancel Booking'}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        )}

        {showExtensionSection && latestActionableExtension && (
            <div className="mt-6 border-t border-border pt-4 space-y-3">
                <h3 className="text-xl font-bold text-foreground">Latest Extension Request:</h3>
                <p><strong>Requested Period:</strong> {new Date(latestActionableExtension.newStartDate).toDateString()} - {new Date(latestActionableExtension.newEndDate).toDateString()}</p>
                <p><strong>Extension Status:</strong> <span className={`font-semibold ${getStatusColor(latestActionableExtension.status)}`}>{latestActionableExtension.status.replace(/_/g, ' ')}</span></p>
                {associatedExtensionPayment && (
                    <p><strong>Payment Status:</strong> <span className={`font-semibold ${getStatusColor(associatedExtensionPayment.status)}`}>{associatedExtensionPayment.status.replace(/_/g, ' ')}</span> (Amount: BDT {associatedExtensionPayment.amount.toLocaleString()})</p>
                )}

                {isTenant && (
                    <div className="flex justify-end space-x-2">
                        {isExtensionAwaitingPayment && (
                            <Button onClick={() => handleConfirmExtensionPayment(latestActionableExtension.id)} disabled={isConfirmingExtensionPayment}>
                                {isConfirmingExtensionPayment ? <LoadingSpinner size={16} className="mr-2" /> : 'Confirm Extension Payment'}
                            </Button>
                        )}
                        {(isExtensionPendingOwnerApproval || isExtensionAwaitingPayment) && (
                            <Button variant="destructive" onClick={() => toast.info('Extension cancellation coming soon!')} disabled={isCancelling}>
                                {isCancelling ? <LoadingSpinner size={16} className="mr-2" /> : 'Cancel Extension Request'}
                            </Button>
                        )}
                    </div>
                )}

                {isOwnerOfThisFlat && (
                    <div className="flex justify-end space-x-2">
                        {isExtensionPendingOwnerApproval && (
                            <>
                                <Button onClick={() => handleOwnerExtensionAction(latestActionableExtension.id, 'approve')} disabled={isApprovingExtension}>
                                    {isApprovingExtension ? <LoadingSpinner size={16} className="mr-2" /> : 'Approve Extension'}
                                </Button>
                                <Button variant="destructive" onClick={() => handleOwnerExtensionAction(latestActionableExtension.id, 'reject')} disabled={isRejectingExtension}>
                                    {isRejectingExtension ? <LoadingSpinner size={16} className="mr-2" /> : 'Reject Extension'}
                                </Button>
                            </>
                        )}
                        {isExtensionAwaitingPayment && (
                            <Button variant="destructive" onClick={() => handleOwnerExtensionAction(latestActionableExtension.id, 'reject')} disabled={isRejectingExtension}>
                                {isRejectingExtension ? <LoadingSpinner size={16} className="mr-2" /> : 'Cancel Extension'}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        )}

        {isTenant && flatDetails.status === 'available' && !displayBooking && (
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
                {isBookingLoading ? <LoadingSpinner size={16} className="mr-2" /> : 'Book Now'}
              </Button>
            </form>
          </div>
        )}
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