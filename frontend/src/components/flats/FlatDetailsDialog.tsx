// frontend/src/components/flats/FlatDetailsDialog.tsx
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
import { getFlatById } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Define a more comprehensive Flat type to match backend 'select' and 'include'
interface FlatDetails {
  id: number;
  flatNumber?: string | null; // Sensitive, conditional
  floor?: number | null;      // Sensitive, conditional
  houseName?: string | null;
  houseNumber?: string | null; // Sensitive, conditional
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  monthlyRentalCost: number | null;
  utilityCost?: number | null; // Sensitive, conditional
  bedrooms?: number | null;
  bathrooms?: number | null;
  balcony?: boolean | null;
  minimumStay?: number | null;
  description?: string | null;
  status: string;
  rating?: number | null;
  ownerId: number; // Important for ownership check

  // Included relations - fields might be null if not selected by backend
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string | null; // Nullable if not authenticated
    phone?: string | null; // Nullable if not authenticated
    nid?: string | null;   // Nullable if not authenticated
  };
  images?: { id: number; url: string; isThumbnail: boolean }[];
  amenities?: { amenity: { id: number; name: string; description: string | null } }[];
}

interface FlatDetailsDialogProps {
  flatId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const FlatDetailsDialog: React.FC<FlatDetailsDialogProps> = ({ flatId, isOpen, onClose }) => {
  const { isAuthenticated, user, isLoading } = useAuth(); // Get user info for auth check
  const [flatDetails, setFlatDetails] = useState<FlatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    // Re-fetch if flatId, isOpen change or if user auth status changes
  }, [flatId, isOpen, isAuthenticated, user, isLoading]);

  // Determine what to display based on authentication status and ownership
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

    const showSensitiveDetails = isAuthenticated; // <--- Condition: Show if ANY user is authenticated
    const isOwnerOfThisFlat = user && flatDetails.ownerId === user.id && user.userType === 'owner';

    return (
      <div className="space-y-4">
        {/* Essential Info (always visible) */}
        <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
          <p><strong>Address:</strong> {flatDetails.address}</p>
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

            {/* Only show owner contact if the logged-in user is the actual owner of this flat */}
            {isOwnerOfThisFlat && (
              <>
                <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">Owner Contact:</h4>
                {flatDetails.owner && (
                  <>
                    <p><strong>Name:</strong> {flatDetails.owner.firstName} {flatDetails.owner.lastName}</p>
                    <p><strong>Email:</strong> {flatDetails.owner.email ?? 'N/A'}</p>
                    <p><strong>Phone:</strong> {flatDetails.owner.phone ?? 'N/A'}</p>
                    <p><strong>NID:</strong> {flatDetails.owner.nid ?? 'N/A'}</p>
                  </>
                )}
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