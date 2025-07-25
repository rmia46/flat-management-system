// frontend/src/components/flats/FlatList.tsx
import React from 'react';
import FlatCard from './FlatCard'; // Assuming FlatCard is in the same directory

interface FlatListProps {
  flats: any[]; // Use 'any[]' for now, can define a more specific Flat[] type later
  title: string;
  emptyMessage: string;
  showActions?: boolean; // Pass down to FlatCard if actions are needed
  onFlatDeleted?: (flatId: number) => void;
}

const FlatList: React.FC<FlatListProps> = ({ flats, title, emptyMessage, showActions = false, onFlatDeleted }) => {
  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-foreground mb-8">{title}</h2> 
      {flats.length === 0 ? (
        <p className="text-muted-foreground text-center text-xl">{emptyMessage}</p> 
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flats.map(flat => (
            <FlatCard key={flat.id} flat={flat} showActions={showActions} onFlatDeleted={onFlatDeleted}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlatList;
