// frontend/src/components/flats/FlatCard.tsx
import React from 'react';

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
  // --- IMPORTANT: Basic check if flat prop is valid ---
  if (!flat) {
    console.warn("FlatCard received an undefined or null flat prop.");
    return null; // Don't render anything if flat is invalid
  }

  // Handle image display: Try to find thumbnail, otherwise a generic placeholder
  const thumbnailUrl = flat.images?.find(img => img.isThumbnail)?.url || 'https://via.placeholder.com/300x200?text=No+Image';

  // Safely access monthlyRentalCost and ensure it's a number for toLocaleString
  const displayRent = flat.monthlyRentalCost !== null && flat.monthlyRentalCost !== undefined
    ? `BDT ${flat.monthlyRentalCost.toLocaleString()}`
    : 'N/A';

  return (
    <div className="bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-border overflow-hidden transform hover:scale-[1.02]"> 
       
      <div className="w-full h-48 bg-muted overflow-hidden flex items-center justify-center"> 
        {thumbnailUrl === 'https://via.placeholder.com/300x200?text=No+Image' ? (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-lg"> 
            No Image Available
          </div>
        ) : (
          <img src={thumbnailUrl} alt={`Flat ${flat.flatNumber || flat.id}`} className="w-full h-full object-cover" />
        )}
      </div>

      
      <div className="p-5 text-card-foreground"> 
        <h3 className="text-xl font-semibold text-foreground mb-2"> 
          Flat {flat.flatNumber || flat.id} {flat.houseName ? `in ${flat.houseName}` : ''}
        </h3>
        <p className="text-muted-foreground text-sm mb-3">{flat.address}</p> 

        <div className="grid grid-cols-2 gap-2 text-muted-foreground text-sm mb-4"> 
          <p><strong>Rent:</strong> {displayRent}</p>
          <p><strong>Beds:</strong> {flat.bedrooms ?? 'N/A'}</p>
          <p><strong>Baths:</strong> {flat.bathrooms ?? 'N/A'}</p>
          <p><strong>Status:</strong> <span className={`font-medium ${flat.status === 'available' ? 'text-green-600' : 'text-destructive'}`}>{flat.status}</span></p> 
          {flat.rating !== null && flat.rating !== undefined && <p><strong>Rating:</strong> {flat.rating.toFixed(1)}/5</p>}
          {flat.balcony && <p><strong>Balcony:</strong> Yes</p>}
        </div>

        {flat.description && (
          <p className="text-foreground text-base line-clamp-3 mb-4">{flat.description}</p> 
        )}

        
        {flat.amenities && flat.amenities.length > 0 && ( // Check if amenities array exists and has length
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Amenities:</h4> 
            <div className="flex flex-wrap gap-2">
              {flat.amenities.slice(0, 3).map((a, index) => (
                <span key={index} className="bg-secondary text-secondary-foreground py-1 px-3 rounded-full text-xs font-medium"> 
                  {a.amenity.name}
                </span>
              ))}
              {flat.amenities.length > 3 && (
                <span className="bg-muted text-muted-foreground py-1 px-3 rounded-full text-xs font-medium"> {/* Muted background/text for chips */}
                  +{flat.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {showActions && (
          <div className="mt-4 flex justify-end space-x-2">
            <button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 py-2 px-4 rounded-md font-medium transition-colors duration-200 shadow-sm"> 
              Edit
            </button>
            <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 py-2 px-4 rounded-md font-medium transition-colors duration-200 shadow-sm"> 
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlatCard;
