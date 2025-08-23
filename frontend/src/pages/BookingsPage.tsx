// frontend/src/pages/BookingsPage.tsx (CORRECTED)
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getOwnerBookings, getTenantBookings
} from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import FlatDetailsDialog from '../components/flats/FlatDetailsDialog';

const BookingsPage: React.FC = () => {
  const { isAuthenticated, user, refreshTrigger } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let response;
      if (user.userType === 'owner') {
        response = await getOwnerBookings();
      } else if (user.userType === 'tenant') {
        response = await getTenantBookings();
      }
      if (response) {
        setBookings(response.data);
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Failed to fetch bookings:", err);
      setError('Failed to load your bookings.');
      setLoading(false);
    }
  }, [isAuthenticated, user]);


  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else {
      fetchBookings();
    }
  }, [isAuthenticated, navigate, user, refreshTrigger, fetchBookings]);

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
  
  // NEW: Callback to refresh bookings after an action
  const handleActionComplete = useCallback(() => {
    fetchBookings();
    handleDialogClose();
  }, [fetchBookings]);

  if (loading) {
    return <p className="text-muted-foreground text-xl text-center">Loading booking requests...</p>;
  }

  if (error) {
    return <p className="text-destructive text-xl text-center">{error}</p>;
  }

  if (bookings.length === 0) {
    return <p className="text-muted-foreground text-xl text-center">No booking requests found.</p>;
  }


  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <h2 className="text-3xl font-bold text-foreground text-center mb-6">Your Bookings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map((booking) => (
          <Card
            key={booking.id}
            className="w-full text-left cursor-pointer hover:shadow-lg transition-shadow flex flex-col"
            onClick={() => handleCardClick(booking.flat.id, booking.id)}
          >
            <CardHeader>
              <CardTitle>
                {user?.userType === 'owner' ?
                  `Request for Flat ${booking.flat.houseName || booking.flat.address}` :
                  `Booking at Flat ${booking.flat.houseName || booking.flat.address}`}
              </CardTitle>
              <CardDescription>
                From: {new Date(booking.startDate).toDateString()} to {new Date(booking.endDate).toDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow">
              <p>
                <strong>Status:</strong>
                <span className={`font-semibold ml-2 ${booking.status === 'approved' ? 'text-green-600' : (booking.status === 'disapproved' || booking.status === 'cancelled' ? 'text-red-600' : '')}`}>
                  {booking.status}
                </span>
              </p>
              {user?.userType === 'owner' ? (
                <p><strong>Tenant:</strong> {booking.user.firstName} {booking.user.lastName} ({booking.user.email})</p>
              ) : (
                <p><strong>Owner:</strong> {booking.flat.owner.firstName} {booking.flat.owner.lastName}</p>
              )}
            </CardContent>
            {/* Action buttons are now handled by the dialog on click */}
          </Card>
        ))}
      </div>
      <FlatDetailsDialog
        flatId={selectedFlatId}
        bookingId={selectedBookingId}
        isOpen={isDetailsDialogOpen}
        onClose={handleDialogClose}
        onActionComplete={handleActionComplete} // NEW: Pass the refresh callback
      />
    </div>
  );
};

export default BookingsPage;