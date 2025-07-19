// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOwnerFlats } from '../services/api';
import FlatList from '../components/flats/FlatList';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [ownerFlats, setOwnerFlats] = useState<any[]>([]);
  const [loadingFlats, setLoadingFlats] = useState(true);
  const [flatsError, setFlatsError] = useState('');

  useEffect(() => {
    if (user?.userType === 'owner') {
      const fetchOwnerFlats = async () => {
        try {
          setLoadingFlats(true);
          const response = await getOwnerFlats();
          setOwnerFlats(response.data);
          setLoadingFlats(false);
        } catch (err: any) {
          console.error('Error fetching owner flats:', err);
          setFlatsError('Failed to load your flats. Please try again.');
          setLoadingFlats(false);
        }
      };
      fetchOwnerFlats();
    } else {
      setLoadingFlats(false); // Not an owner, so no flats to load
    }
  }, [user]);


  return (
    <div className="text-center p-8 bg-card rounded-lg shadow-md border border-border w-full max-w-5xl text-card-foreground"> 
      <h2 className="text-4xl font-bold mb-4 text-foreground">User Dashboard</h2> 
      {user ? (
        <p className="text-xl text-muted-foreground">Welcome, {user.firstName} ({user.userType})!</p> 
      ) : (
        <p className="text-xl text-muted-foreground">Welcome to your personalized dashboard!</p>
      )}

      <div className="mt-8">
        {user?.userType === 'owner' && (
          <>
            <h3 className="text-2xl font-semibold text-foreground mb-4">Your Listed Flats</h3> 
            <Link to="/flats/create" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-bold py-2 px-6 shadow-sm transition-colors duration-200 transform hover:scale-[1.02]"> 
              + List New Flat
            </Link>

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
              />
            )}
          </>
        )}

        {user?.userType === 'tenant' && (
          <p className="mt-4 text-muted-foreground text-base">
            Welcome to your tenant dashboard. Find your next flat through the navigation bar!
          </p>
        )}

        {!user && (
             <p className="mt-4 text-muted-foreground text-base">
               Please log in to view your dashboard.
             </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
