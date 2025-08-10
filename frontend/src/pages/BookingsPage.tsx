// frontend/src/pages/BookingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getOwnerBookings, getTenantBookings, approveBooking, disapproveBooking
} from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner'; // <--- IMPORT SONNER TOAST

const BookingsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    if (!isAuthenticated || !user) {
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
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else {
      fetchBookings();
    }
  }, [isAuthenticated, navigate, user]);

  const handleAction = async (bookingId: number, action: 'approve' | 'disapprove') => {
    try {
      if (action === 'approve') {
        await approveBooking(bookingId);
        toast.success('Booking approved successfully!'); // <--- USE SONNER
      } else {
        await disapproveBooking(bookingId);
        toast.info('Booking disapproved.'); // <--- USE SONNER
      }
      fetchBookings(); // Re-fetch the list to update the UI
    } catch (err: any) {
      console.error(`Failed to ${action} booking:`, err);
      const message = err.response?.data?.message || 'Failed to perform action.';
      toast.error(message); // <--- USE SONNER
    }
  };

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
    <div className="w-full max-w-5xl space-y-4">
      <h2 className="text-3xl font-bold text-foreground text-center mb-6">Your Bookings</h2>
      {bookings.map((booking) => (
        <Card key={booking.id} className="w-full">
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
          <CardContent className="space-y-2">
            <p>
              <strong>Status:</strong>
              <span className={`font-semibold ml-2 ${booking.status === 'approved' ? 'text-green-600' : ''}`}>
                {booking.status}
              </span>
            </p>
            {user?.userType === 'owner' ? (
              <p><strong>Tenant:</strong> {booking.user.firstName} {booking.user.lastName} ({booking.user.email})</p>
            ) : (
              <p><strong>Owner:</strong> {booking.flat.owner.firstName} {booking.flat.owner.lastName}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            {user?.userType === 'owner' && booking.status === 'pending' && (
              <>
                <Button onClick={() => handleAction(booking.id, 'approve')} variant="default">Approve</Button>
                <Button onClick={() => handleAction(booking.id, 'disapprove')} variant="destructive">Disapprove</Button>
              </>
            )}
            {user?.userType === 'tenant' && booking.status === 'pending' && (
              <Button onClick={() => { /* cancel booking logic here */ }} variant="destructive">Cancel Request</Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default BookingsPage;