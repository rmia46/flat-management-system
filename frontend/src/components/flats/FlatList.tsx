// frontend/src/components/flats/FlatList.tsx
import React from 'react';
import FlatCard from './FlatCard';
import { motion } from 'framer-motion'; // NEW: Import motion

interface FlatListProps {
  flats: any[];
  title: string;
  emptyMessage: string;
  showActions?: boolean;
  onFlatDeleted?: (flatId: number) => void;
}

// NEW: Animation variants for the container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // This will make each card animate in sequence
    },
  },
};

const FlatList: React.FC<FlatListProps> = ({ flats, title, emptyMessage, showActions = false, onFlatDeleted }) => {
  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-foreground mb-8">{title}</h2>
      {flats.length === 0 ? (
        <p className="text-muted-foreground text-center text-xl">{emptyMessage}</p>
      ) : (
        // NEW: Grid is now a motion.div for animation
       <motion.div
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" // Reverted to make cards wider
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {flats.map(flat => (
    <FlatCard key={flat.id} flat={flat} showActions={showActions} onFlatDeleted={onFlatDeleted} />
  ))}
</motion.div>
      )}
    </div>
  );
};

export default FlatList;