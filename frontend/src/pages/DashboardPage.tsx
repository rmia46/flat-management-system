// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOwnerFlats } from '../services/api';
import FlatList from '../components/flats/FlatList';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button'; // IMPORT SHADCN BUTTON
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // IMPORT SHADCN CARD COMPONENTS

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [ownerFlats, setOwnerFlats] = useState<any[]>([]);
  const [loadingFlats, setLoadingFlats] = useState(true);
  const [flatsError, setFlatsError] = useState('');

  // Use useCallback to memoize the fetch function to avoid re-creating it
  const fetchOwnerFlats = useCallback(async () => { // <-- WRAP IN useCallback
    if (user?.userType !== 'owner') {
      setLoadingFlats(false);
      return;
    }

    try {
      setLoadingFlats(true);
      const response = await getOwnerFlats();
      setOwnerFlats(response.data);
      setLoadingFlats(false);
      setFlatsError(''); // Clear error on successful fetch
    } catch (err: any) {
      console.error('Error fetching owner flats:', err);
      setFlatsError('Failed to load your flats. Please try again.');
      setLoadingFlats(false);
    }
  }, [user]); // Dependency on user object

  useEffect(() => {
    fetchOwnerFlats(); // Call it when component mounts or user changes
  }, [fetchOwnerFlats]); 

  const handleFlatDeleted = useCallback(() => { // <-- ADD THIS CALLBACK
    // After a flat is deleted, re-fetch the list of owner flats
    fetchOwnerFlats();
  }, [fetchOwnerFlats]);


  return (
    <Card className="text-center p-8 shadow-lg border border-border w-full max-w-5xl text-card-foreground"> 
      <CardHeader>
        <CardTitle className="text-4xl font-bold mb-4 text-foreground">User Dashboard</CardTitle> 
        {user ? (
          <CardDescription className="text-xl text-muted-foreground">Welcome, {user.firstName} ({user.userType})!</CardDescription> 
        ) : (
          <CardDescription className="text-xl text-muted-foreground">Welcome to your personalized dashboard!</CardDescription>
        )}
      </CardHeader>

      <CardContent>
        {user?.userType === 'owner' && (
          <>
            
            <h3 className="text-2xl font-semibold text-foreground mb-4">Your Listed Flats</h3> 
            <Button asChild className="mb-6 inline-block"> 
              <Link to="/flats/create">+ List New Flat</Link>
            </Button>
            <Button asChild className="mb-6 inline-block">
            <Link to="/dashboard/bookings">Bookings</Link>
            </Button>
            {loadingFlats ? (
              <p className="text-muted-foreground">Loading your flats...</p>
            ) : flatsError ? (
              <p className="text-destructive">{flatsError}</p> 
            ) : (
              <FlatList
                flats={ownerFlats}
                title=""
                emptyMessage="You haven't listed any flats yet."
                showActions={true}
                onFlatDeleted={handleFlatDeleted}
              />
            )}
          </>
        )}

        {user?.userType === 'tenant' && (
        <>
        <p className="mt-4 text-muted-foreground text-base">
            Welcome to your tenant dashboard. Find your next flat through the navigation bar!
          </p>
        <Button asChild className="mb-6 inline-block">
            <Link to="/dashboard/bookings">Bookings</Link>
            </Button>
        </>
          
        )}
        {!user && (
             <p className="mt-4 text-muted-foreground text-base">
               Please log in to view your dashboard.
             </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardPage;
