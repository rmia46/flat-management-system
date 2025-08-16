// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOwnerFlats, getTenantBookings } from '../services/api';
import FlatList from '../components/flats/FlatList';
import FlatDetailsDialog from '../components/flats/FlatDetailsDialog';
import { Link } from 'react-router-dom';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user, refreshTrigger } = useAuth();
  const [ownerFlats, setOwnerFlats] = useState<any[]>([]);
  const [tenantBookings, setTenantBookings] = useState<any[]>([]);
  const [loadingFlats, setLoadingFlats] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const fetchOwnerFlats = useCallback(async () => {
    if (user?.userType !== 'owner') {
      setLoadingFlats(false);
      return;
    }
    try {
      setLoadingFlats(true);
      const response = await getOwnerFlats();
      setOwnerFlats(response.data);
      setLoadingFlats(false);
    } catch (err: any) {
      console.error('Error fetching owner flats:', err);
      toast.error('Failed to load your flats. Please try again.');
      setLoadingFlats(false);
    }
  }, [user]);

  const fetchTenantBookings = useCallback(async () => {
    if (user?.userType !== 'tenant') {
      setLoadingBookings(false);
      return;
    }
    try {
      setLoadingBookings(true);
      const response = await getTenantBookings();
      setTenantBookings(response.data);
      setLoadingBookings(false);
    } catch (err: any) {
      console.error('Error fetching tenant bookings:', err);
      toast.error('Failed to load your bookings. Please try again.');
      setLoadingBookings(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOwnerFlats();
    fetchTenantBookings();
  }, [fetchOwnerFlats, fetchTenantBookings, refreshTrigger]);

  const handleFlatDeleted = useCallback(() => {
    fetchOwnerFlats();
  }, [fetchOwnerFlats]);

  const handleCardClick = (flatId: number, bookingId: number) => {
    setSelectedFlatId(flatId);
    setSelectedBookingId(bookingId);
    setIsDetailsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDetailsDialogOpen(false);
    setSelectedFlatId(null);
    setSelectedBookingId(null);
  };

  if (loadingFlats || loadingBookings) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size={48} className="text-primary" />
      </div>
    );
  }

  return (
    <>
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
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-foreground">Your Booked Flats</h3>
              <Button asChild>
                  <Link to="/flats">+ Book a New Flat</Link>
              </Button>
            </div>
            
            {tenantBookings.length === 0 ? (
                <p className="text-muted-foreground">You haven't booked any flats yet. Find your perfect place today!</p>
            ) : (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenantBookings.map((booking: any) => (
                        <Card 
                            key={booking.id} 
                            className="w-full text-left cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => handleCardClick(booking.flat.id, booking.id)}
                        >
                            <CardHeader>
                                <CardTitle>
                                    Flat at {booking.flat.address}
                                </CardTitle>
                                <CardDescription>
                                    <p>Owned by: {booking.flat.owner.firstName} {booking.flat.owner.lastName}</p>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p><strong>Booking Dates:</strong></p>
                                <p>From: {new Date(booking.startDate).toDateString()}</p>
                                <p>To: {new Date(booking.endDate).toDateString()}</p>
                            </CardContent>
                            <CardFooter>
                                <p>
                                    <strong>Status:</strong>
                                    <span className={`font-semibold ml-2 ${booking.status === 'approved' ? 'text-green-600' : (booking.status === 'disapproved' || booking.status === 'cancelled' ? 'text-red-600' : '')}`}>
                                        {booking.status}
                                    </span>
                                </p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
          </div>
        )}

        {!user && (
             <p className="mt-4 text-muted-foreground text-base">
               Please log in to view your dashboard.
             </p>
        )}
      </CardContent>
    </Card>
    <FlatDetailsDialog
        flatId={selectedFlatId}
        bookingId={selectedBookingId}
        isOpen={isDetailsDialogOpen}
        onClose={handleDialogClose}
    />
    </>
  );
};

export default DashboardPage;
