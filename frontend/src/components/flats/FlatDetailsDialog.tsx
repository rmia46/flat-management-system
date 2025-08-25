// frontend/src/components/flats/FlatDetailsDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  getFlatById,
  createBooking,
  // Other api imports
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { motion, Variants } from 'framer-motion';

// Interfaces remain the same
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
  owner?: { id: number; firstName: string; lastName:string; email?: string | null; phone?: string | null; nid?: string | null; };
  images?: { id: number; url: string; isThumbnail: boolean }[];
  amenities?: { amenity: { id: number; name: string; description: string | null } }[];
  bookings?: any[];
}
interface FlatDetailsDialogProps {
  flatId: number | null;
  bookingId?: number | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!flatId || !isOpen) {
      setFlatDetails(null); setLoading(false); setError(''); return;
    }
    const fetchDetails = async () => {
      setLoading(true); setError('');
      try {
        const response = await getFlatById(flatId);
        setFlatDetails(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load flat details.');
      } finally { setLoading(false); }
    };
    fetchDetails();
  }, [flatId, isOpen, triggerRefresh]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatId) return;
    try {
      await createBooking(flatId, { startDate: new Date(bookingDates.startDate), endDate: new Date(bookingDates.endDate) });
      toast.success("Booking request sent!");
      onActionComplete?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create booking.");
    }
  };

  const getFlatContent = () => {
    if (loading) return <div className="flex justify-center items-center py-8"><LoadingSpinner size={32} /></div>;
    if (error) return <p className="text-destructive">{error}</p>;
    if (!flatDetails) return <p>Flat details not found.</p>;

    const backendBaseUrl = api.defaults.baseURL?.replace('/api', '');

    return (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="media">Photos & Amenities</TabsTrigger>
          {isAuthenticated && <TabsTrigger value="booking">Booking</TabsTrigger>}
        </TabsList>

        {/* CHANGED: Added fixed height and scrollbar to this container */}
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

          <TabsContent value="booking">
            {user?.userType === 'tenant' && flatDetails.status === 'available' && !flatDetails.bookings?.length && (
              <form onSubmit={handleBookingSubmit} className="space-y-4"><h3 className="text-lg font-bold">Book this Flat</h3><div><label htmlFor="startDate" className="block text-sm font-medium text-muted-foreground mb-1">Start Date:</label><Input type="date" id="startDate" value={bookingDates.startDate} onChange={(e) => setBookingDates({ ...bookingDates, startDate: e.target.value })} required /></div><div><label htmlFor="endDate" className="block text-sm font-medium text-muted-foreground mb-1">End Date:</label><Input type="date" id="endDate" value={bookingDates.endDate} onChange={(e) => setBookingDates({ ...bookingDates, endDate: e.target.value })} required /></div><Button type="submit">Book Now</Button></form>
            )}
            {flatDetails.bookings?.length ? <p className="text-muted-foreground">Booking details and actions would appear here.</p> : null}
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
          {/* CHANGED: Removed the <motion.div layout> wrapper */}
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

export default FlatDetailsDialog;