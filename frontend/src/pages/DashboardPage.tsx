// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOwnerFlats, getTenantBookings, getOwnerBookings } from '../services/api';
import FlatList from '../components/flats/FlatList';
import FlatDetailsDialog from '../components/flats/FlatDetailsDialog';
import ReviewDialog from '../components/reviews/ReviewDialogue';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Home, Bookmark, Building2, BellRing, Star } from 'lucide-react'; // Removed Wrench icon, Switch, and Label imports

const DashboardPage: React.FC = () => {
  const { user, triggerRefresh } = useAuth();
  const [ownerFlats, setOwnerFlats] = useState<any[]>([]);
  const [tenantBookings, setTenantBookings] = useState<any[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewTargetBooking, setReviewTargetBooking] = useState<any | null>(null);

  // Reintroduced devTimeTravel state and set to true by default
  const [devTimeTravel, setDevTimeTravel] = useState(true); 

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.userType === 'owner') {
        const [flatsRes, bookingsRes] = await Promise.all([getOwnerFlats(), getOwnerBookings()]);
        setOwnerFlats(flatsRes.data);
        setOwnerBookings(bookingsRes.data);
      } else if (user.userType === 'tenant') {
        const res = await getTenantBookings();
        setTenantBookings(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, triggerRefresh]);

  const ownerStats = useMemo(() => {
    if (user?.userType !== 'owner') return null;
    return {
      totalListings: ownerFlats.length,
      occupiedFlats: ownerFlats.filter(flat => flat.status === 'booked').length,
      newRequests: ownerBookings.filter(b => b.status === 'pending').length,
    };
  }, [ownerFlats, ownerBookings, user]);

  const tenantStats = useMemo(() => {
    if (user?.userType !== 'tenant') return null;
    return {
      activeBookings: tenantBookings.filter(b => b.status === 'active').length,
      pendingBookings: tenantBookings.filter(b => b.status === 'pending' || b.status === 'approved').length,
    };
  }, [tenantBookings, user]);

  const handleCardClick = (flatId: number, bookingId: number) => {
    setSelectedFlatId(flatId);
    setSelectedBookingId(bookingId);
    setIsDetailsDialogOpen(true);
  };

  const handleReviewClick = (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    setReviewTargetBooking(booking);
    setIsReviewDialogOpen(true);
  };
  
  const handleDetailsDialogClose = () => {
    setIsDetailsDialogOpen(false);
    setSelectedFlatId(null);
    setSelectedBookingId(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <p className="text-lg font-semibold mb-2">Access Denied</p>
        <p>Please log in to view your dashboard.</p>
        <Button asChild className="mt-4">
          <Link to="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-3xl font-bold text-foreground">Welcome Back, {user.firstName}!</h1><p className="text-muted-foreground">Here's your dashboard overview.</p></div>
          {user.userType === 'owner' && (<Button asChild><Link to="/flats/create">+ List a New Flat</Link></Button>)}
        </div>
        {user.userType === 'owner' && ownerStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Building2} title="Total Listings" value={ownerStats.totalListings} />
            <StatCard icon={Home} title="Occupied Flats" value={ownerStats.occupiedFlats} />
            <StatCard icon={BellRing} title="New Requests" value={ownerStats.newRequests} description="View booking requests" link="/dashboard/bookings" />
          </div>
        )}
        {user.userType === 'tenant' && tenantStats && (
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard icon={Home} title="Active Bookings" value={tenantStats.activeBookings} />
            <StatCard icon={Bookmark} title="Pending Bookings" value={tenantStats.pendingBookings} description="Awaiting approval or payment" />
          </div>
        )}

        {/* Developer Tools section is removed from the UI but its effect (devTimeTravel) is active */}

        <Card>
          <CardHeader><CardTitle>{user.userType === 'owner' ? 'Your Listed Flats' : 'Your Bookings'}</CardTitle></CardHeader>
          <CardContent>
            {user.userType === 'owner' && (
              ownerFlats.length > 0 ? (
                <FlatList flats={ownerFlats} title="" emptyMessage="" showActions={true} onFlatDeleted={fetchData} onStatusChange={fetchData}/>
              ) : <p className="text-muted-foreground">You haven't listed any flats yet.</p>
            )}
            {user.userType === 'owner' && ownerBookings.length > 0 && (
                <div className="mt-8 border-t pt-6">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Bookings for Review</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ownerBookings.map((booking: any) => {
                            // isCompleted now uses devTimeTravel to always show review option if devTimeTravel is true
                            const isCompleted = devTimeTravel || booking.status === 'completed'; 
                            const hasReview = booking.reviews?.some((r: any) => r.reviewerId === user.id);

                            if (isCompleted) {
                                return (
                                    <Card key={booking.id} className="cursor-pointer hover:shadow-lg flex flex-col" onClick={() => handleCardClick(booking.flat.id, booking.id)}>
                                        <CardHeader><CardTitle>{booking.flat.address}</CardTitle><CardDescription>Booking with {booking.user.firstName}</CardDescription></CardHeader>
                                        <CardContent className="flex-grow"><p><strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p></CardContent>
                                        <CardFooter>
                                            <Button variant="outline" className="h-8 px-3 rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary w-full" onClick={(e) => handleReviewClick(e, booking)}>
                                                <Star size={14} className="mr-2" /> {hasReview ? 'Edit Your Review' : 'Leave a Review'}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            )}
            
            {user.userType === 'tenant' && (
              tenantBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tenantBookings.map((booking: any) => {
                    // isCompleted now uses devTimeTravel to always show review option if devTimeTravel is true
                    const isCompleted = devTimeTravel || new Date(booking.endDate) < new Date(); 
                    const hasReview = booking.reviews?.some((r: any) => r.reviewerId === user.id);

                    return (
                      <Card key={booking.id} className="cursor-pointer hover:shadow-lg flex flex-col" onClick={() => handleCardClick(booking.flat.id, booking.id)}>
                        <CardHeader><CardTitle>{booking.flat.address}</CardTitle><CardDescription>{isCompleted ? 'Booking Completed' : `Status: ${booking.status}`}</CardDescription></CardHeader>
                        <CardContent className="flex-grow"><p><strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p></CardContent>
                        <CardFooter>
                          {isCompleted && (
                            <Button variant="outline" className="h-8 px-3 rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary w-full" onClick={(e) => handleReviewClick(e, booking)}>
                              <Star size={14} className="mr-2" /> {hasReview ? 'Edit Your Review' : 'Leave a Review'}
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : <p className="text-muted-foreground">You haven't booked any flats yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <FlatDetailsDialog
        flatId={selectedFlatId}
        bookingId={selectedBookingId}
        isOpen={isDetailsDialogOpen}
        onClose={handleDetailsDialogClose}
        onActionComplete={fetchData}
      />
      
      <ReviewDialog
        isOpen={isReviewDialogOpen}
        onClose={() => setIsReviewDialogOpen(false)}
        booking={reviewTargetBooking}
        existingReview={reviewTargetBooking?.reviews?.find((r: any) => r.reviewerId === user.id)}
        onReviewSubmitted={fetchData}
      />
    </>
  );
};

interface StatCardProps { title: string; value: number | string; icon: React.ElementType; description?: string; link?: string; }
const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, link }) => {
  const cardContent = (<CardContent className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6"><div className="space-y-1"><h3 className="text-sm font-medium text-muted-foreground">{title}</h3><p className="text-2xl font-bold">{value}</p>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div><Icon className="h-6 w-6 text-muted-foreground" /></CardContent>);
  return (<Card>{link ? <Link to={link} className="block hover:bg-muted/50 rounded-lg">{cardContent}</Link> : <div className="p-0">{cardContent}</div>}</Card>);
};

export default DashboardPage;
