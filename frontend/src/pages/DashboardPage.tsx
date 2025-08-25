// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
} from "@/components/ui/card";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Home, Bookmark, Building2, BellRing } from 'lucide-react'; // NEW: Import icons

const DashboardPage: React.FC = () => {
  const { user, triggerRefresh, triggerRefresh: refreshTrigger } = useAuth();
  const [ownerFlats, setOwnerFlats] = useState<any[]>([]);
  const [tenantBookings, setTenantBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.userType === 'owner') {
        const res = await getOwnerFlats();
        setOwnerFlats(res.data);
      } else if (user.userType === 'tenant') {
        const res = await getTenantBookings();
        setTenantBookings(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // --- NEW: Calculate stats from the fetched data ---
  const ownerStats = useMemo(() => {
    if (user?.userType !== 'owner') return null;
    const totalListings = ownerFlats.length;
    const occupiedFlats = ownerFlats.filter(flat => flat.status === 'booked').length;
    // This is a placeholder; a real implementation would fetch pending bookings separately
    const newRequests = ownerFlats.reduce((acc, flat) => acc + (flat.bookings?.filter((b: any) => b.status === 'pending').length || 0), 0);
    return { totalListings, occupiedFlats, newRequests };
  }, [ownerFlats, user]);

  const tenantStats = useMemo(() => {
    if (user?.userType !== 'tenant') return null;
    const activeBookings = tenantBookings.filter(b => b.status === 'active').length;
    const pendingBookings = tenantBookings.filter(b => b.status === 'pending' || b.status === 'approved').length;
    return { activeBookings, pendingBookings };
  }, [tenantBookings, user]);


  const handleCardClick = (flatId: number, bookingId: number) => {
    setSelectedFlatId(flatId);
    setSelectedBookingId(bookingId);
    setIsDetailsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDetailsDialogOpen(false);
    setSelectedFlatId(null);
    setSelectedBookingId(null);
    triggerRefresh();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner size={48} /></div>;
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* --- NEW: Welcome Header --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome Back, {user?.firstName}!</h1>
            <p className="text-muted-foreground">Here's your dashboard overview for today.</p>
          </div>
          {user?.userType === 'owner' && (
            <Button asChild>
              <Link to="/flats/create">+ List a New Flat</Link>
            </Button>
          )}
        </div>

        {/* --- NEW: Stat Cards --- */}
        {user?.userType === 'owner' && ownerStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Building2} title="Total Listings" value={ownerStats.totalListings} />
            <StatCard icon={Home} title="Occupied Flats" value={ownerStats.occupiedFlats} />
            <StatCard icon={BellRing} title="New Requests" value={ownerStats.newRequests} description="View booking requests" link="/dashboard/bookings" />
          </div>
        )}
        {user?.userType === 'tenant' && tenantStats && (
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard icon={Home} title="Active Bookings" value={tenantStats.activeBookings} />
            <StatCard icon={Bookmark} title="Pending Bookings" value={tenantStats.pendingBookings} description="Awaiting approval or payment" />
          </div>
        )}

        {/* --- Main Content Area --- */}
        <Card>
          <CardHeader>
            <CardTitle>{user?.userType === 'owner' ? 'Your Listed Flats' : 'Your Booked Flats'}</CardTitle>
          </CardHeader>
          <CardContent>
            {user?.userType === 'owner' && (
              ownerFlats.length > 0 ? (
                <FlatList flats={ownerFlats} title="" emptyMessage="" showActions={true} onFlatDeleted={fetchData} />
              ) : <p className="text-muted-foreground">You haven't listed any flats yet.</p>
            )}
            {user?.userType === 'tenant' && (
              tenantBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tenantBookings.map((booking: any) => (
                    <Card key={booking.id} className="cursor-pointer hover:shadow-lg" onClick={() => handleCardClick(booking.flat.id, booking.id)}>
                      <CardHeader><CardTitle>{booking.flat.address}</CardTitle></CardHeader>
                      <CardContent>
                        <p><strong>Status:</strong> <span className={`font-semibold ${booking.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{booking.status}</span></p>
                        <p><strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  ))}
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
        onClose={handleDialogClose}
        onActionComplete={fetchData}
      />
    </>
  );
};

// --- NEW: Reusable Stat Card Component ---
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, link }) => {
  const cardContent = (
    <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Icon className="h-6 w-6 text-muted-foreground" />
    </CardContent>
  );

  return (
    <Card>
      {link ? <Link to={link} className="block hover:bg-muted/50">{cardContent}</Link> : cardContent}
    </Card>
  );
};

export default DashboardPage;