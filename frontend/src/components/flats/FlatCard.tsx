// frontend/src/components/flats/FlatCard.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FlatDetailsDialog from './FlatDetailsDialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; 

import { deleteFlat } from '@/services/api';
import { useNavigate } from 'react-router-dom';

// Define a basic type for a Flat (match your Prisma schema output for frontend usage)
interface Image {
  id: number;
  url: string;
  isThumbnail: boolean;
}

interface AmenityItem {
  amenity: {
    name: string;
  };
}

interface Flat {
  id: number;
  flatNumber: string | null;
  floor: number | null;
  houseName: string | null;
  address: string;
  monthlyRentalCost: number | null; // Allow null for safety
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  status: string;
  rating: number | null; // Or Decimal type if you handle it specifically

  images?: Image[]; // Make optional, can be undefined if not included or no images
  amenities?: AmenityItem[]; // Make optional
}

interface FlatCardProps {
  flat: Flat; // Flat is now expected to be of type Flat
  showActions?: boolean; // e.g., for owner's dashboard
  onFlatDeleted?: (flatId: number) => void;
}

const FlatCard: React.FC<FlatCardProps> = ({ flat, showActions = false, onFlatDeleted}) => {
  const navigate = useNavigate();
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null); 
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); 
  const [isDeleting, setIsDeleting] = useState(false); 

  if (!flat) {
    console.warn("FlatCard received an undefined or null flat prop.");
    return null;
  }

  const thumbnailUrl = flat.images?.find(img => img.isThumbnail)?.url || 'https://via.placeholder.com/300x200?text=No+Image';

  const displayRent = flat.monthlyRentalCost !== null && flat.monthlyRentalCost !== undefined
    ? `BDT ${flat.monthlyRentalCost.toLocaleString()}`
    : 'N/A';


  const handleCardClick = () => { 
    setSelectedFlatId(flat.id);
    setIsDetailsDialogOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent) => { 
    e.stopPropagation(); // Prevent card click
    navigate(`/flats/edit/${flat.id}`); // Redirect to edit page
  };

  const handleDeleteClick = (e: React.MouseEvent) => { 
    e.stopPropagation(); // Prevent card click from opening details dialog
    setSelectedFlatId(flat.id);
    setIsDeleteDialogOpen(true);
  };
  const confirmDelete = async () => { 
    if (!selectedFlatId) return;

    setIsDeleting(true);
    try {
      await deleteFlat(selectedFlatId);
      console.log(`Flat ${selectedFlatId} deleted successfully.`);
      // Call the callback to refresh the list in the parent (DashboardPage)
      // --- ADD THIS DEBUG LOG ---
      console.log('FlatCard: Calling onFlatDeleted callback for ID:', selectedFlatId);
      if (onFlatDeleted) {
        onFlatDeleted(selectedFlatId);
      }
    } catch (error: any) {
      console.error(`Failed to delete flat ${selectedFlatId}:`, error.response ? error.response.data : error.message);
      alert(`Failed to delete flat: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false); // Close dialog regardless of success/failure
    }
  };

  return (
    <>
    <Card 
      className="rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex flex-col overflow-hidden"
      onClick={handleCardClick}
    > 
      <div className="w-full h-48 bg-muted overflow-hidden flex items-center justify-center"> 
        {thumbnailUrl === 'https://via.placeholder.com/300x200?text=No+Image' ? (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-lg">
            No Image Available
          </div>
        ) : (
          <img src={thumbnailUrl} alt={`Flat ${flat.flatNumber || flat.id}`} className="w-full h-full object-cover" />
        )}
      </div>

      <CardHeader className="p-5 pb-0"> 
        <CardTitle className="text-xl font-semibold text-foreground mb-1">
          Flat {flat.houseName ? `in ${flat.houseName}` : ''}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">{flat.address}</CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-3 flex-grow"> 
        <div className="grid grid-cols-2 gap-2 text-muted-foreground text-sm mb-4">
          <p><strong>Rent:</strong> {displayRent}</p>
          <p><strong>Beds:</strong> {flat.bedrooms ?? 'N/A'}</p>
          <p><strong>Baths:</strong> {flat.bathrooms ?? 'N/A'}</p>
          <p><strong>Status:</strong> <span className={`font-medium ${flat.status === 'available' ? 'text-green-600' : 'text-destructive'}`}> {flat.status} </span></p>
          {flat.rating !== null && flat.rating !== undefined && <p><strong>Rating:</strong> {flat.rating.toFixed(1)}/5</p>}
        </div>

        {flat.description && (
          <p className="text-foreground text-base line-clamp-3 mb-4">{flat.description}</p>
        )}

        {/* Amenities */}
        {flat.amenities && flat.amenities.length > 0 && ( // Check if amenities array exists and has length
          <div className="mt-auto"> 
            <h4 className="text-sm font-semibold text-foreground mb-2">Amenities:</h4>
            <div className="flex flex-wrap gap-2">
              {flat.amenities.slice(0, 3).map((a, index) => (
                <span key={index} className="bg-secondary text-secondary-foreground py-1 px-3 rounded-full text-xs font-medium">
                  {a.amenity.name}
                </span>
              ))}
              {flat.amenities.length > 3 && (
                <span className="bg-muted text-muted-foreground py-1 px-3 rounded-full text-xs font-medium">
                  +{flat.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
      {showActions && (
          <CardFooter className="p-5 pt-0 flex justify-end space-x-2">
            <Button variant="secondary" onClick={handleEditClick}>Edit</Button> 
            <Button variant="destructive" onClick={handleDeleteClick} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </CardFooter>
       )}
    </Card>
    <FlatDetailsDialog
        flatId={selectedFlatId}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
    />
    {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your flat
              listing and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FlatCard;
