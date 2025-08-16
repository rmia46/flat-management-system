// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOwnerFlats } from '../services/api';
import FlatList from '../components/flats/FlatList';
import { Link } from 'react-router-dom';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button'; // IMPORT SHADCN BUTTON
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // IMPORT SHADCN CARD COMPONENTS

const DashboardPage: React.FC = () => {
  const { user, refreshTrigger } = useAuth();
  const [ownerFlats, setOwnerFlats] = useState<any[]>([]);
  const [loadingFlats, setLoadingFlats] = useState(true);
  // const [flatsError, setFlatsError] = useState('');

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
      // setFlatsError(''); // Clear error on successful fetch
    } catch (err: any) {
      console.error('Error fetching owner flats:', err);
      toast.error('Failed to load your flats. Please try again.'); // <--- USE SONNER
      setLoadingFlats(false);
    }
  }, [user]); // Dependency on user object

  useEffect(() => {
    fetchOwnerFlats(); // Call it when component mounts or user changes
  }, [fetchOwnerFlats, refreshTrigger]);


  const handleFlatDeleted = useCallback(() => { // <-- ADD THIS CALLBACK
    // After a flat is deleted, re-fetch the list of owner flats
    fetchOwnerFlats();
  }, [fetchOwnerFlats]);


  if (loadingFlats) {
    return <p className="text-muted-foreground text-xl">Loading your flats...</p>;
  }


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
            <div className="flex justify-center items-center gap-4 mb-6">
              <Button asChild>
                <Link to="/flats/create">+ List New Flat</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard/bookings">View Booking Requests</Link>
              </Button>
            </div>


            {ownerFlats.length === 0 ? (
              <p className="text-muted-foreground">You haven't listed any flats yet.</p>
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
          <div className="flex justify-center items-center gap-4 mt-4">
            <p className="text-muted-foreground text-base">
              Welcome to your tenant dashboard.
            </p>
            <Button asChild variant="outline">
                <Link to="/dashboard/bookings">View My Bookings</Link>
            </Button>
          </div>
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