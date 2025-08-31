// frontend/src/components/flats/FlatCardSkeleton.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FlatCardSkeleton: React.FC = () => {
  return (
    <Card className="w-full h-full flex flex-col overflow-hidden rounded-lg border p-0">
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-square" />
      
      {/* Content Skeleton */}
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-10 rounded-lg" />
              <Skeleton className="h-4 w-10 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-4 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
};

export default FlatCardSkeleton;