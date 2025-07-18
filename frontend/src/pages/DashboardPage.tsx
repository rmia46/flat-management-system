// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOwnerFlats } from '../services/api';
import FlatList from '../components/flats/FlatList';
import { Link } from 'react-router-dom'; // <--- Make sure this is imported

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
    <div className="text-center p-8 bg-surface-card rounded-4xl shadow-lg border border-border-subtle w-full max-w-5xl">
      <h2 className="text-4xl font-bold mb-4 text-text-primary">User Dashboard</h2>
      {user ? (
        <p className="text-xl text-text-secondary">Welcome, {user.firstName} ({user.userType})!</p>
      ) : (
        <p className="text-xl text-text-secondary">Welcome to your personalized dashboard!</p>
      )}

      <div className="mt-8">
        {user?.userType === 'owner' && (
          <>
            <h3 className="text-2xl font-semibold text-text-primary mb-4">Your Listed Flats</h3>
            {/* Button to add new flat */}
            <Link to="/flats/create" className="bg-primary-accent hover:bg-accent-hover text-white rounded-3xl font-bold py-2 px-6 shadow-md hover:shadow-lg transition duration-200 transform hover:scale-105 mb-6 inline-block">
              + List New Flat
            </Link>

            {loadingFlats ? (
              <p className="text-text-secondary">Loading your flats...</p>
            ) : flatsError ? (
              <p className="text-red-600">{flatsError}</p>
            ) : (
              <FlatList
                flats={ownerFlats}
                title="" // Title already handled by h3 above
                emptyMessage="You haven't listed any flats yet."
                showActions={true} // Show Edit/Delete buttons on owner's cards
              />
            )}
          </>
        )}

        {user?.userType === 'tenant' && (
          <p className="mt-4 text-text-secondary text-base">
            As a tenant, you can browse all available flats.
            <Link to="/flats" className="text-primary-accent hover:underline ml-2">Browse Flats</Link>
          </p>
        )}

        {!user && ( // If user is null (shouldn't happen on DashboardPage due to PrivateRoute)
             <p className="mt-4 text-text-secondary text-base">
               Please log in to view your dashboard.
             </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
