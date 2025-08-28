// frontend/src/components/flats/FlatDetailsDialog.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { getFlatById, createBooking, cancelBooking, approveBooking, disapproveBooking, confirmPayment, requestExtension, approveExtension, rejectExtension, confirmExtensionPayment } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { motion, Variants } from 'framer-motion';
import ReviewCard from '../reviews/ReviewCard';

// Interfaces...
interface Review {
  id: number;
  ratingGiven: number;
  comment: string | null;
  dateSubmitted: string;
  reviewerId: number;
  reviewer: { firstName: string; lastName: string; };
}
interface FlatDetails {
  id: number;
  address: string;
  district?: string | null;
  monthlyRentalCost: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  description?: string | null;
  status: string;
  ownerId: number;
  owner?: { id: number; firstName: string; lastName: string; email?: string | null; };
  images?: { id: number; url: string; isThumbnail: boolean }[];
  amenities?: { amenity: { id: number; name: string; } }[];
  bookings?: any[];
  reviews?: Review[];
}
interface FlatDetailsDialogProps { flatId: number | null; bookingId?: number | null; isOpen: boolean; onClose: () => void; onActionComplete?: () => void; }

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const FlatDetailsDialog: React.FC<FlatDetailsDialogProps> = ({ flatId, bookingId, isOpen, onClose, onActionComplete }) => {
  const { isAuthenticated, user, triggerRefresh } = useAuth();
  const [flatDetails, setFlatDetails] = useState<FlatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '' });
  const [extensionNewEndDate, setExtensionNewEndDate] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!flatId) return;
    setLoading(true); setError('');
    try {
      const response = await getFlatById(flatId);
      setFlatDetails(response.data.data.flat);
    } catch (err: any) {
      setError(err.message || 'Failed to load flat details.');
    } finally { setLoading(false); }
  }, [flatId]);

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, flatId, triggerRefresh, fetchDetails]);

  const handleApiAction = async (action: () => Promise<any>, successMessage: string, errorMessage: string) => {
    setIsActionLoading(true);
    try {
      await action();
      toast.success(successMessage);
      onActionComplete?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatId) return;
    const bookingData = { startDate: new Date(bookingDates.startDate), endDate: new Date(bookingDates.endDate) };
    handleApiAction(() => createBooking(flatId, bookingData), 'Booking request created successfully.', 'Failed to create booking.');
  };

  const getFlatContent = () => {
    if (loading) return <div className="flex justify-center items-center py-8"><LoadingSpinner size={32} /></div>;
    if (error) return <p className="text-destructive">{error}</p>;
    if (!flatDetails) return <p>Flat details not found.</p>;

    const backendBaseUrl = api.defaults.baseURL?.replace('/api', '');
    const currentBooking = flatDetails.bookings?.find(b => b.id === bookingId) || flatDetails.bookings?.[0];

    return (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="media">Photos & Amenities</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          {isAuthenticated && <TabsTrigger value="booking">Booking</TabsTrigger>}
        </TabsList>

        <motion.div
          key={flatDetails.id}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="mt-4 h-[45vh] overflow-y-auto pr-3"
        >
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>Address:</strong> {flatDetails.address}</p>
                <p><strong>District:</strong> {flatDetails.district ?? 'N/A'}</p>
                <p><strong>Rent:</strong> BDT {flatDetails.monthlyRentalCost?.toLocaleString() ?? 'N/A'}</p>
                <p><strong>Beds:</strong> {flatDetails.bedrooms ?? 'N/A'}</p>
                <p><strong>Baths:</strong> {flatDetails.bathrooms ?? 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`font-medium ${flatDetails.status === 'available' ? 'text-green-600' : 'text-destructive'}`}>{flatDetails.status}</span></p>
            </div>
            {flatDetails.description && (<div><h4 className="font-semibold mt-2 mb-1">Description</h4><p className="text-muted-foreground text-sm">{flatDetails.description}</p></div>)}
            {flatDetails.owner && (<div><h4 className="font-semibold mt-4 mb-1">Owner Information</h4><div className="text-sm"><p><strong>Name:</strong> {flatDetails.owner.firstName} {flatDetails.owner.lastName}</p>{isAuthenticated && <p><strong>Email:</strong> {flatDetails.owner.email ?? 'N/A'}</p>}</div></div>)}
          </TabsContent>

          <TabsContent value="media">
            {flatDetails.images && flatDetails.images.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {flatDetails.images.map(img => {
                    const fullUrl = `${backendBaseUrl}${img.url}`;
                    return <img key={img.id} src={fullUrl} onClick={() => setSelectedImage(fullUrl)} alt="Flat image" className="w-full h-24 object-cover rounded-md cursor-pointer transition-transform hover:scale-105" />;
                  })}
                </div>
              </div>
            )}
            {flatDetails.amenities && flatDetails.amenities.length > 0 && (
              <div><h4 className="font-semibold mb-2">Amenities</h4><div className="flex flex-wrap gap-2">{flatDetails.amenities.map(a => (<span key={a.amenity.id} className="bg-secondary text-secondary-foreground py-1 px-3 rounded-full text-xs font-medium">{a.amenity.name}</span>))}</div></div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {flatDetails.reviews && flatDetails.reviews.length > 0 ? (
                flatDetails.reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center pt-4">No reviews yet for this property.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="booking">
            {user?.userType === 'tenant' && flatDetails.status === 'available' && !currentBooking && (
              <form onSubmit={handleBookingSubmit} className="space-y-4"><h3 className="text-lg font-bold">Book this Flat</h3><div><label htmlFor="startDate" className="block text-sm font-medium text-muted-foreground mb-1">Start Date:</label><Input type="date" id="startDate" value={bookingDates.startDate} onChange={(e) => setBookingDates({ ...bookingDates, startDate: e.target.value })} required /></div><div><label htmlFor="endDate" className="block text-sm font-medium text-muted-foreground mb-1">End Date:</label><Input type="date" id="endDate" value={bookingDates.endDate} onChange={(e) => setBookingDates({ ...bookingDates, endDate: e.target.value })} required /></div><Button type="submit" disabled={isActionLoading}>{isActionLoading ? <LoadingSpinner size={16}/> : 'Book Now'}</Button></form>
            )}
            {currentBooking && (
              <BookingActions
                booking={currentBooking}
                isOwner={user?.id === flatDetails.ownerId}
                userType={user?.userType}
                isActionLoading={isActionLoading}
                handleApiAction={handleApiAction}
                extensionNewEndDate={extensionNewEndDate}
                setExtensionNewEndDate={setExtensionNewEndDate}
              />
            )}
          </TabsContent>
        </motion.div>
      </Tabs>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Flat Details</DialogTitle></DialogHeader>
          {getFlatContent()}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-6xl w-auto p-2 bg-transparent border-none shadow-none">
          <img src={selectedImage || ''} alt="Enlarged flat view" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />
        </DialogContent>
      </Dialog>
    </>
  );
};

// BookingActions component remains the same
const BookingActions = ({ booking, isOwner, userType, isActionLoading, handleApiAction, extensionNewEndDate, setExtensionNewEndDate }: any) => {
  const latestExtension = booking.extensions?.sort((a: any, b: any) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold">Booking Status</h3>
        <p><strong>Status:</strong> {booking.status}</p>
        <p><strong>Period:</strong> {new Date(booking.startDate).toDateString()} - {new Date(booking.endDate).toDateString()}</p>
      </div>

      {isOwner && booking.user && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Tenant Details</h4>
          <div className="text-sm space-y-1">
            <p><strong>Name:</strong> {booking.user.firstName} {booking.user.lastName}</p>
            <p><strong>Email:</strong> {booking.user.email}</p>
            <p><strong>Phone:</strong> {booking.user.phone || 'N/A'}</p>
            <p><strong>NID:</strong> {booking.user.nid || 'N/A'}</p>
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2">Actions</h4>
        <div className="flex flex-wrap gap-2">
          {userType === 'tenant' && (
            <>
              {booking.status === 'approved' && (
                <Button onClick={() => handleApiAction(() => confirmPayment(booking.id), 'Payment confirmed!', 'Failed to confirm payment.')} disabled={isActionLoading}>
                  {isActionLoading ? <LoadingSpinner size={16}/> : 'Confirm Payment'}
                </Button>
              )}
              {(booking.status === 'pending' || booking.status === 'approved') && (
                <Button variant="destructive" onClick={() => handleApiAction(() => cancelBooking(booking.id), 'Booking cancelled.', 'Failed to cancel booking.')} disabled={isActionLoading}>
                  {isActionLoading ? <LoadingSpinner size={16}/> : 'Cancel Booking'}
                </Button>
              )}
              {booking.status === 'active' && (
                <form onSubmit={(e) => { e.preventDefault(); handleApiAction(() => requestExtension(booking.id, new Date(extensionNewEndDate)), 'Extension requested.', 'Failed to request extension.') }} className="flex items-center gap-2">
                  <Input type="date" value={extensionNewEndDate} onChange={(e) => setExtensionNewEndDate(e.target.value)} required />
                  <Button type="submit" disabled={isActionLoading}>{isActionLoading ? <LoadingSpinner size={16}/> : 'Request Extension'}</Button>
                </form>
              )}
              {latestExtension?.status === 'approved' && (
                 <Button onClick={() => handleApiAction(() => confirmExtensionPayment(latestExtension.id), 'Extension payment confirmed!', 'Failed to confirm extension payment.')} disabled={isActionLoading}>
                  {isActionLoading ? <LoadingSpinner size={16}/> : 'Confirm Extension Payment'}
                </Button>
              )}
            </>
          )}

          {isOwner && (
            <>
              {booking.status === 'pending' && (
                <>
                  <Button onClick={() => handleApiAction(() => approveBooking(booking.id), 'Booking approved.', 'Failed to approve booking.')} disabled={isActionLoading}>
                    {isActionLoading ? <LoadingSpinner size={16}/> : 'Approve'}
                  </Button>
                  <Button variant="destructive" onClick={() => handleApiAction(() => disapproveBooking(booking.id), 'Booking disapproved.', 'Failed to disapprove booking.')} disabled={isActionLoading}>
                    {isActionLoading ? <LoadingSpinner size={16}/> : 'Disapprove'}
                  </Button>
                </>
              )}
              {booking.status === 'approved' && (
                <Button variant="destructive" onClick={() => handleApiAction(() => disapproveBooking(booking.id), 'Booking cancelled.', 'Failed to cancel booking.')} disabled={isActionLoading}>
                  {isActionLoading ? <LoadingSpinner size={16}/> : 'Cancel Booking'}
                </Button>
              )}
              {latestExtension?.status === 'pending' && (
                <>
                  <Button onClick={() => handleApiAction(() => approveExtension(latestExtension.id), 'Extension approved.', 'Failed to approve extension.')} disabled={isActionLoading}>
                    {isActionLoading ? <LoadingSpinner size={16}/> : 'Approve Extension'}
                  </Button>
                  <Button variant="destructive" onClick={() => handleApiAction(() => rejectExtension(latestExtension.id), 'Extension rejected.', 'Failed to reject extension.')} disabled={isActionLoading}>
                    {isActionLoading ? <LoadingSpinner size={16}/> : 'Reject Extension'}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlatDetailsDialog;