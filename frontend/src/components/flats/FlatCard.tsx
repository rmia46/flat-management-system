// frontend/src/components/flats/FlatCard.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import FlatDetailsDialog from './FlatDetailsDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogHeaderTitle,
} from "@/components/ui/alert-dialog";
import { deleteFlat, updateFlatStatus } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Heart, BedDouble, Bath } from 'lucide-react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Interfaces
interface Image { id: number; url: string; isThumbnail: boolean; }
interface Flat {
  id: number;
  address: string;
  district: string | null;
  monthlyRentalCost: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  status: string;
  images?: Image[];
  [key: string]: any;
}

// **FIX**: Added the missing props interface for this component
interface FlatCardProps {
  flat: Flat;
  showActions?: boolean;
  onFlatDeleted?: (flatId: number) => void;
  onStatusChange?: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const FlatCard: React.FC<FlatCardProps> = ({ flat, showActions = false, onFlatDeleted, onStatusChange }) => {
  const navigate = useNavigate();
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!flat) return null;

  const displayRent = flat.monthlyRentalCost !== null ? `BDT ${Math.round(flat.monthlyRentalCost).toLocaleString()}` : 'N/A';
  const thumbnailUrl = flat.images?.find(img => img.isThumbnail)?.url || 'https://via.placeholder.com/400x300?text=No+Image';
  const backendBaseUrl = api.defaults.baseURL?.replace('/api', '');
  const fullImageUrl = thumbnailUrl.startsWith('http') ? thumbnailUrl : `${backendBaseUrl}${thumbnailUrl}`;

  const handleStatusToggle = async (newStatus: boolean) => {
    setIsUpdatingStatus(true);
    try {
      const statusValue = newStatus ? 'available' : 'unavailable';
      await updateFlatStatus(flat.id, statusValue);
      toast.success(`Flat status updated to ${statusValue}.`);
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCardClick = () => { setSelectedFlatId(flat.id); setIsDetailsDialogOpen(true); };
  const handleFavoriteClick = (e: React.MouseEvent) => { e.stopPropagation(); toast.info("Favorite feature coming soon!"); };
  const handleEditClick = (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/flats/edit/${flat.id}`); };
  const handleDeleteClick = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedFlatId(flat.id); setIsDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (!selectedFlatId) return;
    setIsDeleting(true);
    try {
      await deleteFlat(selectedFlatId);
      toast.success(`Flat deleted successfully.`);
      if (onFlatDeleted) onFlatDeleted(selectedFlatId);
    } catch (error: any) {
      toast.error(error.message || `Failed to delete flat.`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const isStatusLocked = flat.status === 'booked' || flat.status === 'pending';

  return (
    <>
      <motion.div variants={cardVariants}>
        <Card className="w-full h-full flex flex-col overflow-hidden rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group p-0">
          <div className="relative" onClick={handleCardClick}>
            <img src={fullImageUrl} alt={`Thumbnail for flat in ${flat.district}`} className="w-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105" />
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm text-muted-foreground hover:bg-white hover:text-destructive" onClick={handleFavoriteClick}><Heart size={16} /></Button>
            <div className={`absolute bottom-2 left-2 text-xs font-bold text-white px-2 py-1 rounded-full ${flat.status === 'available' ? 'bg-green-600' : 'bg-gray-500'}`}>
              {flat.status.charAt(0).toUpperCase() + flat.status.slice(1)}
            </div>
          </div>

          <CardContent className="p-4 space-y-3 flex-grow flex flex-col" onClick={handleCardClick}>
            <CardTitle className="text-lg font-medium truncate">Flat in {flat.district || 'N/A'}</CardTitle>
            <div className="space-y-2 flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-foreground">{displayRent}<span className="text-sm font-normal text-muted-foreground">/month</span></h3>
                <div className="flex items-center space-x-3 text-muted-foreground pt-1">
                  <span className="flex items-center text-sm"><BedDouble className="mr-1.5 text-primary" size={16} /> {flat.bedrooms ?? 'N/A'}</span>
                  <span className="flex items-center text-sm"><Bath className="mr-1.5 text-primary" size={16} /> {flat.bathrooms ?? 'N/A'}</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm truncate">{flat.address}</p>
            </div>
          </CardContent>

          {showActions && (
            <CardFooter className="p-4 pt-0 border-t">
              <div className="w-full flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`status-switch-${flat.id}`}
                    checked={flat.status === 'available'}
                    onCheckedChange={handleStatusToggle}
                    disabled={isStatusLocked || isUpdatingStatus}
                  />
                  <Label htmlFor={`status-switch-${flat.id}`} className={isStatusLocked ? 'text-muted-foreground/50' : ''}>
                    Available
                  </Label>
                </div>
                <div className="flex space-x-2">
                  <Button variant="secondary" className="transition-colors duration-200 border-2 border-transparent hover:bg-transparent hover:border-primary hover:text-primary" onClick={handleEditClick}>Edit</Button>
                  <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive" onClick={handleDeleteClick} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </motion.div>

      <FlatDetailsDialog flatId={selectedFlatId} isOpen={isDetailsDialogOpen} onClose={() => setIsDetailsDialogOpen(false)} />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogHeaderTitle>Are you absolutely sure?</AlertDialogHeaderTitle><AlertDialogDescription>This will permanently delete your flat listing.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Continue'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FlatCard;