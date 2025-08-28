// frontend/src/pages/BookingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getOwnerBookings, getTenantBookings
} from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FlatDetailsDialog from '../components/flats/FlatDetailsDialog';

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  flat: {
    id: number;
    address: string;
    owner: {
      firstName: string;
      lastName: string;
    };
  };
  user: {
    firstName: string;
    lastName: string;
  };
}

const BookingsPage: React.FC = () => {
  const { isAuthenticated, user, triggerRefresh } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const fetchBookings = async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    setLoading(true);
    try {
      let response;
      if (user.userType === 'owner') {
        response = await getOwnerBookings();
      } else if (user.userType === 'tenant') {
        response = await getTenantBookings();
      }
      if (response) {
        // **FIXED**: Access the bookings array from response.data.data.bookings
        setBookings(response.data.data.bookings);
      }
    } catch (err: any) {
      console.error("Failed to fetch bookings:", err);
      setError('Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else {
      fetchBookings();
    }
  }, [isAuthenticated, navigate, user, triggerRefresh]);

  const handleCardClick = (flatId: number, bookingId: number) => {
    setSelectedFlatId(flatId);
    setSelectedBookingId(bookingId);
    setIsDetailsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDetailsDialogOpen(false);
    setSelectedFlatId(null);
    setSelectedBookingId(null);
    fetchBookings(); 
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <h2 className="text-3xl font-bold text-foreground text-center mb-6">Your Bookings</h2>
      {loading ? (
        <p>Loading bookings...</p>
      ) : error ? (
        <p className="text-destructive text-center">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="w-full text-left cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick(booking.flat.id, booking.id)}
            >
              <CardHeader>
                <CardTitle>
                  {user?.userType === 'owner' ?
                    `Request for Flat at ${booking.flat.address}` :
                    `Booking at ${booking.flat.address}`}
                </CardTitle>
                <CardDescription>
                  From: {new Date(booking.startDate).toDateString()} to {new Date(booking.endDate).toDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Status:</strong>
                  <span className={`font-semibold ml-2 ${booking.status === 'active' ? 'text-green-600' : (booking.status === 'disapproved' || booking.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600')}`}>
                    {booking.status}
                  </span>
                </p>
                {user?.userType === 'owner' ? (
                  <p><strong>Tenant:</strong> {booking.user.firstName} {booking.user.lastName}</p>
                ) : (
                  <p><strong>Owner:</strong> {booking.flat.owner.firstName} {booking.flat.owner.lastName}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <FlatDetailsDialog
        flatId={selectedFlatId}
        bookingId={selectedBookingId}
        isOpen={isDetailsDialogOpen}
        onClose={handleDialogClose}
        onActionComplete={fetchBookings}
      />
    </div>
  );
};

export default BookingsPage;