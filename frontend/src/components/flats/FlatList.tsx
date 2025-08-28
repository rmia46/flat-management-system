// frontend/src/components/flats/FlatList.tsx
import React from 'react';
import FlatCard from './FlatCard';
import { motion } from 'framer-motion';

// Interfaces for type safety
interface Image {
  id: number;
  url: string;
  isThumbnail: boolean;
}

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

interface FlatListProps {
  flats: Flat[];
  title: string;
  emptyMessage: string;
  showActions?: boolean;
  onFlatDeleted?: (flatId: number) => void;
  onStatusChange?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const FlatList: React.FC<FlatListProps> = ({ flats, title, emptyMessage, showActions = false, onFlatDeleted, onStatusChange }) => {
  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-foreground mb-8">{title}</h2>
      {flats.length === 0 ? (
        <p className="text-muted-foreground text-center text-xl">{emptyMessage}</p>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {flats.map(flat => (
            <FlatCard
              key={flat.id}
              flat={flat}
              showActions={showActions}
              onFlatDeleted={onFlatDeleted}
              onStatusChange={onStatusChange}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default FlatList;