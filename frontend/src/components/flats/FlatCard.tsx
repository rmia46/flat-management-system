// frontend/src/components/flats/FlatCard.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  balcony: boolean | null;
  description: string | null;
  status: string;
  rating: number | null; // Or Decimal type if you handle it specifically

  images?: Image[]; // Make optional, can be undefined if not included or no images
  amenities?: AmenityItem[]; // Make optional
}

interface FlatCardProps {
  flat: Flat; // Flat is now expected to be of type Flat
  showActions?: boolean; // e.g., for owner's dashboard
}

const FlatCard: React.FC<FlatCardProps> = ({ flat, showActions = false }) => {
  if (!flat) {
    console.warn("FlatCard received an undefined or null flat prop.");
    return null;
  }

  const thumbnailUrl = flat.images?.find(img => img.isThumbnail)?.url || 'https://via.placeholder.com/300x200?text=No+Image';

  const displayRent = flat.monthlyRentalCost !== null && flat.monthlyRentalCost !== undefined
    ? `BDT ${flat.monthlyRentalCost.toLocaleString()}`
    : 'N/A';

  return (
    <Card className="rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex flex-col overflow-hidden"> 
      
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
          Flat {flat.flatNumber || flat.id} {flat.houseName ? `in ${flat.houseName}` : ''}
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
          {flat.balcony && <p><strong>Balcony:</strong> Yes</p>}
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
          <Button variant="secondary">Edit</Button> 
          <Button variant="destructive">Delete</Button> 
        </CardFooter>
      )}
    </Card>
  );
};

export default FlatCard;
