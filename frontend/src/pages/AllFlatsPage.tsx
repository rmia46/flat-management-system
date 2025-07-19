// frontend/src/pages/AllFlatsPage.tsx
import React, { useEffect, useState } from 'react';
import { getAllFlats } from '../services/api';
import FlatList from '../components/flats/FlatList';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // IMPORT SHADCN CARD COMPONENTS

const AllFlatsPage: React.FC = () => {
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFlats = async () => {
      try {
        setLoading(true);
        const response = await getAllFlats();
        setFlats(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching all flats:', err);
        setError('Failed to load flats. Please try again later.');
        setLoading(false);
      }
    };
    fetchFlats();
  }, []);

  if (loading) {
    return <p className="text-muted-foreground text-xl">Loading available flats...</p>;
  }

  if (error) {
    return <p className="text-destructive text-xl">{error}</p>;
  }

  return (
    <Card className="p-8 shadow-lg border border-border w-full max-w-5xl text-card-foreground"> 
      <CardHeader>
        <CardTitle className="text-3xl font-bold mb-4 text-center text-foreground">Available Flats</CardTitle>
      </CardHeader>
      <CardContent>
        <FlatList
          flats={flats}
          title="" // Title is now in CardTitle
          emptyMessage="No flats are currently available. Check back soon!"
        />
      </CardContent>
    </Card>
  );
};

export default AllFlatsPage;

